import axios, { AxiosHeaders, AxiosResponse } from "axios";
import * as d3 from "d3-array";
import { InternMap } from "d3-array";
import { StatusCodes } from "http-status-codes";

import { retryableAxios } from "@/lib/axios";
import { dynamoDbDocClient } from "@/lib/dynamodb";
import { GeoCodeData } from "@/lib/geocode";
import { Logger } from "@/lib/logger";
import { PutCommandOutput } from "@aws-sdk/lib-dynamodb";
import type { DeepReadonly } from "ts-essentials";

import {
  CurrentMeasurement,
  DailyMeasurement,
  HourlyMeasurement,
  Units,
  Weather,
  WeatherServiceError,
  convertMetricCurrentToImperialMeasurement,
  convertMetricDailyToImperialMeasurement,
  convertMetricHourlyToImperialMeasurement,
} from "@/lib/weather";
import {
  Configuration,
  DataApiFactory,
  ForecastTimeStep,
  METJSONForecast,
} from "@internal/met.no";

import { convertCurrent, convertDaily } from "./convert";

const { NOT_MODIFIED } = StatusCodes;

export interface CacheEntry {
  rawWeather: METJSONForecast;
  ttl: number;
  lastModified?: string;
}

function entryIsExpired(entry: CacheEntry): boolean {
  const ttl = new Date(entry.ttl * 1000);

  return ttl < new Date();
}

export class MetnoInvalidDataError extends WeatherServiceError {
  constructor(message: string) {
    super(`Invalid data from met.no: ${message}`);
    this.name = "MetnoInvalidDataError";
  }
}

export class MetNoMissingPropertyError extends MetnoInvalidDataError {
  constructor(public readonly property: string | string[]) {
    super(`Missing \`${property}\` data`);
  }
}

export class MetnoError extends WeatherServiceError {
  constructor(message: string) {
    super(message);
    this.name = "MetnoError";
  }
}

export class MetnoClient {
  private static TableName = process.env["WEATHER_TABLE_NAME"];
  private static BaseUrl = "https://api.met.no/weatherapi/locationforecast/2.0";

  private readonly metno;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.createChild({
      persistentLogAttributes: {
        module: "MetnoClient",
      },
    });

    this.metno = DataApiFactory(
      new Configuration({
        basePath: MetnoClient.BaseUrl,
      }),
      undefined,
      retryableAxios(this.logger),
    );
  }

  private cacheKey({ latitude, longitude }: GeoCodeData, units: Units): string {
    return `metno#${latitude}#${longitude}#${units}`;
  }

  private async setCache(
    weatherHash: string,
    response: AxiosResponse<METJSONForecast>,
  ): Promise<PutCommandOutput> {
    let ttl = Math.floor(Date.now() / 1000) + 30 * 60;

    const rawWeather = response.data;

    let lastModified = undefined;

    if (response.headers instanceof AxiosHeaders) {
      if (response.headers.has("expires")) {
        const expires = new Date(response.headers.get("expires") as string);
        if (!isNaN(expires.getTime())) {
          // Add half an hour, so we have a chance to refresh before it expires
          ttl = Math.floor(expires.getTime() / 1000) + 30 * 60;
        }
      }

      if (response.headers.has("last-modified")) {
        lastModified = response.headers.get("last-modified") as string;
      }
    }

    const params = {
      TableName: MetnoClient.TableName,
      Item: {
        weatherHash,
        rawWeather,
        ...(lastModified ? { lastModified } : {}),
        ttl,
      },
    };

    return dynamoDbDocClient.put(params);
  }

  private async getCache(weatherHash: string): Promise<CacheEntry | null> {
    const params = {
      TableName: MetnoClient.TableName,
      Key: { weatherHash },
      // ttl is a reserved word in DynamoDB
      ExpressionAttributeNames: {
        "#ttl": "ttl",
      },
      ProjectionExpression: "rawWeather, expires, lastModified, #ttl",
    };

    const data = await dynamoDbDocClient.get(params);

    return (data.Item as CacheEntry | undefined) ?? null;
  }

  private buildMetricWeather(weather: DeepReadonly<METJSONForecast>): {
    now: CurrentMeasurement<"metric">;
    hourly: InternMap<Date, HourlyMeasurement<"metric">[]>;
    daily: DailyMeasurement<"metric">[];
  } {
    let ts = weather.properties.timeseries;

    const current = ts[0];
    if (current === undefined) {
      throw new MetnoInvalidDataError("Missing current weather data");
    }

    ts = ts.slice(1);

    const now = convertCurrent(current);
    const nowDay = new Date(now.time);
    nowDay.setUTCHours(0, 0, 0, 0);
    const nowDayStr = nowDay.toISOString();

    // Drop the last one; this has no `next_` data
    const last = ts[ts.length - 1];
    if (last === undefined) {
      throw new MetnoInvalidDataError(
        "Not enough forecast data present in response",
      );
    }
    ts = ts.slice(0, -1);

    // `group` produces an InternMap, which lets us have a map with Date keys.
    // That doesn't work with plain JS.
    const grouped: InternMap<Date, ForecastTimeStep[]> = d3.group(
      ts,
      (step) => {
        const date = new Date(step.time);
        date.setUTCHours(0, 0, 0, 0);

        return date;
      },
    );

    const iterator = grouped.entries();

    // Sort the grouped days into "hourly" and "daily".

    // Hourly always includes today, and after that every other day that has 24
    // hours of data.
    const hourly = new InternMap<Date, HourlyMeasurement<"metric">[]>();
    let dailyIterator = iterator;
    for (const [day, steps] of iterator) {
      if (day.toISOString() !== nowDayStr && steps.length !== 24) {
        dailyIterator = (function* () {
          yield [day, steps];
          yield* iterator;
        })();

        break;
      }

      hourly.set(day, steps.map(convertCurrent));
    }

    // The rest is "daily", and we summarise the data for each day.
    const daily: DailyMeasurement<"metric">[] = [];
    for (const [day, steps] of dailyIterator) {
      daily.push(convertDaily(day, steps));
    }

    return { now, hourly, daily };
  }

  public async getWeather(
    unit: Units,
    location: GeoCodeData,
  ): Promise<Weather<typeof unit>> {
    const rawWeather = await this.getRawWeather(location);

    const { now, hourly, daily } = this.buildMetricWeather(rawWeather);

    switch (unit) {
      case "metric":
        return new Weather(location, now, hourly, daily);
      case "imperial":
        return new Weather(
          location,
          convertMetricCurrentToImperialMeasurement(now),
          new InternMap(
            Array.from(hourly, ([date, hours]) => [
              date,
              hours.map((h) => ({
                ...h,
                ...convertMetricHourlyToImperialMeasurement(h),
              })),
            ]),
          ),
          daily.map((d) => {
            return {
              ...d,
              ...convertMetricDailyToImperialMeasurement(d),
            };
          }),
        );
    }
  }

  // We use `DeepReadonly` to prevent us modifying the data in
  // `buildMetricWeather`. This doesn't matter at runtime, but it helps for the
  // tests where we have an in-memory database which stores a reference to the
  // object we return here.
  public async getRawWeather(
    location: GeoCodeData,
  ): Promise<DeepReadonly<METJSONForecast>> {
    const logger = this.logger.createChild({
      persistentLogAttributes: {
        location: `${location.latitude},${location.longitude}`,
      },
    });

    const cacheKey = this.cacheKey(location, "metric");
    const cached = await this.getCache(cacheKey);

    if (cached !== null && !entryIsExpired(cached)) {
      logger.debug("Found in cache");
      return cached.rawWeather;
    }

    logger.debug(
      `${cached === null ? "Not found in cache" : "Found in cache, but expired"}, will fetch from API`,
    );

    try {
      const weather = await this.metno.completeGet(
        location.latitude,
        location.longitude,
        undefined,
        {
          headers: {
            "If-Modified-Since": cached?.lastModified ?? "",
          },
        },
      );

      // If it's NOT_MODIFIED, we can use the cached data (the response won't
      // have a body)
      if (cached !== null && weather.status === NOT_MODIFIED) {
        logger.debug("Not modified, using cached data");
        weather.data = cached.rawWeather;
      }

      logger.debug("Fetched from API, saving to cache");

      await this.setCache(cacheKey, weather);

      return Object.freeze(weather.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw new MetnoError(err.message);
      }

      throw err;
    }
  }
}

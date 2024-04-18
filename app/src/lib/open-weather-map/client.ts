import axios, { AxiosInstance } from "axios";

import { retryableAxios } from "@/lib/axios";
import { dynamoDbDocClient } from "@/lib/dynamodb";
import { GeoCodeData } from "@/lib/geocode";
import type { Logger } from "@/lib/logger";
import {
  DailyMeasurement as DM,
  DegreesCelsius,
  HourlyMeasurement as HM,
  InvalidWindDirectionError,
  Measurement,
  SingleTemp,
  Units,
  Weather,
  WeatherServiceError,
  WindSpeedMetresPerSecond,
  convertMetricCurrentToImperialMeasurement,
  convertMetricDailyToImperialMeasurement,
  convertMetricHourlyToImperialMeasurement,
  getWindDirection,
  isDegree,
} from "@/lib/weather";
import { PutCommandOutput } from "@aws-sdk/lib-dynamodb";

import { WeatherConditions } from ".";

interface RawDayTemp {
  temp: {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
  };
  feels_like: {
    day: number;
    night: number;
    eve: number;
    morn: number;
  };
}

interface RawSingleTemp {
  // temperature, in Celsius
  temp: number;
  // temperature, in Celsius, adjusted for human perception
  feels_like: number;
}

// "raw" interfaces represent the data as it is returned from the API
interface BaseRawMeasurement {
  // date and time of measurement, in unix, UTC
  dt: number;
  // pressure, in hPa
  pressure: number;
  // humidity, in %
  humidity: number;
  // cloudiness, in %
  clouds: number;
  // wind speed, in metres per second
  wind_speed: number;
  // wind direction, in degrees
  wind_deg: number;
  // wind gust, in metres per second
  wind_gust: number;
  weather: {
    // id corresponding to a weather condition - defined in WeatherConditions
    id: number;
  }[];
}

// the hourly measurements do not include sunrise and sunset
interface RawSun {
  // date and time of sunrise, in unix, UTC
  sunrise: number;
  // date and time of sunset, in unix, UTC
  sunset: number;
}

interface RawVisibility {
  // visibility, in metres
  visibility: number;
}

type RawMeasurementCurrent = BaseRawMeasurement &
  RawSingleTemp &
  RawVisibility &
  RawSun;
type RawMeasurementHourly = BaseRawMeasurement & RawSingleTemp & RawVisibility;
type RawMeasurermentDaily = BaseRawMeasurement & RawDayTemp & RawSun;

export interface rawWeatherResponse {
  lat: number;
  lon: number;
  current: RawMeasurementCurrent;
  hourly: RawMeasurementHourly[];
  daily: RawMeasurermentDaily[];
}

// ... non-raw interfaces represent the data in a more usable format for the
// rest of the application

export interface Sun {
  sunrise: Date;
  sunset: Date;
}

export interface Visibility {
  visibility: number;
}

export type CurrentMeasurement<U extends Units> = Measurement<U> &
  SingleTemp<U> &
  Sun &
  Visibility;

export type HourlyMeasurement<U extends Units> = HM<U> & Visibility;

export type DailyMeasurement<U extends Units> = DM<U> & Sun;

function convertRawToMetricMeasurement(
  raw: BaseRawMeasurement,
): Measurement<"metric"> {
  const windSpeed = raw.wind_speed;
  const windGusts = raw.wind_gust;

  if (!isDegree(raw.wind_deg)) {
    throw new InvalidWindDirectionError(raw.wind_deg);
  }

  return {
    time: new Date(raw.dt * 1000),
    pressure: raw.pressure,
    humidity: raw.humidity,
    clouds: raw.clouds,
    wind: new WindSpeedMetresPerSecond(
      windSpeed,
      windGusts,
      getWindDirection(raw.wind_deg),
    ),
    weather: raw.weather.map((w) => WeatherConditions[w.id]),
  };
}

function convertRawSingleToTemperature(
  raw: RawSingleTemp,
): SingleTemp<"metric"> {
  return {
    temp: new DegreesCelsius(raw.temp),
  };
}

function mapNumberObjectToDegreesCelsius<T extends { [key: string]: number }>(
  obj: T,
): { [key in keyof T]: DegreesCelsius } {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, new DegreesCelsius(value)]),
  ) as { [key in keyof T]: DegreesCelsius };
}

function convertRawDayTempToDailyTemperature(raw: RawDayTemp) {
  return {
    temp: mapNumberObjectToDegreesCelsius(raw.temp),
    feels_like: mapNumberObjectToDegreesCelsius(raw.feels_like),
  };
}

function convertRawToSun(raw: RawSun): Sun {
  return {
    sunrise: new Date(raw.sunrise * 1000),
    sunset: new Date(raw.sunset * 1000),
  };
}

// TODO: This needs to have a metric/imperial conversion
function convertRawToVisibility(raw: RawVisibility): Visibility {
  return {
    visibility: raw.visibility,
  };
}

function convertDaily(raw: RawMeasurermentDaily): DailyMeasurement<"metric"> {
  return {
    ...convertRawToMetricMeasurement(raw),
    ...convertRawDayTempToDailyTemperature(raw),
    ...convertRawToSun(raw),
  };
}

function convertHourly(raw: RawMeasurementHourly): HourlyMeasurement<"metric"> {
  return {
    ...convertRawToMetricMeasurement(raw),
    ...convertRawSingleToTemperature(raw),
    ...convertRawToVisibility(raw),
  };
}

function convertCurrent(
  raw: RawMeasurementCurrent,
): CurrentMeasurement<"metric"> {
  return {
    ...convertRawToMetricMeasurement(raw),
    ...convertRawSingleToTemperature(raw),
    ...convertRawToVisibility(raw),
    ...convertRawToSun(raw),
  };
}

export class OpenWeatherMapError extends WeatherServiceError {
  constructor(message: string) {
    super(`Failed to fetch weather data: ${message}`);
    this.name = "OpenWeatherMapError";
  }
}

export class OpenWeatherMapClient {
  private static TableName = process.env["WEATHER_TABLE_NAME"];

  private apiKey: string;
  private baseUrl = "https://api.openweathermap.org/data/3.0/onecall";
  private axios: AxiosInstance;
  private logger: Logger;

  constructor(apiKey: string, logger: Logger) {
    this.apiKey = apiKey;
    this.logger = logger.createChild({
      persistentLogAttributes: {
        module: "OpenWeatherMapClient",
      },
    });

    this.axios = retryableAxios(this.logger);
  }

  private cacheKey({ latitude, longitude }: GeoCodeData, units: Units): string {
    return `openWeatherMap#${latitude}#${longitude}#${units}`;
  }

  private async setCache(
    weatherHash: string,
    rawWeather: rawWeatherResponse,
  ): Promise<PutCommandOutput> {
    const ttl = Math.floor(Date.now() / 1000) + 30 * 60;

    const params = {
      TableName: OpenWeatherMapClient.TableName,
      Item: { weatherHash, rawWeather, ttl },
    };

    return dynamoDbDocClient.put(params);
  }

  private async getCache(
    weatherHash: string,
  ): Promise<rawWeatherResponse | null> {
    const params = {
      TableName: OpenWeatherMapClient.TableName,
      Key: { weatherHash },
      ProjectionExpression: "rawWeather",
    };

    const data = await dynamoDbDocClient.get(params);

    return (
      (data.Item?.["rawWeather"] as rawWeatherResponse | undefined) ?? null
    );
  }

  protected async fetchWeatherData(url: string): Promise<rawWeatherResponse> {
    const response = await this.axios.get<rawWeatherResponse>(url);
    return response.data;
  }

  public async getWeather(
    unit: Units,
    location: GeoCodeData,
  ): Promise<Weather<typeof unit>> {
    const rawWeather = await this.getRawWeather(location);

    const now = convertCurrent(rawWeather.current);
    const hourly = rawWeather.hourly.map(convertHourly);
    const daily = rawWeather.daily.map(convertDaily);

    switch (unit) {
      case "metric":
        return new Weather(location, now, hourly, daily);
      case "imperial": {
        return new Weather(
          location,
          convertMetricCurrentToImperialMeasurement(now),
          hourly.map((h) => {
            return {
              ...h,
              ...convertMetricHourlyToImperialMeasurement(h),
            };
          }),
          daily.map((d) => {
            return {
              ...d,
              ...convertMetricDailyToImperialMeasurement(d),
            };
          }),
        );
      }
    }
  }

  private async getRawWeather(
    location: GeoCodeData,
  ): Promise<rawWeatherResponse> {
    const { latitude, longitude } = location;

    const logger = this.logger.createChild({
      persistentLogAttributes: {
        location: `${latitude},${longitude}`,
      },
    });

    logger.debug("Fetching weather data");

    const cacheKey = this.cacheKey(location, "metric");
    const cached = await this.getCache(cacheKey);

    if (cached !== null) {
      logger.debug("Found in cache");
      return cached;
    }

    logger.debug("Not found in cache, will fetch from API");

    const url = new URL(this.baseUrl);
    url.searchParams.append("lat", latitude.toString());
    url.searchParams.append("lon", longitude.toString());
    url.searchParams.append("appid", this.apiKey);
    url.searchParams.append("units", "metric");

    try {
      const data = await this.fetchWeatherData(url.toString());

      logger.debug("Fetched from API, saving to cache");

      await this.setCache(cacheKey, data);

      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw new OpenWeatherMapError(err.message);
      }

      throw err;
    }
  }
}

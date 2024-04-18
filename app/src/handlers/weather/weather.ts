import { BadRequest, UnprocessableContent } from "@curveball/http-errors";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

import { GeoCodeContext } from "@/lib/geocode";
import {
  geoCodeHandlerFactory,
  reverseGeocodeHandlerFactory,
} from "@/lib/handler-factory";
import { Logger, LoggerContext } from "@/lib/logger";
import { OpenWeatherMapClient } from "@/lib/open-weather-map";
import { MetnoClient } from "@/lib/metno";
import {
  Units,
  Weather,
  isUnits,
  WeatherService,
  WeatherServiceError,
} from "@/lib/weather";

function createOpenWeatherMapClient(logger: Logger): OpenWeatherMapClient {
  const apiKey = process.env["OPENWEATHERMAP_API_KEY"];

  if (apiKey === undefined) {
    throw new Error("OPENWEATHERMAP_API_KEY is not set");
  }

  return new OpenWeatherMapClient(
    apiKey,
    logger.createChild({
      persistentLogAttributes: {
        service: "openweathermap",
      },
    }),
  );
}

function createMetNoClient(logger: Logger): WeatherService {
  return new MetnoClient(
    logger.createChild({ persistentLogAttributes: { service: "metno" } }),
  );
}

function getUnits(event: APIGatewayProxyEventV2): Units {
  const units = event.queryStringParameters?.["units"] ?? "metric";

  if (!isUnits(units)) {
    throw new BadRequest("units is invalid: must be one of metric, imperial");
  }

  return units;
}

export function createHandler(
  createClientFn: (logger: Logger) => WeatherService,
) {
  return async function handler(
    event: APIGatewayProxyEventV2,
    context: LoggerContext & GeoCodeContext,
  ): Promise<Weather<Units>> {
    const weatherClient = createClientFn(context.logger);

    const units = getUnits(event);

    try {
      const weather = await weatherClient.getWeather(units, context.geoCode);

      return weather;
    } catch (err) {
      if (err instanceof WeatherServiceError) {
        throw new UnprocessableContent(err.message);
      }

      throw err;
    }
  };
}

const openWeatherMapHandler = createHandler(createOpenWeatherMapClient);

// For URL paths like /:latitude/:longitude
export const weatherHandler = geoCodeHandlerFactory(openWeatherMapHandler);
// For URL paths like /:location
export const reverseWeatherHandler = reverseGeocodeHandlerFactory(
  openWeatherMapHandler,
);

const metNoHandler = createHandler(createMetNoClient);

export const metnoWeatherHandler = geoCodeHandlerFactory(metNoHandler);
export const reverseMetnoWeatherHandler =
  reverseGeocodeHandlerFactory(metNoHandler);

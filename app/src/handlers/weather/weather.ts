import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { BadRequest } from "@curveball/http-errors";

import { GeoCodeContext } from "@/lib/geocode";
import {
  Handler,
  geoCodeHandlerFactory,
  reverseGeocodeHandlerFactory,
} from "@/lib/handler-factory";
import { Logger, LoggerContext } from "@/lib/logger";
import { Units, isUnits } from "@/lib/weather";
import { OpenWeatherMapClient, Weather } from "@/lib/open-weather-map";

type HandlerReturn = ReturnType<
  Handler<APIGatewayProxyEventV2, Weather<Units>>
>;

function createClient(logger: Logger): OpenWeatherMapClient {
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

function getUnits(event: APIGatewayProxyEventV2): Units {
  const units = event.queryStringParameters?.["units"] ?? "metric";

  if (!isUnits(units)) {
    throw new BadRequest("units is invalid: must be one of metric, imperial");
  }

  return units;
}

function handler(
  event: APIGatewayProxyEventV2,
  context: LoggerContext & GeoCodeContext,
): HandlerReturn {
  const weatherClient = createClient(context.logger);

  const units = getUnits(event);

  const weather = weatherClient.getWeather(units, context.geoCode);

  return weather;
}

// For URL paths like /:latitude/:longitude
export const weatherHandler = geoCodeHandlerFactory(handler);
// For URL paths like /:location
export const reverseWeatherHandler = reverseGeocodeHandlerFactory(handler);

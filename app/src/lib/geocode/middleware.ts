import { MiddlewareObj } from "@middy/core";
import type { APIGatewayProxyEventV2, Context } from "aws-lambda";
import {
  BadRequest,
  InternalServerError,
  NotFound,
  UnprocessableContent,
} from "@curveball/http-errors";

import {
  GeoCodeData,
  InvalidDataError,
  NoDataError,
  NominatimError,
  geoCode,
  reverseGeocode,
} from ".";
import { GeoLocateContext } from "@/lib/geolocate";
import type { LoggerContext } from "@/lib/logger";

export interface GeoCodeContext extends Context {
  geoCode: GeoCodeData;
}

// Middleware to reverse geocode (find a place name) based on IP or use given lat/lon.
export function reverseGeoCodeMiddleware<TResult>(): MiddlewareObj<
  APIGatewayProxyEventV2,
  TResult,
  Error,
  LoggerContext & GeoLocateContext & GeoCodeContext
> {
  return {
    before: async ({ event, context }) => {
      const logger = context.logger.createChild({
        persistentLogAttributes: {
          middleware: "reverseGeoCode",
        },
      });

      const acceptLanguage = event.headers["accept-language"] ?? "en";
      const { latitude, longitude } = context.geoLocate.location;

      try {
        const loc = await reverseGeocode(
          {
            latitude,
            longitude,
            acceptLanguage,
          },
          logger,
        );

        logger.debug("Reverse geocoded", { latitude, longitude, loc });

        context.geoCode = loc;
      } catch (error) {
        if (error instanceof NoDataError) {
          logger.warn("No reverse geocode data, location will not be known", {
            latitude,
            longitude,
          });
          context.geoCode = { latitude, longitude };
          return;
        }

        if (error instanceof NominatimError) {
          logger.warn(
            "Error calling Nominatim when reverse geocoding, location will not be known",
            {
              latitude,
              longitude,
              error: error.message,
            },
          );
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Failed to reverse geocode";

        throw new InternalServerError(errorMessage);
      }
    },
  };
}

// Middleware to geo code (find a lat/lon) based on given input.
export function geoCodeMiddleware<TResult>(): MiddlewareObj<
  APIGatewayProxyEventV2,
  TResult,
  Error,
  LoggerContext & GeoCodeContext
> {
  return {
    before: async ({ event, context }) => {
      const logger = context.logger.createChild({
        persistentLogAttributes: {
          middleware: "geoCode",
        },
      });

      const { pathParameters } = event;

      if (pathParameters === undefined) {
        throw new BadRequest("No path parameters");
      }

      const { location } = pathParameters;

      if (location === undefined) {
        throw new BadRequest("No city in path parameters");
      }

      const acceptLanguage = event.headers["accept-language"] ?? "en";

      logger.debug("Geocoding", { location });

      try {
        const loc = await geoCode({ location, acceptLanguage }, logger);

        logger.debug("Geocoded", { location, loc });

        context.geoCode = loc;
      } catch (error) {
        if (error instanceof NoDataError) {
          // We can't figure out the coordinates, need to give up
          logger.warn("Could not geolocate", {
            location,
          });
          throw new NotFound(
            `Could not geolocate: the location "${location}" was not found`,
          );
        }

        if (error instanceof NominatimError) {
          logger.warn("Error calling Nominatim when geocoding", {
            location,
            error: error.message,
          });
          throw new UnprocessableContent("Failed to geocode");
        }

        if (error instanceof InvalidDataError) {
          logger.warn("Received invalid data when geocoding", {
            location,
            error: error.message,
          });
          throw new UnprocessableContent("Failed to geocode");
        }

        const errorMessage =
          error instanceof Error ? error.message : "Failed to geocode";

        throw new InternalServerError(errorMessage);
      }
    },
  };
}

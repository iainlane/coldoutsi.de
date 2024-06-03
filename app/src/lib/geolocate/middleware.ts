import {
  BadRequest,
  InternalServerError,
  UnprocessableContent,
} from "@curveball/http-errors";
import { MiddlewareObj } from "@middy/core";
import type { APIGatewayProxyEventV2, Context } from "aws-lambda";

import type { LoggerContext } from "@/lib/logger";
import { toTwoDP } from "@/lib/util";
import { GeoLocate, GeoLocateError, geoLocator } from ".";

export interface GeoLocateContext extends Context {
  geoLocate: GeoLocate;
}

// Middleware to geolocate based on IP or use given lat/lon.
export function geoLocateMiddleware<TResult>(): MiddlewareObj<
  APIGatewayProxyEventV2,
  TResult,
  Error,
  LoggerContext & GeoLocateContext
> {
  return {
    before: async ({ event, context }) => {
      const log = context.logger.createChild({
        persistentLogAttributes: {
          middleware: "geoLocate",
        },
      });

      let { pathParameters } = event;

      pathParameters = pathParameters ?? {};

      const latParam = pathParameters["lat"];
      const lonParam = pathParameters["lon"];

      const ip = event.requestContext.http.sourceIp;

      if (latParam && lonParam) {
        const latitude = toTwoDP(Number(latParam));
        const longitude = toTwoDP(Number(lonParam));

        if (Number.isNaN(latitude)) {
          throw new BadRequest(`Invalid lat: ${latParam}`);
        }

        if (Number.isNaN(longitude)) {
          throw new BadRequest(`Invalid lon: ${lonParam}`);
        }

        log.debug("Using lat/lon from query parameters", {
          latitude,
          longitude,
          ip,
        });

        context.geoLocate = { ip, location: { latitude, longitude } };

        return;
      }

      if ((latParam !== undefined) !== (lonParam !== undefined)) {
        throw new BadRequest("If either lat or lon is specified, both must be");
      }

      // Do we have lat & lon in headers from CloudFront?
      const cfLatitude = event.headers["cloudfront-viewer-latitude"];
      const cfLongitude = event.headers["cloudfront-viewer-longitude"];

      if (cfLatitude && cfLongitude) {
        const latitude = toTwoDP(Number(cfLatitude));
        const longitude = toTwoDP(Number(cfLongitude));

        if (!(Number.isNaN(latitude) || Number.isNaN(longitude))) {
          log.debug("Using lat/lon from CloudFront headers", {
            lat: latitude,
            lon: longitude,
            ip,
          });
          context.geoLocate = { ip, location: { latitude, longitude } };

          return;
        }
      }

      try {
        const geoData = await geoLocator({ ip }, log);
        log.debug("Geolocated", { ip, geoData });
        context.geoLocate = geoData;
      } catch (error) {
        if (error instanceof GeoLocateError) {
          throw new UnprocessableContent(error.message);
        }

        throw new InternalServerError(`Failed to geolocate ${ip}: ${error}`);
      }
    },
  };
}

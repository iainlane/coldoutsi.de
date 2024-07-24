import {
  BadRequest,
  InternalServerError,
  UnprocessableContent,
} from "@curveball/http-errors";
import { MiddlewareObj } from "@middy/core";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from "aws-lambda";
import { StatusCodes } from "http-status-codes";

import type { Logger, LoggerContext } from "@/lib/logger";
import { toTwoDP, removePathParts } from "@/lib/util";
import { GeoLocate, GeoLocateError, geoLocator } from ".";

const { PERMANENT_REDIRECT } = StatusCodes;

export interface GeoLocateContext extends Context {
  geoLocate: GeoLocate;
}

export const thirtyDays = 60 * 60 * 24 * 30;

function roundRedirect(
  log: Logger,
  latitude: number,
  longitude: number,
  event: APIGatewayProxyEventV2,
): APIGatewayProxyResultV2 {
  const base = removePathParts(2, event.rawPath);
  const queryString = event.rawQueryString ? `?${event.rawQueryString}` : "";

  log.info("lat/lon greater than 2dp, redirecting");

  return {
    statusCode: PERMANENT_REDIRECT,
    headers: {
      "cache-control": `public, max-age=${thirtyDays}, immutable`,
      location: `${base}/${latitude}/${longitude}${queryString}`,
    },
  };
}

function handleLatLon(
  log: Logger,
  event: APIGatewayProxyEventV2,
  context: GeoLocateContext,
  latParam: string,
  lonParam: string,
): APIGatewayProxyResultV2 | undefined {
  const latNumber = Number(latParam);
  const lonNumber = Number(lonParam);

  const latitude = toTwoDP(latNumber);
  const longitude = toTwoDP(lonNumber);

  if (Number.isNaN(latitude)) {
    throw new BadRequest(`Invalid latitude parameter: ${latParam}`);
  }

  if (Number.isNaN(longitude)) {
    throw new BadRequest(`Invalid longitude parameter: ${lonParam}`);
  }

  log = log.createChild({
    persistentLogAttributes: {
      lat: latitude,
      lon: longitude,
    },
  });

  // Round lat/lon to 2dp of accuracy for improved caching
  if (latNumber !== latitude || lonNumber !== longitude) {
    return roundRedirect(
      log.createChild({
        persistentLogAttributes: {
          givenLat: latNumber,
          givenLon: lonNumber,
        },
      }),
      latitude,
      longitude,
      event,
    );
  }

  log.debug("Using lat/lon from query parameters");

  context.geoLocate = {
    ip: event.requestContext.http.sourceIp,
    location: { latitude, longitude },
  };

  return;
}

function handleCloudFront(
  log: Logger,
  latHeader: string,
  lonHeader: string,
  ip: string,
  context: GeoLocateContext,
): boolean {
  const lat = Number(latHeader);
  if (Number.isNaN(lat)) {
    log.warn("Received invalid latitude from CloudFront Headers", {
      latHeader,
    });

    return false;
  }

  const lon = Number(lonHeader);
  if (Number.isNaN(lon)) {
    log.warn("Received invalid longitude from CloudFront Headers", {
      lonHeader,
    });

    return false;
  }

  const latitude = toTwoDP(lat);
  const longitude = toTwoDP(lon);

  log.debug("Using lat/lon from CloudFront headers", {
    lat: latitude,
    lon: longitude,
  });

  context.geoLocate = { ip, location: { latitude, longitude } };

  return true;
}

// Middleware to geolocate based on IP or use given lat/lon.
export function geoLocateMiddleware<TResult>(): MiddlewareObj<
  APIGatewayProxyEventV2,
  TResult,
  Error,
  LoggerContext & GeoLocateContext
> {
  return {
    before: async ({
      event,
      context,
    }): Promise<APIGatewayProxyResultV2 | undefined> => {
      const ip = event.requestContext.http.sourceIp;
      const log = context.logger.createChild({
        persistentLogAttributes: {
          middleware: "geoLocate",
          ip,
        },
      });

      let { pathParameters } = event;

      pathParameters = pathParameters ?? {};

      const latParam = pathParameters["lat"] ?? "";
      const lonParam = pathParameters["lon"] ?? "";

      if (latParam !== "" && lonParam !== "") {
        return handleLatLon(log, event, context, latParam, lonParam);
      }

      if ((latParam === "") !== (lonParam === "")) {
        throw new BadRequest("If either lat or lon is specified, both must be");
      }

      // Do we have lat & lon in headers from CloudFront?
      const cfLatitude = event.headers["cloudfront-viewer-latitude"];
      const cfLongitude = event.headers["cloudfront-viewer-longitude"];

      if (cfLatitude && cfLongitude) {
        if (handleCloudFront(log, cfLatitude, cfLongitude, ip, context)) {
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

      return;
    },
  };
}

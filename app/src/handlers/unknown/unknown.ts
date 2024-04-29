import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import httpHeaderNormalizer from "@middy/http-header-normalizer";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { StatusCodes } from "http-status-codes";

import { cacheControlMiddleware } from "@/lib/cachecontrol";
import { loggerMiddleware } from "@/lib/logger";
import { GeoLocateContext, geoLocateMiddleware } from "@/lib/geolocate";

const { TEMPORARY_REDIRECT } = StatusCodes;

function handler(
  event: APIGatewayProxyEventV2,
  { geoLocate }: GeoLocateContext,
): Promise<APIGatewayProxyResultV2> {
  const { latitude, longitude } = geoLocate.location;

  // Redirect relative to the current page

  // Strip off any trailing slashes from the path and split it into parts
  // (separated by slashes)
  const rawPathParts = (
    event.rawPath.endsWith("/") ? event.rawPath.slice(0, -1) : event.rawPath
  ).split("/");

  // Remove the last part of the path (":unknown")
  rawPathParts.pop();

  // And put it back together
  const rawPath = rawPathParts.join("/");

  return Promise.resolve({
    statusCode: TEMPORARY_REDIRECT,
    headers: {
      location: `${rawPath}/${latitude}/${longitude}`,
    },
  });
}

export const unknownHandler = middy<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
>()
  .use(loggerMiddleware())
  .use(cacheControlMiddleware())
  .use(httpHeaderNormalizer())
  .use(httpErrorHandler())
  .use(geoLocateMiddleware())
  .handler(handler);

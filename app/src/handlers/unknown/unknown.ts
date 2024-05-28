import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import httpHeaderNormalizer from "@middy/http-header-normalizer";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { StatusCodes } from "http-status-codes";

import { cacheControlMiddleware } from "@/lib/cachecontrol";
import { GeoLocateContext, geoLocateMiddleware } from "@/lib/geolocate";
import { loggerMiddleware } from "@/lib/logger";
import { addSuffix } from "@/lib/util";

const { TEMPORARY_REDIRECT } = StatusCodes;

function handler(
  event: APIGatewayProxyEventV2,
  { geoLocate }: GeoLocateContext,
): APIGatewayProxyResultV2 {
  const { latitude, longitude } = geoLocate.location;

  // Redirect relative to the current page

  // Strip off any trailing slashes from the path, split it into parts
  // (separated by slashes), remove the last two parts ("/:unknown" and
  // "/"), and then put it back together.
  const rawPath = addSuffix("/", event.rawPath)
    .split("/")
    .slice(0, -2)
    .join("/");

  const queryString = event.rawQueryString ? `?${event.rawQueryString}` : "";

  return {
    statusCode: TEMPORARY_REDIRECT,
    headers: {
      location: `${rawPath}/${latitude}/${longitude}${queryString}`,
    },
  };
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

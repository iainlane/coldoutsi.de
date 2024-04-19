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
  _event: unknown,
  { geoLocate }: GeoLocateContext,
): Promise<APIGatewayProxyResultV2> {
  const { latitude, longitude } = geoLocate.location;

  // Redirect relative to the current page
  return Promise.resolve({
    statusCode: TEMPORARY_REDIRECT,
    headers: {
      location: `./${latitude}/${longitude}`,
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

import { isHttpProblem } from "@curveball/http-errors";
import middy, { MiddlewareObj, MiddyHandlerObject } from "@middy/core";
import errorLogger from "@middy/error-logger";
import httpContentEncoding from "@middy/http-content-encoding";
import httpContentNegotiation from "@middy/http-content-negotiation";
import httpErrorHandler from "@middy/http-error-handler";
import httpHeaderNormalizer from "@middy/http-header-normalizer";
import type { Context as LambdaContext } from "aws-lambda/handler";
import { constants } from "node:zlib";

import { cacheControlMiddleware } from "@/lib/cachecontrol";
import {
  GeoCodeContext,
  geoCodeMiddleware,
  reverseGeoCodeMiddleware,
} from "@/lib/geocode";
import { GeoLocateContext, geoLocateMiddleware } from "@/lib/geolocate";
import { Logger, LoggerContext, loggerMiddleware } from "@/lib/logger";
import { renderableMiddleware } from "@/lib/render";

export type { Event as HttpContentNegotiationEvent } from "@middy/http-content-negotiation";
export type { Event as HttpHeaderNormalizerEvent } from "@middy/http-header-normalizer";

// copied from @middy/core as it's not exported
// The AWS provided Handler type uses void | Promise<TResult> so we have no choice but to follow and suppress the linter warning
type MiddyInputHandler<
  TEvent,
  TResult,
  TContext extends LambdaContext = LambdaContext,
> = (
  event: TEvent,
  context: TContext,
  opts: MiddyHandlerObject,
) => // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
void | Promise<TResult> | TResult;

type Contexts = GeoCodeContext & GeoLocateContext & LoggerContext;

// Wrap an onerror-providing middleware, and supply it with the logger from our
// context
function customHttpErrorHandler<
  TEvent,
  TResult,
  TErr extends Error,
  TContext extends LoggerContext,
>(
  makeMiddlewareFn: (
    logger: Logger,
  ) => MiddlewareObj<TEvent, TResult, TErr, TContext>,
): MiddlewareObj<TEvent, TResult, TErr, TContext> {
  const customOnError: MiddlewareObj<
    TEvent,
    TResult,
    TErr,
    TContext
  >["onError"] = async (request) => {
    const logger = request.context.logger;
    const middleware = makeMiddlewareFn(logger);

    if (!middleware.onError) {
      return;
    }

    // Rewrite @curveball/http-errors to the format http-error-handler expects
    // (message and statusCode fields)
    if (request.error && isHttpProblem(request.error)) {
      request.error = {
        ...request.error,
        message: request.error.detail,
        statusCode: request.error.httpStatus,
      };
    }

    await middleware.onError(request);
  };

  return {
    onError: customOnError,
  };
}

function httpContentEncodingMiddleware() {
  return httpContentEncoding({
    br: {
      params: {
        [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT, // adjusted for UTF-8 text
        [constants.BROTLI_PARAM_QUALITY]: 7,
      },
    },
    overridePreferredEncoding: ["br", "gzip", "deflate"],
  });
}

export type Handler<
  TEvent,
  TResult,
  TContext extends Contexts = Contexts,
> = MiddyInputHandler<TEvent, TResult, TContext>;

const commonPreMiddlewares = [
  cacheControlMiddleware(),
  loggerMiddleware(),
  customHttpErrorHandler((logger) =>
    errorLogger({
      logger: (error: string) => {
        error && logger.error(error, { error });
      },
    }),
  ),
  httpHeaderNormalizer(),
  httpContentNegotiation(),
  httpContentEncodingMiddleware(),
  renderableMiddleware(),
];

const commonPostMiddlewares = [
  customHttpErrorHandler((logger) =>
    httpErrorHandler({
      logger: (error: string) => {
        error && logger.error(error, { error });
      },
      fallbackMessage: "Internal server error",
    }),
  ),
];

export function reverseGeocodeHandlerFactory<
  TEvent,
  TResult,
  TErr = Error,
  TContext extends Contexts = Contexts,
>(baseHandler: Handler<TEvent, TResult>) {
  return middy<TEvent, TResult, TErr, TContext>()
    .use([
      ...commonPreMiddlewares,
      geoLocateMiddleware(),
      reverseGeoCodeMiddleware(),
      ...commonPostMiddlewares,
    ])
    .handler(baseHandler);
}

export function geoCodeHandlerFactory<
  TEvent,
  TResult,
  TErr = Error,
  TContext extends Contexts = Contexts,
>(baseHandler: Handler<TEvent, TResult>) {
  return middy<TEvent, TResult, TErr, TContext>()
    .use([
      ...commonPreMiddlewares,
      geoCodeMiddleware(),
      ...commonPostMiddlewares,
    ])
    .handler(baseHandler);
}

export function handlerFactory<
  TEvent,
  TResult,
  TErr = Error,
  TContext extends Contexts = Contexts,
>(baseHandler: Handler<TEvent, TResult>) {
  return middy<TEvent, TResult, TErr, TContext>()
    .use([...commonPreMiddlewares, ...commonPostMiddlewares])
    .handler(baseHandler);
}

import { StatusCodes } from "http-status-codes";
import { MiddlewareObj } from "@middy/core";

import { LoggerContext } from "@/lib/logger";

export interface Response {
  statusCode: number;
  headers?: { [header: string]: boolean | number | string };
}

const { BAD_REQUEST, NOT_FOUND, NOT_MODIFIED, TEMPORARY_REDIRECT } =
  StatusCodes;

const cacheStatuses = [
  BAD_REQUEST,
  NOT_FOUND,
  NOT_MODIFIED,
  TEMPORARY_REDIRECT,
];

function shouldCache(resp: Response): number | undefined {
  const code = resp.statusCode;

  if (code >= 200 && code < 300) {
    return 3600;
  }

  if (cacheStatuses.includes(code)) {
    return 3600;
  }

  return undefined;
}

// Cache control middleware
export function cacheControlMiddleware<
  TEvent = unknown,
  TErr = Error,
  TContext extends LoggerContext = LoggerContext,
>(): MiddlewareObj<TEvent, Response, TErr, TContext> {
  return {
    after: (request) => {
      const { response, context } = request;
      if (!response) {
        return;
      }

      const logger = context.logger.createChild({
        persistentLogAttributes: {
          middleware: "cacheControl",
        },
      });

      // If there's already a cache-control header, leave it alone.
      if (response.headers?.["cache-control"]) {
        logger.debug(
          "Response already has a cache-control header, not touching it.",
          { "cache-control": response.headers["cache-control"] },
        );
        return;
      }

      const cacheTime = shouldCache(response);

      // Do not cache unsuccessful responses
      if (cacheTime === undefined) {
        logger.debug("Sending do-not-cache headers", {
          statusCode: response.statusCode,
        });
        response.headers = {
          ...response.headers,
          "cache-control": "no-store, no-cache, must-revalidate",
        };
        return;
      }

      logger.debug("Sending cache headers", {
        statusCode: response.statusCode,
        cacheTime,
      });

      // Set the Cache-Control header for successful responses
      response.headers = {
        ...response.headers,
        "cache-control": `public, max-age=${cacheTime}`,
      };
    },
  };
}

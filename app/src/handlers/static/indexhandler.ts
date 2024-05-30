import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import httpHeaderNormalizer from "@middy/http-header-normalizer";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { StatusCodes } from "http-status-codes";
import Negotiator from "negotiator";

import { cacheControlMiddleware } from "@/lib/cachecontrol";
import { LoggerContext, loggerMiddleware } from "@/lib/logger";
import { staticFileData } from "@/lib/static";
import { addPrefix, addSuffix } from "@/lib/util";

import { sendFileInfo } from "./static";

const { TEMPORARY_REDIRECT } = StatusCodes;

const indexHtml =
  staticFileData["index.html"] ??
  (() => {
    throw new Error("index.html not found");
  })();

function handler(
  event: APIGatewayProxyEventV2,
  { logger }: LoggerContext,
): APIGatewayProxyResultV2 {
  const negotiator = new Negotiator(event);
  const type = negotiator.mediaType(["text/html", "text/plain"]);
  const mostPreferredType = negotiator.mediaType();

  // Check if the client accepts HTML. But not */*, as this would mean we return
  // HTML all of the time. So we only return HTML if the client explicitly wants
  // it.
  if (type === "text/html" && mostPreferredType !== "*/*") {
    const log = logger.createChild({
      persistentLogAttributes: {
        handler: "index",
      },
    });

    return sendFileInfo(log, indexHtml, false, event);
  }

  // Redirect to `:unknown` (relative to the current page) if the client doesn't
  // accept HTML
  const rawPath = addSuffix("/", event.rawPath);
  const queryString = addPrefix("?", event.rawQueryString);

  return {
    statusCode: TEMPORARY_REDIRECT,
    headers: {
      location: `${rawPath}:unknown${queryString}`,
    },
  };
}

export const indexHandler = middy<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
>()
  .use(loggerMiddleware())
  .use(cacheControlMiddleware())
  .use(httpHeaderNormalizer())
  .use(httpErrorHandler())
  .handler(handler);

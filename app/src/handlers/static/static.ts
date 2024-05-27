import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { StatusCodes } from "http-status-codes";
import * as path from "path";

import { removePrefix } from "@/lib/util";
import { handlerFactory } from "@/lib/handler-factory";
import { Logger, LoggerContext } from "@/lib/logger";

import { staticFileInfo } from "./fileinfo";

const { NOT_FOUND, NOT_MODIFIED, OK } = StatusCodes;

// Some files will never be found, so we can cache that information.
const notFoundCache = new Set(["favicon.ico"]);

export function sendFileInfo(
  log: Logger,
  fileInfo: staticFileInfo,
  { headers }: APIGatewayProxyEventV2,
): APIGatewayProxyResultV2 {
  const { buffer, contentType, etag, lastModified, size } = fileInfo;

  const ifNoneMatch = removePrefix("W/", headers["if-none-match"]);
  const ifModifiedSince = headers["if-modified-since"];

  const cacheHeaders = {
    etag,
    "cache-control": "public, s-maxage=60",
    "last-modified": lastModified.toUTCString(),
  };

  if (
    ifNoneMatch === etag ||
    (!ifNoneMatch &&
      ifModifiedSince &&
      new Date(ifModifiedSince) >= lastModified)
  ) {
    log.debug("Not modified, sending 304");

    return {
      statusCode: NOT_MODIFIED,
      headers: cacheHeaders,
    };
  }

  log.debug("Sending file");

  return {
    statusCode: OK,
    headers: {
      "content-length": size,
      "content-type": contentType,
      ...cacheHeaders,
    },
    body: buffer.toString("base64"),
    isBase64Encoded: true,
  };
}

function staticFileHandler(
  fileData: { [path: string]: staticFileInfo },
  event: APIGatewayProxyEventV2,
  { logger }: LoggerContext,
): APIGatewayProxyResultV2 {
  const p = path.relative("/", event.requestContext.http.path);
  const fileInfo = fileData[p];

  const log = logger.createChild({
    persistentLogAttributes: {
      handler: "static",
      path: p,
    },
  });

  if (!fileInfo) {
    return {
      statusCode: NOT_FOUND,
      body: `File ${p} was not found.\n`,
      ...(notFoundCache.has(p) && {
        headers: {
          "cache-control": "public, max-age=3600",
        },
      }),
    };
  }

  return sendFileInfo(log, fileInfo, event);
}

export function staticHandlerFactory(fileInfo: {
  [path: string]: staticFileInfo;
}) {
  return handlerFactory(
    (event: APIGatewayProxyEventV2, context: LoggerContext) =>
      staticFileHandler(fileInfo, event, context),
  );
}

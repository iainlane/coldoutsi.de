import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { StatusCodes } from "http-status-codes";
import { relative } from "path";

import { handlerFactory } from "@/lib/handler-factory";
import { Logger, LoggerContext } from "@/lib/logger";
import { staticFileInfo } from "@/lib/static";
import { removePrefix } from "@/lib/util";

const { NOT_FOUND, NOT_MODIFIED, OK } = StatusCodes;

// Some files will never be found, so we can cache that information.
const notFoundCache = new Set(["favicon.ico"]);

export function sendFileInfo(
  log: Logger,
  fileInfo: staticFileInfo,
  withHash: boolean,
  { headers }: APIGatewayProxyEventV2,
): APIGatewayProxyResultV2 {
  const { buffer, contentType, etag, lastModified, size } = fileInfo;

  const ifNoneMatch = removePrefix("W/", headers["if-none-match"]);
  const ifModifiedSince = headers["if-modified-since"];

  const cacheHeaders = {
    etag,
    "cache-control": withHash
      ? "public, max-age=31536000, immutable"
      : "public, s-maxage=60",
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

  log.debug("Sending file", { withHash });

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

function pathWithHash(fullPath: string): { path: string; hash?: string } {
  // The path could be `path.sha256@<hash>.ext` or just `path.ext`. Figure out
  // which one it is and return the path and hash separately.

  const [name, typeAndHash, ext] = fullPath.split(".", 3);

  if (!name || !typeAndHash || !ext) {
    return { path: fullPath };
  }

  const path = `${name}.${ext}`;

  const [hashType, hash] = typeAndHash.split("@", 2);

  if (!hash || hashType !== "sha256") {
    return { path };
  }

  return { path, hash };
}

function staticFileHandler(
  fileData: { [path: string]: staticFileInfo },
  event: APIGatewayProxyEventV2,
  { logger }: LoggerContext,
): APIGatewayProxyResultV2 {
  const p = relative("/static/", event.requestContext.http.path);

  const { path, hash } = pathWithHash(p);
  const fileInfo = fileData[path];

  const log = logger.createChild({
    persistentLogAttributes: {
      handler: "static",
      path: p,
      realPath: path,
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

  if (hash && fileInfo.hash !== hash) {
    log.warn("Hash mismatch, sending 404");

    return {
      statusCode: NOT_FOUND,
      body: `File ${p} does not match hash ${hash}.\n`,
      headers: {
        "cache-control": "public, max-age=3600",
      },
    };
  }

  return sendFileInfo(log, fileInfo, hash !== undefined, event);
}

export function staticHandlerFactory(fileInfo: {
  [path: string]: staticFileInfo;
}) {
  return handlerFactory(
    (event: APIGatewayProxyEventV2, context: LoggerContext) =>
      staticFileHandler(fileInfo, event, context),
  );
}

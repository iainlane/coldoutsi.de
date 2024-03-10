import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { createHash } from "crypto";
import { readFile, readdir, stat } from "fs/promises";
import { StatusCodes } from "http-status-codes";
import { contentType } from "mime-types";
import * as path from "path";
import { fileURLToPath } from "url";

import { handlerFactory } from "@/lib/handler-factory";
import { LoggerContext } from "@/lib/logger";

const { NOT_FOUND, NOT_MODIFIED, OK } = StatusCodes;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticFilesDir = path.resolve(__dirname, "../../../static");

// Read all files from `/static` and precompute their metadata.
const fileData = await (async () => {
  const fileInfo: {
    [key: string]: {
      buffer: Buffer;
      etag: string;
      lastModified: Date;
      contentType: string;
      size: number;
    };
  } = {};

  const files = await readdir(staticFilesDir);

  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(staticFilesDir, file);
      const fileBuffer = await readFile(filePath);
      const hashSum = createHash("sha256");
      hashSum.update(fileBuffer);
      const hex = hashSum.digest("hex");

      const stats = await stat(filePath);
      const lastModified = stats.mtime;

      const fileContentType =
        contentType(path.extname(file)) || "application/octet-stream";

      fileInfo[file] = {
        buffer: fileBuffer,
        contentType: fileContentType,
        etag: hex,
        lastModified: lastModified,
        size: stats.size,
      };
    }),
  );

  return fileInfo;
})();

const notFoundFiles = new Set(["favicon.ico"]);

function staticFileHandler(
  event: APIGatewayProxyEventV2,
  { logger }: LoggerContext,
): Promise<APIGatewayProxyResultV2> {
  const p = path.relative("/", event.requestContext.http.path);
  const fd = fileData[p];

  const log = logger.createChild({
    persistentLogAttributes: {
      handler: "static",
      path: p,
    },
  });

  if (!fd) {
    return Promise.resolve({
      statusCode: NOT_FOUND,
      body: `File ${p} was not found.\n`,
      ...(notFoundFiles.has(p)
        ? {
            headers: {
              "cache-control": "public, max-age=3600",
            },
          }
        : {}),
    });
  }

  const { buffer, contentType, etag, lastModified, size } = fd;

  const ifNoneMatch = event.headers["If-None-Match"];
  const ifModifiedSince = event.headers["If-Modified-Since"];

  const cacheHeaders = {
    "cache-control": "public, s-maxage=60",
    ETag: `"${etag}"`,
    "last-modified": lastModified.toUTCString(),
  };

  if (
    ifNoneMatch === etag ||
    (ifModifiedSince && new Date(ifModifiedSince) >= lastModified)
  ) {
    log.debug("Not modified, sending 304");

    return Promise.resolve({
      statusCode: NOT_MODIFIED,
      headers: cacheHeaders,
    });
  }

  log.debug("Sending file");

  return Promise.resolve({
    statusCode: OK,
    headers: {
      "content-length": size,
      "content-type": contentType,
      ...cacheHeaders,
    },
    body: buffer.toString("base64"),
    isBase64Encoded: true,
  });
}

export const staticHandler = handlerFactory(staticFileHandler);

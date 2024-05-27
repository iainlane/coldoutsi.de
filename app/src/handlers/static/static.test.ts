import { describe, expect, it } from "@jest/globals";
import { Event } from "@middy/http-header-normalizer";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { StatusCodes } from "http-status-codes";
import { mock } from "jest-mock-extended";
import path from "path";
import { fileURLToPath } from "url";

import { GeoCodeContext } from "@/lib/geocode";
import { GeoLocateContext } from "@/lib/geolocate";
import { LoggerContext } from "@/lib/logger";

import { precomputeFileData } from "./fileinfo";
import { staticHandlerFactory } from "./static";

//#region Test data
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticFilesDir = path.join(__dirname, "..", "..", "testdata");
const fileData = await precomputeFileData(staticFilesDir);

//#region file modification times
// `git` doesn't store file modification times, so we need to set them
// dynamically.

// We know that `test.txt` will be in `fileData`.
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const testTxtMtime = fileData["test.txt"]!.lastModified;

const oneYearAgo = new Date(testTxtMtime);
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

const oneYearFromNow = new Date(testTxtMtime);
oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
//#endregion

const correctEtag = `"f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2"`;
const base64content = Buffer.from("test\n").toString("base64");
//#endregion

const handler = staticHandlerFactory(fileData);

const mockContext = mock<GeoCodeContext & GeoLocateContext & LoggerContext>();

describe("static file handler", () => {
  it("returns 404 for unknown files", async () => {
    const event = mock<APIGatewayProxyEventV2 & Event>({
      requestContext: {
        http: {
          path: "/unknown",
        },
      },
    });

    await expect(handler(event, mockContext)).resolves.toEqual(
      expect.objectContaining({
        statusCode: StatusCodes.NOT_FOUND,
      }),
    );
  });

  it("should cache the 404 for /favicon.ico", async () => {
    const event = mock<APIGatewayProxyEventV2 & Event>({
      requestContext: {
        http: {
          path: "/favicon.ico",
        },
      },
    });

    await expect(handler(event, mockContext)).resolves.toEqual(
      expect.objectContaining({
        statusCode: StatusCodes.NOT_FOUND,
        headers: {
          "cache-control": expect.stringContaining("public"),
        },
      }),
    );
  });

  it.each<{
    description: string;
    ifModifiedSince?: string;
    ifNoneMatch?: string;
    expectedStatus: StatusCodes;
    expectedHeaders?: { [key: string]: string };
  }>([
    {
      description: "returns OK if no cache headers are provided",
      expectedStatus: StatusCodes.OK,
      expectedHeaders: {
        "cache-control": "public, s-maxage=60",
        etag: correctEtag,
        "last-modified": testTxtMtime.toUTCString(),
      },
    },
    {
      description: "returns NOT_MODIFIED if etag matches",
      ifNoneMatch: correctEtag,
      expectedStatus: StatusCodes.NOT_MODIFIED,
    },
    {
      description:
        "returns NOT_MODIFIED if if-modified-since is after last-modified",
      ifModifiedSince: oneYearFromNow.toUTCString(),
      expectedStatus: StatusCodes.NOT_MODIFIED,
    },
    {
      description: "returns OK if if-modified-since is before last-modified",
      ifModifiedSince: oneYearAgo.toUTCString(),
      expectedStatus: StatusCodes.OK,
    },
    {
      description: "if-none-match takes precedence over if-modified-since",
      ifNoneMatch: "foo",
      ifModifiedSince: testTxtMtime.toUTCString(),
      expectedStatus: StatusCodes.OK,
    },
    {
      description: "returns OK if if-modified-since header is invalid",
      ifModifiedSince: "invalid-date",
      expectedStatus: StatusCodes.OK,
    },
    {
      description:
        "returns NOT_MODIFIED if if-none-match matches, even if if-modified-since is invalid",
      ifNoneMatch: correctEtag,
      ifModifiedSince: "invalid-date",
      expectedStatus: StatusCodes.NOT_MODIFIED,
    },
    {
      description: "returns NOT_MODIFIED if if-none-match is a weak match",
      ifNoneMatch: `W/${correctEtag}`,
      expectedStatus: StatusCodes.NOT_MODIFIED,
    },
    {
      description:
        "returns OK if neither if-none-match nor if-modified-since condition is met",
      ifNoneMatch: "non-matching-etag",
      ifModifiedSince: oneYearAgo.toUTCString(),
      expectedStatus: StatusCodes.OK,
    },
  ])(
    "$description",
    async ({
      ifModifiedSince,
      ifNoneMatch,
      expectedStatus,
      expectedHeaders,
    }) => {
      const event = mock<APIGatewayProxyEventV2 & Event>({
        requestContext: {
          http: {
            path: "/test.txt",
          },
        },
        headers: {
          ...(ifModifiedSince && { "if-modified-since": ifModifiedSince }),
          ...(ifNoneMatch && { "if-none-match": ifNoneMatch }),
        },
      });

      await expect(handler(event, mockContext)).resolves.toEqual(
        expect.objectContaining({
          headers: expect.objectContaining(expectedHeaders ?? {}),
          ...(expectedStatus === StatusCodes.OK && {
            body: base64content,
          }),
          statusCode: expectedStatus,
        }),
      );
    },
  );
});

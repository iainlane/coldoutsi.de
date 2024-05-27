import { describe, expect, it } from "@jest/globals";
import { Event } from "@middy/http-header-normalizer";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { StatusCodes } from "http-status-codes";
import { mock } from "jest-mock-extended";

import { GeoCodeContext } from "@/lib/geocode";
import { GeoLocateContext } from "@/lib/geolocate";
import { LoggerContext } from "@/lib/logger";

import { indexHandler } from ".";

const mockContext = mock<GeoCodeContext & GeoLocateContext & LoggerContext>();

describe("index (/) handler", () => {
  it.each<{
    description: string;
    acceptHeader: string;
    path: string;
    queryString?: string;
    expectedStatus: StatusCodes;
    expectedHeaders?: { [key: string]: string };
  }>([
    {
      description: "redirects to /:unknown if client doesn't accept HTML",
      acceptHeader: "text/plain",
      path: "/",
      expectedStatus: StatusCodes.TEMPORARY_REDIRECT,
      expectedHeaders: {
        "cache-control": "public, max-age=3600",
        location: "/:unknown",
      },
    },
    {
      description: "preserves query string when redirecting",
      acceptHeader: "text/plain",
      path: "/",
      queryString: "foo=bar",
      expectedStatus: StatusCodes.TEMPORARY_REDIRECT,
      expectedHeaders: {
        "cache-control": "public, max-age=3600",
        location: "/:unknown?foo=bar",
      },
    },
    {
      description: "redirects when accept header is */*",
      acceptHeader: "*/*",
      path: "/",
      expectedStatus: StatusCodes.TEMPORARY_REDIRECT,
    },
    {
      description: "returns index.html if client explicitly accepts HTML",
      acceptHeader: "text/html",
      path: "/",
      expectedStatus: StatusCodes.OK,
      expectedHeaders: {
        "cache-control": "public, s-maxage=60",
      },
    },
    {
      description: "preserves the prefix when redirecting",
      acceptHeader: "text/plain",
      path: "/foo",
      expectedStatus: StatusCodes.TEMPORARY_REDIRECT,
      expectedHeaders: {
        location: "/foo/:unknown",
      },
    },
    {
      description: "preserves the prefix when redirecting, with query string",
      acceptHeader: "text/plain",
      path: "/foo",
      queryString: "bar=baz",
      expectedStatus: StatusCodes.TEMPORARY_REDIRECT,
      expectedHeaders: {
        location: "/foo/:unknown?bar=baz",
      },
    },
    {
      description: "preserves the prefix when redirecting (trailing slash)",
      acceptHeader: "text/plain",
      path: "/foo/",
      queryString: "bar=baz",
      expectedStatus: StatusCodes.TEMPORARY_REDIRECT,
      expectedHeaders: {
        location: "/foo/:unknown?bar=baz",
      },
    },
    {
      description: "handles a complex accept header",
      acceptHeader:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      path: "/",
      expectedStatus: StatusCodes.OK,
    },
    {
      description: "redirects if the client prefers text/plain over text/html",
      acceptHeader: "text/plain, text/html",
      path: "/",
      expectedStatus: StatusCodes.TEMPORARY_REDIRECT,
    },
    {
      description:
        "redirects if the client prefers text/plain over text/html, using quality values",
      acceptHeader: "text/html;q=0.5, text/plain;q=0.8",
      path: "/",
      expectedStatus: StatusCodes.TEMPORARY_REDIRECT,
    },
  ])(
    "$description",
    async ({
      acceptHeader,
      path,
      queryString,
      expectedStatus,
      expectedHeaders,
    }) => {
      const event = mock<APIGatewayProxyEventV2 & Event>({
        rawPath: path,
        rawQueryString: queryString ?? "",
        headers: {
          accept: acceptHeader,
        },
      });

      await expect(indexHandler(event, mockContext)).resolves.toEqual(
        expect.objectContaining({
          headers: expect.objectContaining(expectedHeaders ?? {}),
          ...(expectedStatus === StatusCodes.OK && {
            body: expect.anything(),
          }),
          statusCode: expectedStatus,
        }),
      );
    },
  );
});

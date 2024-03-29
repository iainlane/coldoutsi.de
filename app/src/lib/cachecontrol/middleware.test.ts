import { describe, expect, it } from "@jest/globals";
import { mock } from "jest-mock-extended";
import middy, { MiddyfiedHandler } from "@middy/core";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { StatusCodes } from "http-status-codes";

import { cacheControlMiddleware, Response } from ".";
import { LoggerContext } from "@/lib/logger";

const { INTERNAL_SERVER_ERROR, NOT_FOUND, OK } = StatusCodes;

function baseHandler(code: number): () => Promise<Response> {
  return async () => {
    return Promise.resolve({
      statusCode: code,
    });
  };
}

const mockEvent = mock<APIGatewayProxyEventV2>();

const mockContext = mock<LoggerContext>({
  logger: new Logger(),
});

function middyHandler(code: number) {
  return middy()
    .use(cacheControlMiddleware())
    .handler(baseHandler(code)) as MiddyfiedHandler<
    APIGatewayProxyEventV2,
    Response,
    Error,
    LoggerContext
  >;
}

describe("Cache Control Middleware", () => {
  it.each<{ code: number; time: number | undefined }>([
    { code: OK, time: 3600 },
    { code: NOT_FOUND, time: 3600 },
    { code: INTERNAL_SERVER_ERROR, time: undefined },
  ])("caches ${code} based on status code", async ({ code, time }) => {
    const response = await middyHandler(code)(mockEvent, mockContext);

    const expectedCacheControl =
      time !== undefined
        ? `public, max-age=${time}`
        : "no-store, no-cache, must-revalidate";

    expect(response.statusCode).toBe(code);
    expect(response.headers?.["cache-control"]).toBe(expectedCacheControl);
  });

  it("appends to existing headers", async () => {
    const headerHandler = () =>
      Promise.resolve({
        statusCode: OK,
        headers: {
          foo: "bar",
        },
      });

    const response = await (
      middy()
        .use(cacheControlMiddleware())
        .handler(headerHandler) as MiddyfiedHandler<
        APIGatewayProxyEventV2,
        Response,
        Error,
        LoggerContext
      >
    )(mockEvent, mockContext);

    expect(response.statusCode).toBe(OK);
    expect(response.headers).toEqual({
      foo: "bar",
      "cache-control": "public, max-age=3600",
    });
  });

  it("ignores a null response", async () => {
    const nullHandler = () => Promise.resolve(null);

    const response = await (
      middy()
        .use(cacheControlMiddleware())
        .handler(nullHandler) as MiddyfiedHandler<
        APIGatewayProxyEventV2,
        Response,
        Error,
        LoggerContext
      >
    )(mockEvent, mockContext);

    expect(response).toBeNull();
  });

  it("doesn't overwrite an existing cache-control header", async () => {
    const cacheControlHandler = () =>
      Promise.resolve({
        statusCode: OK,
        headers: {
          "cache-control": "foo",
        },
      });

    const response = await (
      middy()
        .use(cacheControlMiddleware())
        .handler(cacheControlHandler) as MiddyfiedHandler<
        APIGatewayProxyEventV2,
        Response,
        Error,
        LoggerContext
      >
    )(mockEvent, mockContext);

    expect(response.headers?.["cache-control"]).toBe("foo");
  });
});

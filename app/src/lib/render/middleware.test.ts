import { describe, expect, it } from "@jest/globals";
import middy, { MiddyfiedHandler } from "@middy/core";
import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { mock } from "jest-mock-extended";
import { StatusCodes } from "http-status-codes";

import { Logger, LoggerContext, loggerMiddleware } from "@/lib/logger";
import { JSONRendererOptions, Renderable, renderableMiddleware } from ".";

const { NOT_ACCEPTABLE, OK } = StatusCodes;

function baseHandler(): Renderable {
  return {
    render: {
      "application/json": (options: JSONRendererOptions) => {
        return Promise.resolve({
          body: options.pretty
            ? JSON.stringify({ message: "Hello, JSON!" }, null, 2)
            : JSON.stringify({ message: "Hello, JSON!" }),
        });
      },
      "text/html": () => Promise.resolve({ body: `<p>Hello, HTML!</p>` }),
      "text/plain": () => {
        return Promise.resolve({ body: "Hello, Plain Text!" });
      },
    },
  };
}

const middyHandler = middy()
  .use(loggerMiddleware())
  .use(renderableMiddleware())
  .handler(baseHandler) as MiddyfiedHandler<
  APIGatewayProxyEventV2,
  APIGatewayProxyResult & Renderable,
  Error,
  LoggerContext
>;

const loggerContext = mock<LoggerContext>();
loggerContext.logger = new Logger();

describe("Renderable Middleware", () => {
  it("renders response based on Accept header for JSON and uses the defaults for options", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2 & LoggerContext>({
      headers: {
        accept: "application/json",
      },
    });
    const response = await middyHandler(mockEvent, loggerContext);

    expect(response.statusCode).toBe(OK);
    // pretty printed because that's the default
    expect(response.body).toBe(`{
  "message": "Hello, JSON!"
}`);
    expect(response.headers?.["content-type"]).toBe(
      "application/json; charset=utf-8",
    );
  });

  it("can handle options in the query parameters", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2 & LoggerContext>({
      headers: {
        accept: "application/json",
      },
      queryStringParameters: {
        pretty: "false",
      },
    });
    const response = await middyHandler(mockEvent, loggerContext);

    expect(response.statusCode).toBe(OK);
    expect(response.body).toBe('{"message":"Hello, JSON!"}');
    expect(response.headers?.["content-type"]).toBe(
      "application/json; charset=utf-8",
    );
  });

  it("can handle a null response", async () => {
    const nullHandler = middy()
      .use(loggerMiddleware())
      .use(renderableMiddleware())
      .handler(() => null) as MiddyfiedHandler<
      APIGatewayProxyEventV2,
      null,
      Error,
      LoggerContext
    >;

    const mockEvent = mock<APIGatewayProxyEventV2>({
      headers: {
        accept: "application/json",
      },
    });

    const response = await nullHandler(mockEvent, loggerContext);

    expect(response).toBeNull();
  });

  it("returns 406 if the Accept header is missing", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>();
    const response = await middyHandler(mockEvent, loggerContext);

    expect(response.statusCode).toBe(NOT_ACCEPTABLE);
    expect(response.headers?.["content-type"]).toBe(
      "text/plain; charset=utf-8",
    );
  });

  it("returns 406 if the Accept header is not supported", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>({
      headers: {
        accept: "image/png",
      },
    });
    const response = await middyHandler(mockEvent, loggerContext);

    expect(response.statusCode).toBe(NOT_ACCEPTABLE);
  });
});

import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { BadRequest, UnprocessableContent } from "@curveball/http-errors";
import { beforeEach, describe, expect, it } from "@jest/globals";
import middy, { MiddyfiedHandler } from "@middy/core";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import axios from "axios";
import { mock } from "jest-mock-extended";
import { StatusCodes } from "http-status-codes";

import type { LoggerContext } from "@/lib/logger";
import { Logger } from "@/lib/logger";
import AxiosMockAdapter from "axios-mock-adapter";
import { GeoLocateContext, geoLocateMiddleware } from "./middleware";

const { OK } = StatusCodes;

const ddbMock = mockClient(DynamoDBDocumentClient);
ddbMock.on(GetCommand).resolves({});
ddbMock.on(PutCommand).resolves({});

let mockAxios: AxiosMockAdapter;
const mockLogger = new Logger();

const mockEvent = mock<APIGatewayProxyEventV2>({
  pathParameters: {
    lat: "47.6062",
    lon: "122.3321",
  },
  requestContext: {
    http: {
      sourceIp: "1.2.3.4",
    },
  },
});

function baseHandler(
  _event: APIGatewayProxyEventV2,
  context: GeoLocateContext,
): GeoLocateContext {
  return context;
}

const middyHandler = middy()
  .use(geoLocateMiddleware())
  .handler(baseHandler) as MiddyfiedHandler<
  APIGatewayProxyEventV2,
  GeoLocateContext,
  Error,
  LoggerContext & GeoLocateContext
>;

const geoLocateContext = mock<LoggerContext & GeoLocateContext>({
  logger: mockLogger,
});

describe("GeoLocate Middleware", () => {
  beforeEach(() => {
    mockAxios = new AxiosMockAdapter(axios);
  });

  it("can handle lat/lon in query parameters", async () => {
    mockAxios
      .onGet("https://get.geojs.io/v1/ip/geo.json?ip=1.2.3.4")
      .reply(OK, [
        {
          ip: "1.2.3.4",
          latitude: "47.6062",
          longitude: "122.3321",
        },
      ]);

    const response = await middyHandler(mockEvent, geoLocateContext);

    expect(response.geoLocate).toEqual({
      ip: "1.2.3.4",
      location: {
        latitude: 47.6062,
        longitude: 122.3321,
      },
    });
  });

  it("geolocates if lat/lon are not in query parameters", async () => {
    mockAxios
      .onGet("https://get.geojs.io/v1/ip/geo.json?ip=1.1.1.1")
      .reply(OK, [
        {
          ip: "1.1.1.1",
          latitude: "13.37",
          longitude: "313.37",
        },
      ]);

    const mockEvent = mock<APIGatewayProxyEventV2>({
      requestContext: {
        http: {
          sourceIp: "1.1.1.1",
        },
      },
    });
    mockEvent.pathParameters = {};

    const response = await middyHandler(mockEvent, geoLocateContext);

    expect(response.geoLocate).toEqual({
      ip: "1.1.1.1",
      location: expect.objectContaining({
        latitude: 13.37,
        longitude: 313.37,
      }),
    });
  });

  it("throws InternalServerError if geolocate fails", async () => {
    mockAxios
      .onGet("https://get.geojs.io/v1/ip/geo.json?ip=1.1.1.1")
      .reply(OK, [
        {
          ip: "1.1.1.1",
          latitude: "xxx",
          longitude: 313.37,
        },
      ]);

    const mockEvent = mock<APIGatewayProxyEventV2>({
      requestContext: {
        http: {
          sourceIp: "1.1.1.1",
        },
      },
    });
    mockEvent.pathParameters = {};

    await expect(middyHandler(mockEvent, geoLocateContext)).rejects.toThrow(
      UnprocessableContent,
    );
  });

  it("throws BadRequest if lat is invalid", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>({
      pathParameters: {
        lat: "invalid",
        lon: "122.3321",
      },
      requestContext: {
        http: {
          sourceIp: "1.2.3.4",
        },
      },
    });

    await expect(middyHandler(mockEvent, geoLocateContext)).rejects.toThrow(
      BadRequest,
    );
  });

  it("throws BadRequest if lon is invalid", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>({
      pathParameters: {
        lat: "47.6062",
        lon: "invalid",
      },
      requestContext: {
        http: {
          sourceIp: "1.1.1.1",
        },
      },
    });

    await expect(middyHandler(mockEvent, geoLocateContext)).rejects.toThrow(
      BadRequest,
    );
  });

  it("throws BadRequest if lat is specified but lon is not", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>({
      requestContext: {
        http: {
          sourceIp: "1.2.3.4",
        },
      },
    });
    mockEvent.pathParameters = {
      lat: "47.6062",
    };

    await expect(middyHandler(mockEvent, geoLocateContext)).rejects.toThrow(
      BadRequest,
    );
  });

  it("throws BadRequest if lon is specified but lat is not", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>({
      requestContext: {
        http: {
          sourceIp: "1.2.3.4",
        },
      },
    });
    mockEvent.pathParameters = {
      lon: "122.3321",
    };

    await expect(middyHandler(mockEvent, geoLocateContext)).rejects.toThrow(
      BadRequest,
    );
  });

  it("uses the cloudfront latitude and longitude if they are present, and doesn't call the geolocator", async () => {
    mockAxios
      .onGet("https://get.geojs.io/v1/ip/geo.json?ip=1.1.1.1")
      .reply(OK, [
        {
          ip: "1.1.1.1",
          latitude: "113.37",
          longitude: "313.37",
        },
      ]);

    const mockEvent = mock<APIGatewayProxyEventV2>({
      requestContext: {
        http: {
          sourceIp: "1.1.1.1",
        },
      },
      headers: {
        "cloudfront-viewer-latitude": "113.37",
        "cloudfront-viewer-longitude": "1313.37",
      },
    });

    const response = await middyHandler(mockEvent, geoLocateContext);

    expect(response.geoLocate).toEqual({
      ip: "1.1.1.1",
      location: {
        latitude: 113.37,
        longitude: 1313.37,
      },
    });

    expect(mockAxios.history["get"]?.length).toBe(0);
  });

  it("ignores the cloudfront headers if they are invalid", async () => {
    mockAxios
      .onGet("https://get.geojs.io/v1/ip/geo.json?ip=1.2.3.4")
      .reply(OK, [
        {
          ip: "1.2.3.4",
          latitude: "13.37",
          longitude: "313.37",
        },
      ]);

    const mockEvent = mock<APIGatewayProxyEventV2>({
      requestContext: {
        http: {
          sourceIp: "1.2.3.4",
        },
      },
      headers: {
        "cloudfront-viewer-latitude": "invalid",
        "cloudfront-viewer-longitude": "1313.37",
      },
    });

    const response = await middyHandler(mockEvent, geoLocateContext);

    expect(response.geoLocate).toEqual({
      ip: "1.2.3.4",
      location: expect.objectContaining({
        latitude: 13.37,
        longitude: 313.37,
      }),
    });
  });

  it("prefers the query parameters over the cloudfront headers", async () => {
    mockAxios
      .onGet("https://get.geojs.io/v1/ip/geo.json?ip=1.2.3.4")
      .reply(OK, [
        {
          ip: "1.2.3.4",
          latitude: "13.37",
          longitude: "313.37",
        },
      ]);

    const mockEvent = mock<APIGatewayProxyEventV2>({
      requestContext: {
        http: {
          sourceIp: "1.2.3.4",
        },
      },
      headers: {
        "cloudfront-viewer-latitude": "113.37",
        "cloudfront-viewer-longitude": "1313.37",
      },
      pathParameters: {
        lat: "47.6062",
        lon: "122.3321",
      },
    });

    const response = await middyHandler(mockEvent, geoLocateContext);

    expect(response.geoLocate).toEqual({
      ip: "1.2.3.4",
      location: {
        latitude: 47.6062,
        longitude: 122.3321,
      },
    });
  });
});

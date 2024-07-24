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
import { StatusCodes } from "http-status-codes";
import { mock } from "jest-mock-extended";

import type { LoggerContext } from "@/lib/logger";
import { Logger } from "@/lib/logger";
import AxiosMockAdapter from "axios-mock-adapter";
import {
  thirtyDays,
  GeoLocateContext,
  geoLocateMiddleware,
} from "./middleware";

const { OK, PERMANENT_REDIRECT } = StatusCodes;

const DEFAULT_TEST_IP = "1.2.3.4";

function expect_toBeDefined<T>(arg: T): asserts arg is NonNullable<T> {
  expect(arg).toBeDefined();
}

const ddbMock = mockClient(DynamoDBDocumentClient);
ddbMock.on(GetCommand).resolves({});
ddbMock.on(PutCommand).resolves({});

const mockAxios = new AxiosMockAdapter(axios);
const mockLogger = new Logger();

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

const geoLocateContext = mock<LoggerContext & GeoLocateContext>();
geoLocateContext.logger = mockLogger;

interface mockEventParts {
  sourceIp?: string;
  coords?: { lat: string; lon: string } | null;
  headers?: { [key: string]: string };
  rawQueryString?: string;
}

function createMockEvent(options: mockEventParts = {}): APIGatewayProxyEventV2 {
  const {
    sourceIp = DEFAULT_TEST_IP,
    coords = {
      lat: "13.37",
      lon: "313.37",
    },
    headers = {},
    rawQueryString = "",
  } = options;

  return Object.assign(mock<APIGatewayProxyEventV2>(), {
    requestContext: {
      http: { sourceIp },
    },
    pathParameters: coords ?? {},
    headers,
    rawPath: coords ? `/${coords.lat}/${coords.lon}` : "/",
    rawQueryString,
  });
}

function mockGeoJsResponse(latitude: string, longitude: string) {
  mockAxios
    .onGet(`https://get.geojs.io/v1/ip/geo.json?ip=${DEFAULT_TEST_IP}`)
    .reply(OK, [{ ip: DEFAULT_TEST_IP, latitude, longitude }]);
}

function expectGeoLocateResult(
  response: GeoLocateContext,
  expectedLatitude: number,
  expectedLongitude: number,
) {
  expect(response.geoLocate).toEqual({
    ip: DEFAULT_TEST_IP,
    location: {
      latitude: expectedLatitude,
      longitude: expectedLongitude,
    },
  });
}

describe("GeoLocate Middleware", () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it("geolocates if lat/lon are not in query parameters", async () => {
    mockGeoJsResponse("13.37", "313.37");
    const mockEvent = createMockEvent();
    const response = await middyHandler(mockEvent, geoLocateContext);

    expectGeoLocateResult(response, 13.37, 313.37);
  });

  it("can handle lat/lon in path parameters", async () => {
    mockGeoJsResponse("47.6062", "122.3321");
    const mockEvent = createMockEvent({
      coords: {
        lat: "47.61",
        lon: "122.33",
      },
    });

    const response = await middyHandler(mockEvent, geoLocateContext);

    expectGeoLocateResult(response, 47.61, 122.33);
  });

  it("throws UnprocessableContent if geolocate fails", async () => {
    mockAxios
      .onGet("https://get.geojs.io/v1/ip/geo.json?ip=1.1.1.1")
      .reply(OK, [{ ip: "1.1.1.1", latitude: "xxx", longitude: "313.37" }]);

    const mockEvent = createMockEvent({
      sourceIp: "1.1.1.1",
      coords: null,
    });

    await expect(middyHandler(mockEvent, geoLocateContext)).rejects.toThrow(
      UnprocessableContent,
    );
  });

  it.each<{ lat: string; lon: string }>([
    { lat: "invalid", lon: "122.3321" },
    { lat: "47.6062", lon: "invalid" },
  ])("throws BadRequest if $lat,$lon is invalid", async ({ lat, lon }) => {
    const mockEvent = createMockEvent({ coords: { lat, lon } });

    await expect(middyHandler(mockEvent, geoLocateContext)).rejects.toThrow(
      BadRequest,
    );
  });

  it.each(["lat", "lon"])(
    "throws BadRequest if $missingParam is missing but the other is present",
    async (param) => {
      const mockEvent = createMockEvent();

      expect_toBeDefined(mockEvent.pathParameters);
      mockEvent.pathParameters[param] = "";

      await expect(middyHandler(mockEvent, geoLocateContext)).rejects.toThrow(
        BadRequest,
      );
    },
  );

  it("uses the cloudfront latitude and longitude if they are present", async () => {
    const mockEvent = createMockEvent({
      coords: null,
      headers: {
        "cloudfront-viewer-latitude": "113.37",
        "cloudfront-viewer-longitude": "1313.37",
      },
    });

    const response = await middyHandler(mockEvent, geoLocateContext);

    expectGeoLocateResult(response, 113.37, 1313.37);
    expect(mockAxios.history["get"]?.length).toBe(0);
  });

  it("ignores the cloudfront headers if they are invalid", async () => {
    mockGeoJsResponse("13.37", "313.37");
    const mockEvent = createMockEvent({
      headers: {
        "cloudfront-viewer-latitude": "invalid",
        "cloudfront-viewer-longitude": "1313.37",
      },
    });

    const response = await middyHandler(mockEvent, geoLocateContext);

    expectGeoLocateResult(response, 13.37, 313.37);
  });

  it("prefers the query parameters over the cloudfront headers", async () => {
    const mockEvent = createMockEvent({
      coords: {
        lat: "47.61",
        lon: "122.33",
      },
      headers: {
        "cloudfront-viewer-latitude": "113.37",
        "cloudfront-viewer-longitude": "1313.37",
      },
    });

    const response = await middyHandler(mockEvent, geoLocateContext);

    expectGeoLocateResult(response, 47.61, 122.33);
  });

  it("truncates lat/lon to 2 decimal places", async () => {
    const mockEvent = createMockEvent({
      coords: {
        lat: "13.379",
        lon: "313.379",
      },
    });

    const result = await middyHandler(mockEvent, geoLocateContext);

    expect(result).toMatchObject({
      statusCode: PERMANENT_REDIRECT,
      headers: {
        "cache-control": `public, max-age=${thirtyDays}, immutable`,
        location: "/13.38/313.38",
      },
    });
  });

  it.each([
    { lat: "13", lon: "313" },
    { lat: "13.0", lon: "313.0" },
    { lat: "13.00", lon: "313.00" },
    { lat: "13.3", lon: "313.3" },
    { lat: "13.33", lon: "313.33" },
    { lat: "13", lon: "313.3" },
    { lat: "13.3", lon: "313" },
  ])("passes through $lat,$lon (no truncation)", async ({ lat, lon }) => {
    mockGeoJsResponse(lat, lon);
    const mockEvent = createMockEvent({ coords: { lat, lon } });

    const response = await middyHandler(mockEvent, geoLocateContext);

    expectGeoLocateResult(response, Number(lat), Number(lon));
  });
});

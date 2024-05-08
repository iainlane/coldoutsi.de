import { beforeEach, describe, expect, it } from "@jest/globals";
import { mock } from "jest-mock-extended";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Event } from "@middy/http-header-normalizer";
import { StatusCodes } from "http-status-codes";

import { Logger, LoggerContext } from "@/lib/logger";
import { GeoLocateContext } from "@/lib/geolocate";
import { GeoCodeContext } from "@/lib/geocode";
import { OpenWeatherMapClient } from "@/lib/open-weather-map";
import { formatString } from "@/lib/weather";
import {
  geoCodeHandlerFactory,
  reverseGeocodeHandlerFactory,
} from "@/lib/handler-factory";
import oneCall from "./testdata/onecall.json";
import { createHandler } from "./weather";

const { BAD_REQUEST, OK, UNPROCESSABLE_ENTITY } = StatusCodes;

const mockAxios = new AxiosMockAdapter(axios);

const ddbMock = mockClient(DynamoDBDocumentClient);
ddbMock.on(GetCommand).resolves({});
ddbMock.on(PutCommand).resolves({});

function createClient(logger: Logger): OpenWeatherMapClient {
  return new OpenWeatherMapClient(
    "test-api-key",
    logger.createChild({
      persistentLogAttributes: {
        service: "openweathermap",
      },
    }),
  );
}

const handler = createHandler(createClient);

const weatherHandler = geoCodeHandlerFactory(handler);
const reverseWeatherHandler = reverseGeocodeHandlerFactory(handler);

function mockGeoJsResponse() {
  mockAxios.onGet("https://get.geojs.io/v1/ip/geo.json?ip=1.1.1.1").reply(OK, [
    {
      ip: "1.1.1.1",
      latitude: "0.12345",
      longitude: "0.98765",
      city: "Sample City",
    },
  ]);
}

describe("reverseWeatherHandler", () => {
  const mockEvent = mock<APIGatewayProxyEventV2 & Event>({
    headers: {
      accept: "text/plain",
    },
    requestContext: {
      http: {
        sourceIp: "1.1.1.1",
        path: "/0.12/0.98",
      },
    },
  });

  beforeEach(() => {
    mockAxios.reset();

    mockGeoJsResponse();

    mockAxios
      .onGet(
        "https://nominatim.openstreetmap.org/reverse?lat=0.12&lon=0.99&format=geocodejson&addressdetails=1&accept-language=en&zoom=15&layer=address",
      )
      .reply(OK, {
        features: [
          {
            properties: {
              geocoding: {
                city: "Sample City",
              },
            },
          },
        ],
      });
  });

  it("returns weather", async () => {
    mockAxios
      .onGet(
        "https://api.openweathermap.org/data/3.0/onecall?lat=0.12&lon=0.99&appid=test-api-key&units=metric",
      )
      .reply(OK, oneCall);

    const mockContext = mock<
      LoggerContext & GeoLocateContext & GeoCodeContext
    >();

    const colouredString = formatString(
      "ansi",
      ({ greenBright }) =>
        `☁️ 27.3(30.5)°C, Wind ${greenBright("3.09")}–${greenBright("3.02")} m/s ↓\n`,
    );

    await expect(
      reverseWeatherHandler(mockEvent, mockContext),
    ).resolves.toEqual({
      body: colouredString,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
      statusCode: OK,
    });
  });

  it("returns Unprocessable Content (422) when OpenWeatherMapError is thrown", async () => {
    mockAxios.onGet().reply(BAD_REQUEST);

    const mockContext = mock<
      LoggerContext & GeoLocateContext & GeoCodeContext
    >();

    await expect(
      reverseWeatherHandler(mockEvent, mockContext),
    ).resolves.toEqual({
      statusCode: UNPROCESSABLE_ENTITY,
      body: "Failed to fetch weather data: Request failed with status code 400",
      headers: {
        "Content-Type": "text/plain",
      },
    });
  });
});

describe("weatherHandler", () => {
  const mockEvent = mock<APIGatewayProxyEventV2 & Event>({
    headers: {
      accept: "text/plain",
    },
    pathParameters: {
      location: "Garden Of Eden",
    },
    requestContext: {
      http: {
        sourceIp: "1.1.1.1",
      },
    },
  });

  beforeEach(() => {
    mockEvent.queryStringParameters = {};

    mockAxios.reset();

    mockGeoJsResponse();

    mockAxios
      .onGet(
        "https://nominatim.openstreetmap.org/search?q=Garden+Of+Eden&format=geocodejson&limit=1&addressdetails=1&accept-language=en&layer=address",
      )
      .reply(OK, {
        features: [
          {
            properties: {
              geocoding: {
                city: "Garden Of Eden",
              },
            },
            geometry: {
              type: "Point",
              coordinates: [1.123456, 1.987654],
            },
          },
        ],
      });
  });

  it("returns weather", async () => {
    mockAxios
      .onGet(
        "https://api.openweathermap.org/data/3.0/onecall?lat=1.99&lon=1.12&appid=test-api-key&units=metric",
      )
      .reply(OK, oneCall);

    const mockContext = mock<
      LoggerContext & GeoLocateContext & GeoCodeContext
    >();

    const colouredString = formatString(
      "ansi",
      ({ greenBright }) =>
        `☁️ 27.3(30.5)°C, Wind ${greenBright("3.09")}–${greenBright("3.02")} m/s ↓\n`,
    );

    await expect(weatherHandler(mockEvent, mockContext)).resolves.toEqual({
      body: colouredString,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
      statusCode: OK,
    });
  });

  it("returns imperial units if requested", async () => {
    mockAxios
      .onGet(
        "https://api.openweathermap.org/data/3.0/onecall?lat=1.99&lon=1.12&appid=test-api-key&units=metric",
      )
      .reply(OK, oneCall);

    const mockContext = mock<
      LoggerContext & GeoLocateContext & GeoCodeContext
    >();

    const colouredString = formatString(
      "ansi",
      ({ greenBright }) =>
        `☁️ 81.1(86.9)°F, Wind ${greenBright("6.91")}–${greenBright("6.76")} mph ↓\n`,
    );

    const mockEventImperial = mockEvent;
    mockEventImperial.queryStringParameters = {
      units: "imperial",
    };

    await expect(
      weatherHandler(mockEventImperial, mockContext),
    ).resolves.toEqual({
      body: colouredString,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
      statusCode: OK,
    });
  });

  it("returns Bad Request (400) when invalid units are requested", async () => {
    const mockContext = mock<
      LoggerContext & GeoLocateContext & GeoCodeContext
    >();

    const mockEventInvalidUnits = mockEvent;
    mockEventInvalidUnits.queryStringParameters = {
      units: "invalid",
    };

    await expect(
      weatherHandler(mockEventInvalidUnits, mockContext),
    ).resolves.toMatchObject({
      statusCode: BAD_REQUEST,
    });
  });

  it("returns Unprocessable Content (422) when OpenWeatherMapError is thrown", async () => {
    mockAxios.onGet().reply(BAD_REQUEST);

    const mockContext = mock<
      LoggerContext & GeoLocateContext & GeoCodeContext
    >();

    await expect(weatherHandler(mockEvent, mockContext)).resolves.toMatchObject(
      {
        statusCode: UNPROCESSABLE_ENTITY,
      },
    );
  });
});

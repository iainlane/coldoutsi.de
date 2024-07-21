import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  BadRequest,
  NotFound,
  UnprocessableContent,
} from "@curveball/http-errors";
import { beforeEach, describe, expect, it } from "@jest/globals";
import middy from "@middy/core";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { StatusCodes } from "http-status-codes";
import { mock, mockReset } from "jest-mock-extended";

import { GeoLocateContext } from "@/lib/geolocate";
import { Logger, LoggerContext } from "@/lib/logger";
import {
  GeoCodeContext,
  GeoCodeData,
  geoCodeMiddleware,
  reverseGeoCodeMiddleware,
} from ".";

const { BAD_REQUEST, OK } = StatusCodes;

const ddbMock = mockClient(DynamoDBDocumentClient);
ddbMock.on(GetCommand).resolves({});
ddbMock.on(PutCommand).resolves({});

let mockAxios: AxiosMockAdapter;
const mockLogger = new Logger();

function baseHandler(
  _event: APIGatewayProxyEventV2,
  context: GeoCodeContext,
): GeoCodeData {
  return context.geoCode;
}

describe("Reverse GeoCode Middleware", () => {
  const middyHandler = middy()
    .use(reverseGeoCodeMiddleware())
    .handler(baseHandler) as middy.MiddyfiedHandler<
    APIGatewayProxyEventV2,
    GeoCodeData,
    Error,
    LoggerContext & GeoLocateContext & GeoCodeContext
  >;

  const geoLocateContext = mock<
    LoggerContext & GeoCodeContext & GeoLocateContext
  >({
    geoLocate: {
      ip: "1.1.1.1",
      location: {
        latitude: 1.23456,
        longitude: 9.87654,
      },
    },
  });
  geoLocateContext.logger = mockLogger;

  beforeEach(() => {
    mockAxios = new AxiosMockAdapter(axios);
  });

  it("reverse geocodes", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>();

    mockAxios
      .onGet(
        "https://nominatim.openstreetmap.org/reverse?lat=1.23&lon=9.88&format=geocodejson&addressdetails=1&accept-language=en&zoom=15&layer=address",
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

    const result = await middyHandler(mockEvent, geoLocateContext);

    expect(result.city).toBe("Sample City");
    expect(result.latitude).toBe(1.23);
    expect(result.longitude).toBe(9.88);
  });

  it("returns the lat/lon if the address can't be found", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>();

    mockAxios.onGet().reply(OK, {
      features: [],
    });

    const result = await middyHandler(mockEvent, geoLocateContext);

    expect(result).toEqual(
      // These get rounded inside `GeoCodeData`
      new GeoCodeData({
        latitude: 1.23456,
        longitude: 9.87654,
      }),
    );
  });

  it("returns the lat/lon if the request fails", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>();

    mockAxios.onGet().reply(BAD_REQUEST);

    const result = await middyHandler(mockEvent, geoLocateContext);

    expect(result.latitude).toBe(1.23);
    expect(result.longitude).toBe(9.88);
  });
});

describe("Geocode Middleware", () => {
  const middyHandler = middy()
    .use(geoCodeMiddleware())
    .handler(baseHandler) as middy.MiddyfiedHandler<
    APIGatewayProxyEventV2,
    GeoCodeData,
    Error,
    LoggerContext & GeoCodeContext
  >;

  const geoLocateContext = mock<LoggerContext & GeoCodeContext>({
    geoCode: {},
  });
  geoLocateContext.logger = mockLogger;

  beforeEach(() => {
    mockAxios = new AxiosMockAdapter(axios);
    mockReset(geoLocateContext);
  });

  it("geocodes", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>({
      pathParameters: {
        location: "Sample Location",
      },
    });

    mockAxios
      .onGet(
        "https://nominatim.openstreetmap.org/search?q=Sample+Location&format=geocodejson&limit=1&addressdetails=1&accept-language=en&layer=address",
      )
      .reply(OK, {
        features: [
          {
            properties: {
              geocoding: {
                city: "Sample City",
              },
            },
            geometry: {
              type: "Point",
              coordinates: [1, 1],
            },
          },
        ],
      });

    const result = await middyHandler(mockEvent, geoLocateContext);

    expect(result).toMatchObject({
      city: "Sample City",
    });
  });

  it("throws an error if called with no location path parameter", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>();

    await expect(middyHandler(mockEvent, geoLocateContext)).rejects.toThrow(
      BadRequest,
    );
  });

  it("throws an error if called with empty location path parameter", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>({
      pathParameters: {
        location: "",
      },
    });

    await expect(middyHandler(mockEvent, geoLocateContext)).rejects.toThrow(
      BadRequest,
    );
  });

  it("throws BadRequest if no path parameters", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>();
    delete mockEvent.pathParameters;

    await expect(middyHandler(mockEvent, geoLocateContext)).rejects.toThrow(
      BadRequest,
    );
  });

  it("throws an Unproccessable Content error if the request fails", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>({
      pathParameters: {
        location: "Sample Location",
      },
    });

    mockAxios.onGet().reply(BAD_REQUEST);

    await expect(middyHandler(mockEvent, geoLocateContext)).rejects.toThrow(
      UnprocessableContent,
    );
  });

  it("throws an error if the location is invalid", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>({
      pathParameters: {
        location: "Sample Location",
      },
    });

    mockAxios.onGet().reply(OK, {
      features: [],
    });

    await expect(middyHandler(mockEvent, geoLocateContext)).rejects.toThrow(
      NotFound,
    );
  });

  it("throws an error if Nominatim returns bad data", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>({
      pathParameters: {
        location: "Sample Location",
      },
    });

    mockAxios.onGet().reply(OK, {
      features: [
        {
          properties: {
            geocoding: {},
          },
        },
      ],
    });

    await expect(middyHandler(mockEvent, geoLocateContext)).rejects.toThrow(
      UnprocessableContent,
    );
  });
});

import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { describe, expect, it } from "@jest/globals";
import middy from "@middy/core";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import {
  BadRequest,
  InternalServerError,
  NotFound,
} from "@curveball/http-errors";
import { mock, mockReset } from "jest-mock-extended";

import {
  GeoCodeContext,
  GeoCodeData,
  geoCodeMiddleware,
  reverseGeoCodeMiddleware,
} from ".";
import { GeoLocateContext } from "@/lib/geolocate";
import { Logger, LoggerContext } from "@/lib/logger";

const ddbMock = mockClient(DynamoDBDocumentClient);
ddbMock.on(GetCommand).resolves({});
ddbMock.on(PutCommand).resolves({});

let mockAxios: AxiosMockAdapter;
const mockLogger = new Logger();

async function baseHandler(
  _event: APIGatewayProxyEventV2,
  context: GeoCodeContext,
): Promise<GeoCodeData> {
  const gc = context.geoCode;

  return Promise.resolve(gc);
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
    logger: mockLogger,
    geoLocate: {
      ip: "1.1.1.1",
      location: {
        latitude: 1,
        longitude: 1,
      },
    },
  });

  beforeEach(() => {
    mockAxios = new AxiosMockAdapter(axios);
  });

  it("reverse geocodes", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>();

    mockAxios
      .onGet(
        "https://nominatim.openstreetmap.org/reverse?lat=1&lon=1&format=geocodejson&addressdetails=1&accept-language=en&zoom=15&layer=address",
      )
      .reply(200, {
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

    expect(result).toEqual(
      expect.objectContaining({
        city: "Sample City",
        latitude: 1,
        longitude: 1,
      }),
    );
  });

  it("returns the lat/lon if the address can't be found", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>();

    const geoLocateContext = mock<
      LoggerContext & GeoCodeContext & GeoLocateContext
    >({
      logger: mockLogger,
      geoLocate: {
        ip: "1.1.1.1",
        location: {
          latitude: 1,
          longitude: 1,
        },
      },
    });

    mockAxios.onGet().reply(200, {
      features: [],
    });

    const result = await middyHandler(mockEvent, geoLocateContext);

    expect(result).toEqual({
      latitude: 1,
      longitude: 1,
    });
  });

  it("throws an error if the request fails", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>();

    mockAxios.onGet().reply(500);

    await expect(middyHandler(mockEvent, geoLocateContext)).rejects.toThrow(
      InternalServerError,
    );
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
    logger: mockLogger,
    geoCode: {},
  });

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
      .reply(200, {
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

    expect(result).toEqual(
      expect.objectContaining({
        city: "Sample City",
      }),
    );
  });

  it("throws an error if called with no location path parameter", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>();

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

  it("throws an error if the request fails", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>({
      pathParameters: {
        location: "Sample Location",
      },
    });

    mockAxios.onGet().reply(500);

    await expect(middyHandler(mockEvent, geoLocateContext)).rejects.toThrow(
      InternalServerError,
    );
  });

  it("throws an error if the location is invalid", async () => {
    const mockEvent = mock<APIGatewayProxyEventV2>({
      pathParameters: {
        location: "Sample Location",
      },
    });

    mockAxios.onGet().reply(200, {
      features: [],
    });

    await expect(middyHandler(mockEvent, geoLocateContext)).rejects.toThrow(
      NotFound,
    );
  });
});

import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { beforeEach, describe, expect, it } from "@jest/globals";
import { mockClient } from "aws-sdk-client-mock";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { StatusCodes } from "http-status-codes";
import { any, mock, mockClear, mockFn } from "jest-mock-extended";

import { GeoCodeContext, GeoCodeData } from "@/lib/geocode";
import { GeoLocateContext } from "@/lib/geolocate/middleware";
import { Logger, LoggerContext } from "@/lib/logger";
import { NotFound } from "@curveball/http-errors";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
  Handler,
  HttpContentNegotiationEvent,
  HttpHeaderNormalizerEvent,
  geoCodeHandlerFactory,
  reverseGeocodeHandlerFactory,
} from ".";

const { NOT_FOUND, INTERNAL_SERVER_ERROR, OK } = StatusCodes;

const ddbMock = mockClient(DynamoDBDocumentClient);
ddbMock.on(GetCommand).resolves({});
ddbMock.on(PutCommand).resolves({});

const mockAxios = new AxiosMockAdapter(axios);

mockAxios
  .onGet(new RegExp(`https://get.geojs.io/v1/ip/geo.json?.*`))
  .reply(OK, [
    {
      ip: "1.1.1.1",
      latitude: "51.12345",
      longitude: "-96.98765",
    },
  ]);

mockAxios
  .onGet(new RegExp(`https://nominatim.openstreetmap.org/reverse?.*`))
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

mockAxios
  .onGet(new RegExp(`https://nominatim.openstreetmap.org/search?.*`))
  .reply(OK, {
    features: [
      {
        properties: {
          geocoding: {
            name: "My Cool City",
          },
        },
        geometry: {
          type: "Point",
          coordinates: [313.368, 13.369],
        },
      },
    ],
  });

describe("handler factory", () => {
  const httpEvent = mock<
    APIGatewayProxyEventV2 &
      HttpHeaderNormalizerEvent &
      HttpContentNegotiationEvent
  >({
    version: "2.0",
    headers: {
      Accept: "application/json",
    },
    requestContext: {
      http: {
        method: "GET",
      },
    },
  });

  let ctx: GeoCodeContext & GeoLocateContext & LoggerContext;
  const baseHandler =
    mockFn<
      Handler<
        APIGatewayProxyEventV2 & HttpContentNegotiationEvent,
        APIGatewayProxyResultV2
      >
    >();
  baseHandler
    .calledWith(any(), any(), any())
    .mockResolvedValue<APIGatewayProxyResultV2>({
      statusCode: OK,
      body: "Success",
    });

  beforeEach(() => {
    mockClear(baseHandler);
    ctx = mock<GeoCodeContext & GeoLocateContext & LoggerContext>({
      logger: mock<Logger>(),
    });
  });

  it("returns correct response on successful invocation", async () => {
    const handler = reverseGeocodeHandlerFactory(baseHandler);
    const response = await handler(httpEvent, ctx);

    expect(response).toMatchObject({ statusCode: OK, body: "Success" });
  });

  it("can return other status codes in the statusCode field", async () => {
    const notFoundHandler =
      mockFn<
        Handler<
          APIGatewayProxyEventV2 & HttpContentNegotiationEvent,
          APIGatewayProxyResultV2
        >
      >();
    notFoundHandler.calledWith(any(), any(), any()).mockResolvedValue({
      statusCode: NOT_FOUND,
      body: "Not found",
    });
    const handler = reverseGeocodeHandlerFactory(notFoundHandler);
    const response = await handler(httpEvent, ctx);

    expect(response).toMatchObject({
      statusCode: NOT_FOUND,
      body: "Not found",
    });
  });

  it("can return status codes thrown by @curveball/http-errors", async () => {
    const notFoundHandler =
      mockFn<
        Handler<
          APIGatewayProxyEventV2 & HttpContentNegotiationEvent,
          APIGatewayProxyResultV2
        >
      >();
    notFoundHandler
      .calledWith(any(), any(), any())
      .mockRejectedValue(new NotFound("Not found"));

    const handler = reverseGeocodeHandlerFactory(notFoundHandler);
    const response = await handler(httpEvent, ctx);

    expect(response).toMatchObject({
      statusCode: NOT_FOUND,
      body: "Not found",
    });
  });

  it("returns error response", async () => {
    const error = {
      statusCode: INTERNAL_SERVER_ERROR,
      expose: true,
      message: "Hello from the test",
    };
    const errorHandler =
      mockFn<
        Handler<
          APIGatewayProxyEventV2 & HttpContentNegotiationEvent,
          APIGatewayProxyResultV2
        >
      >();
    errorHandler.calledWith(any(), any(), any()).mockRejectedValue(error);

    const handler = reverseGeocodeHandlerFactory(errorHandler);

    const result = await handler(httpEvent, ctx).catch((err: unknown) => err);
    expect(result).toMatchObject({
      statusCode: INTERNAL_SERVER_ERROR,
      body: "Hello from the test",
    });
  });

  it("reverse geocodes", async () => {
    const geocodeHandler =
      mockFn<
        Handler<
          APIGatewayProxyEventV2 & HttpContentNegotiationEvent,
          GeoCodeData
        >
      >();
    geocodeHandler
      .calledWith(any(), any(), any())
      .mockImplementation(
        async (
          _event: APIGatewayProxyEventV2 & HttpContentNegotiationEvent,
          context: GeoCodeContext,
        ) => {
          return Promise.resolve(context.geoCode);
        },
      );

    const handler = reverseGeocodeHandlerFactory(geocodeHandler);

    const result = await handler(httpEvent, ctx);

    expect(result).toMatchObject({
      body: { city: "Sample City" },
    });
  });

  it("geocodes", async () => {
    const pathEvent = mock<
      APIGatewayProxyEventV2 &
        HttpHeaderNormalizerEvent &
        HttpContentNegotiationEvent
    >({
      version: "2.0",
      headers: {
        Accept: "application/json",
      },
      pathParameters: {
        location: "Cool City",
      },
      requestContext: {
        http: {
          method: "GET",
        },
      },
    });

    const geocodeHandler =
      mockFn<
        Handler<
          APIGatewayProxyEventV2 & HttpContentNegotiationEvent,
          GeoCodeData
        >
      >();
    geocodeHandler
      .calledWith(any(), any(), any())
      .mockImplementation(
        async (
          _event: APIGatewayProxyEventV2 & HttpContentNegotiationEvent,
          context: GeoCodeContext,
        ) => {
          return Promise.resolve(context.geoCode);
        },
      );

    const handler = geoCodeHandlerFactory(geocodeHandler);

    const result = await handler(pathEvent, ctx);

    expect(result).toMatchObject({
      body: {
        name: "My Cool City",
        latitude: 13.37,
        longitude: 313.37,
      },
    });
  });
});

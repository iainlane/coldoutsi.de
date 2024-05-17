import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { mock } from "jest-mock-extended";
import { StatusCodes } from "http-status-codes";

import { GeoLocateError, geoLocator } from ".";
import type { Logger } from "@/lib/logger";

const { BAD_REQUEST, OK } = StatusCodes;

const ddbMock = mockClient(DynamoDBDocumentClient);

const mockAxios = new AxiosMockAdapter(axios);
const mockLogger = mock<Logger>();

beforeEach(() => {
  ddbMock.reset();
  mockAxios.reset();
});

afterEach(() => {
  jest.clearAllMocks();
  mockAxios.reset();
});

describe("geoLocator", () => {
  it("should return geo data and save in cache", async () => {
    ddbMock.on(GetCommand).resolvesOnce({});

    mockAxios.onGet().reply(OK, [
      {
        ip: "1.1.1.1",
        latitude: "51.1",
        longitude: "-96.1",
        city: "Sample City",
      },
    ]);

    ddbMock.on(PutCommand).resolvesOnce({});

    const geoData = await geoLocator({ ip: "1.1.1.1" }, mockLogger);

    expect(geoData).toEqual({
      ip: "1.1.1.1",
      location: {
        ip: "1.1.1.1",
        city: "Sample City",
        latitude: 51.1,
        longitude: -96.1,
      },
    });

    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
  });

  it("should return cached geo data if available", async () => {
    const cachedData = {
      location: {
        latitude: 51.1,
        longitude: -96.1,
      },
    };

    ddbMock.on(GetCommand).resolvesOnce({
      Item: cachedData,
    });

    const geoData = await geoLocator({ ip: "1.1.1.1" }, mockLogger);

    expect(geoData).toEqual({
      ip: "1.1.1.1",
      location: cachedData.location,
    });

    // ... and the axios mock (remote serivce) wasn't called, because we used
    // the cache
    expect(mockAxios.history["get"]).toHaveLength(0);
  });

  it("should throw GeoLocateError if no geo data", async () => {
    ddbMock.on(GetCommand).resolvesOnce({});

    mockAxios.onGet().reply(OK, []);

    await expect(geoLocator({ ip: "1.1.1.1" }, mockLogger)).rejects.toThrow(
      GeoLocateError,
    );

    // ... and the cache wasn't updated, because there was no geo data
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(0);
  });

  it("should throw GeoLocateError if no lat/lon", async () => {
    ddbMock.on(GetCommand).resolvesOnce({});

    mockAxios.onGet().reply(OK, [
      {
        ip: "1.1.1.1",
        city: "Sample City",
      },
    ]);

    await expect(geoLocator({ ip: "1.1.1.1" }, mockLogger)).rejects.toThrow(
      GeoLocateError,
    );

    // ... and the cache wasn't updated, because there was no geo data
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(0);
  });

  it("should throw GeoLocateError if invalid lat", async () => {
    ddbMock.on(GetCommand).resolvesOnce({});

    mockAxios.onGet().reply(OK, [
      {
        ip: "1.1.1.1",
        latitude: "invalid",
        longitude: "-96.1",
        city: "Sample City",
      },
    ]);

    await expect(geoLocator({ ip: "1.1.1.1" }, mockLogger)).rejects.toThrow(
      GeoLocateError,
    );

    // ... and the cache wasn't updated, because there was no geo data
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(0);
  });

  it("should throw GeoLocateError if invalid lon", async () => {
    ddbMock.on(GetCommand).resolvesOnce({});

    mockAxios.onGet().reply(OK, [
      {
        ip: "1.1.1.1",
        latitude: "51.1",
        longitude: "invalid",
        city: "Sample City",
      },
    ]);

    await expect(geoLocator({ ip: "1.1.1.1" }, mockLogger)).rejects.toThrow(
      GeoLocateError,
    );

    // ... and the cache wasn't updated, because there was no geo data
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(0);
  });

  it("should throw GeoLocateError if axios error", async () => {
    ddbMock.on(GetCommand).resolvesOnce({});

    mockAxios.onGet().reply(BAD_REQUEST);

    await expect(geoLocator({ ip: "1.2.3.4" }, mockLogger)).rejects.toThrow(
      GeoLocateError,
    );
  });

  it.each<{ ip: string }>([{ ip: "127.0.0.1" }, { ip: "::1" }])(
    "should return default location if localhost ($ip)",
    async (ip) => {
      ddbMock.on(GetCommand).resolvesOnce({});

      const geoData = await geoLocator(ip, mockLogger);

      expect(geoData).toEqual({
        ...ip,
        location: {
          latitude: 51.4779,
          longitude: 0,
        },
      });

      // ... and this one was cached
      expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
    },
  );
});

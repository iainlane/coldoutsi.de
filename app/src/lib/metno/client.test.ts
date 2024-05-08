import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
} from "@aws-sdk/lib-dynamodb";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { mockClient } from "aws-sdk-client-mock";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { StatusCodes } from "http-status-codes";

import { GeoCodeData } from "@/lib/geocode";
import { Logger } from "@/lib/logger";

import { MetnoClient } from ".";
import { CacheEntry, MetnoError, MetnoInvalidDataError } from "./client";
import emptyResp from "./testdata/empty.json";
import greenwichResp from "./testdata/greenwich.json";
import singleResp from "./testdata/single.json";

const { NOT_MODIFIED, OK } = StatusCodes;

const ddbMock = mockClient(DynamoDBDocumentClient);

const kvStore = new Map();

ddbMock.on(PutCommand).callsFake((params: PutCommandInput) => {
  const item = params.Item;

  if (item === undefined) {
    return {};
  }

  const keyValue = item["weatherHash"] as unknown;

  if (keyValue === undefined || typeof keyValue !== "string") {
    return {};
  }

  kvStore.set(keyValue, params.Item);
  return {};
});

ddbMock.on(GetCommand).callsFake((params: GetCommandInput) => {
  const key = params.Key?.["weatherHash"] as unknown;

  if (key === undefined || typeof key !== "string") {
    return {};
  }

  const value = kvStore.get(key) as CacheEntry | undefined;

  if (!value) {
    return {};
  }

  return {
    Item: value,
  };
});

const logger = new Logger();
const mockAxios = new AxiosMockAdapter(axios);

const greenwich = new GeoCodeData({
  latitude: 51.477,
  longitude: 0,
});

describe("met.no client happy paths", () => {
  beforeAll(() => {
    jest.useFakeTimers({
      now: 0,
    });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    kvStore.clear();
    ddbMock.resetHistory();
    mockAxios.reset();

    mockAxios
      .onGet(
        "https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=51.48&lon=0",
      )
      .reply(OK, greenwichResp, {
        expires: "Thu, 01 Jan 1970 00:00:30 GMT",
        "last-modified": "Thu, 01 Jan 1970 00:00:00 GMT",
      });
  });

  it("returns weather", async () => {
    const client = new MetnoClient(logger);

    expect(kvStore.size).toBe(0);

    const weather = await client.getRawWeather(greenwich);
    expect(weather).toEqual(greenwichResp);
    expect(kvStore.size).toBe(1);
  });

  it("converts weather to imperial", async () => {
    const client = new MetnoClient(logger);

    const weather = await client.getWeather("imperial", greenwich);

    expect(weather.location).toEqual(greenwich);

    expect(weather.current.temp.temperature).toBe(44.6); // 7.0°C  = 44.6°F
    expect(weather.current.wind.speed).toBe(4.47388); // 2.0 m/s = 4.47388 mph

    expect(weather.hourly[0]?.temp.temperature).toBe(44.4);
    expect(weather.daily[0]?.temp.max.temperature).toBe(59);

    expect(kvStore.size).toBe(1);
    expect(mockAxios.history["get"]).toHaveLength(1);
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
  });

  it("returns weather from cache", async () => {
    const client = new MetnoClient(logger);

    expect(kvStore.size).toBe(0);

    let weather = await client.getRawWeather(greenwich);
    expect(weather).toEqual(greenwichResp);

    // Get it again
    weather = await client.getRawWeather(greenwich);

    expect(weather).toEqual(greenwichResp);
    expect(kvStore.size).toBe(1);
    expect(mockAxios.history["get"]).toHaveLength(1);
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
  });

  it("respects Expires header", async () => {
    const client = new MetnoClient(logger);

    expect(kvStore.size).toBe(0);

    let weather = await client.getRawWeather(greenwich);
    expect(weather).toEqual(greenwichResp);

    // This one comes from the cache
    weather = await client.getRawWeather(greenwich);
    expect(weather).toEqual(greenwichResp);
    expect(mockAxios.history["get"]).toHaveLength(1);

    // Move time forward by 31 minutes to make the cache entry expire
    jest.advanceTimersByTime(31 * 60 * 1000);

    mockAxios.resetHandlers();
    mockAxios.onGet().replyOnce((config) => {
      expect(config.headers?.["If-Modified-Since"]).toEqual(
        "Thu, 01 Jan 1970 00:00:00 GMT",
      );

      // Not changed yet, now expires a bit later
      return [
        NOT_MODIFIED,
        "",
        {
          expires: "Thu, 01 Jan 1970 01:00:00 GMT",
          "last-modified": "Thu, 01 Jan 1970 00:00:00 GMT",
        },
      ];
    });

    weather = await client.getRawWeather(greenwich);

    expect(weather).toEqual(greenwichResp);
    expect(mockAxios.history["get"]).toHaveLength(2);

    // Wait 5 minutes, cache should still be valid
    jest.advanceTimersByTime(5 * 60 * 1000);

    weather = await client.getRawWeather(greenwich);
    expect(weather).toEqual(greenwichResp);
    expect(mockAxios.history["get"]).toHaveLength(2);

    expect(ddbMock.commandCalls(GetCommand)).toHaveLength(4);
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(2);
  });

  it("groups hourly and daily data", async () => {
    const client = new MetnoClient(logger);

    const weather = await client.getWeather("metric", greenwich);

    expect(weather.hourly).toHaveLength(48);
    expect(weather.daily).toHaveLength(7);
  });
});

describe("met.no client error paths", () => {
  beforeEach(() => {
    kvStore.clear();
    ddbMock.resetHistory();
    mockAxios.reset();
  });

  it("throws on HTTP error", async () => {
    mockAxios.onGet().reply(500);

    const client = new MetnoClient(logger);

    await expect(client.getRawWeather(greenwich)).rejects.toThrow(MetnoError);
    // We retried, no new requests happened
    expect(mockAxios.history["get"]?.length).toBeGreaterThan(1);
  });

  it("throws on network error", async () => {
    mockAxios.onGet().networkError();

    const client = new MetnoClient(logger);

    await expect(client.getRawWeather(greenwich)).rejects.toThrow(MetnoError);
    // We retried, so new requests happened
    expect(mockAxios.history["get"]?.length).toBeGreaterThan(1);
  });

  it("throws if no data", async () => {
    mockAxios
      .onGet(
        "https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=0&lon=0",
      )
      .reply(OK, emptyResp, {
        expires: "Thu, 01 Jan 1970 00:00:30 GMT",
        "last-modified": "Thu, 01 Jan 1970 00:00:00 GMT",
      });

    const client = new MetnoClient(logger);

    const location = new GeoCodeData({
      latitude: 0,
      longitude: 0,
    });

    await expect(client.getWeather("metric", location)).rejects.toThrow(
      MetnoInvalidDataError,
    );
  });

  it("throws if only one datapoint", async () => {
    mockAxios
      .onGet(
        "https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=0&lon=0",
      )
      .reply(OK, singleResp, {
        expires: "Thu, 01 Jan 1970 00:00:30 GMT",
        "last-modified": "Thu, 01 Jan 1970 00:00:00 GMT",
      });

    const client = new MetnoClient(logger);

    const location = new GeoCodeData({
      latitude: 0,
      longitude: 0,
    });

    await expect(client.getWeather("metric", location)).rejects.toThrow(
      MetnoInvalidDataError,
    );
  });
});

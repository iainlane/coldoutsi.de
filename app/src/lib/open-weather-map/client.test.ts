import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { beforeEach, describe, expect, it } from "@jest/globals";
import { mockClient } from "aws-sdk-client-mock";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { StatusCodes } from "http-status-codes";

import { Logger } from "@/lib/logger";
import { InvalidWindDirectionError } from "../weather";
import {
  OpenWeatherMapClient,
  OpenWeatherMapError,
  rawWeatherResponse,
} from ".";
import { GeoCodeData } from "../geocode";

const { BAD_REQUEST, OK } = StatusCodes;

const mockLogger = new Logger();

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

  const value = kvStore.get(key) as rawWeatherResponse | undefined;

  if (!value) {
    return {};
  }

  return {
    Item: value,
  };
});

function expect_toBeDefined<T>(arg: T): asserts arg is NonNullable<T> {
  expect(arg).toBeDefined();
}

describe("OpenWeatherMapClient", () => {
  const mockResponseBase = {
    lat: 0,
    lon: 0,
    current: {
      dt: 1618317040,
      sunrise: 1618297584,
      sunset: 1618346395,
      temp: 20,
      feels_like: 19.85,
      pressure: 1012,
      humidity: 64,
      clouds: 0,
      visibility: 10000,
      wind_gust: 1.13,
      wind_speed: 2.57,
      wind_deg: 320,
      weather: [{ id: 800 }],
    },
    hourly: [],
    daily: [],
  } satisfies rawWeatherResponse;

  const mockAxios = new AxiosMockAdapter(axios);
  const client = new OpenWeatherMapClient("testapikey", mockLogger);

  beforeEach(() => {
    ddbMock.resetHistory();
    kvStore.clear();
    mockAxios.reset();
  });

  it("caches both metric and imperial variants", async () => {
    mockAxios.onGet().reply((req) => {
      expect_toBeDefined(req.url);
      const url = new URL(req.url);

      expect(url.searchParams.get("lat")).toBe("0");
      expect(url.searchParams.get("lon")).toBe("0");
      expect(url.searchParams.get("units")).toBe("metric");
      expect(url.searchParams.get("appid")).toBe("testapikey");

      return [OK, mockResponseBase];
    });

    const client = new OpenWeatherMapClient("testapikey", mockLogger);
    const weather = await client.getWeather(
      "metric",
      new GeoCodeData({
        latitude: 0,
        longitude: 0,
      }),
    );

    expect(weather.current.temp.temperature).toBe(20);
    expect(weather.current.wind.speed).toBe(2.57);
    expect(weather.location).toEqual(
      new GeoCodeData({ latitude: 0, longitude: 0 }),
    );

    const imperialWeather = await client.getWeather(
      "imperial",
      new GeoCodeData({
        latitude: 0,
        longitude: 0,
      }),
    );

    expect(imperialWeather.current.temp.temperature).toBe(68);
    expect(weather.current.wind.speed).toBe(2.57);
    expect(weather.location).toEqual(
      new GeoCodeData({ latitude: 0, longitude: 0 }),
    );

    expect(mockAxios.history["get"]).toHaveLength(1);
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
  });

  it("returns cached data", async () => {
    const mockResp = {
      lat: 1337,
      lon: 1337,
      current: {
        humidity: 1337,
        clouds: 1337,
        wind_speed: 1337,
        wind_deg: 13.37,
        wind_gust: 1337,
        weather: [],
        temp: 1337,
        feels_like: 1337,
        visibility: 1337,
        sunrise: 1337,
        sunset: 1337,
        dt: 1337,
        pressure: 1337,
      },
      hourly: [],
      daily: [],
    } satisfies rawWeatherResponse;

    kvStore.set("openWeatherMap#1337#1337#metric", { rawWeather: mockResp });

    const client = new OpenWeatherMapClient("testapikey", mockLogger);
    const weather = await client.getWeather(
      "metric",
      new GeoCodeData({
        latitude: 1337,
        longitude: 1337,
      }),
    );

    expect(weather.current.temp.temperature).toBe(1337);

    expect(mockAxios.history["get"]).toHaveLength(0);
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(0);
  });

  it("converts units correctly in getWeather", async () => {
    const mockResponse = mockResponseBase;

    mockAxios.onGet().reply(OK, mockResponse);

    const weatherMetric = await client.getWeather(
      "metric",
      new GeoCodeData({
        latitude: 0,
        longitude: 0,
      }),
    );
    expect(weatherMetric.current.temp.temperature).toBe(20);
    expect(weatherMetric.current.wind.speed).toBe(2.57);

    const weatherImperial = await client.getWeather(
      "imperial",
      new GeoCodeData({
        latitude: 0,
        longitude: 0,
      }),
    );
    expect(weatherImperial.current.temp.temperature).toBe(68); // 20C = 68F
    expect(weatherImperial.current.wind.speed).toBeCloseTo(5.75, 2); // 2.57 m/s = 5.75 mph
  });

  it("converts date fields correctly", async () => {
    const date = new Date(2000, 0, 1, 0, 0, 0, 0);
    const dateUnix = Math.floor(date.getTime() / 1000);

    const mockResponse = {
      ...mockResponseBase,
      current: {
        ...mockResponseBase.current,
        dt: dateUnix,
      },
    };

    mockAxios.onGet().reply(OK, mockResponse);

    const weatherMetric = await client.getWeather(
      "metric",
      new GeoCodeData({
        latitude: 0,
        longitude: 0,
      }),
    );

    expect(weatherMetric.current.time).toEqual(date);
  });

  it("returns an error when the wind direction is invalid", async () => {
    const mockResponse = {
      ...mockResponseBase,
      current: {
        ...mockResponseBase.current,
        wind_deg: 500,
      },
    };

    mockAxios.onGet().reply(OK, mockResponse);

    await expect(
      client.getWeather(
        "metric",
        new GeoCodeData({ latitude: 0, longitude: 0 }),
      ),
    ).rejects.toThrow(InvalidWindDirectionError);
  });

  it("throws an error when the API returns an error", async () => {
    mockAxios.onGet().reply(BAD_REQUEST);

    await expect(
      client.getWeather(
        "metric",
        new GeoCodeData({ latitude: 0, longitude: 0 }),
      ),
    ).rejects.toThrow(OpenWeatherMapError);
  });
});

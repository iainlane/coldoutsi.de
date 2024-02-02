import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { mock } from "jest-mock-extended";

import type { Logger } from "@/lib/logger";
import {
  GeoCodeData,
  InvalidDataError,
  NoDataError,
  geoCode,
  reverseGeocode,
} from "./index";

const mockAxios = new AxiosMockAdapter(axios);

const ddbMock = mockClient(DynamoDBDocumentClient);

const mockLogger = mock<Logger>();

beforeEach(() => {
  ddbMock.reset();
  jest.clearAllMocks();
  mockAxios.reset();
});

describe("toString", () => {
  it("should convert geo data to string", () => {
    const sampleData = new GeoCodeData({
      latitude: 51.839175049999994,
      longitude: -96.87365529211462,
      city: "Sample City",
    });

    expect(sampleData.toString()).toEqual("Sample City");
  });

  it("should return lat/lon if no other data", () => {
    const sampleData = new GeoCodeData({
      latitude: 51.839175049999994,
      longitude: -96.87365529211462,
    });
    expect(sampleData.toString()).toEqual(
      "51.839175049999994, -96.87365529211462",
    );
  });
});

describe("reverseGeocoder", () => {
  const sampleInput = {
    latitude: 51.839175049999994,
    longitude: -96.87365529211462,
    acceptLanguage: "en",
  };

  it("should use cached data if available", async () => {
    const cachedData = new GeoCodeData({
      latitude: sampleInput.latitude,
      longitude: sampleInput.longitude,
      city: "Cached City",
    });
    ddbMock.on(GetCommand).resolvesOnce({
      Item: cachedData,
    });

    const result = await reverseGeocode(sampleInput, mockLogger);
    expect(result).toEqual(cachedData);

    // ... and the axios mock (remote serivce) wasn't called, because we used
    // the cache
    expect(mockAxios.history["get"]).toHaveLength(0);
  });

  it("should save new data to cache on successful API call", async () => {
    ddbMock.on(GetCommand).resolvesOnce({});
    const mockApiResponse = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            geocoding: {
              lat: sampleInput.latitude,
              lon: sampleInput.longitude,
              city: "New Sample City",
            },
          },
        },
      ],
    };
    mockAxios.onAny().reply(200, mockApiResponse);
    ddbMock.on(PutCommand).resolvesOnce({});

    const result = await reverseGeocode(sampleInput, mockLogger);
    expect(result.city).toEqual("New Sample City");

    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
  });

  it("should throw InvalidDataError if no response", async () => {
    mockAxios.onAny().reply(200, {});
    ddbMock.on(GetCommand).resolvesOnce({});

    await expect(reverseGeocode(sampleInput, mockLogger)).rejects.toThrow(
      InvalidDataError,
    );
  });

  it("should throw NoDataError if no features in response", async () => {
    mockAxios.onAny().reply(200, { type: "FeatureCollection", features: [] });
    ddbMock.on(GetCommand).resolvesOnce({});

    await expect(reverseGeocode(sampleInput, mockLogger)).rejects.toThrow(
      NoDataError,
    );
  });

  it("should throw InvalidDataError if no properties in feature", async () => {
    mockAxios.onAny().reply(200, {
      type: "FeatureCollection",
      features: [{ type: "Feature" }],
    });
    ddbMock.on(GetCommand).resolvesOnce({});

    await expect(reverseGeocode(sampleInput, mockLogger)).rejects.toThrow(
      InvalidDataError,
    );
  });

  it("should throw InvalidDataError if no geocoding in properties", async () => {
    mockAxios.onAny().reply(200, {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: {} }],
    });
    ddbMock.on(GetCommand).resolvesOnce({});

    await expect(reverseGeocode(sampleInput, mockLogger)).rejects.toThrow(
      InvalidDataError,
    );
  });

  it("should return GeoData on successful API call", async () => {
    ddbMock.on(GetCommand).resolvesOnce({});
    const mockApiResponse = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            geocoding: {
              latitude: 51.839175049999994,
              longitude: -96.87365529211462,
              city: "Sample City",
            },
          },
        },
      ],
    };
    mockAxios.onAny().reply(200, mockApiResponse);

    const result = await reverseGeocode(sampleInput, mockLogger);
    expect(result).toEqual(expect.objectContaining({ city: "Sample City" }));
  });
});

describe("geoCoder", () => {
  it("should call the geocoding API", async () => {
    ddbMock.on(GetCommand).resolvesOnce({});

    const sampleInput = {
      location: "London",
      acceptLanguage: "en",
    };
    const mockApiResponse = {
      type: "FeatureCollection",
      geocoding: {
        version: "0.1.0",
        attribution:
          "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
        licence: "ODbL",
        query: "London",
      },
      features: [
        {
          type: "Feature",
          properties: {
            geocoding: {
              place_id: 243408926,
              osm_type: "relation",
              osm_id: 65606,
              osm_key: "place",
              osm_value: "city",
              type: "city",
              label: "London, Greater London, England, United Kingdom",
              name: "London",
              county: "Greater London",
              state: "England",
              country: "United Kingdom",
              country_code: "gb",
              admin: {
                level5: "Greater London",
                level4: "England",
              },
            },
          },
          geometry: {
            type: "Point",
            coordinates: [-0.1277653, 51.5074456],
          },
        },
      ],
    };
    mockAxios.onAny().reply(200, mockApiResponse);

    const result = await geoCode(sampleInput, mockLogger);
    expect(result).toEqual(expect.objectContaining({ name: "London" }));
  });

  it("should use cached data if available", async () => {
    const cachedData = new GeoCodeData({
      latitude: 51.839175049999994,
      longitude: -96.87365529211462,
      city: "Cached City",
    });
    ddbMock.on(GetCommand).resolvesOnce({
      Item: cachedData,
    });

    const result = await geoCode(
      {
        location: "London",
        acceptLanguage: "en",
      },
      mockLogger,
    );
    expect(result).toEqual(cachedData);

    // ... and the axios mock (remote serivce) wasn't called, because we used
    // the cache
    expect(mockAxios.history["get"]).toHaveLength(0);
  });

  it("should save new data to cache on successful API call", async () => {
    ddbMock.on(GetCommand).resolvesOnce({});
    const mockApiResponse = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            geocoding: {
              city: "New Sample City",
            },
          },
          geometry: {
            type: "Point",
            coordinates: [-0.1277653, 51.5074456],
          },
        },
      ],
    };
    mockAxios.onAny().reply(200, mockApiResponse);
    ddbMock.on(PutCommand).resolvesOnce({});

    const result = await geoCode(
      {
        location: "London",
        acceptLanguage: "en",
      },
      mockLogger,
    );
    expect(result.city).toEqual("New Sample City");

    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
  });

  it("should throw InvalidDataError if no response", async () => {
    mockAxios.onAny().reply(200, {});
    ddbMock.on(GetCommand).resolvesOnce({});

    await expect(
      geoCode(
        {
          location: "London",
          acceptLanguage: "en",
        },
        mockLogger,
      ),
    ).rejects.toThrow(InvalidDataError);
  });

  it("should throw NoDataError if no features in response", async () => {
    mockAxios.onAny().reply(200, { type: "FeatureCollection", features: [] });
    ddbMock.on(GetCommand).resolvesOnce({});

    await expect(
      geoCode(
        {
          location: "London",
          acceptLanguage: "en",
        },
        mockLogger,
      ),
    ).rejects.toThrow(NoDataError);
  });
});

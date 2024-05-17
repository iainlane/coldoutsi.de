import { PutCommandOutput } from "@aws-sdk/lib-dynamodb";

import { GeoJSApiFactory, Geolocate200ResponseInner } from "@internal/geojs";

import { retryableAxios } from "@/lib/axios";
import { dynamoDbDocClient } from "@/lib/dynamodb";
import type { Logger } from "@/lib/logger";
import axios from "axios";

type PartialGeoLocateResponse = Partial<Geolocate200ResponseInner>;

interface Location
  extends Omit<PartialGeoLocateResponse, "latitude" | "longitude"> {
  latitude: number;
  longitude: number;
}

export interface GeoLocate {
  ip: string;
  location: Location;
}

export class GeoLocateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeoLocateError";
  }
}

export interface GeoLocateInput {
  ip: string;
}

const TableName = process.env["GEOLOCATION_TABLE_NAME"];

async function setCache(
  ip: string,
  location: Location,
): Promise<PutCommandOutput> {
  const ttl = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours TTL

  const params = {
    TableName: TableName,
    Item: { ip, location, ttl },
  };

  return dynamoDbDocClient.put(params);
}

async function getCache(ip: string): Promise<GeoLocate | null> {
  const params = {
    TableName: TableName,
    Key: { ip },
    ExpressionAttributeNames: {
      "#location": "location",
    },
    // Get location.latitude and location.longitude only
    ProjectionExpression: "#location.latitude, #location.longitude",
  };

  const data = await dynamoDbDocClient.get(params);

  return data.Item
    ? {
        ip,
        location: (data.Item as { location: Location }).location,
      }
    : null;
}

type GeoJSApi = ReturnType<typeof GeoJSApiFactory>;

async function geoLocate(
  geoJsApi: GeoJSApi,
  ip: string,
  logger: Logger,
): Promise<PartialGeoLocateResponse> {
  if (ip === "127.0.0.1" || ip == "::1") {
    // If we're coming from localhost, return a default location (Royal Observatory,
    // Greenwich, London, UK).
    const defaultLatLon = {
      latitude: "51.4779",
      longitude: "0",
    };

    logger.debug(
      "Request is from localhost, using default Greenwich location",
      { ip, defaultLatLon },
    );

    return defaultLatLon;
  }

  try {
    const res = await geoJsApi.geolocate(ip);

    if (res.data.length === 0 || res.data[0] === undefined) {
      throw new GeoLocateError(`No geodata for ${ip}`);
    }

    return res.data[0];
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new GeoLocateError(`Failed to geolocate ${ip}: ${err.message}`);
    }

    throw err;
  }
}

export async function geoLocator(
  { ip }: GeoLocateInput,
  logger: Logger,
): Promise<GeoLocate> {
  logger.debug(`Geolocating`, { ip });

  const cached = await getCache(ip);

  if (cached !== null) {
    logger.debug(`Found cached location`, { ip, cached });
    return cached;
  }

  const geoJsApi = GeoJSApiFactory(
    undefined,
    undefined,
    retryableAxios(logger),
  );

  const geoData = await geoLocate(geoJsApi, ip, logger);

  logger.debug("Geolocated", { ip, geoData });

  const { latitude, longitude } = geoData;

  const lat = Number(latitude);
  if (Number.isNaN(lat)) {
    throw new GeoLocateError(`Invalid latitude for ${ip}: ${latitude}`);
  }

  const lon = Number(longitude);
  if (Number.isNaN(lon)) {
    throw new GeoLocateError(`Invalid longitude for ${ip}: ${longitude}`);
  }

  const location = { ...geoData, latitude: lat, longitude: lon };

  logger.debug(`Saving location in cache`, { ip, location });
  await setCache(ip, location);

  return {
    ip,
    location,
  };
}

export * from "./middleware";

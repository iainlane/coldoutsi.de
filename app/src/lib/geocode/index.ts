import { PutCommandOutput } from "@aws-sdk/lib-dynamodb";
import {
  SearchApiFactory,
  ReverseApiFactory,
  ReverseFormatEnum,
  OSMGeocodeJson,
  SearchFormatEnum,
  OSMGeocodeJsonAllOfFeaturesInner,
  OSMGeocodeJsonAllOfFeaturesInnerProperties,
} from "@internal/nominatim";

import { dynamoDbDocClient } from "@/lib/dynamodb";
import { retryableAxios } from "@/lib/axios";
import { Logger } from "@/lib/logger";

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface GeoCodeProps extends Coordinate {
  city?: string;
  country?: string;
  country_code?: string;
  county?: string;
  label?: string;
  name?: string;
  postcode?: string;
  state?: string;
  type?: string;
}

export class GeoCodeData implements GeoCodeProps {
  // TODO: Can we avoid repeating these properties of the above interface?
  public readonly latitude!: number;
  public readonly longitude!: number;
  public readonly city?: string;
  public readonly country?: string;
  public readonly country_code?: string;
  public readonly county?: string;
  public readonly label?: string;
  public readonly name?: string;
  public readonly postcode?: string;
  public readonly state?: string;
  public readonly type?: string;

  constructor(props: GeoCodeProps) {
    Object.assign(this, props);
  }

  public toString(): string {
    const parts = [
      this.name,
      this.city,
      this.county,
      this.state,
      this.country,
    ].filter((part) => part !== undefined);

    if (parts.length === 0) {
      return `${this.latitude}, ${this.longitude}`;
    }

    return parts.join(", ");
  }
}

export class NoDataError extends Error {
  constructor(public override readonly message: string) {
    super(message);
  }
}

export class InvalidDataError extends Error {
  constructor(public override readonly message: string) {
    super(message);
  }
}

const TableName = process.env["GEOCODE_TABLE_NAME"];

interface cacheKey {
  key: string;
  acceptLanguage: string;
}

function reverseGeoCodeCacheKey({ latitude, longitude }: Coordinate): string {
  return `reverse#${latitude}#${longitude}`;
}

function geoCodeCacheKey(place_name: string) {
  return `forward#${place_name}`;
}

async function getCache({
  acceptLanguage,
  key,
}: cacheKey): Promise<GeoCodeData | null> {
  const params = {
    TableName: TableName,
    Key: { geoHash: key, acceptLanguage },
  };

  const result = await dynamoDbDocClient.get(params);

  return result.Item ? new GeoCodeData(result.Item as GeoCodeData) : null;
}

async function setCache(
  { key, acceptLanguage }: cacheKey,
  geoCodeData: GeoCodeData,
): Promise<PutCommandOutput> {
  const ttl = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours TTL

  const params = {
    TableName: TableName,
    Item: {
      geoHash: key,
      acceptLanguage,
      ...geoCodeData,
      ttl,
    },
  };

  return dynamoDbDocClient.put(params);
}

// The OpenAPI spec we use doesn't have the `geometry` property in the
// `features` object's members.
interface GeoJsonFeature extends OSMGeocodeJsonAllOfFeaturesInner {
  geometry?: {
    coordinates: [number, number];
  };
  properties: OSMGeocodeJsonAllOfFeaturesInnerProperties;
}

function isGeoJsonFeature(
  feature: OSMGeocodeJsonAllOfFeaturesInner,
): feature is GeoJsonFeature {
  const props = feature.properties;
  if (props === undefined) {
    return false;
  }

  const geocoding = props.geocoding;
  if (geocoding === undefined) {
    return false;
  }

  return true;
}

type SearchInput = Coordinate | { location: string };

function getFirstFeature(
  data: OSMGeocodeJson,
  input: SearchInput,
  logger: Logger,
): GeoJsonFeature {
  if (data.features === undefined) {
    throw new InvalidDataError("Response from nominatim is missing features");
  }

  if (data.features.length === 0 || data.features[0] === undefined) {
    throw new NoDataError(`No data found for ${JSON.stringify(input)}`);
  }

  if (!isGeoJsonFeature(data.features[0])) {
    logger.warn("Received invalid feature data from Nominatim", {
      input,
      feature: data.features[0],
    });
    throw new InvalidDataError("Invalid feature data");
  }

  return data.features[0];
}

export async function reverseGeocode(
  {
    latitude,
    longitude,
    acceptLanguage,
  }: {
    latitude: number;
    longitude: number;
    acceptLanguage: string;
  },
  logger: Logger,
): Promise<GeoCodeData> {
  logger.debug("Reverse geocoding", { latitude, longitude, acceptLanguage });

  const cached = await getCache({
    key: reverseGeoCodeCacheKey({ latitude, longitude }),
    acceptLanguage,
  });

  if (cached !== null) {
    logger.debug("Got cached location", { cached });
    return cached;
  }

  const nominatim = ReverseApiFactory(
    undefined,
    undefined,
    retryableAxios(logger),
  );
  const resp = await nominatim.reverse(
    latitude,
    longitude,
    ReverseFormatEnum.Geocodejson,
    undefined, // jsonCallback
    1, // addressDetails
    undefined, // extraTags
    undefined, // nameDetails
    acceptLanguage,
    15, // zoom (15 is settlement level)
    "address", // layer
  );

  const feature = getFirstFeature(resp.data, { latitude, longitude }, logger);

  const geocoding = feature.properties.geocoding;

  const data = {
    ...geocoding,
    latitude,
    longitude,
  };

  logger.debug("Got location, saving in cache", { geocoding });

  await setCache({ key: reverseGeoCodeCacheKey(data), acceptLanguage }, data);

  return new GeoCodeData(data);
}

export async function geoCode(
  {
    location,
    acceptLanguage,
  }: {
    location: string;
    acceptLanguage: string;
  },
  logger: Logger,
): Promise<GeoCodeData> {
  const nominatim = SearchApiFactory(
    undefined,
    undefined,
    retryableAxios(logger),
  );

  logger.debug("Geocoding", { location, acceptLanguage });

  const key = geoCodeCacheKey(location);

  const cached = await getCache({
    key,
    acceptLanguage,
  });

  if (cached !== null) {
    logger.debug("Got cached location", { cached });
    return cached;
  }

  const result = await nominatim.search(
    location,
    undefined, // amenity
    undefined, // street
    undefined, // city
    undefined, // county
    undefined, // state
    undefined, // country
    undefined, // postalcode
    SearchFormatEnum.Geocodejson,
    undefined, // jsonCallback
    1, // limit
    1, // addressDetails
    undefined, // extratags
    undefined, // namedetails
    acceptLanguage,
    undefined, // countrycodes
    "address", // layer
  );

  const feature = getFirstFeature(result.data, { location }, logger);

  const geocoding = feature.properties.geocoding;

  const geometry = feature.geometry;

  if (!geometry) {
    throw new InvalidDataError("Invalid feature data: no `geometry` property");
  }

  const [longitude, latitude] = geometry.coordinates;

  const data = {
    ...geocoding,
    latitude,
    longitude,
  };

  logger.debug("Got location, saving in cache", { geocoding });

  await setCache({ key, acceptLanguage }, data);

  return new GeoCodeData(data);
}

export * from "./middleware";

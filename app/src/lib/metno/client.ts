import { retryableAxios } from "@/lib/axios";
import { GeoCodeData } from "@/lib/geocode";
import { Logger } from "@/lib/logger";
import {
  Configuration,
  DataApiFactory,
  METJSONForecast,
} from "@internal/met.no";

export async function getRawWeather(
  logger: Logger,
  location: GeoCodeData,
): Promise<METJSONForecast> {
  const metno = DataApiFactory(
    new Configuration({
      basePath: "http://api.met.no/weatherapi/locationforecast/2.0",
    }),
    undefined,
    retryableAxios(logger),
  );

  // Round lat/lon to 2 decimal places
  const roundedLocation: GeoCodeData = {
    latitude: parseFloat(location.latitude.toFixed(2)),
    longitude: parseFloat(location.longitude.toFixed(2)),
  };

  const weather = await metno.completeGet(
    roundedLocation.latitude,
    roundedLocation.longitude,
  );

  return weather.data;
}

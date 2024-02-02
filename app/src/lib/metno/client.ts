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
): METJSONForecast {
  const metno = DataApiFactory(
    new Configuration({
      basePath: "http://api.met.no/weatherapi/locationforecast/2.0",
    }),
    undefined,
    retryableAxios(logger),
  );

  const weather = await metno.completeGet(
    location.latitude,
    location.longitude,
  );

  return weather;
}

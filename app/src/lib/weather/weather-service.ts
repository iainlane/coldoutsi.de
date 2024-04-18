import { GeoCodeData } from "@/lib/geocode";

import { Units, Weather } from ".";

/*
 * WeatherService is an interface that defines the contract for a weather service.
 */
export interface WeatherService {
  /**
   * Get the weather for a location.
   *
   * @param unit The unit of measurement to use.
   * @param location The location to get the weather for.
   */
  getWeather(unit: Units, location: GeoCodeData): Promise<Weather<typeof unit>>;
}

/**
 * WeatherServiceError is an error that is thrown when an error occurs in a
 * weather service. Implementations can extend this class to provide more
 * specific error types. It is used in the handler to determine the HTTP status
 * code.
 */
export class WeatherServiceError extends Error {}

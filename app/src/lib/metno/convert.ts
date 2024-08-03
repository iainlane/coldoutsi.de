import { toTwoDP } from "@/lib/util";
import type { WindDirection } from "@/lib/weather";
import {
  CurrentMeasurement,
  DailyMeasurement,
  DegreesCelsius,
  InvalidWindDirectionError,
  WindSpeedMetresPerSecond,
  getWindDirection,
  isDegree,
} from "@/lib/weather";
import { ForecastTimeStep, WeatherSymbol } from "@internal/met.no";

import { MetNoMissingPropertyError } from "./client";
import { WeatherConditions } from "./weather-conditions";

function ensureDefined<T, K extends keyof T>(
  obj: T,
  propertyName: K,
): NonNullable<T[K]> {
  const value = obj[propertyName];
  if (value === undefined || value === null) {
    throw new MetNoMissingPropertyError(propertyName as string);
  }

  return value;
}

type PartiallyConverted = Omit<CurrentMeasurement<"metric">, "weather"> & {
  weather: WeatherSymbol;
};

export function convert(raw: ForecastTimeStep): PartiallyConverted {
  const instant = ensureDefined(raw.data.instant, "details");
  const next =
    raw.data.next_1_hours ?? raw.data.next_6_hours ?? raw.data.next_12_hours;
  if (next === undefined) {
    throw new MetNoMissingPropertyError([
      "next_1_hours",
      "next_6_hours",
      "next_12_hours",
    ]);
  }

  const temp = ensureDefined(instant, "air_temperature");

  const pressure = ensureDefined(instant, "air_pressure_at_sea_level");

  const humidity = ensureDefined(instant, "relative_humidity");

  const cloudCover = ensureDefined(instant, "cloud_area_fraction");

  const windSpeed = ensureDefined(instant, "wind_speed");

  // Looks like met.no only provides gusts for the nordic region, so we don't
  // ensure it's defined (it might be undefined for other regions).
  const windGusts = instant.wind_speed_of_gust;

  const windDirection = ensureDefined(instant, "wind_from_direction");

  if (!isDegree(windDirection)) {
    throw new InvalidWindDirectionError(windDirection);
  }

  const weatherCondition = ensureDefined(next.summary, "symbol_code");

  return {
    time: new Date(raw.time),
    pressure: pressure,
    temp: new DegreesCelsius(temp),
    humidity: humidity,
    clouds: cloudCover,
    weather: weatherCondition,
    wind: new WindSpeedMetresPerSecond(
      windSpeed,
      windGusts,
      getWindDirection(windDirection),
    ),
  };
}

export function convertCurrent(
  raw: ForecastTimeStep,
): CurrentMeasurement<"metric"> {
  const { weather, ...converted } = convert(raw);

  return {
    ...converted,
    weather: [WeatherConditions[weather]],
  };
}

export function convertDaily(
  date: Date,
  steps: ForecastTimeStep[],
): DailyMeasurement<"metric"> {
  let pressure = 0;
  let humidity = 0;
  let cloudCover = 0;
  let minTemp = Infinity;
  let maxTemp = -Infinity;
  const weather = new Map<string, number>();
  let windSpeed = 0;
  let windGusts = 0;
  const windDirection = new Map<string, number>();

  let mostCommonWeather: [WeatherSymbol, number] = [
    "clearsky_day",
    Number.MIN_SAFE_INTEGER,
  ];
  let mostCommonWindDirection: [keyof typeof WindDirection, number] = [
    "N",
    Number.MIN_SAFE_INTEGER,
  ];

  steps.forEach((step) => {
    const measurement = convert(step);

    pressure += measurement.pressure;
    humidity += measurement.humidity;
    cloudCover += measurement.clouds;

    minTemp = Math.min(minTemp, measurement.temp.temperature);
    maxTemp = Math.max(maxTemp, measurement.temp.temperature);

    windSpeed += measurement.wind.speed;
    windGusts += measurement.wind.gusts ?? 0;

    const windDirOccurrences =
      (windDirection.get(measurement.wind.direction) ?? 0) + 1;
    windDirection.set(measurement.wind.direction, windDirOccurrences);
    if (windDirOccurrences > mostCommonWindDirection[1]) {
      mostCommonWindDirection = [
        measurement.wind.direction,
        windDirOccurrences,
      ];
    }

    const weatherOccurrences = (weather.get(measurement.weather) ?? 0) + 1;
    weather.set(measurement.weather, weatherOccurrences);
    if (weatherOccurrences > mostCommonWeather[1]) {
      mostCommonWeather = [measurement.weather, weatherOccurrences];
    }
  });

  return {
    time: date,
    pressure: toTwoDP(pressure / steps.length),
    humidity: toTwoDP(humidity / steps.length),
    clouds: toTwoDP(cloudCover / steps.length),
    temp: {
      min: new DegreesCelsius(minTemp),
      max: new DegreesCelsius(maxTemp),
    },
    weather: [WeatherConditions[mostCommonWeather[0]]],
    wind: new WindSpeedMetresPerSecond(
      windSpeed / steps.length,
      windGusts / steps.length,
      mostCommonWindDirection[0],
    ),
  };
}

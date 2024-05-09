import { toOneDP } from "@/lib/util";

import { WindSpeedMetresPerSecond, WindSpeedMilesPerHour } from "./wind";

export type Units = "metric" | "imperial";

export function isUnits(u: string): u is Units {
  return u === "metric" || u === "imperial";
}

interface UnitTemperatureTypeMapping {
  metric: DegreesCelsius;
  imperial: DegreesFahrenheit;
}

export type TemperatureType<U extends Units> =
  U extends keyof UnitTemperatureTypeMapping
    ? UnitTemperatureTypeMapping[U]
    : never;

// The coefficients for the heat index calculation.
type Index = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type feelsLikeConstants = {
  // Every number from 1 to 9 must be present
  [K in Index]: number;
};

export interface Temperature {
  temperature: number;
  unit: string;
}

export function TemperatureToDegrees({
  temperature,
  unit,
}: Temperature): BaseDegreesWithFeelsLike {
  switch (unit) {
    case "°C":
      return new DegreesCelsius(temperature);
    case "°F":
      return new DegreesFahrenheit(temperature);
    default:
      throw new Error(`Unknown unit: ${unit}`);
  }
}

abstract class BaseDegrees {
  constructor(protected readonly temp: number) {}

  abstract unit: string;

  public get temperature(): number {
    return toOneDP(this.temp);
  }

  toString(): string {
    return `${this.temperature}${this.unit}`;
  }

  toJSON(): Temperature {
    return {
      temperature: this.temperature,
      unit: this.unit,
    };
  }
}

abstract class BaseDegreesWithFeelsLike extends BaseDegrees {
  abstract feelsLikeConstants: feelsLikeConstants;

  // TODO: OpenWeatherMap actually provides a `feels_like` property itself, but
  // met.no does not; it would be better if we could use that when the provider
  // has it, rather than always calculating it ourselves.
  abstract feelsLike(
    humidity: number,
    windSpeed: { speed: number },
  ): BaseDegrees;

  protected heatIndex(humidity: number) {
    const c = this.feelsLikeConstants;

    // https://en.wikipedia.org/wiki/Heat_index#Formula
    return (
      c[1] +
      c[2] * this.temp +
      c[3] * humidity +
      c[4] * this.temp * humidity +
      c[5] * this.temp * this.temp +
      c[6] * humidity * humidity +
      c[7] * this.temp * this.temp * humidity +
      c[8] * this.temp * humidity * humidity +
      c[9] * this.temp * this.temp * humidity * humidity
    );
  }
}

export class DegreesCelsius extends BaseDegreesWithFeelsLike {
  unit = "°C";
  feelsLikeConstants = {
    1: -8.78469475556,
    2: 1.61139411,
    3: 2.33854883889,
    4: -0.14611605,
    5: -0.012308094,
    6: -0.0164248277778,
    7: 0.002211732,
    8: 0.00072546,
    9: -0.000003582,
  };

  toDegreesFahrenheit(): DegreesFahrenheit {
    return new DegreesFahrenheit((this.temp * 9) / 5 + 32); // 1°C × 9/5 + 32 = 33.8°F
  }

  private windChill(windSpeed: WindSpeedMetresPerSecond): number {
    // Convert m/s to km/h
    const speed = windSpeed.speed * 3.6;

    // https://en.wikipedia.org/wiki/Wind_chill#North_American_and_United_Kingdom_wind_chill_index
    return (
      13.12 +
      0.6215 * this.temp -
      11.37 * Math.pow(speed, 0.16) +
      0.3965 * this.temp * Math.pow(speed, 0.16)
    );
  }

  // TODO: It would be better if `feelsLike` didn't return a `DegreesCelsius` so
  // it itself didn't have a `feelsLike` method.
  public feelsLike(
    humidity: number,
    windSpeed: WindSpeedMetresPerSecond,
  ): DegreesCelsius {
    // Use heat index if temperature is above 26°C and humidity is above or equal to 40%
    if (this.temp > 26 && humidity >= 40) {
      return new DegreesCelsius(this.heatIndex(humidity));
    }

    // Use wind chill if temperature is below 10°C and wind speed is above
    // 1.34m/s (4.8km/h)
    if (this.temp < 10 && windSpeed.speed > 1.34) {
      return new DegreesCelsius(this.windChill(windSpeed));
    }

    return this;
  }

  static is(value: unknown): value is DegreesCelsius {
    return value instanceof DegreesCelsius;
  }
}

export class DegreesFahrenheit extends BaseDegreesWithFeelsLike {
  unit = "°F";
  feelsLikeConstants = {
    1: -42.379,
    2: 2.04901523,
    3: 10.14333127,
    4: -0.22475541,
    5: -0.00683783,
    6: -0.05481717,
    7: 0.00122874,
    8: 0.00085282,
    9: -0.00000199,
  };

  private windChill(windSpeed: WindSpeedMilesPerHour): number {
    const speed = windSpeed.speed;

    // https://en.wikipedia.org/wiki/Wind_chill#North_American_and_United_Kingdom_wind_chill_index
    return (
      35.74 +
      0.6215 * this.temp -
      35.75 * Math.pow(speed, 0.16) +
      0.4275 * this.temp * Math.pow(speed, 0.16)
    );
  }

  // TODO: It would be better if `feelsLike` didn't return a `DegreesFahrenheit`
  // so it itself didn't have a `feelsLike` method.
  public feelsLike(
    humidity: number,
    windSpeed: WindSpeedMilesPerHour,
  ): DegreesFahrenheit {
    // Use heat index if temperature is above 80.5°F and humidity is greater
    // than or equal to 40%
    if (this.temp > 80.5 && humidity >= 40) {
      return new DegreesFahrenheit(this.heatIndex(humidity));
    }

    // Use wind chill if temperature is below 50°F and wind speed is above 3mph
    if (this.temp < 50 && humidity > 3) {
      return new DegreesFahrenheit(this.windChill(windSpeed));
    }

    // Otherwise, return the same temperature
    return this;
  }

  toDegreesCelsius(): DegreesCelsius {
    return new DegreesCelsius(((this.temp - 32) * 5) / 9);
  }

  static is(value: unknown): value is DegreesFahrenheit {
    return value instanceof DegreesFahrenheit;
  }
}

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

abstract class BaseDegrees {
  constructor(public readonly temperature: number) {}

  abstract unit: string;

  private get roundedToOneDP(): number {
    return Math.round(this.temperature * 10) / 10;
  }

  toString(): string {
    return `${this.roundedToOneDP}${this.unit}`;
  }

  toJSON(): { value: number; unit: string } {
    return {
      value: this.roundedToOneDP,
      unit: this.unit,
    };
  }
}

abstract class BaseDegreesWithFeelsLike extends BaseDegrees {
  abstract feelsLikeConstants: feelsLikeConstants;

  // TODO: OpenWeatherMap actually provides a `feels_like` property itself, but
  // met.no does not; it would be better if we could use that when the provider
  // has it, rather than always calculating it ourselves.
  abstract feelsLike(humidity: number): BaseDegrees;

  protected calculateFeelsLike(humidity: number) {
    const c = this.feelsLikeConstants;

    // https://en.wikipedia.org/wiki/Heat_index#Formula
    return (
      c[1] +
      c[2] * this.temperature +
      c[3] * humidity +
      c[4] * this.temperature * humidity +
      c[5] * this.temperature * this.temperature +
      c[6] * humidity * humidity +
      c[7] * this.temperature * this.temperature * humidity +
      c[8] * this.temperature * humidity * humidity +
      c[9] * this.temperature * this.temperature * humidity * humidity
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
    return new DegreesFahrenheit((this.temperature * 9) / 5 + 32); // 1°C × 9/5 + 32 = 33.8°F
  }

  // TODO: It would be better if `feelsLike` didn't return a `DegreesCelsius` so
  // it itself didn't have a `feelsLike` method.
  public feelsLike(humidity: number): DegreesCelsius {
    return new DegreesCelsius(this.calculateFeelsLike(humidity));
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

  // TODO: It would be better if `feelsLike` didn't return a `DegreesFahrenheit`
  // so it itself didn't have a `feelsLike` method.
  public feelsLike(humidity: number): DegreesFahrenheit {
    return new DegreesFahrenheit(this.calculateFeelsLike(humidity));
  }

  toDegreesCelsius(): DegreesCelsius {
    return new DegreesCelsius(((this.temperature - 32) * 5) / 9);
  }

  static is(value: unknown): value is DegreesFahrenheit {
    return value instanceof DegreesFahrenheit;
  }
}

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

abstract class BaseDegrees {
  constructor(public readonly temperature: number) {}

  abstract unit: string;

  toString(): string {
    return `${this.temperature}${this.unit}`;
  }

  toJSON(): { value: number; unit: string } {
    return {
      value: this.temperature,
      unit: this.unit,
    };
  }
}

export class DegreesCelsius extends BaseDegrees {
  unit = "°C";

  toDegreesFahrenheit(): DegreesFahrenheit {
    return new DegreesFahrenheit((this.temperature * 9) / 5 + 32); // 1°C × 9/5 + 32 = 33.8°F
  }

  static is(value: unknown): value is DegreesCelsius {
    return value instanceof DegreesCelsius;
  }
}

export class DegreesFahrenheit extends BaseDegrees {
  unit = "°F";

  toDegreesCelsius(): DegreesCelsius {
    return new DegreesCelsius(((this.temperature - 32) * 5) / 9);
  }

  static is(value: unknown): value is DegreesFahrenheit {
    return value instanceof DegreesFahrenheit;
  }
}

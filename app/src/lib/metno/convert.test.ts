import { describe, expect, it } from "@jest/globals";

import { DegreesCelsius } from "@/lib/weather";
import { ForecastTimeStep } from "@internal/met.no";

import { convertCurrent, convertDaily } from "./convert";

describe("convertCurrent", () => {
  const mockForecastTimeStep = {
    time: "2022-02-22T22:22:22Z",
    data: {
      instant: {
        details: {
          air_pressure_at_sea_level: 1013.25,
          air_temperature: 10.0,
          cloud_area_fraction: 0.0,
          relative_humidity: 0.0,
          wind_from_direction: 0.0,
          wind_speed: 0.0,
          wind_speed_of_gust: 0.0,
        },
      },
      next_1_hours: {
        summary: {
          symbol_code: "clearsky_day",
        },
        details: {},
      },
    },
  } satisfies ForecastTimeStep;

  // https://github.com/joonhocho/tsdef/blob/4f0a9f07c5ac704604afeb64f52de3fc7709989c/src/index.ts#L219-L226
  type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends (infer I)[]
      ? DeepPartial<I>[]
      : DeepPartial<T[P]>;
  };

  it("converts a ForecastTimeStep to a CurrentMeasurement", () => {
    const current = convertCurrent(mockForecastTimeStep);

    expect(current).toMatchObject({
      time: new Date("2022-02-22T22:22:22Z"),
      temp: new DegreesCelsius(10.0),
      weather: [{ main: "Clear" }],
    });
  });

  it("throws an error if 'next' data is missing", () => {
    const step: DeepPartial<ForecastTimeStep> =
      structuredClone(mockForecastTimeStep);
    delete step.data?.next_1_hours;

    expect(() => convertCurrent(step as ForecastTimeStep)).toThrowError(
      expect.objectContaining({
        property: ["next_1_hours", "next_6_hours", "next_12_hours"],
      }),
    );
  });

  it("throws an error if a required field is missing (deep)", () => {
    const step: DeepPartial<ForecastTimeStep> =
      structuredClone(mockForecastTimeStep);
    delete step.data?.next_1_hours?.summary?.symbol_code;

    expect(() => convertCurrent(step as ForecastTimeStep)).toThrowError(
      expect.objectContaining({ property: "symbol_code" }),
    );
  });
});

describe("covertDaily", () => {
  const date = new Date("2022-02-22T22:22:22Z");

  it("averages fields for the day", () => {
    const mockForecastTimeSteps = [
      {
        time: "2022-02-22T22:22:22Z",
        data: {
          instant: {
            details: {
              air_pressure_at_sea_level: 1000,
              air_temperature: 10.0,
              cloud_area_fraction: 0.0,
              relative_humidity: 0.5,
              wind_from_direction: 0.0,
              wind_speed: 0.0,
              wind_speed_of_gust: 0.0,
            },
          },
          next_1_hours: {
            summary: {
              symbol_code: "clearsky_day",
            },
            details: {},
          },
        },
      },
      {
        time: "2022-02-22T23:22:22Z",
        data: {
          instant: {
            details: {
              air_pressure_at_sea_level: 500,
              air_temperature: 10.0,
              cloud_area_fraction: 0.5,
              relative_humidity: 1,
              wind_from_direction: 0.0,
              wind_speed: 0.0,
              wind_speed_of_gust: 0.0,
            },
          },
          next_1_hours: {
            summary: {
              symbol_code: "clearsky_day",
            },
            details: {},
          },
        },
      },
    ] as const satisfies ForecastTimeStep[];

    const daily = convertDaily(date, mockForecastTimeSteps);

    expect(daily.clouds).toBe(0.25);
    expect(daily.pressure).toBe(750);
    expect(daily.humidity).toBe(0.75);
  });

  it("rounds averages to two decimal places", () => {
    const mockForecastTimeSteps = [
      {
        time: "2022-02-22T21:22:22Z",
        data: {
          instant: {
            details: {
              air_pressure_at_sea_level: 333,
              air_temperature: 10.0,
              cloud_area_fraction: 0.3,
              relative_humidity: 0.3,
              wind_from_direction: 0.0,
              wind_speed: 0.0,
              wind_speed_of_gust: 0.0,
            },
          },
          next_1_hours: {
            summary: {
              symbol_code: "clearsky_day",
            },
            details: {},
          },
        },
      },
      {
        time: "2022-02-22T22:22:22Z",
        data: {
          instant: {
            details: {
              air_pressure_at_sea_level: 333,
              air_temperature: 10.0,
              cloud_area_fraction: 0.3,
              relative_humidity: 0.4,
              wind_from_direction: 0.0,
              wind_speed: 0.0,
              wind_speed_of_gust: 0.0,
            },
          },
          next_1_hours: {
            summary: {
              symbol_code: "clearsky_day",
            },
            details: {},
          },
        },
      },
      {
        time: "2022-02-22T23:22:22Z",
        data: {
          instant: {
            details: {
              air_pressure_at_sea_level: 334,
              air_temperature: 10.0,
              cloud_area_fraction: 0.4,
              relative_humidity: 0.3,
              wind_from_direction: 0.0,
              wind_speed: 0.0,
              wind_speed_of_gust: 0.0,
            },
          },
          next_1_hours: {
            summary: {
              symbol_code: "clearsky_day",
            },
            details: {},
          },
        },
      },
    ] as const satisfies ForecastTimeStep[];

    const daily = convertDaily(date, mockForecastTimeSteps);

    expect(daily.pressure).toBe(333.33);
    expect(daily.clouds).toBe(0.33);
    expect(daily.humidity).toBe(0.33);
  });
});

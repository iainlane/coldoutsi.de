import { describe, expect, it } from "@jest/globals";

import {
  DegreesCelsius,
  DegreesFahrenheit,
  WindSpeedMetresPerSecond,
  WindSpeedMilesPerHour,
} from ".";

describe("Temperature Conversion", () => {
  it("DegreesCelsius to DegreesFahrenheit", () => {
    const tempC = new DegreesCelsius(100);
    const tempF = tempC.toDegreesFahrenheit();
    expect(tempF.temperature).toBeCloseTo(212);
  });

  it("DegreesFahrenheit to DegreesCelsius", () => {
    const tempF = new DegreesFahrenheit(212);
    const tempC = tempF.toDegreesCelsius();
    expect(tempC.temperature).toBeCloseTo(100);
  });

  it("DegreesCelsius toString", () => {
    const tempC = new DegreesCelsius(100);
    expect(tempC.toString()).toBe("100°C");
  });

  it("DegreesFahrenheit toString", () => {
    const tempF = new DegreesFahrenheit(212);
    expect(tempF.toString()).toBe("212°F");
  });

  it("DegreesCelsius implicit toString", () => {
    const tempC = new DegreesCelsius(100);
    const message = `Temperature is ${tempC}`; // Implicit toString call
    expect(message).toBe("Temperature is 100°C");
  });

  it("DegreesFahrenheit implicit toString", () => {
    const tempF = new DegreesFahrenheit(212);
    const message = `Temperature is ${tempF}`; // Implicit toString call
    expect(message).toBe("Temperature is 212°F");
  });

  it("DegreesCelsius is Type Guard (negative test)", () => {
    const tempF = new DegreesFahrenheit(212);
    expect(DegreesCelsius.is(tempF)).toBe(false);
  });

  it("DegreesFahrenheit is Type Guard (negative test)", () => {
    const tempC = new DegreesCelsius(100);
    expect(DegreesFahrenheit.is(tempC)).toBe(false);
  });

  it("DegreesCelsius is Type Guard", () => {
    const tempC = new DegreesCelsius(100);
    expect(DegreesCelsius.is(tempC)).toBe(true);
  });

  it("DegreesFahrenheit is Type Guard", () => {
    const tempF = new DegreesFahrenheit(212);
    expect(DegreesFahrenheit.is(tempF)).toBe(true);
  });

  it("converts to JSON", () => {
    const tempC = new DegreesCelsius(100);
    expect(JSON.stringify(tempC)).toBe('{"temperature":100,"unit":"°C"}');
  });
});

describe("Feels Like Temperature", () => {
  it.each<{
    temperature: number;
    humidity: number;
    windSpeed: number;
    expected: number;
  }>([
    {
      // Using the heat index formula
      temperature: 34,
      humidity: 85,
      windSpeed: Number.MAX_SAFE_INTEGER, // gets ignored
      expected: 55.2,
    },
    {
      // Using the wind chill formula
      temperature: -10,
      humidity: Number.MIN_SAFE_INTEGER, // gets ignored
      windSpeed: 2.77778, // 10 km/h
      expected: -15.3,
    },
    {
      // In between 10 and 27°C, the temperature is just passed through, sadly
      temperature: 20,
      humidity: 50,
      windSpeed: 10,
      expected: 20,
    },
  ])(
    "DegreesCelsius temp $temperature humidity $humidity windSpeed $windSpeed feels like $expected",
    ({ temperature, humidity, windSpeed, expected }) => {
      const tempC = new DegreesCelsius(temperature);

      const windSpeedMPS = new WindSpeedMetresPerSecond(
        windSpeed,
        windSpeed,
        "N",
      );

      const feelsLike = tempC.feelsLike(humidity, windSpeedMPS);

      expect(feelsLike.temperature).toBeCloseTo(expected);
    },
  );

  it.each<{
    temperature: number;
    humidity: number;
    windSpeed: number;
    expected: number;
  }>([
    {
      // Using the heat index formula
      temperature: 85,
      humidity: 50,
      windSpeed: Number.NEGATIVE_INFINITY, // gets ignored
      expected: 86.5,
    },
    {
      // Using the wind chill formula
      temperature: 32,
      humidity: Number.POSITIVE_INFINITY, // gets ignored
      windSpeed: 10, // mph
      expected: 23.7,
    },
    {
      // In between 50 and 80.5°F, the temperature is just passed through, sadly
      temperature: 70,
      humidity: 50,
      windSpeed: 10,
      expected: 70,
    },
  ])(
    "DegreesFahrenheit temp $temperature humidity $humidity windSpeed $windSpeed feels like $expected",
    ({ temperature, humidity, windSpeed, expected }) => {
      const tempC = new DegreesFahrenheit(temperature);

      const windSpeedMPS = new WindSpeedMilesPerHour(windSpeed, windSpeed, "N");

      const feelsLike = tempC.feelsLike(humidity, windSpeedMPS);

      expect(feelsLike.temperature).toBeCloseTo(expected);
    },
  );
});

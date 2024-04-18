import { describe, expect, it } from "@jest/globals";

import { DegreesCelsius, DegreesFahrenheit } from ".";

describe("Temperature Conversion", () => {
  it("DegreesCelsius to DegreesFahrenheit", () => {
    const tempC = new DegreesCelsius(100);
    const tempF = tempC.toDegreesFahrenheit();
    expect(tempF.temperature).toBeCloseTo(212);
  });

  it("DegreesCelsius Feels Like", () => {
    const tempC = new DegreesCelsius(32);

    const feelsLike = tempC.feelsLike(85);

    expect(feelsLike.temperature).toBeCloseTo(46.58);
  });

  it("DegreesFahrenheit to DegreesCelsius", () => {
    const tempF = new DegreesFahrenheit(212);
    const tempC = tempF.toDegreesCelsius();
    expect(tempC.temperature).toBeCloseTo(100);
  });

  it("DegreesFahrenheit Feels Like", () => {
    const tempF = new DegreesFahrenheit(89.6);

    const feelsLike = tempF.feelsLike(85);

    expect(feelsLike.temperature).toBeCloseTo(115.85);
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
    expect(JSON.stringify(tempC)).toBe('{"value":100,"unit":"°C"}');
  });
});

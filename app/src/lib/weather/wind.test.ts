import { describe, expect, it } from "@jest/globals";

import { WindSpeedMetresPerSecond, WindSpeedMilesPerHour } from ".";

describe("Wind Speed Conversion", () => {
  const direction = "N";

  it("WindSpeedMetresPerSecond to WindSpeedMilesPerHour", () => {
    const speedMPS = new WindSpeedMetresPerSecond(10, 0, direction);
    const speedMPH = speedMPS.toMilesPerHour();
    expect(speedMPH.speed).toBeCloseTo(22.3694);
  });

  it("WindSpeedMilesPerHour to WindSpeedMetresPerSecond", () => {
    const speedMPH = new WindSpeedMilesPerHour(22.3694, 22.3694, direction);
    const speedMPS = speedMPH.toMetersPerSecond();
    expect(speedMPS.speed).toBeCloseTo(10);
    expect(speedMPS.gusts).toBeCloseTo(10);
  });

  it("WindSpeedMetresPerSecond toString", () => {
    const speedMPS = new WindSpeedMetresPerSecond(10, 10, direction);
    expect(speedMPS.toString()).toBe("10 m/s ↑");
  });

  it("WindSpeedMilesPerHour toString with no gusts", () => {
    const speedMPH = new WindSpeedMilesPerHour(22.3694, undefined, direction);
    expect(speedMPH.toString()).toBe("22.3694 mph ↑");
  });

  it("WindSpeedMilesPerHour toString", () => {
    const speedMPH = new WindSpeedMilesPerHour(22.3694, 22.3695, direction);
    expect(speedMPH.toString()).toBe("22.3694–22.3695 mph ↑");
  });

  it("WindSpeedMetresPerSecond implicit toString", () => {
    const speedMPS = new WindSpeedMetresPerSecond(10, 20, direction);
    const message = `Wind speed is ${speedMPS}`; // Implicit toString call
    expect(message).toBe("Wind speed is 10–20 m/s ↑");
  });

  it("WindSpeedMilesPerHour implicit toString", () => {
    const speedMPH = new WindSpeedMilesPerHour(22.3694, 22.3695, direction);
    const message = `Wind speed is ${speedMPH}`; // Implicit toString call
    expect(message).toBe("Wind speed is 22.3694–22.3695 mph ↑");
  });

  it("WindSpeedMilesPerHour ANSIString (rounded)", () => {
    const speedMPH = new WindSpeedMilesPerHour(22.3694, 22.3695, direction);
    expect(speedMPH.ANSIString).toBe(
      "\x1b[93m22.37\x1b[39m–\x1b[93m22.37\x1b[39m mph ↑",
    );
  });

  it("WindSpeedMilesPerHour HTMLString (rounded)", () => {
    const speedMPH = new WindSpeedMilesPerHour(22.3694, 22.3695, direction);
    expect(speedMPH.HTMLString).toBe(
      '<span class="yellowBright">22.37</span>–<span class="yellowBright">22.37</span> mph ↑',
    );
  });

  it("WindSpeedMetresPerSecond is Type Guard (negative test)", () => {
    const speedMPH = new WindSpeedMilesPerHour(22.3694, 22.3694, direction);
    expect(WindSpeedMetresPerSecond.is(speedMPH)).toBe(false);
  });

  it("WindSpeedMilesPerHour is Type Guard (negative test)", () => {
    const speedMPS = new WindSpeedMetresPerSecond(10, 10, direction);
    expect(WindSpeedMilesPerHour.is(speedMPS)).toBe(false);
  });

  it("WindSpeedMetresPerSecond is Type Guard", () => {
    const speedMPS = new WindSpeedMetresPerSecond(10, 10, direction);
    expect(WindSpeedMetresPerSecond.is(speedMPS)).toBe(true);
  });

  it("WindSpeedMilesPerHour is Type Guard", () => {
    const speedMPH = new WindSpeedMilesPerHour(22.3694, 22.3694, direction);
    expect(WindSpeedMilesPerHour.is(speedMPH)).toBe(true);
  });

  it("converts to JSON", () => {
    const speedMPS = new WindSpeedMetresPerSecond(10, 12, direction);
    expect(speedMPS.toJSON()).toMatchObject(
      expect.objectContaining({
        speed: {
          speed: 10,
          beaufort: expect.objectContaining({
            name: "Fresh Breeze",
          }),
        },
        gusts: {
          speed: 12,
          beaufort: expect.objectContaining({
            name: "Strong Breeze",
          }),
        },
        unit: "m/s",
        direction: "↑",
      }),
    );
  });

  it("converts to JSON (mph) with no gusts", () => {
    const speedMPH = new WindSpeedMilesPerHour(22, undefined, direction);
    expect(speedMPH.toJSON()).toMatchObject(
      expect.objectContaining({
        speed: {
          speed: 22,
          beaufort: expect.objectContaining({
            name: "Fresh Breeze",
          }),
        },
        gusts: undefined,
        unit: "mph",
        direction: "↑",
      }),
    );
  });
});

describe("Beaufort Scale", () => {
  it.each<{ speed: number; scale: string }>([
    { speed: 0, scale: "Calm" },
    { speed: 1, scale: "Light Air" },
    { speed: 3, scale: "Light Breeze" },
    { speed: 4, scale: "Gentle Breeze" },
    { speed: 6, scale: "Moderate Breeze" },
    { speed: 12, scale: "Strong Breeze" },
    { speed: 17, scale: "High Wind" },
    { speed: 20, scale: "Gale" },
    { speed: 24, scale: "Strong Gale" },
    { speed: 28, scale: "Storm" },
    { speed: 31, scale: "Violent Storm" },
    { speed: 34, scale: "Hurricane" },
  ])("Beaufort Scale $speed m/s", ({ speed, scale }) => {
    const speedMPS = new WindSpeedMetresPerSecond(speed, 0, "N");
    expect(speedMPS.toJSON().speed.beaufort.name).toBe(scale);
  });
});

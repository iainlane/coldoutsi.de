import { describe, expect, it } from "@jest/globals";

import { GeoCodeData } from "@/lib/geocode";
import { Logger } from "@/lib/logger";

import { getRawWeather } from ".";

const sherwood: GeoCodeData = {
  latitude: 51.477,
  longitude: 0,
};

describe("met.no client", () => {
  it("should return weather", () => {
    const logger = new Logger();

    const weather = getRawWeather(logger, sherwood);

    expect(weather).toBeDefined();
  });
});

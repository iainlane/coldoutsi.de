import { describe, expect, it } from "@jest/globals";

import { GeoCodeData } from "@/lib/geocode";
import { Logger } from "@/lib/logger";

import { getWeather } from ".";

const sherwood: GeoCodeData = {
  latitude: 52.9797093,
  longitude: -1.1528789,
};

describe("met.no client", () => {
  it("should return weather", async () => {
    const logger = new Logger();

    const weather = await getWeather(logger, sherwood);

    expect(weather).toBeDefined();
  });
});

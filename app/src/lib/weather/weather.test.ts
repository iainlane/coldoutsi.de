import { describe, expect, it } from "@jest/globals";

import { GeoCodeData } from "@/lib/geocode";
import { WeatherConditions } from "@/lib/open-weather-map";

import {
  DegreesCelsius,
  WindSpeedMetresPerSecond,
  Weather,
  CurrentMeasurement,
} from ".";

const location = new GeoCodeData({
  city: "Sample City",
  country: "Sample Country",
  latitude: 51.1,
  longitude: -96.1,
});

describe("render", () => {
  it.each<{
    temperature: number;
    expected: string;
  }>([
    { temperature: 15, expected: "15°C, Wind 5–10 m/s ↓" },
    { temperature: 28, expected: "28(28.4)°C, Wind 5–10 m/s ↓" },
  ])("should render the weather", async ({ temperature, expected }) => {
    const now = {
      clouds: 75,
      humidity: 50,
      pressure: 1000,
      temp: new DegreesCelsius(temperature),
      time: new Date(0),
      weather: [
        WeatherConditions[212], // heavy thunderstorm
      ],
      wind: new WindSpeedMetresPerSecond(5, 10, "S"),
    } as const satisfies CurrentMeasurement<"metric">;

    const weather = new Weather(location, now, [], []);

    const rendered = await weather.render["text/plain"]({ colour: false });

    // TODO: I can't compare the emoji at the start for some reason, figure it out
    expect(rendered).toContain(expected);
  });
});

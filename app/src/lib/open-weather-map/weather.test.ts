import { describe, expect, it } from "@jest/globals";

import { GeoCodeData } from "@/lib/geocode";
import { DegreesCelsius, WindSpeedMetresPerSecond } from "@/lib/weather";
import { CurrentMeasurement, Weather, WeatherConditions } from ".";

const location = new GeoCodeData({
  city: "Sample City",
  country: "Sample Country",
  latitude: 51.1,
  longitude: -96.1,
});

const now: CurrentMeasurement<"metric"> = {
  clouds: 75,
  feels_like: new DegreesCelsius(22),
  humidity: 0.5,
  pressure: 1000,
  sunrise: new Date(0),
  sunset: new Date(0),
  temp: new DegreesCelsius(20),
  time: new Date(0),
  visibility: 10000,
  weather: [
    WeatherConditions[212], // heavy thunderstorm
  ],
  wind: new WindSpeedMetresPerSecond(5, 10, "S"),
};

const weather = new Weather(location, now, [], []);

describe("render", () => {
  it("should render the weather", async () => {
    const rendered = await weather.render["text/plain"]({ colour: false });

    // TODO: I can't compare the emoji at the start for some reason, figure it out
    expect(rendered).toContain("20°C, Wind 5–10 m/s ↓");
  });
});

import { describe, expect, it } from "@jest/globals";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { StatusCodes } from "http-status-codes";

import { GeoCodeData } from "@/lib/geocode";
import { Logger } from "@/lib/logger";

import { getRawWeather } from ".";

const { OK } = StatusCodes;

const mockAxios = new AxiosMockAdapter(axios);

const greenwich = new GeoCodeData({
  latitude: 51.477,
  longitude: 0,
});

import greenwichResp from "./testdata/greenwich.json";

mockAxios
  .onGet(
    "https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=51.48&lon=0",
  )
  .reply(OK, greenwichResp);

describe("met.no client", () => {
  it("should return weather", async () => {
    const logger = new Logger();

    const weather = await getRawWeather(logger, greenwich);

    expect(weather).toBeDefined();
  });
});

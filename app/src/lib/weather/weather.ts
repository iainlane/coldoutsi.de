import { InternMap } from "d3-array";
import { Liquid, Template } from "liquidjs";
import path from "path";
import { fileURLToPath } from "url";

import { GeoCodeData } from "@/lib/geocode";
import {
  HTMLRendererOptions,
  JSONRendererOptions,
  PlainTextRendererOptions,
  Renderable,
  RenderableType,
  RendererOptions,
  RenderMethods,
  RenderResult,
} from "@/lib/render";
import { staticFileData } from "@/lib/static";

import {
  Temperature,
  TemperatureToDegrees,
  TemperatureType,
  Units,
  WeatherCondition,
  WindSpeedType,
} from ".";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const engine = new Liquid({
  root: path.resolve(__dirname, "../../lib/weather/templates"),
  extname: ".liquid",
  globals: {
    staticFileData,
  },
  ownPropertyOnly: false,
});

// Add a filter to take a convert a temperature to a feels-like temperature,
// given a humidity.
engine.registerFilter(
  "feels_like",
  (
    temperature: Temperature | { min: Temperature; max: Temperature },
    humidity: number,
    windSpeed: WindSpeedType<Units>,
  ) => {
    if ("min" in temperature && "max" in temperature) {
      const min = TemperatureToDegrees(temperature.min);
      const max = TemperatureToDegrees(temperature.max);

      return {
        min: min.feelsLike(humidity, windSpeed).temperature,
        max: max.feelsLike(humidity, windSpeed).temperature,
      };
    }

    const temp = TemperatureToDegrees(temperature);

    return temp.feelsLike(humidity, windSpeed).temperature;
  },
);

export interface SingleTemp<U extends Units> {
  temp: TemperatureType<U>;
}

export interface Measurement<U extends Units> {
  time: Date;
  pressure: number;
  humidity: number;
  clouds: number;
  weather: (WeatherCondition | undefined)[];
  wind: WindSpeedType<U>;
}

export type CurrentMeasurement<U extends Units> = SingleTemp<U> &
  Measurement<U>;

export type HourlyMeasurement<U extends Units> = SingleTemp<U> & Measurement<U>;

export interface DailyTemperatureMeasurement<U extends Units> {
  temp: {
    min: TemperatureType<U>;
    max: TemperatureType<U>;
  };
}

export type DailyMeasurement<U extends Units> = DailyTemperatureMeasurement<U> &
  Measurement<U>;

const htmlWeatherTemplate = engine.parseFileSync("html/weather");
const textWeatherTemplate = engine.parseFileSync("text/weather");

export class Weather<T extends Units> implements Renderable {
  constructor(
    public readonly location: GeoCodeData,
    public readonly current: CurrentMeasurement<T>,
    public readonly hourly: InternMap<Date, HourlyMeasurement<T>[]>,
    public readonly daily: DailyMeasurement<T>[],
  ) {}

  // `render` is a property that is a map of functions. It shouldn't be in the
  // output.
  private toJSON(): Omit<Weather<T>, "render"> {
    const { render: _render, ...rest } = this;

    return rest;
  }

  private get headers() {
    return {
      "x-coldoutside-latlon": `${this.location.latitude},${this.location.longitude}`,
      "x-coldoutside-location": this.location.toString(),
    };
  }

  private renderJSON(opts: JSONRendererOptions): Promise<RenderResult> {
    const body = opts.pretty
      ? JSON.stringify(this.toJSON(), null, 2)
      : JSON.stringify(this.toJSON());

    return Promise.resolve({ body, headers: this.headers });
  }

  private async renderTemplate(
    template: Template[],
    opts: RendererOptions[RenderableType],
  ): Promise<string> {
    const text = (await engine.render(template, {
      ...this.toJSON(),
      opts: opts,
    })) as Promise<string>;

    return text;
  }

  private async renderPlainText(
    opts: PlainTextRendererOptions,
  ): Promise<RenderResult> {
    return {
      body: await this.renderTemplate(textWeatherTemplate, opts),
      headers: this.headers,
    };
  }

  private async renderHtml(opts: HTMLRendererOptions): Promise<RenderResult> {
    return {
      body: await this.renderTemplate(htmlWeatherTemplate, opts),
      headers: this.headers,
    };
  }

  public render: {
    [contentType in RenderableType]: (
      options: RendererOptions[contentType],
    ) => ReturnType<RenderMethods[contentType]>;
  } = {
    "text/plain": this.renderPlainText.bind(this),
    "text/html": this.renderHtml.bind(this),
    "application/json": this.renderJSON.bind(this),
  };
}

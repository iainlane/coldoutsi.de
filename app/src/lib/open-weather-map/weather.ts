import { Liquid, Template } from "liquidjs";
import path from "path";
import { fileURLToPath } from "url";

import { GeoCodeData } from "@/lib/geocode";
import {
  HTMLRendererOptions,
  JSONRendererOptions,
  PlainTextRendererOptions,
  RenderMethods,
  Renderable,
  RenderableType,
  RendererOptionsMap,
} from "@/lib/render";
import { Units } from "@/lib/weather";
import { CurrentMeasurement, DailyMeasurement, HourlyMeasurement } from ".";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const engine = new Liquid({
  root: path.resolve(__dirname, "../../lib/open-weather-map/templates"),
  extname: ".liquid",
  ownPropertyOnly: false,
});

const htmlWeatherTemplate = engine.parseFileSync("html/weather");
const textWeatherTemplate = engine.parseFileSync("text/weather");

export class Weather<T extends Units> implements Renderable {
  constructor(
    public readonly location: GeoCodeData,
    public readonly current: CurrentMeasurement<T>,
    public readonly hourly: HourlyMeasurement<T>[],
    public readonly daily: DailyMeasurement<T>[],
  ) {}

  // `render` is a property that is a map of functions. It shouldn't be in the
  // output.
  private toJSON(): Omit<Weather<T>, "render"> {
    const { render: _render, ...rest } = this;

    return rest;
  }

  private renderJSON(opts: JSONRendererOptions): string {
    if (opts.pretty) {
      return `${JSON.stringify(this.toJSON(), null, 2)}\n`;
    }

    return `${JSON.stringify(this.toJSON())}\n`;
  }

  private async renderTemplate<T extends RenderableType>(
    template: Template[],
    opts: RendererOptionsMap[T],
  ): Promise<string> {
    const text = (await engine.render(template, {
      ...this.toJSON(),
      opts: opts,
    })) as Promise<string>;

    return text;
  }

  private async renderPlainText(
    opts: PlainTextRendererOptions,
  ): Promise<string> {
    return this.renderTemplate(textWeatherTemplate, opts);
  }

  private async renderHtml(opts: HTMLRendererOptions): Promise<string> {
    return this.renderTemplate(htmlWeatherTemplate, opts);
  }

  public render: {
    [contentType in RenderableType]: (
      options: RendererOptionsMap[contentType],
    ) => ReturnType<RenderMethods[contentType]>;
  } = {
    "text/plain": this.renderPlainText.bind(this),
    "text/html": this.renderHtml.bind(this),
    "application/json": this.renderJSON.bind(this),
  };
}

import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { StatusCodes } from "http-status-codes";
import { Liquid, Template } from "liquidjs";
import Negotiator from "negotiator";
import * as path from "path";
import { fileURLToPath } from "url";

import { handlerFactory } from "@/lib/handler-factory";
import { WeatherConditions as WeatherConditionsOWM } from "@/lib/open-weather-map";
import { WeatherConditions as WeatherConditionsMetNo } from "@/lib/metno";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const engine = new Liquid({
  root: path.resolve(__dirname, "templates"),
  extname: ".liquid",
  ownPropertyOnly: false,
  trimTagRight: true,
});

const textHtmlTemplate = engine.parseFileSync("texthtml");
const textPlainTemplate = engine.parseFileSync("textplain");

const { OK } = StatusCodes;

async function renderTemplate(template: Template[]): Promise<string> {
  const text = (await engine.render(template, {
    owm: WeatherConditionsOWM,
    metno: WeatherConditionsMetNo,
  })) as Promise<string>;

  return text;
}

async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const negotiator = new Negotiator(event);
  const type = negotiator.mediaType(["text/html"]);
  const mostPreferredType = negotiator.mediaType();

  // Check if the client accepts HTML. But not */*, as this would mean we return
  // HTML all of the time. So we only return HTML if the client explicitly wants
  // it.
  if (type === "text/html" && mostPreferredType !== "*/*") {
    return {
      statusCode: OK,
      headers: {
        "cache-control": "no-store, no-cache, must-revalidate",
        "content-type": "text/html; charset=utf-8",
      },
      body: await renderTemplate(textHtmlTemplate),
    };
  }

  return {
    statusCode: OK,
    headers: {
      "cache-control": "no-store, no-cache, must-revalidate",
      "content-type": "text/plain; charset=utf-8",
    },
    body: await renderTemplate(textPlainTemplate),
  };
}

export const testHandler = handlerFactory(handler);

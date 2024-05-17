import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import httpHeaderNormalizer from "@middy/http-header-normalizer";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import * as fs from "fs";
import { StatusCodes } from "http-status-codes";
import Negotiator from "negotiator";
import * as path from "path";
import { fileURLToPath } from "url";

import { cacheControlMiddleware } from "@/lib/cachecontrol";
import { loggerMiddleware } from "@/lib/logger";

// Read HTML content from file during the cold start of the Lambda function
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlFilePath = path.resolve(__dirname, "../../../static/index.html");
const htmlContent = fs.readFileSync(htmlFilePath, "utf8");

const { OK } = StatusCodes;

function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const negotiator = new Negotiator(event);
  const type = negotiator.mediaType(["text/html"]);
  const mostPreferredType = negotiator.mediaType();

  // Check if the client accepts HTML. But not */*, as this would mean we return
  // HTML all of the time. So we only return HTML if the client explicitly wants
  // it.
  if (type === "text/html" && mostPreferredType !== "*/*") {
    return Promise.resolve({
      statusCode: OK,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
      body: htmlContent,
    });
  }

  // Redirect to `:unknown` (relative to the current page) if the client doesn't
  // accept HTML
  const rawPath = event.rawPath + (event.rawPath.endsWith("/") ? "" : "/");
  const queryString = event.rawQueryString ? `?${event.rawQueryString}` : "";
  return Promise.resolve({
    statusCode: 302,
    headers: {
      Location: `${rawPath}:unknown${queryString}`,
    },
    body: "",
  });
}

export const indexHandler = middy<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
>()
  .use(loggerMiddleware())
  .use(cacheControlMiddleware())
  .use(httpHeaderNormalizer())
  .use(httpErrorHandler())
  .handler(handler);

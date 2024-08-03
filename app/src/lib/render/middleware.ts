import { MiddlewareObj } from "@middy/core";
import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { StatusCodes } from "http-status-codes";

import type { LoggerContext } from "@/lib/logger";
import {
  Renderable,
  RenderableType,
  getPreferredContentType,
  isRenderable,
} from ".";
import { optionsParser } from "./option-parsers";

// Without the generic, `renderer` gets inferred as the union of all the
// renderer functions. With it, it gets inferred as the specific renderer for
// `T`. This is necessary because the `options` parameter is different for each
// renderer.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
async function renderContent<T extends RenderableType>(
  renderable: Renderable,
  contentType: T,
  event: APIGatewayProxyEventV2,
): Promise<string> {
  const renderer = renderable.render[contentType];
  const options = optionsParser[contentType](event);

  return renderer(options);
}

export function renderableMiddleware<TErr>(): MiddlewareObj<
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
  TErr,
  LoggerContext
> {
  return {
    after: async (request) => {
      const { event, response, context } = request;
      if (response === null) {
        return;
      }

      const log = context.logger.createChild({
        persistentLogAttributes: {
          middleware: "render",
        },
      });

      // Not renderable, pass it through
      if (!isRenderable(response)) {
        return;
      }

      log.debug("Rendering response", {
        headers: event.headers,
      });

      const acceptHeader = event.headers["accept"];

      if (acceptHeader === undefined) {
        request.response = {
          statusCode: StatusCodes.NOT_ACCEPTABLE,
          body: "An Accept header is required",
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        };
        return;
      }

      const contentType = getPreferredContentType(response, event, log);

      if (contentType === undefined) {
        request.response = {
          statusCode: StatusCodes.NOT_ACCEPTABLE,
          body: `Content type ${acceptHeader} is not supported`,
        };
        return;
      }

      const renderedContent = await renderContent(response, contentType, event);

      request.response = {
        statusCode: StatusCodes.OK,
        body: renderedContent,
        headers: {
          ...response.headers,
          "Content-Type": `${contentType}; charset=utf-8`,
        },
      };

      log.debug("Response rendered");
    },
  };
}

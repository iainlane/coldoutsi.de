import type { APIGatewayProxyEventV2 } from "aws-lambda";
import Negotiator from "negotiator";

import type { Logger } from "@/lib/logger";

export interface JSONRendererOptions {
  pretty: boolean;
}

// No options for HTML yet
export type HTMLRendererOptions = { [key in PropertyKey]: never };

export interface PlainTextRendererOptions {
  colour: boolean;
  formatString?: string;
}

export interface RenderResult {
  body: string;
  headers?: { [key: string]: string };
}

export interface RenderMethods {
  "text/plain": (options: PlainTextRendererOptions) => Promise<RenderResult>;
  "text/html": (options: HTMLRendererOptions) => Promise<RenderResult>;
  "application/json": (options: JSONRendererOptions) => Promise<RenderResult>;
}

const renderableTypes = new Set([
  "text/plain",
  "text/html",
  "application/json",
]);

export type RenderableType = keyof RenderMethods;

export type RendererOptions = {
  [P in RenderableType]: RenderMethods[P] extends (
    options: infer O,
  ) => Promise<RenderResult>
    ? O
    : never;
};

export interface Renderable {
  render: {
    [P in RenderableType]: (
      options: RendererOptions[P],
    ) => Promise<RenderResult>;
  };
}

function setDifference<T>(a: Iterable<T>, b: Set<T>) {
  return new Set(Array.from(a).filter((item) => !b.has(item)));
}

export function isRenderable(r: unknown): r is Renderable {
  return (
    r !== null &&
    typeof r === "object" &&
    "render" in r &&
    typeof (r as Renderable).render === "object" &&
    // the keys of the render object are the supported content types
    setDifference(Object.keys((r as Renderable).render), renderableTypes)
      .size === 0
  );
}

export function getPreferredContentType(
  r: Renderable,
  event: APIGatewayProxyEventV2,
  logger: Logger,
): RenderableType | undefined {
  if (event.headers["accept"] === undefined) {
    logger.debug("No Accept header");
    return undefined;
  }

  const negotiator = new Negotiator(event);

  const type = negotiator.mediaType(Object.keys(r.render)) as RenderableType;

  logger.debug("Negotiated content type", {
    acceptHeader: event.headers["accept"],
    supportedTypes: Object.keys(r.render),
    negotiatedType: type,
  });

  return type;
}

export { renderableMiddleware } from "./middleware";

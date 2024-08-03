import {
  JSONRendererOptions,
  PlainTextRendererOptions,
  RendererOptions,
  RenderableType,
  HTMLRendererOptions,
} from ".";

interface queryParams {
  [name: string]: string | undefined;
}

interface QueryParams {
  queryStringParameters?: queryParams;
}

function parseBoolean(params: queryParams, name: string, def = true): boolean {
  const truthyValues = new Set(["true", "1", "yes"]);
  const falsyValues = new Set(["false", "0", "no"]);

  const param = params[name];

  if (param === undefined) {
    return def;
  }

  const paramValue = param.toLowerCase();

  if (truthyValues.has(paramValue)) {
    return true;
  }

  if (falsyValues.has(paramValue)) {
    return false;
  }

  return def;
}

function parseJSONOptions({
  queryStringParameters,
}: QueryParams): JSONRendererOptions {
  return {
    pretty: parseBoolean(queryStringParameters ?? {}, "pretty"),
  };
}

function parsePlainTextOptions({
  queryStringParameters,
}: QueryParams): PlainTextRendererOptions {
  const format = queryStringParameters?.["format"];

  return {
    colour: parseBoolean(queryStringParameters ?? {}, "colour"),
    ...(format
      ? {
          formatString: format,
        }
      : {}),
  };
}

function parseHtmlOptions(/*{
  queryStringParameters,
}: QueryParams*/): HTMLRendererOptions {
  return {};
}

export type OptionsParser = {
  [P in RenderableType]: (queryParams: QueryParams) => RendererOptions[P];
};

export const optionsParser: OptionsParser = {
  "application/json": parseJSONOptions,
  "text/html": parseHtmlOptions,
  "text/plain": parsePlainTextOptions,
};

import { describe, expect, it } from "@jest/globals";

import {
  Renderable,
  RendererOptionsMap,
  RenderableType,
  JSONRendererOptions,
} from "./index";

class SimplifiedRenderable implements Renderable {
  constructor(public readonly data: { key: string }) {}

  public render: {
    [contentType in RenderableType]: (
      options: RendererOptionsMap[contentType],
    ) => string;
  } = {
    "application/json": (options: JSONRendererOptions) => {
      return options.pretty
        ? JSON.stringify(this.data, null, 2)
        : JSON.stringify(this.data);
    },
    "text/html": () => `<p>${this.data.key}</p>`,
    "text/plain": () => {
      return this.data.key;
    },
  };
}

describe("SimplifiedRenderable", () => {
  it("renders to JSON", () => {
    const renderable = new SimplifiedRenderable({ key: "value" });
    const result = renderable.render["application/json"]({ pretty: false });
    expect(result).toBe('{"key":"value"}');
  });

  it("renders to pretty JSON", () => {
    const renderable = new SimplifiedRenderable({ key: "value" });
    const result = renderable.render["application/json"]({ pretty: true });
    expect(result).toBe('{\n  "key": "value"\n}');
  });

  it("renders to plain text", () => {
    const renderable = new SimplifiedRenderable({ key: "Hello, World!" });
    const result = renderable.render["text/plain"]({ colour: false });
    expect(result).toBe("Hello, World!");
  });
});

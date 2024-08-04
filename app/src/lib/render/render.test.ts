import { describe, expect, it } from "@jest/globals";

import {
  Renderable,
  RendererOptions,
  RenderableType,
  JSONRendererOptions,
  RenderResult,
} from "./index";

class SimplifiedRenderable implements Renderable {
  constructor(public readonly data: { key: string }) {}

  public render: {
    [contentType in RenderableType]: (
      options: RendererOptions[contentType],
    ) => Promise<RenderResult>;
  } = {
    "application/json": (options: JSONRendererOptions) =>
      Promise.resolve({
        body: options.pretty
          ? JSON.stringify(this.data, null, 2)
          : JSON.stringify(this.data),
      }),
    "text/html": () => Promise.resolve({ body: `<p>${this.data.key}</p>` }),
    "text/plain": () => Promise.resolve({ body: this.data.key }),
  };
}

describe("SimplifiedRenderable", () => {
  it("renders to JSON", async () => {
    const renderable = new SimplifiedRenderable({ key: "value" });
    const result = await renderable.render["application/json"]({
      pretty: false,
    });
    expect(result.body).toBe('{"key":"value"}');
  });

  it("renders to pretty JSON", async () => {
    const renderable = new SimplifiedRenderable({ key: "value" });
    const result = await renderable.render["application/json"]({
      pretty: true,
    });
    expect(result.body).toBe('{\n  "key": "value"\n}');
  });

  it("renders to plain text", async () => {
    const renderable = new SimplifiedRenderable({ key: "Hello, World!" });
    const result = await renderable.render["text/plain"]({ colour: false });
    expect(result.body).toBe("Hello, World!");
  });
});

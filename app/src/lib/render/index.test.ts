import { describe, expect, it } from "@jest/globals";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { mock } from "jest-mock-extended";
import type { Logger } from "@/lib/logger";

import { getPreferredContentType, Renderable, RenderMethods } from "./index";

const render = mock<Renderable>({
  render: {
    "text/plain": mock<RenderMethods["text/plain"]>(),
    "text/html": mock<RenderMethods["text/html"]>(),
    "application/json": mock<RenderMethods["application/json"]>(),
  },
});

const mockLogger = mock<Logger>();

describe("getPreferredContentType", () => {
  it("returns the preferred content type based on the request headers", () => {
    const event = mock<APIGatewayProxyEventV2>({
      headers: {
        accept: "application/json",
      },
    });

    const result = getPreferredContentType(render, event, mockLogger);

    expect(result).toBe("application/json");
  });

  it("returns the first matching content type if multiple are found", () => {
    const event = mock<APIGatewayProxyEventV2>({
      headers: {
        accept: "text/html, application/json",
      },
    });

    const result = getPreferredContentType(render, event, mockLogger);

    expect(result).toBe("text/html");
  });

  it("handles */* as a wildcard", () => {
    const event = mock<APIGatewayProxyEventV2>({
      headers: {
        accept: "*/*",
      },
    });

    const result = getPreferredContentType(render, event, mockLogger);

    expect(result).toBe("text/plain");
  });

  it("handles text/* as a wildcard", () => {
    const event = mock<APIGatewayProxyEventV2>({
      headers: {
        accept: "text/*",
      },
    });

    const result = getPreferredContentType(render, event, mockLogger);

    expect(result).toBe("text/plain");
  });

  it("handles quality values", () => {
    const event = mock<APIGatewayProxyEventV2>({
      headers: {
        accept: "text/html;q=0.7, application/json;q=0.8",
      },
    });

    const result = getPreferredContentType(render, event, mockLogger);

    expect(result).toBe("application/json");
  });

  it("handles chrome's default accept header", () => {
    const event = mock<APIGatewayProxyEventV2>({
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    const result = getPreferredContentType(render, event, mockLogger);

    expect(result).toBe("text/html");
  });

  it("returns undefined if no matching content type is found", () => {
    const event = mock<APIGatewayProxyEventV2>({
      headers: {
        accept: "foo/bar",
      },
    });

    const result = getPreferredContentType(render, event, mockLogger);

    expect(result).toBeUndefined();
  });

  it("returns undefined if no accept header is present", () => {
    const event = mock<APIGatewayProxyEventV2>();
    event.headers = {};

    const result = getPreferredContentType(render, event, mockLogger);

    expect(result).toBeUndefined();
  });
});

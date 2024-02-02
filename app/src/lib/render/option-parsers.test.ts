import { describe, expect, it } from "@jest/globals";

import { optionsParser } from "./option-parsers";

describe("Options Parser", () => {
  it("parses JSON options correctly", () => {
    const mockEvent = {
      queryStringParameters: {
        pretty: "true",
      },
    };

    const jsonOptions = optionsParser["application/json"](mockEvent);
    expect(jsonOptions.pretty).toBe(true);
  });

  it("defaults JSON options correctly", () => {
    const jsonOptions = optionsParser["application/json"]({});
    expect(jsonOptions.pretty).toBe(true);
  });

  it("recognises 'no' as a falsy value", () => {
    const mockEvent = {
      queryStringParameters: {
        pretty: "no",
      },
    };

    const jsonOptions = optionsParser["application/json"](mockEvent);
    expect(jsonOptions.pretty).toBe(false);
  });

  it("parses Plain Text options correctly", () => {
    const mockEvent = {
      queryStringParameters: {
        pretty: "true",
      },
    };

    const textOptions = optionsParser["text/plain"](mockEvent);
    expect(textOptions).toEqual({
      colour: true,
    });
  });

  it("returns the default if the value is not recognised", () => {
    const mockEvent = {
      queryStringParameters: {
        colour: "maybe",
      },
    };

    const textOptions = optionsParser["text/plain"](mockEvent);
    expect(textOptions).toEqual({
      colour: true,
    });
  });
});

import { describe, it, expect } from "@jest/globals";

import { removePrefix } from "./str";

describe("string utils", () => {
  it.each<{
    prefix: string;
    str: string | undefined;
    expected: string | undefined;
  }>([
    { prefix: "", str: "hello", expected: "hello" },
    { prefix: "", str: "world", expected: "world" },
    { prefix: "hello", str: "hello world", expected: " world" },
    { prefix: "world", str: "hello world", expected: "hello world" },
    { prefix: "hello", str: undefined, expected: undefined },
  ])("remove '$prefix' from '$str'", ({ prefix, str, expected }) => {
    expect(removePrefix(prefix, str)).toEqual(expected);
  });
});

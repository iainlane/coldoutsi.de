import { describe, it, expect } from "@jest/globals";

import { addPrefix, addSuffix, removePrefix } from "./str";

describe("string utils", () => {
  it.each<{
    prefix: string;
    str: string | undefined;
    expected: string | undefined;
  }>([
    { prefix: "", str: "hello", expected: "hello" },
    { prefix: "", str: "world", expected: "world" },
    { prefix: "hello", str: "", expected: "" },
    { prefix: "hello", str: "hello world", expected: "hello world" },
    { prefix: "world", str: "hello world", expected: "worldhello world" },
    { prefix: "hello", str: undefined, expected: undefined },
  ])(
    "add '$prefix' to the beginning of '$str'",
    ({ prefix, str, expected }) => {
      expect(addPrefix(prefix, str)).toEqual(expected);
    },
  );

  it.each<{
    prefix: string;
    str: string | undefined;
    expected: string | undefined;
  }>([
    { prefix: "", str: "hello", expected: "hello" },
    { prefix: "", str: "world", expected: "world" },
    { prefix: "hello", str: "", expected: "hello" },
    { prefix: "hello", str: "hello world", expected: " world" },
    { prefix: "world", str: "hello world", expected: "hello world" },
    { prefix: "hello", str: undefined, expected: undefined },
  ])(
    "remove '$prefix' from the beginning of '$str'",
    ({ prefix, str, expected }) => {
      expect(removePrefix(prefix, str)).toEqual(expected);
    },
  );

  it.each<{
    suffix: string;
    str: string | undefined;
    expected: string | undefined;
  }>([
    { suffix: "", str: "hello", expected: "hello" },
    { suffix: "", str: "world", expected: "world" },
    { suffix: "world", str: "", expected: "" },
    { suffix: "world", str: "hello", expected: "helloworld" },
    { suffix: "world", str: "hello world", expected: "hello world" },
    { suffix: "world", str: undefined, expected: undefined },
  ])("add '$suffix' to the end of'$str'", ({ suffix, str, expected }) => {
    expect(addSuffix(suffix, str)).toEqual(expected);
  });
});

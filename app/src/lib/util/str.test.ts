import { describe, it, expect } from "@jest/globals";

import {
  addPrefix,
  addSuffix,
  removePathParts,
  removePrefix,
  removeSuffixes,
} from "./str";

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
    { prefix: "hello", str: "", expected: "" },
    { prefix: "hello", str: "hello world", expected: "world" },
    { prefix: "world", str: "hello world", expected: "hello world" },
    { prefix: "hello", str: undefined, expected: undefined },
    { prefix: "", str: " hello", expected: "hello" },
    { prefix: "foo", str: " hello", expected: "hello" },
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

  it.each<{
    suffix: string;
    str: string | undefined;
    maxOccurrences?: number;
    expected: string | undefined;
  }>([
    { suffix: "", str: "hello", expected: "hello" },
    { suffix: "", str: "world", expected: "world" },
    { suffix: "world", str: "", expected: "" },
    { suffix: "world", str: "hello", expected: "hello" },
    { suffix: "world", str: "hello world", expected: "hello" },
    { suffix: "world", str: undefined, expected: undefined },
    {
      suffix: "world",
      str: "hello world",
      maxOccurrences: 1,
      expected: "hello",
    },
    {
      suffix: "world",
      str: "hello world",
      maxOccurrences: 2,
      expected: "hello",
    },
    {
      suffix: "world",
      str: "hello world world",
      maxOccurrences: 1,
      expected: "hello world",
    },
    {
      suffix: "world",
      str: "hello world world",
      maxOccurrences: 2,
      expected: "hello",
    },
    {
      suffix: "",
      str: "hello ",
      expected: "hello",
    },
  ])(
    "remove $maxOccurrences '$suffix' from the end of '$str'",
    ({ suffix, str, expected, maxOccurrences }) => {
      expect(removeSuffixes(suffix, str, maxOccurrences)).toEqual(expected);
    },
  );
});

describe("HTTP path utils", () => {
  it.each<{
    n_parts: number;
    path: string | undefined;
    expected: string | undefined;
  }>([
    { n_parts: 0, path: "hello/world", expected: "hello/world" },
    { n_parts: 1, path: "hello/world", expected: "hello" },
    { n_parts: 2, path: "hello/world", expected: "" },
    { n_parts: 0, path: "hello/world/", expected: "hello/world" },
    { n_parts: 1, path: "hello/world/", expected: "hello" },
    { n_parts: 1, path: "hello/world/////   ", expected: "hello" },
    { n_parts: 1337, path: undefined, expected: undefined },
  ])("remove $n_parts from the end of $path", ({ n_parts, path, expected }) => {
    expect(removePathParts(n_parts, path)).toEqual(expected);
  });
});

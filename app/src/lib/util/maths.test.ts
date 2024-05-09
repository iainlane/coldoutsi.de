import { describe, expect, it } from "@jest/globals";

import { toOneDP, toTwoDP } from ".";

describe("maths utitlies", () => {
  it("rounds to 1 decimal place", () => {
    expect(toOneDP(1.2345)).toBe(1.2);
  });

  it("rounds to 2 decimal places", () => {
    expect(toTwoDP(1.2345)).toBe(1.23);
  });

  it("leaves integers unchanged", () => {
    expect(toOneDP(1)).toBe(1);
    expect(toTwoDP(1)).toBe(1);
  });
});

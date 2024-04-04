import { describe, it, expect } from "@jest/globals";
import { formatMany, formatString, RenderColours } from "./colours";
import chalk from "chalk";

describe("Colour Formatter", () => {
  describe("formatString function", () => {
    it("should correctly format strings using ANSI format functions", () => {
      const formattedString = formatString("ansi", ({ green }) =>
        green("Green text"),
      );
      expect(formattedString).toBe(chalk.green("Green text"));
    });

    it("should correctly format strings using HTML format functions", () => {
      const formattedString = formatString("html", ({ green }) =>
        green("Green text"),
      );
      expect(formattedString).toBe('<span class="green">Green text</span>');
    });
  });

  it("formats using formatMany", () => {
    const artTemplates = formatMany(
      ({ grey, yellowBright }: RenderColours) => ({
        goodbye: grey("goodbye"),
        hello: yellowBright("hello"),
      }),
    );

    expect(artTemplates.goodbye).toEqual({
      html: '<span class="grey">goodbye</span>',
      ansi: chalk.ansi256(251)("goodbye"),
    });

    expect(artTemplates.hello).toEqual({
      html: '<span class="yellowBright">hello</span>',
      ansi: chalk.yellowBright("hello"),
    });
  });
});

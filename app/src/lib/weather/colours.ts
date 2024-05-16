import chalk from "chalk";

chalk.level = 3;

function cssString(colour: string): (text: string) => string {
  return (text: string) => `<span class="${colour}">${text}</span>`;
}

type Modes = "ansi" | "html";

interface ColourMappings {
  [key: string]: { [mode in Modes]: (text: string) => string };
}

const colourMappings = {
  green: { ansi: chalk.green, html: cssString("green") },
  greenbright: { ansi: chalk.greenBright, html: cssString("greenbright") },
  yellow: { ansi: chalk.yellow, html: cssString("yellow") },
  yellowbright: { ansi: chalk.yellowBright, html: cssString("yellowbright") },
  redbright: { ansi: chalk.redBright, html: cssString("redbright") },
  red: { ansi: chalk.red, html: cssString("red") },
  white: { ansi: chalk.white, html: cssString("white") },
  grey: { ansi: chalk.ansi256(251), html: cssString("grey") },
  lightgrey: { ansi: chalk.hex("#C0C0C0"), html: cssString("lightgrey") },
  darkgrey: { ansi: chalk.bold.hex("#808080"), html: cssString("darkgrey") },
  blue: { ansi: chalk.blue, html: cssString("blue") },
  lightBlue: { ansi: chalk.bold.hex("#ADD8E6"), html: cssString("lightblue") },
  whitebright: { ansi: chalk.whiteBright, html: cssString("whitebright") },
  black: { ansi: chalk.black, html: cssString("black") },
} satisfies ColourMappings;

export type ThemeColours = keyof typeof colourMappings;

type InvertMappings<T extends ColourMappings> = {
  [P in Modes]: {
    [K in keyof T]: T[K][P];
  };
};

const formatFunctions: InvertMappings<typeof colourMappings> = (() => {
  const initialAcc = {
    ansi: {} as {
      [K in ThemeColours]: (typeof colourMappings)[K]["ansi"];
    },
    html: {} as {
      [K in ThemeColours]: (typeof colourMappings)[K]["html"];
    },
  };

  return Object.keys(colourMappings).reduce((acc, colourKey) => {
    const colour = colourKey as ThemeColours;

    acc.ansi[colour] = colourMappings[colour].ansi;
    acc.html[colour] = colourMappings[colour].html;

    return acc;
  }, initialAcc);
})();

export const ansi = formatFunctions.ansi;
export const html = formatFunctions.html;

export type RenderColours = { [C in ThemeColours]: (text: string) => string };

export function formatString(
  mode: Modes,
  stringFn: (formatFn: RenderColours) => string,
): string {
  return stringFn(formatFunctions[mode]);
}

type RenderedStrings = {
  [M in Modes]: string;
};
type RenderedStringsMap<T extends { [key: string]: string }> = {
  [K in keyof T]: RenderedStrings;
};

export function formatMany<T extends { [key: string]: string }>(
  artTemplatesFn: (args: RenderColours) => T,
): RenderedStringsMap<T> {
  const ansiArt = artTemplatesFn(ansi);
  const htmlArt = artTemplatesFn(html);

  const result = {} as RenderedStringsMap<T>;

  for (const key in ansiArt) {
    const k = key as keyof T;
    result[k] = {
      ansi: ansiArt[k],
      html: htmlArt[k],
    } as RenderedStrings;
  }

  return result;
}

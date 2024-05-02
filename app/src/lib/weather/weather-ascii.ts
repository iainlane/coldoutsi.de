// Credit:
// - moon: https://github.com/chubin/pyphoon/blob/492ede17bb4a7a549f9da029a211e92e2499d46a/pyphoon/lib/moons.py#L3-L9 (modified to 5 lines)
// - others: https://github.com/schachmat/wego/blob/62bbbfe727e06f3cadcd34ea69028507796c28c3/frontends/ascii-art-table.go#L149-L284

import dedent from "dedent-js";

import { formatMany, RenderColours } from "./colours";

export const artTemplates = formatMany(
  ({
    blue,
    darkGrey,
    grey,
    lightBlue,
    lightGrey,
    whiteBright,
    yellow,
    yellowBright,
  }: RenderColours) => ({
    iconUnknown: dedent`
    ${grey("    .-.      ")}
    ${grey("     __)     ")}
    ${grey("    (        ")}
    ${grey("     `-’     ")}
    ${grey("      •      ")}`,

    iconSunny: dedent`
    ${yellowBright("    \\ . /    ")}
    ${yellowBright("   - .-. -   ")}
    ${yellowBright("  ― (   ) ―  ")}
    ${yellowBright("   . `-’ .   ")}
    ${yellowBright("    / ' \\    ")}`,

    iconMoon: dedent`
    ${lightGrey("   ..-..  ")}
    ${lightGrey(" .` o  .`.")}
    ${lightGrey(" o~.   O )")}
    ${lightGrey(" `..o...'/")}
    ${lightGrey("   `'-''  ")}`,

    iconPartlyCloudy: dedent`
    ${yellowBright("  \\__/")}      ${lightGrey(" ")}
    ${yellowBright("_ /  ")} ${lightGrey(".-.    ")}
    ${yellowBright("  \\_")} ${lightGrey("(   ).  ")}
    ${yellowBright("  /")} ${lightGrey("(___(__) ")}
    ${lightGrey("             ")}`,

    iconCloudy: dedent`
    ${lightGrey("             ")}
    ${lightGrey("     .--.    ")}
    ${lightGrey("  .-(    ).  ")}
    ${lightGrey(" (___.__)__) ")}
    ${lightGrey("             ")}`,

    iconVeryCloudy: dedent`
    ${darkGrey("             ")}
    ${darkGrey("     .--.    ")}
    ${darkGrey("  .-(    ).  ")}
    ${darkGrey(" (___.__)__) ")}
    ${darkGrey("             ")}`,

    iconLightShowers: dedent`
  ${yellowBright(' _`/""')} ${lightGrey(".-.    ")}
  ${yellowBright("  ,\\_")} ${lightGrey("(   ).  ")}
  ${yellowBright("   /")} ${lightGrey("(___(__) ")}
  ${lightBlue("      ‘ ‘ ‘ ‘ ")}
  ${lightBlue("     ‘ ‘ ‘ ‘  ")}`,

    iconHeavyShowers: dedent`
  ${yellowBright(' _`/""')} ${darkGrey(".-.    ")}
  ${yellowBright("  ,\\_")} ${darkGrey("(   ).  ")}
  ${yellowBright("   /")} ${darkGrey("(___(__) ")}
  ${blue("     ‚‘‚‘‚‘‚‘  ")}
  ${blue("     ‚’‚’‚’‚’  ")}`,

    iconLightSnowShowers: dedent`
  ${yellowBright(' _`/""')} ${lightGrey(".-.    ")}
  ${yellowBright("  ,\\_")} ${lightGrey("(   ).  ")}
  ${yellowBright("   /")} ${lightGrey("(___(__) ")}
  ${whiteBright("     *  *  * ")}
  ${whiteBright("    *  *  *  ")}`,

    iconHeavySnowShowers: dedent`
  ${yellowBright(' _`/""')} ${darkGrey(".-.    ")}
  ${yellowBright("  ,\\_")} ${darkGrey("(   ).  ")}
  ${yellowBright("   /")} ${darkGrey("(___(__) ")}
  ${whiteBright("     * * * *  ")}
  ${whiteBright("    * * * *   ")}`,

    iconLightSleetShowers: dedent`
  ${yellowBright(' _`/""')} ${lightGrey(".-.    ")}
  ${yellowBright("  ,\\_")} ${lightGrey("(   ).  ")}
  ${yellowBright("   /")} ${lightGrey("(___(__) ")}
  ${lightBlue("     ‘ ")}${whiteBright("*")} ${lightBlue("‘ ")}${whiteBright("*")} ${lightBlue(" ")}
  ${whiteBright("     *")} ${lightBlue("‘ ")}${whiteBright("*")} ${lightBlue("‘  ")}`,

    iconThunderyShowers: dedent`
  ${yellowBright(' _`/""')} ${lightGrey(".-.    ")}
  ${yellowBright("  ,\\_")} ${lightGrey("(   ).  ")}
  ${yellowBright("   /")} ${lightGrey("(___(__) ")}
  ${yellowBright("     ⚡")}${lightBlue("‘‘")}${yellow("⚡")}${lightBlue("‘‘")}
  ${lightBlue("     ‘ ‘ ‘ ‘  ")}`,

    iconThunderyHeavyRain: dedent`
  ${darkGrey("     .-.     ")}
  ${darkGrey("    (   ).   ")}
  ${darkGrey("   (___(__)  ")}
  ${blue("  ‚‘")}${yellow("⚡")}${blue("‘‚")}${yellow("⚡")}${blue("‚‘")}
  ${blue("  ‚’‚’")}${yellow("⚡")}${blue("’‚’")}`,

    iconThunderySnowShowers: dedent`
  ${yellowBright('  _`/""')} ${lightGrey(".-.")}
  ${yellowBright("  ,\\_")} ${lightGrey("(   ).")}
  ${yellowBright("   /")} ${lightGrey("(___(__)")}
  ${whiteBright("     *")} ${yellow("⚡")} ${whiteBright("*")} ${yellow("⚡")} ${whiteBright("* ")}
  ${whiteBright("    *  *  *")}`,

    iconLightRain: dedent`
  ${lightGrey("     .-.   ")}
  ${lightGrey("    (   ). ")}
  ${lightGrey("   (___(__)")}
  ${lightBlue("    ‘ ‘ ‘ ‘")}
  ${lightBlue("   ‘ ‘ ‘ ‘ ")}`,

    iconHeavyRain: dedent`
  ${darkGrey("     .-.     ")}
  ${darkGrey("    (   ).   ")}
  ${darkGrey("   (___(__)  ")}
  ${blue("   ‚‘‚‘‚‘‚‘   ")}
  ${blue("   ‚’‚’‚’‚’   ")}`,

    iconLightSnow: dedent`
  ${lightGrey("     .-.     ")}
  ${lightGrey("    (   ).   ")}
  ${lightGrey("   (___(__)  ")}
  ${whiteBright("    *  *  *  ")}
  ${whiteBright("   *  *  *   ")}`,

    iconHeavySnow: dedent`
  ${darkGrey("     .-.     ")}
  ${darkGrey("    (   ).   ")}
  ${darkGrey("   (___(__)  ")}
  ${whiteBright("    * * * *   ")}
  ${whiteBright("   * * * *    ")}`,

    iconLightSleet: dedent`
  ${lightGrey("     .-.     ")}
  ${lightGrey("    (   ).   ")}
  ${lightGrey("   (___(__)  ")}
  ${lightBlue("   ‘ ")}${whiteBright("*")} ${lightBlue("‘ ")}${whiteBright("*")} ${lightBlue("  ")}
  ${whiteBright("   *")} ${lightBlue("‘ ")}${whiteBright("*")} ${lightBlue("‘   ")}`,

    iconFog: dedent`
  ${grey("             ")}
  ${grey(" _ - _ - _ - ")}
  ${grey("  _ - _ - _  ")}
  ${grey(" _ - _ - _ - ")}
  ${grey("             ")}`,
  }),
);

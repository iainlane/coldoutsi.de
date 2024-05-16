// Credit:
// - moon: https://github.com/chubin/pyphoon/blob/492ede17bb4a7a549f9da029a211e92e2499d46a/pyphoon/lib/moons.py#L3-L9 (modified to 5 lines)
// - others: https://github.com/schachmat/wego/blob/62bbbfe727e06f3cadcd34ea69028507796c28c3/frontends/ascii-art-table.go#L149-L284

import dedent from "dedent-js";

import { formatMany, RenderColours } from "./colours";

export const artTemplates = formatMany(
  ({
    blue,
    darkgrey,
    grey,
    lightBlue,
    lightgrey,
    whitebright,
    yellow,
    yellowbright,
  }: RenderColours) => ({
    iconUnknown: dedent`
    ${grey("    .-.      ")}
    ${grey("     __)     ")}
    ${grey("    (        ")}
    ${grey("     `-’     ")}
    ${grey("      •      ")}`,

    iconSunny: dedent`
    ${yellowbright("    \\ . /    ")}
    ${yellowbright("   - .-. -   ")}
    ${yellowbright("  ― (   ) ―  ")}
    ${yellowbright("   . `-’ .   ")}
    ${yellowbright("    / ' \\    ")}`,

    iconMoon: dedent`
    ${lightgrey("   ..-..  ")}
    ${lightgrey(" .` o  .`.")}
    ${lightgrey(" o~.   O )")}
    ${lightgrey(" `..o...'/")}
    ${lightgrey("   `'-''  ")}`,

    iconPartlyCloudy: dedent`
    ${yellowbright("  \\__/")}      ${lightgrey(" ")}
    ${yellowbright("_ /  ")} ${lightgrey(".-.    ")}
    ${yellowbright("  \\_")} ${lightgrey("(   ).  ")}
    ${yellowbright("  /")} ${lightgrey("(___(__) ")}
    ${lightgrey("             ")}`,

    iconCloudy: dedent`
    ${lightgrey("             ")}
    ${lightgrey("     .--.    ")}
    ${lightgrey("  .-(    ).  ")}
    ${lightgrey(" (___.__)__) ")}
    ${lightgrey("             ")}`,

    iconVeryCloudy: dedent`
    ${darkgrey("             ")}
    ${darkgrey("     .--.    ")}
    ${darkgrey("  .-(    ).  ")}
    ${darkgrey(" (___.__)__) ")}
    ${darkgrey("             ")}`,

    iconLightShowers: dedent`
  ${yellowbright(' _`/""')} ${lightgrey(".-.    ")}
  ${yellowbright("  ,\\_")} ${lightgrey("(   ).  ")}
  ${yellowbright("   /")} ${lightgrey("(___(__) ")}
  ${lightBlue("      ‘ ‘ ‘ ‘ ")}
  ${lightBlue("     ‘ ‘ ‘ ‘  ")}`,

    iconHeavyShowers: dedent`
  ${yellowbright(' _`/""')} ${darkgrey(".-.    ")}
  ${yellowbright("  ,\\_")} ${darkgrey("(   ).  ")}
  ${yellowbright("   /")} ${darkgrey("(___(__) ")}
  ${blue("     ‚‘‚‘‚‘‚‘  ")}
  ${blue("     ‚’‚’‚’‚’  ")}`,

    iconLightSnowShowers: dedent`
  ${yellowbright(' _`/""')} ${lightgrey(".-.    ")}
  ${yellowbright("  ,\\_")} ${lightgrey("(   ).  ")}
  ${yellowbright("   /")} ${lightgrey("(___(__) ")}
  ${whitebright("     *  *  * ")}
  ${whitebright("    *  *  *  ")}`,

    iconHeavySnowShowers: dedent`
  ${yellowbright(' _`/""')} ${darkgrey(".-.    ")}
  ${yellowbright("  ,\\_")} ${darkgrey("(   ).  ")}
  ${yellowbright("   /")} ${darkgrey("(___(__) ")}
  ${whitebright("     * * * *  ")}
  ${whitebright("    * * * *   ")}`,

    iconLightSleetShowers: dedent`
  ${yellowbright(' _`/""')} ${lightgrey(".-.    ")}
  ${yellowbright("  ,\\_")} ${lightgrey("(   ).  ")}
  ${yellowbright("   /")} ${lightgrey("(___(__) ")}
  ${lightBlue("     ‘ ")}${whitebright("*")} ${lightBlue("‘ ")}${whitebright("*")} ${lightBlue(" ")}
  ${whitebright("     *")} ${lightBlue("‘ ")}${whitebright("*")} ${lightBlue("‘  ")}`,

    iconThunderyShowers: dedent`
  ${yellowbright(' _`/""')} ${lightgrey(".-.    ")}
  ${yellowbright("  ,\\_")} ${lightgrey("(   ).  ")}
  ${yellowbright("   /")} ${lightgrey("(___(__) ")}
  ${yellowbright("     ⚡")}${lightBlue("‘‘")}${yellow("⚡")}${lightBlue("‘‘")}
  ${lightBlue("     ‘ ‘ ‘ ‘  ")}`,

    iconThunderyHeavyRain: dedent`
  ${darkgrey("     .-.     ")}
  ${darkgrey("    (   ).   ")}
  ${darkgrey("   (___(__)  ")}
  ${blue("  ‚‘")}${yellow("⚡")}${blue("‘‚")}${yellow("⚡")}${blue("‚‘")}
  ${blue("  ‚’‚’")}${yellow("⚡")}${blue("’‚’")}`,

    iconThunderySnowShowers: dedent`
  ${yellowbright('  _`/""')} ${lightgrey(".-.")}
  ${yellowbright("  ,\\_")} ${lightgrey("(   ).")}
  ${yellowbright("   /")} ${lightgrey("(___(__)")}
  ${whitebright("     *")} ${yellow("⚡")} ${whitebright("*")} ${yellow("⚡")} ${whitebright("* ")}
  ${whitebright("    *  *  *")}`,

    iconLightRain: dedent`
  ${lightgrey("     .-.   ")}
  ${lightgrey("    (   ). ")}
  ${lightgrey("   (___(__)")}
  ${lightBlue("    ‘ ‘ ‘ ‘")}
  ${lightBlue("   ‘ ‘ ‘ ‘ ")}`,

    iconHeavyRain: dedent`
  ${darkgrey("     .-.     ")}
  ${darkgrey("    (   ).   ")}
  ${darkgrey("   (___(__)  ")}
  ${blue("   ‚‘‚‘‚‘‚‘   ")}
  ${blue("   ‚’‚’‚’‚’   ")}`,

    iconLightSnow: dedent`
  ${lightgrey("     .-.     ")}
  ${lightgrey("    (   ).   ")}
  ${lightgrey("   (___(__)  ")}
  ${whitebright("    *  *  *  ")}
  ${whitebright("   *  *  *   ")}`,

    iconHeavySnow: dedent`
  ${darkgrey("     .-.     ")}
  ${darkgrey("    (   ).   ")}
  ${darkgrey("   (___(__)  ")}
  ${whitebright("    * * * *   ")}
  ${whitebright("   * * * *    ")}`,

    iconLightSleet: dedent`
  ${lightgrey("     .-.     ")}
  ${lightgrey("    (   ).   ")}
  ${lightgrey("   (___(__)  ")}
  ${lightBlue("   ‘ ")}${whitebright("*")} ${lightBlue("‘ ")}${whitebright("*")} ${lightBlue("  ")}
  ${whitebright("   *")} ${lightBlue("‘ ")}${whitebright("*")} ${lightBlue("‘   ")}`,

    iconFog: dedent`
  ${grey("             ")}
  ${grey(" _ - _ - _ - ")}
  ${grey("  _ - _ - _  ")}
  ${grey(" _ - _ - _ - ")}
  ${grey("             ")}`,
  }),
);

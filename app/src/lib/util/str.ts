/**
 * A string or undefined. This is used in conjunction with overloads to export a
 * dependently-typed signature for the functions we defined here, which return
 * `undefined` if the input is `undefined` and a string otherwise. We use
 * overloads because type inference in Typescript isn't powerful enough to infer
 * the return type of a function based on the input type.
 *
 * {@link https://www.javiercasas.com/articles/typescript-dependent-types}
 */
type StringOrUndefined<T extends string | undefined> = T extends string
  ? string
  : T extends undefined
    ? undefined
    : never;

/**
 * Adds the prefix to the string. If the string already starts with the prefix,
 * the string is returned unchanged. If the string is undefined, undefined is
 * returned. If the string is empty, the prefix is _not added_.
 *
 * @param prefix The prefix to add
 * @param str The string to add the prefix to, or undefined
 * @returns `str` with `prefix` added, or undefined if `str` is undefined
 */
export function addPrefix<S extends string | undefined>(
  prefix: string,
  str: S,
): StringOrUndefined<S>;
export function addPrefix(
  prefix: string,
  str: string | undefined,
): StringOrUndefined<typeof str> {
  if (str === undefined) {
    return undefined;
  }

  if (str === "") {
    return str;
  }

  return str.startsWith(prefix) ? str : prefix + str;
}

/**
 * Removes the prefix from the string. If the string does not start with the
 * prefix, it is returned as is. If the string is undefined, undefined is
 * returned.
 *
 * @param prefix The prefix to remove
 * @param str The string to remove the prefix from, or undefined
 * @returns `str` with `prefix` removed, or undefined if `str` is undefined
 */
export function removePrefix<S extends string | undefined>(
  prefix: string,
  str: S,
): StringOrUndefined<S>;
export function removePrefix(
  prefix: string,
  str: string | undefined,
): string | undefined {
  if (str === undefined) {
    return undefined;
  }

  if (str === "") {
    return prefix;
  }

  return str.startsWith(prefix) ? str.slice(prefix.length) : str;
}

/**
 * Adds the suffix to the string. If the string already ends with the suffix,
 * the string is returned unchanged. If the string is undefined, undefined is
 * returned. If the string is empty, the suffix is _not added_.
 *
 * @param suffix The suffix to add
 * @param str The string to add the suffix to, or undefined
 * @returns `str` with `suffix` added, or undefined if `str` is undefined
 */
export function addSuffix<S extends string | undefined>(
  suffix: string,
  str: S,
): StringOrUndefined<S>;
export function addSuffix(
  suffix: string,
  str: string | undefined,
): StringOrUndefined<typeof str> {
  if (str === undefined) {
    return undefined;
  }

  if (str === "") {
    return str;
  }

  return str.endsWith(suffix) ? str : str + suffix;
}

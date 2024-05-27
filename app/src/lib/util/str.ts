/**
 * Removes the prefix from the string. If the string does not start with the
 * prefix, it is returned as is. If the string is undefined, undefined is
 * returned.
 *
 * @param prefix The prefix to remove
 * @param str The string to remove the prefix from, or undefined
 * @returns `str` with `prefix` removed, or undefined if `str` is undefined
 */
export function removePrefix(
  prefix: string,
  str: string | undefined,
): string | undefined {
  if (!str) {
    return undefined;
  }

  return str.startsWith(prefix) ? str.slice(prefix.length) : str;
}

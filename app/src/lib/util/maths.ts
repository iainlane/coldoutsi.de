function round(precision: number): (value: number) => number {
  const factor = 10 ** precision;

  return (value: number) => Math.round(value * factor) / factor;
}

/**
 * Round a number to one decimal place.
 *
 * @param value The number to round.
 *
 * @returns The number rounded to one decimal place.
 */
export const toOneDP = round(1);

/**
 * Round a number to two decimal places.
 *
 * @param value The number to round.
 *
 * @returns The number rounded to two decimal places.
 */
export const toTwoDP = round(2);

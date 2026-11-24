/** Склонение существительного для целых неотрицательных счётчиков. */
export function russianCount(value: number, forms: readonly [string, string, string]): string {
  const n = Math.abs(value) % 100;
  const last = n % 10;
  const form = n >= 11 && n <= 14 ? forms[2] : last === 1 ? forms[0] : last >= 2 && last <= 4 ? forms[1] : forms[2];
  return `${value} ${form}`;
}

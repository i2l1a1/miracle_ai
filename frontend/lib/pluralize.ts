export function pluralRu(
  n: number,
  one: string,
  two: string,
  five: string
): string {
  const absN = Math.abs(n);
  const lastDigit = absN % 10;
  const lastTwoDigits = absN % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return five;
  }

  if (lastDigit === 1) {
    return one;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return two;
  }
  return five;
}

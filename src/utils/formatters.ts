/**
 * Compact number formatting utility for download counts, views, stars, etc.
 * Examples:
 * 950 -> '950'
 * 2000 -> '2k'
 * 2500 -> '2.5k'
 * 1500000 -> '1.5m'
 * 2000000000 -> '2b'
 */
export function formatCompactNumber(input: number | string | undefined | null): string {
  if (input === undefined || input === null) return '0';
  let num: number;
  if (typeof input === 'string') {
    const cleaned = input.replace(/,/g, '').trim();
    num = parseFloat(cleaned);
  } else {
    num = input;
  }

  if (isNaN(num)) return '0';
  if (num < 1000) return `${num}`;

  if (num < 1_000_000) {
    const val = num / 1000;
    return val % 1 === 0 ? `${val.toFixed(0)}k` : `${val.toFixed(1).replace(/\.0$/, '')}k`;
  }

  if (num < 1_000_000_000) {
    const val = num / 1_000_000;
    return val % 1 === 0 ? `${val.toFixed(0)}m` : `${val.toFixed(1).replace(/\.0$/, '')}m`;
  }

  const val = num / 1_000_000_000;
  return val % 1 === 0 ? `${val.toFixed(0)}b` : `${val.toFixed(1).replace(/\.0$/, '')}b`;
}

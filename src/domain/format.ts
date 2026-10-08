const eur0 = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const time = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
});

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function fmtEur(n: number, opts: { cents?: boolean } = {}): string {
  const s = (opts.cents ? eur2 : eur0).format(Math.abs(n));
  return n < 0 && Math.abs(n) >= (opts.cents ? 0.005 : 0.5) ? `−${s}` : s;
}

export function fmtPct(ratio: number, dp = 1): string {
  return `${(ratio * 100).toFixed(dp)}%`;
}

export function fmtRate(aprPct: number): string {
  return `${aprPct.toFixed(1)}%`;
}

export function fmtScore(n: number): string {
  return n.toFixed(2);
}

export function fmtTime(iso: string): string {
  return time.format(new Date(iso));
}

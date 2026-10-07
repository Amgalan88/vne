export function fmtMoney(n: number | string | null | undefined): string {
  const v = Number(n);
  return isNaN(v) ? "0" : new Intl.NumberFormat("mn-MN").format(Math.round(v));
}

export function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("sv-SE", { timeZone: "Asia/Ulaanbaatar" });
}

export function fmtDateTime(d: string | Date): string {
  return new Date(d).toLocaleString("sv-SE", { timeZone: "Asia/Ulaanbaatar" }).slice(0, 16);
}

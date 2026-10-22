const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parts(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { y, m: m ?? 1, d: d ?? 1 };
}

/** Week (Monday) as "w/c 9 Nov". */
export function week(iso: string | null | undefined): string {
  if (!iso) return "—";
  const { m, d } = parts(iso);
  return `w/c ${d} ${MONTHS[m - 1]}`;
}

export function date(iso: string | null | undefined): string {
  if (!iso) return "—";
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export const pct = (p: number | null | undefined) => (p == null ? "—" : `${Math.round(p * 100)}%`);

export const eur = (n: number) => "€" + Math.round(n).toLocaleString("en-GB");

export const num = (n: number) => Math.round(n).toLocaleString("en-GB");

export const agentName = (a: string) =>
  a === "watch" ? "Watch agent" : a === "arbitration" ? "Arbitration agent" : a;

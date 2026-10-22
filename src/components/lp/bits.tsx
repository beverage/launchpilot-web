import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComponentStatus, EventOrigin, RunMode } from "@/lib/api";
import { cn } from "@/lib/utils";

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ModeTag({ mode }: { mode: RunMode }) {
  return mode === "live" ? (
    <Tag className="border-primary/40 text-primary">Live</Tag>
  ) : (
    <Tag>Rules</Tag>
  );
}

export function OriginTag({ event }: { event: Pick<LaunchEvent, "origin" | "real_data"> }) {
  const label = event.origin === "live" ? (event.real_data ? "Live · real data" : "Live · synthetic") : "Recorded";
  return (
    <Tag className={cn("normal-case tracking-normal", event.origin === "live" && "border-primary/40 text-primary")}>
      {label}
    </Tag>
  );
}

const sevStyle: Record<ComponentStatus, string> = {
  high: "border-sev-high/50 bg-sev-high/10 text-sev-high",
  medium: "border-sev-medium/50 bg-sev-medium/10 text-sev-medium",
  low: "border-border text-muted-foreground",
  covered: "border-sev-ok/40 text-sev-ok",
};

export function SeverityBadge({ status }: { status: ComponentStatus }) {
  return <Tag className={sevStyle[status]}>{status}</Tag>;
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="lp-md text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

export function StatTile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">{children}</div>;
}

export function Loading() {
  return <p className="text-sm text-muted-foreground">Loading…</p>;
}

export function ErrorNote({ error }: { error: unknown }) {
  return (
    <p className="rounded-md border border-sev-high/40 bg-sev-high/5 p-3 text-sm text-sev-high">
      {error instanceof Error ? error.message : String(error)}
    </p>
  );
}

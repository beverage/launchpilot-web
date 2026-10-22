import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Alert } from "@/lib/api";
import { eur, pct, week } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Markdown, ModeTag, SeverityBadge } from "./bits";

const border = { high: "border-l-sev-high", medium: "border-l-sev-medium", low: "border-l-border" } as const;

export function AlertCard({
  alert, busy, onArbitrate, onDecide, decidedScenario,
}: {
  alert: Alert;
  busy: boolean;
  onArbitrate: () => void;
  onDecide: (scenarioId: number) => void;
  decidedScenario?: number;
}) {
  const [open, setOpen] = useState(false);
  const high = alert.severity === "high";
  return (
    <article className={cn("space-y-3 rounded-lg border border-l-4 bg-card p-4", border[alert.severity], high && "shadow-md ring-1 ring-sev-high/20")}>
      <header className="flex flex-wrap items-center gap-2">
        <SeverityBadge status={alert.severity} />
        <ModeTag mode={alert.mode} />
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          {alert.trigger_event_id ? `trigger ${alert.trigger_event_id}` : ""}
        </span>
      </header>
      <div>
        <h3 className={cn("font-semibold", high && "text-lg")}>{alert.component_name}</h3>
        <p className="text-sm text-muted-foreground">
          Stockout <span className={cn("font-semibold text-foreground", high && "text-sev-high")}>{week(alert.predicted_stockout_week)}</span>
          {" · "}confidence {pct(alert.confidence)}
        </p>
      </div>
      <p className="text-sm leading-relaxed">{alert.explanation}</p>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
          Evidence ({alert.evidence.length})
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 flex flex-wrap gap-1">
          {alert.evidence.map((e) => (
            <code key={e} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">{e}</code>
          ))}
        </CollapsibleContent>
      </Collapsible>
      {alert.can_arbitrate && (
        <Button onClick={onArbitrate} disabled={busy} size="sm">Propose solutions</Button>
      )}
      {alert.scenarios.length > 0 && (
        <div className="space-y-3 border-t pt-3">
          {alert.recommendation && <Markdown>{alert.recommendation}</Markdown>}
          <div className="grid gap-2">
            {alert.scenarios.slice(0, 3).map((s) => {
              const chosen = decidedScenario === s.scenario_id;
              return (
                <div key={s.scenario_id} className={cn("rounded-md border p-3", chosen && "border-sev-ok bg-sev-ok/5")}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{s.scenario_id}. {s.label}</p>
                    <p className="text-xl font-semibold tabular-nums">{eur(s.total_impact_eur)}</p>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    extra cost {eur(s.cost_eur)} · lost revenue {eur(s.lost_revenue_eur)} · stock tied up {eur(s.stock_value_eur)}
                  </p>
                  {s.description && <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>}
                  <Button className="mt-2" size="sm" variant={chosen ? "secondary" : "outline"} disabled={busy || decidedScenario != null} onClick={() => onDecide(s.scenario_id)}>
                    {chosen ? "Chosen" : "Choose this scenario"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}

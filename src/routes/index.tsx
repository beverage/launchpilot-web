import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { agentName, date, eur, pct, week } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorNote, Loading, OriginTag, Page, Section, SeverityBadge, StatTile } from "@/components/lp/bits";
import { ProjectionChart } from "@/components/lp/ProjectionChart";
import { AlertCard } from "@/components/lp/AlertCard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Launch — LaunchPilot" },
      { name: "description", content: "Track launch readiness and spot stockouts before they happen." },
      { property: "og:title", content: "Launch — LaunchPilot" },
      { property: "og:description", content: "Track launch readiness and spot stockouts before they happen." },
    ],
  }),
  component: LaunchPage,
});

function LaunchPage() {
  const qc = useQueryClient();
  const state = useQuery({ queryKey: ["state"], queryFn: () => api.state() });
  const events = useQuery({ queryKey: ["events"], queryFn: () => api.events(50) });
  const alerts = useQuery({ queryKey: ["alerts"], queryFn: () => api.alerts() });
  const decisions = useQuery({ queryKey: ["decisions"], queryFn: () => api.decisions() });
  const [liveWanted, setLiveWanted] = useState(true);
  const [component, setComponent] = useState("CMP-POM-01");
  const [running, setRunning] = useState<string | null>(null);

  const liveAvailable = state.data?.agents.live_available ?? false;
  const live = liveAvailable && liveWanted;

  const action = useMutation({
    mutationFn: async ({ fn }: { fn: () => Promise<unknown>; agent: string }) => fn(),
    onMutate: ({ agent }) => setRunning(agent),
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
    onSettled: () => {
      setRunning(null);
      qc.invalidateQueries();
    },
  });

  if (state.isPending) return <Page><Loading /></Page>;
  if (state.error) return <Page><ErrorNote error={state.error} /></Page>;
  const s = state.data;
  const busy = action.isPending;
  const nextId = s.next_event?.event_id;
  const pastEv019 = (events.data ?? []).some((e) => e.event_id === "EV-019");
  const ffDisabled = busy || s.events_processed >= s.events_total || !nextId || pastEv019;
  const decidedBy = new Map((decisions.data ?? []).map((d) => [d.alert_id, d.scenario_id]));

  return (
    <Page>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Simulated date" value={date(s.sim_date)} sub={`Launch ${week(s.launch_week)}`} />
        <StatTile label="Events processed" value={`${s.events_processed} / ${s.events_total}`} sub={nextId ? `Next ${nextId}` : "All processed"} />
        <StatTile label="Critical alerts" value={<span className={cn(s.kpis.critical_alerts > 0 && "text-sev-high")}>{s.kpis.critical_alerts}</span>} />
        <StatTile label="Revenue at risk" value={eur(s.kpis.revenue_at_risk_eur)} sub={s.launch_product.name} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2">
          <Switch id="live" checked={live} onCheckedChange={setLiveWanted} disabled={!liveAvailable || busy} />
          <Label htmlFor="live" className="text-sm">Live agent</Label>
        </div>
        <div className="mx-1 h-6 w-px bg-border" />
        <Button size="sm" disabled={busy || !nextId} onClick={() => action.mutate({ fn: () => api.nextEvent(live), agent: "Watch agent" })}>Next event</Button>
        <Button size="sm" variant="outline" disabled={ffDisabled} onClick={() => action.mutate({ fn: () => api.fastForward("EV-019", live), agent: "Watch agent" })}>Fast-forward to EV-019</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => action.mutate({ fn: () => api.reset(), agent: "Reset" })}>Reset</Button>
        {running && (
          <span className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {running === "Reset" ? "Resetting…" : `${running} is working…${live ? " (live calls take 10–15 s)" : ""}`}
          </span>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-8">
          <Section title={`Components · ${s.launch_product.name}`}>
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Without memory</TableHead>
                    <TableHead>LaunchPilot</TableHead>
                    <TableHead className="text-right">P(launch+1w)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {s.components.map((c) => (
                    <TableRow key={c.component_id} className={cn("cursor-pointer", c.component_id === component && "bg-muted/50")} onClick={() => setComponent(c.component_id)}>
                      <TableCell><div className="font-medium">{c.name}</div><div className="font-mono text-[11px] text-muted-foreground">{c.component_id}</div></TableCell>
                      <TableCell className="text-sm">{c.supplier_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{week(c.stockout_week_without_memory)}</TableCell>
                      <TableCell className={cn("text-sm font-medium", c.severity === "high" && "text-sev-high")}>{week(c.stockout_week_launchpilot)}</TableCell>
                      <TableCell className="text-right tabular-nums">{pct(c.p_stockout_by_launch_plus_1wk)}</TableCell>
                      <TableCell><SeverityBadge status={c.severity} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Section>
          <Section
            title="Stock projection"
            aside={
              <Select value={component} onValueChange={setComponent}>
                <SelectTrigger className="h-8 w-56 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {s.components.map((c) => <SelectItem key={c.component_id} value={c.component_id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            }
          >
            <div className="rounded-lg border bg-card p-3"><ProjectionChart componentId={component} /></div>
          </Section>
        </div>

        <div className="space-y-8">
          <Section title="Event feed">
            {events.data && events.data.length === 0 && <p className="text-sm text-muted-foreground">No events processed yet.</p>}
            <ul className="divide-y rounded-lg border bg-card">
              {[...(events.data ?? [])].sort((a, b) => b.ts.localeCompare(a.ts) || b.event_id.localeCompare(a.event_id)).slice(0, 6).map((e) => (
                <li key={e.event_id} className="flex gap-3 p-3">
                  <span className="flex shrink-0 items-center gap-1.5 pt-0.5">
                    <span className="font-mono text-[11px] text-muted-foreground">{e.event_id}</span>
                    <OriginTag event={e} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{e.kind_label}</p>
                    <p className="text-sm text-muted-foreground">{e.summary}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Alerts">
            {alerts.data?.length === 0 && <p className="text-sm text-muted-foreground">No alerts yet. Try “Fast-forward to EV-019”.</p>}
            <div className="space-y-3">
              {[...(alerts.data ?? [])].sort((a, b) => (a.severity === "high" ? -1 : 0) - (b.severity === "high" ? -1 : 0)).map((a) => (
                <AlertCard
                  key={a.alert_id}
                  alert={a}
                  busy={busy}
                  decidedScenario={decidedBy.get(a.alert_id)}
                  onArbitrate={() => action.mutate({ fn: () => api.arbitrate(a.alert_id, live), agent: agentName("arbitration") })}
                  onDecide={(sid) => action.mutate({ fn: () => api.decide(a.alert_id, sid), agent: "Saving decision" })}
                />
              ))}
            </div>
          </Section>
          <Section title="Decision log">
            {decisions.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No decisions yet.</p>
            ) : (
              <ul className="divide-y rounded-lg border bg-card">
                {decisions.data?.map((d) => (
                  <li key={`${d.alert_id}-${d.decided_at}`} className="p-3 text-sm">
                    <p className="font-medium">{d.label}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">alert {d.alert_id} · scenario {d.scenario_id} · {d.decided_by} · {d.decided_at.replace("T", " ")}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </Page>
  );
}

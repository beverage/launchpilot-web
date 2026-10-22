import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { API_MODE, api } from "@/lib/api";
import { alertAnchor, alertKind, SEVERITY } from "@/lib/alerts";
import { agentName, date, eur, pct, week } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorNote, Loading, Page, Section, SeverityBadge, StatTile } from "@/components/lp/bits";
import { ProjectionChart } from "@/components/lp/ProjectionChart";
import { AlertCard } from "@/components/lp/AlertCard";
import { EventFeed } from "@/components/lp/EventFeed";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Launch — LaunchPilot" },
      { name: "description", content: "Track launch readiness and spot stockouts before they happen." },
      { property: "og:title", content: "Launch — LaunchPilot" },
      { property: "og:description", content: "Track launch readiness and spot stockouts before they happen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
    onSuccess: (res) => {
      const n = (res as { live_runs?: unknown[] } | undefined)?.live_runs?.length ?? 0;
      if (n > 0) toast.success(`${n} live event${n > 1 ? "s" : ""} analysed (emails, goods receipts, notices, order books)`);
    },
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
  const supplierOf = new Map(s.components.map((c) => [c.component_id, c.supplier_name]));
  // api.py lists alerts critical first, earliest stockout first, so the first one is the most urgent.
  const critical = (alerts.data ?? []).filter((a) => a.severity === "high");
  const top = critical[0];
  // Watch alerts: the earliest week first, a supplier-continuity alert first when weeks tie.
  const watch = (alerts.data ?? [])
    .filter((a) => a.severity === "medium")
    .sort((a, b) => (a.predicted_stockout_week ?? "9999").localeCompare(b.predicted_stockout_week ?? "9999")
      || Number(b.risk_type === "supplier_continuity") - Number(a.risk_type === "supplier_continuity"));
  const topWatch = watch[0];
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    el?.focus({ preventScroll: true });
  };

  return (
    <Page>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatTile label="Simulated date" value={date(s.sim_date)} sub={`Launch ${week(s.launch_week)}`} />
        <StatTile label="Events processed" value={`${s.events_processed} / ${s.events_total}`} sub={nextId ? `Next ${nextId}` : "All processed"} />
        <StatTile
          label="Critical alerts"
          value={<span className={cn(s.kpis.critical_alerts > 0 && "text-sev-high")}>{s.kpis.critical_alerts}</span>}
          sub={top
            ? <>{top.component_name}{critical.length > 1 && ` +${critical.length - 1}`} · out {week(top.predicted_stockout_week)} →</>
            : "None at risk by launch + 1 wk"}
          title={`Critical: ${SEVERITY.high.rule.toLowerCase()}`}
          onClick={top ? () => scrollTo(alertAnchor(top.alert_id)) : undefined}
        />
        <StatTile
          label="Watch alerts"
          value={<span className={cn(watch.length > 0 && "text-sev-medium")}>{watch.length}</span>}
          sub={topWatch
            ? <>{topWatch.component_name}{watch.length > 1 && ` +${watch.length - 1}`} · {alertKind(topWatch.risk_type).short} {week(topWatch.predicted_stockout_week)} →</>
            : "None before year end"}
          title={`Watch: ${SEVERITY.medium.rule.toLowerCase()}`}
          onClick={topWatch ? () => scrollTo(alertAnchor(topWatch.alert_id)) : undefined}
        />
        <StatTile label="Revenue at risk" value={eur(s.kpis.revenue_at_risk_eur)} sub={s.launch_product.name} />
      </div>

      <section aria-labelledby="demo-controls-title" className="border-y border-dashed border-muted-foreground/40 bg-muted/50 px-4 py-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h2 id="demo-controls-title" className="font-mono text-xs font-semibold uppercase tracking-wider">Demo control panel</h2>
          <span className="border-l pl-2 text-xs text-muted-foreground">Demo only · not customer controls</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch id="live" checked={live} onCheckedChange={setLiveWanted} disabled={!liveAvailable || busy} />
          <Label htmlFor="live" className="text-sm">Live agent</Label>
        </div>
        <div className="mx-1 h-6 w-px bg-border" />
        <Button size="sm" disabled={busy || !nextId || (API_MODE === "mock" && pastEv019)} onClick={() => action.mutate({ fn: () => api.nextEvent(live), agent: "Watch agent" })}>Next event</Button>
        <Button size="sm" variant="outline" disabled={ffDisabled} onClick={() => action.mutate({ fn: () => api.fastForward("EV-019", live), agent: "Watch agent" })}>Fast-forward to EV-019</Button>
        <Button size="sm" variant="outline" disabled={busy || s.events_processed >= s.events_total || API_MODE === "mock"} onClick={() => action.mutate({ fn: () => api.fastForwardToday(live), agent: "Fast-forward to today" })}>Fast-forward to today</Button>
        <Button size="sm" variant="outline" disabled={busy || !s.live_due} onClick={() => action.mutate({ fn: () => api.drainLive(live), agent: "Watch agent" })}>Analyse live events due ({s.live_due ?? 0})</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => action.mutate({ fn: () => api.reset(), agent: "Reset" })}>Reset</Button>
        {running && (
          <span className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {running === "Reset" ? "Resetting…" : running === "Fast-forward to today" ? `Playing the rest of the story; the agent reads supplier emails and matching notices on the way${live ? " (can take a minute)" : ""}…` : `${running} is working…${live ? " (live calls take 10–15 s)" : ""}`}
          </span>
        )}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-8">
          <Section title={`Components · ${s.launch_product.name}`}>
            <p className="mb-2 text-xs text-muted-foreground">Compare projected stockout dates using supplier-promised lead times versus actual historical supplier performance.</p>
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-9 px-1.5 text-xs">Component</TableHead>
                    <TableHead className="h-9 px-1.5 text-xs">Supplier</TableHead>
                    <TableHead className="h-9 px-1.5 text-xs">Stockout date<span className="block text-[10px] font-normal text-muted-foreground">Standard planning</span></TableHead>
                    <TableHead className="h-9 px-1.5 text-xs">Stockout date<span className="block text-[10px] font-normal text-muted-foreground">LaunchPilot AI</span></TableHead>
                    <TableHead className="h-9 px-1.5 text-xs text-right whitespace-nowrap">P(l+1w)</TableHead>
                    <TableHead className="h-9 px-1.5 text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {s.components.map((c) => {
                    const earlier = Boolean(c.stockout_week_launchpilot && c.stockout_week_without_memory && c.stockout_week_launchpilot < c.stockout_week_without_memory);
                    return (
                    <TableRow key={c.component_id} className={cn("cursor-pointer", c.component_id === component && "bg-muted/50")} onClick={() => setComponent(c.component_id)}>
                      <TableCell className="px-1.5 py-1.5"><div className="text-[11px] font-medium whitespace-nowrap">{c.name}</div><div className="font-mono text-[10px] text-muted-foreground">{c.component_id}</div></TableCell>
                      <TableCell className="px-1.5 py-1.5 text-[11px] whitespace-nowrap">{c.supplier_name}</TableCell>
                      <TableCell className="px-1.5 py-1.5 text-[11px] whitespace-nowrap text-muted-foreground">{week(c.stockout_week_without_memory)}</TableCell>
                      <TableCell className={cn("px-1.5 py-1.5", (c.severity === "high" || earlier) && "text-sev-high")}>
                        <div className="text-[11px] font-medium whitespace-nowrap">{week(c.stockout_week_launchpilot)}</div>
                        {earlier && <div className="mt-0.5 inline-flex rounded border border-sev-high/40 bg-sev-high/10 px-1 text-[9px] font-medium leading-4">Earlier risk detected</div>}
                      </TableCell>
                      <TableCell className="px-1.5 py-1.5 text-[11px] text-right tabular-nums whitespace-nowrap">{pct(c.p_stockout_by_launch_plus_1wk)}</TableCell>
                      <TableCell className="px-1.5 py-1.5"><SeverityBadge status={c.severity} className="px-1 text-[9px]" /></TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Section>
          <Section
            id="projection"
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
          <Section title="Alerts">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-sev-high">Critical</span>: {SEVERITY.high.rule.toLowerCase()}.{" "}
              <span className="font-semibold text-sev-medium">Watch</span>: likely before year end, not by launch.
            </p>
            {alerts.data?.length === 0 && <p className="text-sm text-muted-foreground">No alerts yet. Try “Fast-forward to EV-019”.</p>}
            <div className="space-y-3">
              {[...(alerts.data ?? [])].sort((a, b) => (a.severity === "high" ? -1 : 0) - (b.severity === "high" ? -1 : 0)).map((a) => (
                <AlertCard
                  key={a.alert_id}
                  alert={a}
                  busy={busy}
                  decidedScenario={decidedBy.get(a.alert_id)}
                  launchWeek={s.launch_week}
                  supplierName={supplierOf.get(a.component_id)}
                  onShowProjection={() => { setComponent(a.component_id); scrollTo("projection"); }}
                  onArbitrate={() => action.mutate({ fn: () => api.arbitrate(a.alert_id, live), agent: agentName("arbitration") })}
                  onDecide={(sid) => action.mutate({ fn: () => api.decide(a.alert_id, sid), agent: "Saving decision" })}
                />
              ))}
            </div>
          </Section>
          <Section title="Event feed">
            {events.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events processed yet.</p>
            ) : (
              <EventFeed events={[...(events.data ?? [])].sort((a, b) => b.ts.localeCompare(a.ts) || b.event_id.localeCompare(a.event_id)).slice(0, 6)} />
            )}
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

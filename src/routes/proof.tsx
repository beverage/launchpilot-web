import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { pct, week } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorNote, Loading, Page, Section, StatTile, Tag } from "@/components/lp/bits";

export const Route = createFileRoute("/proof")({
  head: () => ({
    meta: [
      { title: "Proof — LaunchPilot" },
      { name: "description", content: "Evidence behind every LaunchPilot stockout warning." },
      { property: "og:title", content: "Proof — LaunchPilot" },
      { property: "og:description", content: "Evidence behind every LaunchPilot stockout warning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProofPage,
});

const days = (n: number | null) => (n == null ? <span className="text-sev-high">Missed</span> : `${Math.round(n)} d`);

function ProofPage() {
  const q = useQuery({ queryKey: ["proof"], queryFn: () => api.proof() });
  if (q.isPending) return <Page><Loading /></Page>;
  if (q.error) return <Page><ErrorNote error={q.error} /></Page>;
  const { evaluation: ev, component_names } = q.data;
  const wm = ev.without_memory, lp = ev.launchpilot;
  const rows = Object.entries(ev.demo_seed.per_component).filter(([, c]) => c.truth != null);

  return (
    <Page>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Backtest</h2>
        {ev.recorded_not_live && <Tag>Recorded, not live</Tag>}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Dated without memory" value={`${wm.detected} / ${wm.total}`} />
        <StatTile label="Dated by LaunchPilot" value={<span className="text-sev-ok">{`${lp.detected} / ${lp.total}`}</span>} />
        <StatTile label="Wrong by > 1 week" value={`${lp.wrong_by_more_than_1wk} vs ${wm.wrong_by_more_than_1wk}`} sub="LaunchPilot vs without memory" />
        <StatTile label="LaunchPilot false alarms" value={lp.false_alarms} />
      </div>
      <p className="text-sm text-muted-foreground">
        Over {ev.seeds} seeds · mean warning: LaunchPilot {Math.round(lp.mean_lead_days)} days, without memory {Math.round(wm.mean_lead_days)} days.
      </p>
      <Section title={`Demo seed ${ev.demo_seed.seed}`}>
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>True stockout</TableHead>
                <TableHead className="text-right">Warning without memory</TableHead>
                <TableHead className="text-right">Warning with LaunchPilot</TableHead>
                <TableHead className="text-right">P(launch+1w)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(([id, c]) => (
                <TableRow key={id}>
                  <TableCell><div className="font-medium">{component_names[id] ?? id}</div><div className="font-mono text-[11px] text-muted-foreground">{id}</div></TableCell>
                  <TableCell>{week(c.truth)}</TableCell>
                  <TableCell className="text-right tabular-nums">{days(c.lead_days_without_memory)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{days(c.lead_days_launchpilot)}</TableCell>
                  <TableCell className="text-right tabular-nums">{pct(c.p_by_launch_plus_1wk)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{ev.protocol}</p>
      </Section>
    </Page>
  );
}

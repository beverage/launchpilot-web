import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorNote, Loading, Page, Section } from "@/components/lp/bits";

export const Route = createFileRoute("/supplier-memory")({
  head: () => ({
    meta: [
      { title: "Supplier memory — LaunchPilot" },
      { name: "description", content: "What LaunchPilot remembers about each supplier's track record." },
      { property: "og:title", content: "Supplier memory — LaunchPilot" },
      { property: "og:description", content: "What LaunchPilot remembers about each supplier's track record." },
    ],
  }),
  component: SupplierMemoryPage,
});

const d1 = (n: number) => n.toFixed(1);

function SupplierMemoryPage() {
  const q = useQuery({ queryKey: ["suppliers"], queryFn: () => api.suppliers() });
  if (q.isPending) return <Page><Loading /></Page>;
  if (q.error) return <Page><ErrorNote error={q.error} /></Page>;
  const rows = [...q.data.suppliers].sort((a, b) => (b.real_mean_days - b.announced_days) - (a.real_mean_days - a.announced_days));
  const caption = q.data.source === "sql_view" ? "Computed live by the supplier_reliability view in Aiven for PostgreSQL" : "Computed from the delivery history";

  return (
    <Page>
      <Section title="Announced vs real lead time (days)">
        <div className="rounded-lg border bg-card p-3" style={{ height: 80 + rows.length * 56 }}>
          <ResponsiveContainer>
            <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 40 }} barGap={2}>
              <CartesianGrid stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12, fill: "var(--foreground)" }} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 12 }} formatter={(v: number) => `${d1(v)} d`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="announced_days" name="Announced" fill="var(--muted-foreground)" fillOpacity={0.5} isAnimationActive={false}>
                <LabelList dataKey="announced_days" position="right" fontSize={11} fill="var(--muted-foreground)" formatter={(v: number) => d1(v)} />
              </Bar>
              <Bar dataKey="real_mean_days" name="Real mean" fill="var(--chart-lp)" isAnimationActive={false}>
                <LabelList dataKey="real_mean_days" position="right" fontSize={11} fill="var(--foreground)" formatter={(v: number) => d1(v)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </Section>
      <Section title="Delivery record">
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Announced</TableHead>
                <TableHead className="text-right">Real mean</TableHead>
                <TableHead className="text-right">Gap</TableHead>
                <TableHead className="text-right">Std dev</TableHead>
                <TableHead className="text-right">Typical (median)</TableHead>
                <TableHead className="text-right">Deliveries</TableHead>
                <TableHead className="text-right">Late</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const gap = r.real_mean_days - r.announced_days;
                return (
                  <TableRow key={r.supplier_id}>
                    <TableCell><div className="font-medium">{r.name}</div><div className="font-mono text-[11px] text-muted-foreground">{r.supplier_id}</div></TableCell>
                    <TableCell className="text-right tabular-nums">{d1(r.announced_days)} d</TableCell>
                    <TableCell className="text-right tabular-nums">{d1(r.real_mean_days)} d</TableCell>
                    <TableCell className={`text-right font-medium tabular-nums ${gap > 7 ? "text-sev-high" : ""}`}>{gap >= 0 ? "+" : ""}{d1(gap)} d</TableCell>
                    <TableCell className="text-right tabular-nums">±{d1(r.std_days)} d</TableCell>
                    <TableCell className="text-right tabular-nums">{d1(r.typical_days)} d</TableCell>
                    <TableCell className="text-right tabular-nums">{r.deliveries}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.late_deliveries}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </Section>
    </Page>
  );
}

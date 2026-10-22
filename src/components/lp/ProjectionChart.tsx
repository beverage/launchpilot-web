import { useQuery } from "@tanstack/react-query";
import { Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { num, week } from "@/lib/format";
import { ErrorNote, Loading } from "./bits";

export function ProjectionChart({ componentId }: { componentId: string }) {
  const q = useQuery({ queryKey: ["projection", componentId], queryFn: () => api.projection(componentId) });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorNote error={q.error} />;
  const data = q.data.series.map((p) => ({
    ...p,
    band: p.p10 != null && p.p90 != null ? [p.p10, p.p90] : null,
  }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 16, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="week" tickFormatter={(w) => week(w).replace("w/c ", "")} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
          <YAxis tickFormatter={num} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={56} />
          <Tooltip
            contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 12 }}
            labelFormatter={(w) => week(String(w))}
            formatter={(v: unknown, name: string) =>
              Array.isArray(v) ? [`${num(v[0])} – ${num(v[1])}`, name] : [num(Number(v)), name]
            }
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area dataKey="band" name="LaunchPilot p10–p90" stroke="none" fill="var(--chart-lp)" fillOpacity={0.15} isAnimationActive={false} />
          <Line dataKey="p50" name="LaunchPilot (actual lead times, median)" stroke="var(--chart-lp)" strokeWidth={2.25} dot={false} isAnimationActive={false} />
          <Line dataKey="without_memory" name="Without memory (announced lead times)" stroke="var(--muted-foreground)" strokeWidth={1.75} dot={false} isAnimationActive={false} />
          <ReferenceLine y={0} stroke="var(--sev-high)" strokeDasharray="4 4" />
          <ReferenceLine x={q.data.launch_week} stroke="var(--foreground)" strokeDasharray="4 4" label={{ value: "Launch", position: "top", fontSize: 11, fill: "var(--foreground)" }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

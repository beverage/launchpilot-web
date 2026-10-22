import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { agentName, num } from "@/lib/format";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ErrorNote, Loading, Markdown, ModeTag, Page, Section, StatTile } from "@/components/lp/bits";

export const Route = createFileRoute("/agent-traces")({
  head: () => ({
    meta: [
      { title: "Agent traces — LaunchPilot" },
      { name: "description", content: "Step-by-step traces of LaunchPilot's agent reasoning." },
      { property: "og:title", content: "Agent traces — LaunchPilot" },
      { property: "og:description", content: "Step-by-step traces of LaunchPilot's agent reasoning." },
    ],
  }),
  component: AgentTracesPage,
});

const json = (v: unknown) => {
  const s = JSON.stringify(v, null, 2) ?? "null";
  return s.length > 1500 ? s.slice(0, 1500) + "\n… (truncated)" : s;
};
const secs = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

function AgentTracesPage() {
  const q = useQuery({ queryKey: ["runs"], queryFn: () => api.runs() });
  if (q.isPending) return <Page><Loading /></Page>;
  if (q.error) return <Page><ErrorNote error={q.error} /></Page>;
  const runs = q.data; // API returns newest first
  const live = runs.filter((r) => r.mode === "live");
  const avg = live.length ? live.reduce((a, r) => a + r.latency_ms, 0) / live.length : 0;
  const tokens = runs.reduce((a, r) => a + r.tokens_in + r.tokens_out, 0);

  return (
    <Page>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Runs" value={runs.length} />
        <StatTile label="Live runs" value={live.length} />
        <StatTile label="Avg live latency" value={live.length ? secs(avg) : "—"} />
        <StatTile label="Total tokens" value={num(tokens)} />
      </div>
      <Section title="Runs, newest first">
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No runs yet. Process an event on the Launch tab.</p>
        ) : (
          <Accordion type="multiple" className="rounded-lg border bg-card px-4">
            {runs.map((r, i) => (
              <AccordionItem key={i} value={String(i)}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 flex-wrap items-center gap-3 pr-3 text-left">
                    <span className="font-medium">{agentName(r.agent)}</span>
                    <ModeTag mode={r.mode} />
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                      {secs(r.latency_ms)} · {num(r.tokens_in)} in / {num(r.tokens_out)} out · {r.tool_calls.length} tool calls
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <Markdown>{r.output || "_No output_"}</Markdown>
                  {r.tool_calls.map((t, j) => (
                    <div key={j} className="space-y-1 rounded-md border p-3">
                      <p className="font-mono text-xs font-semibold">{j + 1}. {t.tool}</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {(["input", "output"] as const).map((k) => (
                          <div key={k}>
                            <p className="mb-1 font-mono text-[10px] uppercase text-muted-foreground">{k}</p>
                            <pre className="max-h-64 overflow-auto rounded bg-muted p-2 font-mono text-[11px] leading-snug">{json(t[k])}</pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </Section>
    </Page>
  );
}

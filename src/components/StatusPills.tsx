import { useQuery } from "@tanstack/react-query";
import { api, API_MODE } from "@/lib/api";
import { Tag } from "@/components/lp/bits";

export function StatusPills() {
  const { data: s } = useQuery({ queryKey: ["state"], queryFn: () => api.state() });
  return (
    <div className="hidden flex-wrap items-center justify-end gap-1.5 md:flex">
      {s && (
        <>
          <Tag>Data · {s.data.label}</Tag>
          <Tag className={s.agents.live_available ? "border-primary/40 text-primary" : ""}>
            {s.agents.live_available ? `Claude live · ${s.agents.model}` : "Rules only"}
          </Tag>
          <Tag>{s.data.dataset}</Tag>
        </>
      )}
      {API_MODE === "mock" && <Tag className="border-signal/50 text-signal">Recorded data</Tag>}
    </div>
  );
}

export function DataErrorBanner() {
  const { data: s } = useQuery({ queryKey: ["state"], queryFn: () => api.state() });
  if (!s?.data.error) return null;
  return (
    <div className="border-b border-sev-medium/40 bg-sev-medium/10 px-6 py-2 text-center text-sm">
      {s.data.error}
    </div>
  );
}

// Recorded snapshots of the real API, captured from api.py on 22 October 2026 (seed 42, after B1 and A5, live Claude runs).
// The mock walks the demo journey: start -> fast-forward to EV-019 -> propose solutions -> choose a scenario.
// Used when VITE_API_URL is empty; see src/lib/api.ts.
import type {
  Alert, AgentRun, ArbitrateResult, Decision, LaunchEvent, LaunchPilotApi, LaunchState, Projection, Proof,
  StepResult, SupplierHealthResponse, SuppliersResponse,
} from "@/lib/api";
import { ApiError } from "@/lib/apiError";
import recordedJson from "./recorded.json";

interface Snapshot {
  state: LaunchState;
  alerts: Alert[];
  events: LaunchEvent[];
  runs: AgentRun[];
  decisions: Decision[];
  projections: Record<string, Projection>;
}

interface Recorded {
  start: Snapshot;
  ev019: Snapshot;
  arbitrated: { alerts: Alert[]; runs: AgentRun[] };
  decided: { decisions: Decision[] };
  suppliers: SuppliersResponse;
  proof: Proof;
  supplier_health?: SupplierHealthResponse; // read from the live supplier_health view on 22 October, about 13:05
}

const rec = recordedJson as unknown as Recorded;
type Stage = "start" | "ev019" | "arbitrated" | "decided";
let stage: Stage = "start";

const wait = <T>(value: T, ms = 300): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));

function first<T>(xs: T[]): T {
  const x = xs[0];
  if (x === undefined) throw new Error("src/mocks/recorded.json is missing a snapshot");
  return x;
}

const withLive = (st: LaunchState): LaunchState => ({ ...st, clock: st.clock ?? `${st.sim_date}T09:00:00`, live_due: st.live_due ?? 0 });

const step = (): StepResult => ({ event: first(rec.ev019.events), run: first(rec.ev019.runs), live_runs: [], state: withLive(rec.ev019.state) });

export const mockApi: LaunchPilotApi = {
  state: () => wait(withLive(stage === "start" ? rec.start.state : rec.ev019.state)),
  projection: (componentId) => {
    const p = (stage === "start" ? rec.start : rec.ev019).projections[componentId];
    return p ? wait(p) : Promise.reject(new ApiError(404, `unknown component ${componentId}`));
  },
  events: (limit = 50) => wait((stage === "start" ? [] : rec.ev019.events).slice(0, limit)),
  alerts: () => wait(stage === "start" ? [] : stage === "ev019" ? rec.ev019.alerts : rec.arbitrated.alerts),
  decisions: () => wait(stage === "decided" ? rec.decided.decisions : []),
  suppliers: () => wait(rec.suppliers),
  proof: () => wait(rec.proof),
  runs: () => wait(stage === "start" ? [] : stage === "ev019" ? rec.ev019.runs : rec.arbitrated.runs),
  // Recorded before the demo clock reached these notices, so recorded mode lists them all, whatever the switch says
  supplierHealth: () =>
    wait(rec.supplier_health ?? { source: "unavailable" as const, error: "not recorded yet", notices: [] }),
  nextEvent: () => mockApi.fastForward(),
  fastForward: () => {
    if (stage !== "start") return Promise.reject(new ApiError(409, "EV-019 is already processed"));
    stage = "ev019";
    return wait(step(), 1500);
  },
  // The recording has no live rows and stops after EV-019, so these two are no-ops in recorded mode
  fastForwardToday: () => Promise.reject(new ApiError(409, "the recording stops after EV-019")),
  drainLive: () => wait({ live_runs: [], state: withLive(stage === "start" ? rec.start.state : rec.ev019.state) }),
  reset: () => {
    stage = "start";
    return wait(withLive(rec.start.state));
  },
  arbitrate: (alertId): Promise<ArbitrateResult> => {
    const alert = rec.arbitrated.alerts.find((a) => a.alert_id === alertId);
    if (stage !== "ev019" || !alert) return Promise.reject(new ApiError(409, "nothing to arbitrate"));
    stage = "arbitrated";
    return wait({ alert, run: first(rec.arbitrated.runs) }, 2000);
  },
  decide: () => {
    if (stage === "start" || stage === "ev019") return Promise.reject(new ApiError(404, "unknown scenario for this alert"));
    stage = "decided";
    return wait(rec.decided.decisions);
  },
};

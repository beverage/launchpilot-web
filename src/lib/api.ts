// LaunchPilot API client: the only module that talks to the backend.
// VITE_API_URL set   -> the FastAPI service (api.py in beverage/launchpilot), deployed on Aiven Runtime.
// VITE_API_URL empty -> recorded snapshots from src/mocks, so every screen works without a backend.
// Keep these types in step with api.py; the JSON in src/mocks was captured from it.
import { ApiError } from "@/lib/apiError";
import { mockApi } from "@/mocks/mockApi";

export { ApiError };

export type Severity = "high" | "medium" | "low";
export type ComponentStatus = Severity | "covered";
/** How an agent result was produced: Claude tool use, or the deterministic rules fallback. */
export type RunMode = "live" | "rules";
/** Where an event came from: the recorded demo scenario (EV- ids) or a live poller. */
export type EventOrigin = "recorded" | "live";

export interface LaunchEvent {
  event_id: string;
  ts: string; // ISO 8601, Paris local time, no timezone
  event_type: string; // supplier_delay | sellout_spike | capacity_drop | po_confirmed | noise | po_delivered | supplier_email | supplier_insolvency | holiday_closure
  kind_label: string; // display label with an emoji, e.g. "🚚 Supplier delay"
  summary: string;
  payload: Record<string, unknown>;
  origin: EventOrigin;
  real_data: boolean; // true for public data (BODACC, holidays); recorded events, emails and deliveries are synthetic
}

export interface ComponentRisk {
  component_id: string;
  name: string;
  supplier_id: string;
  supplier_name: string;
  stockout_week_launchpilot: string | null; // Monday of the median stockout week, lead times drawn from delivery history
  stockout_week_without_memory: string | null; // the same for an attentive planner who believes announced lead times
  p_stockout_by_launch_plus_1wk: number; // 0 to 1
  p_stockout_before_end_of_year: number; // 0 to 1
  confidence: number; // the probability behind the severity
  min_projected_stock_p50: number;
  severity: ComponentStatus; // high: >= 50% stockout by launch + 1 week; medium: likely before year end
  evidence: string[]; // "table:id" rows the projection used
}

export interface LaunchState {
  sim_date: string;
  launch_week: string;
  window_end: string;
  launch_product: { product_id: string; name: string };
  events_processed: number;
  events_total: number;
  next_event: LaunchEvent | null;
  data: { store: "postgres" | "memory"; label: string; error: string | null; dataset: string };
  agents: { live_available: boolean; model: string };
  kpis: { critical_alerts: number; revenue_at_risk_eur: number };
  components: ComponentRisk[];
}

export interface Scenario {
  scenario_id: number;
  label: string;
  cost_eur: number; // extra cost against the usual supplier
  lost_revenue_eur: number;
  stock_value_eur: number; // purchase tied up in stock
  total_impact_eur: number; // cost + lost revenue
  description: string | null;
  evidence_rows: string[];
}

export interface Alert {
  alert_id: number;
  component_id: string;
  component_name: string;
  severity: Severity;
  predicted_stockout_week: string | null;
  confidence: number | null; // a probability, 0 to 1
  explanation: string;
  evidence: string[];
  trigger_event_id: string | null;
  created_at: string;
  source: string;
  mode: RunMode;
  can_arbitrate: boolean; // high severity and no scenarios yet
  recommendation: string | null; // markdown from the arbitration agent
  scenarios: Scenario[]; // best first, at most 3
}

export interface ToolCall {
  tool: string;
  input: Record<string, unknown>;
  output: unknown;
}

export interface AgentRun {
  agent: string; // "watch" or "arbitration"
  mode: RunMode;
  input: unknown;
  output: string; // markdown in live mode
  tool_calls: ToolCall[];
  latency_ms: number;
  tokens_in: number;
  tokens_out: number;
  alerts_created: number[];
}

export interface ProjectionPoint {
  week: string;
  p10: number | null; // LaunchPilot band over 200 lead-time draws: pessimistic edge
  p50: number | null; // LaunchPilot median: the line to draw
  p90: number | null; // optimistic edge
  without_memory: number | null; // the planner who believes announced lead times
}

export interface Projection {
  component_id: string;
  name: string;
  launch_week: string;
  series: ProjectionPoint[]; // projected stock in units per week; below 0 is a stockout
}

export interface SupplierMemory {
  supplier_id: string;
  name: string;
  announced_days: number;
  real_mean_days: number;
  std_days: number;
  typical_days: number; // median delivered lead time
  deliveries: number;
  late_deliveries: number;
  evidence: string;
}

export interface SuppliersResponse {
  source: "sql_view" | "computed"; // sql_view: computed live by the supplier_reliability view in Aiven for PostgreSQL
  suppliers: SupplierMemory[];
  sql_rows: Record<string, unknown>[];
}

export interface Decision {
  alert_id: number;
  scenario_id: number;
  label: string;
  decided_by: string;
  decided_at: string;
}

export interface PlannerScore {
  detected: number; // stockouts dated within one week of the truth, over all seeds
  total: number;
  mean_lead_days: number; // mean warning on the dated ones
  false_alarms: number;
  wrong_by_more_than_1wk: number;
  median_abs_error_weeks: number;
}

export interface DemoComponentScore {
  truth: string | null; // true stockout week, null when it never runs out
  without_memory: string | null;
  launchpilot: string | null;
  lead_days_without_memory: number | null; // days of warning, null when missed
  lead_days_launchpilot: number | null;
  p_by_launch_plus_1wk: number;
  p_before_end_of_year: number;
}

export interface Proof {
  evaluation: {
    protocol: string;
    seeds: number;
    recorded_not_live: boolean;
    without_memory: PlannerScore; // baseline: reads every message, believes announced lead times
    launchpilot: PlannerScore;
    demo_seed: { seed: number; per_component: Record<string, DemoComponentScore> };
    demo_focus_pump_evidence?: string[];
  };
  component_names: Record<string, string>;
}

export interface StepResult {
  event: LaunchEvent;
  run: AgentRun;
  state: LaunchState;
}

export interface ArbitrateResult {
  alert: Alert;
  run: AgentRun;
}

export interface LaunchPilotApi {
  state(): Promise<LaunchState>;
  projection(componentId: string): Promise<Projection>;
  events(limit?: number): Promise<LaunchEvent[]>;
  alerts(): Promise<Alert[]>;
  decisions(): Promise<Decision[]>;
  suppliers(): Promise<SuppliersResponse>;
  proof(): Promise<Proof>;
  runs(): Promise<AgentRun[]>;
  /** Process the next recorded event. `live` defaults to true when the backend has a Claude key. */
  nextEvent(live?: boolean): Promise<StepResult>;
  /** Replay in rules mode up to `until`, then process `until` itself live when possible. */
  fastForward(until?: string, live?: boolean): Promise<StepResult>;
  reset(): Promise<LaunchState>;
  arbitrate(alertId: number, live?: boolean): Promise<ArbitrateResult>;
  decide(alertId: number, scenarioId: number, decidedBy?: string): Promise<Decision[]>;
}

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
  }
}

const BASE = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/$/, "");

/** "live" when talking to the backend, "mock" when replaying recorded snapshots. Show it on screen. */
export const API_MODE: "live" | "mock" = BASE ? "live" : "mock";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

const post = <T>(path: string, body: unknown = {}) => http<T>(path, { method: "POST", body: JSON.stringify(body) });

const httpApi: LaunchPilotApi = {
  state: () => http("/state"),
  projection: (componentId) => http(`/projection/${encodeURIComponent(componentId)}`),
  events: (limit = 50) => http(`/events?limit=${limit}`),
  alerts: () => http("/alerts"),
  decisions: () => http("/decisions"),
  suppliers: () => http("/suppliers"),
  proof: () => http("/proof"),
  runs: () => http("/runs"),
  nextEvent: (live) => post("/events/next", { live }),
  fastForward: (until = "EV-019", live) => post("/fast-forward", { until, live }),
  reset: () => post("/reset"),
  arbitrate: (alertId, live) => post(`/alerts/${alertId}/arbitrate`, { live }),
  decide: (alertId, scenarioId, decidedBy) =>
    post("/decisions", { alert_id: alertId, scenario_id: scenarioId, ...(decidedBy ? { decided_by: decidedBy } : {}) }),
};

export const api: LaunchPilotApi = API_MODE === "live" ? httpApi : mockApi;

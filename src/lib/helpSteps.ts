export const helpSteps = {
  "/": [
    ["main .grid", "Launch at a glance", "Track the simulated date, processed events, critical alerts and revenue at risk."],
    ["main #live", "Demo control panel", "These are demo-only controls, not part of the customer workflow. Next event advances the scenario. Fast-forward jumps to EV-019; Reset starts over. Live agent is available only when the service supports it."],
    ["main table", "Compare component risks", "Compare stockout weeks with and without supplier memory. Select a component row to update its stock projection."],
    ["main .recharts-responsive-container", "Read the stock projection", "The LaunchPilot median uses actual lead times; the shaded range shows uncertainty. Stock below zero signals a stockout."],
    ["main section:last-child", "Follow the decision trail", "The event feed and alerts explain what changed. Propose solutions on eligible alerts, choose a scenario and review the decision log."],
  ],
  "/supplier-memory": [
    ["main .recharts-responsive-container", "Compare lead times", "Announced and real mean lead times are measured in days. Suppliers with the largest gap appear first."],
    ["main table", "Inspect delivery history", "Compare the typical lead time, variability and late deliveries. The caption identifies how these figures were computed."],
  ],
  "/supplier-health": [
    ["#include-unreached", "Look beyond the demo clock", "Include notices the demo hasn't reached yet. Recorded mode shows all saved notices regardless of this switch."],
    ["article [data-help='source']", "Open the original notice", "The company name opens the real BODACC notice in a new tab. French names and procedures are shown unchanged."],
    ["article [data-help='exposure']", "Check supplier exposure", "A red badge names the matched supplier. Exposed notices come first, then newest publication within each group."],
    ["article [data-help='mapping']", "Read the mapping carefully", "This full note distinguishes the real company from a fictional demo supplier. A demo mapping does not mean they are the same company."],
    ["article [data-help='company']", "Inspect the company record", "Review company figures with their reporting years. Registry opens the public record. Alerts and verdicts appear below when available."],
  ],
  "/proof": [
    ["main .grid", "Compare backtest results", "Compare dated stockouts, dates wrong by more than one week and false alarms. These are recorded evaluation results, not a live run."],
    ["main table", "Inspect the demo seed", "Compare true stockout weeks and warning time for each affected component. Missed means no dated warning was produced."],
    ["main section p:last-child", "Check the evaluation protocol", "Read the protocol for the assumptions behind the comparison. The summary above reports seeds and mean warning time."],
  ],
  "/agent-traces": [
    ["main .grid", "Review agent activity", "Review run counts, live latency and token totals. Live means Claude; Rules means the deterministic fallback."],
    ["main section", "Inspect individual runs", "Runs appear newest first. Expand a run to read its output and tool inputs and outputs. If empty, process an event on Launch first."],
  ],
} as const;
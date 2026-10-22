import type { ComponentStatus } from "@/lib/api";

/** Display names and rules, as in docs/GLOSSARY.md and suggested_severity in tools.py (beverage/launchpilot). */
export const SEVERITY: Record<ComponentStatus, { label: string; rule: string }> = {
  high: { label: "Critical", rule: "At least a 50% chance of a stockout by one week after launch" },
  medium: { label: "Watch", rule: "At least a 50% chance of a stockout before year end, but not by launch" },
  low: { label: "Low", rule: "A stockout is possible but unlikely" },
  covered: { label: "Covered", rule: "Less than a 50% chance of a stockout before year end" },
};

/** DOM id of an alert card, so the Critical alerts tile can scroll to it. */
export const alertAnchor = (alertId: number) => `alert-${alertId}`;

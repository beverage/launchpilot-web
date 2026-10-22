import { createFileRoute } from "@tanstack/react-router";
import { TabPlaceholder } from "@/components/AppHeader";

export const Route = createFileRoute("/proof")({
  head: () => ({
    meta: [
      { title: "Proof — LaunchPilot" },
      { name: "description", content: "Evidence behind every LaunchPilot stockout warning." },
      { property: "og:title", content: "Proof — LaunchPilot" },
      { property: "og:description", content: "Evidence behind every LaunchPilot stockout warning." },
    ],
  }),
  component: () => (
    <TabPlaceholder title="Proof" description="Evidence supporting each prediction will appear here." />
  ),
});

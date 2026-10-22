import { createFileRoute } from "@tanstack/react-router";
import { TabPlaceholder } from "@/components/AppHeader";

export const Route = createFileRoute("/agent-traces")({
  head: () => ({
    meta: [
      { title: "Agent traces — LaunchPilot" },
      { name: "description", content: "Step-by-step traces of LaunchPilot's agent reasoning." },
      { property: "og:title", content: "Agent traces — LaunchPilot" },
      { property: "og:description", content: "Step-by-step traces of LaunchPilot's agent reasoning." },
    ],
  }),
  component: () => (
    <TabPlaceholder title="Agent traces" description="Agent run traces will appear here." />
  ),
});

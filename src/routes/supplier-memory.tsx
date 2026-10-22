import { createFileRoute } from "@tanstack/react-router";
import { TabPlaceholder } from "@/components/AppHeader";

export const Route = createFileRoute("/supplier-memory")({
  head: () => ({
    meta: [
      { title: "Supplier memory — LaunchPilot" },
      { name: "description", content: "What LaunchPilot remembers about each supplier's track record." },
      { property: "og:title", content: "Supplier memory — LaunchPilot" },
      { property: "og:description", content: "What LaunchPilot remembers about each supplier's track record." },
    ],
  }),
  component: () => (
    <TabPlaceholder title="Supplier memory" description="Supplier history and learned behavior will appear here." />
  ),
});

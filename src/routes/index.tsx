import { createFileRoute } from "@tanstack/react-router";
import { TabPlaceholder } from "@/components/AppHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Launch — LaunchPilot" },
      { name: "description", content: "Track launch readiness and spot stockouts before they happen." },
      { property: "og:title", content: "Launch — LaunchPilot" },
      { property: "og:description", content: "Track launch readiness and spot stockouts before they happen." },
    ],
  }),
  component: () => (
    <TabPlaceholder title="Launch" description="Launch overview and stockout risk will appear here." />
  ),
});

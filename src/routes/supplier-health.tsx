import { Suspense } from "react";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { loadSupplierHealth, sortHealthNotices } from "@/lib/supplierHealth";
import { SupplierHealthCard } from "@/components/lp/SupplierHealthCard";
import { ErrorNote, Loading, Page } from "@/components/lp/bits";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/supplier-health")({
  validateSearch: (search: Record<string, unknown>) => ({
    includeUnreached: search["includeUnreached"] === true || search["includeUnreached"] === "true",
  }),
  head: () => ({
    meta: [
      { title: "Supplier health — LaunchPilot" },
      { name: "description", content: "BODACC insolvency notices, company details and supplier exposure for LaunchPilot." },
      { property: "og:title", content: "Supplier health — LaunchPilot" },
      { property: "og:description", content: "BODACC insolvency notices, company details and supplier exposure for LaunchPilot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupplierHealthPage,
  errorComponent: ({ error }) => <Page><ErrorNote error={error} /></Page>,
});

function SupplierHealthPage() {
  const { includeUnreached } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <Page>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Supplier health</h1>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="include-unreached" checked={includeUnreached} onCheckedChange={(checked) => navigate({ search: { includeUnreached: checked } })} />
          <Label htmlFor="include-unreached" className="text-sm leading-relaxed">Show notices the demo hasn't reached yet</Label>
        </div>
      </div>
      <ClientOnly fallback={<Loading />}>
        <Suspense fallback={<Loading />}>
          <HealthNotices includeUnreached={includeUnreached} />
        </Suspense>
      </ClientOnly>
    </Page>
  );
}

function HealthNotices({ includeUnreached }: { includeUnreached: boolean }) {
  const { data } = useSuspenseQuery(queryOptions({
    queryKey: ["supplier-health", includeUnreached],
    queryFn: () => loadSupplierHealth(includeUnreached),
  }));
  if (data.source === "unavailable") return (
    <div role="status" className="space-y-2">
      <p className="text-sm font-medium">Supplier health needs the live database</p>
      {data.error && <ErrorNote error={data.error} />}
    </div>
  );
  const notices = sortHealthNotices(data.notices);
  if (notices.length === 0) return <p className="text-sm text-muted-foreground">No supplier health notices.</p>;
  return <div className="space-y-4">{notices.map((notice) => <SupplierHealthCard key={notice.event_id} notice={notice} />)}</div>;
}
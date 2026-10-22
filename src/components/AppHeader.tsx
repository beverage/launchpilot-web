import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ThemeToggle } from "./ThemeToggle";
import { StatusPills, DataErrorBanner } from "./StatusPills";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";

const tabs = [
  { to: "/", label: "Launch" },
  { to: "/supplier-memory", label: "Supplier memory" },
  { to: "/supplier-health", label: "Supplier health" },
  { to: "/proof", label: "Proof" },
  { to: "/agent-traces", label: "Agent traces" },
] as const;

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary font-mono text-sm font-bold text-primary-foreground">
            LP
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">LaunchPilot</h1>
            <p className="text-sm text-muted-foreground">
              Sees a launch stockout coming before it happens
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status pills slot */}
          <div id="status-pills" className="flex items-center gap-2">
            <StatusPills />
          </div>
          <ThemeToggle />
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-6">
      <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto" role="tablist">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            role="tab"
            activeOptions={{ exact: true }}
            className="whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "!border-signal !text-foreground", "aria-selected": true }}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <Button variant="outline" size="sm" className="shrink-0" id="page-help" title="Supplier health walkthrough (?)" onClick={() => {
        if (location.pathname === "/supplier-health") window.dispatchEvent(new Event("launchpilot:open-help"));
        else void navigate({ to: "/supplier-health", search: { includeUnreached: false, help: true } });
      }}><CircleHelp aria-hidden="true" />Help</Button>
      </div>
      <DataErrorBanner />
    </header>
  );
}

export function TabPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="rounded-lg border border-dashed bg-card p-10 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-signal">Coming soon</p>
        <h2 className="mt-2 text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}

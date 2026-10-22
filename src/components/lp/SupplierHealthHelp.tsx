import { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { usePageHelp } from "@/hooks/use-page-help";
import { Button } from "@/components/ui/button";

export function SupplierHealthHelp({ requested }: { requested: boolean }) {
  const { open, onOpenChange } = usePageHelp("launchpilot:supplier-health:walkthrough:v2");
  const navigate = useNavigate();

  useEffect(() => {
    if (!requested) return;
    onOpenChange(true);
    void navigate({ to: "/supplier-health", search: (previous) => ({ ...previous, help: false }), replace: true });
  }, [requested, navigate, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;
    const roots: Root[] = [];
    void import("driver.js").then(({ driver }) => {
      if (cancelled) return;
      const candidates = [
        { element: "#include-unreached", popover: { title: "Look beyond the demo clock", description: "Include notices the demo hasn't reached yet. Recorded mode shows all saved notices regardless of this switch." } },
        { element: "article [data-help='source']", popover: { title: "Open the original notice", description: "This company name opens the real BODACC notice in a new tab. French names and procedures are shown unchanged." } },
        { element: "article [data-help='exposure']", popover: { title: "Check supplier exposure", description: "A red badge names the matched supplier. Exposed notices come first; within each group, the newest notices come first." } },
        { element: "article [data-help='mapping']", popover: { title: "Read the mapping carefully", description: "This note distinguishes the real company from a fictional demo supplier. It is always shown in full—do not treat the mapping as proof they are the same company." } },
        { element: "article [data-help='company']", popover: { title: "Inspect the company record", description: "Review company size, headcount and financial figures with their reporting years. Registry opens the public company record. Alerts and agent verdicts appear below when available." } },
        { element: "#page-help", popover: { title: "Help is always here", description: "Use this Help button to restart the walkthrough, or press ? on Supplier health. Escape closes it at any point." } },
      ];
      const tour = driver({
        animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        overlayColor: "var(--foreground)", overlayOpacity: 0.55,
        popoverClass: "lp-help-popover", showButtons: [], stagePadding: 6,
        onDestroyed: () => {
          roots.splice(0).forEach((root) => queueMicrotask(() => root.unmount()));
          if (!cancelled) onOpenChange(false);
        },
        onPopoverRender: (popover) => {
          popover.wrapper.setAttribute("role", "dialog");
          popover.wrapper.setAttribute("aria-label", "Supplier health walkthrough");
          popover.footer.style.display = "block";
          popover.footer.replaceChildren();
          const root = createRoot(popover.footer);
          roots.push(root);
          root.render(<div className="mt-4 flex items-center justify-between gap-2">
            <Button variant="ghost" size="icon" title="Close walkthrough" aria-label="Close walkthrough" onClick={() => tour.destroy()}><X /></Button>
            <span className="text-xs text-muted-foreground">{(tour.getActiveIndex() ?? 0) + 1} / {tour.getConfig().steps?.length ?? 0}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" aria-label="Previous tip" title="Previous tip" disabled={tour.isFirstStep()} onClick={() => tour.movePrevious()}><ArrowLeft /></Button>
              <Button size="sm" onClick={() => tour.isLastStep() ? tour.destroy() : tour.moveNext()}>{tour.isLastStep() ? "Done" : "Next"}<ArrowRight /></Button>
            </div>
          </div>);
        },
      });
      destroy = () => tour.destroy();
      const start = () => {
        tour.setSteps(candidates.filter((step) => document.querySelector(step.element)));
        tour.drive();
      };
      // Wait briefly for the browser query to render notice targets.
      const observer = new MutationObserver(() => {
        if (document.querySelector("article [data-help='source']")) { observer.disconnect(); clearTimeout(timer); start(); }
      });
      const timer = window.setTimeout(() => { observer.disconnect(); if (!cancelled) start(); }, 2500);
      if (document.querySelector("article [data-help='source']")) { clearTimeout(timer); start(); }
      else observer.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true });
      const previousDestroy = destroy;
      destroy = () => { clearTimeout(timer); observer.disconnect(); previousDestroy(); };
    });
    return () => { cancelled = true; destroy?.(); };
  }, [open, onOpenChange]);
  return null;
}
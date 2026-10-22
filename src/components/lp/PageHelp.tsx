import { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { ArrowLeft, ArrowRight, CircleHelp, X } from "lucide-react";
import { usePageHelp } from "@/hooks/use-page-help";
import { Button } from "@/components/ui/button";
import { helpSteps } from "@/lib/helpSteps";

export function PageHelp({ pathname }: { pathname: string }) {
  const { open, onOpenChange } = usePageHelp(`launchpilot:${pathname}:walkthrough:v3`);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;
    const roots: Root[] = [];
    void import("driver.js").then(({ driver }) => {
      if (cancelled) return;
      const pageSteps = Object.entries(helpSteps).find(([path]) => path === pathname)?.[1] ?? [];
      const candidates: { element: string; popover: { title: string; description: string } }[] = pageSteps.map(([element, title, description]) => ({ element, popover: { title, description } }));
      candidates.push({ element: "#page-help", popover: { title: "Help for this tab", description: "This button restarts the walkthrough for the current tab. Press ? to reopen it, or Escape to close." } });
      const tour = driver({
        animate: false,
        overlayColor: "var(--foreground)", overlayOpacity: 0.55,
        popoverClass: "lp-help-popover", showButtons: [], stagePadding: 6,
        onDestroyed: () => {
          roots.splice(0).forEach((root) => queueMicrotask(() => root.unmount()));
          if (!cancelled) window.setTimeout(() => onOpenChange(false), 0);
        },
        onPopoverRender: (popover) => {
          popover.wrapper.setAttribute("role", "dialog");
          popover.wrapper.setAttribute("aria-label", "Page walkthrough");
          popover.wrapper.removeAttribute("aria-labelledby");
          popover.footer.style.display = "block";
          popover.footer.replaceChildren();
          const root = createRoot(popover.footer);
          roots.push(root);
          flushSync(() => root.render(<div className="mt-4 flex items-center justify-between gap-2">
            <Button variant="ghost" size="icon" title="Close walkthrough" aria-label="Close walkthrough" onClick={() => tour.destroy()}><X /></Button>
            <span className="text-xs text-muted-foreground">{(tour.getActiveIndex() ?? 0) + 1} / {tour.getConfig().steps?.length ?? 0}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" aria-label="Previous tip" title="Previous tip" disabled={tour.isFirstStep()} onClick={() => tour.movePrevious()}><ArrowLeft /></Button>
              <Button size="sm" onClick={() => tour.isLastStep() ? tour.destroy() : tour.moveNext()}>{tour.isLastStep() ? "Done" : "Next"}<ArrowRight /></Button>
            </div>
          </div>));
        },
      });
      destroy = () => tour.destroy();
      const start = () => {
        tour.setSteps(candidates.filter((step) => document.querySelector(step.element)));
        tour.drive();
      };
      // Wait briefly for the browser query to render notice targets.
      const observer = new MutationObserver(() => {
        if (document.querySelector("main table, main article, main .grid")) { observer.disconnect(); clearTimeout(timer); start(); }
      });
      const timer = window.setTimeout(() => { observer.disconnect(); if (!cancelled) start(); }, 2500);
      if (document.querySelector("main table, main article, main .grid")) { clearTimeout(timer); start(); }
      else observer.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true });
      const previousDestroy = destroy;
      destroy = () => { clearTimeout(timer); observer.disconnect(); previousDestroy(); };
    });
    return () => { cancelled = true; destroy?.(); };
  }, [open, onOpenChange, pathname]);
  return <Button id="page-help" variant="outline" size="sm" className="shrink-0" title="Help for this tab (?)" aria-keyshortcuts="?" onClick={() => onOpenChange(true)}><CircleHelp aria-hidden="true" />Help</Button>;
}
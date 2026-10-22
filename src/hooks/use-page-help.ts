import { useEffect, useState } from "react";

/** Local, browser-only dismissal preference; never stores API or company data. */
export function usePageHelp(storageKey: string) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(storageKey) !== "seen");
    } catch {
      setOpen(true);
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (event.key !== "?" || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select, [role='textbox']"))) return;
      event.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [storageKey]);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      try { localStorage.setItem(storageKey, "seen"); } catch { /* Help still works without browser storage. */ }
    }
  };

  return { open, onOpenChange };
}
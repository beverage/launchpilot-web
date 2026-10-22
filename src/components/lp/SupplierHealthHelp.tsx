import { CircleHelp } from "lucide-react";
import { usePageHelp } from "@/hooks/use-page-help";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function SupplierHealthHelp() {
  const { open, onOpenChange } = usePageHelp("launchpilot:supplier-health:help:v1");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Supplier health help" aria-keyshortcuts="?" title="Supplier health help (?)">
          <CircleHelp aria-hidden="true" /> Help
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-lg">
        <DialogHeader className="pr-6">
          <DialogTitle>Reading supplier health</DialogTitle>
          <DialogDescription>Public insolvency notices and their connection to your suppliers.</DialogDescription>
        </DialogHeader>
        <dl className="space-y-4 text-sm leading-relaxed">
          <div>
            <dt className="font-semibold">Start with exposure</dt>
            <dd className="mt-1 text-muted-foreground">Exposed notices appear first, then the newest notices. A red badge names the matched supplier; “No exposure” means the notice has no supplier exposure recorded.</dd>
          </div>
          <div>
            <dt className="font-semibold">Check the source and mapping</dt>
            <dd className="mt-1 text-muted-foreground">Select a company name to open the original BODACC notice, or Registry for its company record. Read any mapping note below the exposure badge: a real notice may be linked to a fictional demo supplier, not the same company.</dd>
          </div>
          <div>
            <dt className="font-semibold">Look beyond the demo clock</dt>
            <dd className="mt-1 text-muted-foreground">“Show notices the demo hasn't reached yet” includes later notices. Recorded mode lists all saved notices regardless of this switch.</dd>
          </div>
          <div>
            <dt className="font-semibold">Read the assessment</dt>
            <dd className="mt-1 text-muted-foreground">Company figures show their reporting year when available. Severity, an alert explanation and an agent verdict appear only when returned by the service. French source names and procedures are kept unchanged.</dd>
          </div>
        </dl>
        <DialogFooter className="items-center gap-3 sm:justify-between">
          <p className="text-xs text-muted-foreground">Reopen with Help or <kbd className="rounded border px-1.5 py-0.5 font-mono">?</kbd></p>
          <DialogClose asChild><Button size="sm">Got it</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import type { LaunchEvent } from "@/lib/api";
import { date } from "@/lib/format";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const shortDate = (iso: string) => date(iso).replace(/ \d{4}$/, "");

// Nested records (a BODACC notice's company profile) stay out of the feed; scalars and lists of scalars show.
type Flat = string | number | boolean | (string | number)[];
const flat = (v: unknown): v is Flat =>
  ["string", "number", "boolean"].includes(typeof v) ||
  (Array.isArray(v) && v.every((x) => typeof x === "string" || typeof x === "number"));

const value = (v: Flat) =>
  Array.isArray(v) ? (
    v.join(", ")
  ) : typeof v === "string" && v.startsWith("https://") ? (
    <a href={v} target="_blank" rel="noreferrer" className="underline underline-offset-2">
      {new URL(v).hostname}
    </a>
  ) : (
    String(v)
  );

/** Newest-first events as one-line rows; a row opens on the email text and the payload fields. */
export function EventFeed({ events }: { events: LaunchEvent[] }) {
  return (
    <Accordion type="multiple" className="rounded-lg border bg-card px-3">
      {events.map((e) => {
        const { body, ...rest } = e.payload;
        const fields = Object.entries(rest).filter((kv): kv is [string, Flat] => flat(kv[1]));
        return (
          <AccordionItem key={e.event_id} value={e.event_id} className="last:border-b-0">
            <AccordionTrigger className="group min-w-0 gap-3 py-2.5 hover:no-underline">
              <span className="min-w-0 flex-1 truncate group-data-[state=open]:whitespace-normal">
                {/* api.py labels stream events "… (live)"; the feed doesn't say where an event came from */}
                <span className="font-medium">{e.kind_label.replace(/\s*\(live\)$/, "")}</span>
                <span className="font-normal text-muted-foreground"> · {e.summary}</span>
              </span>
              <span className="shrink-0 font-mono text-[11px] font-normal text-muted-foreground tabular-nums">
                {shortDate(e.ts)}
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              {typeof body === "string" && (
                <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-[13px] leading-relaxed">
                  {body}
                </p>
              )}
              {fields.length > 0 && (
                <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1 text-xs">
                  {fields.map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted-foreground">{k.replaceAll("_", " ")}</dt>
                      <dd className="break-words font-mono">{value(v)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="font-mono text-[11px] text-muted-foreground">
                {e.event_id} · {e.ts.replace("T", " ").slice(0, 16)}
              </p>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

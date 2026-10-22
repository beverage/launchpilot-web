import { ExternalLink } from "lucide-react";
import type { CompanyCard, SupplierHealthNotice } from "@/lib/api";
import { date, eur } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Markdown, SeverityBadge, Tag } from "@/components/lp/bits";

function CompanyDetails({ company }: { company: CompanyCard }) {
  const accounts = company.accounts_year ? ` (${company.accounts_year})` : "";
  const details = [
    ["Size", company.size],
    ["Headcount", company.headcount ? `${company.headcount}${company.headcount_year ? ` (${company.headcount_year})` : ""}` : null],
    ["Founded", company.founded?.slice(0, 4)],
    ["Head office", company.head_office_city],
    [`Revenue${accounts}`, company.revenue_eur == null ? null : eur(company.revenue_eur)],
    [`Net result${accounts}`, company.net_result_eur == null ? null : eur(company.net_result_eur)],
  ];

  return (
    <div className="border-t pt-4" data-help="company">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        {details.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-words font-medium tabular-nums">{value ?? "—"}</dd>
          </div>
        ))}
      </dl>
      <Button asChild variant="link" size="sm" className="mt-3 h-auto p-0">
        <a href={company.registry_url} target="_blank" rel="noopener noreferrer">Registry <ExternalLink aria-hidden="true" /></a>
      </Button>
    </div>
  );
}

export function SupplierHealthCard({ notice }: { notice: SupplierHealthNotice }) {
  return (
    <article className="min-w-0 space-y-4 rounded-lg border bg-card p-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="min-w-0 text-base font-semibold">
            <a data-help="source" className="break-words underline-offset-4 hover:underline" href={notice.notice_url} target="_blank" rel="noopener noreferrer">
              {notice.company_name} <ExternalLink className="inline h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </h2>
          <Tag className="normal-case tracking-normal">Real data · BODACC</Tag>
        </div>
        <p className="text-sm font-medium">{notice.procedure} · {date(notice.judgment_date)}</p>
        <p className="text-sm text-muted-foreground">{[notice.court, notice.city, notice.region].filter(Boolean).join(" · ")}</p>
      </div>

      <div className="space-y-2" data-help="exposure">
        {notice.exposed ? (
          <Tag className="max-w-full whitespace-normal border-sev-high/50 bg-sev-high/10 text-sev-high normal-case tracking-normal">Exposed: {notice.matched_supplier_name}</Tag>
        ) : <Tag className="normal-case tracking-normal">No exposure</Tag>}
        {notice.mapping_note != null && (
          <div data-help="mapping" className="whitespace-pre-wrap break-words border-l-2 border-sev-medium bg-sev-medium/5 px-3 py-2 text-sm leading-relaxed">{notice.mapping_note}</div>
        )}
      </div>

      {notice.company && <CompanyDetails company={notice.company} />}

      {notice.alert_severity && (
        <div className="space-y-2 border-t pt-4">
          <SeverityBadge status={notice.alert_severity} />
          {notice.alert_explanation && <p className="break-words text-sm leading-relaxed">{notice.alert_explanation}</p>}
        </div>
      )}
      {notice.agent_verdict && (
        <div className="space-y-2 border-t pt-4">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">Agent verdict</h3>
          <Markdown>{notice.agent_verdict}</Markdown>
        </div>
      )}
    </article>
  );
}
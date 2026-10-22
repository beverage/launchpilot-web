import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SupplierHealthCard } from "@/components/lp/SupplierHealthCard";
import type { CompanyCard, SupplierHealthNotice } from "@/lib/api";

afterEach(cleanup);

const company = (over: Partial<CompanyCard> = {}): CompanyCard => ({
  legal_name: "Coffrets Prestige",
  siren: "123456789",
  activity_code: "2229A",
  activity_label: "Fabrication de coffrets",
  size: "SME",
  headcount: "20-49",
  headcount_year: "2024",
  founded: "1998-01-01",
  status: "active",
  head_office_city: "Lyon",
  head_office_postcode: "69000",
  head_office_department: "Rhône",
  open_sites: 1,
  revenue_eur: 1200000,
  net_result_eur: -50000,
  accounts_year: "2024",
  registry_url: "https://annuaire-entreprises.data.gouv.fr/entreprise/123456789",
  source: "ok",
  bodacc_history: [],
  warning_signs: [],
  ...over,
});

const historyItem = (date: string, label: string, accounts_period_end?: string) => ({
  date,
  family: label === "Insolvency proceedings" ? "collective" : "accounts",
  label,
  notice_url: `https://www.bodacc.fr/annonce/${date}`,
  ...(accounts_period_end ? { accounts_period_end } : {}),
});

const notice = (over: Partial<SupplierHealthNotice> = {}): SupplierHealthNotice => ({
  event_id: "SH-001",
  published_at: "2026-10-01",
  reached_by_demo: true,
  siren: "123456789",
  company_name: "Coffrets Prestige",
  activity_code: "2229A",
  activity_label: null,
  procedure: "Liquidation judiciaire",
  procedure_family: "collective",
  court: "Tribunal de commerce de Lyon",
  judgment_date: "2026-09-28",
  city: "Lyon",
  region: "Auvergne-Rhône-Alpes",
  notice_url: "https://www.bodacc.fr/annonce/SH-001",
  company: null,
  matched_supplier_id: null,
  matched_supplier_name: null,
  exposed: false,
  mapping_note: null,
  alert_id: null,
  alert_severity: null,
  alert_explanation: null,
  ...over,
});

describe("Warning signs section", () => {
  it("shows each warning sign as a bullet, under the exposure block", () => {
    render(<SupplierHealthCard notice={notice({ company: company({ warning_signs: ["Profit warning issued", "Payment incidents reported"] }) })} />);
    const heading = screen.getByText("Warning signs");
    const section = heading.closest("div")!.parentElement!;
    expect(section.previousElementSibling).not.toBeNull(); // sits below the exposure/mapping block
    expect(screen.getByText("Profit warning issued").closest("li")).not.toBeNull();
    expect(screen.getByText("Payment incidents reported").closest("li")).not.toBeNull();
  });

  it("hides the section when the list is empty", () => {
    render(<SupplierHealthCard notice={notice({ company: company({ warning_signs: [] }) })} />);
    expect(screen.queryByText("Warning signs")).toBeNull();
  });

  it("hides the section when there is no company card", () => {
    render(<SupplierHealthCard notice={notice({ company: null })} />);
    expect(screen.queryByText("Warning signs")).toBeNull();
  });
});

describe("BODACC history timeline", () => {
  const items = [
    historyItem("2026-10-02", "Insolvency proceedings"),
    historyItem("2026-09-30", "Accounts filed", "2024-09-30"),
    historyItem("2025-09-30", "Accounts filed", "2023-09-30"),
    historyItem("2024-09-30", "Accounts filed", "2022-09-30"),
    historyItem("2023-09-30", "Accounts filed", "2021-09-30"),
    historyItem("2022-09-30", "Accounts filed", "2020-09-30"),
    historyItem("2021-09-30", "Business sale or transfer"),
  ];

  it("shows the 5 most recent first, newest first, with a Show all toggle", async () => {
    render(<SupplierHealthCard notice={notice({ company: company({ bodacc_history: items }) })} />);
    expect(screen.getByText("2 Oct 2026 · Insolvency proceedings")).toBeInTheDocument();
    expect(screen.getByText("30 Sep 2023 · Accounts filed")).toBeInTheDocument();
    expect(screen.queryByText("30 Sep 2022 · Accounts filed")).toBeNull(); // 6th not shown
    const toggle = screen.getByRole("button", { name: "Show all 7" });
    fireEvent.click(toggle);
    expect(screen.getByText("30 Sep 2022 · Accounts filed")).toBeInTheDocument();
    expect(screen.getByText("30 Sep 2021 · Business sale or transfer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument();
  });

  it("shows accounts_period_end after Accounts filed entries", () => {
    render(<SupplierHealthCard notice={notice({ company: company({ bodacc_history: items }) })} />);
    expect(screen.getByText("accounts to 30 Sep 2024")).toBeInTheDocument();
  });

  it("highlights Insolvency proceedings entries in the high-severity colour", () => {
    render(<SupplierHealthCard notice={notice({ company: company({ bodacc_history: items }) })} />);
    const link = screen.getByText("2 Oct 2026 · Insolvency proceedings").closest("a")!;
    expect(link.className).toContain("text-sev-high");
  });

  it("hides the section when there is no history", () => {
    render(<SupplierHealthCard notice={notice({ company: company({ bodacc_history: [] }) })} />);
    expect(screen.queryByText("BODACC history")).toBeNull();
    expect(screen.queryByRole("button", { name: /Show all/ })).toBeNull();
  });
});

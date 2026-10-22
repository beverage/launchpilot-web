import { describe, expect, it, vi } from "vitest";
import { api, type SupplierHealthNotice } from "@/lib/api";
import { loadSupplierHealth, sortHealthNotices } from "@/lib/supplierHealth";

describe("Supplier health rules", () => {
  it("passes false for demo-reached notices", async () => {
    const spy = vi.spyOn(api, "supplierHealth").mockResolvedValue({ source: "sql_view", error: null, notices: [] });
    await loadSupplierHealth(false);
    expect(spy).toHaveBeenCalledWith(false);
    spy.mockRestore();
  });

  it("passes true to include notices the demo has not reached", async () => {
    const spy = vi.spyOn(api, "supplierHealth").mockResolvedValue({ source: "sql_view", error: null, notices: [] });
    await loadSupplierHealth(true);
    expect(spy).toHaveBeenCalledWith(true);
    spy.mockRestore();
  });

  it("orders exposed notices first, then newest publication within each group", () => {
    const notice = (event_id: string, exposed: boolean, published_at: string) => ({ event_id, exposed, published_at }) as SupplierHealthNotice;
    const notices = [notice("unexposed-old", false, "2026-09-01"), notice("exposed-old", true, "2026-08-01"), notice("unexposed-new", false, "2026-10-22"), notice("exposed-new", true, "2026-10-01")];
    expect(sortHealthNotices(notices).map((n) => n.event_id)).toEqual(["exposed-new", "exposed-old", "unexposed-new", "unexposed-old"]);
    expect(notices[0]?.event_id).toBe("unexposed-old");
  });
});
import { api, type SupplierHealthNotice } from "@/lib/api";

export const loadSupplierHealth = (includeUnreached: boolean) => api.supplierHealth(includeUnreached);

export function sortHealthNotices(notices: SupplierHealthNotice[]): SupplierHealthNotice[] {
  return [...notices].sort((a, b) => Number(b.exposed) - Number(a.exposed) || b.published_at.localeCompare(a.published_at));
}
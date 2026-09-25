/**
 * API service for Tenant Consolidated Financial Overview and Vouchers
 */

const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

function getAuthHeader(token) {
  const authToken =
    token || (typeof window !== "undefined" ? localStorage.getItem("tally_auth_token") : null);
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

/**
 * Fetch consolidated financial metrics for a tenant
 */
export async function fetchTenantDashboardApi({ tenantId, fromDate, toDate, companyId, companyIds, token }) {
  if (!tenantId) return null;

  const params = new URLSearchParams();
  if (fromDate) params.append("from_date", fromDate);
  if (toDate) params.append("to_date", toDate);
  if (companyId) params.append("company_id", companyId);
  if (companyIds) params.append("company_ids", Array.isArray(companyIds) ? companyIds.join(",") : companyIds);

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${BACKEND_URL}/api/v1/dashboard/tenant/${encodeURIComponent(tenantId)}${query}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(token),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch tenant dashboard (${response.status})`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Fetch recent vouchers / daybook transactions
 */
export async function fetchRecentVouchersApi({ companyId, companyIds, fromDate, toDate, page = 1, limit = 10, token } = {}) {
  const params = new URLSearchParams();
  if (companyId) params.append("company_id", companyId);
  if (companyIds) params.append("company_ids", Array.isArray(companyIds) ? companyIds.join(",") : companyIds);
  if (fromDate) params.append("from_date", fromDate);
  if (toDate) params.append("to_date", toDate);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${BACKEND_URL}/api/v1/tally/voucher/getvoucher${query}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(token),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch vouchers");
  }

  const result = await response.json();
  return result;
}

/**
 * Fetch monthly revenue and expense trends for a company
 */
export async function fetchRevenueExpenseTrendApi({ companyId, targetYear, token }) {
  if (!companyId) return null;

  const params = new URLSearchParams();
  if (targetYear) params.append("targetYear", targetYear);

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${BACKEND_URL}/api/v1/tally/summary/revenue-expense/${encodeURIComponent(companyId)}${query}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(token),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch revenue expense trend");
  }

  const result = await response.json();
  return result.data;
}

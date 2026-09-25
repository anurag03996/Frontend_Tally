import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchTenantDashboardApi, fetchRecentVouchersApi } from "../services/tenantDashboardApi";
import { formatIndianCurrency } from "../lib/formatters";

/**
 * Resolve 2-digit GST state code from branch GST number or state/name
 * Delhi = '07', Maharashtra (Mumbai) = '27', etc.
 */
export function resolveGstStateCode(branch) {
  const rawGst = (branch?.gst_number || branch?.gstState || "").trim();
  if (rawGst.length >= 2 && /^\d{2}/.test(rawGst)) {
    return rawGst.slice(0, 2);
  }

  const searchStr = `${branch?.state || ""} ${branch?.company_name || ""} ${branch?.name || ""}`.toLowerCase();
  if (
    searchStr.includes("mumbai") ||
    searchStr.includes("maharashtra") ||
    searchStr.includes("pune") ||
    searchStr.includes("thane")
  ) {
    return "27"; // Maharashtra
  }
  if (searchStr.includes("delhi") || searchStr.includes("ncr")) {
    return "07"; // Delhi
  }
  if (searchStr.includes("karnataka") || searchStr.includes("bangalore") || searchStr.includes("bengaluru")) {
    return "29"; // Karnataka
  }
  if (searchStr.includes("tamil") || searchStr.includes("chennai")) {
    return "33"; // Tamil Nadu
  }
  if (searchStr.includes("gujarat") || searchStr.includes("ahmedabad") || searchStr.includes("surat")) {
    return "24"; // Gujarat
  }
  if (searchStr.includes("uttar pradesh") || searchStr.includes("noida") || searchStr.includes("lucknow")) {
    return "09"; // Uttar Pradesh
  }
  if (searchStr.includes("west bengal") || searchStr.includes("kolkata")) {
    return "19"; // West Bengal
  }
  if (searchStr.includes("haryana") || searchStr.includes("gurugram") || searchStr.includes("gurgaon")) {
    return "06"; // Haryana
  }
  if (searchStr.includes("telangana") || searchStr.includes("hyderabad")) {
    return "36"; // Telangana
  }

  return "07";
}

function mapBranchItem(b, idx, totalRev, colors) {
  const rev = Number(b.revenue) || 0;
  const sharePct = totalRev > 0 ? (rev / totalRev) * 100 : 0;
  const gstState = resolveGstStateCode(b);

  return {
    id: b.company_id || b._id,
    company_id: b.company_id || b._id,
    name: b.company_name || b.name || "Branch",
    company_name: b.company_name || b.name || "Branch",
    gst_number: b.gst_number || (gstState === "27" ? "27ABCDE1234F1Z5" : "07ABCDE1234F1Z5"),
    gstState,
    state: b.state || (gstState === "27" ? "Maharashtra" : "Delhi"),
    revenue: rev,
    share: `${sharePct.toFixed(1)}%`,
    sharePct,
    color: colors[idx % colors.length],
  };
}

export function useTenantDashboard({ tenantId, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [vouchersData, setVouchersData] = useState({ data: [], count: 0, total_count: 0 });
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // Filter state
  const [fiscalYear, setFiscalYear] = useState("FY 2026-27");
  const [dateRange, setDateRange] = useState({
    fromDate: "2026-04-01",
    toDate: "2026-09-25",
    label: "01 Apr 2026 - 25 Sep 2026",
    quarter: "Q1-Q2",
  });
  const [selectedBranchId, setSelectedBranchId] = useState(null); // null = consolidated
  const [trendView, setTrendView] = useState("monthly"); // monthly | quarterly | cumulative
  const [voucherPage, setVoucherPage] = useState(1);
  const [voucherSearch, setVoucherSearch] = useState("");
  const [voucherTypeFilter, setVoucherTypeFilter] = useState("all");
  const [voucherStatusFilter, setVoucherStatusFilter] = useState("all");

  const [lastSynced, setLastSynced] = useState("Just now");
  const [masterBranches, setMasterBranches] = useState([]);

  // Load consolidated tenant dashboard data
  const loadDashboard = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      setError(null);
      const dashboard = await fetchTenantDashboardApi({
        tenantId,
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
        companyId: selectedBranchId || undefined,
        token,
      });
      setData(dashboard);
      setLastSynced("Just now");

      // Populate master list of branches if on consolidated view or if not yet populated
      if (dashboard?.breakdown && (!selectedBranchId || masterBranches.length === 0)) {
        const colors = ["#2563EB", "#3B82F6", "#059669", "#475569", "#8B5CF6", "#F59E0B"];
        const totalRev = Number(dashboard.summary?.total_revenue) || 1;
        const mapped = dashboard.breakdown
          .map((b, idx) => mapBranchItem(b, idx, totalRev, colors))
          .sort((a, b) => b.revenue - a.revenue);

        if (mapped.length > masterBranches.length) {
          setMasterBranches(mapped);
        }
      }
    } catch (err) {
      console.error("Error loading tenant dashboard:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [tenantId, dateRange.fromDate, dateRange.toDate, selectedBranchId, token, masterBranches.length]);

  // Load recent vouchers based on selected branch
  const loadVouchers = useCallback(async () => {
    try {
      setLoadingVouchers(true);
      const companyIdsParam = selectedBranchId
        ? undefined
        : (data?.breakdown?.map((b) => b.company_id).filter(Boolean).join(",") ||
           masterBranches.map((b) => b.id).filter(Boolean).join(",") ||
           undefined);

      const res = await fetchRecentVouchersApi({
        companyId: selectedBranchId || undefined,
        companyIds: companyIdsParam,
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
        page: voucherPage,
        limit: 10,
        token,
      });
      setVouchersData(res);
    } catch (err) {
      console.warn("Could not fetch vouchers from API:", err);
    } finally {
      setLoadingVouchers(false);
    }
  }, [selectedBranchId, data?.breakdown, masterBranches, dateRange.fromDate, dateRange.toDate, voucherPage, token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  // Derived summaries & metrics
  const summary = useMemo(() => {
    if (!data?.summary) {
      return {
        total_revenue: 0,
        total_purchase: 0,
        total_expense: 0,
        total_receivable: 0,
        total_payable: 0,
        companies_count: 0,
        total_vouchers: 0,
        monthly_trend: [],
        tax_summary: null,
      };
    }
    return {
      ...data.summary,
      total_revenue: Number(data.summary.total_revenue) || 0,
      total_purchase: Number(data.summary.total_purchase) || 0,
      total_expense: Number(data.summary.total_expense) || 0,
      total_receivable: Number(data.summary.total_receivable) || 0,
      total_payable: Number(data.summary.total_payable) || 0,
      total_vouchers: Number(data.summary.total_vouchers) || 0,
    };
  }, [data]);

  // Net position calculation: Sales - Purchases
  const netPosition = useMemo(() => {
    const rev = summary.total_revenue || 0;
    const pur = summary.total_purchase || 0;
    const net = rev - pur;
    const margin = rev > 0 ? ((net / rev) * 100).toFixed(1) : 0;
    return {
      amount: net,
      margin: `${margin}%`,
    };
  }, [summary]);

  // Always keep all branches available for dropdown selector
  const branches = useMemo(() => {
    if (masterBranches.length > 0) return masterBranches;

    if (!data?.breakdown || data.breakdown.length === 0) {
      return [];
    }

    const totalRev = summary.total_revenue || 1;
    const colors = ["#2563EB", "#3B82F6", "#059669", "#475569", "#8B5CF6", "#F59E0B"];

    return data.breakdown
      .map((b, idx) => mapBranchItem(b, idx, totalRev, colors))
      .sort((a, b) => b.revenue - a.revenue);
  }, [masterBranches, data, summary]);

  // Currently selected branch object
  const selectedBranch = useMemo(() => {
    if (!selectedBranchId) return null;
    return branches.find((b) => String(b.id) === String(selectedBranchId)) || null;
  }, [branches, selectedBranchId]);

  // Dynamic regional insights for Branch Contribution Panel
  const insights = useMemo(() => {
    if (branches.length === 0) {
      return {
        highestVolume: { title: "N/A", subtitle: "No data available" },
        highestGrowth: { title: "N/A", subtitle: "No data available" },
      };
    }

    const topBranch = branches[0];
    const secondBranch = branches.length > 1 ? branches[1] : null;

    const highestVolume = {
      name: topBranch.name,
      amount: formatIndianCurrency(topBranch.revenue),
      title: `${topBranch.name} (${formatIndianCurrency(topBranch.revenue)})`,
      subtitle: `Primary revenue hub (${topBranch.share} of tenant sales)`,
    };

    const highestGrowth = secondBranch && secondBranch.revenue > 0
      ? {
          name: secondBranch.name,
          amount: formatIndianCurrency(secondBranch.revenue),
          title: `${secondBranch.name} (${formatIndianCurrency(secondBranch.revenue)})`,
          subtitle: `Secondary operational entity (${secondBranch.share} share)`,
        }
      : {
          name: topBranch.name,
          amount: formatIndianCurrency(topBranch.revenue),
          title: topBranch.name,
          subtitle: "Centralized entity generating 100% of tenant revenue",
        };

    return { highestVolume, highestGrowth };
  }, [branches]);

  // Cash conversion cycle days
  const cashCycleDays = useMemo(() => {
    const rev = summary.total_revenue || 0;
    const rec = summary.total_receivable || 0;
    if (rev <= 0) return 0;
    const dailyRev = rev / 365;
    return Math.max(1, Math.round(rec / dailyRev));
  }, [summary]);

  // Isolate or un-isolate branch
  const selectBranch = useCallback((branchId) => {
    setSelectedBranchId(branchId || null);
    setVoucherPage(1);
  }, []);

  const toggleBranchIsolation = useCallback((branchId) => {
    setSelectedBranchId((prev) => (prev === branchId ? null : branchId));
    setVoucherPage(1);
  }, []);

  return {
    data,
    loading,
    error,
    summary,
    netPosition,
    branches,
    selectedBranch,
    insights,
    cashCycleDays,
    selectedBranchId,
    selectBranch,
    toggleBranchIsolation,
    fiscalYear,
    setFiscalYear,
    dateRange,
    setDateRange,
    trendView,
    setTrendView,
    vouchersData,
    loadingVouchers,
    voucherPage,
    setVoucherPage,
    voucherSearch,
    setVoucherSearch,
    voucherTypeFilter,
    setVoucherTypeFilter,
    voucherStatusFilter,
    setVoucherStatusFilter,
    lastSynced,
    refresh: loadDashboard,
  };
}

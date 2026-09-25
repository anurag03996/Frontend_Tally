import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchTenantDashboardApi, fetchRecentVouchersApi } from "../services/tenantDashboardApi";
import { formatIndianCurrency } from "../lib/formatters";

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
          .map((b, idx) => {
            const rev = Number(b.revenue) || 0;
            const sharePct = totalRev > 0 ? (rev / totalRev) * 100 : 0;
            const rawGst = b.gst_number || "";
            const gstState = rawGst.length >= 2 ? rawGst.slice(0, 2) : "07";

            return {
              id: b.company_id,
              company_id: b.company_id,
              name: b.company_name || "Branch",
              company_name: b.company_name || "Branch",
              gstState,
              revenue: rev,
              share: `${sharePct.toFixed(1)}%`,
              sharePct,
              color: colors[idx % colors.length],
            };
          })
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
      .map((b, idx) => {
        const rev = Number(b.revenue) || 0;
        const sharePct = totalRev > 0 ? (rev / totalRev) * 100 : 0;
        const rawGst = b.gst_number || "";
        const gstState = rawGst.length >= 2 ? rawGst.slice(0, 2) : "07";

        return {
          id: b.company_id,
          company_id: b.company_id,
          name: b.company_name || "Branch",
          company_name: b.company_name || "Branch",
          gstState,
          revenue: rev,
          share: `${sharePct.toFixed(1)}%`,
          sharePct,
          color: colors[idx % colors.length],
        };
      })
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

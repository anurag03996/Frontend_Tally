import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useTenantDashboard } from "../../hooks/useTenantDashboard";

import { HeaderControls } from "./HeaderControls";
import { KpiSummaryGrid } from "./KpiSummaryGrid";
import { SalesPurchasesTrendChart } from "./SalesPurchasesTrendChart";
import { BranchContributionPanel } from "./BranchContributionPanel";
import { TaxBreakdownCards } from "./TaxBreakdownCards";
import { RecentTransactionsTable } from "./RecentTransactionsTable";
import { DashboardFooter } from "./DashboardFooter";
import { AlertCircle, RefreshCw, X } from "lucide-react";

export function DashboardPage() {
  const { user, activeTenant, logout, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Audit voucher modal state
  const [auditingVoucher, setAuditingVoucher] = useState(null);

  // Hook managing API calls and consolidated state
  const {
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
    trendView,
    setTrendView,
    vouchersData,
    loadingVouchers,
    voucherPage,
    setVoucherPage,
    lastSynced,
    loading,
    error,
    refresh,
  } = useTenantDashboard({
    tenantId: activeTenant?.id || activeTenant?._id || "6ab515173121e2b8138b9687",
    token,
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSwitchTenant = () => {
    navigate("/select-tenant");
  };

  // Derive tenant display names
  const tenantDisplayName = activeTenant?.name || "Corporate Group";
  const tenantDisplayId = activeTenant?.id ? activeTenant.id.slice(-8).toUpperCase() : "ACME-409";
  const userDisplayName = user?.name || "Administrator";
  const userRoleDisplay = activeTenant?.role
    ? `${activeTenant.role.charAt(0).toUpperCase() + activeTenant.role.slice(1)} Controller`
    : "Group Controller";

  const activeBranchesCount = branches.filter((b) => b.revenue > 0).length || branches.length || 1;
  const totalEntitiesCount = branches.length || 1;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* 1. TOP HEADER & FILTER CONTROLS TOOLBAR */}
      <HeaderControls
        tenantName={tenantDisplayName}
        tenantId={tenantDisplayId}
        userName={userDisplayName}
        userRole={userRoleDisplay}
        entitiesCount={totalEntitiesCount}
        branches={branches}
        selectedBranchId={selectedBranchId}
        onSelectBranch={selectBranch}
        fiscalYear={fiscalYear}
        dateRange={dateRange}
        lastSynced={lastSynced}
        isRefreshing={loading}
        onRefresh={refresh}
        onFiscalYearChange={setFiscalYear}
        onSwitchTenant={handleSwitchTenant}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* 2. MAIN DASHBOARD CONTENT */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Branch Isolation Active Banner */}
        {selectedBranchId && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2.5 rounded-xl text-xs font-medium animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-blue-600 animate-pulse" />
              <span>
                Isolating data for branch entity:{" "}
                <strong className="font-bold">
                  {branches.find((b) => b.id === selectedBranchId)?.name || selectedBranchId}
                </strong>
              </span>
            </div>
            <button
              onClick={() => toggleBranchIsolation(selectedBranchId)}
              className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 bg-white px-2 py-1 rounded-md border border-blue-200 shadow-2xs cursor-pointer transition-colors"
            >
              <span>Clear Filter</span>
              <X className="size-3" />
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-600 shrink-0" />
              <span>
                Backend notice: {error}.
              </span>
            </div>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1 text-amber-900 font-semibold hover:underline cursor-pointer"
            >
              <RefreshCw className="size-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* 3. 6 TOP KPI METRIC CARDS */}
        <section aria-label="KPI Metrics">
          <KpiSummaryGrid
            loading={loading}
            totalSales={summary.total_revenue}
            totalPurchases={summary.total_purchase}
            receivables={summary.total_receivable}
            payables={summary.total_payable}
            netPosition={netPosition}
            totalVouchers={summary.total_vouchers}
            activeEntitiesCount={activeBranchesCount}
            totalEntitiesCount={totalEntitiesCount}
          />
        </section>

        {/* 4. DUAL COLUMN: TREND CHART (7 Cols) & BRANCH CONTRIBUTION (5 Cols) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5" aria-label="Trends & Branch Breakdown">
          <div className="lg:col-span-7">
            <SalesPurchasesTrendChart
              loading={loading}
              viewMode={trendView}
              onViewModeChange={setTrendView}
              periodLabel="H1 FY 2026-27"
              monthlyTrend={summary.monthly_trend}
              cashCycleDays={cashCycleDays}
              itcUtilizedNote="Input Tax Credit verified for active return"
            />
          </div>

          <div className="lg:col-span-5">
            <BranchContributionPanel
              loading={loading}
              branches={branches}
            />
          </div>
        </section>

        {/* 5. TAX REALISATION & ITC RECONCILIATION CARDS */}
        <section aria-label="Tax Realisation & Reconciliation">
          <TaxBreakdownCards
            loading={loading}
            taxSummary={summary.tax_summary}
            totalSales={summary.total_revenue}
            totalPurchases={summary.total_purchase}
          />
        </section>

        {/* 6. RECENT LEDGER TRANSACTIONS DAYBOOK TABLE */}
        <section aria-label="Recent Transactions">
          <RecentTransactionsTable
            vouchers={vouchersData?.data}
            loading={loading || loadingVouchers}
            totalCount={vouchersData?.total_count || summary.total_vouchers}
            page={voucherPage}
            pageSize={10}
            onPageChange={setVoucherPage}
            entitiesCount={totalEntitiesCount}
            branches={branches}
            selectedBranch={selectedBranch}
            onResetFilter={() => selectBranch(null)}
            onAuditClick={(voucher) => setAuditingVoucher(voucher)}
          />
        </section>

        {/* 7. DASHBOARD FOOTER */}
        <DashboardFooter
          groupName={`${tenantDisplayName} Corporate Group`}
          generatedDate="25 Sep 2026, 11:20 IST"
        />
      </main>

      {/* AUDIT MODAL DIALOG */}
      {auditingVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">Voucher Audit Inspector</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                  {auditingVoucher.refNumber}
                </span>
              </div>
              <button
                onClick={() => setAuditingVoucher(null)}
                className="size-7 rounded-md hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-slate-400 block text-[11px]">Entity / Branch</span>
                  <span className="font-semibold text-slate-800">{auditingVoucher.branch}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Posting Date</span>
                  <span className="font-semibold text-slate-800">{auditingVoucher.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Voucher Type</span>
                  <span className="font-semibold text-slate-800">{auditingVoucher.type}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Party / Ledger</span>
                <div className="font-bold text-sm text-slate-900 mt-0.5">{auditingVoucher.party}</div>
                <div className="text-slate-500">{auditingVoucher.ledger}</div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Voucher Amount:</span>
                <span className="font-mono font-bold text-base text-slate-900">
                  ₹{Number(auditingVoucher.amount).toLocaleString("en-IN")}{" "}
                  <span className="text-xs text-slate-400">{auditingVoucher.entryType}</span>
                </span>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button
                onClick={() => setAuditingVoucher(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from "react";
import {
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";
import { formatIndianCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export function RecentTransactionsTable({
  vouchers = [],
  loading = false,
  totalCount = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  entitiesCount = 5,
  branches = [],
  selectedBranch = null,
  onAuditClick,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [localPage, setLocalPage] = useState(1);

  const currentPage = onPageChange ? page : localPage;

  const handlePageChange = (newPage) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setLocalPage(newPage);
    }
  };

  // Map company_id to branch name
  const branchesMap = useMemo(() => {
    const map = {};
    for (const b of branches) {
      if (b.id) map[String(b.id)] = b.name;
      if (b.company_id) map[String(b.company_id)] = b.name;
    }
    return map;
  }, [branches]);

  // Color palette for branches
  const branchColors = [
    "bg-blue-50 text-blue-700 border-blue-200",
    "bg-purple-50 text-purple-700 border-purple-200",
    "bg-emerald-50 text-emerald-800 border-emerald-200",
    "bg-amber-50 text-amber-800 border-amber-200",
    "bg-slate-100 text-slate-800 border-slate-200",
  ];

  // Normalize API vouchers
  const normalizedTransactions = useMemo(() => {
    if (!Array.isArray(vouchers) || vouchers.length === 0) {
      return [];
    }

    return vouchers.map((v, i) => {
      const type = v.voucher_type || v.vchtype || "Journal";
      const isCr = v.entry_type === "Cr" || String(type).toLowerCase().includes("sale");
      const partyName = v.party_name || v.party_ledger_name || v.ledger_name || "General Ledger";
      const refNo = v.voucher_number || `VCH-${1000 + i}`;
      const amt = Number(v.amount ?? v.gross_amount ?? v.total_amount ?? 0);
      const branchName = v.company_name || branchesMap[String(v.company_id)] || "Branch Entity";

      return {
        id: v._id || `v-${i}`,
        date: v.date
          ? new Date(v.date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "25 Sep 2026",
        branch: branchName,
        branchColor: branchColors[i % branchColors.length],
        type,
        typeColor:
          type.toLowerCase().includes("sale")
            ? "bg-blue-100/70 text-blue-800"
            : type.toLowerCase().includes("purchase")
            ? "bg-purple-100/70 text-purple-800"
            : "bg-slate-100 text-slate-700",
        party: partyName,
        ledger: v.ledger_name || (type.toLowerCase().includes("sale") ? "Sales Account" : type.toLowerCase().includes("purchase") ? "Purchase Account" : "Ledger Entry"),
        refNumber: refNo,
        amount: amt,
        entryType: isCr ? "Cr" : "Dr",
        status: "Reconciled",
        statusVariant: "reconciled",
      };
    });
  }, [vouchers, branchesMap]);

  // Client filtering
  const filteredList = useMemo(() => {
    return normalizedTransactions.filter((tx) => {
      const matchSearch =
        !searchTerm ||
        tx.party.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(tx.refNumber).toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.branch.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType =
        typeFilter === "all" || tx.type.toLowerCase() === typeFilter.toLowerCase();

      return matchSearch && matchType;
    });
  }, [normalizedTransactions, searchTerm, typeFilter]);

  const effectiveTotal = Math.max(totalCount, normalizedTransactions.length);
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));

  // Compute pagination range display (e.g. 1-10, 11-20, 21-23)
  const startIdx = effectiveTotal > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIdx = effectiveTotal > 0 ? Math.min((currentPage - 1) * pageSize + filteredList.length, effectiveTotal) : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              RECENT LEDGER TRANSACTIONS (DAYBOOK FEED)
            </h3>
            {selectedBranch ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10.5px] font-semibold border border-blue-200 shadow-2xs">
                <span className="size-1.5 rounded-full bg-blue-600" />
                Branch: {selectedBranch.name}
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-semibold border border-emerald-200/60">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync • All {entitiesCount} Entities
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedBranch
              ? `Chronological audit stream filtered specifically for ${selectedBranch.name}`
              : "Cross-entity chronological audit stream from connected Tally ERP instances"}
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search bar */}
          <div className="relative">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handlePageChange(1);
              }}
              placeholder="Search party, voucher #..."
              className="h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-56 transition-all"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              handlePageChange(1);
            }}
            className="h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Voucher Types</option>
            <option value="Sale">Sales</option>
            <option value="Purchase">Purchase</option>
            <option value="Journal">Journal</option>
          </select>

          {/* Export Daybook */}
          <button
            type="button"
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="size-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-2.5 px-4">POSTING DATE</th>
              <th className="py-2.5 px-4">BRANCH ENTITY</th>
              <th className="py-2.5 px-4">TYPE</th>
              <th className="py-2.5 px-4">PARTY / ACCOUNT LEDGER</th>
              <th className="py-2.5 px-4">REF NUMBER</th>
              <th className="py-2.5 px-4 text-right">DEBIT / CREDIT (INR)</th>
              <th className="py-2.5 px-4 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <span className="size-2 rounded-full bg-blue-600 animate-ping" />
                    <span>Loading transactions...</span>
                  </div>
                </td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  {selectedBranch
                    ? `No vouchers recorded for ${selectedBranch.name} in this period`
                    : "No vouchers found for this page"}
                </td>
              </tr>
            ) : (
              filteredList.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  {/* Posting Date */}
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                    {tx.date}
                  </td>

                  {/* Branch Entity Pill */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10.5px] font-semibold border",
                        tx.branchColor
                      )}
                    >
                      {tx.branch}
                    </span>
                  </td>

                  {/* Voucher Type */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wider",
                        tx.typeColor
                      )}
                    >
                      {tx.type}
                    </span>
                  </td>

                  {/* Party / Account Ledger */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{tx.party}</div>
                    <div className="text-[10.5px] text-slate-400 font-normal">
                      {tx.ledger}
                    </div>
                  </td>

                  {/* Ref Number */}
                  <td className="py-3 px-4 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                    {tx.refNumber}
                  </td>

                  {/* Debit / Credit Amount */}
                  <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                    <span
                      className={cn(
                        "font-bold",
                        tx.entryType === "Cr"
                          ? "text-emerald-700"
                          : "text-slate-800"
                      )}
                    >
                      {formatIndianCurrency(tx.amount)}{" "}
                      <span className="text-[10px] font-semibold text-slate-400">
                        {tx.entryType}
                      </span>
                    </span>
                  </td>

                  {/* Action Drill-Down */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => onAuditClick?.(tx)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                    >
                      <span>Audit</span>
                      <ExternalLink className="size-2.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Pagination Footer */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-slate-500 font-medium">
          Showing{" "}
          <span className="font-bold text-slate-800">
            {effectiveTotal > 0 ? `${startIdx}-${endIdx}` : 0}
          </span>{" "}
          of{" "}
          <span className="font-bold text-slate-800">
            {effectiveTotal.toLocaleString("en-IN")}
          </span>{" "}
          verified transactions {selectedBranch ? (
            <>for <span className="font-bold text-slate-800">{selectedBranch.name}</span></>
          ) : (
            <>across <span className="font-bold text-slate-800">{entitiesCount} entities</span></>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Previous Button */}
          <button
            disabled={currentPage <= 1 || loading}
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            className="h-7 px-2.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold transition-colors cursor-pointer"
          >
            <ChevronLeft className="size-3" />
            <span>Previous</span>
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
            <button
              key={p}
              disabled={loading}
              onClick={() => handlePageChange(p)}
              className={cn(
                "h-7 w-7 rounded font-bold flex items-center justify-center text-xs transition-colors cursor-pointer",
                p === currentPage
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              {p}
            </button>
          ))}

          {/* Next Button */}
          <button
            disabled={currentPage >= totalPages || loading}
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            className="h-7 px-2.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold transition-colors cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

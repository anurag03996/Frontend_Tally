import { useState, useMemo } from "react";
import { formatCompactINR } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function BranchContributionPanel({
  branches = [],
  loading = false,
}) {
  const [activeTab, setActiveTab] = useState("sales"); // "sales" | "purchases" | "transactions"

  // Compute processed branches based on activeTab
  const processedBranches = useMemo(() => {
    const sourceBranches = Array.isArray(branches) ? branches : [];

    const items = sourceBranches.map((b, idx) => {
      let val = 0;
      if (activeTab === "sales") {
        val = Number(b.revenue ?? b.sales ?? 0);
      } else if (activeTab === "purchases") {
        val = Number(b.purchases ?? b.purchase ?? 0);
      } else {
        val = Number(b.transactions ?? b.vouchers_count ?? 0);
      }

      return {
        ...b,
        currentVal: val,
        rawIndex: idx,
      };
    });

    const total = items.reduce((sum, item) => sum + (item.currentVal || 0), 0);

    return items
      .map((item) => {
        const pct = total > 0 ? (item.currentVal / total) * 100 : 0;
        let formattedVal = "";
        if (activeTab === "transactions") {
          formattedVal = Number(item.currentVal).toLocaleString("en-IN");
        } else {
          formattedVal = formatCompactINR(item.currentVal);
        }

        return {
          ...item,
          pct,
          formattedVal,
        };
      })
      .sort((a, b) => b.currentVal - a.currentVal);
  }, [branches, activeTab]);

  const activeSubtitle = useMemo(() => {
    if (activeTab === "purchases") return "Purchases contribution to consolidated total";
    if (activeTab === "transactions") return "Transaction volume contribution to consolidated total";
    return "Sales contribution to consolidated total";
  }, [activeTab]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between h-full">
        <div>
          {/* Header Skeleton */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3.5 w-60 mt-1.5" />
            </div>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 p-0.5 rounded-lg">
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-7 w-20 rounded-md" />
              <Skeleton className="h-7 w-22 rounded-md" />
            </div>
          </div>

          {/* List Rows Skeleton */}
          <div className="space-y-4 pt-2">
            {[
              { nameW: "w-20", barW: "85%", valW: "w-16" },
              { nameW: "w-24", barW: "62%", valW: "w-16" },
              { nameW: "w-20", barW: "45%", valW: "w-14" },
              { nameW: "w-20", barW: "28%", valW: "w-14" },
            ].map((row, idx) => (
              <div key={idx} className="flex items-center gap-4 py-1">
                <Skeleton className={`h-4 ${row.nameW} shrink-0`} />
                <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden">
                  <Skeleton className="h-full rounded-full" style={{ width: row.barW }} />
                </div>
                <div className="flex items-center justify-end gap-3 shrink-0">
                  <Skeleton className={`h-4 ${row.valW}`} />
                  <Skeleton className="h-4 w-10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between h-full">
      <div>
        {/* Header & Segmented Pill Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Branch Contribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeSubtitle}
            </p>
          </div>

          {/* Segmented Control: [ Sales | Purchases | Transactions ] */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs text-xs font-medium">
            {[
              { id: "sales", label: "Sales" },
              { id: "purchases", label: "Purchases" },
              { id: "transactions", label: "Transactions" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3 py-1 rounded-md transition-all cursor-pointer font-medium",
                  activeTab === tab.id
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Branch Rows List */}
        <div className="space-y-4 pt-1">
          {processedBranches.length === 0 ? (
            <div className="text-xs text-slate-400 py-8 text-center">
              No branch contribution data available
            </div>
          ) : (
            processedBranches.map((branch) => {
              return (
                <div
                  key={branch.id || branch.company_id || branch.name}
                  className="flex items-center gap-3 sm:gap-4 py-1"
                >
                  {/* Branch Name */}
                  <div className="w-24 sm:w-28 shrink-0 font-semibold text-slate-800 text-sm truncate">
                    {branch.name || branch.company_name}
                  </div>

                  {/* Thick Capsule Progress Bar */}
                  <div className="flex-1 bg-slate-100 rounded-full h-3.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.min(Math.max(branch.pct, branch.currentVal > 0 ? 3 : 0), 100)}%`,
                        backgroundColor: branch.color || "#2563EB",
                      }}
                    />
                  </div>

                  {/* Value and Percentage */}
                  <div className="flex items-center justify-end gap-2.5 sm:gap-3 shrink-0 text-right min-w-[110px] sm:min-w-[125px]">
                    <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm">
                      {branch.formattedVal}
                    </span>
                    <span className="text-slate-400 font-normal text-xs sm:text-sm w-11 sm:w-12 text-right">
                      {branch.pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

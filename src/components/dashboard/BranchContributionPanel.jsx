import { X, Filter } from "lucide-react";
import { formatIndianCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export function BranchContributionPanel({
  branches = [],
  selectedBranchId = null,
  onSelectBranch,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between h-full">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              BRANCH CONTRIBUTION &amp; REGIONAL WEIGHT
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click branch to isolate data
            </p>
          </div>

          {selectedBranchId && (
            <button
              onClick={() => onSelectBranch?.(null)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
              title="Reset branch filter"
            >
              <Filter className="size-3" />
              <span>Reset filter</span>
              <X className="size-3 ml-0.5" />
            </button>
          )}
        </div>

        {/* Branch Progress Bars List */}
        <div className="space-y-4 mt-4">
          {branches.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center">
              No branch companies found for this tenant
            </div>
          ) : (
            branches.map((branch) => {
              const isSelected = selectedBranchId === branch.id;
              return (
                <div
                  key={branch.id}
                  onClick={() => onSelectBranch?.(branch.id)}
                  className={cn(
                    "p-2 rounded-lg transition-all cursor-pointer border",
                    isSelected
                      ? "bg-blue-50/70 border-blue-300 shadow-2xs"
                      : "border-transparent hover:bg-slate-50 hover:border-slate-200"
                  )}
                >
                  {/* Branch name + GST code + Revenue + Share */}
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5 truncate pr-2">
                      <span className="font-semibold text-slate-800 truncate">
                        {branch.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-mono text-[10px] font-semibold border border-slate-200 shrink-0">
                        GST: {branch.gstState}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono shrink-0">
                      <span className="font-bold text-slate-900">
                        {formatIndianCurrency(branch.revenue)}
                      </span>
                      <span className="text-slate-400 font-medium text-[11px] w-12 text-right">
                        ({branch.share})
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(Math.max(branch.sharePct, branch.revenue > 0 ? 3 : 0), 100)}%`,
                        backgroundColor: branch.color || "#2563EB",
                      }}
                    />
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

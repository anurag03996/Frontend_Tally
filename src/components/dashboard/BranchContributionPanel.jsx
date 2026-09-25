import { formatIndianCurrency } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

export function BranchContributionPanel({
  branches = [],
  loading = false,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between h-full">
        <div>
          {/* Card Header */}
          <div className="pb-3 border-b border-slate-100">
            <Skeleton className="h-3.5 w-52" />
          </div>

          {/* Branch Progress Bars List Skeleton */}
          <div className="space-y-3.5 mt-4">
            {[85, 35, 22, 12, 6].map((w, idx) => (
              <div key={idx} className="p-2 rounded-lg border border-transparent">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-2 rounded-full" />
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3.5 w-12 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <Skeleton className="h-full rounded-full" style={{ width: `${w}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between h-full">
      <div>
        {/* Card Header */}
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            BRANCH CONTRIBUTION &amp; REGIONAL WEIGHT
          </h3>
        </div>

        {/* Branch Progress Bars List */}
        <div className="space-y-4 mt-4">
          {branches.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center">
              No branch companies found for this tenant
            </div>
          ) : (
            branches.map((branch) => {
              return (
                <div
                  key={branch.id}
                  className="p-2 rounded-lg border border-slate-100/80 bg-slate-50/40"
                >
                  {/* Branch name + GST code + Revenue + Share */}
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5 truncate pr-2">
                      <span className="font-semibold text-slate-800 truncate">
                        {branch.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-semibold border border-slate-200 shrink-0">
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

import { useState, useMemo } from "react";
import { formatCompactINR, formatIndianCurrency } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Default purchase categories matching reference specification
const DEFAULT_PURCHASE_CATEGORIES = [
  { id: "raw_materials", label: "Raw Materials", defaultPct: 48, color: "#2563EB" },
  { id: "services", label: "Services", defaultPct: 26, color: "#0EA5E9" },
  { id: "trading_goods", label: "Trading Goods", defaultPct: 15, color: "#64748B" },
  { id: "capital_items", label: "Capital Items", defaultPct: 7, color: "#334155" },
  { id: "other", label: "Other", defaultPct: 4, color: "#94A3B8" },
];

export function PurchaseMixCard({
  loading = false,
  totalPurchases = 0,
  purchaseMixData = null,
  onCategoryClick,
}) {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  // Calculate processed categories with percentages, amounts, and SVG stroke coordinates
  const processed = useMemo(() => {
    const rawTotal = Number(totalPurchases) || (purchaseMixData?.total ? Number(purchaseMixData.total) : 0);
    const safeTotal = rawTotal > 0 ? rawTotal : 0;

    let items = [];
    if (purchaseMixData?.categories && Array.isArray(purchaseMixData.categories) && purchaseMixData.categories.length > 0) {
      items = purchaseMixData.categories.map((c) => ({
        id: c.id || c.label?.toLowerCase().replace(/\s+/g, "_"),
        label: c.label || "Category",
        pct: Number(c.percentage ?? c.pct ?? 0),
        amount: Number(c.amount ?? (safeTotal * (Number(c.percentage ?? 0) / 100))),
        color: c.color || "#2563EB",
      }));
    } else {
      // Dynamic derivation using default proportions
      items = DEFAULT_PURCHASE_CATEGORIES.map((c) => {
        const amt = safeTotal > 0 ? Math.round(safeTotal * (c.defaultPct / 100)) : 0;
        return {
          id: c.id,
          label: c.label,
          pct: c.defaultPct,
          amount: amt,
          color: c.color,
        };
      });
    }

    // Geometry calculations for SVG Donut (viewBox 0 0 160 160, center 80, 80, radius 54)
    const radius = 54;
    const circumference = 2 * Math.PI * radius; // ~339.292
    const totalUnits = items.reduce((acc, it) => acc + (it.pct || 0), 0) || 100;

    let currentOffset = 0;
    const slices = items.map((item) => {
      const slicePct = item.pct / totalUnits;
      const strokeLength = slicePct * circumference;
      const dashArray = `${strokeLength} ${circumference - strokeLength}`;
      const dashOffset = -currentOffset;

      currentOffset += strokeLength;

      return {
        ...item,
        dashArray,
        dashOffset,
        formattedAmount: formatCompactINR(item.amount),
        fullAmount: formatIndianCurrency(item.amount),
      };
    });

    return {
      total: safeTotal,
      formattedTotal: formatCompactINR(safeTotal),
      slices,
    };
  }, [totalPurchases, purchaseMixData]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between h-full">
        <div>
          {/* Header Skeleton */}
          <div className="pb-3 border-b border-slate-100">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3.5 w-52 mt-1.5" />
          </div>

          {/* Donut and Legend Skeleton */}
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="relative size-36 shrink-0 flex items-center justify-center">
              <Skeleton className="size-36 rounded-full" />
              <div className="absolute size-24 rounded-full bg-white flex flex-col items-center justify-center">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-20 mt-1" />
              </div>
            </div>

            <div className="flex-1 w-full space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-2.5 rounded-full" />
                    <Skeleton className="h-3.5 w-24" />
                  </div>
                  <Skeleton className="h-3.5 w-10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between h-full hover:shadow-xs transition-shadow">
      <div>
        {/* Card Header */}
        <div className="pb-2">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Purchase Mix
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Where purchase spend is going
          </p>
        </div>

        {/* Content: Donut Chart on Left, Breakdown List on Right */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8">
          {/* Donut Visualization */}
          <div className="relative size-38 sm:size-42 shrink-0 flex items-center justify-center select-none">
            <svg
              viewBox="0 0 160 160"
              className="size-full -rotate-90 transform overflow-visible"
            >
              {/* Background Track Circle */}
              <circle
                cx="80"
                cy="80"
                r="54"
                fill="transparent"
                stroke="#F1F5F9"
                strokeWidth="15"
              />

              {/* Connected Slices with Round Edges (reversed so primary segment sits on top) */}
              {[...processed.slices].reverse().map((slice) => {
                const isHovered = hoveredCategory === slice.id;
                return (
                  <circle
                    key={slice.id}
                    cx="80"
                    cy="80"
                    r="54"
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isHovered ? 17 : 14}
                    strokeDasharray={slice.dashArray}
                    strokeDashoffset={slice.dashOffset}
                    strokeLinecap="round"
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredCategory(slice.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => onCategoryClick?.(slice.id)}
                  />
                );
              })}

              {/* Active Hovered Slice on Top */}
              {hoveredCategory && (() => {
                const activeSlice = processed.slices.find((s) => s.id === hoveredCategory);
                if (!activeSlice) return null;
                return (
                  <circle
                    cx="80"
                    cy="80"
                    r="54"
                    fill="transparent"
                    stroke={activeSlice.color}
                    strokeWidth={17}
                    strokeDasharray={activeSlice.dashArray}
                    strokeDashoffset={activeSlice.dashOffset}
                    strokeLinecap="round"
                    className="pointer-events-none transition-all duration-150"
                  />
                );
              })()}
            </svg>

            {/* Centered Donut Metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
              <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-none font-mono">
                {processed.formattedTotal}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-1 leading-tight">
                Total Purchases
              </span>
            </div>
          </div>

          {/* Breakdown Table Rows */}
          <div className="flex-1 w-full space-y-2.5">
            {processed.slices.map((slice) => {
              const isHovered = hoveredCategory === slice.id;
              return (
                <div
                  key={slice.id}
                  className={cn(
                    "flex items-center justify-between gap-3 py-1 px-2 rounded-lg transition-colors cursor-pointer",
                    isHovered ? "bg-slate-50" : "hover:bg-slate-50/60"
                  )}
                  onMouseEnter={() => setHoveredCategory(slice.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onClick={() => onCategoryClick?.(slice.id)}
                  title={`${slice.label}: ${slice.fullAmount} (${slice.pct}%)`}
                >
                  {/* Dot & Label */}
                  <div className="flex items-center gap-2.5 min-w-[120px]">
                    <span
                      className="size-2.5 rounded-full shrink-0 transition-transform duration-150"
                      style={{
                        backgroundColor: slice.color,
                        transform: isHovered ? "scale(1.3)" : "scale(1)",
                      }}
                    />
                    <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                      {slice.label}
                    </span>
                  </div>

                  {/* Percentage */}
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-800">
                      {slice.pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PurchaseMixCard;

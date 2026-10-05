import { useState, useMemo } from "react";
import { formatCompactINR, formatIndianCurrency } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Default aging bucket schema (neutral templates without hardcoded percentages)
const AGING_BUCKET_TEMPLATES = [
  { id: "0-30", label: "0 – 30 days", range: "0-30", color: "#10B981" },
  { id: "31-60", label: "31 – 60 days", range: "31-60", color: "#F59E0B" },
  { id: "61-90", label: "61 – 90 days", range: "61-90", color: "#F97316" },
  { id: "90+", label: "90+ days", range: "90+", color: "#EF4444" },
];

export function ReceivablesAgingCard({
  loading = false,
  totalReceivables = 0,
  agingData = null,
  onBucketClick,
}) {
  const [hoveredBucket, setHoveredBucket] = useState(null);

  // Calculate processed buckets with amounts, percentages, and SVG stroke coordinates
  const processed = useMemo(() => {
    const rawTotal = Number(totalReceivables) || (agingData?.total ? Number(agingData.total) : 0);
    const safeTotal = rawTotal > 0 ? rawTotal : 0;

    let items = [];
    if (agingData?.buckets && Array.isArray(agingData.buckets) && agingData.buckets.length > 0) {
      items = agingData.buckets.map((b) => ({
        id: b.id || b.range || b.label,
        label: b.label || `${b.range} days`,
        range: b.range || b.label,
        pct: safeTotal > 0 ? Number(b.percentage ?? b.pct ?? 0) : 0,
        amount: safeTotal > 0 ? Number(b.amount ?? (safeTotal * (Number(b.percentage ?? 0) / 100))) : 0,
        color: b.color || "#10B981",
      }));
    } else {
      items = AGING_BUCKET_TEMPLATES.map((b) => ({
        id: b.id,
        label: b.label,
        range: b.range,
        pct: 0,
        amount: 0,
        color: b.color,
      }));
    }

    // Geometry calculations for SVG Donut (viewBox 0 0 160 160, center 80, 80, radius 54)
    const radius = 54;
    const circumference = 2 * Math.PI * radius; // ~339.292
    const hasData = safeTotal > 0 && items.some((it) => it.pct > 0 || it.amount > 0);
    const totalUnits = hasData ? items.reduce((acc, it) => acc + (it.pct || 0), 0) || 100 : 0;

    let currentOffset = 0;
    const slices = items.map((item) => {
      const slicePct = totalUnits > 0 ? item.pct / totalUnits : 0;
      const strokeLength = slicePct * circumference;
      const dashArray = `${strokeLength} ${circumference - strokeLength}`;
      const dashOffset = -currentOffset;

      if (totalUnits > 0) {
        currentOffset += strokeLength;
      }

      return {
        ...item,
        dashArray,
        dashOffset,
        strokeLength,
        formattedAmount: formatCompactINR(item.amount),
        fullAmount: formatIndianCurrency(item.amount),
      };
    });

    return {
      total: safeTotal,
      hasData,
      formattedTotal: formatCompactINR(safeTotal),
      slices,
    };
  }, [totalReceivables, agingData]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between h-full">
        <div>
          {/* Header Skeleton */}
          <div className="pb-3 border-b border-slate-100">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-56 mt-1.5" />
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

            <div className="flex-1 w-full space-y-3.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-2.5 rounded-full" />
                    <Skeleton className="h-3.5 w-24" />
                  </div>
                  <Skeleton className="h-3.5 w-10" />
                  <Skeleton className="h-3.5 w-16" />
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
            Receivables Aging
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Outstanding customer balances
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

              {/* Connected Slices with Round Edges (only if hasData, reversed so primary segment sits on top) */}
              {processed.hasData && [...processed.slices].reverse().map((slice) => {
                if (slice.strokeLength <= 0) return null;
                const isHovered = hoveredBucket === slice.id;
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
                    onMouseEnter={() => setHoveredBucket(slice.id)}
                    onMouseLeave={() => setHoveredBucket(null)}
                    onClick={() => onBucketClick?.(slice.id)}
                  />
                );
              })}

              {/* Active Hovered Slice on Top */}
              {processed.hasData && hoveredBucket && (() => {
                const activeSlice = processed.slices.find((s) => s.id === hoveredBucket);
                if (!activeSlice || activeSlice.strokeLength <= 0) return null;
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
                Total Receivables
              </span>
            </div>
          </div>

          {/* Breakdown Table Rows */}
          <div className="flex-1 w-full space-y-3">
            {processed.slices.map((slice) => {
              const isHovered = hoveredBucket === slice.id;
              return (
                <div
                  key={slice.id}
                  className={cn(
                    "flex items-center justify-between gap-2.5 py-1 px-2 rounded-lg transition-colors cursor-pointer",
                    isHovered ? "bg-slate-50" : "hover:bg-slate-50/60"
                  )}
                  onMouseEnter={() => setHoveredBucket(slice.id)}
                  onMouseLeave={() => setHoveredBucket(null)}
                  onClick={() => onBucketClick?.(slice.id)}
                >
                  {/* Dot & Label */}
                  <div className="flex items-center gap-2.5 min-w-[110px]">
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
                  <div className="w-10 text-right">
                    <span className="text-xs text-slate-400 font-normal">
                      {slice.pct}%
                    </span>
                  </div>

                  {/* Absolute Value */}
                  <div className="min-w-[70px] text-right">
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {slice.formattedAmount}
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

export default ReceivablesAgingCard;

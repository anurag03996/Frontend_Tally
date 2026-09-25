import { useState, useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatIndianCurrency } from "@/lib/formatters";

export function SalesPurchasesTrendChart({
  loading = false,
  viewMode = "monthly",
  onViewModeChange,
  periodLabel = "H1 FY 2026-27",
  monthlyTrend = [],
  cashCycleDays = 42,
  itcUtilizedNote = "Input Tax Credit verified for active return",
}) {
  const [internalMode, setInternalMode] = useState(viewMode || "monthly");
  const currentMode = onViewModeChange ? viewMode : internalMode;

  const handleModeChange = (mode) => {
    setInternalMode(mode);
    onViewModeChange?.(mode);
  };

  // Hover state (null = no static tooltip pinned, only displays on mouse hover)
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Normalize base monthly data strictly from API response (zeroed template if empty)
  const baseMonthly = useMemo(() => {
    if (Array.isArray(monthlyTrend) && monthlyTrend.length > 0) {
      return monthlyTrend.map((m) => {
        const salesRaw = Number(m.sales_raw) || (Number(m.sales) || 0) * 100000;
        const purchasesRaw = Number(m.purchases_raw) || (Number(m.purchases) || 0) * 100000;
        return {
          month: m.month,
          sales: Number(m.sales) || (salesRaw / 100000),
          purchases: Number(m.purchases) || (purchasesRaw / 100000),
          sales_raw: salesRaw,
          purchases_raw: purchasesRaw,
          salesLabel: formatIndianCurrency(salesRaw),
          purchasesLabel: formatIndianCurrency(purchasesRaw),
        };
      });
    }

    // Default zeroed months while awaiting API response (no hardcoded figures)
    const defaultMonths = ["Apr 26", "May 26", "Jun 26", "Jul 26", "Aug 26", "Sep 26"];
    return defaultMonths.map((m) => ({
      month: m,
      sales: 0,
      purchases: 0,
      sales_raw: 0,
      purchases_raw: 0,
      salesLabel: "₹0",
      purchasesLabel: "₹0",
    }));
  }, [monthlyTrend]);

  const formatAmount = (valRaw) => {
    return formatIndianCurrency(valRaw);
  };

  // Transform dataPoints based on active viewMode (Monthly, Quarterly, Cumulative)
  const dataPoints = useMemo(() => {
    if (currentMode === "quarterly") {
      // Group by 3 months into financial quarters (Q1 = Apr-Jun, Q2 = Jul-Sep)
      const quarters = [];
      const quarterNames = ["Q1 FY27", "Q2 FY27", "Q3 FY27", "Q4 FY27"];
      const quarterSub = ["Apr – Jun", "Jul – Sep", "Oct – Dec", "Jan – Mar"];

      for (let i = 0; i < baseMonthly.length; i += 3) {
        const chunk = baseMonthly.slice(i, i + 3);
        const qIdx = Math.floor(i / 3);
        const qName = quarterNames[qIdx] || `Q${qIdx + 1}`;
        const sub = quarterSub[qIdx] || "";
        const totSales = chunk.reduce((sum, item) => sum + item.sales, 0);
        const totPurchases = chunk.reduce((sum, item) => sum + item.purchases, 0);
        const totSalesRaw = chunk.reduce((sum, item) => sum + item.sales_raw, 0);
        const totPurchasesRaw = chunk.reduce((sum, item) => sum + item.purchases_raw, 0);

        quarters.push({
          month: qName,
          subLabel: sub,
          sales: Math.round(totSales * 10) / 10,
          purchases: Math.round(totPurchases * 10) / 10,
          sales_raw: totSalesRaw,
          purchases_raw: totPurchasesRaw,
          salesLabel: formatIndianCurrency(totSalesRaw),
          purchasesLabel: formatIndianCurrency(totPurchasesRaw),
        });
      }
      return quarters;
    }

    if (currentMode === "cumulative") {
      let runningSales = 0;
      let runningPurchases = 0;
      let runningSalesRaw = 0;
      let runningPurchasesRaw = 0;
      return baseMonthly.map((m) => {
        runningSales += m.sales;
        runningPurchases += m.purchases;
        runningSalesRaw += m.sales_raw;
        runningPurchasesRaw += m.purchases_raw;
        const s = Math.round(runningSales * 10) / 10;
        const p = Math.round(runningPurchases * 10) / 10;
        return {
          month: m.month,
          subLabel: "YTD Cum.",
          sales: s,
          purchases: p,
          sales_raw: runningSalesRaw,
          purchases_raw: runningPurchasesRaw,
          salesLabel: formatIndianCurrency(runningSalesRaw),
          purchasesLabel: formatIndianCurrency(runningPurchasesRaw),
        };
      });
    }

    // Default: monthly view
    return baseMonthly.map((m) => ({
      ...m,
      subLabel: "",
    }));
  }, [baseMonthly, currentMode]);

  // Dynamic metric label for legend
  const { salesMetricLabel, purchasesMetricLabel } = useMemo(() => {
    if (currentMode === "cumulative") {
      const lastPoint = dataPoints[dataPoints.length - 1];
      return {
        salesMetricLabel: `Total ${lastPoint ? lastPoint.salesLabel : "₹0"}`,
        purchasesMetricLabel: `Total ${lastPoint ? lastPoint.purchasesLabel : "₹0"}`,
      };
    }

    if (currentMode === "quarterly") {
      const active = dataPoints.filter((d) => (d.sales_raw || 0) > 0 || (d.purchases_raw || 0) > 0);
      const count = active.length || 1;
      const totSalesRaw = dataPoints.reduce((s, d) => s + (d.sales_raw || 0), 0);
      const totPurchasesRaw = dataPoints.reduce((s, d) => s + (d.purchases_raw || 0), 0);
      return {
        salesMetricLabel: `Avg ${formatIndianCurrency(totSalesRaw / count)}/Qtr`,
        purchasesMetricLabel: `Avg ${formatIndianCurrency(totPurchasesRaw / count)}/Qtr`,
      };
    }

    // Monthly
    const active = dataPoints.filter((d) => (d.sales_raw || 0) > 0 || (d.purchases_raw || 0) > 0);
    const count = active.length || 1;
    const totSalesRaw = dataPoints.reduce((s, d) => s + (d.sales_raw || 0), 0);
    const totPurchasesRaw = dataPoints.reduce((s, d) => s + (d.purchases_raw || 0), 0);
    return {
      salesMetricLabel: `Avg ${formatIndianCurrency(totSalesRaw / count)}/mo`,
      purchasesMetricLabel: `Avg ${formatIndianCurrency(totPurchasesRaw / count)}/mo`,
    };
  }, [dataPoints, currentMode]);

  // Adaptive scale
  const maxScale = useMemo(() => {
    const maxVal = Math.max(...dataPoints.map((d) => Math.max(d.sales, d.purchases)), 10);
    return Math.ceil(maxVal * 1.25);
  }, [dataPoints]);

  const getY = (val) => {
    const safeMax = maxScale || 1;
    const clamped = Math.max(0, Math.min(val, safeMax));
    return 125 - (clamped / safeMax) * 105;
  };

  const PLOT_LEFT = 30;
  const PLOT_RIGHT = 410;

  const getX = (index) => {
    if (dataPoints.length <= 1) return (PLOT_LEFT + PLOT_RIGHT) / 2;
    if (dataPoints.length === 2) {
      return index === 0 ? 125 : 315;
    }
    return PLOT_LEFT + (index / (dataPoints.length - 1)) * (PLOT_RIGHT - PLOT_LEFT);
  };

  // Construct SVG paths
  const lastIndex = dataPoints.length - 1;
  const salesCoords = dataPoints.map((d, i) => `${getX(i)},${getY(d.sales)}`).join(" ");
  const purchasesCoords = dataPoints.map((d, i) => `${getX(i)},${getY(d.purchases)}`).join(" ");

  const salesAreaPath = `M ${getX(0)},${getY(dataPoints[0].sales)} ${dataPoints.map((d, i) => `L ${getX(i)},${getY(d.sales)}`).join(" ")} L ${getX(lastIndex)},125 L ${getX(0)},125 Z`;
  const purchasesAreaPath = `M ${getX(0)},${getY(dataPoints[0].purchases)} ${dataPoints.map((d, i) => `L ${getX(i)},${getY(d.purchases)}`).join(" ")} L ${getX(lastIndex)},125 L ${getX(0)},125 Z`;

  const yTicks = [
    maxScale,
    Math.round(maxScale * 0.75),
    Math.round(maxScale * 0.5),
    Math.round(maxScale * 0.25),
    0,
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
      {/* Header & Controls */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Sales vs Purchases Trend{" "}
              <span className="text-slate-400 font-normal">
                ({periodLabel}
                {currentMode === "quarterly" ? " • Quarterly" : currentMode === "cumulative" ? " • Cumulative" : ""})
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentMode === "cumulative"
                ? "Cumulative financial turnover & progressive input credit accumulation (INR)"
                : currentMode === "quarterly"
                ? "Quarterly consolidated turnover & cost of goods realization (INR)"
                : "Monthly revenue flow with input purchase credits (INR)"}
            </p>
          </div>

          {/* Toggle buttons: Monthly | Quarterly | Cumulative */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/70 p-0.5 text-xs font-semibold">
            {["monthly", "quarterly", "cumulative"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleModeChange(mode)}
                className={cn(
                  "px-2.5 py-1 rounded-md capitalize transition-all cursor-pointer",
                  currentMode === mode
                    ? "bg-white text-blue-600 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="size-2 rounded-full bg-blue-600 shrink-0" />
            <span>Sales Revenue</span>
            <span className="text-slate-400 font-mono text-[11px]">({salesMetricLabel})</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="size-2 rounded-full bg-slate-500 shrink-0" />
            <span>Purchases (COGS)</span>
            <span className="text-slate-400 font-mono text-[11px]">({purchasesMetricLabel})</span>
          </div>
        </div>

        {/* Chart Canvas with Mouse Leave to clear tooltip */}
        <div
          className="relative mt-4 h-48 w-full select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center z-40 rounded-lg">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="size-2 rounded-full bg-blue-600 animate-ping" />
                <span>Loading chart data...</span>
              </div>
            </div>
          )}

          {/* Y-Axis guide lines & labels */}
          <div className="absolute inset-0 pointer-events-none select-none">
            {yTicks.map((tick, idx) => {
              const yPct = (getY(tick) / 140) * 100;
              return (
                <div
                  key={idx}
                  style={{ top: `${yPct}%` }}
                  className="absolute inset-x-0 flex items-center -translate-y-1/2"
                >
                  <div
                    style={{
                      left: `${(PLOT_LEFT / 500) * 100}%`,
                      width: `${((PLOT_RIGHT - PLOT_LEFT) / 500) * 100}%`,
                    }}
                    className="absolute border-b border-dashed border-slate-100"
                  />
                  <span
                    style={{ left: `${(PLOT_RIGHT / 500) * 100 + 1}%` }}
                    className="absolute font-mono text-[9px] text-slate-400 whitespace-nowrap pl-1"
                  >
                    {formatIndianCurrency(tick * 100000)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Interactive SVG Chart */}
          <svg viewBox="0 0 500 140" preserveAspectRatio="none" className="w-full h-full overflow-visible relative z-10">
            <defs>
              <linearGradient id="sales-area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.01" />
              </linearGradient>
              <linearGradient id="purchases-area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748B" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#64748B" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Gradient Fills */}
            <path d={salesAreaPath} fill="url(#sales-area-grad)" className="transition-all duration-300" />
            <path d={purchasesAreaPath} fill="url(#purchases-area-grad)" className="transition-all duration-300" />

            {/* Purchases Curve */}
            <polyline
              points={purchasesCoords}
              fill="none"
              stroke="#64748B"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />

            {/* Sales Curve */}
            <polyline
              points={salesCoords}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />

            {/* Vertical Guide Line on Hover */}
            {hoveredIndex !== null && dataPoints[hoveredIndex] && (
              <line
                x1={getX(hoveredIndex)}
                y1={15}
                x2={getX(hoveredIndex)}
                y2={125}
                stroke="#3B82F6"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.6"
              />
            )}

            {/* Invisible Vertical Slices for Smooth Hover Tracking */}
            {dataPoints.map((pt, i) => {
              const cx = getX(i);
              const sliceWidth = dataPoints.length > 1
                ? (PLOT_RIGHT - PLOT_LEFT) / (dataPoints.length - 1)
                : 400;
              return (
                <rect
                  key={`slice-${pt.month}-${i}`}
                  x={cx - sliceWidth / 2}
                  y={0}
                  width={sliceWidth}
                  height={140}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                />
              );
            })}

            {/* Interactive Data Dots */}
            {dataPoints.map((pt, i) => {
              const sx = getX(i);
              const sy = getY(pt.sales);
              const py = getY(pt.purchases);
              const isHovered = hoveredIndex === i;

              return (
                <g
                  key={`node-${pt.month}-${i}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                >
                  {/* Purchases Dot */}
                  <circle
                    cx={sx}
                    cy={py}
                    r={isHovered ? "5" : "3.5"}
                    fill="#64748B"
                    stroke="#FFFFFF"
                    strokeWidth={isHovered ? "2" : "1"}
                    className="transition-all duration-150"
                  />

                  {/* Sales Dot */}
                  <circle
                    cx={sx}
                    cy={sy}
                    r={isHovered ? "5.5" : "3.5"}
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth={isHovered ? "2" : "1.5"}
                    className="transition-all duration-150"
                  />

                  {/* Pulsing ring on hover */}
                  {isHovered && (
                    <circle
                      cx={sx}
                      cy={sy}
                      r="9"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="1.5"
                      opacity="0.5"
                      className="animate-ping"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Floating Hover Tooltip (Only visible while user hovers over graph) */}
          {hoveredIndex !== null && dataPoints[hoveredIndex] && (
            <div
              className="absolute z-30 pointer-events-none transition-all duration-100 ease-out transform -translate-x-1/2"
              style={{
                left: `${Math.max(16, Math.min(80, (getX(hoveredIndex) / 500) * 100))}%`,
                top: `${Math.max(6, Math.min(getY(dataPoints[hoveredIndex].sales), getY(dataPoints[hoveredIndex].purchases)) - 65)}px`,
              }}
            >
              <div className="bg-slate-900/95 text-white backdrop-blur-xs rounded-xl shadow-xl border border-slate-700/80 px-3.5 py-2.5 text-xs min-w-[155px] animate-in fade-in zoom-in-95 duration-75">
                <div className="flex items-center justify-between border-b border-slate-700/70 pb-1 mb-2 font-bold text-slate-100">
                  <span>{dataPoints[hoveredIndex].month}</span>
                  <span className="text-[10px] text-slate-400 capitalize font-medium px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700">
                    {dataPoints[hoveredIndex].subLabel || currentMode}
                  </span>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-blue-400 font-sans font-medium">
                      <span className="size-2 rounded-full bg-blue-500 shrink-0" />
                      Sales:
                    </span>
                    <span className="font-bold text-white">
                      {dataPoints[hoveredIndex].salesLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-slate-300 font-sans font-medium">
                      <span className="size-2 rounded-full bg-slate-400 shrink-0" />
                      Purchases:
                    </span>
                    <span className="font-bold text-white">
                      {dataPoints[hoveredIndex].purchasesLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* X-Axis Labels (Pixel-perfect alignment locked directly to data point X coordinates) */}
        <div className="relative mt-2.5 h-8 w-full select-none">
          {dataPoints.map((pt, i) => {
            const xPct = (getX(i) / 500) * 100;
            return (
              <button
                key={`label-${pt.month}-${i}`}
                type="button"
                style={{ left: `${xPct}%` }}
                onMouseEnter={() => setHoveredIndex(i)}
                onClick={() => setHoveredIndex(hoveredIndex === i ? null : i)}
                className={cn(
                  "absolute -translate-x-1/2 text-center cursor-pointer transition-all duration-150 py-0.5 px-2 rounded-md",
                  hoveredIndex === i
                    ? "font-bold text-blue-600 bg-blue-50/70 scale-105"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <div className="text-[11px] font-medium leading-none whitespace-nowrap">{pt.month}</div>
                {pt.subLabel && currentMode !== "monthly" && (
                  <div className="text-[9.5px] text-slate-400 font-normal mt-0.5 whitespace-nowrap">
                    {pt.subLabel}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Callouts */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-medium">
        <div className="text-slate-600">
          Operating cash conversion cycle: <strong className="text-slate-900 font-bold">{cashCycleDays} Days</strong>
        </div>

        <div className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50/70 border border-emerald-200/50 px-2 py-0.5 rounded-full text-[11px] font-semibold">
          <CheckCircle2 className="size-3 text-emerald-600" />
          <span>{itcUtilizedNote}</span>
        </div>
      </div>
    </div>
  );
}

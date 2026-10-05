import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatIndianCurrency, formatCompactINR } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

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

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Hover state (index of currently hovered month)
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Normalize base monthly data strictly from API response (zeroed template if empty)
  const baseMonthly = useMemo(() => {
    if (Array.isArray(monthlyTrend) && monthlyTrend.length > 0) {
      return monthlyTrend.map((m) => {
        const salesRaw = Number(m.sales_raw) || (Number(m.sales) || 0) * 100000;
        const purchasesRaw = Number(m.purchases_raw) || (Number(m.purchases) || 0) * 100000;
        const shortName = m.shortMonth || (m.month ? m.month.split(" ")[0] : "");

        let netRaw = 0;
        if (m.net_raw !== undefined && m.net_raw !== null) {
          netRaw = Number(m.net_raw);
        } else if (salesRaw > 0 || purchasesRaw > 0) {
          netRaw = Math.max(0, salesRaw - purchasesRaw);
        }

        return {
          month: m.month,
          shortMonth: shortName,
          sales_raw: salesRaw,
          purchases_raw: purchasesRaw,
          net_raw: netRaw,
          salesLabel: formatIndianCurrency(salesRaw),
          purchasesLabel: formatIndianCurrency(purchasesRaw),
          netLabel: formatIndianCurrency(netRaw),
        };
      });
    }

    // Dynamic zero baseline generated according to active period (no hardcoded dummy figures)
    const fyMatch = String(periodLabel || "").match(/(\d{4})|(\d{2})-(\d{2})/);
    let startYear = 2026;
    if (fyMatch) {
      if (fyMatch[1]) startYear = parseInt(fyMatch[1], 10);
      else if (fyMatch[2]) startYear = 2000 + parseInt(fyMatch[2], 10);
    }
    const monthNames = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    return monthNames.map((mn, idx) => {
      const yr = idx >= 9 ? startYear + 1 : startYear;
      const monthStr = `${mn} ${String(yr).slice(-2)}`;
      return {
        month: monthStr,
        shortMonth: mn,
        sales_raw: 0,
        purchases_raw: 0,
        net_raw: 0,
        salesLabel: "₹0",
        purchasesLabel: "₹0",
        netLabel: "₹0",
      };
    });
  }, [monthlyTrend, periodLabel]);

  // Transform dataPoints based on active viewMode (Monthly, Quarterly, Cumulative)
  const dataPoints = useMemo(() => {
    if (currentMode === "quarterly") {
      const quarters = [];
      const quarterNames = ["Q1", "Q2", "Q3", "Q4"];
      const fyMatch = String(periodLabel || "").match(/(\d{2})-(\d{2})/);
      const fySuffix = fyMatch ? `FY${fyMatch[2]}` : "FY27";
      const quarterFullNames = [`Q1 ${fySuffix}`, `Q2 ${fySuffix}`, `Q3 ${fySuffix}`, `Q4 ${fySuffix}`];

      for (let i = 0; i < baseMonthly.length; i += 3) {
        const chunk = baseMonthly.slice(i, i + 3);
        const qIdx = Math.floor(i / 3);
        const qName = quarterNames[qIdx] || `Q${qIdx + 1}`;
        const qFullName = quarterFullNames[qIdx] || `Quarter ${qIdx + 1}`;
        const totSalesRaw = chunk.reduce((sum, item) => sum + item.sales_raw, 0);
        const totPurchasesRaw = chunk.reduce((sum, item) => sum + item.purchases_raw, 0);
        const totNetRaw = Math.max(0, totSalesRaw - totPurchasesRaw);

        quarters.push({
          month: qFullName,
          shortMonth: qName,
          sales_raw: totSalesRaw,
          purchases_raw: totPurchasesRaw,
          net_raw: totNetRaw,
          salesLabel: formatIndianCurrency(totSalesRaw),
          purchasesLabel: formatIndianCurrency(totPurchasesRaw),
          netLabel: formatIndianCurrency(totNetRaw),
        });
      }
      return quarters;
    }

    if (currentMode === "cumulative") {
      let runningSalesRaw = 0;
      let runningPurchasesRaw = 0;
      return baseMonthly.map((m) => {
        runningSalesRaw += m.sales_raw;
        runningPurchasesRaw += m.purchases_raw;
        const runningNetRaw = Math.max(0, runningSalesRaw - runningPurchasesRaw);

        return {
          month: `${m.month} (YTD)`,
          shortMonth: m.shortMonth,
          sales_raw: runningSalesRaw,
          purchases_raw: runningPurchasesRaw,
          net_raw: runningNetRaw,
          salesLabel: formatIndianCurrency(runningSalesRaw),
          purchasesLabel: formatIndianCurrency(runningPurchasesRaw),
          netLabel: formatIndianCurrency(runningNetRaw),
        };
      });
    }

    // Default: monthly
    return baseMonthly;
  }, [baseMonthly, currentMode, periodLabel]);

  // Check if all dataPoints have zero activity
  const isAllZero = useMemo(() => {
    return dataPoints.length === 0 || dataPoints.every((d) => d.sales_raw === 0 && d.purchases_raw === 0);
  }, [dataPoints]);

  // Compute nice Y scale and ticks: [maxVal, midVal, 0]
  const yScale = useMemo(() => {
    const maxVal = Math.max(
      ...dataPoints.map((d) => Math.max(d.sales_raw, d.purchases_raw, d.net_raw)),
      0
    );

    if (maxVal <= 0) {
      return {
        niceMax: 100000,
        ticks: [100000, 50000, 0],
      };
    }

    // Calculate magnitude
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
    const normalized = maxVal / magnitude;
    let niceNormalized = 2.0;

    if (normalized <= 1.0) niceNormalized = 1.0;
    else if (normalized <= 1.5) niceNormalized = 1.5;
    else if (normalized <= 2.0) niceNormalized = 2.0;
    else if (normalized <= 3.0) niceNormalized = 3.0;
    else if (normalized <= 5.0) niceNormalized = 5.0;
    else if (normalized <= 8.0) niceNormalized = 8.0;
    else niceNormalized = 10.0;

    const niceMax = niceNormalized * magnitude;
    return {
      niceMax,
      ticks: [niceMax, niceMax / 2, 0],
    };
  }, [dataPoints]);

  // SVG coordinate helpers with clean Y-axis gutters and inset data points
  const PLOT_LEFT = 75;
  const PLOT_RIGHT = 505;
  const PLOT_TOP = 22;
  const PLOT_BOTTOM = 138;

  const getY = (val) => {
    const safeMax = yScale.niceMax || 1;
    const clamped = Math.max(0, Math.min(val, safeMax));
    return PLOT_BOTTOM - (clamped / safeMax) * (PLOT_BOTTOM - PLOT_TOP);
  };

  const getX = (index) => {
    if (dataPoints.length <= 1) return (PLOT_LEFT + PLOT_RIGHT) / 2;
    const inset = 22;
    return (PLOT_LEFT + inset) + (index / (dataPoints.length - 1)) * (PLOT_RIGHT - PLOT_LEFT - 2 * inset);
  };

  // Generate smooth cubic bezier spline curve with overshoot prevention
  const getSplinePath = (pts) => {
    if (!pts || pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;

    let path = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      // If both points are flat on baseline (0 value), draw a clean horizontal line
      if (Math.abs(p1.y - PLOT_BOTTOM) < 0.5 && Math.abs(p2.y - PLOT_BOTTOM) < 0.5) {
        path += ` L ${p2.x.toFixed(1)},${PLOT_BOTTOM}`;
        continue;
      }

      let cp1x = p1.x + (p2.x - p0.x) / 6;
      let cp1y = p1.y + (p2.y - p0.y) / 6;
      let cp2x = p2.x - (p3.x - p1.x) / 6;
      let cp2y = p2.y - (p3.y - p1.y) / 6;

      // Monotonic boundary clamping: strictly clamp control points between PLOT_TOP and PLOT_BOTTOM
      cp1y = Math.max(PLOT_TOP, Math.min(PLOT_BOTTOM, cp1y));
      cp2y = Math.max(PLOT_TOP, Math.min(PLOT_BOTTOM, cp2y));

      path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const salesPoints = useMemo(() => {
    return dataPoints.map((d, i) => ({ x: getX(i), y: getY(d.sales_raw) }));
  }, [dataPoints, yScale.niceMax]);

  const purchasesPoints = useMemo(() => {
    return dataPoints.map((d, i) => ({ x: getX(i), y: getY(d.purchases_raw) }));
  }, [dataPoints, yScale.niceMax]);

  const salesSpline = useMemo(() => getSplinePath(salesPoints), [salesPoints]);
  const purchasesSpline = useMemo(() => getSplinePath(purchasesPoints), [purchasesPoints]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between h-full">
        <div>
          {/* Header Skeleton */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
            <div>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-64 mt-1.5" />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>

          {/* Chart Canvas Skeleton */}
          <div className="relative mt-4 h-48 w-full flex items-end justify-between px-10 pb-4 border-b border-slate-100">
            <div className="absolute inset-x-8 top-6 border-b border-dashed border-slate-100" />
            <div className="absolute inset-x-8 top-24 border-b border-dashed border-slate-100" />
            <div className="absolute inset-x-8 bottom-4 border-b border-dashed border-slate-100" />

            {[45, 65, 80, 55, 90, 75].map((h, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 z-10">
                <Skeleton className="w-6 rounded-t-sm" style={{ height: `${h}%` }} />
                <Skeleton className="h-3 w-8 mt-1" />
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
        {/* Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Sales vs Purchases
              </h3>
              {isAllZero && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                  No records
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAllZero
                ? `No sales or purchase transactions recorded for ${periodLabel}`
                : "Monthly financial activity across selected scope"}
            </p>
          </div>

          {/* Legend and Dropdown Menu */}
          <div className="flex items-center gap-4 sm:gap-5 flex-wrap">
            {/* Legend */}
            <div className="flex items-center gap-3.5 sm:gap-4 text-xs font-medium text-slate-600">
              {/* Sales */}
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 bg-blue-600 rounded-full shrink-0" />
                <span className="text-slate-700 font-semibold text-xs">Sales</span>
              </div>

              {/* Purchases */}
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 border-b-2 border-dashed border-purple-600 shrink-0" />
                <span className="text-slate-700 font-semibold text-xs">Purchases</span>
              </div>

              {/* Net */}
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-2.5 bg-blue-200 rounded-xs shrink-0 border border-blue-400/80" />
                <span className="text-slate-700 font-semibold text-xs">Net</span>
              </div>
            </div>

            {/* Timeframe Dropdown Pill: [ Monthly ⌄ ] */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer transition-all"
              >
                <span className="capitalize">{currentMode}</span>
                <ChevronDown className={cn("size-3.5 text-slate-400 transition-transform duration-200", dropdownOpen && "rotate-180")} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95">
                  {[
                    { id: "monthly", label: "Monthly" },
                    { id: "quarterly", label: "Quarterly" },
                    { id: "cumulative", label: "Cumulative" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        handleModeChange(mode.id);
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-xs capitalize transition-colors cursor-pointer flex items-center justify-between",
                        currentMode === mode.id
                          ? "bg-blue-50 text-blue-600 font-bold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <span>{mode.label}</span>
                      {currentMode === mode.id && <span className="size-1.5 rounded-full bg-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div
          className="relative mt-4 h-52 sm:h-56 w-full select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Main SVG Visualization */}
          <svg viewBox="0 0 540 185" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="netBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#BFDBFE" stopOpacity="0.65" />
              </linearGradient>
            </defs>

            {/* Horizontal Y-Axis Grid Lines & Left Ticks */}
            {yScale.ticks.map((tick, idx) => {
              const y = getY(tick);
              const isZero = tick === 0;
              return (
                <g key={`ytick-${idx}`}>
                  {/* Grid line: solid for zero baseline, dashed for levels */}
                  <line
                    x1={PLOT_LEFT}
                    y1={y}
                    x2={PLOT_RIGHT}
                    y2={y}
                    stroke={isZero ? "#CBD5E1" : "#F1F5F9"}
                    strokeWidth={isZero ? "1.5" : "1.2"}
                    strokeDasharray={isZero ? "none" : "4 3"}
                  />
                  {/* Left Label */}
                  <text
                    x={PLOT_LEFT - 12}
                    y={y + 3.5}
                    textAnchor="end"
                    className="text-[10.5px] font-mono fill-slate-400 font-medium"
                  >
                    {formatCompactINR(tick)}
                  </text>
                </g>
              );
            })}

            {/* Net Vertical Bars (rendered behind curves, only when net volume > 0) */}
            {dataPoints.map((d, i) => {
              if (!d.net_raw || d.net_raw <= 0) return null;
              const x = getX(i);
              const rawY = getY(d.net_raw);
              const barHeight = Math.max(12, PLOT_BOTTOM - rawY);
              const y = PLOT_BOTTOM - barHeight;
              const barWidth = 32;
              const isHovered = hoveredIndex === i;

              return (
                <rect
                  key={`net-bar-${i}`}
                  x={x - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="4"
                  ry="4"
                  fill="url(#netBarGrad)"
                  stroke="#93C5FD"
                  strokeWidth="1.2"
                  strokeOpacity={0.85}
                  fillOpacity={isHovered ? 1 : 0.85}
                  className="transition-all duration-200"
                />
              );
            })}

            {/* Purchases Dashed Purple Curve */}
            <path
              d={purchasesSpline}
              fill="none"
              stroke="#9333EA"
              strokeWidth="2.2"
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />

            {/* Sales Solid Blue Curve */}
            <path
              d={salesSpline}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />

            {/* Interactive Data Nodes */}
            {dataPoints.map((d, i) => {
              const sx = getX(i);
              const sy = getY(d.sales_raw);
              const py = getY(d.purchases_raw);
              const isHovered = hoveredIndex === i;

              return (
                <g key={`nodes-${i}`}>
                  {/* Purchases Dot */}
                  <circle
                    cx={sx}
                    cy={py}
                    r={isHovered ? 5 : 3.5}
                    fill="#9333EA"
                    stroke="#FFFFFF"
                    strokeWidth={isHovered ? 2 : 1}
                    className="transition-all duration-150"
                  />

                  {/* Sales Dot */}
                  <circle
                    cx={sx}
                    cy={sy}
                    r={isHovered ? 5.5 : 4}
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth={isHovered ? 2 : 1.5}
                    className="transition-all duration-150"
                  />
                </g>
              );
            })}

            {/* Vertical Guide Line on Hover */}
            {hoveredIndex !== null && dataPoints[hoveredIndex] && (
              <line
                x1={getX(hoveredIndex)}
                y1={PLOT_TOP}
                x2={getX(hoveredIndex)}
                y2={PLOT_BOTTOM}
                stroke="#3B82F6"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.6"
              />
            )}

            {/* Bottom X-Axis Month Labels */}
            {dataPoints.map((d, i) => {
              const x = getX(i);
              const isHovered = hoveredIndex === i;

              return (
                <text
                  key={`xlabel-${i}`}
                  x={x}
                  y={162}
                  textAnchor="middle"
                  className={cn(
                    "text-[11px] transition-colors duration-150 font-semibold",
                    isHovered ? "fill-blue-600 font-bold" : "fill-slate-500"
                  )}
                >
                  {d.shortMonth}
                </text>
              );
            })}

            {/* Invisible Hover Rect Slices for Seamless Cursor Tracking */}
            {dataPoints.map((d, i) => {
              const cx = getX(i);
              const sliceWidth =
                dataPoints.length > 1
                  ? (PLOT_RIGHT - PLOT_LEFT) / (dataPoints.length - 1)
                  : 400;

              return (
                <rect
                  key={`hover-slice-${i}`}
                  x={cx - sliceWidth / 2}
                  y={PLOT_TOP}
                  width={sliceWidth}
                  height={PLOT_BOTTOM - PLOT_TOP + 35}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                />
              );
            })}
          </svg>

          {/* Floating Hover Tooltip */}
          {hoveredIndex !== null && dataPoints[hoveredIndex] && (
            <div
              className="absolute z-30 pointer-events-none transition-all duration-75 ease-out transform -translate-x-1/2"
              style={{
                left: `${Math.max(12, Math.min(88, (getX(hoveredIndex) / 540) * 100))}%`,
                top: `${Math.max(4, Math.min(getY(dataPoints[hoveredIndex].sales_raw), getY(dataPoints[hoveredIndex].purchases_raw)) - 85)}px`,
              }}
            >
              <div className="bg-slate-900/95 text-white backdrop-blur-xs rounded-xl shadow-xl border border-slate-700/80 px-3.5 py-2.5 text-xs min-w-[160px] animate-in fade-in zoom-in-95 duration-75">
                <div className="flex items-center justify-between border-b border-slate-700/70 pb-1 mb-2 font-bold text-slate-100">
                  <span>{dataPoints[hoveredIndex].month}</span>
                  <span className="text-[10px] text-slate-400 capitalize font-medium px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700">
                    {currentMode}
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
                    <span className="flex items-center gap-1.5 text-purple-400 font-sans font-medium">
                      <span className="size-2 rounded-full bg-purple-500 shrink-0" />
                      Purchases:
                    </span>
                    <span className="font-bold text-white">
                      {dataPoints[hoveredIndex].purchasesLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800">
                    <span className="flex items-center gap-1.5 text-sky-300 font-sans font-medium">
                      <span className="size-2 rounded-xs bg-sky-400 shrink-0" />
                      Net:
                    </span>
                    <span className="font-bold text-white">
                      {dataPoints[hoveredIndex].netLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import {
  TrendingUp,
  ShoppingCart,
  FileCheck,
  ArrowUpRight,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import { formatIndianCurrency, formatNumber } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

export function KpiSummaryGrid({
  loading = false,
  totalSales = 0,
  totalPurchases = 0,
  receivables = 0,
  payables = 0,
  netPosition = { amount: 0, margin: "0.0%" },
  totalVouchers = 0,
  activeEntitiesCount = 4,
  totalEntitiesCount = 5,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col justify-between h-[138px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="size-5.5 rounded-md" />
              </div>

              <div className="mt-2.5">
                <Skeleton className="h-6 w-32" />
              </div>

              <div className="flex items-center justify-between mt-2.5">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-3.5 w-12" />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 mt-2">
              <Skeleton className="h-2.5 w-28" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
      {/* 1. TOTAL SALES */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TOTAL SALES
            </span>
            <div className="size-5.5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="size-3.5" />
            </div>
          </div>

          <div
            className="text-lg sm:text-xl lg:text-[18px] xl:text-[21px] font-extrabold text-slate-900 font-mono tracking-tight mt-1.5 leading-tight truncate"
            title={formatIndianCurrency(totalSales)}
          >
            {formatIndianCurrency(totalSales)}
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600">
              <span>↗</span> {totalSales > 0 ? "Active Revenue" : "0.0%"}
            </span>
            {/* Micro Blue Sparkline */}
            <div className="w-14 h-4">
              <svg viewBox="0 0 60 18" className="w-full h-full overflow-visible">
                <path
                  d={totalSales > 0 ? "M 2 14 Q 15 16, 25 10 T 45 8 T 58 2" : "M 2 16 L 58 16"}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-medium mt-2 pt-2 border-t border-slate-100 truncate">
          Across {activeEntitiesCount} active billing entities
        </div>
      </div>

      {/* 2. TOTAL PURCHASES */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TOTAL PURCHASES
            </span>
            <div className="size-5.5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
              <ShoppingCart className="size-3.5" />
            </div>
          </div>

          <div
            className="text-lg sm:text-xl lg:text-[18px] xl:text-[21px] font-extrabold text-slate-900 font-mono tracking-tight mt-1.5 leading-tight truncate"
            title={formatIndianCurrency(totalPurchases)}
          >
            {formatIndianCurrency(totalPurchases)}
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-600">
              <span>↗</span> {totalPurchases > 0 ? "Input Eligible" : "0.0%"}
            </span>
            {/* Micro Slate Sparkline */}
            <div className="w-14 h-4">
              <svg viewBox="0 0 60 18" className="w-full h-full overflow-visible">
                <path
                  d={totalPurchases > 0 ? "M 2 12 Q 15 15, 30 8 T 45 10 T 58 4" : "M 2 16 L 58 16"}
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-medium mt-2 pt-2 border-t border-slate-100 truncate">
          Cost of goods across entities
        </div>
      </div>

      {/* 3. RECEIVABLES */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              RECEIVABLES
            </span>
            <div className="size-5.5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck className="size-3.5" />
            </div>
          </div>

          <div
            className="text-lg sm:text-xl lg:text-[18px] xl:text-[21px] font-extrabold text-slate-900 font-mono tracking-tight mt-1.5 leading-tight truncate"
            title={formatIndianCurrency(receivables)}
          >
            {formatIndianCurrency(receivables)}
          </div>

          <div className="mt-2">
            <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10.5px] font-semibold border border-emerald-200/60">
              {receivables > 0 ? "Active Book Debtors" : "Zero Overdue"}
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-medium mt-2 pt-2 border-t border-slate-100 truncate">
          {receivables > 0 ? `Debtors across branch ledgers` : `All accounts reconciled`}
        </div>
      </div>

      {/* 4. PAYABLES (TRADE) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              PAYABLES (TRADE)
            </span>
            <div className="size-5.5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowUpRight className="size-3.5" />
            </div>
          </div>

          <div
            className="text-lg sm:text-xl lg:text-[18px] xl:text-[21px] font-extrabold text-slate-900 font-mono tracking-tight mt-1.5 leading-tight truncate"
            title={formatIndianCurrency(payables)}
          >
            {formatIndianCurrency(payables)}
          </div>

          <div className="mt-2">
            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10.5px] font-semibold border border-slate-200">
              {payables === 0 ? "Zero Trade Dues" : "Active Creditors"}
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-medium mt-2 pt-2 border-t border-slate-100 truncate">
          {payables === 0 ? "All supplier dues cleared" : "Across vendor trade books"}
        </div>
      </div>

      {/* 5. NET POSITION */}
      <div className="bg-white rounded-xl border border-blue-200/90 bg-gradient-to-b from-blue-50/20 to-white p-3.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              NET POSITION
            </span>
            <div className="size-5.5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
              <Wallet className="size-3.5" />
            </div>
          </div>

          <div
            className="text-lg sm:text-xl lg:text-[18px] xl:text-[21px] font-extrabold text-blue-600 font-mono tracking-tight mt-1.5 leading-tight truncate"
            title={formatIndianCurrency(netPosition.amount)}
          >
            {formatIndianCurrency(netPosition.amount)}
          </div>

          <div className="mt-2">
            <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10.5px] font-semibold border border-emerald-200/60">
              {netPosition.margin} EBITDA margin
            </span>
          </div>
        </div>

        <div
          className="text-[10px] text-slate-500 font-medium mt-2 pt-2 border-t border-slate-100 truncate"
          title={`Sales (${formatIndianCurrency(totalSales)}) – Purchases (${formatIndianCurrency(totalPurchases)})`}
        >
          Sales ({formatIndianCurrency(totalSales)}) – Purchases ({formatIndianCurrency(totalPurchases)})
        </div>
      </div>

      {/* 6. TOTAL VOUCHERS */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TOTAL VOUCHERS
            </span>
            <div className="size-5.5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="size-3.5" />
            </div>
          </div>

          <div
            className="text-lg sm:text-xl lg:text-[18px] xl:text-[21px] font-extrabold text-slate-900 font-mono tracking-tight mt-1.5 leading-tight truncate"
            title={formatNumber(totalVouchers)}
          >
            {formatNumber(totalVouchers)}
          </div>

          <div className="mt-2">
            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10.5px] font-semibold border border-slate-200">
              Recorded Entries
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-medium mt-2 pt-2 border-t border-slate-100 truncate">
          {totalVouchers > 0
            ? `Verified across ${totalEntitiesCount} entities`
            : "No vouchers recorded"}
        </div>
      </div>
    </div>
  );
}

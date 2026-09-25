import { formatIndianCurrency } from "@/lib/formatters";
import { FileText, Receipt, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function TaxBreakdownCards({
  taxSummary = null,
  totalSales = 0,
  totalPurchases = 0,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-6 rounded-md" />
                  <Skeleton className="h-3.5 w-48" />
                </div>
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100 text-xs mt-2">
                {[1, 2, 3, 4].map((row) => (
                  <div key={row} className="py-2.5 flex items-center justify-between">
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3.5 w-24" />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom net bar */}
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/70 -mx-5 -mb-5 px-5 py-3 rounded-b-xl">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-5 w-36" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  // If backend provided real taxSummary, use it; otherwise compute cleanly from current totals
  const sales = taxSummary?.sales || {
    invoice_count: "Direct Sales",
    gross_sales: Math.round(totalSales * 1.18),
    output_gst: Math.round(totalSales * 0.18),
    discounts: 0,
    credit_notes: 0,
    net_sales: totalSales,
  };

  const purchase = taxSummary?.purchase || {
    voucher_count: "Direct Purchases",
    gross_purchases: Math.round(totalPurchases * 1.18),
    itc_matched: Math.round(totalPurchases * 0.18),
    vendor_rebates: 0,
    blocked_credits: 0,
    net_purchases: totalPurchases,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. SALES REALISATION BREAKDOWN */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="size-3.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                SALES REALISATION BREAKDOWN
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10.5px] font-semibold border border-blue-200/60">
              {sales.invoice_count}
            </span>
          </div>

          {/* Breakdown items */}
          <div className="divide-y divide-slate-100 text-xs mt-2">
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Gross Sales (Taxable Invoice Base)</span>
              <span className="font-mono font-medium text-slate-900">
                {formatIndianCurrency(sales.gross_sales)}
              </span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Output GST Liability (CGST + SGST + IGST)</span>
              <span className="font-mono font-medium text-slate-900">
                {formatIndianCurrency(sales.output_gst)}
              </span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Trade Discounts &amp; Rebates</span>
              <span className="font-mono font-medium text-slate-500">
                {formatIndianCurrency(sales.discounts)}
              </span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Credit Notes (GSTR-1)</span>
              <span className="font-mono font-medium text-slate-500">
                {formatIndianCurrency(sales.credit_notes)}
              </span>
            </div>
          </div>
        </div>

        {/* Highlighted Net Row */}
        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between bg-blue-50/40 -mx-5 -mb-5 px-5 py-3 rounded-b-xl">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
            <span>Net Realised Sales</span>
            <ArrowRight className="size-3 text-slate-400" />
          </div>
          <span className="font-mono font-extrabold text-blue-700 text-base">
            {formatIndianCurrency(sales.net_sales)}
          </span>
        </div>
      </div>

      {/* 2. PURCHASE & ITC RECONCILIATION */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                <Receipt className="size-3.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                PURCHASE &amp; ITC RECONCILIATION
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10.5px] font-semibold border border-slate-200">
              {purchase.voucher_count}
            </span>
          </div>

          {/* Breakdown items */}
          <div className="divide-y divide-slate-100 text-xs mt-2">
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Gross Purchases</span>
              <span className="font-mono font-medium text-slate-900">
                {formatIndianCurrency(purchase.gross_purchases)}
              </span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Input Tax Credit (ITC Matched)</span>
              <span className="font-mono font-medium text-slate-900">
                {formatIndianCurrency(purchase.itc_matched)}
              </span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Vendor Rebates &amp; Debit Notes</span>
              <span className="font-mono font-medium text-slate-500">
                {formatIndianCurrency(purchase.vendor_rebates)}
              </span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Blocked Credits (Sec 17(5))</span>
              <span className="font-mono font-medium text-slate-500">
                {formatIndianCurrency(purchase.blocked_credits)}
              </span>
            </div>
          </div>
        </div>

        {/* Highlighted Net Row */}
        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/70 -mx-5 -mb-5 px-5 py-3 rounded-b-xl">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
            <span>Net Purchases (Cost of Goods)</span>
            <ArrowRight className="size-3 text-slate-400" />
          </div>
          <span className="font-mono font-extrabold text-slate-900 text-base">
            {formatIndianCurrency(purchase.net_purchases)}
          </span>
        </div>
      </div>
    </div>
  );
}

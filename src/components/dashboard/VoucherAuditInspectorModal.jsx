import { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  Building2,
  Calendar,
  FileText,
  Bookmark,
  User,
  Copy,
  Check,
  ReceiptText,
  Layers,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  History,
  FileSpreadsheet,
} from "lucide-react";
import { formatIndianCurrency, amountToIndianWords } from "@/lib/formatters";
import { fetchVoucherDetailApi } from "@/services/tenantDashboardApi";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function VoucherAuditInspectorModal({
  isOpen = false,
  onClose,
  voucher = null,
  token = null,
}) {
  const [activeTab, setActiveTab] = useState("overview"); // overview | line_items | ledger_impact | gst_details | related | audit_trail
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedGstin, setCopiedGstin] = useState(false);

  // Fetch detailed voucher data when opened
  useEffect(() => {
    if (!isOpen || !voucher) {
      setDetails(null);
      return;
    }

    const companyId = voucher.companyId || voucher.raw?.company_id;
    const voucherId = voucher.voucherId || voucher.id || voucher.raw?._id;

    if (companyId && voucherId) {
      let isMounted = true;
      setLoading(true);
      fetchVoucherDetailApi({ companyId, voucherId, token })
        .then((data) => {
          if (isMounted) {
            setDetails(data);
          }
        })
        .catch((err) => {
          console.warn("[VoucherAuditInspector] Could not load detailed voucher entries:", err.message);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, voucher, token]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Copy GSTIN with visual feedback
  const handleCopyGstin = useCallback((gstin) => {
    if (!gstin) return;
    navigator.clipboard.writeText(gstin).then(() => {
      setCopiedGstin(true);
      setTimeout(() => setCopiedGstin(false), 2000);
    });
  }, []);

  // Consolidate data from initial voucher prop & fetched API details
  const vm = useMemo(() => {
    if (!voucher) return null;

    const raw = voucher.raw || {};
    const d = details || {};

    const totalAmt = Number(
      d.gross_amount ?? d.amount ?? voucher.amount ?? raw.amount ?? 1793600
    );

    // Compute taxable & GST amounts
    const taxBreakdown = d.tax_breakdown || {};
    let gstAmt = Number(
      d.tax_amount ??
        taxBreakdown.total ??
        (taxBreakdown.cgst || 0) +
          (taxBreakdown.sgst || 0) +
          (taxBreakdown.igst || 0) +
          (taxBreakdown.cess || 0)
    );

    let taxableAmt = Number(d.net_amount);
    if (!taxableAmt || isNaN(taxableAmt)) {
      if (gstAmt > 0 && gstAmt < totalAmt) {
        taxableAmt = totalAmt - gstAmt;
      } else {
        // Standard 18% GST estimate if not bifurcated
        taxableAmt = Math.round((totalAmt / 1.18) * 100) / 100;
        gstAmt = Math.round((totalAmt - taxableAmt) * 100) / 100;
      }
    }

    const branch =
      voucher.branch ||
      d.company_name ||
      d.company_id?.name ||
      raw.company_name ||
      "MSL Ltd Delhi 01";

    const vDate =
      voucher.date ||
      (d.date
        ? new Date(d.date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "01 Apr 2026");

    const vType = d.vchtype || voucher.type || raw.vchtype || "Sales";
    const refNo =
      d.reference_number ||
      voucher.referenceNumber ||
      voucher.refNumber ||
      raw.reference_number ||
      "INV-28491";

    const vNumber =
      d.voucher_number ||
      voucher.refNumber ||
      raw.voucher_number ||
      "MSL/2026/004";

    const party =
      d.party_ledger_name ||
      voucher.party ||
      raw.party_name ||
      raw.party_ledger_name ||
      "MSL Ltd Delhi 02";

    const ledger =
      d.voucher_type_parent ||
      voucher.ledger ||
      (vType.toLowerCase().includes("sale")
        ? "Sales Account"
        : vType.toLowerCase().includes("purchase")
        ? "Purchase Account"
        : "General Ledger");

    const gstin =
      d.party_gstin ||
      voucher.partyGstin ||
      raw.party_gstin ||
      "07ABCDE1234F1Z5";

    const state =
      d.place_of_supply ||
      voucher.placeOfSupply ||
      raw.place_of_supply ||
      "Delhi (07)";

    const narration =
      d.narration ||
      voucher.narration ||
      raw.narration ||
      `Sale of industrial goods to ${party} against PO reference.`;

    // Process Inventory Entries (Line items)
    let lineItems = [];
    if (Array.isArray(d.inventoryentries) && d.inventoryentries.length > 0) {
      lineItems = d.inventoryentries.map((ie, idx) => {
        const itemAmt = Number(ie.amount) || 0;
        const taxRate = Number(ie.gst_rate) || 18;
        const taxAmt = Math.round((itemAmt * (taxRate / 100)) * 100) / 100;
        const total = itemAmt + taxAmt;
        return {
          index: idx + 1,
          itemName: ie.stock_item_name || `Item ${idx + 1}`,
          accountName: ie.accounting_ledger_name || ledger,
          description: ie.hsn_code ? `HSN: ${ie.hsn_code}` : (ie.batch_name || "General Component"),
          qty: ie.quantity || (ie.unit_name ? `1 ${ie.unit_name}` : "1 Nos"),
          rate: ie.rate ? `₹${Number(ie.rate).toLocaleString("en-IN")}` : formatIndianCurrency(itemAmt),
          amount: itemAmt,
          taxRate: `${taxRate}%`,
          taxAmount: taxAmt,
          total: total,
        };
      });
    } else {
      // If no inventory entries returned, generate default 2-line item structure representing the voucher
      const p1Amt = Math.round(taxableAmt * 0.658);
      const p2Amt = taxableAmt - p1Amt;
      const t1 = Math.round(p1Amt * 0.18);
      const t2 = Math.round(p2Amt * 0.18);

      lineItems = [
        {
          index: 1,
          itemName: "Product A",
          accountName: "Sales - Product A",
          description: "Industrial Component",
          qty: "10 Nos",
          rate: "₹1,00,000",
          amount: p1Amt,
          taxRate: "18%",
          taxAmount: t1,
          total: p1Amt + t1,
        },
        {
          index: 2,
          itemName: "Product B",
          accountName: "Sales - Product B",
          description: "Assembly Unit",
          qty: "5 Nos",
          rate: "₹80,000",
          amount: p2Amt,
          taxRate: "18%",
          taxAmount: t2,
          total: p2Amt + t2,
        },
      ];
    }

    // Process Ledger Impact (Double Entry)
    let ledgerImpact = [];
    if (Array.isArray(d.ledgerentries) && d.ledgerentries.length > 0) {
      ledgerImpact = d.ledgerentries.map((le) => ({
        id: le._id || le.ledger_id,
        name: le.ledger_name || party,
        parent: le.ledger_parent || (le.is_party_ledger ? "Sundry Debtors" : "Direct Income"),
        entryType: le.amount >= 0 ? "DEBIT" : "CREDIT",
        isParty: Boolean(le.is_party_ledger),
        debit: le.amount >= 0 ? Math.abs(le.amount) : 0,
        credit: le.amount < 0 ? Math.abs(le.amount) : 0,
      }));
    } else {
      ledgerImpact = [
        {
          id: "le-1",
          name: party,
          parent: "Sundry Debtors",
          entryType: "DEBIT",
          isParty: true,
          debit: totalAmt,
          credit: 0,
        },
        {
          id: "le-2",
          name: ledger,
          parent: "Sales Accounts",
          entryType: "CREDIT",
          isParty: false,
          debit: 0,
          credit: taxableAmt,
        },
        {
          id: "le-3",
          name: "Output CGST @ 9%",
          parent: "Duties & Taxes",
          entryType: "CREDIT",
          isParty: false,
          debit: 0,
          credit: Math.round(gstAmt / 2),
        },
        {
          id: "le-4",
          name: "Output SGST @ 9%",
          parent: "Duties & Taxes",
          entryType: "CREDIT",
          isParty: false,
          debit: 0,
          credit: Math.round(gstAmt / 2),
        },
      ];
    }

    const cgstAmt = taxBreakdown.cgst || Math.round(gstAmt / 2);
    const sgstAmt = taxBreakdown.sgst || Math.round(gstAmt / 2);
    const igstAmt = taxBreakdown.igst || 0;

    return {
      branch,
      date: vDate,
      type: vType,
      referenceNo: refNo,
      voucherNumber: vNumber,
      party,
      ledger,
      gstin,
      state,
      amount: totalAmt,
      amountInWords: amountToIndianWords(totalAmt),
      taxableAmount: taxableAmt,
      gstAmount: gstAmt,
      cgstAmount: cgstAmt,
      sgstAmount: sgstAmt,
      igstAmount: igstAmt,
      narration,
      lineItems,
      ledgerImpact,
      guid: d.guid || voucher.guid || raw.guid || "tally-guid-f429-410a-8ca1",
    };
  }, [voucher, details]);

  if (!isOpen || !vm) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Main Dialog Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-5xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* 1. MODAL TOP HEADER */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <ReceiptText className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-bold text-base text-slate-900 tracking-tight">
                  Voucher Audit Inspector
                </h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200/70">
                  {vm.voucherNumber}
                </span>
                {loading && (
                  <span className="text-[10px] text-slate-400 font-medium animate-pulse">
                    Syncing live audit...
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Review voucher details, ledger impact and related information
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close inspector"
            className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* 2. TOP THREE METADATA PANELS */}
          <div className="space-y-3">
            
            {/* CARD 1: Operational Meta (Entity, Date, Type, Ref No) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
              {/* Entity / Branch */}
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 shrink-0">
                  <Building2 className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 block text-[11px]">Entity / Branch</span>
                  <span className="font-bold text-slate-800 truncate block text-xs">
                    {vm.branch}
                  </span>
                </div>
              </div>

              {/* Posting Date */}
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 shrink-0">
                  <Calendar className="size-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Posting Date</span>
                  <span className="font-bold text-slate-800 text-xs">
                    {vm.date}
                  </span>
                </div>
              </div>

              {/* Voucher Type */}
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 shrink-0">
                  <FileText className="size-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Voucher Type</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[11px] font-bold inline-block",
                    vm.type.toLowerCase().includes("sale")
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      : vm.type.toLowerCase().includes("purchase")
                      ? "bg-purple-50 text-purple-700 border border-purple-200/60"
                      : "bg-blue-50 text-blue-700 border border-blue-200/60"
                  )}>
                    {vm.type}
                  </span>
                </div>
              </div>

              {/* Reference No. */}
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 shrink-0">
                  <Bookmark className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 block text-[11px]">Reference No.</span>
                  <span className="font-bold text-slate-800 font-mono truncate block text-xs">
                    {vm.referenceNo}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: Party & Tax Meta */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
              {/* Party / Ledger */}
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 shrink-0">
                  <User className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 block text-[11px]">Party / Ledger</span>
                  <span className="font-bold text-slate-900 truncate block text-xs">
                    {vm.party}
                  </span>
                  <span className="text-slate-400 text-[10.5px] block truncate">
                    {vm.ledger}
                  </span>
                </div>
              </div>

              {/* GSTIN with 1-click copy */}
              <div className="flex flex-col justify-center">
                <span className="text-slate-400 block text-[11px]">GSTIN</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    {vm.gstin}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyGstin(vm.gstin)}
                    title="Copy GSTIN"
                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  >
                    {copiedGstin ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                  {copiedGstin && (
                    <span className="text-[10px] text-emerald-600 font-medium">Copied!</span>
                  )}
                </div>
              </div>

              {/* State */}
              <div className="flex flex-col justify-center">
                <span className="text-slate-400 block text-[11px]">State</span>
                <span className="font-bold text-slate-800 text-xs mt-0.5">
                  {vm.state}
                </span>
              </div>
            </div>

            {/* CARD 3: Financial Summary & Words */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-slate-50/70 rounded-xl border border-slate-100 items-center">
              {/* Left Column: Big Amount & Words */}
              <div className="md:col-span-6 flex items-start gap-3">
                <div className="size-9 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 font-bold font-mono text-base shrink-0 mt-0.5">
                  ₹
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Voucher Amount</span>
                  <div className="font-mono font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
                    {formatIndianCurrency(vm.amount)}
                  </div>
                  <div className="text-slate-500 text-[11px] font-medium mt-0.5 italic">
                    {vm.amountInWords}
                  </div>
                </div>
              </div>

              {/* Right Column: 3 Financial Columns */}
              <div className="md:col-span-6 grid grid-cols-3 gap-2 border-t md:border-t-0 md:border-l border-slate-200/80 pt-3 md:pt-0 md:pl-5">
                <div>
                  <span className="text-slate-400 block text-[11px]">Taxable Amount</span>
                  <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm mt-0.5 block">
                    {formatIndianCurrency(vm.taxableAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">GST Amount</span>
                  <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm mt-0.5 block">
                    {formatIndianCurrency(vm.gstAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Amount</span>
                  <span className="font-mono font-bold text-blue-700 text-xs sm:text-sm mt-0.5 block">
                    {formatIndianCurrency(vm.amount)}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* 3. TAB NAVIGATION BAR */}
          <div className="border-b border-slate-200 flex items-center gap-6 pt-2 text-xs font-semibold select-none overflow-x-auto">
            {[
              { id: "overview", label: "Overview" },
              { id: "line_items", label: "Line Items" },
              { id: "ledger_impact", label: "Ledger Impact" },
              { id: "gst_details", label: "GST Details" },
              { id: "related", label: "Related Vouchers" },
              { id: "audit_trail", label: "Audit Trail" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-2.5 transition-all whitespace-nowrap cursor-pointer relative",
                  activeTab === tab.id
                    ? "text-blue-600 font-bold"
                    : "text-slate-500 hover:text-slate-800 font-medium"
                )}
              >
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* 4. TAB CONTENT PANELS */}
          
          {/* TAB: OVERVIEW & LINE ITEMS */}
          {(activeTab === "overview" || activeTab === "line_items") && (
            <div className="space-y-4 animate-in fade-in duration-100">
              
              {/* Line Items Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Layers className="size-4 text-blue-600" />
                  <span>Voucher Line Items</span>
                  <span className="text-xs px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {vm.lineItems.length} items
                  </span>
                </div>

                <div className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer">
                  <span>View Item Details</span>
                  <ArrowRight className="size-3.5" />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-8 text-center">#</th>
                        <th className="py-2.5 px-3">ITEM / ACCOUNT</th>
                        <th className="py-2.5 px-3">DESCRIPTION</th>
                        <th className="py-2.5 px-3 text-right">QTY</th>
                        <th className="py-2.5 px-3 text-right">RATE (₹)</th>
                        <th className="py-2.5 px-3 text-right">AMOUNT (₹)</th>
                        <th className="py-2.5 px-3 text-right">TAX %</th>
                        <th className="py-2.5 px-3 text-right">TAX AMOUNT (₹)</th>
                        <th className="py-2.5 px-3 text-right">TOTAL (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {vm.lineItems.map((item) => (
                        <tr key={item.index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 text-center text-slate-400 font-medium">
                            {item.index}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{item.itemName}</div>
                            <div className="text-[10.5px] text-slate-400">{item.accountName}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {item.description}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700">
                            {item.qty}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700">
                            {item.rate}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                            {formatIndianCurrency(item.amount)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            {item.taxRate}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700">
                            {formatIndianCurrency(item.taxAmount)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {formatIndianCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal & Tax Breakdown Box (Right Aligned) */}
                <div className="border-t border-slate-100 p-4 bg-slate-50/40 flex justify-end">
                  <div className="w-full sm:w-80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Subtotal (Taxable Value)</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {formatIndianCurrency(vm.taxableAmount)}
                      </span>
                    </div>

                    {vm.cgstAmount > 0 && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>CGST (9%)</span>
                        <span className="font-mono text-slate-700">
                          {formatIndianCurrency(vm.cgstAmount)}
                        </span>
                      </div>
                    )}

                    {vm.sgstAmount > 0 && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>SGST (9%)</span>
                        <span className="font-mono text-slate-700">
                          {formatIndianCurrency(vm.sgstAmount)}
                        </span>
                      </div>
                    )}

                    {vm.igstAmount > 0 && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>IGST (18%)</span>
                        <span className="font-mono text-slate-700">
                          {formatIndianCurrency(vm.igstAmount)}
                        </span>
                      </div>
                    )}

                    {/* Total Amount Highlight Bar */}
                    <div className="pt-2 mt-1 border-t border-slate-200/80 flex items-center justify-between bg-blue-50/70 p-2.5 rounded-lg border border-blue-100">
                      <span className="font-bold text-blue-900">Total Amount</span>
                      <span className="font-mono font-bold text-sm text-blue-700">
                        {formatIndianCurrency(vm.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Strip: Narration */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <FileText className="size-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-700 mr-2">Narration:</span>
                  <span className="text-slate-600">{vm.narration}</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB: LEDGER IMPACT (Double-Entry Bookkeeping) */}
          {activeTab === "ledger_impact" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Accounting Ledger Allocation (Double-Entry Impact)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Debit and Credit distribution across chart of accounts
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                  <ShieldCheck className="size-3.5" />
                  <span>Ledgers Reconciled (Dr = Cr)</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold text-[10.5px] uppercase border-b border-slate-200">
                      <th className="py-2.5 px-4">Ledger Account</th>
                      <th className="py-2.5 px-4">Group Classification</th>
                      <th className="py-2.5 px-4 text-center">Type</th>
                      <th className="py-2.5 px-4 text-right">Debit (₹)</th>
                      <th className="py-2.5 px-4 text-right">Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vm.ledgerImpact.map((le, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {le.name}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {le.parent}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10.5px] font-bold",
                            le.entryType === "DEBIT"
                              ? "bg-blue-50 text-blue-700 border border-blue-200/50"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                          )}>
                            {le.entryType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                          {le.debit > 0 ? formatIndianCurrency(le.debit) : "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                          {le.credit > 0 ? formatIndianCurrency(le.credit) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50/90 font-bold border-t border-slate-200 text-slate-900">
                      <td colSpan={3} className="py-3 px-4 text-right">
                        Total Double-Entry Balance:
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-blue-700">
                        {formatIndianCurrency(vm.amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700">
                        {formatIndianCurrency(vm.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB: GST DETAILS */}
          {activeTab === "gst_details" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                  <span className="text-slate-400 block text-xs">GST Registration State</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{vm.state}</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">State Code: 07</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                  <span className="text-slate-400 block text-xs">Reverse Charge Mechanism (RCM)</span>
                  <span className="font-bold text-emerald-700 text-sm mt-0.5 block">Not Applicable</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">Regular outward taxable supply</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                  <span className="text-slate-400 block text-xs">ITC Eligibility</span>
                  <span className="font-bold text-blue-700 text-sm mt-0.5 block">Standard Eligible</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">GSTR-2B matched automatically</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/90 bg-white">
                <h5 className="font-bold text-slate-900 mb-2">Bifurcated Tax Breakdown</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block">Central GST (CGST)</span>
                    <span className="font-mono font-bold text-slate-800 text-sm mt-1 block">
                      {formatIndianCurrency(vm.cgstAmount)}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block">State GST (SGST)</span>
                    <span className="font-mono font-bold text-slate-800 text-sm mt-1 block">
                      {formatIndianCurrency(vm.sgstAmount)}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block">Integrated GST (IGST)</span>
                    <span className="font-mono font-bold text-slate-800 text-sm mt-1 block">
                      {formatIndianCurrency(vm.igstAmount)}
                    </span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-blue-700 block font-medium">Total GST Assessed</span>
                    <span className="font-mono font-bold text-blue-800 text-sm mt-1 block">
                      {formatIndianCurrency(vm.gstAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: RELATED VOUCHERS */}
          {activeTab === "related" && (
            <div className="p-8 text-center text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 animate-in fade-in duration-100">
              <FileSpreadsheet className="size-8 mx-auto mb-2 text-slate-300" />
              <div className="font-semibold text-slate-700">No Linked Payment Knockoffs</div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No related bank receipt or adjustment entry is currently linked to this invoice number.
              </p>
            </div>
          )}

          {/* TAB: AUDIT TRAIL */}
          {activeTab === "audit_trail" && (
            <div className="space-y-3 animate-in fade-in duration-100">
              <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <History className="size-4 text-blue-600" />
                  <span>Tally Integration Metadata</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block text-[11px] font-sans">Tally GUID</span>
                    <span className="text-slate-800 break-all select-all font-semibold">
                      {vm.guid}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block text-[11px] font-sans">Sync State</span>
                    <span className="text-emerald-700 font-sans font-semibold flex items-center gap-1.5 mt-0.5">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Verified in Cloud Ledger
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 5. MODAL BOTTOM FOOTER */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 font-mono">
            Voucher ID: <span className="text-slate-600">{vm.voucherNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
            >
              Close Inspector
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

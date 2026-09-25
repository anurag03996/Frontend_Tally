import { ShieldCheck, Lock, RefreshCw, Award } from "lucide-react";

export function DashboardFooter({
  groupName = "Acme Industries Corporate Group",
  generatedDate = "25 Sep 2026, 10:54 IST",
}) {
  return (
    <footer className="mt-8 border-t border-slate-200/80 bg-white py-6 px-6 rounded-xl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        {/* Left: Corporate Info */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <div className="font-semibold text-slate-700">
            {groupName}
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>
          <div className="text-[11px] text-slate-400">
            Internal Financial Reporting &amp; Multi-Entity Ledger Reconciliation Engine
          </div>
        </div>

        {/* Right: Security, Certifications & Timestamp */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-slate-600 text-[10.5px] font-medium border border-slate-200">
            <ShieldCheck className="size-3 text-emerald-600" />
            <span>SOC 2 Type II Certified</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-slate-600 text-[10.5px] font-medium border border-slate-200">
            <Lock className="size-3 text-blue-600" />
            <span>TLS 1.3 Encrypted</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-slate-600 text-[10.5px] font-medium border border-slate-200">
            <RefreshCw className="size-3 text-purple-600" />
            <span>TallyPrime 4.1 Live Stream</span>
          </span>

          <span className="text-[11px] text-slate-400 pl-1 font-mono">
            {generatedDate}
          </span>
        </div>
      </div>
    </footer>
  );
}

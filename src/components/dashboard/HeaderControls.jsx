import { useState, useRef, useEffect } from "react";
import {
  Building,
  Building2,
  Bell,
  User,
  Calendar,
  ChevronDown,
  Sparkles,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatIndianCurrency } from "@/lib/formatters";

export function HeaderControls({
  tenantName = "Acme Industries",
  tenantId = "ACME-409",
  userName = "Sarah Jenkins",
  userRole = "CFO / Group Controller",
  entitiesCount = 4,
  branches = [],
  selectedBranchId = null,
  onSelectBranch,
  fiscalYear = "FY 2026-27",
  dateRange = { label: "01 Apr 2026 – 25 Sep 2026", quarter: "Q1-Q2" },
  onFiscalYearChange,
  onSwitchTenant,
  onLogout,
  theme,
  toggleTheme,
}) {
  const [fyOpen, setFyOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [branchSearch, setBranchSearch] = useState("");

  const branchDropdownRef = useRef(null);
  const fyDropdownRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target)) {
        setBranchDropdownOpen(false);
      }
      if (fyDropdownRef.current && !fyDropdownRef.current.contains(event.target)) {
        setFyOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedBranch = branches.find((b) => String(b.id) === String(selectedBranchId)) || null;

  const filteredBranches = branches.filter((b) =>
    !branchSearch ||
    b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
    (b.gstState && b.gstState.toLowerCase().includes(branchSearch.toLowerCase()))
  );

  return (
    <header className="w-full bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30 shadow-2xs">
      {/* GLOBAL NAVBAR */}
      <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left: Tenant Branding, Branch Selector & Fiscal Year Filter */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Tenant Selector Branding */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Building2 className="size-4.5" />
            </div>
            <div>
              <div
                onClick={onSwitchTenant}
                className="flex items-center gap-1.5 cursor-pointer group"
                title="Click to switch organization"
              >
                <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                  {tenantName}
                </span>
                <ChevronDown className="size-3.5 text-slate-400 group-hover:text-slate-600" />
              </div>
              <div className="text-[11px] text-slate-400 font-medium leading-tight">
                Enterprise Tenant #{tenantId}
              </div>
            </div>
          </div>

          {/* Vertical Separator */}
          <div className="h-6 w-px bg-slate-200 hidden sm:block shrink-0" />

          {/* Branch / Entity Selector Dropdown */}
          <div className="relative shrink-0" ref={branchDropdownRef}>
            <button
              type="button"
              onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
              className={cn(
                "h-8.5 px-3 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs",
                selectedBranch
                  ? "bg-blue-50/90 border-blue-300 text-blue-900 hover:bg-blue-100/80 hover:border-blue-400"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              )}
              title={selectedBranch ? `Selected: ${selectedBranch.name} (Click to change)` : "Select branch / entity"}
            >
              <Building className={cn("size-3.5 shrink-0", selectedBranch ? "text-blue-600" : "text-slate-500")} />

              <div className="flex items-center gap-1.5 text-left">
                <span className="text-[11px] font-normal text-slate-400 hidden xl:inline">Branch:</span>
                <span className="font-semibold max-w-[120px] sm:max-w-[170px] truncate">
                  {selectedBranch ? selectedBranch.name : "All Branches (Consolidated)"}
                </span>
                {selectedBranch ? (
                  <span className="px-1.5 py-0.2 rounded bg-blue-200/80 text-blue-800 text-[10px] font-mono font-bold shrink-0">
                    GST:{selectedBranch.gstState}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200 shrink-0">
                    {branches.length || entitiesCount}
                  </span>
                )}
              </div>

              <ChevronDown className={cn("size-3 text-slate-400 transition-transform duration-150 shrink-0", branchDropdownOpen && "rotate-180")} />
            </button>

            {/* Dropdown Menu */}
            {branchDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-76 sm:w-84 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                {branches.length > 3 && (
                  <div className="px-3 pb-2 border-b border-slate-100">
                    <input
                      type="text"
                      placeholder="Filter branch name or GST code..."
                      value={branchSearch}
                      onChange={(e) => setBranchSearch(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                )}

                <div className="py-1 max-h-64 overflow-y-auto">
                  {/* Option 1: Consolidated View */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectBranch?.(null);
                      setBranchDropdownOpen(false);
                      setBranchSearch("");
                    }}
                    className={cn(
                      "w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer",
                      !selectedBranchId && "bg-blue-50/60 font-bold text-blue-700"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="size-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Building2 className="size-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 leading-tight">
                          All Branches (Consolidated)
                        </div>
                        <div className="text-[10.5px] text-slate-400 leading-tight mt-0.5">
                          Consolidated ledger aggregation across {branches.length || entitiesCount} active entities
                        </div>
                      </div>
                    </div>
                    {!selectedBranchId && <Check className="size-4 text-blue-600 shrink-0 font-bold" />}
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  {/* Individual Branches List */}
                  {filteredBranches.length === 0 ? (
                    <div className="px-3.5 py-3 text-center text-slate-400 text-xs">
                      No branches match &quot;{branchSearch}&quot;
                    </div>
                  ) : (
                    filteredBranches.map((branch) => {
                      const isSelected = String(selectedBranchId) === String(branch.id);
                      return (
                        <button
                          key={branch.id}
                          type="button"
                          onClick={() => {
                            onSelectBranch?.(branch.id);
                            setBranchDropdownOpen(false);
                            setBranchSearch("");
                          }}
                          className={cn(
                            "w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer",
                            isSelected && "bg-blue-50/60 font-semibold text-blue-800"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="size-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: branch.color || "#2563EB" }}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold truncate leading-tight text-slate-900">
                                  {branch.name}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[9.5px] font-mono font-bold shrink-0">
                                  GST: {branch.gstState}
                                </span>
                              </div>
                              <div className="text-[10.5px] text-slate-400 truncate leading-tight mt-0.5">
                                {branch.revenue > 0 ? (
                                  <>{formatIndianCurrency(branch.revenue)} • {branch.share}</>
                                ) : (
                                  "0 revenue recorded"
                                )}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="size-4 text-blue-600 shrink-0 font-bold" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Vertical Separator */}
          <div className="h-6 w-px bg-slate-200 hidden md:block shrink-0" />

          {/* Fiscal Year Dropdown Filter in Navbar */}
          <div className="relative shrink-0" ref={fyDropdownRef}>
            <button
              type="button"
              onClick={() => setFyOpen(!fyOpen)}
              className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
              title="Select Fiscal Year"
            >
              <Calendar className="size-3.5 text-slate-500 shrink-0" />
              <span>{fiscalYear}</span>
              <ChevronDown className={cn("size-3 text-slate-400 transition-transform duration-150 shrink-0", fyOpen && "rotate-180")} />
            </button>
            {fyOpen && (
              <div className="absolute left-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 text-xs">
                {["FY 2026-27", "FY 2025-26", "FY 2024-25"].map((fy) => (
                  <button
                    key={fy}
                    type="button"
                    onClick={() => {
                      onFiscalYearChange?.(fy);
                      setFyOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3.5 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer",
                      fiscalYear === fy && "text-blue-600 font-semibold bg-blue-50/70"
                    )}
                  >
                    {fy}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Range Pill in Navbar */}
          <div className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hidden lg:flex items-center gap-2 shadow-2xs shrink-0">
            <Calendar className="size-3.5 text-slate-400 shrink-0" />
            <span>{dateRange.label}</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200">
              {dateRange.quarter}
            </span>
          </div>
        </div>

        {/* Right: Notifications & User Profile */}
        <div className="flex items-center gap-3.5 shrink-0" ref={userMenuRef}>
          <button
            type="button"
            className="size-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="size-4" />
            <span className="size-2 rounded-full bg-blue-600 absolute top-1.5 right-1.5 border-2 border-white" />
          </button>

          <div
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 pl-2 border-l border-slate-200 cursor-pointer group"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 leading-tight transition-colors">
                {userName}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {userRole}
              </div>
            </div>
            <div className="size-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold shadow-xs group-hover:ring-2 group-hover:ring-blue-200 transition-all">
              <User className="size-4 text-white" />
            </div>
          </div>

          {/* User Profile Dropdown Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 top-12 w-52 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <div className="font-semibold text-slate-900">{userName}</div>
                <div className="text-[11px] text-slate-400">{userRole}</div>
              </div>
              {onSwitchTenant && (
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onSwitchTenant();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Building2 className="size-3.5 text-slate-500" />
                  <span>Switch Organization</span>
                </button>
              )}
              {toggleTheme && (
                <button
                  type="button"
                  onClick={() => {
                    toggleTheme();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="size-3.5 text-slate-500" />
                  <span>Toggle Theme ({theme || "light"})</span>
                </button>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 border-t border-slate-100 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Sign out</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

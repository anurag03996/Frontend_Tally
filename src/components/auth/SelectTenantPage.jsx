import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Building2, Layers3, LogOut, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SelectTenantPage() {
  const { user, selectTenant, logout } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (tenant) => {
    selectTenant(tenant);
    navigate("/");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const tenants = user?.tenants || [];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      {/* Top Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-badge" aria-hidden="true">
            <Layers3 />
          </div>
          <span className="brand-title">Tally ERP Portal</span>
        </div>

        <div className="header-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
          >
            <LogOut className="mr-1.5 size-3.5" />
            Sign out
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-7 shadow-xs">
            <div className="mb-5">
              <h1 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
                Select Organization
              </h1>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{user?.email}</p>
            </div>

            {tenants.length === 0 ? (
              <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] p-6 text-center text-xs text-[var(--muted-foreground)]">
                No organizations assigned. Please contact your administrator.
              </div>
            ) : (
              <div className="space-y-2">
                {tenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    onClick={() => handleSelect(tenant)}
                    className="flex cursor-pointer items-center justify-between rounded-md border border-[var(--border)] bg-[var(--card)] p-3.5 transition hover:border-[var(--ring)] hover:bg-[var(--muted)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded border border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]">
                        <Building2 className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-[var(--foreground)]">
                          {tenant.name || "Default Company"}
                        </h3>
                        <span className="text-[11px] text-[var(--muted-foreground)] capitalize">
                          {tenant.role || "Member"}
                          {user?.companies?.length > 0 && (
                            <span className="ml-2 rounded-xs bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-[var(--foreground)]">
                              {user.companies.length} {user.companies.length === 1 ? "Company" : "Companies"}
                            </span>
                          )}
                        </span>

                      </div>
                    </div>

                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2.5">
                      <span>Open</span>
                      <ArrowRight className="ml-1 size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

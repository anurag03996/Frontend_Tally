import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function ProtectedRoute({ children, requireTenant = false }) {
  const { isAuthenticated, isLoading, user, activeTenant, selectTenant } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
        {/* Shimmer Header */}
        <header className="h-12 border-b border-[var(--border)] px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="shimmer-box size-7 rounded-sm" />
            <div className="shimmer-box h-4 w-32 rounded-xs" />
          </div>
          <div className="flex items-center gap-2">
            <div className="shimmer-box h-7 w-24 rounded-sm" />
            <div className="shimmer-box size-7 rounded-full" />
          </div>
        </header>

        {/* Shimmer Workspace Body */}
        <div className="p-8 max-w-5xl mx-auto w-full space-y-5 animate-in fade-in duration-300">
          <div className="shimmer-box h-32 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer-box h-44 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireTenant) {
    if (!activeTenant) {
      if (user?.tenants && user.tenants.length === 1) {
        // Auto select if only 1 tenant exists
        selectTenant(user.tenants[0]);
        return children;
      }

      if (user?.tenants && user.tenants.length > 1) {
        return <Navigate to="/select-tenant" replace />;
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-6 text-center text-[var(--foreground)]">
          <div className="max-w-md rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 shadow-xs">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">No Organization Assigned</h2>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Your account ({user?.email}) is not assigned to any organization tenant. Please
              contact your system administrator.
            </p>
          </div>
        </div>
      );
    }
  }

  return children;
}

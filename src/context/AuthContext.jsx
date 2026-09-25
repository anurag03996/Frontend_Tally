import { createContext, useContext, useEffect, useState } from "react";
import { getMeApi, logoutApi, requestOtpApi, verifyOtpApi } from "../services/authApi";

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  TOKEN: "tally_auth_token",
  USER: "tally_auth_user",
  ACTIVE_TENANT: "tally_active_tenant",
  ACTIVE_COMPANY: "tally_active_company",
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS.TOKEN) || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeTenant, setActiveTenant] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TENANT);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeCompany, setActiveCompany] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const logoutLocal = () => {
    setToken(null);
    setUser(null);
    setActiveTenant(null);
    setActiveCompany(null);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TENANT);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_COMPANY);
  };

  // Sync session on mount if token exists
  useEffect(() => {
    let isMounted = true;

    async function syncSession() {
      const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!savedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const freshUser = await getMeApi(savedToken);
        if (isMounted && freshUser) {
          setUser(freshUser);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(freshUser));

          // Ensure active tenant is still valid for this user
          const currentTenant = localStorage.getItem(STORAGE_KEYS.ACTIVE_TENANT);
          const parsedTenant = currentTenant ? JSON.parse(currentTenant) : null;

          if (parsedTenant && freshUser.tenants?.some((t) => t.id === parsedTenant.id)) {
            setActiveTenant(parsedTenant);
          } else if (freshUser.tenants?.length === 1) {
            setActiveTenant(freshUser.tenants[0]);
            localStorage.setItem(STORAGE_KEYS.ACTIVE_TENANT, JSON.stringify(freshUser.tenants[0]));
          } else {
            setActiveTenant(null);
            setActiveCompany(null);
            localStorage.removeItem(STORAGE_KEYS.ACTIVE_TENANT);
            localStorage.removeItem(STORAGE_KEYS.ACTIVE_COMPANY);
          }
        }
      } catch (err) {
        console.warn("Session expired or invalid, logging out:", err);
        if (isMounted) {
          logoutLocal();
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    syncSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const requestOtp = async (email) => {
    return await requestOtpApi(email);
  };

  const verifyOtp = async (email, otp) => {
    const data = await verifyOtpApi(email, otp);
    const { accessToken, user: loggedInUser } = data;

    setToken(accessToken);
    setUser(loggedInUser);
    localStorage.setItem(STORAGE_KEYS.TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(loggedInUser));

    let autoSelectedTenant = null;
    if (loggedInUser?.tenants && loggedInUser.tenants.length === 1) {
      autoSelectedTenant = loggedInUser.tenants[0];
      setActiveTenant(autoSelectedTenant);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TENANT, JSON.stringify(autoSelectedTenant));
    } else {
      setActiveTenant(null);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TENANT);
    }

    setActiveCompany(null);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_COMPANY);

    return {
      user: loggedInUser,
      accessToken,
      autoSelectedTenant,
    };
  };

  const selectTenant = (tenant) => {
    setActiveTenant(tenant);
    setActiveCompany(null);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_COMPANY);

    if (tenant) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TENANT, JSON.stringify(tenant));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TENANT);
    }
  };

  const selectCompany = (company) => {
    setActiveCompany(company);
    if (company) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY, JSON.stringify(company));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_COMPANY);
    }
  };

  const logout = async () => {
    if (token) {
      await logoutApi(token);
    }
    logoutLocal();
  };

  const value = {
    token,
    user,
    activeTenant,
    activeCompany,
    isLoading,
    requestOtp,
    verifyOtp,
    selectTenant,
    selectCompany,
    logout,
    isAuthenticated: Boolean(token && user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

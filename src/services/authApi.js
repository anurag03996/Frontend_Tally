/**
 * Authentication API service for Backend_Tally
 */

const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

const AUTH_BASE = `${BACKEND_URL}/api/v1/auth`;

function getAuthHeader(token) {
  const authToken =
    token || (typeof window !== "undefined" ? localStorage.getItem("tally_auth_token") : null);
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

export async function requestOtpApi(email) {
  const response = await fetch(`${AUTH_BASE}/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to send verification code");
  }
  return data;
}

export async function verifyOtpApi(email, otp) {
  const response = await fetch(`${AUTH_BASE}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Invalid or expired verification code");
  }
  return data.data; // { accessToken, refreshToken, user }
}

export async function getMeApi(token) {
  const response = await fetch(`${AUTH_BASE}/me`, {
    headers: {
      ...getAuthHeader(token),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to authenticate session");
  }
  const data = await response.json();
  return data.data?.user;
}

export async function logoutApi(token) {
  try {
    await fetch(`${AUTH_BASE}/logout`, {
      method: "POST",
      headers: {
        ...getAuthHeader(token),
      },
    });
  } catch (err) {
    console.error("Logout request failed:", err);
  }
}

export async function fetchTenantCompaniesApi(tenantId, token) {
  if (!tenantId) return [];
  const response = await fetch(
    `${BACKEND_URL}/api/v1/company/tenant/${encodeURIComponent(tenantId)}`,
    {
      headers: {
        ...getAuthHeader(token),
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch companies: ${response.statusText}`);
  }
  const result = await response.json();
  // Controller returns ok(res, { count: companies.length, data: companies })
  return result.data?.data || result.data || [];
}


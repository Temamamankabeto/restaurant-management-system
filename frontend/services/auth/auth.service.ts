import api, { clearSession, unwrap } from "@/lib/api";
import type { CustomerRegisterPayload } from "@/lib/auth/auth.schema";

export type AuthUser = {
  id?: number | string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string | null;
  role?: string;
  roles?: string[];
  permissions?: string[];
};

type LoginResponse = {
  token?: string;
  access_token?: string;
  user?: AuthUser;
  roles?: string[];
  permissions?: string[];
  data?: LoginResponse;
};

function normalizeLoginResponse(response: unknown): LoginResponse {
  const value = response as { data?: LoginResponse } | LoginResponse;
  return "data" in value && value.data ? value.data : (value as LoginResponse);
}

export const authService = {
  async login(credentials: { email: string; password: string }) {
    const response = await api.post("/auth/login", credentials);
    return normalizeLoginResponse(unwrap<LoginResponse>(response));
  },

  async registerCustomer(payload: CustomerRegisterPayload) {
    const response = await api.post("/auth/register", payload);
    return normalizeLoginResponse(unwrap<LoginResponse>(response));
  },

  async me() {
    const response = await api.get("/auth/me");
    return unwrap<AuthUser>(response);
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      clearSession();
    }
  },

  saveSession(response: LoginResponse) {
    if (typeof window === "undefined") return;
    const token = response.token ?? response.access_token ?? response.data?.token ?? response.data?.access_token;
    const user = response.user ?? response.data?.user ?? null;
    const roles = response.roles ?? response.data?.roles ?? user?.roles ?? (user?.role ? [user.role] : []);
    const permissions = response.permissions ?? response.data?.permissions ?? user?.permissions ?? [];
    if (token) localStorage.setItem("token", token);
    if (user) localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("roles", JSON.stringify(roles));
    localStorage.setItem("permissions", JSON.stringify(permissions));
  },

  getStoredUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  },

  getStoredRoles(): string[] {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("roles") || "[]"); } catch { return []; }
  },

  getStoredPermissions(): string[] {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("permissions") || "[]"); } catch { return []; }
  },
};

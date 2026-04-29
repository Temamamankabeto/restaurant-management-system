import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = "/api";
const TOKEN_KEY = "token";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getToken() {
  return isBrowser() ? localStorage.getItem(TOKEN_KEY) : null;
}

export function clearSession() {
  if (!isBrowser()) return;

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("roles");
  localStorage.removeItem("permissions");

  document.cookie = "token=; Path=/; Max-Age=0; SameSite=Lax";
  document.cookie = "roles=; Path=/; Max-Age=0; SameSite=Lax";
  document.cookie = "permissions=; Path=/; Max-Age=0; SameSite=Lax";
  document.cookie = "user=; Path=/; Max-Age=0; SameSite=Lax";
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 15000),
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();

  const headers =
    config.headers instanceof AxiosHeaders
      ? config.headers
      : new AxiosHeaders(config.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  config.headers = headers;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const data = error.response?.data;

    const message =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(", ") : null) ||
      error.message ||
      "Request failed";

    if (error.response?.status === 401) {
      clearSession();

      if (isBrowser() && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;

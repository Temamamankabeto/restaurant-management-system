import api from "./axios";

export function unwrap<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

export * from "./axios";
export default api;

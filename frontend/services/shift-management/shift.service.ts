import api, { unwrap } from "@/lib/api";
import type {
  ApiEnvelope,
  CashShift,
  CloseShiftPayload,
  OpenShiftPayload,
  PaginatedResponse,
  ShiftFilters,
  ShiftReport,
} from "@/types/shift-management/shift.type";

function cleanFilters(filters: ShiftFilters = {}) {
  const params: Record<string, unknown> = { ...filters };

  if (!params.search) delete params.search;
  if (!params.status || params.status === "all") delete params.status;

  return params;
}

export const shiftService = {
  current: async () => {
    const res = await api.get("/cashier/shifts/current");
    return unwrap<ApiEnvelope<CashShift | null>>(res);
  },

  open: async (payload: OpenShiftPayload) => {
    const res = await api.post("/cashier/shifts/open", payload);
    return unwrap<ApiEnvelope<CashShift>>(res);
  },

  close: async (payload: CloseShiftPayload) => {
    const res = await api.post("/cashier/shifts/close", payload);
    return unwrap<ApiEnvelope<CashShift>>(res);
  },

  list: async (filters: ShiftFilters = {}) => {
    const res = await api.get("/cashier/shifts", {
      params: cleanFilters(filters),
    });

    return unwrap<PaginatedResponse<CashShift>>(res);
  },

  detail: async (id: number | string) => {
    const res = await api.get(`/cashier/shifts/${id}`);
    return unwrap<ApiEnvelope<CashShift>>(res);
  },

  xReport: async () => {
    const res = await api.get("/cashier/reports/x-report");
    return unwrap<ApiEnvelope<ShiftReport>>(res);
  },

  zReport: async (id: number | string) => {
    const res = await api.get(`/cashier/reports/z-report/${id}`);
    return unwrap<ApiEnvelope<ShiftReport>>(res);
  },
};

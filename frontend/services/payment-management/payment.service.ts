import api, { unwrap } from "@/lib/api";
import type { ApiEnvelope, CreatePaymentPayload, Payment, PaymentFilters } from "@/types/payment-management/payment.type";

function clean(filters: PaymentFilters = {}) {
  const params: Record<string, unknown> = { ...filters };

  if (!params.search) delete params.search;
  if (!params.method || params.method === "all") delete params.method;
  if (!params.status || params.status === "all") delete params.status;

  return params;
}

export const paymentService = {
  list: async (filters: PaymentFilters = {}) => {
    const res = await api.get("/payments", { params: clean(filters) });
    return unwrap<{ data: Payment[] }>(res);
  },

  show: async (id: number | string) => {
    const res = await api.get(`/payments/${id}`);
    return unwrap<ApiEnvelope<Payment>>(res);
  },

  create: async (billId: number | string, payload: CreatePaymentPayload) => {
    const res = await api.post(`/bills/${billId}/payments`, payload);
    return unwrap<ApiEnvelope<Payment>>(res);
  },

  refund: async (id: number | string) => {
    const res = await api.post(`/payments/${id}/refund`);
    return unwrap<ApiEnvelope<Payment>>(res);
  },

  receipt: async (id: number | string) => {
    const res = await api.get(`/payments/${id}/receipt`);
    return unwrap<ApiEnvelope<string>>(res);
  },
};

export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data: T;
};

export type PaymentMethod = "cash" | "card" | "mobile" | "transfer";

export type PaymentStatus = "submitted" | "paid" | "failed" | "refunded" | "returned";

export type Payment = {
  id: number | string;
  bill_id: number | string;
  method: PaymentMethod;
  amount: number | string;
  status: PaymentStatus;
  created_at?: string;
};

export type PaymentFilters = {
  search?: string;
  method?: PaymentMethod | "all";
  status?: PaymentStatus | "all";
  page?: number;
  per_page?: number;
};

export type CreatePaymentPayload = {
  method: PaymentMethod;
  amount: number;
  reference?: string;
};

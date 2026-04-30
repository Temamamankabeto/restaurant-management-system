export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data: T;
};

export type PaginationMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type PaginatedResponse<T> = {
  success?: boolean;
  message?: string;
  data: T[];
  meta: PaginationMeta;
};

export type ShiftStatus = "open" | "closed";

export type ShiftFilters = {
  search?: string;
  status?: ShiftStatus | "all";
  cashier_id?: number | string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
};

export type CashShift = {
  id: number | string;
  cashier_id?: number | string;
  cashier_name?: string;
  status: ShiftStatus;
  opening_cash: number | string;
  closing_cash?: number | string | null;
  expected_cash?: number | string | null;
  variance?: number | string | null;
  opened_at?: string;
  closed_at?: string | null;
  notes?: string | null;
};

export type OpenShiftPayload = {
  opening_cash: number;
  notes?: string;
};

export type CloseShiftPayload = {
  closing_cash: number;
  notes?: string;
};

export type ShiftReport = {
  shift?: CashShift;
  opening_cash?: number | string;
  cash_sales?: number | string;
  non_cash_sales?: number | string;
  expected_cash?: number | string;
  closing_cash?: number | string;
  variance?: number | string;
  payments_count?: number;
  total_sales?: number | string;
  [key: string]: unknown;
};

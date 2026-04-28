export type TableStatus = "available" | "occupied" | "reserved" | "cleaning";
export type TableOperationalStatus =
  | "inactive"
  | "available"
  | "reserved"
  | "occupied"
  | "pending_order"
  | "order_in_progress"
  | "awaiting_bill"
  | "awaiting_payment"
  | "cleaning";

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
  summary?: TableSummary;
};

export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data: T;
};

export type TableWaiter = {
  id: number | string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type DiningTable = {
  id: number | string;
  table_number: string;
  name?: string | null;
  capacity: number;
  section?: string | null;
  status: TableStatus;
  operational_status?: TableOperationalStatus | string;
  assigned_waiter_id?: number | string | null;
  assigned_waiter?: TableWaiter | null;
  waiters?: TableWaiter[];
  is_active: boolean | number;
  is_public?: boolean | number;
  sort_order?: number | null;
  active_orders_count?: number;
  active_order?: unknown;
  bill?: unknown;
  created_at?: string;
  updated_at?: string;
};

export type TableListParams = {
  search?: string;
  section?: string;
  status?: TableStatus | "all";
  is_active?: "all" | 0 | 1 | boolean;
  is_public?: "all" | 0 | 1 | boolean;
  waiter_id?: number | string;
  page?: number;
  per_page?: number;
};

export type TablePayload = {
  table_number: string;
  name?: string | null;
  capacity: number;
  section?: string | null;
  status?: TableStatus;
  is_active?: boolean;
  is_public?: boolean;
  sort_order?: number | null;
  waiter_ids?: Array<number | string>;
};

export type AssignWaitersPayload = {
  waiter_ids: Array<number | string>;
};

export type BulkAssignTablesPayload = {
  waiter_id: number | string;
  table_ids: Array<number | string>;
  remove_table_ids?: Array<number | string>;
};

export type TransferWaitersPayload = {
  to_waiter_ids: Array<number | string>;
};

export type TransferOrdersPayload = {
  to_table_id: number | string;
  move_waiters?: boolean;
};

export type UpdateTableStatusPayload = {
  status: TableStatus;
};

export type TableSummary = Partial<Record<TableStatus | TableOperationalStatus | string, number>> & {
  total?: number;
  active?: number;
  inactive?: number;
};

export type TableHistoryRow = {
  id: number | string;
  action?: string;
  note?: string | null;
  actor?: TableWaiter | null;
  created_at?: string;
};

export type PaginationMeta = { current_page: number; per_page: number; total: number; last_page: number };
export type PaginatedResponse<T> = { success?: boolean; message?: string; data: T[]; meta: PaginationMeta };
export type ApiEnvelope<T> = { success?: boolean; message?: string; data: T };

export type PaymentType = 'cash' | 'card' | 'mobile' | 'transfer' | 'credit';
export type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'ready' | 'served' | 'completed' | 'cancel_requested' | 'cancelled';
export type CreditStatus = 'credit_pending' | 'credit_approved' | 'partially_settled' | 'fully_settled' | 'overdue' | 'blocked';
export type PackageOrderStatus = 'draft' | 'quoted' | 'approved' | 'scheduled' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';

export type OrderItemPayload = { menu_item_id: string | number; quantity: number; notes?: string };
export type OrderPayload = {
  table_id?: string | number | null;
  customer_id?: string | number | null;
  customer_name?: string;
  customer_phone?: string;
  order_type?: 'dine_in' | 'takeaway' | 'delivery';
  payment_type?: PaymentType | 'regular';
  waiter_id?: string | number | null;
  credit_account_id?: string | number | null;
  credit_account_user_id?: string | number | null;
  credit_notes?: string;
  notes?: string;
  items: OrderItemPayload[];
};

export type OrderItem = {
  id: string | number;
  menu_item_id?: string | number;
  menu_item?: { id: string | number; name: string; type?: string; price?: number | string } | null;
  name?: string;
  quantity: number;
  unit_price?: number | string;
  total_price?: number | string;
  item_status?: string;
  notes?: string | null;
};

export type Order = {
  id: string | number;
  order_number?: string;
  table_id?: string | number | null;
  table?: { id: string | number; table_number?: string; name?: string } | null;
  waiter?: { id: string | number; name?: string } | null;
  customer?: { id: string | number; name?: string; phone?: string } | null;
  customer_name?: string | null;
  status: OrderStatus | string;
  order_type?: 'dine_in' | 'takeaway' | 'delivery' | string;
  payment_type?: PaymentType | string;
  credit_status?: CreditStatus | string | null;
  subtotal?: number | string;
  tax?: number | string;
  service_charge?: number | string;
  discount?: number | string;
  total?: number | string;
  total_amount?: number | string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
  order_items?: OrderItem[];
  bill?: { id: string | number; status?: string; total?: number | string; balance_amount?: number | string } | null;
};

export type OrderFilters = { search?: string; status?: string; payment_type?: string; payment_status?: string; order_type?: string; period?: string; date_from?: string; date_to?: string; credit_account_id?: string | number; page?: number; per_page?: number; active?: boolean | number };

export type LiteUser = { id: string | number; name?: string; email?: string; role?: string };

export type CreditAccountUser = {
  id: string | number;
  credit_account_id?: string | number;
  full_name: string;
  phone?: string | null;
  employee_id?: string | null;
  position?: string | null;
  id_number?: string | null;
  daily_limit?: number | string | null;
  monthly_limit?: number | string | null;
  is_active?: boolean | number;
  created_at?: string;
};
export type CreditAccountUserPayload = { full_name: string; phone?: string; employee_id?: string; position?: string; id_number?: string; daily_limit?: number | null; monthly_limit?: number | null; is_active?: boolean };

export type CreditAccount = {
  id: string | number;
  name: string;
  account_type?: string;
  customer_id?: string | number | null;
  organization_id?: string | number | null;
  credit_limit?: number | string;
  current_balance?: number | string;
  remaining_limit?: number | string;
  is_credit_enabled?: boolean | number;
  requires_approval?: boolean | number;
  settlement_cycle?: string;
  status?: string;
  created_at?: string;
  authorized_users?: CreditAccountUser[];
  authorizedUsers?: CreditAccountUser[];
};
export type CreditAccountPayload = { name: string; account_type?: string; customer_id?: string | number | null; organization_id?: string | number | null; credit_limit: number; is_credit_enabled?: boolean; requires_approval?: boolean; settlement_cycle?: string; status?: string };
export type CreditOrder = {
  id: string | number;
  credit_reference?: string;
  order?: Order | null;
  order_id?: string | number;
  credit_account?: CreditAccount | null;
  account?: CreditAccount | null;
  credit_account_user?: CreditAccountUser | null;
  authorized_user?: CreditAccountUser | null;
  credit_account_user_id?: string | number | null;
  used_by_name?: string | null;
  used_by_phone?: string | null;
  total_amount?: number | string;
  paid_amount?: number | string;
  remaining_amount?: number | string;
  status?: CreditStatus | string;
  due_date?: string | null;
  created_at?: string;
};
export type CreditSettlementPayload = { amount: number; payment_method: Exclude<PaymentType, 'credit'>; reference_number?: string; notes?: string };

export type PackageTemplate = { id: string | number; name: string; description?: string | null; price_per_person?: number | string; minimum_people?: number | string; is_active?: boolean | number; items?: PackageItem[] };
export type PackageItem = { id?: string | number; package_id?: string | number; menu_item_id: string | number; menu_item?: { name?: string; price?: number | string } | null; quantity_per_person: number };
export type PackagePayload = { name: string; description?: string; price_per_person: number; minimum_people?: number; is_active?: boolean; items?: PackageItem[] };
export type PackageOrderPayload = {
  package_id?: string | number | null;
  customer_id?: string | number | null;
  organization_id?: string | number | null;
  event_name: string;
  event_type?: string;
  guest_count: number;
  event_date: string;
  event_time?: string;
  delivery_location?: string;
  payment_type?: PaymentType | 'regular';
  waiter_id?: string | number | null;
  credit_account_id?: string | number | null;
  credit_account_user_id?: string | number | null;
  credit_notes?: string;
  notes?: string;
};
export type PackageOrder = {
  id: string | number;
  package_id?: string | number | null;
  package?: PackageTemplate | null;
  event_name: string;
  event_type?: string | null;
  guest_count: number;
  event_date?: string;
  event_time?: string;
  delivery_location?: string | null;
  status?: PackageOrderStatus | string;
  payment_type?: PaymentType | string;
  credit_status?: CreditStatus | string | null;
  subtotal?: number | string;
  tax?: number | string;
  service_charge?: number | string;
  total?: number | string;
  notes?: string | null;
  created_at?: string;
  items?: Array<{ id?: string | number; menu_item?: { name?: string }; quantity?: number; unit_price?: number | string; total_price?: number | string }>;
};
export type PackageOrderSchedulePayload = { prep_start_time?: string; ready_time?: string; delivery_time?: string; assigned_team?: string; status?: string };

export type TicketScope = 'kitchen' | 'bar';
export type TicketStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'rejected' | 'delayed';
export type PrepTicket = {
  id: string | number;
  ticket_number?: string;
  status?: TicketStatus | string;
  priority?: string;
  created_at?: string;
  updated_at?: string;
  order?: Order | null;
  order_item?: OrderItem | null;
  menu_item?: { id?: string | number; name?: string; type?: string; image_url?: string; image_path?: string; price?: number | string } | null;
  waiter?: { id?: string | number; name?: string } | null;
  table?: { id?: string | number; table_number?: string; name?: string } | null;
  notes?: string | null;
};
export type PaymentPayload = { amount: number; payment_method: Exclude<PaymentType, 'credit'>; reference_number?: string; notes?: string };
export type ConvertCreditPayload = { credit_account_id: string | number; credit_account_user_id?: string | number | null; notes?: string };

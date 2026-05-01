import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { orderService } from "@/services/order-management";
import type {
  OrderPayload,
  PaymentPayload,
  ConvertCreditPayload,
  CreditSettlementPayload,
  CreditAccountPayload,
  PackagePayload,
  PackageOrderPayload,
  PackageOrderSchedulePayload,
} from "@/types/order-management";

type OrderScope = "waiter" | "cashier" | "public" | "admin";

type PackageOrderAction =
  | "approve"
  | "start-preparation"
  | "mark-ready"
  | "deliver"
  | "complete"
  | "cancel";

export function useCreateOrderMutation(scope: OrderScope = "waiter", onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrderPayload) => orderService.createOrder(payload, scope),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.root() });
      onSuccess?.();
    },
  });
}

export function useConfirmOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => orderService.confirmOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.orders.root() }),
  });
}

export function useServeOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => orderService.serveOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.orders.root() }),
  });
}

export function useRequestCancelOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string | number; reason?: string }) =>
      orderService.requestCancel(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.orders.root() }),
  });
}

export function useRecordBillPaymentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ billId, payload }: { billId: string | number; payload: PaymentPayload }) =>
      orderService.recordBillPayment(billId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.billing.root() }),
  });
}

export function useConvertBillToCreditMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ billId, payload }: { billId: string | number; payload: ConvertCreditPayload }) =>
      orderService.convertBillToCredit(billId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.credit.root() }),
  });
}

export function useApproveCreditOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => orderService.approveCreditOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.credit.orders({}) }),
  });
}

export function useSettleCreditOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: CreditSettlementPayload }) =>
      orderService.settleCreditOrder(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.credit.orders({}) }),
  });
}

export function useCreateCreditAccountMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreditAccountPayload) => orderService.createCreditAccount(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.credit.accounts({}) });
      onSuccess?.();
    },
  });
}

export function useUpdateCreditAccountMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: CreditAccountPayload }) =>
      orderService.updateCreditAccount(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.credit.accounts({}) }),
  });
}

export function useToggleCreditAccountMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => orderService.toggleCreditAccount(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.credit.accounts({}) }),
  });
}

export function usePrepTicketActionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, id, action }: { kind: "kitchen" | "bar"; id: string | number; action: "accept" | "ready" | "served" | "reject" | "delay" }) =>
      orderService.prepTicketAction(kind, id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.prepTickets.root() }),
  });
}

export function useCreatePackageMutation(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PackagePayload) => orderService.createPackage(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.catering.packages({}) });
      onSuccess?.();
    },
  });
}

export function useDeletePackageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => orderService.deletePackage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.catering.packages({}) }),
  });
}

export function useCreatePackageOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PackageOrderPayload) => orderService.createPackageOrder(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.catering.orders({}) }),
  });
}

export function useSchedulePackageOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: PackageOrderSchedulePayload }) =>
      orderService.schedulePackageOrder(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.catering.orders({}) }),
  });
}

export function usePackageOrderActionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string | number; action: PackageOrderAction }) =>
      orderService.packageOrderAction(id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.catering.orders({}) }),
  });
}

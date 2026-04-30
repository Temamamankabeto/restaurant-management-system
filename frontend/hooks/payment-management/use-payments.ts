"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { paymentService } from "@/services/payment-management/payment.service";
import type { CreatePaymentPayload, PaymentFilters } from "@/types/payment-management/payment.type";

export function usePaymentsQuery(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.billing.payments(filters),
    queryFn: () => paymentService.list(filters),
  });
}

export function usePaymentQuery(id?: number | string) {
  return useQuery({
    queryKey: queryKeys.billing.bill(id ?? ""),
    queryFn: () => paymentService.show(id as number | string),
    enabled: Boolean(id),
  });
}

export function useCreatePaymentMutation(onSuccess?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ billId, payload }: { billId: number | string; payload: CreatePaymentPayload }) =>
      paymentService.create(billId, payload),
    onSuccess: () => {
      toast.success("Payment recorded");
      qc.invalidateQueries({ queryKey: queryKeys.billing.root() });
      onSuccess?.();
    },
  });
}

export function useRefundPaymentMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => paymentService.refund(id),
    onSuccess: () => {
      toast.success("Payment refunded");
      qc.invalidateQueries({ queryKey: queryKeys.billing.root() });
    },
  });
}

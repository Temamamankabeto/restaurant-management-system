"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { shiftService } from "@/services/shift-management/shift.service";
import type { CloseShiftPayload, OpenShiftPayload, ShiftFilters } from "@/types/shift-management/shift.type";

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useCurrentShiftQuery() {
  return useQuery({
    queryKey: queryKeys.shifts.current(),
    queryFn: () => shiftService.current(),
  });
}

export function useShiftsQuery(filters: ShiftFilters = {}) {
  return useQuery({
    queryKey: queryKeys.shifts.list(filters),
    queryFn: () => shiftService.list(filters),
  });
}

export function useShiftDetailQuery(id?: number | string) {
  return useQuery({
    queryKey: queryKeys.shifts.detail(id ?? ""),
    queryFn: () => shiftService.detail(id as number | string),
    enabled: Boolean(id),
  });
}

export function useXReportQuery() {
  return useQuery({
    queryKey: queryKeys.shifts.xReport(),
    queryFn: () => shiftService.xReport(),
  });
}

export function useZReportQuery(id?: number | string) {
  return useQuery({
    queryKey: queryKeys.shifts.zReport(id ?? ""),
    queryFn: () => shiftService.zReport(id as number | string),
    enabled: Boolean(id),
  });
}

export function useOpenShiftMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OpenShiftPayload) => shiftService.open(payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Shift opened");
      queryClient.invalidateQueries({ queryKey: queryKeys.shifts.root() });
      onSuccess?.();
    },
    onError: (error) => toast.error(message(error, "Failed to open shift")),
  });
}

export function useCloseShiftMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CloseShiftPayload) => shiftService.close(payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Shift closed");
      queryClient.invalidateQueries({ queryKey: queryKeys.shifts.root() });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.root() });
      onSuccess?.();
    },
    onError: (error) => toast.error(message(error, "Failed to close shift")),
  });
}

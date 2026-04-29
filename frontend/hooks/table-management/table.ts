import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tableService } from "@/services/table-management";
import { queryKeys } from "@/hooks/queryKeys";
import type { TablePayload } from "@/types/table-management";
import { toast } from "sonner";

export function useTablesQuery(params = {}, scope: "admin" | "manager" | "waiter" | "cashier" = "admin") {
  return useQuery({
    queryKey: queryKeys.tables.list(params, scope),
    queryFn: () => tableService.list(params, scope),
  });
}

export function useCreateTableMutation(done?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: TablePayload) => tableService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tables.root() });
      toast.success("Table created");
      done?.();
    },
  });
}

export function useUpdateTableMutation(done?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: TablePayload }) =>
      tableService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tables.root() });
      toast.success("Table updated");
      done?.();
    },
  });
}

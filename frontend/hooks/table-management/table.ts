import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tableService } from "@/services/table-management";
import { queryKeys } from "@/hooks/queryKeys";
import { toast } from "sonner";

export function useTablesQuery(params = {}, scope = "admin") {
  return useQuery({
    queryKey: queryKeys.tables.list(params, scope),
    queryFn: () => tableService.list(params, scope),
  });
}

export function useCreateTableMutation(done?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: tableService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tables.root() });
      toast.success("Table created");
      done?.();
    },
  });
}
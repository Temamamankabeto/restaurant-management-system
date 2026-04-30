"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PackageCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { procurementService } from "@/services/inventory-management/procurement.service";

export default function StockKeeperDashboardPage() {
  const query = useQuery({
    queryKey: ["dashboard", "stock-keeper", "purchase", "approved"],
    queryFn: () => procurementService.purchaseOrders({ status: "approved", per_page: 1 }, "admin"),
    staleTime: 30000,
    retry: false,
  });

  const count = query.data?.meta.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stock Keeper Dashboard</h1>
        <p className="text-muted-foreground">Inventory receiving and stock updates.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Receiving</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">{query.isLoading ? "..." : count}</div>
              <p className="mt-1 text-xs text-muted-foreground">Approved purchase orders waiting for receiving.</p>
            </div>
            <Button asChild size="sm" className="w-full" variant={count > 0 ? "default" : "outline"}>
              <Link href="/dashboard/purchases/receiving">Receive stock</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

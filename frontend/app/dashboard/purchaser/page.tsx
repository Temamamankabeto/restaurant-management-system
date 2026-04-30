"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { procurementService } from "@/services/inventory-management/procurement.service";

export default function PurchaserDashboardPage() {
  const query = useQuery({
    queryKey: ["dashboard", "purchaser", "purchase", "validation_rejected"],
    queryFn: () => procurementService.purchaseOrders({ status: "validation_rejected", per_page: 1 }, "admin"),
    staleTime: 30000,
    retry: false,
  });

  const count = query.data?.meta.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Purchaser Dashboard</h1>
        <p className="text-muted-foreground">Procurement tracking and corrections.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Requests</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">{query.isLoading ? "..." : count}</div>
              <p className="mt-1 text-xs text-muted-foreground">Requests returned for correction.</p>
            </div>
            <Button asChild size="sm" className="w-full" variant={count > 0 ? "default" : "outline"}>
              <Link href="/dashboard/purchases/requests">Fix requests</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

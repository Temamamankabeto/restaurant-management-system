"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { procurementService } from "@/services/inventory-management/procurement.service";

export default function CafeteriaManagerDashboardPage() {
  const query = useQuery({
    queryKey: ["dashboard", "manager", "purchase", "fb_validated"],
    queryFn: () => procurementService.purchaseOrders({ status: "fb_validated", per_page: 1 }, "admin"),
    staleTime: 30000,
    retry: false,
  });

  const count = query.data?.meta.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cafeteria Manager Dashboard</h1>
        <p className="text-muted-foreground">Operations, purchase review, inventory oversight, and reports.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Requests Ready</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">{query.isLoading ? "..." : count}</div>
              <p className="mt-1 text-xs text-muted-foreground">Validated requests waiting for manager review.</p>
            </div>
            <Button asChild size="sm" className="w-full" variant={count > 0 ? "default" : "outline"}>
              <Link href="/dashboard/purchases/requests">Open requests</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

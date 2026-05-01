"use client";

import Link from "next/link";
import { ClipboardList, Package, Truck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const moduleCards = [
  {
    title: "Procurement Workspace",
    description: "Open purchaser procurement workspace for requests, suppliers, and stock reference.",
    href: "/dashboard/purchaser/procurement-workspace",
    icon: Truck,
  },
  {
    title: "Suppliers",
    description: "Manage supplier records and contacts.",
    href: "/dashboard/purchases/suppliers",
    icon: Users,
  },
  {
    title: "Purchase Requests",
    description: "Create and manage purchase requests.",
    href: "/dashboard/purchases/requests",
    icon: ClipboardList,
  },
  {
    title: "Inventory Reference",
    description: "Browse inventory items used for purchase request lines.",
    href: "/dashboard/inventory/items",
    icon: Package,
  },
];

export default function PurchaserDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Purchaser Dashboard</h1>
        <p className="text-muted-foreground">Main control center for procurement modules.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {moduleCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.href} className="rounded-2xl transition hover:border-primary/50 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="min-h-10 text-xs text-muted-foreground">{item.description}</p>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href={item.href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

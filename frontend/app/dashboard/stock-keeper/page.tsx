"use client";

import Link from "next/link";
import { ClipboardList, Package, PackageCheck, SlidersHorizontal, Warehouse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const moduleCards = [
  {
    title: "Stock Workspace",
    description: "Open stock keeper workspace for receiving, movements, batches, adjustments, and waste tracking.",
    href: "/dashboard/stock-keeper/stock-workspace",
    icon: Warehouse,
  },
  {
    title: "Receiving",
    description: "Receive approved purchase orders into inventory batches.",
    href: "/dashboard/purchases/receiving",
    icon: PackageCheck,
  },
  {
    title: "Stock Movements",
    description: "Review inventory transaction history.",
    href: "/dashboard/inventory/movements",
    icon: ClipboardList,
  },
  {
    title: "Adjustments",
    description: "Record stock corrections after physical counts.",
    href: "/dashboard/inventory/adjustments",
    icon: SlidersHorizontal,
  },
  {
    title: "Inventory Items",
    description: "View inventory item balances and units.",
    href: "/dashboard/inventory/items",
    icon: Package,
  },
];

export default function StockKeeperDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stock Keeper Dashboard</h1>
        <p className="text-muted-foreground">Main control center for stock operations modules.</p>
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

"use client";

// NOTE: status badge coloring improved to reflect workflow states clearly:
// draft -> secondary
// submitted -> yellow-style secondary
// fb_validated -> blue-style default
// approved -> green-style default
// partially_received -> purple-style secondary
// completed -> green-style default
// cancelled / validation_rejected -> destructive

import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, PackageCheck, Plus, RefreshCcw, Search, Send, ShieldCheck, Truck, Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatBaseQuantity, formatMoney } from "@/lib/inventory-management";
import { can, purchasePermissions, inventoryPermissions } from "@/lib/auth/permissions";
import inventoryService from "@/services/inventory-management/inventory.service";
import { procurementService, type PurchaseOrderItemRow, type PurchaseOrderPayload, type PurchaseOrderRow, type SupplierPayload, type SupplierRow } from "@/services/inventory-management/procurement.service";
import { useInventoryItemsQuery } from "@/hooks/inventory-management";
import type { InventoryItem } from "@/types/inventory-management";

function statusBadge(status?: string | null) {
  const normalized = status ?? "draft";

  switch (normalized) {
    case "draft":
      return <Badge variant="secondary">Draft</Badge>;

    case "submitted":
      return <Badge variant="secondary">Submitted</Badge>;

    case "fb_validated":
      return <Badge variant="default">F&B Validated</Badge>;

    case "approved":
      return <Badge variant="default">Approved</Badge>;

    case "partially_received":
      return <Badge variant="secondary">Partially received</Badge>;

    case "completed":
      return <Badge variant="default">Completed</Badge>;

    case "validation_rejected":
    case "cancelled":
      return <Badge variant="destructive">{normalized.replaceAll("_", " ")}</Badge>;

    default:
      return <Badge variant="secondary">{normalized.replaceAll("_", " ")}</Badge>;
  }
}

export { statusBadge };

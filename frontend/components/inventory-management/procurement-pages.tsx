"use client";

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

function canCreateSupplier() {
  return can(purchasePermissions.suppliersCreate);
}

function canCreatePurchaseOrder() {
  return can(purchasePermissions.ordersCreate) || can(purchasePermissions.requestsCreate);
}

function canSubmitPurchaseOrder() {
  return can(purchasePermissions.ordersSubmit);
}

function canApprovePurchaseOrder() {
  return can(purchasePermissions.ordersApprove) || can(purchasePermissions.requestsApprove);
}

function canValidateRecipes() {
  return can(inventoryPermissions.recipeIntegrity);
}

function canReceivePurchaseOrder() {
  return can(purchasePermissions.ordersReceive) || can(inventoryPermissions.receive);
}

function PageHeader({ title, description, icon: Icon }: { title: string; description: string; icon: typeof Truck }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      <Badge variant="secondary" className="w-fit">Workflow: Purchaser creates/submits → F&B validates → Manager approves → Stock Keeper receives</Badge>
    </div>
  );
}

function extractError(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function statusBadge(status?: string | null) {
  const normalized = status ?? "draft";
  const variant = normalized === "approved" || normalized === "completed" ? "default" : normalized === "cancelled" ? "destructive" : "secondary";
  return <Badge variant={variant}>{normalized.replaceAll("_", " ")}</Badge>;
}

function poItemName(item: PurchaseOrderItemRow) {
  const inv = item.inventory_item ?? item.inventoryItem;
  return inv?.sku ? `${inv.name} (${inv.sku})` : inv?.name ?? `Item #${item.inventory_item_id}`;
}

function poRemaining(item: PurchaseOrderItemRow) {
  return Math.max(Number(item.quantity ?? 0) - Number(item.received_quantity ?? 0), 0);
}

export function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const query = useQuery({ queryKey: ["procurement", "suppliers", search], queryFn: () => procurementService.suppliers({ search, per_page: 20 }) });
  const rows = query.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Suppliers" description="Purchaser manages suppliers before creating purchase requests." icon={Users} />
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div><CardTitle>Supplier list</CardTitle><CardDescription>Search suppliers and create new suppliers for procurement.</CardDescription></div>
            <div className="flex gap-2">
              <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Search supplier..." /></div>
              <Dialog open={open} onOpenChange={setOpen}>{canCreateSupplier() && <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New supplier</Button></DialogTrigger>}<DialogContent><DialogHeader><DialogTitle>Create supplier</DialogTitle><DialogDescription>Used by Purchaser for purchase requests.</DialogDescription></DialogHeader><SupplierForm onDone={() => setOpen(false)} /></DialogContent></Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent><SuppliersTable rows={rows} loading={query.isLoading} /></CardContent>
      </Card>
    </div>
  );
}

function SupplierForm({ onDone }: { onDone?: () => void }) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: SupplierPayload) => procurementService.createSupplier(payload),
    onSuccess: () => { toast.success("Supplier created"); qc.invalidateQueries({ queryKey: ["procurement", "suppliers"] }); onDone?.(); },
    onError: (e) => toast.error(extractError(e, "Failed to create supplier")),
  });
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    mutation.mutate({
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      address: String(form.get("address") ?? ""),
      tax_id: String(form.get("tax_id") ?? ""),
      is_active: true,
    });
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div><Label>Name</Label><Input name="name" required /></div>
      <div className="grid gap-3 md:grid-cols-2"><div><Label>Phone</Label><Input name="phone" /></div><div><Label>Email</Label><Input name="email" type="email" /></div></div>
      <div><Label>Tax ID</Label><Input name="tax_id" /></div>
      <div><Label>Address</Label><Textarea name="address" /></div>
      <Button disabled={mutation.isPending} type="submit">Save supplier</Button>
    </form>
  );
}

function SuppliersTable({ rows, loading }: { rows: SupplierRow[]; loading?: boolean }) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading suppliers...</p>;
  if (!rows.length) return <div className="rounded-xl border border-dashed p-8 text-center"><p className="font-medium">No suppliers</p><p className="text-sm text-muted-foreground">Create suppliers before purchase requests.</p></div>;
  return (
    <Table>
      <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead><TableHead>Orders</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
      <TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell className="font-medium">{row.name}</TableCell><TableCell>{row.phone ?? "—"}</TableCell><TableCell>{row.email ?? "—"}</TableCell><TableCell>{row.purchase_orders_count ?? 0}</TableCell><TableCell>{formatMoney(Number(row.purchase_orders_total ?? 0))}</TableCell><TableCell>{row.is_active === false ? <Badge variant="secondary">Inactive</Badge> : <Badge>Active</Badge>}</TableCell></TableRow>)}</TableBody>
    </Table>
  );
}

export function PurchaseRequestsPage({ validationOnly = false }: { validationOnly?: boolean } = {}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(validationOnly ? "submitted" : "all");
  const [open, setOpen] = useState(false);
  const query = useQuery({ queryKey: ["procurement", "purchase-orders", search, status], queryFn: () => procurementService.purchaseOrders({ search, status, per_page: 20 }) });
  const rows = query.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={validationOnly ? "Purchase Validation" : "Purchase Requests"} description={validationOnly ? "F & B Controller validates that requested ingredients are recipe-relevant before manager approval." : "Purchaser creates and submits purchase requests. Manager approves after optional F&B validation. Stock Keeper receives approved orders."} icon={validationOnly ? ShieldCheck : ClipboardList} />
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div><CardTitle>{validationOnly ? "Submitted requests for F&B validation" : "Purchase orders"}</CardTitle><CardDescription>Flow: Draft → Submitted → F&B validated → Approved → Partially received/Completed.</CardDescription></div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Search PO or supplier..." /></div>
              <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All status</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="submitted">Submitted</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="partially_received">Partially received</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select>
              {!validationOnly && canCreatePurchaseOrder() && <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New request</Button></DialogTrigger><DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Create purchase request</DialogTitle><DialogDescription>Quantities are entered in each inventory item base unit: g, ml, or pc.</DialogDescription></DialogHeader><PurchaseOrderForm onDone={() => setOpen(false)} /></DialogContent></Dialog>}
            </div>
          </div>
        </CardHeader>
        <CardContent><PurchaseOrdersTable rows={rows} loading={query.isLoading} validationOnly={validationOnly} /></CardContent>
      </Card>
    </div>
  );
}

export function PurchaseValidationPage() {
  return <PurchaseRequestsPage validationOnly />;
}

function PurchaseOrderForm({ onDone }: { onDone?: () => void }) {
  const qc = useQueryClient();
  const suppliers = useQuery({ queryKey: ["procurement", "suppliers", "for-po"], queryFn: () => procurementService.suppliers({ per_page: 100 }) });
  const inventory = useInventoryItemsQuery({ per_page: 100 });
  const items = inventory.data?.data ?? [];
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState<"draft" | "submitted">("submitted");
  const [lines, setLines] = useState<Array<{ inventory_item_id: string; quantity: string; unit_cost: string }>>([{ inventory_item_id: "", quantity: "", unit_cost: "" }]);
  const mutation = useMutation({
    mutationFn: (payload: PurchaseOrderPayload) => procurementService.createPurchaseOrder(payload),
    onSuccess: () => { toast.success("Purchase request created"); qc.invalidateQueries({ queryKey: ["procurement", "purchase-orders"] }); onDone?.(); },
    onError: (e) => toast.error(extractError(e, "Failed to create purchase request")),
  });
  const inventoryById = useMemo(() => new Map(items.map((item) => [String(item.id), item])), [items]);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const cleanLines = lines.filter((line) => line.inventory_item_id && Number(line.quantity) > 0).map((line) => {
      const inv = inventoryById.get(line.inventory_item_id);
      return { inventory_item_id: Number(line.inventory_item_id), quantity: Number(line.quantity), base_unit: inv?.base_unit ?? inv?.unit ?? "pc", unit_cost: Number(line.unit_cost || inv?.average_purchase_price || 0) };
    });
    if (!supplierId || !cleanLines.length) { toast.error("Select supplier and at least one item"); return; }
    mutation.mutate({ supplier_id: Number(supplierId), expected_date: String(form.get("expected_date") ?? ""), notes: String(form.get("notes") ?? ""), status, items: cleanLines });
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div><Label>Supplier</Label><Select value={supplierId} onValueChange={setSupplierId}><SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger><SelectContent>{(suppliers.data?.data ?? []).map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Expected date</Label><Input name="expected_date" type="date" /></div>
        <div><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value as "draft" | "submitted")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="submitted">Submit now</SelectItem></SelectContent></Select></div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><Label>Ordered items</Label><Button type="button" variant="outline" size="sm" onClick={() => setLines([...lines, { inventory_item_id: "", quantity: "", unit_cost: "" }])}><Plus className="mr-2 h-4 w-4" />Add line</Button></div>
        {lines.map((line, index) => {
          const inv = inventoryById.get(line.inventory_item_id);
          return <div key={index} className="grid gap-2 rounded-xl border p-3 md:grid-cols-[1fr_140px_140px_80px]">
            <Select value={line.inventory_item_id} onValueChange={(value) => setLines((old) => old.map((row, i) => i === index ? { ...row, inventory_item_id: value, unit_cost: row.unit_cost || String(inventoryById.get(value)?.average_purchase_price ?? "") } : row))}><SelectTrigger><SelectValue placeholder="Inventory item" /></SelectTrigger><SelectContent>{items.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name} ({item.base_unit})</SelectItem>)}</SelectContent></Select>
            <Input value={line.quantity} onChange={(e) => setLines((old) => old.map((row, i) => i === index ? { ...row, quantity: e.target.value } : row))} placeholder={`Qty ${inv?.base_unit ?? ""}`} type="number" step="0.001" />
            <Input value={line.unit_cost} onChange={(e) => setLines((old) => old.map((row, i) => i === index ? { ...row, unit_cost: e.target.value } : row))} placeholder="Unit cost" type="number" step="0.01" />
            <Button type="button" variant="ghost" onClick={() => setLines((old) => old.filter((_, i) => i !== index))}>Remove</Button>
          </div>;
        })}
      </div>
      <div><Label>Notes</Label><Textarea name="notes" /></div>
      <Button disabled={mutation.isPending} type="submit"><Send className="mr-2 h-4 w-4" />Save request</Button>
    </form>
  );
}

function PurchaseOrdersTable({ rows, loading, validationOnly = false }: { rows: PurchaseOrderRow[]; loading?: boolean; validationOnly?: boolean }) {
  const qc = useQueryClient();
  const submit = useMutation({ mutationFn: (id: number) => procurementService.submitPurchaseOrder(id), onSuccess: () => { toast.success("Purchase order submitted"); qc.invalidateQueries({ queryKey: ["procurement", "purchase-orders"] }); }, onError: (e) => toast.error(extractError(e, "Failed to submit")) });
  const approve = useMutation({ mutationFn: (id: number) => procurementService.approvePurchaseOrder(id), onSuccess: () => { toast.success("Purchase order approved and ready for receiving"); qc.invalidateQueries({ queryKey: ["procurement", "purchase-orders"] }); }, onError: (e) => toast.error(extractError(e, "Failed to approve")) });
  if (loading) return <p className="text-sm text-muted-foreground">Loading purchase orders...</p>;
  if (!rows.length) return <div className="rounded-xl border border-dashed p-8 text-center"><p className="font-medium">No purchase requests</p><p className="text-sm text-muted-foreground">Purchaser creates requests when stock must be ordered.</p></div>;
  return (
    <Table>
      <TableHeader><TableRow><TableHead>PO</TableHead><TableHead>Supplier</TableHead><TableHead>Status</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Expected</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
      <TableBody>{rows.map((po) => <TableRow key={po.id}><TableCell className="font-medium">{po.po_number ?? `PO-${po.id}`}</TableCell><TableCell>{po.supplier?.name ?? `Supplier #${po.supplier_id}`}</TableCell><TableCell>{statusBadge(po.status)}</TableCell><TableCell>{po.items?.length ?? 0}</TableCell><TableCell>{formatMoney(Number(po.total ?? 0))}</TableCell><TableCell>{po.expected_date ?? "—"}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-2">{canSubmitPurchaseOrder() && po.status === "draft" && <Button size="sm" variant="outline" onClick={() => submit.mutate(po.id)}>Submit</Button>}{canValidateRecipes() && po.status === "submitted" && <ValidatePurchaseDialog po={po} />}{canApprovePurchaseOrder() && po.status === "submitted" && <Button size="sm" onClick={() => approve.mutate(po.id)}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button>}</div></TableCell></TableRow>)}</TableBody>
    </Table>
  );
}

function ValidatePurchaseDialog({ po }: { po: PurchaseOrderRow }) {
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ["inventory", "recipe-integrity", "for-purchase-validation", po.id],
    queryFn: () => inventoryService.recipeIntegrity("food-controller"),
    enabled: open,
  });
  const summary = query.data?.summary ?? {};
  const issues = Object.values(summary).reduce((total, value) => total + Number(value ?? 0), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><ShieldCheck className="mr-2 h-4 w-4" />Validate recipes</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Validate purchase request</DialogTitle>
          <DialogDescription>F & B Controller checks recipe and ingredient integrity before the Manager approves this purchase request.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl border p-4">
            <p className="text-sm font-medium">{po.po_number ?? `PO-${po.id}`} · {po.supplier?.name ?? "Supplier"}</p>
            <p className="text-sm text-muted-foreground">Validation is advisory: it does not receive stock and does not approve the purchase order.</p>
          </div>
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Checking recipe integrity...</p>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Items without recipe</p><p className="text-lg font-semibold">{Number(summary.menu_items_without_recipe ?? 0)}</p></div>
                <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Recipes without ingredients</p><p className="text-lg font-semibold">{Number(summary.recipes_without_ingredients ?? 0)}</p></div>
                <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Missing inventory links</p><p className="text-lg font-semibold">{Number(summary.recipes_with_missing_inventory_links ?? 0)}</p></div>
                <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Direct items without link</p><p className="text-lg font-semibold">{Number(summary.direct_items_without_link ?? 0)}</p></div>
              </div>
              {issues === 0 ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">Recipe integrity is valid. This request can be sent to Manager for approval.</div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Recipe issues found. Fix recipe links before Manager approval.</div>
              )}
              <PoLinesTable lines={po.items ?? []} />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OrderedItemsReceivingPage() {
  const [status, setStatus] = useState("approved");
  const query = useQuery({ queryKey: ["procurement", "purchase-orders", "receiving", status], queryFn: () => procurementService.purchaseOrders({ status, per_page: 20 }) });
  const rows = query.data?.data ?? [];
  return (
    <div className="space-y-6">
      <PageHeader title="Receive Ordered Items" description="Stock Keeper receives approved purchase orders. Receiving increases inventory and creates stock batches/movements." icon={PackageCheck} />
      {!canReceivePurchaseOrder() && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm"><AlertTriangle className="mr-2 inline h-4 w-4" /> Your role can view this page, but only Stock Keeper/Admin should receive stock.</div>}
      <Card>
        <CardHeader><div className="flex items-center justify-between"><div><CardTitle>Approved orders ready for receiving</CardTitle><CardDescription>Choose approved or partially received orders.</CardDescription></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="approved">Approved</SelectItem><SelectItem value="partially_received">Partially received</SelectItem><SelectItem value="all">All</SelectItem></SelectContent></Select></div></CardHeader>
        <CardContent><ReceivingOrdersTable rows={rows} loading={query.isLoading} canReceive={canReceivePurchaseOrder()} /></CardContent>
      </Card>
    </div>
  );
}

function ReceivingOrdersTable({ rows, loading, canReceive }: { rows: PurchaseOrderRow[]; loading?: boolean; canReceive: boolean }) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading ordered items...</p>;
  if (!rows.length) return <div className="rounded-xl border border-dashed p-8 text-center"><p className="font-medium">No approved orders</p><p className="text-sm text-muted-foreground">Purchaser creates orders, manager approves them, then Stock Keeper receives them.</p></div>;
  return (
    <div className="space-y-3">{rows.map((po) => <Card key={po.id}><CardHeader className="pb-3"><div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><CardTitle className="text-base">{po.po_number ?? `PO-${po.id}`} · {po.supplier?.name ?? "Supplier"}</CardTitle><CardDescription>{statusBadge(po.status)} · {po.items?.length ?? 0} items · Total {formatMoney(Number(po.total ?? 0))}</CardDescription></div>{canReceive && ["approved", "partially_received"].includes(po.status) && <ReceiveOrderDialog po={po} />}</div></CardHeader><CardContent><PoLinesTable lines={po.items ?? []} /></CardContent></Card>)}</div>
  );
}

function PoLinesTable({ lines }: { lines: PurchaseOrderItemRow[] }) {
  return <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Ordered</TableHead><TableHead>Received</TableHead><TableHead>Remaining</TableHead><TableHead>Cost</TableHead></TableRow></TableHeader><TableBody>{lines.map((line) => { const inv = line.inventory_item ?? line.inventoryItem; const unit = inv?.base_unit ?? line.unit ?? "pc"; return <TableRow key={line.id}><TableCell>{poItemName(line)}</TableCell><TableCell>{formatBaseQuantity(Number(line.quantity), unit as any)}</TableCell><TableCell>{formatBaseQuantity(Number(line.received_quantity ?? 0), unit as any)}</TableCell><TableCell>{formatBaseQuantity(poRemaining(line), unit as any)}</TableCell><TableCell>{formatMoney(Number(line.unit_cost ?? 0))}</TableCell></TableRow>; })}</TableBody></Table>;
}

function ReceiveOrderDialog({ po }: { po: PurchaseOrderRow }) {
  const [open, setOpen] = useState(false);
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button size="sm"><PackageCheck className="mr-2 h-4 w-4" />Receive order</Button></DialogTrigger><DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Receive {po.po_number ?? `PO-${po.id}`}</DialogTitle><DialogDescription>Enter received quantity in each item base unit. Do not exceed remaining quantity.</DialogDescription></DialogHeader><ReceiveOrderForm po={po} onDone={() => setOpen(false)} /></DialogContent></Dialog>;
}

function ReceiveOrderForm({ po, onDone }: { po: PurchaseOrderRow; onDone?: () => void }) {
  const qc = useQueryClient();
  const initialLines = (po.items ?? []).filter((line) => poRemaining(line) > 0).map((line) => ({ purchase_order_item_id: line.id, quantity: String(poRemaining(line)), expiry_date: "", batch_note: "" }));
  const [lines, setLines] = useState(initialLines);
  const mutation = useMutation({
    mutationFn: (payload: any) => procurementService.receivePurchaseOrder(po.id, payload),
    onSuccess: () => { toast.success("Ordered items received into inventory"); qc.invalidateQueries({ queryKey: ["procurement"] }); qc.invalidateQueries({ queryKey: ["inventory"] }); onDone?.(); },
    onError: (e) => toast.error(extractError(e, "Failed to receive ordered items")),
  });
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const items = lines.filter((line) => Number(line.quantity) > 0).map((line) => {
      const poLine = (po.items ?? []).find((item) => item.id === line.purchase_order_item_id);
      const inv = poLine?.inventory_item ?? poLine?.inventoryItem;
      return { purchase_order_item_id: line.purchase_order_item_id, quantity: Number(line.quantity), unit: inv?.base_unit ?? poLine?.unit ?? "pc", expiry_date: line.expiry_date || undefined, batch_note: line.batch_note || undefined };
    });
    mutation.mutate({ note: String(form.get("note") ?? ""), items });
  }
  return <form onSubmit={submit} className="space-y-4"><PoLinesTable lines={po.items ?? []} /><div className="space-y-2"><Label>Receive quantities</Label>{lines.map((line, index) => { const poLine = (po.items ?? []).find((item) => item.id === line.purchase_order_item_id); const inv = poLine?.inventory_item ?? poLine?.inventoryItem; const unit = inv?.base_unit ?? poLine?.unit ?? "pc"; return <div key={line.purchase_order_item_id} className="grid gap-2 rounded-xl border p-3 md:grid-cols-[1fr_140px_160px_1fr]"><div><p className="font-medium">{poLine ? poItemName(poLine) : `Line #${line.purchase_order_item_id}`}</p><p className="text-xs text-muted-foreground">Remaining {poLine ? formatBaseQuantity(poRemaining(poLine), unit as any) : "—"}</p></div><Input type="number" step="0.001" value={line.quantity} onChange={(e) => setLines((old) => old.map((row, i) => i === index ? { ...row, quantity: e.target.value } : row))} /><Input type="date" value={line.expiry_date} onChange={(e) => setLines((old) => old.map((row, i) => i === index ? { ...row, expiry_date: e.target.value } : row))} /><Input placeholder="Batch note" value={line.batch_note} onChange={(e) => setLines((old) => old.map((row, i) => i === index ? { ...row, batch_note: e.target.value } : row))} /></div>; })}</div><div><Label>Receiving note</Label><Textarea name="note" /></div><Button disabled={mutation.isPending} type="submit"><RefreshCcw className="mr-2 h-4 w-4" />Receive into stock</Button></form>;
}

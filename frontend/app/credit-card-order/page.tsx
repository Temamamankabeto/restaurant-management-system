"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const url = (path: string) => `${API_BASE}${path}`;

function money(value: unknown) {
  return Number(value || 0).toFixed(2);
}

function PrintableAigBill({ receipt, cardNumber, validated }: { receipt: any; cardNumber: string; validated: any }) {
  const items = receipt?.items || [];
  const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.line_total || 0), 0);
  const total = Number(receipt?.total || 0);
  const taxAndService = Math.max(0, total - subtotal);
  const dateText = new Date().toLocaleString();

  return (
    <Card className="print:border-0 print:shadow-none">
      <CardContent className="mx-auto max-w-sm space-y-3 p-6 font-mono text-xs print:max-w-[80mm] print:p-0">
        <div className="text-center">
          <h2 className="text-lg font-bold tracking-wide">AIG CAFETERIA</h2>
          <p>Adama Investment Group</p>
          <p className="font-semibold">CREDIT ORDER RECEIPT</p>
        </div>

        <div className="border-t border-dashed pt-2">
          <div className="flex justify-between"><span>Order No</span><strong>{receipt?.order_number || "-"}</strong></div>
          <div className="flex justify-between"><span>Bill No</span><strong>{receipt?.bill_number || "-"}</strong></div>
          <div className="flex justify-between"><span>Date</span><span>{dateText}</span></div>
          <div className="flex justify-between"><span>Payment</span><strong>CREDIT</strong></div>
        </div>

        <div className="border-t border-dashed pt-2">
          <p><strong>Account:</strong> {receipt?.account?.name || validated?.account?.name || "-"}</p>
          <p><strong>User:</strong> {validated?.authorized_user?.full_name || "Account holder"}</p>
          <p><strong>Card:</strong> {cardNumber}</p>
        </div>

        <div className="border-t border-dashed pt-2">
          <div className="grid grid-cols-[1fr_35px_60px_65px] gap-1 font-bold">
            <span>Item</span><span className="text-right">Qty</span><span className="text-right">Price</span><span className="text-right">Total</span>
          </div>
          {items.map((item: any, index: number) => (
            <div key={index} className="grid grid-cols-[1fr_35px_60px_65px] gap-1">
              <span className="truncate">{item.name}</span>
              <span className="text-right">{Number(item.quantity || 0)}</span>
              <span className="text-right">{money(item.unit_price)}</span>
              <span className="text-right">{money(item.line_total)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed pt-2">
          <div className="flex justify-between"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
          <div className="flex justify-between"><span>Tax/Service</span><strong>{money(taxAndService)}</strong></div>
          <div className="flex justify-between text-base"><span>TOTAL</span><strong>{money(total)} ETB</strong></div>
          <div className="flex justify-between"><span>Remaining Credit</span><strong>{money(receipt?.account?.remaining_limit)}</strong></div>
        </div>

        <div className="border-t border-dashed pt-2">
          <p className="font-bold">Tickets</p>
          {receipt?.tickets?.length ? receipt.tickets.map((ticket: any, index: number) => (
            <p key={index}>{ticket.ticket_number || `TICKET-${index + 1}`} · {ticket.station || "station"} · {ticket.item_name || "item"}</p>
          )) : <p>-</p>}
        </div>

        <div className="border-t border-dashed pt-2 text-center">
          <p><strong>Estimated Preparation:</strong> {receipt?.preparation_estimate_minutes || 15} minutes</p>
          <p className="mt-2">Thank you!</p>
          <p>AIG Cafeteria POS System</p>
        </div>

        <div className="flex justify-center pt-3 print:hidden">
          <Button onClick={() => window.print()}>Print bill</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CreditCardOrderPage() {
  const [cardNumber, setCardNumber] = useState("");
  const [message, setMessage] = useState("");
  const [validated, setValidated] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const grandTotal = total * 1.15;

  async function validateCard() {
    if (!cardNumber.trim()) return toast.error("Enter card number first");
    setLoading(true);
    setMessage("Checking card...");
    setReceipt(null);
    try {
      const res = await fetch(url("/api/public/credit-card/validate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_number: cardNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setValidated(null);
        setMessage(data.message || "Card validation failed");
        return;
      }
      setValidated(data.data);
      setMessage(`Available credit: ${Number(data.data.available_limit || 0).toFixed(2)}`);
      const menuRes = await fetch(url("/api/public/credit-card/menu"));
      const menuData = await menuRes.json();
      setMenu(Array.isArray(menuData.data) ? menuData.data : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Card validation failed");
    } finally {
      setLoading(false);
    }
  }

  function addItem(item: any) {
    setCart((current) => {
      const old = current.find((x) => String(x.id) === String(item.id));
      if (old) return current.map((x) => String(x.id) === String(item.id) ? { ...x, quantity: x.quantity + 1 } : x);
      return [...current, { ...item, quantity: 1 }];
    });
  }

  async function submitOrder() {
    if (!validated) return toast.error("Validate card first");
    if (!cart.length) return toast.error("Add menu items first");
    if (grandTotal > Number(validated.available_limit || 0)) return toast.error("Credit amount is not enough");
    setLoading(true);
    try {
      const res = await fetch(url("/api/public/credit-card/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_number: cardNumber.trim(),
          items: cart.map((item) => ({ menu_item_id: item.id, quantity: item.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) return toast.error(data.message || "Order failed");
      setReceipt(data.data);
      setCart([]);
      setTimeout(() => window.print(), 400);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Order failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-muted/30 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="print:hidden">
          <Button variant="outline" asChild className="mb-3"><Link href="/login">Back to login</Link></Button>
          <h1 className="text-3xl font-bold">Credit Card Self-Order Kiosk</h1>
          <p className="text-muted-foreground">Validate card first, then select menu items and submit credit order.</p>
        </div>

        <Card className="print:hidden">
          <CardHeader><CardTitle>1. Validate card</CardTitle><CardDescription>Card must be active and have available credit.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") validateCard(); }} placeholder="Scan or enter card number" />
            <Button onClick={validateCard} disabled={loading}>{loading ? "Please wait..." : "Validate"}</Button>
            {message && <p className="md:col-span-2 text-sm text-muted-foreground">{message}</p>}
          </CardContent>
        </Card>

        {validated && <div className="grid gap-6 lg:grid-cols-[1fr_360px] print:hidden">
          <Card>
            <CardHeader><CardTitle>2. Menu</CardTitle><CardDescription>Choose items to order.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {menu.map((item) => <Card key={item.id} className="overflow-hidden">
                <div className="h-36 bg-muted">{item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>}</div>
                <CardHeader className="pb-2"><CardTitle className="text-base">{item.name}</CardTitle><CardDescription>{Number(item.price || 0).toFixed(2)} ETB</CardDescription></CardHeader>
                <CardContent><Button size="sm" onClick={() => addItem(item)}>Add to cart</Button></CardContent>
              </Card>)}
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader><CardTitle>Cart</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {!cart.length && <p className="text-muted-foreground">No items selected.</p>}
              {cart.map((item) => <div key={item.id} className="flex justify-between rounded border p-2"><span>{item.name} x {item.quantity}</span><strong>{(Number(item.price || 0) * item.quantity).toFixed(2)}</strong></div>)}
              <div className="rounded bg-muted p-3"><div className="flex justify-between"><span>Total with tax/service</span><strong>{grandTotal.toFixed(2)}</strong></div><div className="flex justify-between"><span>Available</span><strong>{Number(validated.available_limit || 0).toFixed(2)}</strong></div></div>
              <Button className="w-full" onClick={submitOrder} disabled={loading || !cart.length || grandTotal > Number(validated.available_limit || 0)}>Submit credit order</Button>
            </CardContent>
          </Card>
        </div>}

        {receipt && <PrintableAigBill receipt={receipt} cardNumber={cardNumber} validated={validated} />}
      </div>
    </main>
  );
}

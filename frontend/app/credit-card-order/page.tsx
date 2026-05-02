"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const url = (path: string) => `${API_BASE}${path}`;

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

        {receipt && <Card className="print:border-0 print:shadow-none">
          <CardHeader className="text-center"><CardTitle>Printable Credit Bill</CardTitle><CardDescription>Order submitted successfully.</CardDescription></CardHeader>
          <CardContent className="mx-auto max-w-xl space-y-3 text-sm">
            <p><strong>Order No:</strong> {receipt.order_number}</p>
            <p><strong>Bill No:</strong> {receipt.bill_number || "-"}</p>
            <p><strong>Preparation time:</strong> {receipt.preparation_estimate_minutes || 15} minutes</p>
            <p><strong>Total:</strong> {Number(receipt.total || 0).toFixed(2)}</p>
            <p><strong>Remaining credit:</strong> {Number(receipt.account?.remaining_limit || 0).toFixed(2)}</p>
            <div><strong>Tickets:</strong>{receipt.tickets?.map((t: any, i: number) => <p key={i}>{t.ticket_number} - {t.station} - {t.item_name}</p>)}</div>
            <Button className="print:hidden" onClick={() => window.print()}>Print bill</Button>
          </CardContent>
        </Card>}
      </div>
    </main>
  );
}

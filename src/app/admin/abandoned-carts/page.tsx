'use client';

import { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Mail, ShoppingCart, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  fetchAdminAbandonedCheckoutsAction,
  sendAbandonedCartRecoveryEmailAction,
  deleteAdminAbandonedCartAction,
  type AbandonedCartRow,
} from "@/app/actions/abandoned-carts";

export default function AdminAbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadCarts = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminAbandonedCheckoutsAction();
      setCarts(data);
    } catch (err) {
      console.error("Failed to load abandoned carts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCarts();
  }, []);

  const handleSendEmail = async (id: string) => {
    setSendingId(id);
    setFeedback(null);
    try {
      const res = await sendAbandonedCartRecoveryEmailAction(id);
      if (res.success) {
        setFeedback({ message: res.message || "Recovery email sent successfully!", type: "success" });
        loadCarts();
      } else {
        setFeedback({ message: res.message || "Failed to dispatch recovery email.", type: "error" });
      }
    } catch (err: any) {
      setFeedback({ message: err?.message || "Failed to send email.", type: "error" });
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this abandoned cart entry?")) return;
    try {
      setCarts(carts.filter((c) => c.id !== id));
      await deleteAdminAbandonedCartAction(id);
    } catch (err) {
      console.error("Failed to delete abandoned cart:", err);
      loadCarts();
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Abandoned Checkouts Queue</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            View customer carts that reached checkout but did not complete order. Send automated discount recovery emails.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded text-xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-4 text-emerald-600" />
          ) : (
            <AlertCircle className="size-4 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight">
            Incomplete Checkout Carts ({carts.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Recover lost revenue via email follow-ups with promotional discount incentives
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading abandoned checkouts from database...
            </div>
          ) : carts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm flex flex-col items-center gap-2">
              <ShoppingCart className="size-8 text-neutral-300" />
              <span>No abandoned checkouts found. When shoppers leave items in checkout, they appear here.</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact (Email / Phone)</TableHead>
                  <TableHead>Abandoned Items</TableHead>
                  <TableHead>Cart Total</TableHead>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carts.map((cart) => (
                  <TableRow key={cart.id}>
                    <TableCell className="font-semibold text-xs text-foreground">
                      {cart.customerName}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      <div>
                        {cart.email && <p className="text-foreground">{cart.email}</p>}
                        {cart.phone && <p className="text-muted-foreground">{cart.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[260px] text-xs text-muted-foreground truncate">
                      {cart.itemsSummary}
                    </TableCell>
                    <TableCell className="font-semibold text-xs whitespace-nowrap">
                      ৳{cart.totalBdt.toLocaleString()} BDT
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {cart.date}
                    </TableCell>
                    <TableCell>
                      {cart.isRecovered ? (
                        <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300">
                          Converted to Order ✓
                        </Badge>
                      ) : cart.recoveryEmailSentAt ? (
                        <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-300">
                          Email Sent {cart.recoveryEmailSentAt}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pending Recovery</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!cart.isRecovered && cart.email && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={sendingId === cart.id}
                            onClick={() => handleSendEmail(cart.id)}
                            className="text-xs h-7 px-2.5 flex items-center gap-1"
                          >
                            {sendingId === cart.id ? (
                              <Loader2 className="size-3 animate-spin mr-1" />
                            ) : (
                              <Mail className="size-3 text-blue-600 mr-1" />
                            )}
                            <span>Send 10% Recovery</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cart.id)}
                          className="size-7 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

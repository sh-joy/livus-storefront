'use client';

import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Mail, ShoppingCart } from "lucide-react";

interface AbandonedCartItem {
  id: string;
  email: string;
  items: string;
  totalBdt: number;
  date: string;
  recovered: boolean;
}

const sampleCarts: AbandonedCartItem[] = [
  { id: "cart-881", email: "sakib.khan@gmail.com", items: "Oakwood Long sleeve (Yellow, XL) x 1", totalBdt: 899, date: "2 hours ago", recovered: false },
  { id: "cart-882", email: "tanvir.hossain@yahoo.com", items: "OWAYO - CROSS FADE x 1", totalBdt: 899, date: "5 hours ago", recovered: false },
];

export default function AdminAbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCartItem[]>(sampleCarts);

  const handleSendEmail = (id: string) => {
    setCarts(carts.map(c => c.id === id ? { ...c, recovered: true } : c));
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Abandoned Checkouts Queue</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          View customer carts that reached checkout but did not complete payment. Send automated discount recovery emails.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight">Incomplete Checkout Carts ({carts.length})</CardTitle>
          <CardDescription className="text-xs">Recover lost revenue via email follow-ups</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cart ID</TableHead>
                <TableHead>Customer Email</TableHead>
                <TableHead>Abandoned Items</TableHead>
                <TableHead>Cart Total</TableHead>
                <TableHead>Time Ago</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carts.map((cart) => (
                <TableRow key={cart.id}>
                  <TableCell className="font-mono font-bold text-xs">{cart.id}</TableCell>
                  <TableCell className="font-medium text-xs">{cart.email}</TableCell>
                  <TableCell className="text-xs">{cart.items}</TableCell>
                  <TableCell className="font-semibold text-xs">৳{cart.totalBdt} BDT</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{cart.date}</TableCell>
                  <TableCell>
                    {cart.recovered ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-300">Recovery Email Sent</Badge>
                    ) : (
                      <Badge variant="secondary">Pending Recovery</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={cart.recovered}
                      onClick={() => handleSendEmail(cart.id)}
                      className="text-xs flex items-center gap-1.5 ml-auto"
                    >
                      <Mail className="size-3.5" />
                      <span>{cart.recovered ? "Sent" : "Send Recovery Discount"}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

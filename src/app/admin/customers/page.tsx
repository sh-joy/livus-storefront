'use client';

import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpentBdt: number;
  city: string;
}

const sampleCustomers: CustomerRow[] = [
  { id: "cust-101", name: "Rahim Chowdhury", email: "rahim.c@gmail.com", phone: "01711223344", ordersCount: 3, totalSpentBdt: 3840, city: "Dhaka" },
  { id: "cust-102", name: "Tariq Hasan", email: "tariq.hasan@yahoo.com", phone: "01812345678", ordersCount: 1, totalSpentBdt: 1948, city: "Chittagong" },
  { id: "cust-103", name: "Nusrat Jahan", email: "nusrat.jahan@gmail.com", phone: "01999887766", ordersCount: 2, totalSpentBdt: 2490, city: "Sylhet" },
];

export default function AdminCustomersPage() {
  const [customers] = useState<CustomerRow[]>(sampleCustomers);

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Customer Directory (CRM)</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Directory of registered users and guest checkout profiles with total lifetime value (LTV).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight">Registered Customers ({customers.length})</CardTitle>
          <CardDescription className="text-xs">Customer purchasing history & profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Orders Count</TableHead>
                <TableHead>Lifetime Value (LTV)</TableHead>
                <TableHead>Customer Tier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                  <TableCell>
                    <p className="text-xs text-foreground font-medium">{c.email}</p>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                  </TableCell>
                  <TableCell>{c.city}</TableCell>
                  <TableCell className="font-semibold">{c.ordersCount} orders</TableCell>
                  <TableCell className="font-semibold text-emerald-600">৳{c.totalSpentBdt} BDT</TableCell>
                  <TableCell>
                    {c.totalSpentBdt >= 3000 ? (
                      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">VIP Customer</Badge>
                    ) : (
                      <Badge variant="secondary">Regular</Badge>
                    )}
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

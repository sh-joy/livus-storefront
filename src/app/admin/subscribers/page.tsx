'use client';

import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Mail, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Subscriber {
  id: string;
  email: string;
  date: string;
  source: string;
}

const sampleSubscribers: Subscriber[] = [
  { id: "sub-1", email: "rahim.hassan@gmail.com", date: "2026-07-29", source: "Storefront Footer" },
  { id: "sub-2", email: "nusrat.jahan@yahoo.com", date: "2026-07-28", source: "Checkout Opt-in" },
  { id: "sub-3", email: "tanvir.ahmed@hotmail.com", date: "2026-07-27", source: "Storefront Footer" },
];

export default function AdminSubscribersPage() {
  const [subscribers] = useState<Subscriber[]>(sampleSubscribers);
  const [search, setSearch] = useState("");

  const filtered = subscribers.filter(s => s.email.toLowerCase().includes(search.toLowerCase()));

  const handleExportCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8,ID,Email,Date,Source\n" +
      subscribers.map(e => `${e.id},${e.email},${e.date},${e.source}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "livus_newsletter_subscribers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Newsletter Subscribers CRM</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage email audience collected from storefront footer & newsletter opt-in forms.
          </p>
        </div>

        <Button variant="outline" onClick={handleExportCsv} className="flex items-center gap-2 text-xs">
          <Download className="size-3.5" />
          <span>Export CSV</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">Subscribed Emails ({subscribers.length})</CardTitle>
            <CardDescription className="text-xs">Audience list for promotional campaigns</CardDescription>
          </div>

          <div className="w-64">
            <Input
              placeholder="Search subscriber email..."
              className="text-xs h-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subscriber Email</TableHead>
                <TableHead>Subscription Date</TableHead>
                <TableHead>Acquisition Source</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-semibold text-foreground text-xs">{sub.email}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{sub.date}</TableCell>
                  <TableCell><Badge variant="secondary">{sub.source}</Badge></TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">Active</Badge>
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

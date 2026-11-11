'use client';

import { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Mail, Download, Search, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  fetchAdminSubscribersAction,
  deleteAdminSubscriberAction,
  type SubscriberItem,
} from "@/app/actions/subscribers";

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminSubscribersAction();
      setSubscribers(data);
    } catch (err) {
      console.error("Failed to load subscribers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this subscriber?")) return;
    try {
      setSubscribers(subscribers.filter((s) => s.id !== id));
      await deleteAdminSubscriberAction(id);
    } catch (err) {
      console.error("Failed to delete subscriber:", err);
      loadSubscribers();
    }
  };

  const filtered = subscribers.filter((s) => s.email.toLowerCase().includes(search.toLowerCase()));

  const handleExportCsv = () => {
    if (subscribers.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8,ID,Email,Date,Source\n" +
      subscribers.map(e => `"${e.id}","${e.email}","${e.subscribedAt}","${e.source}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `livus_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
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

        <Button
          variant="outline"
          onClick={handleExportCsv}
          disabled={subscribers.length === 0}
          className="flex items-center gap-2 text-xs"
        >
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
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading subscribers from database...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {search ? "No subscribers match your search." : "No newsletter subscribers yet. Subscriptions via storefront footer will appear here."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subscriber Email</TableHead>
                  <TableHead>Subscription Date</TableHead>
                  <TableHead>Acquisition Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-semibold text-foreground text-xs">{sub.email}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{sub.subscribedAt}</TableCell>
                    <TableCell><Badge variant="secondary">{sub.source}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">Active</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(sub.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </Button>
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

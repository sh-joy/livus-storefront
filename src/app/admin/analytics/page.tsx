'use client';

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchAdminAnalyticsAction } from "@/app/actions/admin-actions";
import {
  TrendingUp,
  ShoppingBag,
  PackageCheck,
  RotateCcw,
  CreditCard,
  Smartphone,
  Globe,
  Loader2,
  RefreshCw,
  Clock,
  Truck,
} from "lucide-react";

interface AnalyticsData {
  grossRevenueBdt: number;
  verifiedPaidRevenueBdt?: number;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageOrderValueBdt: number;
  topProducts: Array<{ name: string; units: number; revenue: number }>;
  statusBreakdown: { Pending: number; Processing: number; Shipped: number; Delivered: number; Cancelled: number };
  paymentBreakdown: { cod: number; bkash: number; nagad: number; online: number };
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminAnalyticsAction();
      setData(res as any);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const totalOrders = data?.totalOrders || 0;
  const grossRev = data?.grossRevenueBdt || 0;
  const aov = data?.averageOrderValueBdt || 0;
  const delivered = data?.deliveredOrders || 0;
  const cancelled = data?.cancelledOrders || 0;
  const cancellationRate = totalOrders > 0 ? ((cancelled / totalOrders) * 100).toFixed(1) : "0.0";
  const fulfillmentRate = totalOrders > 0 ? ((delivered / totalOrders) * 100).toFixed(1) : "0.0";

  const codOrders = data?.paymentBreakdown.cod || 0;
  const bkashOrders = data?.paymentBreakdown.bkash || 0;
  const nagadOrders = data?.paymentBreakdown.nagad || 0;
  const digitalShare = totalOrders > 0 ? (((bkashOrders + nagadOrders) / totalOrders) * 100).toFixed(1) : "0.0";

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Analytics & Business Intelligence</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time revenue metrics, apparel product performance, order fulfillment, and payment distribution.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadAnalytics}
          disabled={loading}
          className="rounded-none text-xs flex items-center gap-1.5 h-8 bg-white border-neutral-200 hover:bg-neutral-50"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Analytics</span>
        </Button>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <Card className="rounded-none shadow-none border-neutral-200 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Order Value</CardDescription>
              <TrendingUp className="size-4 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono tracking-tight mt-1 text-neutral-900">
              {loading ? "..." : `৳${grossRev.toLocaleString()}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-neutral-500">All non-cancelled orders · Paid/Verified: ৳{(data?.verifiedPaidRevenueBdt || 0).toLocaleString()} BDT</p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="rounded-none shadow-none border-neutral-200 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Total Orders</CardDescription>
              <ShoppingBag className="size-4 text-neutral-700" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono tracking-tight mt-1 text-neutral-900">
              {loading ? "..." : totalOrders}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-neutral-500">Average: ৳{aov.toLocaleString()} BDT / order</p>
          </CardContent>
        </Card>

        {/* Delivered & Fulfilled */}
        <Card className="rounded-none shadow-none border-neutral-200 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Delivered Orders</CardDescription>
              <PackageCheck className="size-4 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono tracking-tight mt-1 text-emerald-600">
              {loading ? "..." : `${delivered} (${fulfillmentRate}%)`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-neutral-500">Completed deliveries across BD</p>
          </CardContent>
        </Card>

        {/* Cancellation Rate */}
        <Card className="rounded-none shadow-none border-neutral-200 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Cancellations</CardDescription>
              <RotateCcw className="size-4 text-rose-500" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono tracking-tight mt-1 text-rose-600">
              {loading ? "..." : `${cancelled} (${cancellationRate}%)`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-neutral-500">Cancelled prior to dispatch</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Status Breakdown */}
      <Card className="rounded-none shadow-none border-neutral-200 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">Live Fulfillment Pipeline Status</CardTitle>
          <CardDescription className="text-xs">Real-time status breakdown across all recorded orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-3 bg-amber-50/60 border border-amber-200">
              <div className="flex items-center justify-center gap-1.5 text-amber-700 text-xs font-medium uppercase mb-1">
                <Clock className="size-3" />
                <span>Pending</span>
              </div>
              <p className="text-xl font-bold font-mono text-amber-800">{data?.statusBreakdown.Pending || 0}</p>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-200">
              <div className="flex items-center justify-center gap-1.5 text-blue-700 text-xs font-medium uppercase mb-1">
                <RefreshCw className="size-3" />
                <span>Processing</span>
              </div>
              <p className="text-xl font-bold font-mono text-blue-800">{data?.statusBreakdown.Processing || 0}</p>
            </div>

            <div className="p-3 bg-purple-50/60 border border-purple-200">
              <div className="flex items-center justify-center gap-1.5 text-purple-700 text-xs font-medium uppercase mb-1">
                <Truck className="size-3" />
                <span>Shipped</span>
              </div>
              <p className="text-xl font-bold font-mono text-purple-800">{data?.statusBreakdown.Shipped || 0}</p>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200">
              <div className="flex items-center justify-center gap-1.5 text-emerald-700 text-xs font-medium uppercase mb-1">
                <PackageCheck className="size-3" />
                <span>Delivered</span>
              </div>
              <p className="text-xl font-bold font-mono text-emerald-800">{data?.statusBreakdown.Delivered || 0}</p>
            </div>

            <div className="p-3 bg-rose-50/60 border border-rose-200">
              <div className="flex items-center justify-center gap-1.5 text-rose-700 text-xs font-medium uppercase mb-1">
                <RotateCcw className="size-3" />
                <span>Cancelled</span>
              </div>
              <p className="text-xl font-bold font-mono text-rose-800">{data?.statusBreakdown.Cancelled || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Selling Products Performance */}
      <Card className="rounded-none shadow-none border-neutral-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight">Top Selling Apparel Performance</CardTitle>
          <CardDescription className="text-xs">Aggregated sales volume and gross revenue per product line</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-neutral-50/50">
              <TableRow className="border-b border-neutral-200">
                <TableHead className="font-semibold text-xs text-foreground">Product Line</TableHead>
                <TableHead className="font-semibold text-xs text-foreground">Units Sold</TableHead>
                <TableHead className="font-semibold text-xs text-foreground">Gross Revenue</TableHead>
                <TableHead className="font-semibold text-xs text-foreground">Revenue Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-xs text-neutral-400">
                    <Loader2 className="size-4 animate-spin inline-block mr-2" />
                    Calculating sales performance...
                  </TableCell>
                </TableRow>
              ) : !data?.topProducts || data.topProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-xs text-neutral-400">
                    No completed product sales recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.topProducts.map((p, i) => {
                  const share = grossRev > 0 ? ((p.revenue / grossRev) * 100).toFixed(1) : "0.0";
                  return (
                    <TableRow key={i} className="border-b border-neutral-200">
                      <TableCell className="font-medium text-xs text-foreground py-3">{p.name}</TableCell>
                      <TableCell className="font-semibold text-xs py-3">{p.units} units</TableCell>
                      <TableCell className="font-semibold text-xs text-emerald-600 py-3">৳{p.revenue.toLocaleString()} BDT</TableCell>
                      <TableCell className="font-semibold text-xs text-neutral-600 py-3">{share}%</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Methods Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-none shadow-none border-neutral-200 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Cash on Delivery (COD)</CardDescription>
              <CreditCard className="size-4 text-blue-500" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono tracking-tight mt-1">
              {codOrders} orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-neutral-500">
              {totalOrders > 0 ? `${((codOrders / totalOrders) * 100).toFixed(1)}% of total orders` : "Default payment method"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none shadow-none border-neutral-200 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium text-neutral-500 uppercase tracking-wider">bKash Manual Payments</CardDescription>
              <Smartphone className="size-4 text-pink-600" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono tracking-tight mt-1">
              {bkashOrders} orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-neutral-500">
              {totalOrders > 0 ? `${((bkashOrders / totalOrders) * 100).toFixed(1)}% of total orders` : "TrxID verification required"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none shadow-none border-neutral-200 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Nagad Manual Payments</CardDescription>
              <Smartphone className="size-4 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono tracking-tight mt-1">
              {nagadOrders} orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-neutral-500">
              {totalOrders > 0 ? `${((nagadOrders / totalOrders) * 100).toFixed(1)}% of total orders` : "TrxID verification required"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

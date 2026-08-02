import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ArrowRight, AlertTriangle, Activity, DollarSign, ShoppingBag, Users, ExternalLink } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-8 font-sans">
      {/* Top Welcome Banner */}
      <Card className="bg-[#050505] text-white border-neutral-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold tracking-tight text-white">
              Command Center Overview
            </CardTitle>
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-950/20 text-xs font-normal">
              System Live & Healthy
            </Badge>
          </div>
          <CardDescription className="text-neutral-400 text-xs mt-1">
            Real-time health check of sales, live traffic, recent orders, and stock drop alerts via Neon PostgreSQL.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Topline Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gross Sales</CardDescription>
              <DollarSign className="size-4 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight mt-1">৳142,890 BDT</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-emerald-600 font-medium">+14.2% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Revenue</CardDescription>
              <DollarSign className="size-4 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight mt-1">৳128,600 BDT</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">After discounts & refunds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Orders Today</CardDescription>
              <ShoppingBag className="size-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight mt-1">18</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Avg Order Value: ৳1,480 BDT</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Visitors</CardDescription>
              <Activity className="size-4 text-emerald-500 animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight mt-1 text-emerald-600">42 Online</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Direct 45% · Instagram 35%</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Order Stream & Low Stock Drop Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Stream (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-semibold tracking-tight">Recent Order Stream</CardTitle>
              <CardDescription className="text-xs">Live orders placed on checkout</CardDescription>
            </div>
            <Link href="/admin/orders">
              <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
                <span>View All</span>
                <ArrowRight className="size-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono font-bold text-xs">ORD-9281</TableCell>
                  <TableCell className="text-xs">Rahim Chowdhury</TableCell>
                  <TableCell className="font-semibold text-xs">৳1,139 BDT</TableCell>
                  <TableCell><Badge variant="outline" className="text-amber-600 border-amber-300">Processing</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-bold text-xs">ORD-9280</TableCell>
                  <TableCell className="text-xs">Tariq Hasan</TableCell>
                  <TableCell className="font-semibold text-xs">৳1,948 BDT</TableCell>
                  <TableCell><Badge variant="secondary">Shipped</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-bold text-xs">ORD-9279</TableCell>
                  <TableCell className="text-xs">Nusrat Jahan</TableCell>
                  <TableCell className="font-semibold text-xs">৳899 BDT</TableCell>
                  <TableCell><Badge variant="outline">Delivered</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Rapid Drop Alerts (1 col) */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              <CardTitle className="text-base font-semibold tracking-tight">Stock Drop Alerts</CardTitle>
            </div>
            <CardDescription className="text-xs">Rapid selling & low stock items</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="p-3 rounded-md bg-amber-50 border border-amber-200 flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                <span>Oakwood Long sleeve (Yellow)</span>
                <Badge variant="destructive">Low Stock</Badge>
              </div>
              <p className="text-[11px] text-amber-700">Size XL has only 3 items left. Rapid drop in progress!</p>
            </div>

            <div className="p-3 rounded-md bg-neutral-50 border border-neutral-200 flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-900">
                <span>OWAYO - CROSS FADE</span>
                <Badge variant="outline">In Stock</Badge>
              </div>
              <p className="text-[11px] text-neutral-600">Size XXL is stock out.</p>
            </div>

            <Link href="/admin/inventory" className="mt-2">
              <Button variant="default" className="w-full text-xs flex items-center justify-center gap-1">
                <span>Open Rapid Inventory Adjuster</span>
                <ArrowRight className="size-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

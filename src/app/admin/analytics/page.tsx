'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { BarChart3, TrendingUp, Globe, Smartphone } from "lucide-react";

export default function AdminAnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 font-sans">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Analytics & Traffic Acquisition Reports</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Detailed breakdown of sales performance over time and traffic sources driving customer conversions.
        </p>
      </div>

      {/* Traffic Acquisition Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium text-muted-foreground">Direct Traffic</CardDescription>
              <Globe className="size-4 text-blue-500" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight mt-1">45.2%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">6,420 sessions this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium text-muted-foreground">Instagram & Social</CardDescription>
              <Smartphone className="size-4 text-purple-500" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight mt-1">35.8%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">5,100 sessions this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium text-muted-foreground">Google Search (Organic)</CardDescription>
              <TrendingUp className="size-4 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight mt-1">19.0%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">2,710 sessions this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Products Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight">Top Selling Apparel Performance</CardTitle>
          <CardDescription className="text-xs">Product sales volume and conversion rate</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Units Sold</TableHead>
                <TableHead>Gross Revenue</TableHead>
                <TableHead>Conversion Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-foreground">Oakwood Long sleeve</TableCell>
                <TableCell className="font-semibold">84 units</TableCell>
                <TableCell className="font-semibold text-emerald-600">৳75,516 BDT</TableCell>
                <TableCell className="font-semibold">3.8%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">OWAYO - CROSS FADE</TableCell>
                <TableCell className="font-semibold">62 units</TableCell>
                <TableCell className="font-semibold text-emerald-600">৳55,738 BDT</TableCell>
                <TableCell className="font-semibold">3.2%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

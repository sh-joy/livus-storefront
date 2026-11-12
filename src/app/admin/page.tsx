'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchAdminOrders, updateOrderStatusAction, deleteAdminOrderAction } from "@/app/actions/admin-actions";
import { OrderDetailsDrawer } from "@/components/OrderDetailsDrawer";
import { formatBdt } from "@/lib/utils";
import {
  TrendingUp,
  Search,
  SlidersHorizontal,
  X,
  Filter,
  Download,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  ChevronDown,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";

interface OrderItem {
  id?: string;
  productId: string;
  productName?: string | null;
  variantName?: string | null;
  size?: string | null;
  thumbnailUrl?: string | null;
  quantity: number;
  priceBdt?: number | null;
  price?: string | null;
}

interface OrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  shippingAddress: string;
  city?: string;
  district?: string;
  postalCode?: string;
  deliveryInstructions?: string;
  subtotalBdt: number;
  vatBdt: number;
  deliveryChargeBdt: number;
  discountBdt: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

// Empty fallback list when DB has no orders
const FALLBACK_ORDERS: OrderRecord[] = [];

const TIME_RANGES = [
  { label: "24H", value: "24h" },
  { label: "1W", value: "1w" },
  { label: "1M", value: "1m" },
  { label: "6M", value: "6m" },
  { label: "1Y", value: "1y" },
  { label: "Custom", value: "custom" },
];

export default function AdminDashboardPage() {
  const [ordersList, setOrdersList] = useState<OrderRecord[]>(FALLBACK_ORDERS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState("1w");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [recordsPerPage, setRecordsPerPage] = useState(9);
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOrder, setSidebarOrder] = useState<OrderRecord | null>(null);


  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [timeFilterLabel, setTimeFilterLabel] = useState("Last 24 hours");
  const [timeFilterOpen, setTimeFilterOpen] = useState(false);

  // Fetch real database orders if available
  useEffect(() => {
    async function loadRealOrders() {
      try {
        const data = await fetchAdminOrders();
        if (data && data.length > 0) {
          setOrdersList(data);
        }
      } catch (err) {
        console.log("Using fallback orders for dashboard preview");
      }
    }
    loadRealOrders();
  }, []);

  // Filter orders matching exact logic from /admin/orders
  const filteredOrders = ordersList.filter((o) => {
    const matchesStatus = statusFilter === "all" || o.status.toLowerCase() === statusFilter.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q) ||
      (o.city && o.city.toLowerCase().includes(q)) ||
      (o.district && o.district.toLowerCase().includes(q)) ||
      (o.items && o.items.some((i) => i.productName?.toLowerCase().includes(q)));

    return matchesStatus && matchesQuery;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / recordsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice((safeCurrentPage - 1) * recordsPerPage, safeCurrentPage * recordsPerPage);

  const activeFilterCount = statusFilter !== "all" ? 1 : 0;

  const nonCancelledOrders = ordersList.filter((o) => (o.status || '').toLowerCase() !== 'cancelled');
  const totalGrossRevenue = nonCancelledOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalOrdersCount = ordersList.length;
  const cancelledOrdersCount = ordersList.filter((o) => (o.status || '').toLowerCase() === 'cancelled').length;
  const pendingOrdersCount = ordersList.filter((o) => (o.status || '').toLowerCase() === 'pending').length;
  const deliveredOrdersCount = ordersList.filter((o) => (o.status || '').toLowerCase() === 'delivered').length;
  const fulfillmentPct = totalOrdersCount > 0 ? ((deliveredOrdersCount / totalOrdersCount) * 100).toFixed(1) : "0.0";

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredOrders.map((o) => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((rowId) => rowId !== id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-300 rounded-none text-[11px] font-medium px-2 py-0.5 shadow-none">Pending</Badge>;
      case "processing":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-300 rounded-none text-[11px] font-medium px-2 py-0.5 shadow-none">Processing</Badge>;
      case "shipped":
        return <Badge className="bg-purple-50 text-purple-700 border-purple-300 rounded-none text-[11px] font-medium px-2 py-0.5 shadow-none">Shipped</Badge>;
      case "delivered":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 rounded-none text-[11px] font-medium px-2 py-0.5 shadow-none">Delivered</Badge>;
      case "cancelled":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-300 rounded-none text-[11px] font-medium px-2 py-0.5 shadow-none">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="rounded-none text-[11px] shadow-none">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-4 font-sans bg-white min-h-screen text-neutral-900">

      {/* 1. Main Page Header Bar WITH + QUICK ACTION POPUP AT TOP RIGHT */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time analytics, revenue trends, social channels &amp; order streams.
          </p>
        </div>

        {/* TOP RIGHT BUTTONS: TIME FILTER DROPDOWN & + QUICK ACTION */}
        <div className="flex items-center gap-2.5">
          {/* Time Filter Button Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTimeFilterOpen(!timeFilterOpen);
                setQuickActionOpen(false);
              }}
              className="flex items-center gap-1.5 text-xs bg-white border border-neutral-200 text-neutral-800 hover:bg-neutral-50 rounded-none shadow-none font-medium"
            >
              <span>{timeFilterLabel}</span>
              <ChevronDown className="size-3 ml-0.5 text-neutral-500" />
            </Button>

            {timeFilterOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-neutral-200 shadow-xl rounded-none w-40 py-1 font-sans text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 flex items-center justify-between">
                  <span>Time Range</span>
                  <button onClick={() => setTimeFilterOpen(false)} className="text-neutral-400 hover:text-black">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-col py-0.5">
                  {["Last 24 hours", "Last week", "Last month", "Last year"].map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => {
                        setTimeFilterLabel(tf);
                        setTimeFilterOpen(false);
                      }}
                      className={`px-3 py-1.5 text-xs text-left font-medium flex items-center justify-between transition-colors cursor-pointer ${
                        timeFilterLabel === tf
                          ? "bg-black text-white"
                          : "text-neutral-800 hover:bg-neutral-100"
                      }`}
                    >
                      <span>{tf}</span>
                      {timeFilterLabel === tf && <span className="text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* + QUICK ACTION BUTTON WITH POPOVER MENU */}
          <div className="relative">
            <Button
              size="sm"
              onClick={() => {
                setQuickActionOpen(!quickActionOpen);
                setTimeFilterOpen(false);
              }}
              className="flex items-center gap-1.5 text-xs bg-[#050505] text-white hover:bg-neutral-800 rounded-none shadow-none font-medium"
            >
              <Plus className="size-3.5" />
              <span>Quick Action</span>
              <ChevronDown className="size-3 ml-0.5 opacity-70" />
            </Button>

            {quickActionOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-neutral-200 shadow-xl rounded-none w-48 py-1 font-sans text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 flex items-center justify-between">
                  <span>Quick Create</span>
                  <button onClick={() => setQuickActionOpen(false)} className="text-neutral-400 hover:text-black">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-col py-0.5">
                  <Link
                    href="/admin/products/new"
                    onClick={() => setQuickActionOpen(false)}
                    className="px-3 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-100 flex items-center gap-2 transition-colors"
                  >
                    <Package className="size-3.5 text-neutral-500" />
                    <span>Add Product</span>
                  </Link>
                  <Link
                    href="/admin/orders"
                    onClick={() => setQuickActionOpen(false)}
                    className="px-3 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-100 flex items-center gap-2 transition-colors"
                  >
                    <ShoppingBag className="size-3.5 text-neutral-500" />
                    <span>Create Order</span>
                  </Link>
                  <Link
                    href="/admin/customers"
                    onClick={() => setQuickActionOpen(false)}
                    className="px-3 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-100 flex items-center gap-2 transition-colors"
                  >
                    <Users className="size-3.5 text-neutral-500" />
                    <span>Add Customer</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. 4 TOP METRIC CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Card 1: Order Value */}
        <div className="border border-neutral-200 bg-white p-4 font-sans rounded-none shadow-none flex flex-col justify-between">
          <p className="text-xs uppercase font-medium text-neutral-500">Order Value</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-2xl font-bold text-neutral-900 font-mono">{formatBdt(totalGrossRevenue)}</p>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">All non-cancelled orders</p>
        </div>

        {/* Card 2: Total Orders */}
        <div className="border border-neutral-200 bg-white p-4 font-sans rounded-none shadow-none flex flex-col justify-between">
          <p className="text-xs uppercase font-medium text-neutral-500">Total Orders</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-2xl font-bold text-neutral-900 font-mono">{totalOrdersCount}</p>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600">
              {pendingOrdersCount} pending
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">Across all Bangladesh divisions</p>
        </div>

        {/* Card 3: Total Cancelled */}
        <div className="border border-neutral-200 bg-white p-4 font-sans rounded-none shadow-none flex flex-col justify-between">
          <p className="text-xs uppercase font-medium text-amber-700">Cancelled Orders</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-2xl font-bold text-rose-600 font-mono">{cancelledOrdersCount}</p>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-rose-600">
              {totalOrdersCount > 0 ? ((cancelledOrdersCount / totalOrdersCount) * 100).toFixed(1) : 0}% rate
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">Returned items to inventory</p>
        </div>

        {/* Card 4: Fulfillment Rate */}
        <div className="border border-neutral-200 bg-white p-4 font-sans rounded-none shadow-none flex flex-col justify-between">
          <p className="text-xs uppercase font-medium text-neutral-500">Fulfillment Rate</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-2xl font-bold text-emerald-600 font-mono">{fulfillmentPct}%</p>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
              <TrendingUp className="size-3.5" />
              {deliveredOrdersCount} delivered
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">Completed courier delivery</p>
        </div>

      </div>


      {/* Side Slide-Over Filter Drawer Modal */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end font-sans">
          <div className="bg-white border-l border-neutral-200 w-full max-w-md h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-black" />
                <h3 className="font-bold text-sm text-foreground">Filter Orders</h3>
              </div>
              <button onClick={() => setIsFilterDrawerOpen(false)} className="p-1 text-muted-foreground hover:text-black">
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-5 overflow-y-auto flex-1 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">Order Status</label>
                <select
                  className="w-full h-9 bg-background px-3 text-xs outline-none rounded-none border border-neutral-200 focus:border-black"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Order Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-200 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="rounded-none text-xs border border-neutral-200"
              >
                Reset
              </Button>
              <Button
                size="sm"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="flex-1 rounded-none text-xs bg-black text-white hover:bg-neutral-800"
              >
                Apply Filters ({activeFilterCount})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table Section (EXACT COPIED FROM /admin/orders) */}
      <div className="flex flex-col gap-4">
        <div className="pt-2">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            All Live Orders ({filteredOrders.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            Live order statuses and customer details. Click View to inspect or edit details in sidebar.
          </p>
        </div>

        {/* Search & Filter Toolbar (Matching Orders & Products Page) */}
        <div className="flex flex-wrap items-center justify-between gap-4 w-full">
          <div className="flex items-center w-[320px]">
            <div className="relative w-full">
              <Search className="size-4 text-muted-foreground absolute left-3 top-2.5 shrink-0 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by order #, customer, phone..."
                className="text-xs h-9 rounded-none border border-neutral-200 bg-white pl-9 pr-3 w-full outline-none focus:border-black font-sans text-foreground shadow-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterDrawerOpen(true)}
            className="h-9 text-xs rounded-none border border-neutral-200 bg-white text-neutral-800 flex items-center gap-2 hover:bg-neutral-50 shadow-none font-medium"
          >
            <SlidersHorizontal className="size-3.5 text-black" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-none bg-black text-white ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Clean Orders Table (Matching Orders & Products Page structure) */}
        <div className="border border-neutral-200 bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-neutral-50/50">
              <TableRow className="border-b border-neutral-200">
                <TableHead className="w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredOrders.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="size-3.5 rounded-none accent-black cursor-pointer"
                  />
                </TableHead>
                <TableHead className="font-semibold text-xs text-foreground">Order #</TableHead>
                <TableHead className="font-semibold text-xs text-foreground">Customer</TableHead>
                <TableHead className="font-semibold text-xs text-foreground">Location</TableHead>
                <TableHead className="font-semibold text-xs text-foreground">Items</TableHead>
                <TableHead className="font-semibold text-xs text-foreground">Total Price</TableHead>
                <TableHead className="font-semibold text-xs text-foreground">Status</TableHead>
                <TableHead className="text-right font-semibold text-xs text-foreground pr-4">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-neutral-400 text-xs">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="size-5 animate-spin text-neutral-500" />
                      <span>Loading orders from database...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-neutral-400 text-xs">
                    No orders match your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((ord) => {
                  const isSelected = selectedIds.includes(ord.id);
                  const itemCount = ord.items?.length || 1;

                  return (
                    <TableRow key={ord.id} className={`border-b border-neutral-200 hover:bg-neutral-50/80 transition-colors ${isSelected ? "bg-neutral-50" : ""}`}>
                      {/* Checkbox */}
                      <TableCell className="text-center w-12 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(ord.id, e.target.checked)}
                          className="size-3.5 rounded-none accent-black cursor-pointer"
                        />
                      </TableCell>

                      {/* Order # */}
                      <TableCell className="py-3 font-sans">
                        <span className="font-semibold text-xs text-foreground block">{ord.orderNumber}</span>
                        <span className="text-[11px] text-neutral-400 block mt-0.5">{ord.createdAt}</span>
                      </TableCell>

                      {/* Customer */}
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-xs text-foreground">{ord.customerName}</span>
                          <span className="text-[11px] font-mono text-neutral-500">{ord.phone}</span>
                        </div>
                      </TableCell>

                      {/* Location */}
                      <TableCell className="py-3">
                        <span className="text-xs text-neutral-700 font-medium block">
                          {ord.district || ord.city || "Bangladesh"}
                        </span>
                        {ord.city && ord.district && (
                          <span className="text-[11px] text-neutral-400 block">{ord.city}</span>
                        )}
                      </TableCell>

                      {/* Items */}
                      <TableCell className="py-3">
                        <Badge variant="outline" className="rounded-none text-[11px] font-medium border-neutral-200">
                          {itemCount} {itemCount === 1 ? "Item" : "Items"}
                        </Badge>
                      </TableCell>

                      {/* Total Price */}
                      <TableCell className="py-3 font-semibold text-xs text-foreground">
                        {formatBdt(ord.totalAmount)}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3">
                        {getStatusBadge(ord.status)}
                      </TableCell>

                      {/* Action: ONLY View Button */}
                      <TableCell className="py-3 text-right pr-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSidebarOrder(ord)}
                          className="h-8 text-xs rounded-none border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100 flex items-center gap-1.5 px-3 font-medium ml-auto"
                        >
                          <Eye className="size-3.5 text-neutral-600" />
                          <span>View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Table Footer Controls */}
          <div className="p-4 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-sans">
            <div className="flex items-center gap-2 text-neutral-500">
              <span>Showing</span>
              <select
                value={recordsPerPage}
                onChange={(e) => setRecordsPerPage(Number(e.target.value))}
                className="bg-white border border-neutral-200 rounded-none px-2 py-1 text-xs text-neutral-800 focus:outline-none cursor-pointer"
              >
                <option value={9}>9</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>of {filteredOrders.length} records</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
                className="p-1.5 border border-neutral-200 rounded-none hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => setCurrentPage(pNum)}
                  className={`px-2.5 py-1 font-medium rounded-none text-xs transition-colors ${
                    pNum === safeCurrentPage
                      ? "bg-black text-white"
                      : "hover:bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {pNum}
                </button>
              ))}
              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
                className="p-1.5 border border-neutral-200 rounded-none hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Slide-over OrderDetailsDrawer when clicking View */}
      {sidebarOrder && (
        <OrderDetailsDrawer
          order={{
            id: sidebarOrder.id,
            orderNumber: sidebarOrder.orderNumber,
            customerName: sidebarOrder.customerName,
            phone: sidebarOrder.phone,
            email: sidebarOrder.email || undefined,
            shippingAddress: sidebarOrder.shippingAddress,
            city: sidebarOrder.city || undefined,
            district: sidebarOrder.district || undefined,
            subtotalBdt: Number(sidebarOrder.subtotalBdt) || 0,
            vatBdt: Number(sidebarOrder.vatBdt) || 0,
            deliveryChargeBdt: Number(sidebarOrder.deliveryChargeBdt) || 0,
            totalAmount: Number(sidebarOrder.totalAmount) || 0,
            paymentMethod: sidebarOrder.paymentMethod,
            paymentStatus: sidebarOrder.paymentStatus,
            status: sidebarOrder.status,
            createdAt: String(sidebarOrder.createdAt),
            items: (sidebarOrder.items || []).map((it) => ({
              name: it.productName || 'Apparel Item',
              variant: it.variantName || 'Primary',
              size: it.size || 'M',
              quantity: it.quantity,
              priceBdt: it.priceBdt || parseFloat(it.price || '0') || 0,
              price: formatBdt(it.priceBdt || parseFloat(it.price || '0') || 0),
              thumbnailUrl: it.thumbnailUrl || '/images/for_him.jpg',
            })),
          }}
          onClose={() => setSidebarOrder(null)}
          onStatusChange={async (orderId: string, newStatus: string) => {
            const res = await updateOrderStatusAction(orderId, newStatus);
            if (res?.success !== false) {
              setOrdersList((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
              setSidebarOrder((prev) => (prev && prev.id === orderId ? { ...prev, status: newStatus } : prev));
            }
          }}
          onEditSave={async () => {
            // Full editing lives on the Orders page; reload the list so the dashboard reflects changes.
            const fresh = await fetchAdminOrders();
            setOrdersList(fresh as typeof ordersList);
          }}
          onDeleteOrder={async (order) => {
            if (!confirm(`Delete order ${order.orderNumber}? This cannot be undone.`)) return;
            await deleteAdminOrderAction(order.id);
            setOrdersList((prev) => prev.filter((o) => o.id !== order.id));
            setSidebarOrder(null);
          }}
        />
      )}

    </div>
  );
}

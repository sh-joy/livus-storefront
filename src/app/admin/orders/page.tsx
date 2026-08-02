'use client';

import { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  fetchAdminOrders,
  updateOrderStatusAction,
  createAdminOrderAction,
  editAdminOrderAction,
  deleteAdminOrderAction,
} from "@/app/actions/admin-actions";
import { getAllInventorySkusAction } from "@/app/actions/products";
import { OrderDetailsDrawer } from "@/components/OrderDetailsDrawer";
import {
  Search,
  SlidersHorizontal,
  Clock,
  Truck,
  CheckCircle2,
  Phone,
  MapPin,
  User,
  ShoppingBag,
  Loader2,
  Plus,
  Trash2,
  X,
  Save,
  Barcode,
  Eye,
  Check,
} from "lucide-react";

const REGION_CITIES_MAP: Record<string, string[]> = {
  "Dhaka Division": [
    "Dhaka", "Gazipur", "Narayanganj", "Tangail", "Faridpur",
    "Manikganj", "Munshiganj", "Narsingdi", "Rajbari", "Shariatpur",
    "Gopalganj", "Madaripur"
  ],
  "Chittagong Division": [
    "Chittagong", "Cox's Bazar", "Cumilla", "Feni", "Noakhali",
    "Brahmanbaria", "Chandpur", "Khagrachhari", "Rangamati", "Bandarban"
  ],
  "Sylhet Division": [
    "Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"
  ],
  "Rajshahi Division": [
    "Rajshahi", "Bogra", "Pabna", "Naogaon", "Natore",
    "Nawabganj", "Joypurhat", "Sirajganj"
  ],
  "Khulna Division": [
    "Khulna", "Jeshore", "Kushtia", "Satkhira", "Bagerhat",
    "Chuadanga", "Jhenaidah", "Magura", "Meherpur", "Narail"
  ],
  "Barishal Division": [
    "Barishal", "Bhola", "Barguna", "Jhalokati", "Patuakhali", "Pirojpur"
  ],
  "Rangpur Division": [
    "Rangpur", "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat",
    "Nilphamari", "Panchagarh", "Thakurgaon"
  ],
  "Mymensingh Division": [
    "Mymensingh", "Jamalpur", "Netrokona", "Sherpur"
  ]
};

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

interface SkuOption {
  sku: string;
  size: string;
  quantity: number;
  variantName: string;
  thumbnailUrl: string;
  productName: string;
  priceBdt: number;
}

export default function AdminOrdersPage() {
  const [ordersList, setOrdersList] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Inventory SKUs
  const [inventorySkus, setInventorySkus] = useState<SkuOption[]>([]);
  const [selectedSku, setSelectedSku] = useState<string>("");

  // Sidebar Drawer state for View & Full Management (Edit / Delete / Status)
  const [sidebarOrder, setSidebarOrder] = useState<OrderRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state inside sidebar
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editStatus, setEditStatus] = useState("Pending");
  const [savingEdit, setSavingEdit] = useState(false);

  // Create Order Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [createDistrict, setCreateDistrict] = useState("Dhaka Division");
  const [createCity, setCreateCity] = useState("Dhaka");
  const [createStatus, setCreateStatus] = useState("Pending");
  const [itemTitle, setItemTitle] = useState("LIVUS Apparel Jersey");
  const [itemVariant, setItemVariant] = useState("Primary");
  const [itemSize, setItemSize] = useState("M");
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(1450);
  const [skuSearchTerm, setSkuSearchTerm] = useState("");
  const [creatingOrder, setCreatingOrder] = useState(false);

  // Delete Confirm Dialog state
  const [deletingOrder, setDeletingOrder] = useState<OrderRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, skusData] = await Promise.all([
        fetchAdminOrders(),
        getAllInventorySkusAction(),
      ]);
      setOrdersList(ordersData || []);
      setInventorySkus(skusData || []);
    } catch (err) {
      console.error("Failed to load admin orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectSku = (skuVal: string) => {
    setSelectedSku(skuVal);
    const found = inventorySkus.find((s) => s.sku === skuVal);
    if (found) {
      setItemTitle(found.productName);
      setItemVariant(found.variantName);
      setItemSize(found.size);
      setItemPrice(found.priceBdt);
    }
  };

  const filteredSkus = inventorySkus.filter((s) => {
    if (!skuSearchTerm.trim()) return true;
    const term = skuSearchTerm.toLowerCase().trim();
    return (
      s.sku.toLowerCase().includes(term) ||
      s.productName.toLowerCase().includes(term) ||
      s.variantName.toLowerCase().includes(term) ||
      s.size.toLowerCase().includes(term)
    );
  });

  const openSidebar = (order: OrderRecord, editMode = false) => {
    setSidebarOrder(order);
    setIsEditing(editMode);
    setEditName(order.customerName);
    setEditPhone(order.phone);
    setEditEmail(order.email || "");
    setEditAddress(order.shippingAddress);
    setEditCity(order.city || "");
    setEditDistrict(order.district || "");
    setEditStatus(order.status);
  };

  const closeSidebar = () => {
    setSidebarOrder(null);
    setIsEditing(false);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await updateOrderStatusAction(orderId, newStatus);
      if (res.success) {
        setOrdersList((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: newStatus,
                  paymentStatus: newStatus === "Delivered" ? "Paid (COD Collected)" : o.paymentStatus,
                }
              : o
          )
        );
        if (sidebarOrder && sidebarOrder.id === orderId) {
          setSidebarOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: newStatus,
                  paymentStatus: newStatus === "Delivered" ? "Paid (COD Collected)" : prev.paymentStatus,
                }
              : null
          );
          setEditStatus(newStatus);
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!sidebarOrder) return;
    setSavingEdit(true);
    try {
      const res = await editAdminOrderAction({
        orderId: sidebarOrder.id,
        customerName: editName,
        phone: editPhone,
        email: editEmail,
        shippingAddress: editAddress,
        city: editCity,
        district: editDistrict,
        status: editStatus,
      });

      if (res.success) {
        setOrdersList((prev) =>
          prev.map((o) =>
            o.id === sidebarOrder.id
              ? {
                  ...o,
                  customerName: editName,
                  phone: editPhone,
                  email: editEmail,
                  shippingAddress: editAddress,
                  city: editCity,
                  district: editDistrict,
                  status: editStatus,
                }
              : o
          )
        );
        setIsEditing(false);
        closeSidebar();
      }
    } catch (err) {
      console.error("Failed to save order edit:", err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createPhone.trim() || !createDistrict.trim()) {
      alert("Please fill in customer name, phone, and district.");
      return;
    }

    setCreatingOrder(true);
    try {
      const res = await createAdminOrderAction({
        customerName: createName,
        phone: createPhone,
        email: createEmail,
        shippingAddress: createAddress,
        city: createCity,
        district: createDistrict,
        status: createStatus,
        items: [
          {
            productName: itemTitle,
            variantName: itemVariant,
            size: itemSize,
            quantity: itemQty,
            priceBdt: itemPrice,
          },
        ],
      });

      if (res.success) {
        setCreateModalOpen(false);
        setCreateName("");
        setCreatePhone("");
        setCreateEmail("");
        setCreateAddress("");
        setSelectedSku("");
        loadData();
      } else {
        alert(res.message || "Failed to create order");
      }
    } catch (err) {
      console.error("Failed to create admin order:", err);
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deletingOrder) return;
    setIsDeleting(true);
    try {
      const res = await deleteAdminOrderAction(deletingOrder.id);
      if (res.success) {
        setOrdersList((prev) => prev.filter((o) => o.id !== deletingOrder.id));
        if (sidebarOrder?.id === deletingOrder.id) closeSidebar();
        setDeletingOrder(null);
      }
    } catch (err) {
      console.error("Failed to delete order:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Selection Checkbox Handlers
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

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-300 rounded-none text-[11px] font-medium px-2 py-0.5">Pending</Badge>;
      case "processing":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-300 rounded-none text-[11px] font-medium px-2 py-0.5">Processing</Badge>;
      case "shipped":
        return <Badge className="bg-purple-50 text-purple-700 border-purple-300 rounded-none text-[11px] font-medium px-2 py-0.5">Shipped</Badge>;
      case "delivered":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 rounded-none text-[11px] font-medium px-2 py-0.5">Delivered</Badge>;
      case "cancelled":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-300 rounded-none text-[11px] font-medium px-2 py-0.5">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="rounded-none text-[11px]">{status}</Badge>;
    }
  };

  const pendingCount = ordersList.filter((o) => o.status === "Pending").length;
  const processingCount = ordersList.filter((o) => o.status === "Processing").length;
  const shippedCount = ordersList.filter((o) => o.status === "Shipped").length;
  const deliveredCount = ordersList.filter((o) => o.status === "Delivered").length;

  const activeFilterCount = statusFilter !== "all" ? 1 : 0;

  return (
    <div className="flex flex-col gap-4 font-sans relative">
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

      {/* Main Page Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage customer orders, shipping details, and status updates.
          </p>
        </div>

        {/* Action Button: Add New Order */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 text-xs bg-[#050505] text-white hover:bg-neutral-800 rounded-none shadow-none font-medium"
          >
            <Plus className="size-3.5" />
            <span>Create Order</span>
          </Button>
        </div>
      </div>

      {/* Subpage Navigation Tabs */}
      <div className="flex items-center gap-6 border-b border-neutral-200">
        <button
          onClick={() => setStatusFilter("all")}
          className={`pb-3 text-xs font-semibold tracking-tight transition-colors border-b-2 ${
            statusFilter === "all"
              ? "border-black text-black"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          All Orders ({ordersList.length})
        </button>
        <button
          onClick={() => setStatusFilter("pending")}
          className={`pb-3 text-xs font-semibold tracking-tight transition-colors border-b-2 ${
            statusFilter === "pending"
              ? "border-black text-black"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setStatusFilter("processing")}
          className={`pb-3 text-xs font-semibold tracking-tight transition-colors border-b-2 ${
            statusFilter === "processing"
              ? "border-black text-black"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          Processing ({processingCount})
        </button>
      </div>

      {/* 4 Metric Cards (Matching /admin/products layout) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-neutral-200 bg-white p-4 font-sans rounded-none shadow-none">
          <p className="text-xs uppercase font-medium text-neutral-500">Pending Orders</p>
          <p className="text-2xl font-bold mt-1 text-neutral-900">{pendingCount}</p>
        </div>

        <div className="border border-neutral-200 bg-white p-4 font-sans rounded-none shadow-none">
          <p className="text-xs uppercase font-medium text-blue-700">Processing Orders</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{processingCount}</p>
        </div>

        <div className="border border-neutral-200 bg-white p-4 font-sans rounded-none shadow-none">
          <p className="text-xs uppercase font-medium text-purple-700">Shipped Orders</p>
          <p className="text-2xl font-bold mt-1 text-purple-600">{shippedCount}</p>
        </div>

        <div className="border border-neutral-200 bg-white p-4 font-sans rounded-none shadow-none">
          <p className="text-xs uppercase font-medium text-emerald-700">Delivered Orders</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{deliveredCount}</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex flex-col gap-4">
        <div className="pt-2">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            All Live Orders ({filteredOrders.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            Live order statuses and customer details. Click View to inspect or edit details in sidebar.
          </p>
        </div>

        {/* Search & Filter Toolbar (Matching Products Page) */}
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

        {/* Clean Orders Table (Matching Products Page structure) */}
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
                filteredOrders.map((ord) => {
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
                        ৳{ord.totalAmount.toLocaleString()} BDT
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
                          onClick={() => openSidebar(ord, false)}
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
        </div>
      </div>

      {/* Slide-over Sidebar Drawer using OrderDetailsDrawer */}
      {sidebarOrder && (
        <OrderDetailsDrawer
          order={{
            id: sidebarOrder.id,
            orderNumber: sidebarOrder.orderNumber,
            customerName: sidebarOrder.customerName,
            phone: sidebarOrder.phone,
            email: sidebarOrder.email,
            shippingAddress: sidebarOrder.shippingAddress,
            city: sidebarOrder.city,
            district: sidebarOrder.district,
            subtotalBdt: sidebarOrder.subtotalBdt,
            vatBdt: sidebarOrder.vatBdt,
            deliveryChargeBdt: sidebarOrder.deliveryChargeBdt,
            totalAmount: sidebarOrder.totalAmount,
            paymentMethod: sidebarOrder.paymentMethod,
            paymentStatus: sidebarOrder.paymentStatus,
            status: sidebarOrder.status,
            createdAt: sidebarOrder.createdAt,
            items: (sidebarOrder.items || []).map((i) => ({
              name: i.productName || 'Apparel Item',
              variant: i.variantName || 'Primary',
              size: i.size || 'M',
              quantity: i.quantity,
              price: `৳${(i.priceBdt || 0).toLocaleString()} BDT`,
              priceBdt: i.priceBdt || 0,
              thumbnailUrl: i.thumbnailUrl || '/images/for_him.jpg',
            })),
          }}
          allOrders={ordersList.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customerName,
            phone: o.phone,
            email: o.email,
            shippingAddress: o.shippingAddress,
            city: o.city,
            district: o.district,
            subtotalBdt: o.subtotalBdt,
            vatBdt: o.vatBdt,
            deliveryChargeBdt: o.deliveryChargeBdt,
            totalAmount: o.totalAmount,
            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            status: o.status,
            createdAt: o.createdAt,
            items: [],
          }))}
          onClose={closeSidebar}
          onStatusChange={async (orderId, newStatus) => {
            await handleStatusChange(orderId, newStatus);
          }}
          onEditSave={async (updatedData) => {
            const res = await editAdminOrderAction({
              orderId: sidebarOrder.id,
              customerName: updatedData.customerName,
              phone: updatedData.phone,
              email: updatedData.email,
              shippingAddress: updatedData.shippingAddress,
              city: updatedData.city,
              district: updatedData.district,
              status: sidebarOrder.status,
            });
            if (res.success) {
              const rawItems = updatedData.items || sidebarOrder.items;
              const newItems = rawItems.map((it: any) => ({
                ...it,
                productId: it.productId || 'prod-1',
                productTitle: it.name || it.productTitle || 'Product',
                name: it.name || it.productTitle || 'Product',
                variantName: it.variant || it.variantName || 'Primary',
                variant: it.variant || it.variantName || 'Primary',
                size: it.size || 'M',
                quantity: it.quantity,
                price: `৳${it.priceBdt} BDT`,
                priceBdt: it.priceBdt,
                thumbnailUrl: it.thumbnailUrl,
              }));

              const newSubtotal = newItems.reduce((sum: number, i: any) => sum + ((i.priceBdt || 0) * (i.quantity || 1)), 0);
              const newVat = Math.round((newSubtotal * 10) / 100);
              const newDelivery = sidebarOrder.deliveryChargeBdt || 150;
              const newGrandTotal = newSubtotal + newVat + newDelivery;

              setOrdersList((prev) =>
                prev.map((o) =>
                  o.id === sidebarOrder.id
                    ? {
                        ...o,
                        customerName: updatedData.customerName,
                        phone: updatedData.phone,
                        email: updatedData.email,
                        shippingAddress: updatedData.shippingAddress,
                        city: updatedData.city,
                        district: updatedData.district,
                        staffNotes: updatedData.staffNotes,
                        items: newItems,
                        subtotalBdt: newSubtotal,
                        vatBdt: newVat,
                        deliveryChargeBdt: newDelivery,
                        totalAmount: newGrandTotal,
                      }
                    : o
                )
              );
              setSidebarOrder((prev) =>
                prev
                  ? {
                      ...prev,
                      customerName: updatedData.customerName,
                      phone: updatedData.phone,
                      email: updatedData.email,
                      shippingAddress: updatedData.shippingAddress,
                      city: updatedData.city,
                      district: updatedData.district,
                      staffNotes: updatedData.staffNotes,
                      items: newItems,
                      subtotalBdt: newSubtotal,
                      vatBdt: newVat,
                      deliveryChargeBdt: newDelivery,
                      totalAmount: newGrandTotal,
                    }
                  : null
              );
            }
          }}
          onDeleteOrder={() => {
            setDeletingOrder(sidebarOrder);
          }}
        />
      )}

      {/* Create Order Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-4xl font-sans max-h-[90vh] overflow-y-auto rounded-none">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg font-bold text-neutral-900">Create New Order</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Manually record a Cash on Delivery customer order using Region/City tree and product SKUs.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOrder} className="flex flex-col gap-4 text-xs py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-700 font-semibold block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="w-full p-2 border border-neutral-300 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-neutral-700 font-semibold block mb-1">Phone Number (BD 11-digit) *</label>
                <input
                  type="text"
                  required
                  value={createPhone}
                  onChange={(e) => setCreatePhone(e.target.value)}
                  placeholder="01712345678"
                  className="w-full p-2 border border-neutral-300 outline-none focus:border-black"
                />
              </div>
            </div>

            <div>
              <label className="text-neutral-700 font-semibold block mb-1">Email Address (Optional)</label>
              <input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full p-2 border border-neutral-300 outline-none focus:border-black"
              />
            </div>

            {/* Region / Division & City Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-700 font-semibold block mb-1">State / Region (District) *</label>
                <select
                  required
                  value={createDistrict}
                  onChange={(e) => {
                    const newRegion = e.target.value;
                    setCreateDistrict(newRegion);
                    const validCities = REGION_CITIES_MAP[newRegion] || [];
                    if (createCity && !validCities.includes(createCity)) {
                      setCreateCity("");
                    }
                  }}
                  className="w-full p-2 border border-neutral-300 bg-white outline-none focus:border-black cursor-pointer rounded-none"
                >
                  <option value="" disabled>Select State / Region *</option>
                  {Object.keys(REGION_CITIES_MAP).map((regionName) => (
                    <option key={regionName} value={regionName}>{regionName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-neutral-700 font-semibold block mb-1">City *</label>
                <select
                  value={createCity}
                  onChange={(e) => setCreateCity(e.target.value)}
                  disabled={!createDistrict}
                  className="w-full p-2 border border-neutral-300 bg-white outline-none focus:border-black cursor-pointer rounded-none disabled:bg-neutral-100 disabled:cursor-not-allowed"
                >
                  <option value="">{createDistrict ? "Select City *" : "Select State / Region first *"}</option>
                  {(REGION_CITIES_MAP[createDistrict] || []).map((cityName) => (
                    <option key={cityName} value={cityName}>{cityName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-neutral-700 font-semibold block mb-1">Street Address *</label>
              <input
                type="text"
                required
                value={createAddress}
                onChange={(e) => setCreateAddress(e.target.value)}
                placeholder="123 Jersey Street, Apt 4B"
                className="w-full p-2 border border-neutral-300 outline-none focus:border-black rounded-none"
              />
            </div>

            {/* Product SKU Selection Engine & Live Stock Indicator */}
            <div className="border-t border-neutral-200 pt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-900 flex items-center gap-1.5 text-xs">
                  <Barcode className="size-4 text-neutral-600" />
                  Product SKU Lookup &amp; Stock Selection
                </span>
                <span className="text-[11px] text-neutral-500">Search by SKU or product title</span>
              </div>

              {/* SKU Live Search Input & Interactive Results List */}
              <div className="flex flex-col gap-2 relative">
                <label className="text-neutral-700 font-semibold block">Search Product SKU or Title</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={skuSearchTerm}
                    onChange={(e) => setSkuSearchTerm(e.target.value)}
                    placeholder="Type SKU or product name to search (e.g. LIV-SH-HIM, Jersey, Pants)..."
                    className="w-full pl-3 pr-8 py-2 border border-neutral-300 bg-white text-xs outline-none focus:border-black rounded-none"
                  />
                  {skuSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setSkuSearchTerm("")}
                      className="absolute right-2 text-neutral-400 hover:text-black text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* SKU Search Results Dropdown List */}
                {skuSearchTerm.trim() !== "" && (
                  <div className="border border-neutral-300 bg-white shadow-xl max-h-60 overflow-y-auto divide-y divide-neutral-100 z-50 rounded-none">
                    {filteredSkus.length === 0 ? (
                      <div className="p-3 text-xs text-neutral-500 italic">No matching SKUs found.</div>
                    ) : (
                      filteredSkus.map((s) => (
                        <div
                          key={s.sku}
                          onClick={() => {
                            handleSelectSku(s.sku);
                            setSkuSearchTerm("");
                          }}
                          className={`p-2.5 hover:bg-neutral-100 cursor-pointer flex items-center justify-between transition-colors ${
                            selectedSku === s.sku ? 'bg-neutral-100 font-medium' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-10 aspect-[3/4] border border-neutral-200 overflow-hidden shrink-0 bg-neutral-100">
                              <img src={s.thumbnailUrl || "/images/for_him.jpg"} alt="" className="w-full h-full object-cover aspect-[3/4]" />
                            </div>
                            <div>
                              <span className="font-bold text-xs text-neutral-900 block">{s.productName}</span>
                              <span className="text-[11px] font-mono text-neutral-500 block">
                                SKU: <strong className="text-black">{s.sku}</strong> ({s.variantName} / Size: {s.size})
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-xs text-neutral-900 block">৳{s.priceBdt} BDT</span>
                            <span className={`text-[10px] font-mono ${s.quantity > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {s.quantity > 0 ? `Stock: ${s.quantity} Units` : 'Out of stock'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Quick Dropdown SKU Selector */}
              {inventorySkus.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-neutral-500 text-[11px] block">Or choose from full list:</label>
                  <select
                    value={selectedSku}
                    onChange={(e) => handleSelectSku(e.target.value)}
                    className="w-full p-2 border border-neutral-300 bg-white text-xs font-mono outline-none focus:border-black cursor-pointer rounded-none"
                  >
                    <option value="">-- Choose an existing Product SKU --</option>
                    {inventorySkus.map((s) => (
                      <option key={s.sku} value={s.sku}>
                        {s.sku} — {s.productName} ({s.variantName} / {s.size}) — ৳{s.priceBdt} BDT (Stock: {s.quantity} Units)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* SKU Item Details & Live Stock Indicator Card */}
              {selectedSku && (
                <div className="p-3 border border-neutral-200 bg-neutral-50 flex items-center justify-between rounded-none">
                  <div>
                    <span className="font-bold text-xs text-neutral-900 block">{itemTitle}</span>
                    <span className="text-[11px] text-neutral-500 block">{itemVariant} / Size: {itemSize}</span>
                    <span className="text-xs font-semibold text-neutral-800 mt-0.5 block">Price: ৳{itemPrice} BDT</span>
                  </div>

                  <div className="text-right">
                    {(() => {
                      const foundSku = inventorySkus.find((s) => s.sku === selectedSku);
                      const stockQty = foundSku ? foundSku.quantity : 10;
                      return (
                        <Badge
                          variant="outline"
                          className={`rounded-none text-[11px] font-mono px-2 py-0.5 ${
                            stockQty > 0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-rose-50 text-rose-700 border-rose-300"
                          }`}
                        >
                          {stockQty > 0 ? `Stock: ${stockQty} Units Available` : "Out of Stock"}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Items Table View (0px Borders) */}
              <div className="space-y-2 mt-1">
                <span className="font-bold text-xs text-neutral-900 block">Order Items Table</span>
                <div className="border border-neutral-200 overflow-hidden rounded-none">
                  <Table>
                    <TableHeader className="bg-neutral-50">
                      <TableRow className="border-b border-neutral-200">
                        <TableHead className="text-xs text-neutral-700 w-12">Img</TableHead>
                        <TableHead className="text-xs text-neutral-700">Product &amp; SKU</TableHead>
                        <TableHead className="text-xs text-neutral-700 text-right">Price</TableHead>
                        <TableHead className="text-xs text-neutral-700 text-center w-28">Quantity</TableHead>
                        <TableHead className="text-xs text-neutral-700 text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-b border-neutral-200">
                        <TableCell className="py-2 w-12">
                          <div className="w-8 h-10 aspect-[3/4] border border-neutral-200 overflow-hidden bg-neutral-100 shrink-0 rounded-none">
                            <img
                              src={inventorySkus.find(s => s.sku === selectedSku)?.thumbnailUrl || "/images/for_him.jpg"}
                              alt=""
                              className="size-full object-cover aspect-[3/4]"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="font-bold text-xs text-neutral-900 block">{itemTitle}</span>
                          <span className="text-[10px] font-mono text-neutral-500 block">{selectedSku || 'DEFAULT-SKU'}</span>
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono text-xs">৳{itemPrice} BDT</TableCell>
                        {/* Quantity Stepper in Table */}
                        <TableCell className="py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                              className="size-6 border border-neutral-300 bg-white flex items-center justify-center text-xs font-bold rounded-none hover:bg-neutral-100 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-bold text-xs text-neutral-900 w-4 text-center">{itemQty}</span>
                            <button
                              type="button"
                              onClick={() => setItemQty(itemQty + 1)}
                              className="size-6 border border-neutral-300 bg-white flex items-center justify-center text-xs font-bold rounded-none hover:bg-neutral-100 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-right font-bold text-xs text-neutral-900">
                          ৳{(itemPrice * itemQty).toLocaleString()} BDT
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-3 mt-2">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)} className="rounded-none text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={creatingOrder} className="bg-black hover:bg-neutral-800 text-white rounded-none text-xs gap-1.5 font-semibold">
                {creatingOrder && <Loader2 className="size-3.5 animate-spin" />}
                <span>Create Order</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingOrder} onOpenChange={() => setDeletingOrder(null)}>
        <DialogContent className="max-w-md font-sans rounded-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2 text-rose-600">
              <Trash2 className="size-5" />
              <span>Delete Order {deletingOrder?.orderNumber}?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-600 mt-2">
              Are you sure you want to permanently delete order <strong className="text-neutral-900">{deletingOrder?.orderNumber}</strong> for customer <strong className="text-neutral-900">{deletingOrder?.customerName}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <Button variant="outline" onClick={() => setDeletingOrder(null)} disabled={isDeleting} className="rounded-none">
              Cancel
            </Button>
            <Button onClick={handleDeleteOrder} disabled={isDeleting} className="bg-rose-600 text-white hover:bg-rose-700 rounded-none gap-1.5">
              {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
              <span>Permanently Delete</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

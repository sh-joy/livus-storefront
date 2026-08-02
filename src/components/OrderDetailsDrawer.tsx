'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  Clock, 
  Truck, 
  PackageCheck,
  Edit3,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  Printer,
  RotateCcw,
  ChevronDown,
  Activity,
  Plus,
  Minus,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateOrderInvoiceHtml } from '@/lib/invoiceGenerator';

export interface OrderDrawerItem {
  name: string;
  variant: string;
  size: string;
  quantity: number;
  price: string;
  priceBdt: number;
  thumbnailUrl?: string;
}

export interface OrderDrawerRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  shippingAddress: string;
  city?: string;
  district?: string;
  subtotalBdt: number;
  vatBdt: number;
  deliveryChargeBdt: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  items: OrderDrawerItem[];
  staffNotes?: string;
}

export interface TimelineLogItem {
  id: string;
  title: string;
  timestamp: string;
}

interface OrderDetailsDrawerProps {
  order: OrderDrawerRecord;
  allOrders?: OrderDrawerRecord[];
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: string) => Promise<void>;
  onEditSave: (updatedData: {
    customerName: string;
    phone: string;
    email: string;
    shippingAddress: string;
    district: string;
    city: string;
    staffNotes?: string;
    items?: OrderDrawerItem[];
  }) => Promise<void>;
  onDeleteOrder: (order: OrderDrawerRecord) => void;
}

function CopyableItem({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!value) return null;

  return (
    <div
      onClick={handleCopy}
      title={`Click to copy ${label.toLowerCase()}`}
      className="group relative cursor-pointer p-0.5 rounded-none transition-colors hover:bg-neutral-100/70"
    >
      <span className="text-[11px] text-neutral-500 font-normal block leading-tight">{label}</span>
      <div className="flex items-center space-x-1.5 mt-0.5">
        <span className="text-xs font-medium text-neutral-900 break-words leading-tight">{value}</span>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center text-neutral-400 group-hover:text-black">
          {copied ? (
            <span className="flex items-center text-xs text-emerald-600 font-medium space-x-0.5">
              <Check className="w-3 h-3" />
              <span className="text-[10px]">Copied</span>
            </span>
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </span>
      </div>
    </div>
  );
}

export function OrderDetailsDrawer({
  order,
  allOrders = [],
  onClose,
  onStatusChange,
  onEditSave,
  onDeleteOrder,
}: OrderDetailsDrawerProps) {
  const [status, setStatus] = useState<string>(order.status || 'Pending');
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Status Selector Dropdown Popover
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // Unclipped Viewport Hover Image Preview Popover State
  const [hoveredImagePreview, setHoveredImagePreview] = useState<{
    url: string;
    name: string;
    details: string;
  } | null>(null);

  // Confirmation Modals
  const [confirmUnsavedOpen, setConfirmUnsavedOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmRevertOpen, setConfirmRevertOpen] = useState(false);
  const [pendingRevertStatus, setPendingRevertStatus] = useState<string>('');

  // Editable customer info, staff notes, and ordered items
  const [customerName, setCustomerName] = useState(order.customerName);
  const [phone, setPhone] = useState(order.phone);
  const [email, setEmail] = useState(order.email || '');
  const [shippingAddress, setShippingAddress] = useState(order.shippingAddress);
  const [district, setDistrict] = useState(order.district || '');
  const [city, setCity] = useState(order.city || '');

  const notesStorageKey = `my_store_order_notes_${order.id}`;
  const [staffNotes, setStaffNotes] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(notesStorageKey);
      if (stored !== null) return stored;
    }
    return order.staffNotes || '';
  });
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);

  const [editableItems, setEditableItems] = useState<OrderDrawerItem[]>(order.items || []);

  const [vatRatePct, setVatRatePct] = useState(10);

  // Persistent Order Activity Timeline logs in localStorage
  const storageKey = `my_store_order_timeline_${order.id}`;

  const [timelineLogs, setTimelineLogs] = useState<TimelineLogItem[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (err) {
          console.error("Failed to parse stored timeline logs:", err);
        }
      }
    }
    return [
      {
        id: 'init-1',
        title: 'Order Placed (Pending)',
        timestamp: order.createdAt || new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  const saveLogsToStorage = (logs: TimelineLogItem[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(logs));
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("my_store_vat_percent");
      if (stored && !isNaN(parseFloat(stored))) {
        setVatRatePct(parseFloat(stored));
      }
    }
  }, []);

  const hasUnsavedChanges = isEditing && (
    customerName !== order.customerName ||
    phone !== order.phone ||
    email !== (order.email || '') ||
    shippingAddress !== order.shippingAddress ||
    district !== (order.district || '') ||
    city !== (order.city || '') ||
    staffNotes !== (order.staffNotes || '') ||
    JSON.stringify(editableItems) !== JSON.stringify(order.items)
  );

  const handleAttemptClose = () => {
    if (hasUnsavedChanges) {
      setConfirmUnsavedOpen(true);
    } else {
      onClose();
    }
  };

  const fullAddress = `${shippingAddress}${city ? `, ${city}` : ''}${district ? `, ${district}` : ''}`;

  // Calculate actual historical orders for this customer (excluding current order)
  const previousOrders = (allOrders || []).filter(
    (o) => o.id !== order.id && (
      (phone && o.phone && o.phone.trim() === phone.trim()) ||
      (email && o.email && o.email.trim().toLowerCase() === email.trim().toLowerCase())
    )
  );

  const prevTotal = previousOrders.length;
  const prevReceived = previousOrders.filter((o) => o.status.toLowerCase() === 'delivered' || o.status.toLowerCase() === 'completed').length;
  const prevCanceled = previousOrders.filter((o) => o.status.toLowerCase() === 'cancelled').length;

  const statusOrderMap: Record<string, number> = {
    Pending: 0,
    Processing: 1,
    Shipped: 2,
    Delivered: 3,
    Cancelled: 4,
  };

  const handleStatusSelectFromPopup = async (newStatus: string) => {
    if (newStatus.toLowerCase() === status.toLowerCase()) return;

    const currentLevel = statusOrderMap[status] ?? 0;
    const newLevel = statusOrderMap[newStatus] ?? 0;

    if (newLevel < currentLevel) {
      setPendingRevertStatus(newStatus);
      setConfirmRevertOpen(true);
      return;
    }

    await executeStatusChange(newStatus);
  };

  const executeStatusChange = async (newStatus: string) => {
    const oldStatus = status;
    setStatus(newStatus);
    setUpdatingStatus(true);

    const nowFormatted = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const isRevert = (statusOrderMap[newStatus] ?? 0) < (statusOrderMap[oldStatus] ?? 0);
    const logTitle = isRevert
      ? `Reverted order status back to ${newStatus}`
      : `Updated order status to ${newStatus}`;

    setTimelineLogs((prev) => {
      const updated = [
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: logTitle,
          timestamp: nowFormatted,
        },
        ...prev,
      ];
      saveLogsToStorage(updated);
      return updated;
    });

    try {
      await onStatusChange(order.id, newStatus);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Quantity Stepper Handler
  const handleQuantityChange = (index: number, delta: number) => {
    setEditableItems((prev) => {
      const next = [...prev];
      const newQty = Math.max(1, next[index].quantity + delta);
      next[index] = { ...next[index], quantity: newQty };
      return next;
    });
  };

  // Remove Item Handler
  const handleRemoveItem = (index: number) => {
    setEditableItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveCustomerInfo = async () => {
    setSavingEdit(true);
    try {
      await onEditSave({
        customerName,
        phone,
        email,
        shippingAddress,
        district,
        city,
        staffNotes,
        items: editableItems,
      });

      const nowFormatted = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      setTimelineLogs((prev) => {
        const updated = [
          {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            title: 'Updated Order Items & Details',
            timestamp: nowFormatted,
          },
          ...prev,
        ];
        saveLogsToStorage(updated);
        return updated;
      });

      setIsEditing(false);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSaveNotesOnly = async () => {
    setSavingNotes(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(notesStorageKey, staffNotes);
    }
    try {
      await onEditSave({
        customerName,
        phone,
        email,
        shippingAddress,
        district,
        city,
        staffNotes,
        items: editableItems,
      });

      const nowFormatted = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      setTimelineLogs((prev) => {
        const updated = [
          {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            title: 'Updated Additional Notes',
            timestamp: nowFormatted,
          },
          ...prev,
        ];
        saveLogsToStorage(updated);
        return updated;
      });

      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 2000);
    } finally {
      setSavingNotes(false);
    }
  };

  const subtotal = editableItems.reduce((sum, i) => sum + (i.priceBdt * i.quantity), 0);
  const vat = Math.round((subtotal * vatRatePct) / 100);
  const delivery = order.deliveryChargeBdt || 150;
  const grandTotal = subtotal + vat + delivery;

  // Print Invoice using 100% exact template generator
  const handlePrintInvoice = () => {
    const invoiceHtml = generateOrderInvoiceHtml({
      orderNumber: order.orderNumber,
      customerName,
      phone,
      email,
      shippingAddress,
      city,
      district,
      subtotalBdt: subtotal,
      vatBdt: vat,
      deliveryChargeBdt: delivery,
      totalAmount: grandTotal,
      paymentMethod: order.paymentMethod,
      status: status,
      createdAt: order.createdAt,
      items: editableItems.map((i) => ({
        name: i.name,
        variant: i.variant,
        size: i.size,
        quantity: i.quantity,
        priceBdt: i.priceBdt,
      })),
    });

    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (printWin) {
      printWin.document.write(invoiceHtml);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 350);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/50 backdrop-blur-xs font-sans">
      
      {/* Screen-Centered Larger Viewport Hover Image Preview Popover (NO Blur Effect) */}
      {hoveredImagePreview && (
        <div className="fixed inset-0 z-[10005] pointer-events-none flex items-center justify-center bg-black/40 animate-in fade-in duration-150 p-4">
          <div className="relative bg-white border border-neutral-800 p-2 shadow-2xl w-full max-w-sm aspect-[3/4] rounded-none animate-in zoom-in-95 duration-150">
            <img
              src={hoveredImagePreview.url}
              alt={hoveredImagePreview.name}
              className="w-full h-full object-cover rounded-none aspect-[3/4]"
            />
            <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/85 text-white text-xs font-sans truncate rounded-none border border-neutral-800">
              <span className="font-semibold block truncate text-base">{hoveredImagePreview.name}</span>
              <span className="text-xs text-neutral-300 block font-normal">{hoveredImagePreview.details}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Unsaved Changes Confirmation Modal */}
      {confirmUnsavedOpen && (
        <div className="fixed inset-0 z-[10002] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 p-6 w-full max-w-md shadow-2xl rounded-none text-neutral-900 font-sans space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-medium text-black">Unsaved Edit Changes</h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              You have unsaved changes to order details. Would you like to save them before leaving?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmUnsavedOpen(false)}
                className="text-xs rounded-none border-neutral-300 font-medium"
              >
                Keep Editing
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfirmUnsavedOpen(false);
                  onClose();
                }}
                className="text-xs bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 rounded-none font-medium"
              >
                Discard Edits
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  setConfirmUnsavedOpen(false);
                  await handleSaveCustomerInfo();
                  onClose();
                }}
                className="text-xs bg-black text-white hover:bg-neutral-800 rounded-none font-medium"
              >
                Save &amp; Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delete Order Confirmation Modal */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-[10002] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 p-6 w-full max-w-md shadow-2xl rounded-none text-neutral-900 font-sans space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-medium text-black">Delete Order Confirmation</h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to permanently delete order <strong className="font-medium text-neutral-900">{order.orderNumber}</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeleteOpen(false)}
                className="text-xs rounded-none border-neutral-300 font-medium"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setConfirmDeleteOpen(false);
                  onDeleteOrder(order);
                }}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-none font-medium"
              >
                Delete Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Revert Status Confirmation Modal */}
      {confirmRevertOpen && (
        <div className="fixed inset-0 z-[10002] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 p-6 w-full max-w-md shadow-2xl rounded-none text-neutral-900 font-sans space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-medium text-black">Revert Order Status</h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to revert the status of order <strong className="font-medium text-neutral-900">{order.orderNumber}</strong> back to <strong className="font-medium text-black">{pendingRevertStatus}</strong>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmUnsavedOpen(false)}
                className="text-xs rounded-none border-neutral-300 font-medium"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  setConfirmRevertOpen(false);
                  await executeStatusChange(pendingRevertStatus);
                }}
                className="text-xs bg-black text-white hover:bg-neutral-800 rounded-none font-medium"
              >
                Confirm Status Revert
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Drawer */}
      <div className="w-full max-w-xl bg-white border-l border-neutral-200 text-neutral-900 shadow-2xl flex flex-col h-full overflow-y-auto animate-in slide-in-from-right duration-300 rounded-none">
        
        {/* Header with Interactive Status Badge & Single Top Pencil Edit Button */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-20">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-medium tracking-tight text-black">Order {order.orderNumber}</h2>
              
              {/* Relative Container for Compact Dropdown Status Selector Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(!statusModalOpen)}
                  title="Click to change order status"
                  className={`px-2.5 py-0.5 rounded-none text-xs font-medium border flex items-center gap-1 cursor-pointer transition-all hover:opacity-85 ${
                    status.toLowerCase() === 'delivered'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : status.toLowerCase() === 'shipped'
                      ? 'bg-purple-50 text-purple-700 border-purple-300'
                      : status.toLowerCase() === 'processing'
                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                      : status.toLowerCase() === 'cancelled'
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}
                >
                  <span>{status}</span>
                  <ChevronDown className="w-3 h-3 shrink-0" />
                </button>

                {/* Compact Dropdown Status Selector Popover */}
                {statusModalOpen && (
                  <div className="absolute left-0 top-full mt-1.5 z-50 bg-white border border-neutral-200 shadow-xl rounded-none w-44 py-1 animate-in fade-in zoom-in-95 duration-150 font-sans">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 flex items-center justify-between">
                      <span>Status</span>
                      <button onClick={() => setStatusModalOpen(false)} className="text-neutral-400 hover:text-black">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex flex-col py-0.5">
                      {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={async () => {
                            setStatusModalOpen(false);
                            await handleStatusSelectFromPopup(st);
                          }}
                          className={`px-3 py-1.5 text-xs text-left font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            status.toLowerCase() === st.toLowerCase()
                              ? 'bg-black text-white'
                              : 'text-neutral-800 hover:bg-neutral-100'
                          }`}
                        >
                          <span>{st}</span>
                          {status.toLowerCase() === st.toLowerCase() && (
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-1">Placed on {order.createdAt}</p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Top Pencil Edit Button controls full edit mode */}
            <button
              type="button"
              onClick={() => {
                if (isEditing) {
                  handleSaveCustomerInfo();
                } else {
                  setIsEditing(true);
                }
              }}
              title={isEditing ? "Save All Changes" : "Edit Order Details & Items"}
              className={`px-3 py-1.5 rounded-none border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isEditing
                  ? 'bg-black text-white border-black hover:bg-neutral-800'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 border-neutral-200'
              }`}
            >
              {isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              <span>{isEditing ? 'Save' : 'Edit'}</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              title="Delete Order Record"
              className="p-2 rounded-none text-rose-600 hover:bg-rose-50 border border-neutral-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleAttemptClose}
              className="p-2 rounded-none text-neutral-700 hover:bg-neutral-100 border border-neutral-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body - Rearranged Section Order: 1. Customer, 2. Ordered Items, 3. Notes, 4. Timeline */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* SECTION 1: CUSTOMER & SHIPPING DETAILS */}
          <div className="border border-neutral-200 p-4 rounded-none space-y-3.5 text-xs font-sans">
            
            {/* FIRST CONTAINER: Title, Header Buttons, Top Divider, & Customer Details */}
            <div className="flex flex-col gap-3">
              {/* Title & Quick Action Buttons */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider block">CUSTOMER &amp; SHIPPING DETAILS</label>
                
                <div className="flex items-center space-x-2">
                  {phone && (
                    <a href={`tel:${phone}`} className="p-1.5 rounded-none bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800" title="Call customer">
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {email && (
                    <a href={`mailto:${email}`} className="p-1.5 rounded-none bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800" title="Email customer">
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* First Divider within Header */}
              <div className="w-full h-px bg-neutral-200" />

              {/* Customer Information (Name, Phone, Email, Address) */}
              {isEditing ? (
                <div className="space-y-3 pt-0.5">
                  <div>
                    <label className="text-neutral-500 block text-[11px] mb-1 font-medium">Customer Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-neutral-300 p-2 text-black text-xs rounded-none font-normal"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-500 block text-[11px] mb-1 font-medium">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-neutral-300 p-2 text-black text-xs rounded-none font-normal"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-500 block text-[11px] mb-1 font-medium">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-neutral-300 p-2 text-black text-xs rounded-none font-normal"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-500 block text-[11px] mb-1 font-medium">Shipping Address</label>
                    <textarea
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      rows={2}
                      className="w-full bg-white border border-neutral-300 p-2 text-black text-xs rounded-none font-normal"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-[4px] pt-0.5">
                  <CopyableItem label="Name" value={customerName} />
                  <CopyableItem label="Phone" value={phone} />
                  <CopyableItem label="Email" value={email} />
                  <CopyableItem label="Address" value={fullAddress} />
                </div>
              )}
            </div>

            {/* SECOND SEPARATE CONTAINER: Second Divider & Customer's Previous Order History Status Tags */}
            {!isEditing && (
              <div className="flex flex-col gap-3 pt-1">
                {/* Second Divider Line */}
                <div className="w-full h-px bg-neutral-200" />

                {/* Customer Previous Order History Status Tags */}
                <div>
                  {prevTotal === 0 ? (
                    <span className="inline-block px-2.5 py-1 text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200 rounded-none">
                      No previous orders
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 text-[11px] font-medium bg-neutral-100 text-neutral-800 border border-neutral-200 rounded-none">
                        {prevTotal} Previous order{prevTotal > 1 ? 's' : ''}
                      </span>
                      <span className="px-2.5 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-none">
                        {prevReceived} Received
                      </span>
                      <span className="px-2.5 py-1 text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 rounded-none">
                        {prevCanceled} Canceled
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* SECTION 2: ORDERED ITEMS & FINANCIAL BREAKDOWN */}
          <div className="border border-neutral-200 p-4 rounded-none space-y-4">
            
            {/* Ordered Items Header */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider block">
                  ORDERED ITEMS ({editableItems?.length || 0})
                </label>
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="px-2.5 py-1 text-xs bg-black text-white hover:bg-neutral-800 rounded-none font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
              </div>

              <div className="w-full h-px bg-neutral-200" />

              <div className="flex flex-col gap-3 pt-1">
                {editableItems.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic py-2">No items in order.</p>
                ) : (
                  editableItems.map((item, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <div className="w-full h-px bg-neutral-200 shrink-0" />}
                      <div className="flex items-start justify-between w-full">
                        <div className="flex items-start space-x-3">
                          {/* Thumbnail Image */}
                          <div
                            onMouseEnter={() => {
                              setHoveredImagePreview({
                                url: item.thumbnailUrl || "/images/for_him.jpg",
                                name: item.name,
                                details: `Color: ${item.variant || 'Lavender'} / Size: ${item.size || 'XL'}`,
                              });
                            }}
                            onMouseLeave={() => setHoveredImagePreview(null)}
                            className="w-12 h-16 rounded-none bg-neutral-100 overflow-hidden shrink-0 aspect-[3/4] cursor-zoom-in transition-opacity hover:opacity-90"
                          >
                            <img
                              src={item.thumbnailUrl || "/images/for_him.jpg"}
                              alt={item.name}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "/images/for_him.jpg";
                              }}
                              className="w-full h-full object-cover aspect-[3/4]"
                            />
                          </div>

                          {/* Product Details */}
                          <div className="space-y-0.5">
                            <h4 className="font-medium text-sm text-neutral-900">{item.name}</h4>
                            <div className="text-xs text-neutral-500 font-normal leading-tight space-y-0.5 pt-0.5">
                              <p className="m-0 p-0">Color: {item.variant || 'Lavender'}</p>
                              <p className="m-0 p-0">Size: {item.size || 'XL'}</p>
                              {!isEditing && <p className="m-0 p-0">Qty: {item.quantity}</p>}
                            </div>
                          </div>
                        </div>
                        
                        {/* Right side: Quantity Stepper + Delete button when editing, or Price when viewing */}
                        {isEditing ? (
                          <div className="flex items-center space-x-2 shrink-0">
                            {/* Stepper */}
                            <div className="flex items-center border border-neutral-300 rounded-none bg-white">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(idx, -1)}
                                className="w-6 h-6 flex items-center justify-center text-xs text-neutral-700 hover:bg-neutral-100 font-bold"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-medium text-black min-w-[20px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(idx, 1)}
                                className="w-6 h-6 flex items-center justify-center text-xs text-neutral-700 hover:bg-neutral-100 font-bold"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Delete Item Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-none transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-right shrink-0">
                            <span className="font-medium text-sm text-neutral-900 block">৳{(item.priceBdt * item.quantity).toLocaleString()} BDT</span>
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  ))
                )}
              </div>
            </div>

            <div className="w-full h-px bg-neutral-200" />

            {/* Financial Breakdown */}
            <div className="space-y-2 text-xs font-normal">
              <div className="flex justify-between text-neutral-700">
                <span>Subtotal:</span>
                <span>৳{subtotal.toLocaleString()} BDT</span>
              </div>
              <div className="flex justify-between text-neutral-700">
                <span>VAT ({vatRatePct}%):</span>
                <span>৳{vat.toLocaleString()} BDT</span>
              </div>
              <div className="flex justify-between text-neutral-700">
                <span>Delivery Charge:</span>
                <span>৳{delivery.toLocaleString()} BDT</span>
              </div>

              <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-sm font-medium text-black">
                <span>Total Amount ({order.paymentMethod || 'Cash on Delivery'}):</span>
                <span className="text-black text-sm font-medium">৳{grandTotal.toLocaleString()} BDT</span>
              </div>
            </div>

          </div>

          {/* SECTION 3: ADDITIONAL NOTES */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider block">
                Additional Notes
              </label>
              <button
                type="button"
                onClick={handleSaveNotesOnly}
                disabled={savingNotes}
                className="px-2.5 py-1 text-xs bg-black text-white hover:bg-neutral-800 rounded-none font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                {savingNotes ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : notesSavedSuccess ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                <span>{notesSavedSuccess ? 'Saved ✓' : 'Save Note'}</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={staffNotes}
              onChange={(e) => {
                const val = e.target.value;
                setStaffNotes(val);
                if (typeof window !== "undefined") {
                  localStorage.setItem(notesStorageKey, val);
                }
              }}
              placeholder="Add additional notes for the order..."
              className="w-full bg-white border border-neutral-300 focus:border-black p-3 text-neutral-800 text-xs rounded-none outline-none placeholder:text-neutral-400 font-normal"
            />
          </div>

          {/* SECTION 4: ORDER ACTIVITY TIMELINE */}
          <div className="border border-neutral-200 p-4 rounded-none space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider block flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-black" />
                <span>ORDER ACTIVITY TIMELINE</span>
              </label>
              {updatingStatus && <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />}
            </div>

            <div className="w-full h-px bg-neutral-200" />

            <div className="relative pl-6 space-y-4">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-neutral-200" />

              {timelineLogs.map((log) => (
                <div key={log.id} className="relative flex items-start space-x-3 text-xs">
                  <div className="absolute -left-[23px] top-1 size-3 rounded-full border-2 border-black bg-white shrink-0 z-10" />

                  <div className="space-y-0.5">
                    <p className="font-medium text-neutral-900">{log.title}</p>
                    <p className="text-[11px] text-neutral-400 font-normal">{log.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Edit Mode Bottom Action Bar */}
        {isEditing && (
          <div className="p-4 border-t border-neutral-200 bg-white sticky bottom-0 z-20 flex items-center justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditableItems(order.items || []);
                setIsEditing(false);
              }}
              className="text-xs rounded-none border-neutral-300 font-medium"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveCustomerInfo}
              disabled={savingEdit}
              className="text-xs bg-black text-white hover:bg-neutral-800 rounded-none font-medium gap-1.5"
            >
              {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Changes</span>
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}

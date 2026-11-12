'use client';

import { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchAdminCustomersAction, deleteAdminCustomerAction, createAdminCustomerAction } from "@/app/actions/admin-actions";
import { formatBdt } from "@/lib/utils";
import {
  Users,
  Search,
  ShoppingBag,
  DollarSign,
  UserCheck,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Trash2,
  X,
  AlertTriangle,
  Eye,
  Copy,
  Check,
  Edit3,
  Save,
  Plus,
  Loader2
} from "lucide-react";

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  apt?: string;
  type: string;
  ordersCount: number;
  totalSpentBdt: number;
  city: string;
  district: string;
  lastOrderDate: string;
  status: string;
}

function CopyableCustomerItem({ label, value }: { label: string; value: string }) {
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

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "registered" | "guest" | "vip">("all");
  
  // Selection State (matching Products page table selector)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Inspect customer side drawer (matching OrderDetailsDrawer layout)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Delete Customer Confirm Modal State
  const [customerToDelete, setCustomerToDelete] = useState<CustomerRecord | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Create Customer Modal State
  const [createCustomerModalOpen, setCreateCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [newCustApt, setNewCustApt] = useState("");
  const [newCustDistrict, setNewCustDistrict] = useState("Dhaka Division");
  const [newCustCity, setNewCustCity] = useState("Dhaka");
  const [newCustType, setNewCustType] = useState("Registered");
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminCustomersAction();
      setCustomers((data || []) as CustomerRecord[]);
      setSelectedIds([]);
    } catch (err) {
      console.error("Failed to load admin customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const registeredCount = customers.filter(c => c.type.toLowerCase().includes("registered")).length;
  const guestCount = customers.filter(c => c.type.toLowerCase().includes("guest")).length;
  const totalLtv = customers.reduce((sum, c) => sum + (c.totalSpentBdt || 0), 0);

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.city.toLowerCase().includes(q) ||
      (c.address && c.address.toLowerCase().includes(q));

    let matchesFilter = true;
    if (typeFilter === "registered") matchesFilter = c.type.toLowerCase().includes("registered");
    if (typeFilter === "guest") matchesFilter = c.type.toLowerCase().includes("guest");
    if (typeFilter === "vip") matchesFilter = c.totalSpentBdt >= 5000;

    return matchesQuery && matchesFilter;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCustomers.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const isAllSelected = filteredCustomers.length > 0 && selectedIds.length === filteredCustomers.length;

  const handleInspectCustomer = (cust: CustomerRecord) => {
    setSelectedCustomer(cust);
    setIsEditingProfile(false);
    setIsDetailOpen(true);
  };

  const handleDeleteSingleCustomer = async () => {
    if (!customerToDelete) return;
    await deleteAdminCustomerAction(customerToDelete.id);
    if (customerToDelete.email && customerToDelete.email !== 'N/A') {
      await deleteAdminCustomerAction(customerToDelete.email);
    }
    setCustomerToDelete(null);
    if (selectedCustomer?.id === customerToDelete.id) {
      setIsDetailOpen(false);
      setSelectedCustomer(null);
    }
    await loadCustomers();
  };

  const handleBulkDeleteCustomers = async () => {
    for (const id of selectedIds) {
      const target = customers.find(c => c.id === id);
      await deleteAdminCustomerAction(id);
      if (target?.email && target.email !== 'N/A') {
        await deleteAdminCustomerAction(target.email);
      }
    }
    setIsBulkDeleting(false);
    setSelectedIds([]);
    await loadCustomers();
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert("Please enter customer name and phone number.");
      return;
    }

    setCreatingCustomer(true);
    try {
      const res = await createAdminCustomerAction({
        fullName: newCustName,
        email: newCustEmail,
        phone: newCustPhone,
        address: newCustAddress,
        apt: newCustApt,
        district: newCustDistrict,
        city: newCustCity,
        type: newCustType,
      });

      if (res.success) {
        setCreateCustomerModalOpen(false);
        setNewCustName("");
        setNewCustEmail("");
        setNewCustPhone("");
        setNewCustAddress("");
        setNewCustApt("");
        loadCustomers();
      } else {
        alert(res.message || "Failed to create customer.");
      }
    } catch (err) {
      console.error("Failed to create customer:", err);
    } finally {
      setCreatingCustomer(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 font-sans relative">
      {/* Add New Customer Modal */}
      {createCustomerModalOpen && (
        <div className="fixed inset-0 z-[10002] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 p-6 w-full max-w-lg rounded-none shadow-2xl font-sans animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-black" />
                <h3 className="text-base font-bold text-black">Add New Customer Record</h3>
              </div>
              <button onClick={() => setCreateCustomerModalOpen(false)} className="text-neutral-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Rahman"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full h-9 px-3 border border-neutral-200 text-xs rounded-none outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="01711223344"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value.replace(/[^\d+]/g, ''))}
                    className="w-full h-9 px-3 border border-neutral-200 text-xs rounded-none outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full h-9 px-3 border border-neutral-200 text-xs rounded-none outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="House / Road / Area"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full h-9 px-3 border border-neutral-200 text-xs rounded-none outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Apt / Suite / Floor</label>
                  <input
                    type="text"
                    placeholder="Apt 4B"
                    value={newCustApt}
                    onChange={(e) => setNewCustApt(e.target.value)}
                    className="w-full h-9 px-3 border border-neutral-200 text-xs rounded-none outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">State / Region</label>
                  <select
                    value={newCustDistrict}
                    onChange={(e) => setNewCustDistrict(e.target.value)}
                    className="w-full h-9 px-2.5 border border-neutral-200 text-xs rounded-none outline-none focus:border-black cursor-pointer bg-white"
                  >
                    <option value="Dhaka Division">Dhaka Division</option>
                    <option value="Chittagong Division">Chittagong Division</option>
                    <option value="Sylhet Division">Sylhet Division</option>
                    <option value="Rajshahi Division">Rajshahi Division</option>
                    <option value="Khulna Division">Khulna Division</option>
                    <option value="Barishal Division">Barishal Division</option>
                    <option value="Rangpur Division">Rangpur Division</option>
                    <option value="Mymensingh Division">Mymensingh Division</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    className="w-full h-9 px-3 border border-neutral-200 text-xs rounded-none outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-neutral-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateCustomerModalOpen(false)}
                  className="text-xs rounded-none border-neutral-300 font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creatingCustomer}
                  size="sm"
                  className="text-xs bg-[#050505] text-white hover:bg-neutral-800 rounded-none font-medium flex items-center gap-1.5"
                >
                  {creatingCustomer && <Loader2 className="size-3.5 animate-spin" />}
                  <span>{creatingCustomer ? "Saving..." : "Save Customer"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Single Customer Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-[10002] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 p-6 w-full max-w-md rounded-none shadow-2xl font-sans animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-medium text-black">Confirm Customer Deletion</h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to permanently delete customer record for <strong className="font-medium text-neutral-900">{customerToDelete.name}</strong> ({customerToDelete.email})? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCustomerToDelete(null)}
                className="text-xs rounded-none border-neutral-300 font-medium"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteSingleCustomer}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-none font-medium"
              >
                Delete Customer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Bulk Selected Customers Modal */}
      {isBulkDeleting && (
        <div className="fixed inset-0 z-[10002] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 p-6 w-full max-w-md rounded-none shadow-2xl font-sans animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-medium text-black">Confirm Bulk Deletion</h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to delete <strong className="font-medium text-neutral-900">{selectedIds.length} selected customers</strong> from the database?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkDeleting(false)}
                className="text-xs rounded-none border-neutral-300 font-medium"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleBulkDeleteCustomers}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-none font-medium"
              >
                Delete {selectedIds.length} Customers
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Profile Side-Over Slide Drawer - Matched 100% with OrderDetailsDrawer layout */}
      {isDetailOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[10000] flex justify-end bg-black/50 backdrop-blur-xs font-sans">
          <div className="w-full max-w-xl bg-white border-l border-neutral-200 text-neutral-900 shadow-2xl flex flex-col h-full overflow-y-auto animate-in slide-in-from-right duration-300 rounded-none">
            
            {/* Header matching OrderDetailsDrawer structure */}
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-20">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-medium tracking-tight text-black">{selectedCustomer.name}</h2>
                  <Badge
                    className={`px-2.5 py-0.5 rounded-none text-xs font-medium border shadow-none ${
                      selectedCustomer.type.toLowerCase().includes("registered")
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-amber-50 text-amber-700 border-amber-300"
                    }`}
                  >
                    {selectedCustomer.type.toLowerCase().includes("registered") ? "REGISTERED" : "GUEST"}
                  </Badge>
                </div>
                <p className="text-xs text-neutral-500 mt-1">Customer Profile ID: {selectedCustomer.id}</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  title={isEditingProfile ? "Save Profile Changes" : "Edit Customer Details"}
                  className={`px-3 py-1.5 rounded-none border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isEditingProfile
                      ? 'bg-black text-white border-black hover:bg-neutral-800'
                      : 'bg-white text-neutral-700 hover:bg-neutral-100 border-neutral-200'
                  }`}
                >
                  {isEditingProfile ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  <span>{isEditingProfile ? 'Save' : 'Edit'}</span>
                </button>

                {/* Delete Button inside Drawer ONLY */}
                <button
                  type="button"
                  onClick={() => setCustomerToDelete(selectedCustomer)}
                  title="Delete Customer Profile"
                  className="p-2 rounded-none text-rose-600 hover:bg-rose-50 border border-neutral-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="p-2 rounded-none text-neutral-700 hover:bg-neutral-100 border border-neutral-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Body - Matched Card containers & CopyableItem layout */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* CARD 1: CUSTOMER & CONTACT INFORMATION */}
              <div className="border border-neutral-200 p-4 rounded-none space-y-3.5 text-xs font-sans">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider block">CUSTOMER &amp; CONTACT INFORMATION</label>
                    <div className="flex items-center space-x-2">
                      {selectedCustomer.phone && (
                        <a href={`tel:${selectedCustomer.phone}`} className="p-1.5 rounded-none bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800" title="Call customer">
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {selectedCustomer.email && (
                        <a href={`mailto:${selectedCustomer.email}`} className="p-1.5 rounded-none bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800" title="Email customer">
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="w-full h-px bg-neutral-200" />

                  {isEditingProfile ? (
                    <div className="space-y-3 pt-0.5">
                      <div>
                        <label className="text-neutral-500 block text-[11px] mb-1 font-medium">Full Name</label>
                        <input
                          type="text"
                          value={selectedCustomer.name}
                          onChange={(e) => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })}
                          className="w-full bg-white border border-neutral-300 p-2 text-black text-xs rounded-none font-normal"
                        />
                      </div>
                      <div>
                        <label className="text-neutral-500 block text-[11px] mb-1 font-medium">Phone Number</label>
                        <input
                          type="text"
                          value={selectedCustomer.phone}
                          onChange={(e) => setSelectedCustomer({ ...selectedCustomer, phone: e.target.value })}
                          className="w-full bg-white border border-neutral-300 p-2 text-black text-xs rounded-none font-normal"
                        />
                      </div>
                      <div>
                        <label className="text-neutral-500 block text-[11px] mb-1 font-medium">Email Address</label>
                        <input
                          type="email"
                          value={selectedCustomer.email}
                          onChange={(e) => setSelectedCustomer({ ...selectedCustomer, email: e.target.value })}
                          className="w-full bg-white border border-neutral-300 p-2 text-black text-xs rounded-none font-normal"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-[4px] pt-0.5">
                      <CopyableCustomerItem label="Name" value={selectedCustomer.name} />
                      <CopyableCustomerItem label="Phone" value={selectedCustomer.phone} />
                      <CopyableCustomerItem label="Email" value={selectedCustomer.email} />
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 2: PRIMARY DELIVERY LOCATION */}
              <div className="border border-neutral-200 p-4 rounded-none space-y-3.5 text-xs font-sans">
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider block">PRIMARY DELIVERY LOCATION</label>
                  <div className="w-full h-px bg-neutral-200" />

                  {isEditingProfile ? (
                    <div className="space-y-3 pt-0.5">
                      <div>
                        <label className="text-neutral-500 block text-[11px] mb-1 font-medium">Street Address / Apt</label>
                        <input
                          type="text"
                          value={selectedCustomer.address || ''}
                          onChange={(e) => setSelectedCustomer({ ...selectedCustomer, address: e.target.value })}
                          className="w-full bg-white border border-neutral-300 p-2 text-black text-xs rounded-none font-normal"
                        />
                      </div>
                      <div>
                        <label className="text-neutral-500 block text-[11px] mb-1 font-medium">City &amp; Region</label>
                        <input
                          type="text"
                          value={`${selectedCustomer.city}, ${selectedCustomer.district}`}
                          onChange={(e) => {
                            const [c, r] = e.target.value.split(",");
                            setSelectedCustomer({ ...selectedCustomer, city: (c || '').trim(), district: (r || '').trim() });
                          }}
                          className="w-full bg-white border border-neutral-300 p-2 text-black text-xs rounded-none font-normal"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-[4px] pt-0.5">
                      <CopyableCustomerItem label="Street Address" value={selectedCustomer.address || selectedCustomer.apt || "Standard Address"} />
                      <CopyableCustomerItem label="City & Region" value={`${selectedCustomer.city}, ${selectedCustomer.district}`} />
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 3: LIFETIME ACTIVITY & VALUE STATS */}
              <div className="border border-neutral-200 p-4 rounded-none space-y-3.5 text-xs font-sans">
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider block">LIFETIME PURCHASING &amp; VALUE ANALYTICS</label>
                  <div className="w-full h-px bg-neutral-200" />

                  <div className="grid grid-cols-2 gap-3 pt-0.5">
                    <div className="p-3 bg-neutral-50 border border-neutral-200 flex flex-col gap-1">
                      <span className="text-[11px] text-neutral-500 uppercase font-medium">Total Orders</span>
                      <span className="text-sm font-semibold text-neutral-900">{selectedCustomer.ordersCount} completed orders</span>
                    </div>

                    <div className="p-3 bg-neutral-50 border border-neutral-200 flex flex-col gap-1">
                      <span className="text-[11px] text-neutral-500 uppercase font-medium">Total Lifetime Spend</span>
                      <span className="text-sm font-semibold text-emerald-600">{formatBdt(selectedCustomer.totalSpentBdt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-2.5 py-1 text-[11px] font-medium bg-neutral-100 text-neutral-800 border border-neutral-200 rounded-none">
                      Last order: {selectedCustomer.lastOrderDate}
                    </span>
                    <span className="px-2.5 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-none">
                      Status: {selectedCustomer.status}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer matching OrderDetailsDrawer */}
            <div className="p-4 border-t border-neutral-200 bg-white flex items-center justify-between sticky bottom-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCustomerToDelete(selectedCustomer)}
                className="text-xs rounded-none border-rose-200 bg-white text-rose-600 hover:bg-rose-50 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                <span>Delete Profile</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setIsDetailOpen(false)}
                className="text-xs bg-black text-white hover:bg-neutral-800 rounded-none font-medium"
              >
                Close Drawer
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* Main Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Directory of registered members and guest checkout buyers with lifetime value (LTV) analytics.
          </p>
        </div>

        {/* Action Button: Add New Customer (Matching Product Page button) */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setCreateCustomerModalOpen(true)}
            className="flex items-center gap-1.5 text-xs bg-[#050505] text-white hover:bg-neutral-800 rounded-none shadow-none font-medium"
          >
            <Plus className="size-3.5" />
            <span>Add New Customer</span>
          </Button>
        </div>
      </div>

      {/* 4 Metric Cards Grid - Matching Products Page */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-neutral-200 bg-white p-4 font-sans rounded-none shadow-none">
          <p className="text-xs uppercase font-medium text-neutral-500">Total Customers</p>
          <p className="text-2xl font-bold mt-1 text-neutral-900">{customers.length}</p>
        </div>

        <div className="border border-neutral-200 bg-white p-4 font-sans rounded-none shadow-none">
          <p className="text-xs uppercase font-medium text-emerald-700">Registered Members</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{registeredCount}</p>
        </div>

        <div className="border border-neutral-200 bg-white p-4 font-sans rounded-none shadow-none">
          <p className="text-xs uppercase font-medium text-amber-700">Guest Checkouts</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{guestCount}</p>
        </div>

        <div className="border border-neutral-200 bg-white p-4 font-sans rounded-none shadow-none">
          <p className="text-xs uppercase font-medium text-neutral-500">Total LTV Revenue</p>
          <p className="text-2xl font-bold mt-1 text-neutral-900">{formatBdt(totalLtv)}</p>
        </div>
      </div>

      {/* Section Title & Filter Search Row - Matching Products Page */}
      <div className="flex flex-col gap-4">
        <div className="pt-2">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Customer Accounts ({filteredCustomers.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            Complete customer roster combining registered user profiles &amp; guest buyer records.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3">
            <div className="flex items-center w-[320px]">
              <div className="relative w-full">
                <Search className="size-4 text-muted-foreground absolute left-3 top-2.5 shrink-0 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name, phone, email, location..."
                  className="text-xs h-9 rounded-none border border-neutral-200 bg-white pl-9 pr-3 w-full outline-none focus:border-black font-sans text-foreground shadow-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {selectedIds.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkDeleting(true)}
                className="h-9 px-3 text-xs rounded-none border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium"
              >
                <Trash2 className="size-3.5 mr-1" />
                Delete ({selectedIds.length})
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="h-9 px-3 bg-white border border-neutral-200 text-xs rounded-none outline-none focus:border-black font-sans cursor-pointer text-foreground font-medium"
            >
              <option value="all">All Customer Types</option>
              <option value="registered">Registered</option>
              <option value="guest">Guest</option>
              <option value="vip">VIP Buyers (৳5k+)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Customers Table Container - Matching Products Page */}
      <div className="border border-neutral-200 bg-white overflow-hidden rounded-none">
        <Table>
          <TableHeader className="bg-neutral-50/50">
            <TableRow className="border-b border-neutral-200">
              <TableHead className="w-10 pl-4 py-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="size-3.5 rounded-none border-neutral-300 accent-black cursor-pointer"
                />
              </TableHead>
              <TableHead className="font-semibold text-xs text-foreground py-3">Customer Name</TableHead>
              <TableHead className="font-semibold text-xs text-foreground py-3">Contact Information</TableHead>
              <TableHead className="font-semibold text-xs text-foreground py-3">Location</TableHead>
              <TableHead className="font-semibold text-xs text-foreground py-3">Type</TableHead>
              <TableHead className="font-semibold text-xs text-foreground py-3">Orders</TableHead>
              <TableHead className="font-semibold text-xs text-foreground py-3">Lifetime Spend</TableHead>
              <TableHead className="font-semibold text-xs text-foreground py-3">Last Order</TableHead>
              <TableHead className="text-right font-semibold text-xs text-foreground pr-4 py-3">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-xs text-neutral-400">
                  Loading customer profiles...
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-xs text-neutral-400">
                  No matching customer records found in database.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = selectedIds.includes(c.id);

                return (
                  <TableRow key={c.id} className={`border-b border-neutral-200 hover:bg-neutral-50/50 transition-colors ${isSelected ? "bg-neutral-50" : ""}`}>
                    {/* Selector Column Checkbox */}
                    <TableCell className="w-10 pl-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(c.id)}
                        className="size-3.5 rounded-none border-neutral-300 accent-black cursor-pointer"
                      />
                    </TableCell>

                    {/* Customer Name Column (Clean text, font-medium 500 weight) */}
                    <TableCell className="py-3.5">
                      <span className="font-medium text-xs text-foreground">{c.name}</span>
                    </TableCell>

                    {/* Contact Information (Top line 500 weight) */}
                    <TableCell className="py-3.5">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-medium text-neutral-900">{c.email}</span>
                        <span className="font-mono text-[11px] text-neutral-500 font-normal">{c.phone}</span>
                      </div>
                    </TableCell>

                    {/* 2-Line Location Column (Top line 500 weight) */}
                    <TableCell className="py-3.5">
                      <div className="flex flex-col">
                        <span className="font-medium text-xs text-neutral-900">
                          {c.address || c.apt || "Standard Address"}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-normal">
                          {c.city}, {c.district}
                        </span>
                      </div>
                    </TableCell>

                    {/* Type Badge: REGISTERED / GUEST */}
                    <TableCell className="py-3.5">
                      <Badge
                        className={`rounded-none text-[10px] font-mono uppercase px-2 py-0.5 shadow-none ${
                          c.type.toLowerCase().includes("registered")
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-neutral-100 text-neutral-700 border-neutral-300"
                        }`}
                      >
                        {c.type.toLowerCase().includes("registered") ? "REGISTERED" : "GUEST"}
                      </Badge>
                    </TableCell>

                    <TableCell className="font-medium text-xs text-foreground py-3.5">
                      {c.ordersCount} {c.ordersCount === 1 ? "order" : "orders"}
                    </TableCell>

                    <TableCell className="font-medium text-xs text-emerald-600 py-3.5">
                      {formatBdt(c.totalSpentBdt)}
                    </TableCell>

                    <TableCell className="font-medium text-xs text-neutral-700 py-3.5">
                      {c.lastOrderDate}
                    </TableCell>

                    {/* Actions Column: ONLY View Profile with Eye Icon (No Delete Trash Button in Table) */}
                    <TableCell className="text-right pr-4 py-3.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInspectCustomer(c)}
                        className="rounded-none text-[11px] h-7 px-2.5 border-neutral-300 hover:bg-neutral-100 font-medium flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="size-3.5 text-neutral-600" />
                        <span>View Profile</span>
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
  );
}

'use client';

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  fetchAdminUsersAction,
  createAdminUserAction,
  deleteAdminUserAction,
  revealAdminPasswordAction,
} from "@/app/actions/admin-actions";
import { Save, UserPlus, Trash2, Shield, Eye, EyeOff, Loader2, KeyRound, AlertTriangle } from "lucide-react";

interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  hasPassword?: boolean;
}

interface ShippingZone {
  id: string;
  region: string;
  cities: string;
  rateBdt: number;
}

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState("LIVUS Streetwear Atelier");
  const [supportEmail, setSupportEmail] = useState("support@livus.com.bd");
  const [currency, setCurrency] = useState("BDT (৳)");
  const [vatPercent, setVatPercent] = useState("10");
  const [saved, setSaved] = useState(false);

  // Admin users state
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("admin");
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminFormError, setAdminFormError] = useState("");

  // Password revealing identity confirmation state
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [confirmIdentityOpen, setConfirmIdentityOpen] = useState(false);
  const [targetUserForPassword, setTargetUserForPassword] = useState<AdminUserRecord | null>(null);
  const [superAdminPasswordInput, setSuperAdminPasswordInput] = useState("");
  const [showSuperAdminInputPassword, setShowSuperAdminInputPassword] = useState(false);
  const [verifyingSuperAdmin, setVerifyingSuperAdmin] = useState(false);
  const [superAdminError, setSuperAdminError] = useState("");

  // Delete user confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [targetUserForDelete, setTargetUserForDelete] = useState<AdminUserRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const loadAdminUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await fetchAdminUsersAction();
      setAdminUsers(data || []);
    } catch (err) {
      console.error("Failed to fetch admin users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedVat = localStorage.getItem("my_store_vat_percent");
      if (storedVat) setVatPercent(storedVat);
    }
    loadAdminUsers();
  }, []);

  const [zones] = useState<ShippingZone[]>([
    { id: "z-1", region: "Dhaka Division", cities: "Dhaka, Gazipur, Narayanganj", rateBdt: 100 },
    { id: "z-2", region: "Chittagong Division", cities: "Chittagong, Cox's Bazar, Comilla", rateBdt: 150 },
    { id: "z-3", region: "Sylhet & Rajshahi", cities: "Sylhet, Rajshahi, Bogra", rateBdt: 150 },
  ]);

  const handleSaveSettings = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("my_store_vat_percent", vatPercent);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword) {
      setAdminFormError("Please enter full name, email, and password.");
      return;
    }

    setCreatingAdmin(true);
    setAdminFormError("");

    try {
      const res = await createAdminUserAction({
        name: newAdminName,
        email: newAdminEmail,
        password: newAdminPassword,
        role: newAdminRole,
      });

      if (res.success) {
        setIsAddAdminOpen(false);
        setNewAdminName("");
        setNewAdminEmail("");
        setNewAdminPassword("");
        setNewAdminRole("admin");
        loadAdminUsers();
      } else {
        setAdminFormError(res.message || "Failed to create admin user");
      }
    } catch (err: any) {
      setAdminFormError(err?.message || "Failed to create admin account.");
    } finally {
      setCreatingAdmin(false);
    }
  };

  const openRevealPasswordModal = (usr: AdminUserRecord) => {
    if (revealedPasswords[usr.email]) {
      // Toggle off
      setRevealedPasswords((prev) => {
        const next = { ...prev };
        delete next[usr.email];
        return next;
      });
      return;
    }
    setTargetUserForPassword(usr);
    setSuperAdminPasswordInput("");
    setSuperAdminError("");
    setConfirmIdentityOpen(true);
  };

  const handleConfirmIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserForPassword || !superAdminPasswordInput) {
      setSuperAdminError("Please enter SuperAdmin password.");
      return;
    }

    setVerifyingSuperAdmin(true);
    setSuperAdminError("");

    try {
      const res = await revealAdminPasswordAction(
        targetUserForPassword.email,
        superAdminPasswordInput
      );

      if (res.success && res.password) {
        setRevealedPasswords((prev) => ({
          ...prev,
          [targetUserForPassword.email]: res.password!,
        }));
        setConfirmIdentityOpen(false);
      } else {
        setSuperAdminError(res.message || "Verification failed.");
      }
    } catch (err: any) {
      setSuperAdminError(err?.message || "SuperAdmin authentication failed.");
    } finally {
      setVerifyingSuperAdmin(false);
    }
  };

  const openDeleteModal = (usr: AdminUserRecord) => {
    setTargetUserForDelete(usr);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteSubmit = async () => {
    if (!targetUserForDelete) return;

    setDeletingUser(true);
    try {
      await deleteAdminUserAction(targetUserForDelete.id, targetUserForDelete.email);
      setDeleteConfirmOpen(false);
      setTargetUserForDelete(null);
      loadAdminUsers();
    } catch (err) {
      console.error("Failed to delete admin user:", err);
    } finally {
      setDeletingUser(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* 1. Create Admin Modal */}
      <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
        <DialogContent className="sm:max-w-md rounded-none font-sans bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Add Regular Admin</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Create credentials for staff or administrators to sign into the admin portal.
            </DialogDescription>
          </DialogHeader>

          {adminFormError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-none">
              {adminFormError}
            </div>
          )}

          <form onSubmit={handleCreateAdminSubmit} className="flex flex-col gap-4 text-xs mt-2">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-foreground">Full Name</label>
              <Input
                type="text"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                placeholder="e.g. Arif Hossain"
                required
                className="rounded-none h-9 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-foreground">Admin Email</label>
              <Input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="admin@livus.com"
                required
                className="rounded-none h-9 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-foreground">Password</label>
              <div className="relative w-full">
                <Input
                  type={showModalPassword ? "text" : "password"}
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Set account password"
                  required
                  className="rounded-none h-9 text-xs pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowModalPassword(!showModalPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-black cursor-pointer bg-transparent border-none"
                >
                  {showModalPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-foreground">Admin Role</label>
              <select
                value={newAdminRole}
                onChange={(e) => setNewAdminRole(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-neutral-200 text-xs rounded-none outline-none focus:border-black cursor-pointer"
              >
                <option value="admin">Regular Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddAdminOpen(false)}
                className="rounded-none text-xs h-9 border-neutral-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingAdmin}
                className="rounded-none text-xs h-9 bg-black text-white hover:bg-neutral-800"
              >
                {creatingAdmin ? <Loader2 className="size-3.5 animate-spin" /> : "Create Admin Account"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Confirm SuperAdmin Identity Modal */}
      <Dialog open={confirmIdentityOpen} onOpenChange={setConfirmIdentityOpen}>
        <DialogContent className="sm:max-w-md rounded-none font-sans bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <KeyRound className="size-4 text-amber-500" />
              <span>Confirm Your Identity</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              SuperAdmin authentication is required to reveal password credentials for{" "}
              <strong className="text-foreground font-semibold">{targetUserForPassword?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {superAdminError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-none">
              {superAdminError}
            </div>
          )}

          <form onSubmit={handleConfirmIdentitySubmit} className="flex flex-col gap-4 text-xs mt-2">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-foreground">SuperAdmin Password</label>
              <div className="relative w-full">
                <Input
                  type={showSuperAdminInputPassword ? "text" : "password"}
                  value={superAdminPasswordInput}
                  onChange={(e) => setSuperAdminPasswordInput(e.target.value)}
                  placeholder="Enter SuperAdmin password"
                  required
                  className="rounded-none h-9 text-xs pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowSuperAdminInputPassword(!showSuperAdminInputPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-black cursor-pointer bg-transparent border-none"
                >
                  {showSuperAdminInputPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmIdentityOpen(false)}
                className="rounded-none text-xs h-9 border-neutral-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={verifyingSuperAdmin}
                className="rounded-none text-xs h-9 bg-black text-white hover:bg-neutral-800"
              >
                {verifyingSuperAdmin ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  "Verify & Reveal Password"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Confirm Delete Staff Account Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-none font-sans bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="size-4 text-rose-600" />
              <span>Confirm Account Deletion</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to remove the admin account for{" "}
              <strong className="text-foreground font-semibold">{targetUserForDelete?.name}</strong> (
              <span className="font-mono text-neutral-700">{targetUserForDelete?.email}</span>)?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-none text-xs h-9 border-neutral-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deletingUser}
              onClick={handleConfirmDeleteSubmit}
              className="rounded-none text-xs h-9 bg-rose-600 text-white hover:bg-rose-700"
            >
              {deletingUser ? <Loader2 className="size-3.5 animate-spin" /> : "Delete Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Settings Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">System Settings & Staff Administration</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Global store rules, VAT percentage, staff accounts, and admin user management.
          </p>
        </div>

        <Button variant="default" onClick={handleSaveSettings} className="flex items-center gap-2 rounded-none bg-black text-white hover:bg-neutral-800">
          <Save className="size-4" />
          <span>{saved ? "Settings Saved!" : "Save All Settings"}</span>
        </Button>
      </div>

      {/* Admin Users & Staff Accounts Management Card */}
      <Card className="rounded-none shadow-none border-neutral-200 bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
              <Shield className="size-4 text-amber-500" />
              <span>Admin Users & Staff Accounts</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Manage regular admin accounts and staff login access credentials.
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={() => setIsAddAdminOpen(true)}
            className="flex items-center gap-1.5 text-xs bg-black text-white hover:bg-neutral-800 rounded-none shadow-none font-medium"
          >
            <UserPlus className="size-3.5" />
            <span>Add Regular Admin</span>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-neutral-50/50">
              <TableRow className="border-b border-neutral-200">
                <TableHead className="font-semibold text-xs text-foreground">Name</TableHead>
                <TableHead className="font-semibold text-xs text-foreground">Email</TableHead>
                <TableHead className="font-semibold text-xs text-foreground">Password</TableHead>
                <TableHead className="font-semibold text-xs text-foreground">Role</TableHead>
                <TableHead className="font-semibold text-xs text-foreground">Status</TableHead>
                <TableHead className="text-right font-semibold text-xs text-foreground pr-4">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingUsers ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs text-neutral-400">
                    Loading admin accounts...
                  </TableCell>
                </TableRow>
              ) : adminUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs text-neutral-400">
                    No staff accounts configured.
                  </TableCell>
                </TableRow>
              ) : (
                adminUsers.map((usr) => {
                  const isRevealed = !!revealedPasswords[usr.email];
                  const displayedPassword = isRevealed
                    ? revealedPasswords[usr.email]
                    : "••••••••";

                  return (
                    <TableRow key={usr.id} className="border-b border-neutral-200">
                      <TableCell className="font-medium text-xs text-foreground py-3">
                        {usr.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-neutral-600 py-3">
                        {usr.email}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 border border-neutral-200">
                            {displayedPassword}
                          </span>
                          <button
                            type="button"
                            onClick={() => openRevealPasswordModal(usr)}
                            title={isRevealed ? "Hide password" : "Reveal password (Requires SuperAdmin Identity)"}
                            className="p-1 text-neutral-400 hover:text-black transition-colors cursor-pointer bg-transparent border-none"
                          >
                            {isRevealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          className={`rounded-none text-[10px] font-mono uppercase px-2 py-0.5 shadow-none ${
                            usr.role === "superadmin"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {usr.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-neutral-500 py-3">
                        {usr.createdAt}
                      </TableCell>
                      <TableCell className="text-right pr-4 py-3">
                        {usr.role !== "superadmin" ? (
                          <button
                            onClick={() => openDeleteModal(usr)}
                            className="p-1 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer bg-transparent border-none"
                            title="Remove admin user"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-neutral-400 italic">Primary</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Store Config & VAT */}
        <Card className="rounded-none shadow-none border-neutral-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold tracking-tight">Financial & Store Rules</CardTitle>
            <CardDescription className="text-xs">VAT rates & business identity</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 font-sans">
            <div>
              <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                Store Business Name
              </label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="rounded-none" />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                Support Contact Email
              </label>
              <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="rounded-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                  Default Currency
                </label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-none" />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                  Global VAT Rate (%)
                </label>
                <Input type="number" value={vatPercent} onChange={(e) => setVatPercent(e.target.value)} className="rounded-none" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Shipping Regions & City Dropdowns */}
        <Card className="rounded-none shadow-none border-neutral-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold tracking-tight">Geographic Shipping Zones</CardTitle>
            <CardDescription className="text-xs">Populates checkout Region & City dropdowns</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-neutral-50/50">
                <TableRow className="border-b border-neutral-200">
                  <TableHead className="font-semibold text-xs text-foreground">Region / State</TableHead>
                  <TableHead className="font-semibold text-xs text-foreground">Cities Covered</TableHead>
                  <TableHead className="font-semibold text-xs text-foreground">Delivery Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((z) => (
                  <TableRow key={z.id} className="border-b border-neutral-200">
                    <TableCell className="font-semibold text-foreground text-xs py-3">{z.region}</TableCell>
                    <TableCell className="text-xs text-muted-foreground py-3">{z.cities}</TableCell>
                    <TableCell className="font-semibold text-xs text-emerald-600 py-3">৳{z.rateBdt} BDT</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

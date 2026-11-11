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
  setAdminPasswordAction,
  getAdminIdentityAction,
  fetchAdminStoreSettingsAction,
  updateAdminStoreSettingsAction,
  updateAdminShippingRegionAction,
} from "@/app/actions/admin-actions";
import { Save, UserPlus, Trash2, Shield, Eye, EyeOff, Loader2, KeyRound, AlertTriangle, Check, Edit2 } from "lucide-react";

interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  hasPassword?: boolean;
  isSelf?: boolean;
}

interface ShippingRegionRecord {
  id: string;
  regionName: string;
  cities: string;
  deliveryChargeBdt: number;
}

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState("LIVUS");
  const [supportEmail, setSupportEmail] = useState("support@livus.com.bd");
  const [supportPhone, setSupportPhone] = useState("+880 1711 000000");
  const [currency, setCurrency] = useState("BDT");
  const [vatPercent, setVatPercent] = useState("10");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("2500");
  const [defaultDeliveryCharge, setDefaultDeliveryCharge] = useState("150");
  const [bkashMerchantNumber, setBkashMerchantNumber] = useState("");
  const [nagadMerchantNumber, setNagadMerchantNumber] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("admin");
  const [savingSettings, setSavingSettings] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settingsError, setSettingsError] = useState("");

  // Shipping Regions state
  const [regions, setRegions] = useState<ShippingRegionRecord[]>([]);
  const [editingRegionId, setEditingRegionId] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<number>(100);
  const [updatingRegion, setUpdatingRegion] = useState(false);

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

  // Set-password dialog state (superadmin only)
  const [setPasswordOpen, setSetPasswordOpen] = useState(false);
  const [targetUserForPassword, setTargetUserForPassword] = useState<AdminUserRecord | null>(null);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const [setPasswordError, setSetPasswordError] = useState("");
  const [adminNotice, setAdminNotice] = useState("");
  const [adminListError, setAdminListError] = useState("");

  // Role of the signed-in admin, from the signed admin session (controls admin-management UI)
  const [myAdminRole, setMyAdminRole] = useState<string | null>(null);
  const isSuperAdmin = myAdminRole === "superadmin";

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

  const loadStoreSettings = async () => {
    try {
      const data = await fetchAdminStoreSettingsAction();
      if (data?.settings) {
        if (data.settings.storeName) setStoreName(data.settings.storeName);
        if (data.settings.supportEmail) setSupportEmail(data.settings.supportEmail);
        if (data.settings.supportPhone) setSupportPhone(data.settings.supportPhone);
        if (data.settings.currency) setCurrency(data.settings.currency);
        if (data.settings.vatPercent !== undefined) setVatPercent(data.settings.vatPercent.toString());
        if (data.settings.freeShippingThresholdBdt !== undefined) setFreeShippingThreshold(data.settings.freeShippingThresholdBdt.toString());
        if (data.settings.defaultDeliveryChargeBdt !== undefined) setDefaultDeliveryCharge(data.settings.defaultDeliveryChargeBdt.toString());
        setBkashMerchantNumber(data.settings.bKashMerchantNumber || "");
        setNagadMerchantNumber(data.settings.nagadMerchantNumber || "");
      }
      if ((data as any)?.currentUserRole) {
        setCurrentUserRole((data as any).currentUserRole);
      }
      if (data?.regions) {
        setRegions(data.regions);
      }
    } catch (err) {
      console.error("Failed to load store settings:", err);
    }
  };

  useEffect(() => {
    loadAdminUsers();
    loadStoreSettings();
    getAdminIdentityAction()
      .then((me) => setMyAdminRole(me?.role || "admin"))
      .catch(() => setMyAdminRole("admin"));
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsError("");
    try {
      const res = await updateAdminStoreSettingsAction({
        storeName,
        supportEmail,
        supportPhone,
        currency,
        vatPercent: parseInt(vatPercent) || 10,
        freeShippingThresholdBdt: parseInt(freeShippingThreshold) || 2500,
        defaultDeliveryChargeBdt: parseInt(defaultDeliveryCharge) || 150,
        bKashMerchantNumber: bkashMerchantNumber,
        nagadMerchantNumber: nagadMerchantNumber,
      });
      if (res.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem("my_store_vat_percent", vatPercent);
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setSettingsError(res.message || "Failed to save settings");
      }
    } catch (err: any) {
      setSettingsError(err?.message || "Failed to save store settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveRegionRate = async (id: string) => {
    setUpdatingRegion(true);
    try {
      const res = await updateAdminShippingRegionAction(id, editingRate);
      if (res.success) {
        setRegions((prev) => prev.map((r) => r.id === id ? { ...r, deliveryChargeBdt: editingRate } : r));
        setEditingRegionId(null);
      }
    } catch (err) {
      console.error("Failed to update shipping region rate:", err);
    } finally {
      setUpdatingRegion(false);
    }
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
        setAdminNotice(res.message || "Admin account saved.");
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

  const openSetPasswordModal = (usr: AdminUserRecord) => {
    setTargetUserForPassword(usr);
    setCurrentPasswordInput("");
    setNewPasswordInput("");
    setConfirmPasswordInput("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setSetPasswordError("");
    setSetPasswordOpen(true);
  };

  const handleSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserForPassword) return;
    if (!currentPasswordInput) {
      setSetPasswordError("Enter your current password to confirm your identity.");
      return;
    }
    if (newPasswordInput.length < 8) {
      setSetPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setSetPasswordError("New password and confirmation do not match.");
      return;
    }

    setSettingPassword(true);
    setSetPasswordError("");
    try {
      const res = await setAdminPasswordAction(
        targetUserForPassword.email,
        newPasswordInput,
        currentPasswordInput
      );
      if (res.success) {
        setSetPasswordOpen(false);
        setCurrentPasswordInput("");
        setNewPasswordInput("");
        setConfirmPasswordInput("");
        setAdminNotice(res.message || "Password updated.");
        loadAdminUsers();
      } else {
        setSetPasswordError(res.message || "Failed to set the new password.");
      }
    } catch (err) {
      setSetPasswordError(err instanceof Error ? err.message : "Failed to set the new password.");
    } finally {
      setSettingPassword(false);
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
      const res = await deleteAdminUserAction(targetUserForDelete.id, targetUserForDelete.email);
      setDeleteConfirmOpen(false);
      setTargetUserForDelete(null);
      if (res.success) {
        setAdminListError("");
        setAdminNotice(res.message || "Admin account deleted.");
      } else {
        setAdminNotice("");
        setAdminListError(res.message || "Failed to delete admin account.");
      }
      loadAdminUsers();
    } catch (err) {
      console.error("Failed to delete admin user:", err);
      setAdminListError(err instanceof Error ? err.message : "Failed to delete admin account.");
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
                  placeholder="At least 8 characters"
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

      {/* 2. Set New Password Modal (superadmin only) */}
      <Dialog open={setPasswordOpen} onOpenChange={setSetPasswordOpen}>
        <DialogContent className="sm:max-w-md rounded-none font-sans bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <KeyRound className="size-4 text-amber-500" />
              <span>Set New Password</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Set a new sign-in password for{" "}
              <strong className="text-foreground font-semibold">{targetUserForPassword?.name}</strong> (
              <span className="font-mono text-neutral-700">{targetUserForPassword?.email}</span>).
              Confirm with your own current password. Their other sessions will be signed out.
            </DialogDescription>
          </DialogHeader>

          {setPasswordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-none">
              {setPasswordError}
            </div>
          )}

          <form onSubmit={handleSetPasswordSubmit} className="flex flex-col gap-4 text-xs mt-2">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-foreground">Your Current Password (SuperAdmin)</label>
              <div className="relative w-full">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Enter your own current password"
                  autoComplete="current-password"
                  required
                  className="rounded-none h-9 text-xs pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-black cursor-pointer bg-transparent border-none"
                >
                  {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-foreground">New Password</label>
              <div className="relative w-full">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  className="rounded-none h-9 text-xs pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-black cursor-pointer bg-transparent border-none"
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-foreground">Confirm New Password</label>
              <div className="relative w-full">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Re-enter the new password"
                  autoComplete="new-password"
                  required
                  className="rounded-none h-9 text-xs pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-black cursor-pointer bg-transparent border-none"
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSetPasswordOpen(false)}
                className="rounded-none text-xs h-9 border-neutral-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={settingPassword}
                className="rounded-none text-xs h-9 bg-black text-white hover:bg-neutral-800"
              >
                {settingPassword ? <Loader2 className="size-3.5 animate-spin" /> : "Set Password"}
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
              Manage admin accounts and their sign-in passwords. Passwords are stored hashed and can never be viewed — only replaced.
            </CardDescription>
          </div>

          {isSuperAdmin && (
          <Button
            size="sm"
            onClick={() => { setAdminFormError(""); setIsAddAdminOpen(true); }}
            className="flex items-center gap-1.5 text-xs bg-black text-white hover:bg-neutral-800 rounded-none shadow-none font-medium"
          >
            <UserPlus className="size-3.5" />
            <span>Add Regular Admin</span>
          </Button>
          )}
        </CardHeader>
        <CardContent>
          {adminNotice && (
            <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-none flex items-center gap-2">
              <Check className="size-3.5" />
              <span>{adminNotice}</span>
            </div>
          )}
          {adminListError && (
            <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-none">
              {adminListError}
            </div>
          )}
          {myAdminRole && !isSuperAdmin && (
            <p className="mb-3 text-[11px] text-neutral-500">
              Read-only: only a superadmin can add, remove or change passwords for admin accounts.
            </p>
          )}
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
                  return (
                    <TableRow key={usr.id} className="border-b border-neutral-200">
                      <TableCell className="font-medium text-xs text-foreground py-3">
                        {usr.name}
                        {usr.isSelf && <span className="ml-1 text-[10px] text-neutral-400">(you)</span>}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-neutral-600 py-3">
                        {usr.email}
                      </TableCell>
                      <TableCell className="py-3">
                        {usr.hasPassword ? (
                          <span className="text-xs text-emerald-700">Password set</span>
                        ) : (
                          <span className="text-xs text-amber-700">No password — set one</span>
                        )}
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
                        {isSuperAdmin ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openSetPasswordModal(usr)}
                              className="flex items-center gap-1 px-2 py-1 text-[11px] text-neutral-600 hover:text-black border border-neutral-200 hover:border-black transition-colors cursor-pointer bg-transparent"
                              title="Set a new password for this admin"
                            >
                              <KeyRound className="size-3.5" />
                              <span>Set new password</span>
                            </button>
                            {!usr.isSelf && (
                              <button
                                type="button"
                                onClick={() => openDeleteModal(usr)}
                                className="p-1 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer bg-transparent border-none"
                                title="Remove admin user"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-400 italic">—</span>
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
            <CardDescription className="text-xs">VAT rates, payment gateways & business identity</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 font-sans">
            {saved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-none">
                Settings saved successfully to database!
              </div>
            )}
            {settingsError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-none">
                {settingsError}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                Store Business Name
              </label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="rounded-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                  Support Email
                </label>
                <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="rounded-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                  Support Phone
                </label>
                <Input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} className="rounded-none" />
              </div>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                  Free Shipping Threshold (BDT)
                </label>
                <Input type="number" value={freeShippingThreshold} onChange={(e) => setFreeShippingThreshold(e.target.value)} className="rounded-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                  Default Delivery Fee (BDT)
                </label>
                <Input type="number" value={defaultDeliveryCharge} onChange={(e) => setDefaultDeliveryCharge(e.target.value)} className="rounded-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                  bKash Merchant / Personal No. {currentUserRole !== 'superadmin' && <span className="text-[10px] text-amber-600 font-mono font-normal">(Superadmin Only)</span>}
                </label>
                <Input
                  value={bkashMerchantNumber}
                  onChange={(e) => setBkashMerchantNumber(e.target.value)}
                  disabled={currentUserRole !== 'superadmin'}
                  placeholder="e.g. 01712345678"
                  className="rounded-none disabled:bg-neutral-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                  Nagad Merchant / Personal No. {currentUserRole !== 'superadmin' && <span className="text-[10px] text-amber-600 font-mono font-normal">(Superadmin Only)</span>}
                </label>
                <Input
                  value={nagadMerchantNumber}
                  onChange={(e) => setNagadMerchantNumber(e.target.value)}
                  disabled={currentUserRole !== 'superadmin'}
                  placeholder="e.g. 01812345678"
                  className="rounded-none disabled:bg-neutral-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full rounded-none bg-black text-white hover:bg-neutral-800 text-xs font-medium h-9"
              >
                {savingSettings ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Save className="size-3.5 mr-1.5" />}
                <span>{saved ? "Settings Saved ✓" : "Save Store Settings"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Shipping Regions & City Dropdowns */}
        <Card className="rounded-none shadow-none border-neutral-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold tracking-tight">Geographic Shipping Zones</CardTitle>
            <CardDescription className="text-xs">Database-driven delivery fees per division across Bangladesh</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-neutral-50/50">
                <TableRow className="border-b border-neutral-200">
                  <TableHead className="font-semibold text-xs text-foreground">Region / Division</TableHead>
                  <TableHead className="font-semibold text-xs text-foreground">Cities</TableHead>
                  <TableHead className="font-semibold text-xs text-foreground text-right pr-4">Delivery Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-xs text-neutral-400">
                      Loading shipping regions...
                    </TableCell>
                  </TableRow>
                ) : (
                  regions.map((r) => (
                    <TableRow key={r.id} className="border-b border-neutral-200">
                      <TableCell className="font-semibold text-foreground text-xs py-3">{r.regionName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground py-3 max-w-[200px] truncate" title={r.cities}>
                        {r.cities}
                      </TableCell>
                      <TableCell className="text-right pr-4 py-3">
                        {editingRegionId === r.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Input
                              type="number"
                              value={editingRate}
                              onChange={(e) => setEditingRate(parseInt(e.target.value) || 0)}
                              className="w-20 h-7 text-xs rounded-none text-right font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRegionRate(r.id)}
                              disabled={updatingRegion}
                              className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer bg-transparent border-none"
                              title="Save rate"
                            >
                              <Check className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRegionId(null)}
                              className="p-1 text-neutral-400 hover:text-black cursor-pointer bg-transparent border-none"
                              title="Cancel"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-semibold text-xs text-emerald-600 font-mono">
                              ৳{r.deliveryChargeBdt} BDT
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRegionId(r.id);
                                setEditingRate(r.deliveryChargeBdt);
                              }}
                              className="p-1 text-neutral-400 hover:text-black transition-colors cursor-pointer bg-transparent border-none"
                              title="Edit shipping fee"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


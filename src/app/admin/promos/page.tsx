'use client';

import { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { fetchAdminPromos, createAdminPromoAction, deleteAdminPromoAction } from "@/app/actions/admin-actions";
import { Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import { promoCodeFormSchema } from "@/lib/validations";

interface PromoRow {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minCartValue?: number;
  usageLimit?: number;
  isActive: boolean;
}

export default function AdminPromosPage() {
  const [promosList, setPromosList] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed_amount">("percentage");
  const [discountValue, setDiscountValue] = useState("10");
  const [minCartValue, setMinCartValue] = useState("0");
  const [usageLimit, setUsageLimit] = useState("100");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAdminPromos();
    setPromosList(data.map(p => ({
      id: p.id,
      code: p.code,
      discountType: p.type === "fixed" ? "fixed_amount" : "percentage",
      discountValue: p.value,
      minCartValue: 0,
      usageLimit: 100,
      isActive: true,
    })));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const validation = promoCodeFormSchema.safeParse({
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue) || 10,
      minCartValue: Number(minCartValue) || 0,
      usageLimit: Number(usageLimit) || 100,
      isActive: true,
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || "Invalid promo code input.");
      return;
    }

    setSubmitting(true);
    const res = await createAdminPromoAction({
      code: code.toUpperCase(),
      type: discountType === "fixed_amount" ? "fixed" : "percentage",
      value: Number(discountValue) || 10,
    });

    if (res.success) {
      setCode("");
      setIsOpen(false);
      await loadData();
    }
    setSubmitting(false);
  };

  const toggleActive = (id: string) => {
    setPromosList(promosList.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  const handleDelete = async (id: string) => {
    setPromosList(promosList.filter((p) => p.id !== id));
    await deleteAdminPromoAction(id);
    await loadData();
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Discounts & Promo Codes Engine
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage discount codes, minimum cart values, usage limits, and manual kill-switch toggles in Neon PostgreSQL.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={
            <Button variant="default" className="flex items-center gap-2">
              <Plus className="size-4" />
              <span>Create Promo Code</span>
            </Button>
          } />
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Promo Code</DialogTitle>
              <DialogDescription>
                Validated with Zod to enforce discount rules and limits.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddPromo} className="flex flex-col gap-4 py-2 font-sans">
              {formError && (
                <div className="p-2 rounded bg-destructive/10 text-destructive text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                  Promo Code *
                </label>
                <Input
                  required
                  placeholder="e.g. LIVUS10"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                    Discount Type
                  </label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount (BDT)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                    Discount Value *
                  </label>
                  <Input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                    Min Spend (BDT)
                  </label>
                  <Input
                    type="number"
                    value={minCartValue}
                    onChange={(e) => setMinCartValue(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                    Usage Limit (Max Uses)
                  </label>
                  <Input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Promo Code"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight">
            Active & Archived Promos ({promosList.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Live discount vouchers validated at checkout
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount Value</TableHead>
                <TableHead>Min Cart Spend</TableHead>
                <TableHead>Usage Limit</TableHead>
                <TableHead>Kill-Switch Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-xs">
                    Loading promo codes...
                  </TableCell>
                </TableRow>
              ) : (
                promosList.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-mono font-bold text-xs">
                      {promo.code}
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600">
                      {promo.discountType === "percentage"
                        ? `${promo.discountValue}% OFF`
                        : `৳${promo.discountValue} BDT OFF`}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {promo.minCartValue ? `৳${promo.minCartValue} BDT` : "No Min Spend"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {promo.usageLimit ? `${promo.usageLimit} uses` : "Unlimited"}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleActive(promo.id)}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        {promo.isActive ? (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 flex items-center gap-1">
                            <CheckCircle className="size-3" />
                            <span>Active</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <XCircle className="size-3 text-muted-foreground" />
                            <span>Disabled</span>
                          </Badge>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(promo.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

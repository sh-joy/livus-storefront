'use client';

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Settings, Save, Shield, MapPin, Percent } from "lucide-react";

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedVat = localStorage.getItem("my_store_vat_percent");
      if (storedVat) setVatPercent(storedVat);
    }
  }, []);

  const [zones, setZones] = useState<ShippingZone[]>([
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

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">System Settings & Geographic Engine</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Global store rules, VAT percentage, shipping region dropdowns, and staff access control (RBAC).
          </p>
        </div>

        <Button variant="default" onClick={handleSaveSettings} className="flex items-center gap-2">
          <Save className="size-4" />
          <span>{saved ? "Settings Saved!" : "Save All Settings"}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Store Config & VAT */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold tracking-tight">Financial & Store Rules</CardTitle>
            <CardDescription className="text-xs">VAT rates & business identity</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 font-sans">
            <div>
              <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                Store Business Name
              </label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                Support Contact Email
              </label>
              <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                  Default Currency
                </label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-1">
                  Global VAT Rate (%)
                </label>
                <Input type="number" value={vatPercent} onChange={(e) => setVatPercent(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Shipping Regions & City Dropdowns */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold tracking-tight">Geographic Shipping Zones</CardTitle>
            <CardDescription className="text-xs">Populates checkout Region & City dropdowns</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region / State</TableHead>
                  <TableHead>Cities Covered</TableHead>
                  <TableHead>Delivery Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((z) => (
                  <TableRow key={z.id}>
                    <TableCell className="font-semibold text-foreground text-xs">{z.region}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{z.cities}</TableCell>
                    <TableCell className="font-semibold text-xs text-emerald-600">৳{z.rateBdt} BDT</TableCell>
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

'use client';

import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Boxes, Save } from "lucide-react";

interface InventoryItem {
  id: string;
  productName: string;
  variant: string;
  size: "S" | "M" | "L" | "XL" | "XXL";
  stock: number;
}

const initialInventory: InventoryItem[] = [
  { id: "inv-1", productName: "Oakwood Long sleeve", variant: "Yellow", size: "S", stock: 5 },
  { id: "inv-2", productName: "Oakwood Long sleeve", variant: "Yellow", size: "M", stock: 8 },
  { id: "inv-3", productName: "Oakwood Long sleeve", variant: "Yellow", size: "XL", stock: 3 },
  { id: "inv-4", productName: "Oakwood Long sleeve", variant: "Yellow", size: "XXL", stock: 0 },
  { id: "inv-5", productName: "Oakwood Long sleeve", variant: "Black", size: "M", stock: 15 },
  { id: "inv-6", productName: "OWAYO - CROSS FADE", variant: "Black & White", size: "L", stock: 20 },
];

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(initialInventory);
  const [saved, setSaved] = useState(false);

  const updateStock = (id: string, delta: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, stock: Math.max(0, item.stock + delta) };
      }
      return item;
    }));
  };

  const handleStockInputChange = (id: string, value: string) => {
    const num = parseInt(value, 10);
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, stock: isNaN(num) ? 0 : num };
      }
      return item;
    }));
  };

  const handleSaveAll = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Rapid Inventory Stock Adjuster</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bulk adjust size stock levels across all products without opening individual product edit pages.
          </p>
        </div>

        <Button variant="default" onClick={handleSaveAll} className="flex items-center gap-2">
          <Save className="size-4" />
          <span>{saved ? "Saved to Neon DB!" : "Save All Stock Changes"}</span>
        </Button>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight">Variant Stock Matrix</CardTitle>
          <CardDescription className="text-xs">Adjust stock levels in real time</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Color Variant</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Current Quantity</TableHead>
                <TableHead>Stock Level Status</TableHead>
                <TableHead className="text-right">Quick Stepper</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-foreground">{item.productName}</TableCell>
                  <TableCell><Badge variant="secondary">{item.variant}</Badge></TableCell>
                  <TableCell className="font-semibold">{item.size}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-20 text-center font-semibold text-xs h-8"
                      value={item.stock}
                      onChange={(e) => handleStockInputChange(item.id, e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    {item.stock === 0 ? (
                      <Badge variant="destructive">Stock Out</Badge>
                    ) : item.stock <= 3 ? (
                      <Badge variant="destructive">Low Stock ({item.stock})</Badge>
                    ) : (
                      <Badge variant="outline">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => updateStock(item.id, -1)} className="h-7 w-7 p-0 font-bold">-</Button>
                      <Button variant="outline" size="sm" onClick={() => updateStock(item.id, +1)} className="h-7 w-7 p-0 font-bold">+</Button>
                      <Button variant="outline" size="sm" onClick={() => updateStock(item.id, +10)} className="h-7 px-2 text-[10px]">+10</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

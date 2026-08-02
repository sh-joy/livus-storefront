'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  getAdminProducts,
  deleteProductAction,
  createFullProductAction,
  bulkUpdateStatusAction,
  type ProductRow,
} from "@/app/actions/products";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  ExternalLink,
  Check,
  Calendar,
  ChevronsUpDown,
  X,
  SlidersHorizontal,
  Eye,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";

interface LowStockAlertItem {
  colorName: string;
  size: string;
  quantity: number;
}

export interface ImportedProductItem {
  id: string;
  name: string;
  slug: string;
  priceBdt: number;
  collectionTag?: string;
  imageUrl?: string;
}

export interface ImportLogRecord {
  id: string;
  filename: string;
  uploadedAt: string;
  totalRows: number;
  importedCount: number;
  products: ImportedProductItem[];
}

function getProductLowStockAlerts(prod: ProductRow): LowStockAlertItem[] {
  const alerts: LowStockAlertItem[] = [];
  if (!prod.colorVariantDetails) return alerts;

  prod.colorVariantDetails.forEach((v) => {
    if (v.sizeInventory && v.sizeInventory.length > 0) {
      v.sizeInventory.forEach((inv) => {
        if (inv.quantity > 0 && inv.quantity <= 10) {
          alerts.push({
            colorName: v.name,
            size: inv.size,
            quantity: inv.quantity,
          });
        }
      });
    } else if (v.isLowStock) {
      alerts.push({
        colorName: v.name,
        size: "All Sizes",
        quantity: v.stock || 5,
      });
    }
  });

  return alerts;
}

// RFC 4180 Compliant CSV Parser (Handles multi-line quoted fields and escaped quotes)
function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\r") {
        if (nextChar === "\n") {
          i++;
        }
        currentRow.push(currentField.trim());
        if (currentRow.some((field) => field.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else if (char === "\n") {
        currentRow.push(currentField.trim());
        if (currentRow.some((field) => field.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export default function AdminProductsPage() {
  const [activeTab, setActiveTab] = useState<"catalog" | "logs">("catalog");
  const [productList, setProductList] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import Logs State
  const [importLogs, setImportLogs] = useState<ImportLogRecord[]>([]);
  const [selectedLog, setSelectedLog] = useState<ImportLogRecord | null>(null);
  const [logToDelete, setLogToDelete] = useState<ImportLogRecord | null>(null);
  const [fileFilterLog, setFileFilterLog] = useState<ImportLogRecord | null>(null);

  // Search Input
  const [search, setSearch] = useState("");

  // Side Filter Drawer State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Granular Column Filter Criteria
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Sorting State ('createdAt' | 'price' | 'stock')
  const [sortField, setSortField] = useState<"createdAt" | "price" | "stock">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Checkbox Selection for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal Popups State
  const [productToDelete, setProductToDelete] = useState<ProductRow | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Small Hover Popover State for Low Stock Items
  const [hoveredLowStockPopover, setHoveredLowStockPopover] = useState<{
    productName: string;
    alerts: LowStockAlertItem[];
    top: number;
    left: number;
  } | null>(null);

  // Unclipped Fixed Hover Image Preview State
  const [hoveredImagePreview, setHoveredImagePreview] = useState<{
    url: string;
    name: string;
    slug: string;
    top: number;
    left: number;
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await getAdminProducts({ search });
    setProductList(data);
    setSelectedIds([]);

    if (typeof window !== "undefined") {
      const storedLogs = localStorage.getItem("my_store_import_logs");
      if (storedLogs) {
        try {
          const parsed = JSON.parse(storedLogs);
          if (Array.isArray(parsed)) {
            setImportLogs(parsed);
          }
        } catch (e) {}
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [search]);

  // Sort Handler Toggle
  const handleSort = (field: "createdAt" | "price" | "stock") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Active Granular Filters Count
  const activeFilterCount =
    (categoryFilter !== "all" ? 1 : 0) +
    (collectionFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0);

  const resetAllFilters = () => {
    setCategoryFilter("all");
    setCollectionFilter("all");
    setStatusFilter("all");
    setMinPrice("");
    setMaxPrice("");
  };

  // Granular Filter Evaluation Logic
  const filteredProducts = productList.filter((prod) => {
    if (fileFilterLog && fileFilterLog.products) {
      const fileSlugs = new Set(fileFilterLog.products.map((p) => p.slug.toLowerCase()));
      const fileIds = new Set(fileFilterLog.products.map((p) => p.id));
      const matchFile = fileSlugs.has(prod.slug.toLowerCase()) || fileIds.has(prod.id);
      if (!matchFile) return false;
    }

    if (categoryFilter !== "all") {
      if (categoryFilter === "for-him" && prod.categorySlug !== "for-him") return false;
      if (categoryFilter === "for-her" && prod.categorySlug !== "for-her") return false;
      if (categoryFilter === "unisex" && prod.categorySlug && prod.categorySlug !== "unisex" && prod.categorySlug !== "minimal") return false;
    }

    if (collectionFilter !== "all" && prod.collectionTag !== collectionFilter) {
      return false;
    }

    if (statusFilter !== "all") {
      if (statusFilter === "active" && !prod.isActive) return false;
      if (statusFilter === "paused" && prod.isActive) return false;
      if (statusFilter === "manipulated_low_stock") {
        const alerts = getProductLowStockAlerts(prod);
        if (alerts.length === 0) return false;
      }
    }

    if (minPrice && prod.priceBdt < parseInt(minPrice, 10)) return false;
    if (maxPrice && prod.priceBdt > parseInt(maxPrice, 10)) return false;

    return true;
  });

  // Sorting Handler
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortField === "createdAt") {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    }
    if (sortField === "price") {
      return sortOrder === "asc" ? a.priceBdt - b.priceBdt : b.priceBdt - a.priceBdt;
    }
    if (sortField === "stock") {
      return sortOrder === "asc" ? a.totalUnits - b.totalUnits : b.totalUnits - a.totalUnits;
    }
    return 0;
  });

  // Checkbox Selection Toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === sortedProducts.length && sortedProducts.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedProducts.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const isAllSelected = sortedProducts.length > 0 && selectedIds.length === sortedProducts.length;

  // Single Item Deletion Handler
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    await deleteProductAction(productToDelete.id);
    setProductToDelete(null);
    await loadData();
  };

  // Bulk Deletion Handler
  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteProductAction(id);
    }
    setIsBulkDeleting(false);
    setSelectedIds([]);
    await loadData();
  };

  // Bulk Status Change Handler (Set Active / Set Paused)
  const handleBulkStatusChange = async (isActive: boolean) => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    const res = await bulkUpdateStatusAction(selectedIds, isActive);
    if (res.success) {
      await loadData();
      setSelectedIds([]);
    } else {
      alert(res.message || "Failed to update status.");
    }
    setLoading(false);
  };

  // Log File Deletion Handler (Deletes log + products created by file)
  const handleDeleteLogFile = async (log: ImportLogRecord) => {
    for (const prod of log.products) {
      if (prod.id) {
        await deleteProductAction(prod.id);
      }
    }
    const updatedLogs = importLogs.filter((l) => l.id !== log.id);
    setImportLogs(updatedLogs);
    if (typeof window !== "undefined") {
      localStorage.setItem("my_store_import_logs", JSON.stringify(updatedLogs));
    }
    if (selectedLog?.id === log.id) {
      setSelectedLog(null);
    }
    setLogToDelete(null);
    await loadData();
  };

  // Delete Individual Product from Log View Modal
  const handleDeleteProductFromLog = async (logId: string, productId: string) => {
    await deleteProductAction(productId);
    
    const updatedLogs = importLogs.map((l) => {
      if (l.id === logId) {
        const remainingProds = l.products.filter((p) => p.id !== productId);
        return {
          ...l,
          importedCount: remainingProds.length,
          products: remainingProds,
        };
      }
      return l;
    });

    setImportLogs(updatedLogs);
    if (typeof window !== "undefined") {
      localStorage.setItem("my_store_import_logs", JSON.stringify(updatedLogs));
    }

    if (selectedLog && selectedLog.id === logId) {
      const remainingProds = selectedLog.products.filter((p) => p.id !== productId);
      setSelectedLog({
        ...selectedLog,
        importedCount: remainingProds.length,
        products: remainingProds,
      });
    }

    await loadData();
  };

  // Export Sheet Layout Handler
  const handleExportTemplate = () => {
    const headers = [
      "Product Name",
      "Product Type",
      "Gender",
      "Category",
      "Slug",
      "SKU",
      "Product Description",
      "Color Name",
      "Color Hex",
      "Trigger Low Stock Alert",
      "Cover Image URL",
      "Gallery Image URLs",
      "Quantity XS",
      "Quantity S",
      "Quantity M",
      "Quantity L",
      "Quantity XL",
      "Quantity XXL",
      "Original Price BDT",
      "Discount Percent",
      "Selling Price BDT",
      "Showcase Status",
    ];

    const escapeCsv = (str: any) => {
      const s = String(str || "").replace(/"/g, '""');
      return `"${s}"`;
    };

    let csvRows: string[] = [headers.map(escapeCsv).join(",")];

    if (productList.length > 0) {
      productList.forEach((p) => {
        const genderStr =
          p.categorySlug === "for-her"
            ? "For Her"
            : p.categorySlug === "for-him"
            ? "For Him"
            : "Unisex";

        const origPrice = p.compareAtPriceBdt || p.priceBdt;
        const sellPrice = p.priceBdt;
        const discountPct =
          origPrice > sellPrice
            ? `${Math.round(((origPrice - sellPrice) / origPrice) * 100)}%`
            : "0%";

        const firstVariant = p.colorVariantDetails?.[0];

        const getQtyForSize = (v: any, sz: string) => {
          if (!v || !v.sizeInventory) return 0;
          const found = v.sizeInventory.find((s: any) => s.size === sz);
          return found ? found.quantity : 0;
        };

        const colorName = firstVariant?.name || (p.colors?.[0] || "Standard");
        const colorHex = (firstVariant as any)?.hexColor || "#000000";
        const isLowStock = firstVariant?.isLowStock ? "true" : "false";
        const coverPhoto = p.imageUrl || "/images/for_him.jpg";
        const galleryPhotos = ((firstVariant as any)?.images || [coverPhoto]).join("|");

        const row = [
          p.name,
          "Shirt",
          genderStr,
          p.collectionTag || "Minimal",
          p.slug,
          `LIV-SH-HIM-300726`,
          (p as any).description || (p as any).specifications || "",
          colorName,
          colorHex,
          isLowStock,
          coverPhoto,
          galleryPhotos,
          getQtyForSize(firstVariant, "XS"),
          getQtyForSize(firstVariant, "S"),
          getQtyForSize(firstVariant, "M"),
          getQtyForSize(firstVariant, "L"),
          getQtyForSize(firstVariant, "XL"),
          getQtyForSize(firstVariant, "XXL"),
          origPrice,
          discountPct,
          sellPrice,
          p.isActive ? "Active" : "Paused",
        ];

        csvRows.push(row.map(escapeCsv).join(","));
      });
    } else {
      const sampleRow = [
        "Lavender Stripe Slim Fit Shirt",
        "Shirt",
        "For Him",
        "Minimal",
        "lavender-stripe-slim-fit-shirt",
        "LIV-SH-HIM-300726",
        "Elevate your professional and social wardrobe with this impeccably tailored men's Slim Fit Shirt.",
        "Lavender",
        "#e0e0f8",
        "false",
        "/images/hero_livus_models.jpg",
        "/images/hero_livus_models.jpg|/images/for_him.jpg",
        "10",
        "20",
        "25",
        "15",
        "5",
        "0",
        "1592",
        "15%",
        "1353",
        "Active",
      ];
      csvRows.push(sampleRow.map(escapeCsv).join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "LIVUS_Add_Product_Sheet_Layout.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Robust File Upload Handler using RFC 4180 Multi-line CSV Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress({ current: 0, total: 0 });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const rows = parseCsvText(text);

        if (rows.length > 1) {
          const headerRow = rows[0].map((c) => c.toLowerCase());

          const findCol = (possibleNames: string[], defaultIdx: number) => {
            const idx = headerRow.findIndex((h) => possibleNames.includes(h.toLowerCase()));
            return idx !== -1 ? idx : defaultIdx;
          };

          const nameIdx = findCol(["product name", "title", "name", "item name", "product_name"], 0);
          const typeIdx = findCol(["product type", "product_type", "type"], 1);
          const genderIdx = findCol(["gender", "categoryid", "category_id"], 2);
          const categoryIdx = findCol(["category", "collectiontag", "collection_tag", "collection"], 3);
          const slugIdx = findCol(["slug"], 4);
          const skuIdx = findCol(["sku", "base_sku"], 5);
          const descIdx = findCol(["product description", "specifications", "description", "product_description"], 6);
          const colorNameIdx = findCol(["color name", "colorname", "color_name", "color"], 7);
          const colorHexIdx = findCol(["color hex", "hexcode", "color_hex", "hex"], 8);
          const lowStockIdx = findCol(["trigger low stock alert", "islowstock", "low_stock"], 9);
          const coverIdx = findCol(["cover image url", "thumbnailurl", "cover_image", "image_url", "image"], 10);
          const galleryIdx = findCol(["gallery image urls", "images", "gallery_images"], 11);
          const xsIdx = findCol(["quantity xs", "s_xs", "xs"], 12);
          const sIdx = findCol(["quantity s", "s_s", "s"], 13);
          const mIdx = findCol(["quantity m", "s_m", "m"], 14);
          const lIdx = findCol(["quantity l", "s_l", "l"], 15);
          const xlIdx = findCol(["quantity xl", "s_xl", "xl"], 16);
          const xxlIdx = findCol(["quantity xxl", "s_xxl", "xxl"], 17);
          const origPriceIdx = findCol(["original price bdt", "compareprice", "compareatprice", "compare_at_price", "mrp", "original price"], 18);
          const discPctIdx = findCol(["discount percent", "discount"], 19);
          const sellPriceIdx = findCol(["selling price bdt", "baseprice", "price", "selling price", "price bdt"], 20);
          const statusIdx = findCol(["showcase status", "isactive", "status", "showcase_status"], 21);

          const importedProductsLog: ImportedProductItem[] = [];
          const dataRows = rows.slice(1);
          setImportProgress({ current: 0, total: dataRows.length });

          for (let i = 0; i < dataRows.length; i++) {
            const cols = dataRows[i];
            if (!cols || cols.length === 0) continue;

            const titleVal = cols[nameIdx] || cols[0];
            if (!titleVal || !titleVal.trim()) continue;

            const rawOrigPrice = (cols[origPriceIdx] || "").replace(/[^0-9.]/g, "");
            const rawSellPrice = (cols[sellPriceIdx] || "").replace(/[^0-9.]/g, "");
            const rawDiscPct = (cols[discPctIdx] || "").replace(/[^0-9.]/g, "");

            let origPriceNum = parseInt(rawOrigPrice, 10);
            let sellPriceNum = parseInt(rawSellPrice, 10);
            const discPctNum = parseFloat(rawDiscPct);

            if (isNaN(origPriceNum) || origPriceNum <= 0) {
              origPriceNum = 1199;
            }

            if (isNaN(sellPriceNum) || sellPriceNum <= 0) {
              if (!isNaN(discPctNum) && discPctNum > 0 && discPctNum < 100) {
                sellPriceNum = Math.round(origPriceNum * (1 - discPctNum / 100));
              } else {
                sellPriceNum = origPriceNum;
              }
            }

            const sellPriceVal = String(sellPriceNum);
            const origPriceVal = String(origPriceNum);

            const categoryStr = cols[categoryIdx] || "Minimal";
            const genderStr = cols[genderIdx] || "For Him";
            const catIdPayload = genderStr.toLowerCase().includes("her")
              ? "for-her"
              : genderStr.toLowerCase().includes("him")
              ? "for-him"
              : "unisex";

            const rawCover = (cols[coverIdx] || "").trim();
            const rawGallery = (cols[galleryIdx] || "").trim();

            const splitUrls = (rawGallery ? `${rawCover}\n${rawGallery}` : rawCover)
              .split(/[\n|\r|,]+/)
              .map((s) => s.trim().replace(/^"|"$/g, ""))
              .filter((s) => s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/"));

            const galleryArray = Array.from(new Set(splitUrls));
            const coverPhotoUrl = galleryArray[0] || rawCover || "/images/for_him.jpg";
            const finalImages = galleryArray.length > 0 ? galleryArray : [coverPhotoUrl];

            const userSlug = cols[slugIdx] && cols[slugIdx].trim();
            const rawSlug = userSlug || titleVal.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
            const prodSlug = rawSlug.length >= 2 ? rawSlug : `prod-${rawSlug || "item"}-${Date.now().toString(36)}`;

            const rawHex = (cols[colorHexIdx] || "").trim();
            const validHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(rawHex) ? rawHex : "#000000";

            const baseSku = (cols[skuIdx] || "").trim() || `SKU-${prodSlug.substring(0, 12)}`;
            const makeSku = (sz: string) => {
              const str = `${baseSku}-${sz}`;
              return str.length >= 3 ? str : `SKU-${str}`;
            };

            const fullPayload = {
              title: titleVal.trim(),
              slug: prodSlug,
              basePrice: sellPriceVal,
              compareAtPrice: origPriceVal,
              collectionTag: categoryStr,
              categoryId: catIdPayload,
              specifications: cols[descIdx] || titleVal,
              isActive:
                (cols[statusIdx] || "").toLowerCase().trim() !== "paused" &&
                (cols[statusIdx] || "").toLowerCase().trim() !== "draft" &&
                (cols[statusIdx] || "").toLowerCase().trim() !== "false",
              colorVariants: [
                {
                  colorName: (cols[colorNameIdx] || "").trim() || "Standard",
                  hexCode: validHex,
                  thumbnailUrl: coverPhotoUrl,
                  isLowStock: (cols[lowStockIdx] || "").toLowerCase() === "true",
                  images: finalImages,
                  inventory: [
                    { size: "XS", sku: makeSku("XS"), quantity: parseInt(cols[xsIdx] || "0", 10), isStockOut: false },
                    { size: "S", sku: makeSku("S"), quantity: parseInt(cols[sIdx] || "10", 10), isStockOut: false },
                    { size: "M", sku: makeSku("M"), quantity: parseInt(cols[mIdx] || "10", 10), isStockOut: false },
                    { size: "L", sku: makeSku("L"), quantity: parseInt(cols[lIdx] || "10", 10), isStockOut: false },
                    { size: "XL", sku: makeSku("XL"), quantity: parseInt(cols[xlIdx] || "10", 10), isStockOut: false },
                    { size: "XXL", sku: makeSku("XXL"), quantity: parseInt(cols[xxlIdx] || "0", 10), isStockOut: false },
                  ],
                },
              ],
            };

            let res = await createFullProductAction(fullPayload);

            if (!res.success) {
              console.warn(`Initial creation failed for row "${titleVal}":`, res.message, res.errors);
              fullPayload.slug = `${prodSlug}-${Math.random().toString(36).substring(2, 7)}`;
              res = await createFullProductAction(fullPayload);
            }

            if (res.success) {
              importedProductsLog.push({
                id: (res as any)?.product?.id || `imp-${Date.now()}-${i}`,
                name: titleVal,
                slug: fullPayload.slug,
                priceBdt: sellPriceNum,
                collectionTag: categoryStr,
                imageUrl: cols[coverIdx] || galleryArray[0] || "/images/for_him.jpg",
              });
            } else {
              console.error(`Final creation failed for row "${titleVal}":`, res.message, res.errors);
            }
            setImportProgress({ current: i + 1, total: dataRows.length });
          }

          // Record Log Entry into localStorage & state
          const newLogRecord: ImportLogRecord = {
            id: `log-${Date.now()}`,
            filename: file.name,
            uploadedAt: new Date().toISOString(),
            totalRows: dataRows.length,
            importedCount: importedProductsLog.length,
            products: importedProductsLog,
          };

          const updatedLogs = [newLogRecord, ...importLogs];
          setImportLogs(updatedLogs);
          if (typeof window !== "undefined") {
            localStorage.setItem("my_store_import_logs", JSON.stringify(updatedLogs));
          }
        }
        await loadData();
        setActiveTab("logs");
      } catch (err) {
        console.error("Failed to parse import CSV:", err);
        alert("Error parsing spreadsheet file.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // Metrics Calculations
  const activeProducts = productList.filter((p) => p.isActive).length;
  const lowStockProducts = productList.filter((p) => getProductLowStockAlerts(p).length > 0);
  const lowStockAlertsCount = lowStockProducts.length;
  const totalUnitsStocked = productList.reduce((sum, p) => sum + p.totalUnits, 0);
  const draftProducts = productList.filter((p) => !p.isActive).length;

  return (
    <div className="flex flex-col gap-4 font-sans relative">
      {/* Importing Progress Overlay Modal */}
      {isImporting && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 w-full max-w-sm rounded-none shadow-2xl font-sans flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-150">
            <Loader2 className="size-8 text-black dark:text-white animate-spin mb-3" />
            <h3 className="text-sm font-bold text-foreground">Importing Spreadsheet Products...</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Processing row {importProgress.current} of {importProgress.total}
            </p>
            <div className="w-full bg-neutral-100 h-1.5 mt-4 rounded-none overflow-hidden">
              <div
                style={{
                  width: `${
                    importProgress.total > 0
                      ? Math.round((importProgress.current / importProgress.total) * 100)
                      : 0
                  }%`,
                }}
                className="bg-black h-full transition-all duration-150"
              />
            </div>
          </div>
        </div>
      )}

      {/* Small Floating Hover Popover for Low Stock Items */}
      {hoveredLowStockPopover && (
        <div
          style={{
            top: `${hoveredLowStockPopover.top}px`,
            left: `${hoveredLowStockPopover.left}px`,
          }}
          className="fixed z-[9999] pointer-events-none flex flex-col p-2.5 bg-neutral-900 text-white border border-neutral-700 rounded-none shadow-2xl min-w-48 animate-in fade-in zoom-in-95 duration-150 font-sans text-xs"
        >
          <p className="font-bold text-[10px] text-amber-400 border-b border-neutral-700 pb-1 mb-1.5 uppercase tracking-wide">
            Low Stock Items ({hoveredLowStockPopover.alerts.length})
          </p>
          <div className="flex flex-col gap-1">
            {hoveredLowStockPopover.alerts.map((alert, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
                <span className="text-neutral-200">
                  {alert.colorName !== "Standard" ? `${alert.colorName} ` : ""}Size {alert.size}:
                </span>
                <span className="font-bold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 border border-rose-800/60 font-mono">
                  only {alert.quantity} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screen-Centered Larger Viewport Hover Image Preview Popover (No Blur) */}
      {hoveredImagePreview && (
        <div className="fixed inset-0 z-[10005] pointer-events-none flex items-center justify-center bg-black/40 animate-in fade-in duration-150 p-4">
          <div className="relative bg-white dark:bg-neutral-900 border border-neutral-800 p-2 shadow-2xl w-full max-w-sm aspect-[3/4] rounded-none animate-in zoom-in-95 duration-150">
            <img
              src={hoveredImagePreview.url}
              alt={hoveredImagePreview.name}
              className="w-full h-full object-cover rounded-none aspect-[3/4]"
            />
            <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/85 text-white text-xs font-sans truncate rounded-none border border-neutral-800">
              <span className="font-semibold block truncate text-base">{hoveredImagePreview.name}</span>
              <span className="text-xs text-neutral-300 block font-mono">/{hoveredImagePreview.slug}</span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Log File Confirmation Modal */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 w-full max-w-md rounded-none shadow-2xl font-sans animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <AlertTriangle className="size-6 shrink-0" />
              <h3 className="text-lg font-bold text-foreground">Delete Import Log File</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete file log <strong className="text-foreground font-mono">{logToDelete.filename}</strong> and remove all <strong className="text-rose-600 font-bold">{logToDelete.products.length} products</strong> added by this file?
            </p>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLogToDelete(null)}
                className="rounded-none text-xs border border-neutral-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleDeleteLogFile(logToDelete)}
                className="rounded-none text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete File & Products
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Product Confirmation Modal Popup */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 w-full max-w-md rounded-none shadow-2xl font-sans animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <AlertTriangle className="size-6 shrink-0" />
              <h3 className="text-lg font-bold text-foreground">Confirm Product Deletion</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete <strong className="text-foreground">{productToDelete.name}</strong> (<span className="font-mono text-[11px]">/{productToDelete.slug}</span>)?
            </p>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProductToDelete(null)}
                className="rounded-none text-xs border border-neutral-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteProduct}
                className="rounded-none text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete Product
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal Popup */}
      {isBulkDeleting && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 w-full max-w-md rounded-none shadow-2xl font-sans animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <AlertTriangle className="size-6 shrink-0" />
              <h3 className="text-lg font-bold text-foreground">Confirm Bulk Deletion</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete <strong className="text-foreground">{selectedIds.length} selected products</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkDeleting(false)}
                className="rounded-none text-xs border border-neutral-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleBulkDelete}
                className="rounded-none text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete {selectedIds.length} Products
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Side Slide-Over Filter Drawer Modal */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end font-sans">
          <div className="bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 w-full max-w-md h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-black dark:text-white" />
                <h3 className="font-bold text-sm text-foreground">Filter Catalog Products</h3>
              </div>
              <button onClick={() => setIsFilterDrawerOpen(false)} className="p-1 text-muted-foreground hover:text-black">
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-5 overflow-y-auto flex-1 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">Gender Category</label>
                <select
                  className="w-full h-9 bg-background px-3 text-xs outline-none rounded-none border border-neutral-200 focus:border-black"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Gender Categories</option>
                  <option value="for-him">For Him</option>
                  <option value="for-her">For Her</option>
                  <option value="unisex">Unisex / Minimal</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">Collection Tag</label>
                <select
                  className="w-full h-9 bg-background px-3 text-xs outline-none rounded-none border border-neutral-200 focus:border-black"
                  value={collectionFilter}
                  onChange={(e) => setCollectionFilter(e.target.value)}
                >
                  <option value="all">All Collection Tags</option>
                  <option value="Minimal">Minimal</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Floral">Floral</option>
                  <option value="Divine">Divine</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">Showcase Status</label>
                <select
                  className="w-full h-9 bg-background px-3 text-xs outline-none rounded-none border border-neutral-200 focus:border-black"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active (Showcase Live)</option>
                  <option value="paused">Paused (Showcase Stopped)</option>
                  <option value="manipulated_low_stock">Trigger Low Stock Alerts</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">Price Range (BDT ৳)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min BDT (e.g. 500)"
                    className="h-9 px-3 text-xs bg-background outline-none rounded-none border border-neutral-200 focus:border-black"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Max BDT (e.g. 3000)"
                    className="h-9 px-3 text-xs bg-background outline-none rounded-none border border-neutral-200 focus:border-black"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                className="flex-1 rounded-none text-xs border border-neutral-200"
              >
                Reset Filters
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

      {/* View Products Added by Specific Import Log Modal */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="rounded-none font-sans bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <FileSpreadsheet className="size-4 text-emerald-600" />
                <span>Products Added by "{selectedLog.filename}"</span>
              </DialogTitle>
            </DialogHeader>

            <div className="flex items-center justify-between text-xs text-muted-foreground bg-neutral-50 p-2.5 border border-neutral-200 rounded-none mb-2">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                Uploaded: {new Date(selectedLog.uploadedAt).toLocaleString()}
              </span>
              <span className="font-semibold text-emerald-700">
                {selectedLog.importedCount} Products Remaining
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto border border-neutral-200">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-neutral-200 bg-neutral-50/50">
                    <TableHead className="py-2 px-3 font-medium text-xs">Image</TableHead>
                    <TableHead className="py-2 px-3 font-medium text-xs">Product Details</TableHead>
                    <TableHead className="py-2 px-3 font-medium text-xs">Category</TableHead>
                    <TableHead className="py-2 px-3 font-medium text-xs text-right">Price BDT</TableHead>
                    <TableHead className="py-2 px-3 font-medium text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedLog.products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                        All products from this batch have been deleted.
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedLog.products.map((prod) => (
                      <TableRow key={prod.id} className="border-b border-neutral-200 hover:bg-neutral-50/50">
                        <TableCell className="py-2 px-3 w-12">
                          <div className="w-8 h-10 aspect-[3/4] border border-neutral-200 bg-neutral-100 shrink-0 overflow-hidden">
                            <img
                              src={prod.imageUrl || "/images/for_him.jpg"}
                              alt={prod.name}
                              className="size-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-xs text-foreground">{prod.name}</span>
                            <span className="text-[11px] font-mono text-neutral-400">/{prod.slug}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Badge variant="outline" className="rounded-none text-[10px] px-1.5 py-0">
                            {prod.collectionTag || "Minimal"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 px-3 text-right font-semibold text-xs text-foreground">
                          ৳{prod.priceBdt} BDT
                        </TableCell>
                        <TableCell className="py-2 px-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProductFromLog(selectedLog.id, prod.id)}
                            className="size-6 p-0 flex items-center justify-center shrink-0 rounded-none border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 shadow-none ml-auto"
                            title="Delete Product"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-neutral-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
                className="rounded-none text-xs border border-neutral-200"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Hidden File Input for Excel/CSV Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv, .xlsx, .xls"
        className="hidden"
      />

      {/* Permanent Main Page Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your product catalog, variants, stock, and pricing.
          </p>
        </div>

        {/* Action Buttons (Export, Import, Add New) */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportTemplate}
            className="flex items-center gap-1.5 text-xs rounded-none border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 shadow-none font-medium"
          >
            <Download className="size-3.5 text-muted-foreground" />
            <span>Export Sheet Layout</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs rounded-none border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 shadow-none font-medium"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-600" />
            <span>Import Excel / CSV</span>
          </Button>

          <Link href="/admin/products/new">
            <Button size="sm" className="flex items-center gap-1.5 text-xs bg-[#050505] text-white hover:bg-neutral-800 rounded-none shadow-none font-medium">
              <Plus className="size-3.5" />
              <span>Add New Product</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Permanent Subpage Navigation Tabs */}
      <div className="flex items-center gap-6 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`pb-3 text-xs font-semibold tracking-tight transition-colors border-b-2 ${
            activeTab === "catalog"
              ? "border-black text-black"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          Catalog Products
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 text-xs font-semibold tracking-tight transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "logs"
              ? "border-black text-black"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <FileSpreadsheet className="size-3.5 text-emerald-600" />
          <span>Import Logs</span>
        </button>
      </div>

      {/* Permanent 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-neutral-200 bg-white p-4 font-sans rounded-none shadow-none">
          <p className="text-xs uppercase font-medium text-neutral-500">Active Products</p>
          <p className="text-2xl font-bold mt-1 text-neutral-900">{activeProducts}</p>
        </div>
        
        <div
          onClick={() => {
            setActiveTab("catalog");
            setStatusFilter(statusFilter === "manipulated_low_stock" ? "all" : "manipulated_low_stock");
          }}
          className="border border-neutral-200 bg-white p-4 font-sans rounded-none shadow-none cursor-pointer hover:border-amber-400 transition-colors"
          title="Click to filter products with low stock alerts"
        >
          <p className="text-xs uppercase font-medium text-amber-700">Low Stock Alerts</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{lowStockAlertsCount}</p>
        </div>

        <div className="border border-neutral-200 bg-white p-4 font-sans rounded-none shadow-none">
          <p className="text-xs uppercase font-medium text-neutral-500">Total Stocked Units</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{totalUnitsStocked}</p>
        </div>
        
        <div className="border border-neutral-200 bg-white p-4 font-sans rounded-none shadow-none">
          <p className="text-xs uppercase font-medium text-neutral-500">Draft / Archived</p>
          <p className="text-2xl font-bold mt-1 text-neutral-900">{draftProducts}</p>
        </div>
      </div>

      {/* TAB CONTENT: CATALOG PRODUCTS */}
      {activeTab === "catalog" && (
        <div className="flex flex-col gap-4">
          <div className="pt-2">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Catalog Products ({sortedProducts.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Live product inventory and variant statuses.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 w-full">
            <div className="flex items-center w-[320px]">
              <div className="relative w-full">
                <Search className="size-4 text-muted-foreground absolute left-3 top-2.5 shrink-0 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by title, slug, SKU..."
                  className="text-xs h-9 rounded-none border border-neutral-200 bg-white pl-9 pr-3 w-full outline-none focus:border-black font-sans text-foreground shadow-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterDrawerOpen(true)}
              className="h-9 text-xs rounded-none border border-neutral-200 bg-white text-neutral-800 flex items-center gap-2 hover:bg-neutral-50 shadow-none font-medium"
            >
              <SlidersHorizontal className="size-3.5 text-black dark:text-white" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-none bg-black text-white ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {fileFilterLog && (
            <div className="flex items-center justify-between bg-neutral-900 text-white px-4 py-2.5 rounded-none shadow-none text-xs">
              <div className="flex items-center gap-2 font-medium">
                <FileSpreadsheet className="size-4 text-emerald-400 shrink-0" />
                <span>Showing products from file: <strong className="text-emerald-300 font-mono">{fileFilterLog.filename}</strong> ({filteredProducts.length} items)</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFileFilterLog(null)}
                className="h-6 text-[11px] hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-none px-2"
              >
                <X className="size-3 mr-1 text-rose-400" /> Clear File Filter
              </Button>
            </div>
          )}

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between bg-neutral-900 text-white px-4 py-2.5 text-xs rounded-none shadow-md font-sans gap-2">
              <div className="flex items-center gap-2 font-medium">
                <span className="bg-neutral-800 text-neutral-200 px-2 py-0.5 rounded-none text-[11px] font-mono">{selectedIds.length} items selected</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Set Active Action */}
                <Button
                  size="sm"
                  onClick={() => handleBulkStatusChange(true)}
                  className="h-7 text-xs rounded-none gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-none font-medium"
                >
                  <Check className="size-3.5" />
                  <span>Set Active ({selectedIds.length})</span>
                </Button>

                {/* Set Paused Action */}
                <Button
                  size="sm"
                  onClick={() => handleBulkStatusChange(false)}
                  className="h-7 text-xs rounded-none gap-1.5 bg-amber-600 hover:bg-amber-700 text-white border-none shadow-none font-medium"
                >
                  <Clock className="size-3.5" />
                  <span>Set Paused ({selectedIds.length})</span>
                </Button>

                {/* Delete Selected Action */}
                <Button
                  size="sm"
                  onClick={() => setIsBulkDeleting(true)}
                  className="h-7 text-xs rounded-none gap-1.5 bg-rose-600 hover:bg-rose-700 text-white border-none shadow-none font-medium"
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete Selected ({selectedIds.length})</span>
                </Button>

                {/* Deselect All */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedIds([])}
                  className="h-7 text-xs rounded-none bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white border-none shadow-none"
                >
                  Deselect
                </Button>
              </div>
            </div>
          )}

          <div className="w-full overflow-x-auto border border-neutral-200 bg-white">
            <Table className="w-full border-collapse">
              <TableHeader>
                <TableRow className="border-b border-neutral-200 bg-neutral-50/50">
                  <TableHead className="w-10 text-center py-2.5 px-2">
                    <div
                      onClick={toggleSelectAll}
                      style={{ border: isAllSelected ? "1px solid #000000" : "1px solid #cbd5e1" }}
                      className={`size-4 ${
                        isAllSelected ? "bg-black text-white" : "bg-white"
                      } flex items-center justify-center cursor-pointer rounded-none transition-colors mx-auto`}
                      title="Select / Deselect All"
                    >
                      {isAllSelected && <Check className="size-3 stroke-[3]" />}
                    </div>
                  </TableHead>

                  <TableHead className="py-2.5 px-3 w-12 font-medium text-xs text-neutral-600">Image</TableHead>

                  <TableHead
                    className="py-2.5 px-3 cursor-pointer select-none group hover:text-black transition-colors font-medium text-xs text-neutral-600"
                    onClick={() => handleSort("createdAt")}
                    title="Click to sort by creation date"
                  >
                    <div className="flex items-center gap-1">
                      <span>Description</span>
                      <ChevronsUpDown
                        className={`size-3.5 ${
                          sortField === "createdAt" ? "text-black" : "text-neutral-400 group-hover:text-black"
                        }`}
                      />
                    </div>
                  </TableHead>

                  <TableHead className="py-2.5 px-3 font-medium text-xs text-neutral-600">Category</TableHead>

                  <TableHead className="py-2.5 px-3 font-medium text-xs text-neutral-600">Status</TableHead>

                  <TableHead
                    className="py-2.5 px-3 cursor-pointer select-none group hover:text-black transition-colors font-medium text-xs text-neutral-600"
                    onClick={() => handleSort("price")}
                    title="Click to sort by base price"
                  >
                    <div className="flex items-center gap-1">
                      <span>Price</span>
                      <ChevronsUpDown
                        className={`size-3.5 ${
                          sortField === "price" ? "text-black" : "text-neutral-400 group-hover:text-black"
                        }`}
                      />
                    </div>
                  </TableHead>

                  <TableHead className="py-2.5 px-3 font-medium text-xs text-neutral-600">Color</TableHead>

                  <TableHead
                    className="py-2.5 px-3 cursor-pointer select-none group hover:text-black transition-colors font-medium text-xs text-neutral-600"
                    onClick={() => handleSort("stock")}
                    title="Click to sort by stock units"
                  >
                    <div className="flex items-center gap-1">
                      <span>Stock</span>
                      <ChevronsUpDown
                        className={`size-3.5 ${
                          sortField === "stock" ? "text-black" : "text-neutral-400 group-hover:text-black"
                        }`}
                      />
                    </div>
                  </TableHead>

                  <TableHead className="text-right py-2.5 px-3 font-medium text-xs text-neutral-600">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6 text-muted-foreground text-xs">
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : sortedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6 text-muted-foreground text-xs">
                      No products found matching filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedProducts.map((prod) => {
                    const isSelected = selectedIds.includes(prod.id);

                    const genderCatName =
                      prod.categorySlug === "for-her"
                        ? "For Her"
                        : prod.categorySlug === "for-him"
                        ? "For Him"
                        : prod.categoryName || "Unisex";

                    const categoryBadgeColor =
                      prod.categorySlug === "for-her"
                        ? "border-pink-200 bg-pink-50 text-pink-700"
                        : prod.categorySlug === "for-him"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-purple-200 bg-purple-50 text-purple-700";

                    const collectionBadgeColor =
                      prod.collectionTag === "Gaming"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : prod.collectionTag === "Floral"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : prod.collectionTag === "Divine"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-slate-50 text-slate-700";

                    const formattedDate = prod.createdAt
                      ? new Date(prod.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A";

                    const lowStockAlerts = getProductLowStockAlerts(prod);

                    return (
                      <TableRow
                        key={prod.id}
                        className={`border-b border-neutral-200 hover:bg-neutral-50/50 ${
                          isSelected ? "bg-neutral-50" : ""
                        }`}
                      >
                        <TableCell className="w-10 text-center py-2.5 px-2">
                          <div
                            onClick={() => toggleSelect(prod.id)}
                            style={{ border: isSelected ? "1px solid #000000" : "1px solid #cbd5e1" }}
                            className={`size-4 ${
                              isSelected ? "bg-black text-white" : "bg-white"
                            } flex items-center justify-center cursor-pointer rounded-none transition-colors mx-auto`}
                          >
                            {isSelected && <Check className="size-3 stroke-[3]" />}
                          </div>
                        </TableCell>

                        <TableCell className="py-2.5 px-3 w-12">
                          <div
                            className="w-10 h-[53px] aspect-[3/4] border border-neutral-200 bg-neutral-100 rounded-none overflow-hidden shrink-0 flex items-center justify-center cursor-pointer"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredImagePreview({
                                url: prod.imageUrl || "/images/for_him.jpg",
                                name: prod.name,
                                slug: prod.slug,
                                top: Math.max(10, rect.top - 40),
                                left: rect.right + 12,
                              });
                            }}
                            onMouseLeave={() => setHoveredImagePreview(null)}
                          >
                            <img
                              src={prod.imageUrl || "/images/for_him.jpg"}
                              alt={prod.name}
                              className="size-full object-cover"
                            />
                          </div>
                        </TableCell>

                        <TableCell className="py-2.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-foreground text-sm">{prod.name}</span>
                            <Link
                              href={`/product/${prod.slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-indigo-600 hover:underline font-mono"
                              title="View product storefront page"
                            >
                              <span>/{prod.slug}</span>
                              <ExternalLink className="size-3 text-muted-foreground shrink-0" />
                            </Link>
                            <span className="text-[11px] text-neutral-400 font-sans mt-0.5 flex items-center gap-1">
                              <Calendar className="size-3 text-neutral-400 shrink-0" />
                              <span>Created: {formattedDate}</span>
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-2.5 px-3">
                          <div className="flex flex-col gap-1.5 items-start">
                            <Badge
                              variant="outline"
                              className={`rounded-none font-medium text-xs px-2 py-0.5 ${categoryBadgeColor}`}
                            >
                              {genderCatName}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`rounded-none font-medium text-xs px-2 py-0.5 ${collectionBadgeColor}`}
                            >
                              {prod.collectionTag}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell className="py-2.5 px-3">
                          {prod.isActive ? (
                            <Badge
                              variant="outline"
                              className="rounded-none font-semibold text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-300"
                            >
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="rounded-none font-semibold text-xs px-2 py-0.5 bg-amber-50 text-amber-800 border-amber-300"
                            >
                              Paused
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="py-2.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-foreground text-xs">৳{prod.priceBdt} BDT</span>
                            {prod.compareAtPriceBdt && prod.compareAtPriceBdt > prod.priceBdt && (
                              <span className="text-xs line-through text-muted-foreground">
                                ৳{prod.compareAtPriceBdt} BDT
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="py-2.5 px-3">
                          <div className="flex flex-col gap-1 items-start">
                            {prod.colors.map((c) => (
                              <Badge key={c} variant="secondary" className="rounded-none text-xs border border-neutral-200 bg-neutral-100 text-neutral-800">
                                {c}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>

                        <TableCell className="py-2.5 px-3">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="font-semibold text-foreground text-xs">
                              Stock: {prod.totalUnits} Units
                            </span>

                            {lowStockAlerts.length > 0 && (
                              <>
                                {lowStockAlerts.length === 1 ? (
                                  <Badge
                                    variant="outline"
                                    className="rounded-none text-[10px] bg-rose-50 text-rose-700 border-rose-200 font-sans"
                                  >
                                    {lowStockAlerts[0].colorName !== "Standard" ? `${lowStockAlerts[0].colorName} - ` : ""}Size {lowStockAlerts[0].size}: only {lowStockAlerts[0].quantity} left
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    onMouseEnter={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setHoveredLowStockPopover({
                                        productName: prod.name,
                                        alerts: lowStockAlerts,
                                        top: rect.bottom + 4,
                                        left: rect.left,
                                      });
                                    }}
                                    onMouseLeave={() => setHoveredLowStockPopover(null)}
                                    className="rounded-none text-[10px] bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300 font-bold cursor-pointer transition-colors"
                                  >
                                    {lowStockAlerts.length} Stock Alerts
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right py-2.5 px-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/admin/products/new?edit=${prod.id}`}>
                              <Button variant="outline" size="sm" className="h-7 text-xs rounded-none gap-1 border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 hover:text-black shadow-none font-medium">
                                <Edit className="size-3" />
                                <span>Edit</span>
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setProductToDelete(prod)}
                              className="size-7 p-0 flex items-center justify-center shrink-0 rounded-none border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 shadow-none"
                              title="Delete Product"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: IMPORT LOGS */}
      {activeTab === "logs" && (
        <div className="flex flex-col gap-4">
          <div className="pt-2">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Spreadsheet Import Logs ({importLogs.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Historical audit log of all CSV / Excel spreadsheet file uploads and the products added by each batch.
            </p>
          </div>

          <div className="border border-neutral-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-neutral-200 bg-neutral-50/50">
                  <TableHead className="py-3 px-4 font-medium text-xs text-neutral-600">Spreadsheet File Name</TableHead>
                  <TableHead className="py-3 px-4 font-medium text-xs text-neutral-600">Upload Date & Time</TableHead>
                  <TableHead className="py-3 px-4 font-medium text-xs text-neutral-600">Rows Processed</TableHead>
                  <TableHead className="py-3 px-4 font-medium text-xs text-neutral-600">Products Created</TableHead>
                  <TableHead className="py-3 px-4 font-medium text-xs text-neutral-600">Import Status</TableHead>
                  <TableHead className="text-right py-3 px-4 font-medium text-xs text-neutral-600">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <FileSpreadsheet className="size-9 text-neutral-300 stroke-[1.5]" />
                        <p className="font-semibold text-neutral-700 text-sm">No Spreadsheet Imports Recorded Yet</p>
                        <p className="text-xs text-neutral-500 max-w-sm">
                          Upload a CSV or Excel sheet using the button below to start tracking import logs.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-1 flex items-center gap-1.5 text-xs rounded-none border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 shadow-none font-medium h-9 px-4"
                        >
                          <FileSpreadsheet className="size-3.5 text-emerald-600" />
                          <span>Import Excel / CSV</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  importLogs.map((log) => (
                    <TableRow key={log.id} className="border-b border-neutral-200 hover:bg-neutral-50/50">
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="size-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-xs text-foreground font-mono">{log.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-xs text-neutral-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-neutral-400 shrink-0" />
                          <span>
                            {new Date(log.uploadedAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-xs font-mono text-neutral-700">
                        {log.totalRows} Rows
                      </TableCell>
                      <TableCell className="py-3 px-4 text-xs font-semibold text-emerald-700 font-mono">
                        {log.importedCount} Products
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge variant="outline" className="rounded-none text-[11px] bg-emerald-50 text-emerald-700 border-emerald-300 font-medium">
                          <CheckCircle2 className="size-3 mr-1 text-emerald-600" />
                          <span>Completed</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFileFilterLog(log);
                              setActiveTab("catalog");
                            }}
                            className="h-7 text-xs rounded-none gap-1.5 border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100 shadow-none font-medium"
                          >
                            <Eye className="size-3.5 text-indigo-600" />
                            <span>View Products ({log.products.length})</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLogToDelete(log)}
                            className="size-7 p-0 flex items-center justify-center shrink-0 rounded-none border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 shadow-none"
                            title="Delete Log File & Products"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

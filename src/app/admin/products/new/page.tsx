'use client';

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  createFullProductAction,
  updateFullProductAction,
  deleteProductAction,
  checkSlugUniqueAction,
  getProductByIdAction,
  getCategoriesAction
} from "@/app/actions/products";
import { fetchAdminCategories } from "@/app/actions/admin-actions";
import { generateCleanSku } from "@/lib/utils";
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Check,
  X,
  Link as LinkIcon,
  Image as ImageIcon,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Move,
  EyeOff,
  Eye,
} from "lucide-react";
import { type CreateProductValues } from "@/lib/validations";

interface SizeStockItem {
  size: "XS" | "S" | "M" | "L" | "XL" | "XXL";
  enabled: boolean;
  sku: string;
  quantity: number;
}

interface VariantState {
  id: string;
  colorName: string;
  hexCode: string;
  coverPhoto: string;
  isLowStock: boolean;
  galleryPhotos: string[];
  sizes: SizeStockItem[];
}

export interface SizeMatrixRow {
  label: string;
  XS?: string;
  S?: string;
  M?: string;
  L?: string;
  XL?: string;
  XXL?: string;
  [key: string]: string | undefined;
}

const defaultSizes = (): SizeStockItem[] => [
  { size: "XS", enabled: false, sku: "", quantity: 0 },
  { size: "S", enabled: false, sku: "", quantity: 0 },
  { size: "M", enabled: false, sku: "", quantity: 0 },
  { size: "L", enabled: false, sku: "", quantity: 0 },
  { size: "XL", enabled: false, sku: "", quantity: 0 },
  { size: "XXL", enabled: false, sku: "", quantity: 0 },
];

function getFormattedDateCode(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

function computeTypeCode(productType: string, titleStr: string): string {
  const p = (productType || "").toLowerCase();
  if (p.includes("shirt")) return "SH";
  if (p.includes("pant") || p.includes("trouser")) return "PN";
  if (p.includes("two") || p.includes("piece")) return "TP";
  if (p.includes("jersey")) return "JR";
  if (p.includes("hoodie") || p.includes("sweatshirt")) return "HD";
  if (p.includes("jacket") || p.includes("coat")) return "JK";
  if (p.includes("short")) return "ST";

  const t = (titleStr || "").toLowerCase();
  if (t.includes("shirt") || t.includes("tee") || t.includes("t-shirt")) return "SH";
  if (t.includes("pant") || t.includes("trouser")) return "PN";
  if (t.includes("two") || t.includes("piece")) return "TP";
  if (t.includes("jersey")) return "JR";
  if (t.includes("hoodie")) return "HD";
  return "PR";
}

function computeGenderCode(catId: string, categoryOptions: { id: string; name: string }[]): string {
  const catObj = categoryOptions.find((c) => c.id === catId);
  const name = (catObj?.name || "").toLowerCase();
  if (name.includes("him") || name.includes("men")) return "HIM";
  if (name.includes("her") || name.includes("women")) return "HER";
  return "UNI";
}

function computeColorCode(colorName: string): string {
  if (!colorName || !colorName.trim()) return "BLU";
  const c = colorName.trim().toUpperCase();
  if (c.includes("GRAY") || c.includes("GREY") || c.includes("SLATE")) return "GRY";
  if (c.includes("YELLOW")) return "YEL";
  if (c.includes("BLUE") || c.includes("NAVY")) return "BLU";
  if (c.includes("WHITE") || c.includes("OFF-WHITE")) return "WHT";
  if (c.includes("BLACK")) return "BLK";
  if (c.includes("RED")) return "RED";
  if (c.includes("GREEN")) return "GRN";
  if (c.includes("PINK")) return "PNK";
  return c.replace(/[^A-Z]/g, "").slice(0, 3) || "CLR";
}

function getColorHexFromName(name: string): string {
  const lower = name.toLowerCase().trim();
  if (!lower) return "#000000";
  if (lower.includes("gray") || lower.includes("grey") || lower.includes("slate")) return "#716e8d";
  if (lower.includes("white") || lower.includes("off-white") || lower.includes("cream")) return "#ffffff";
  if (lower.includes("black") || lower.includes("dark")) return "#000000";
  if (lower.includes("navy")) return "#000080";
  if (lower.includes("blue") || lower.includes("sky")) return "#2563eb";
  if (lower.includes("red") || lower.includes("crimson")) return "#dc2626";
  if (lower.includes("maroon") || lower.includes("burgundy")) return "#800000";
  if (lower.includes("green") || lower.includes("olive")) return "#16a34a";
  if (lower.includes("yellow") || lower.includes("mustard")) return "#eab308";
  if (lower.includes("pink") || lower.includes("rose")) return "#ec4899";
  if (lower.includes("purple") || lower.includes("violet")) return "#9333ea";
  if (lower.includes("orange")) return "#f97316";
  if (lower.includes("brown") || lower.includes("beige") || lower.includes("tan")) return "#78350f";
  return "#000000";
}

function computeDiagramSku(
  brandCode: string = "LIV",
  productType: string = "Shirt",
  genderCode: string = "HIM",
  sizeName: string = "M",
  colorName: string = "Blue",
  titleStr: string = ""
): string {
  return generateCleanSku(titleStr || productType || "Product", sizeName);
}

function ProductFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Step Wizard Navigation (1: Basic Info, 2: Color & Sizes Availability, 3: Price & Size Chart)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Active Variant Tab Index in Step 2
  const [activeVariantIdx, setActiveVariantIdx] = useState<number>(0);

  // Image Upload Modal Popup State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadModalVariantId, setUploadModalVariantId] = useState<string | null>(null);
  const [uploadModalMode, setUploadModalMode] = useState<"choice" | "links">("choice");
  const [bulkLinksText, setBulkLinksText] = useState("");
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  // Image Drag & Drop Reorder State
  const [draggedPhotoIdx, setDraggedPhotoIdx] = useState<number | null>(null);

  // Step 1: Basic Information Fields
  const [title, setTitle] = useState("");
  const [productType, setProductType] = useState("Shirt");
  const [productTypeOptions, setProductTypeOptions] = useState<string[]>([
    "Shirt",
    "Pant",
    "Two Piece",
    "Jersey",
    "Hoodie",
    "Jacket",
    "Shorts",
    "Other",
  ]);
  const [brandCode, setBrandCode] = useState("LIV");
  const [slug, setSlug] = useState("");
  const [baseSku, setBaseSku] = useState(`LIV-SH-HIM-${getFormattedDateCode()}`);
  const [collectionTag, setCollectionTag] = useState("");
  const [collectionTagOptions, setCollectionTagOptions] = useState<string[]>([
    "Minimal",
    "Gaming",
    "Floral",
    "Divine",
  ]);
  const [categoryId, setCategoryId] = useState("");
  const [specifications, setSpecifications] = useState("");

  const [categoryOptions, setCategoryOptions] = useState<{ id: string; name: string; slug: string }[]>([]);

  // Step 2: Multi-Variant Array
  const [variants, setVariants] = useState<VariantState[]>([
    {
      id: "v-1",
      colorName: "",
      hexCode: "#000000",
      coverPhoto: "",
      isLowStock: false,
      galleryPhotos: [],
      sizes: defaultSizes(),
    },
  ]);

  // Step 3: Pricing & Size Chart Matrix
  const [basePrice, setBasePrice] = useState("");
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Size matrix rows start empty by default
  const [sizeMatrixRows, setSizeMatrixRows] = useState<SizeMatrixRow[]>([]);

  // Slug Uniqueness State
  const [isSlugChecking, setIsSlugChecking] = useState(false);
  const [isSlugUnique, setIsSlugUnique] = useState<boolean | null>(null);

  const [loadingEdit, setLoadingEdit] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Silent Cmd+B / Ctrl+B Shortcut Handler for Product Description
  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      const textarea = descriptionRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = specifications.substring(start, end);

      if (!selectedText) {
        const newText = specifications.substring(0, start) + "**bold text**" + specifications.substring(end);
        setSpecifications(newText);
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = start + 2;
          textarea.selectionEnd = start + 11;
        }, 0);
      } else {
        const isWrapped = selectedText.startsWith("**") && selectedText.endsWith("**");
        const replacement = isWrapped ? selectedText.slice(2, -2) : `**${selectedText}**`;
        const newText = specifications.substring(0, start) + replacement + specifications.substring(end);
        setSpecifications(newText);
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = start;
          textarea.selectionEnd = start + replacement.length;
        }, 0);
      }
    }
  };

  // Bi-directional Price & Discount Sync Handlers
  const handleCompareAtPriceChange = (val: string) => {
    setCompareAtPrice(val);
    const orig = parseFloat(val) || 0;
    const pct = parseFloat(discountPercent) || 0;
    const sell = parseFloat(basePrice) || 0;

    if (orig > 0 && pct > 0 && pct < 100) {
      const computedSell = Math.round(orig * (1 - pct / 100));
      setBasePrice(String(computedSell));
      setHasDiscount(true);
    } else if (orig > 0 && sell > 0 && orig > sell) {
      const computedPct = Math.round(((orig - sell) / orig) * 100);
      setDiscountPercent(String(computedPct));
      setHasDiscount(true);
    }
  };

  const handleDiscountPercentChange = (pctStr: string) => {
    setDiscountPercent(pctStr);
    const pct = parseFloat(pctStr) || 0;
    const orig = parseFloat(compareAtPrice) || 0;
    const sell = parseFloat(basePrice) || 0;

    if (pct > 0 && pct < 100) {
      setHasDiscount(true);
      if (orig > 0) {
        const computedSell = Math.round(orig * (1 - pct / 100));
        setBasePrice(String(computedSell));
      } else if (sell > 0) {
        const computedOrig = Math.round(sell / (1 - pct / 100));
        setCompareAtPrice(String(computedOrig));
      }
    } else {
      setHasDiscount(false);
    }
  };

  const handleBasePriceChange = (val: string) => {
    setBasePrice(val);
    const sell = parseFloat(val) || 0;
    const pct = parseFloat(discountPercent) || 0;
    const orig = parseFloat(compareAtPrice) || 0;

    if (sell > 0 && pct > 0 && pct < 100) {
      const computedOrig = Math.round(sell / (1 - pct / 100));
      setCompareAtPrice(String(computedOrig));
      setHasDiscount(true);
    } else if (sell > 0 && orig > sell) {
      const computedPct = Math.round(((orig - sell) / orig) * 100);
      setDiscountPercent(String(computedPct));
      setHasDiscount(true);
    }
  };

  // Load Categories, Collection Tags & Product Types
  useEffect(() => {
    async function loadCategories() {
      const cats = await getCategoriesAction();
      setCategoryOptions(cats);

      try {
        const adminCats = await fetchAdminCategories();
        if (adminCats && adminCats.length > 0) {
          const names = Array.from(new Set([...adminCats.map((c) => c.name), "Minimal", "Gaming", "Floral", "Divine", "Casual"]));
          setCollectionTagOptions(names);
        }
      } catch (e) {}

      if (typeof window !== "undefined") {
        const storedTypes = localStorage.getItem("my_store_product_types");
        if (storedTypes) {
          try {
            const parsed = JSON.parse(storedTypes);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProductTypeOptions(parsed);
            }
          } catch (e) {}
        }
      }
    }
    loadCategories();
  }, []);

  // Fetch Existing Product Data for Editing
  useEffect(() => {
    if (!editId) return;

    const fetchEditProduct = async () => {
      setLoadingEdit(true);
      const prod = await getProductByIdAction(editId);
      if (prod) {
        setTitle(prod.title);
        setSlug(prod.slug);
        setCollectionTag(prod.collectionTag || "");
        if (prod.categoryId) setCategoryId(prod.categoryId);
        setBasePrice(prod.basePrice);

        if (prod.compareAtPrice && parseInt(prod.compareAtPrice, 10) > parseInt(prod.basePrice, 10)) {
          setHasDiscount(true);
          setCompareAtPrice(prod.compareAtPrice);
          const pVal = parseInt(prod.basePrice, 10);
          const cVal = parseInt(prod.compareAtPrice, 10);
          const pct = Math.round(((cVal - pVal) / cVal) * 100);
          setDiscountPercent(String(pct));
        } else {
          setHasDiscount(false);
        }

        if (prod.specifications) {
          try {
            const parsed = JSON.parse(prod.specifications);
            if (parsed && Array.isArray(parsed.sizeMatrix)) {
              setSizeMatrixRows(parsed.sizeMatrix);
              setSpecifications(parsed.specificationsText || "");
            } else {
              setSpecifications(prod.specifications);
            }
          } catch (e) {
            setSpecifications(prod.specifications);
          }
        } else {
          setSpecifications(prod.description || "");
        }

        setIsActive(prod.isActive);

        if (prod.colorVariants && prod.colorVariants.length > 0) {
          setVariants(
            prod.colorVariants.map((v, i) => {
              const loadedSizesMap = new Map((v.sizes || []).map((s) => [s.size, s]));
              const fullSizes = defaultSizes().map((ds) => {
                const existing = loadedSizesMap.get(ds.size as any);
                return existing ? (existing as SizeStockItem) : ds;
              });

              return {
                id: v.id || `v-${i + 1}`,
                colorName: v.colorName,
                hexCode: v.hexCode,
                coverPhoto: v.coverPhoto,
                isLowStock: v.isLowStock,
                galleryPhotos: v.galleryPhotos || [],
                sizes: fullSizes,
              };
            })
          );
        }
      }
      setLoadingEdit(false);
    };

    fetchEditProduct();
  }, [editId]);

  // Title & Product Type & Gender Handlers
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const cleanSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    setSlug(cleanSlug);

    const b = brandCode || "LIV";
    const t = computeTypeCode(productType, val);
    const g = computeGenderCode(categoryId, categoryOptions);
    const dateCode = getFormattedDateCode();
    setBaseSku(`${b}-${t}-${g}-${dateCode}`);
  };

  const handleProductTypeChange = (typeVal: string) => {
    setProductType(typeVal);
    const b = brandCode || "LIV";
    const t = computeTypeCode(typeVal, title);
    const g = computeGenderCode(categoryId, categoryOptions);
    const dateCode = getFormattedDateCode();
    setBaseSku(`${b}-${t}-${g}-${dateCode}`);
  };

  const handleGenderChange = (catId: string) => {
    setCategoryId(catId);
    const b = brandCode || "LIV";
    const t = computeTypeCode(productType, title);
    const g = computeGenderCode(catId, categoryOptions);
    const dateCode = getFormattedDateCode();
    setBaseSku(`${b}-${t}-${g}-${dateCode}`);
  };

  // Drag & Drop Image Handlers
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedPhotoIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number, variantId: string) => {
    e.preventDefault();
    if (draggedPhotoIdx === null || draggedPhotoIdx === targetIdx) return;

    setVariants(
      variants.map((v) => {
        if (v.id !== variantId) return v;
        const photos = [...v.galleryPhotos];
        const [moved] = photos.splice(draggedPhotoIdx, 1);
        photos.splice(targetIdx, 0, moved);

        return {
          ...v,
          galleryPhotos: photos,
          coverPhoto: photos[0] || "",
        };
      })
    );
    setDraggedPhotoIdx(null);
  };

  // Background Slug Uniqueness Validation
  useEffect(() => {
    if (!slug) {
      setIsSlugChecking(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSlugChecking(true);
      const res = await checkSlugUniqueAction(slug, editId || undefined);
      const isUnique = typeof res === "object" && res !== null ? res.isUnique : Boolean(res);
      setIsSlugUnique(isUnique);
      setIsSlugChecking(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [slug, editId]);

  // Dynamic Size Columns Calculation Based EXCLUSIVELY on Available Sizes Selected in Step 2
  const enabledSizesSet = new Set(
    variants.flatMap((v) =>
      v.sizes.filter((s) => s.enabled).map((s) => s.size)
    )
  );
  
  const activeSizeColumns = enabledSizesSet.size > 0
    ? (["XS", "S", "M", "L", "XL", "XXL"] as const).filter((sz) => enabledSizesSet.has(sz as any))
    : [];

  // Matrix Row Handlers
  const handleAddSizeMatrixRow = () => {
    if (activeSizeColumns.length === 0) return;
    const newRow: SizeMatrixRow = { label: "" };
    activeSizeColumns.forEach((sz) => {
      newRow[sz] = "";
    });
    setSizeMatrixRows([...sizeMatrixRows, newRow]);
  };

  const handleRemoveSizeMatrixRow = (index: number) => {
    setSizeMatrixRows(sizeMatrixRows.filter((_, idx) => idx !== index));
  };

  const handleSizeMatrixCellChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...sizeMatrixRows];
    updated[index][field] = value;
    setSizeMatrixRows(updated);
  };

  // Color Variant Handlers & Auto-Hex Selector
  const handleAddVariant = () => {
    const newIdx = variants.length + 1;
    const newVar: VariantState = {
      id: `v-${Date.now()}`,
      colorName: `Color - ${newIdx}`,
      hexCode: "#000000",
      coverPhoto: "",
      isLowStock: false,
      galleryPhotos: [],
      sizes: defaultSizes(),
    };
    setVariants([...variants, newVar]);
    setActiveVariantIdx(variants.length);
  };

  const handleRemoveVariant = (id: string) => {
    if (variants.length <= 1) {
      alert("At least one color variant is required.");
      return;
    }
    const filtered = variants.filter((v) => v.id !== id);
    setVariants(filtered);
    if (activeVariantIdx >= filtered.length) {
      setActiveVariantIdx(filtered.length - 1);
    }
  };

  const handleUpdateVariant = (id: string, updates: Partial<VariantState>) => {
    setVariants(variants.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  };

  const handleColorNameChange = (variantId: string, colorNameStr: string) => {
    const autoHex = getColorHexFromName(colorNameStr);
    handleUpdateVariant(variantId, {
      colorName: colorNameStr,
      hexCode: autoHex,
    });
  };

  // Image Upload Popup Modal Handlers
  const handleOpenUploadModal = (variantId: string) => {
    setUploadModalVariantId(variantId);
    setUploadModalMode("choice");
    setBulkLinksText("");
    setIsUploadModalOpen(true);
  };

  const handleFileSelectTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleFileUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !uploadModalVariantId) return;

    setIsUploadingFiles(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.urls && data.urls.length > 0) {
        setVariants(
          variants.map((v) => {
            if (v.id !== uploadModalVariantId) return v;
            const updatedGallery = [...v.galleryPhotos, ...data.urls];
            return {
              ...v,
              galleryPhotos: updatedGallery,
              coverPhoto: updatedGallery[0] || v.coverPhoto,
            };
          })
        );
        setIsUploadModalOpen(false);
      } else {
        alert(data.message || "Failed to upload files");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("File upload failed. Please try again.");
    } finally {
      setIsUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddBulkLinks = () => {
    if (!uploadModalVariantId || !bulkLinksText.trim()) return;

    const urls = bulkLinksText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (urls.length === 0) return;

    setVariants(
      variants.map((v) => {
        if (v.id !== uploadModalVariantId) return v;
        const updatedGallery = [...v.galleryPhotos, ...urls];
        return {
          ...v,
          galleryPhotos: updatedGallery,
          coverPhoto: updatedGallery[0] || v.coverPhoto,
        };
      })
    );

    setIsUploadModalOpen(false);
    setBulkLinksText("");
  };

  const handleSetCoverPhoto = (variantId: string, photoIdx: number) => {
    setVariants(
      variants.map((v) => {
        if (v.id !== variantId) return v;
        const updated = [...v.galleryPhotos];
        const selected = updated[photoIdx];
        updated.splice(photoIdx, 1);
        updated.unshift(selected);
        return {
          ...v,
          galleryPhotos: updated,
          coverPhoto: selected,
        };
      })
    );
  };

  const handleRemoveGalleryPhoto = (variantId: string, photoIdx: number) => {
    setVariants(
      variants.map((v) => {
        if (v.id !== variantId) return v;
        const updated = v.galleryPhotos.filter((_, idx) => idx !== photoIdx);
        return {
          ...v,
          galleryPhotos: updated,
          coverPhoto: updated[0] || "",
        };
      })
    );
  };

  const handleToggleSize = (variantId: string, sizeName: "XS" | "S" | "M" | "L" | "XL" | "XXL") => {
    setVariants(
      variants.map((v) => {
        if (v.id !== variantId) return v;
        return {
          ...v,
          sizes: v.sizes.map((s, sIdx) => {
            if (s.size === sizeName) {
              const newEnabled = !s.enabled;
              const newSku = s.sku && s.sku.length < 15 ? s.sku : generateCleanSku(title || "Product", sizeName, sIdx);
              return { ...s, enabled: newEnabled, sku: newSku };
            }
            return s;
          }),
        };
      })
    );
  };

  const handleSizeQuantityChange = (
    variantId: string,
    sizeName: "XS" | "S" | "M" | "L" | "XL" | "XXL",
    qty: number
  ) => {
    setVariants(
      variants.map((v) => {
        if (v.id !== variantId) return v;
        return {
          ...v,
          sizes: v.sizes.map((s) => (s.size === sizeName ? { ...s, quantity: Math.max(0, qty) } : s)),
        };
      })
    );
  };

  // Step Navigation Validation
  const handleNextStep1 = () => {
    setFormError("");
    if (!title.trim()) {
      setFormError("Product name is required.");
      return;
    }
    if (isSlugUnique === false) {
      setFormError("URL Slug is already taken. Please change it.");
      return;
    }
    setCurrentStep(2);
  };

  const handleNextStep2 = () => {
    setFormError("");
    const hasAnyPhoto = variants.some((v) => v.galleryPhotos.some((p) => p.trim()));
    if (!hasAnyPhoto) {
      setFormError("Please upload or add at least one image for your variants.");
      return;
    }
    setCurrentStep(3);
  };

  // Delete Product Handler for Edit Mode
  const handleDeleteProduct = async () => {
    if (!editId) return;
    if (confirm("Are you sure you want to delete this product permanently? This cannot be undone.")) {
      setSubmitting(true);
      await deleteProductAction(editId);
      router.push("/admin/products");
    }
  };

  // Final Save / Publish / Pause Handler
  const handleSaveProduct = async (status: boolean) => {
    setFormError("");

    if (!title.trim()) {
      setFormError("Product name is required.");
      setCurrentStep(1);
      return;
    }

    if (isSlugUnique === false) {
      setFormError("The specified URL Slug is already taken.");
      setCurrentStep(1);
      return;
    }

    const specificationsPayload = JSON.stringify({
      specificationsText: specifications,
      sizeMatrix: sizeMatrixRows,
    });

    const genderCode = computeGenderCode(categoryId, categoryOptions);

    const payload: CreateProductValues = {
      title,
      slug,
      basePrice: basePrice || "0",
      compareAtPrice: hasDiscount ? compareAtPrice : undefined,
      collectionTag,
      categoryId,
      specifications: specificationsPayload,
      isActive: status,
      colorVariants: variants.map((v) => {
        return {
          colorName: v.colorName || "Standard",
          hexCode: v.hexCode || "#000000",
          thumbnailUrl: v.coverPhoto || v.galleryPhotos[0] || "/images/for_him.jpg",
          isLowStock: v.isLowStock,
          images: v.galleryPhotos.filter(Boolean),
          inventory: v.sizes
            .filter((s) => s.enabled)
            .map((s) => ({
              size: s.size,
              sku: computeDiagramSku(brandCode, productType, genderCode, s.size, v.colorName, title),
              quantity: s.quantity,
              isStockOut: s.quantity === 0,
            })),
        };
      }),
    };

    setSubmitting(true);

    try {
      let res;
      if (editId) {
        res = await updateFullProductAction(editId, payload);
      } else {
        res = await createFullProductAction(payload);
      }

      if (!res.success) {
        setFormError(res.message || "Failed to save product.");
        setSubmitting(false);
        return;
      }

      setIsActive(status);
      router.push("/admin/products");
    } catch (err) {
      console.error("Save product failed:", err);
      setFormError("An unexpected server error occurred.");
      setSubmitting(false);
    }
  };

  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

  if (loadingEdit) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground font-sans animate-pulse">
        Loading product details...
      </div>
    );
  }

  const activeVariant = variants[activeVariantIdx] || variants[0];
  const genderCodePreview = computeGenderCode(categoryId, categoryOptions);

  const handleBackClick = (e: React.MouseEvent) => {
    if (title.trim() || basePrice || variants.some(v => v.colorName || v.galleryPhotos.length > 0)) {
      e.preventDefault();
      setConfirmLeaveOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 font-sans text-neutral-900 dark:text-neutral-100 p-6 md:p-10 relative">
      {/* Unsaved Changes Confirmation Modal */}
      {confirmLeaveOpen && (
        <div className="fixed inset-0 z-[10001] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 w-full max-w-md shadow-2xl rounded-none text-neutral-900 dark:text-neutral-100 font-sans space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold">Unsaved Product Changes</h3>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              You have unsaved changes to this product form. Are you sure you want to leave without saving?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmLeaveOpen(false)}
                className="text-xs rounded-none"
              >
                Keep Editing
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfirmLeaveOpen(false);
                  router.push("/admin/products");
                }}
                className="text-xs bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 rounded-none font-medium"
              >
                Discard &amp; Leave
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  setConfirmLeaveOpen(false);
                  await handleSaveProduct(true);
                }}
                className="text-xs bg-black text-white hover:bg-neutral-800 rounded-none font-semibold"
              >
                Save &amp; Exit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input for Native File Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileUploadChange}
      />

      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        
        {/* Page Title Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/products" onClick={handleBackClick}>
              <button className="text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white p-1 cursor-pointer">
                <ChevronLeft className="size-5" />
              </button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-[#1a1c23] dark:text-white">
              {editId ? "Edit Product" : "Add New Catalog Product"}
            </h1>
          </div>

          {editId && (
            <Badge
              variant="outline"
              className={`text-xs px-2.5 py-0.5 rounded-none font-semibold ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-amber-50 text-amber-800 border-amber-300"
              }`}
            >
              {isActive ? "Live Showcase" : "Showcase Paused"}
            </Badge>
          )}
        </div>

        {/* 3-Step Wizard Navigation Header Bar */}
        <div className="grid grid-cols-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-none text-xs font-semibold">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center justify-center gap-3 py-3.5 px-4 transition-all relative ${
              currentStep === 1
                ? "bg-[#e2e5eb] text-black font-bold border-b-2 border-b-black"
                : "text-neutral-700 hover:text-black dark:text-neutral-400"
            }`}
          >
            <span className="size-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
              1
            </span>
            <span className="truncate">Basic Information</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`flex items-center justify-center gap-3 py-3.5 px-4 transition-all relative ${
              currentStep === 2
                ? "bg-[#e2e5eb] text-black font-bold border-b-2 border-b-black"
                : "text-neutral-700 hover:text-black dark:text-neutral-400"
            }`}
          >
            <span className="size-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
              2
            </span>
            <span className="truncate">Color & Sizes Availability</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`flex items-center justify-center gap-3 py-3.5 px-4 transition-all relative ${
              currentStep === 3
                ? "bg-[#e2e5eb] text-black font-bold border-b-2 border-b-black"
                : "text-neutral-700 hover:text-black dark:text-neutral-400"
            }`}
          >
            <span className="size-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
              3
            </span>
            <span className="truncate">Price & Size Chart</span>
          </button>
        </div>

        {formError && (
          <div className="p-3 rounded-none bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* STEP 1: BASIC INFORMATION */}
        {currentStep === 1 && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 flex flex-col gap-6 font-sans">
            
            {/* Line 1: Product Name in one full line */}
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1.5">
                Product name *
              </label>
              <Input
                required
                placeholder="Enter product name"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="h-9 rounded-none border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium focus-visible:ring-1 focus-visible:ring-black w-full"
              />
            </div>

            {/* Line 2: Product Type & Gender (2 in each line) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1.5">
                  Product Type
                </label>
                <select
                  className="w-full h-9 rounded-none border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-xs font-medium focus:outline-none text-neutral-700 dark:text-neutral-300"
                  value={productType}
                  onChange={(e) => handleProductTypeChange(e.target.value)}
                >
                  {productTypeOptions.map((tStr) => (
                    <option key={tStr} value={tStr}>
                      {tStr} ({tStr.slice(0, 2).toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1.5">
                  Gender
                </label>
                <select
                  className="w-full h-9 rounded-none border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-xs font-medium focus:outline-none text-neutral-700 dark:text-neutral-300"
                  value={categoryId}
                  onChange={(e) => handleGenderChange(e.target.value)}
                >
                  <option value="">Select Gender</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line 3: Category & Slug (2 in each line) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1.5">
                  Category
                </label>
                <select
                  className="w-full h-9 rounded-none border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-xs font-medium focus:outline-none text-neutral-700 dark:text-neutral-300"
                  value={collectionTag}
                  onChange={(e) => setCollectionTag(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {collectionTagOptions.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block">
                    Slug
                  </label>
                  {isSlugChecking ? (
                    <span className="text-[11px] text-muted-foreground animate-pulse">Checking DB...</span>
                  ) : isSlugUnique === true ? (
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 bg-emerald-50 flex items-center gap-1 rounded-none py-0">
                      <Check className="size-3" />
                      <span>Slug Available</span>
                    </Badge>
                  ) : isSlugUnique === false ? (
                    <Badge variant="destructive" className="text-[10px] flex items-center gap-1 rounded-none py-0">
                      <X className="size-3" />
                      <span>Slug Taken</span>
                    </Badge>
                  ) : null}
                </div>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  placeholder="Slug"
                  className={`h-9 rounded-none border border-neutral-300 dark:border-neutral-700 bg-[#eef0f4] dark:bg-neutral-800 text-xs font-mono text-neutral-600 dark:text-neutral-400 ${
                    isSlugUnique === false ? "bg-rose-50 border-rose-500 text-rose-600" : ""
                  }`}
                />
              </div>
            </div>

            {/* Product Description Rich Text Editor Toolbar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block">
                  Product description (Rich Text Editor)
                </label>
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 border border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    title="Bold (**medium text**)"
                    onClick={() => {
                      const el = descriptionRef.current;
                      if (!el) return;
                      const start = el.selectionStart;
                      const end = el.selectionEnd;
                      const sel = specifications.substring(start, end);
                      const replacement = sel ? `**${sel}**` : `**Bold Text**`;
                      const updated = specifications.substring(0, start) + replacement + specifications.substring(end);
                      setSpecifications(updated);
                    }}
                    className="px-2 py-0.5 text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-200 hover:bg-neutral-200 text-black dark:text-white"
                  >
                    B
                  </button>

                  <button
                    type="button"
                    title="Italic (*text*)"
                    onClick={() => {
                      const el = descriptionRef.current;
                      if (!el) return;
                      const start = el.selectionStart;
                      const end = el.selectionEnd;
                      const sel = specifications.substring(start, end);
                      const replacement = sel ? `*${sel}*` : `*Italic Text*`;
                      const updated = specifications.substring(0, start) + replacement + specifications.substring(end);
                      setSpecifications(updated);
                    }}
                    className="px-2 py-0.5 text-xs italic bg-white dark:bg-neutral-900 border border-neutral-200 hover:bg-neutral-200 text-black dark:text-white"
                  >
                    I
                  </button>

                  <button
                    type="button"
                    title="Heading (### Section)"
                    onClick={() => {
                      setSpecifications((prev) => prev + "\n### Section Heading\n");
                    }}
                    className="px-2 py-0.5 text-xs font-semibold bg-white dark:bg-neutral-900 border border-neutral-200 hover:bg-neutral-200 text-black dark:text-white"
                  >
                    H3
                  </button>

                  <button
                    type="button"
                    title="Bullet List (- Item)"
                    onClick={() => {
                      setSpecifications((prev) => prev + "\n- Bullet item");
                    }}
                    className="px-2 py-0.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 hover:bg-neutral-200 text-black dark:text-white"
                  >
                    • List
                  </button>
                </div>
              </div>

              <textarea
                ref={descriptionRef}
                rows={6}
                placeholder="Enter rich formatted product description (e.g. **Fabric:** Premium Crepe)"
                value={specifications}
                onKeyDown={handleDescriptionKeyDown}
                onChange={(e) => setSpecifications(e.target.value)}
                className="w-full rounded-none border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 text-xs focus:outline-none text-neutral-800 dark:text-neutral-200 font-sans leading-relaxed"
              />
            </div>

            {/* Step 1 Divider + Continue Button */}
            <div className="flex justify-end pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={handleNextStep1}
                className="bg-black hover:bg-neutral-800 text-white font-semibold text-xs h-9 px-6 rounded-none flex items-center gap-2"
              >
                <span>Continue</span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: COLOR & SIZES AVAILABILITY */}
        {currentStep === 2 && activeVariant && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 flex flex-col gap-6 font-sans">
            
            {/* Color Tabs Top Row + Trigger Low Stock Alert Toggle on Right */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                {variants.map((v, idx) => (
                  <div key={v.id} className="relative group flex items-center">
                    <button
                      type="button"
                      onClick={() => setActiveVariantIdx(idx)}
                      className={`px-5 py-2.5 text-xs font-medium rounded-none border transition-all flex items-center gap-2 ${
                        activeVariantIdx === idx
                          ? "bg-black text-white border-black"
                          : "bg-[#eef0f4] text-neutral-700 border-neutral-300 hover:bg-neutral-200"
                      }`}
                    >
                      <span>{v.colorName || `Color - ${idx + 1}`}</span>

                      {variants.length > 1 && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveVariant(v.id);
                          }}
                          className="hover:text-rose-500 p-0.5 ml-1 transition-colors"
                          title="Delete this color"
                        >
                          <X className="size-3" />
                        </span>
                      )}
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="px-4 py-2.5 text-xs font-medium rounded-none border border-neutral-300 bg-[#eef0f4] hover:bg-neutral-200 text-neutral-800 flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="size-3.5" />
                  <span>Add color</span>
                </button>
              </div>

              {/* Trigger Low Stock Alert Toggle on Right */}
              <div className="flex items-center gap-2 border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 bg-white dark:bg-neutral-900 shrink-0">
                <label
                  htmlFor="low-stock-toggle"
                  className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer select-none"
                >
                  Trigger low stock alert
                </label>
                <input
                  id="low-stock-toggle"
                  type="checkbox"
                  checked={activeVariant.isLowStock}
                  onChange={(e) => handleUpdateVariant(activeVariant.id, { isLowStock: e.target.checked })}
                  className="size-4 rounded-none accent-black cursor-pointer"
                />
              </div>
            </div>

            {/* Color Name Input + Auto-Selected Hex Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1.5">
                  Color
                </label>
                <Input
                  placeholder="Enter color name (e.g. Navy Blue, Slate Gray, White)"
                  value={activeVariant.colorName}
                  onChange={(e) => handleColorNameChange(activeVariant.id, e.target.value)}
                  className="h-9 rounded-none border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1.5">
                  Color Hex Picker
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={activeVariant.hexCode}
                    onChange={(e) => handleUpdateVariant(activeVariant.id, { hexCode: e.target.value })}
                    className="size-9 border border-neutral-300 dark:border-neutral-700 p-1 bg-white dark:bg-neutral-900 cursor-pointer rounded-none"
                  />
                  <Input
                    value={activeVariant.hexCode}
                    onChange={(e) => handleUpdateVariant(activeVariant.id, { hexCode: e.target.value })}
                    className="h-9 font-mono text-xs rounded-none border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex-1"
                  />
                </div>
              </div>
            </div>

            {/* 6-Column Compact Image Gallery Grid with Drag & Drop */}
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 mb-2">
                <span>Upload images and drag to reorder</span>
                <Move className="size-3 text-neutral-400" />
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {activeVariant.galleryPhotos.map((url, imgIdx) => (
                  <div
                    key={imgIdx}
                    draggable
                    onDragStart={(e) => handleDragStart(e, imgIdx)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, imgIdx, activeVariant.id)}
                    className="relative aspect-[3/4] border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 group overflow-hidden cursor-grab active:cursor-grabbing transition-all hover:border-black"
                  >
                    <img
                      src={url || "/images/for_him.jpg"}
                      alt={`Product image ${imgIdx + 1}`}
                      className="size-full object-cover select-none pointer-events-none"
                    />

                    {/* Top Left Drag Handle & Cover Badge */}
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                      <div
                        className="bg-black/75 hover:bg-black text-white p-0.5 shadow-sm rounded-none cursor-grab active:cursor-grabbing"
                        title="Drag to reorder"
                      >
                        <GripVertical className="size-3.5" />
                      </div>

                      {imgIdx === 0 && (
                        <span className="bg-black text-white text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                          Cover
                        </span>
                      )}
                    </div>

                    {imgIdx !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetCoverPhoto(activeVariant.id, imgIdx)}
                        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-white/95 text-black text-[9px] font-bold px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black hover:text-white"
                      >
                        Cover
                      </button>
                    )}

                    {/* Top Right Delete Icon */}
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryPhoto(activeVariant.id, imgIdx)}
                      className="absolute top-1.5 right-1.5 bg-rose-600 text-white p-1 shadow-sm hover:bg-rose-700 transition-colors"
                      title="Delete image"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}

                {/* Compact Dotted Upload Box */}
                <button
                  type="button"
                  onClick={() => handleOpenUploadModal(activeVariant.id)}
                  className="aspect-[3/4] border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white flex flex-col items-center justify-center text-center p-3 transition-colors bg-white dark:bg-neutral-900 group"
                >
                  <Plus className="size-5 text-neutral-400 group-hover:text-black dark:group-hover:text-white mb-1" />
                  <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 group-hover:text-black dark:group-hover:text-white">
                    Upload
                  </span>
                </button>
              </div>
            </div>

            {/* Available Sizes Cards Section */}
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-3">
                Available sizes
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {activeVariant.sizes.map((s) => {
                  const sizeLabelMap: Record<string, string> = {
                    XS: "Extra Small (XS)",
                    S: "Small (S)",
                    M: "Medium (M)",
                    L: "Large (L)",
                    XL: "Extra Large (XL)",
                    XXL: "Double Extra Large (XXL)",
                  };
                  const diagramSku = computeDiagramSku(
                    brandCode,
                    productType,
                    genderCodePreview,
                    s.size,
                    activeVariant.colorName,
                    title
                  );

                  return (
                    <div
                      key={s.size}
                      onClick={() => handleToggleSize(activeVariant.id, s.size)}
                      className={`p-4 border rounded-none flex flex-col gap-2 cursor-pointer transition-all ${
                        s.enabled
                          ? "border-black dark:border-white bg-white dark:bg-neutral-900"
                          : "border-neutral-300 dark:border-neutral-700 bg-[#fafafa] dark:bg-neutral-950 opacity-60"
                      }`}
                    >
                      {/* Size Title Header + Black Checkbox Icon */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          {sizeLabelMap[s.size] || s.size}
                        </span>
                        
                        <div
                          className={`size-4 flex items-center justify-center rounded-none transition-colors ${
                            s.enabled
                              ? "bg-black text-white"
                              : "bg-white border border-neutral-300 dark:border-neutral-700"
                          }`}
                        >
                          {s.enabled && <Check className="size-3 stroke-[3]" />}
                        </div>
                      </div>

                      <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                        {diagramSku}
                      </span>

                      <div onClick={(e) => e.stopPropagation()}>
                        <Input
                          type="number"
                          disabled={!s.enabled}
                          value={s.enabled ? (s.quantity || "") : ""}
                          onChange={(e) =>
                            handleSizeQuantityChange(
                              activeVariant.id,
                              s.size,
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          placeholder="Enter quantity"
                          className="h-9 rounded-none border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium mt-1"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2 Bottom Navigation Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="bg-[#eef0f4] hover:bg-neutral-200 text-neutral-800 font-semibold text-xs h-9 px-5 rounded-none border border-neutral-300 flex items-center gap-1.5"
              >
                <ChevronLeft className="size-4" />
                <span>Go back</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep2}
                className="bg-black hover:bg-neutral-800 text-white font-semibold text-xs h-9 px-6 rounded-none flex items-center gap-2"
              >
                <span>Continue</span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PRICE & SIZE CHART */}
        {currentStep === 3 && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 flex flex-col gap-6 font-sans">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1.5">
                Product name
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter product name"
                className="h-9 rounded-none border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium text-neutral-900 dark:text-neutral-100"
              />
            </div>

            {/* 3-Column Pricing Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1st: Original Price */}
              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1.5">
                  Original Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-500 font-bold">৳</span>
                  <Input
                    type="number"
                    value={compareAtPrice}
                    onChange={(e) => handleCompareAtPriceChange(e.target.value)}
                    placeholder="Enter original price"
                    className="h-9 pl-7 rounded-none border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium"
                  />
                </div>
              </div>

              {/* 2nd: Discount (%) */}
              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1.5">
                  Discount (%)
                </label>
                <Input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => handleDiscountPercentChange(e.target.value)}
                  placeholder="Enter discount %"
                  className="h-9 rounded-none border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium"
                />
              </div>

              {/* 3rd: Selling Price */}
              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1.5">
                  Selling price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-500 font-bold">৳</span>
                  <Input
                    required
                    type="number"
                    value={basePrice}
                    onChange={(e) => handleBasePriceChange(e.target.value)}
                    placeholder="Enter selling price"
                    className="h-9 pl-7 rounded-none border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Size Chart Table Section */}
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-2">
                Size Chart
              </label>

              {activeSizeColumns.length === 0 ? (
                <div className="p-4 border border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center justify-between">
                  <span>No sizes selected in Step 2. Please go back to Step 2 to select available sizes for this product.</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-bold underline hover:text-black dark:hover:text-white"
                  >
                    Go to Step 2
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-full overflow-x-auto border border-neutral-200 dark:border-neutral-800">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-[#eef0f4] dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                          <th className="p-3 font-bold text-neutral-800 dark:text-neutral-200 min-w-[140px]">
                            Measured by
                          </th>
                          {activeSizeColumns.map((sz) => (
                            <th key={sz} className="p-3 text-center font-bold text-neutral-800 dark:text-neutral-200 w-20">
                              {sz}
                            </th>
                          ))}
                          <th className="p-3 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sizeMatrixRows.map((row, idx) => (
                          <tr key={idx} className="border-b border-neutral-200 dark:border-neutral-800">
                            <td className="p-2 font-medium text-neutral-800 dark:text-neutral-200">
                              <Input
                                placeholder="e.g. Length, Body, Sleeve"
                                className="h-9 text-xs rounded-none border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-medium px-2"
                                value={row.label || ""}
                                onChange={(e) => handleSizeMatrixCellChange(idx, "label", e.target.value)}
                              />
                            </td>
                            {activeSizeColumns.map((sz) => (
                              <td key={sz} className="p-2 text-center">
                                <Input
                                  placeholder='0"'
                                  className="h-9 text-xs rounded-none border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-center font-medium px-1"
                                  value={row[sz] || ""}
                                  onChange={(e) => handleSizeMatrixCellChange(idx, sz, e.target.value)}
                                />
                              </td>
                            ))}
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveSizeMatrixRow(idx)}
                                className="text-rose-600 hover:text-rose-800 p-1"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSizeMatrixRow}
                    className="mt-3 text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1 hover:underline"
                  >
                    <Plus className="size-3.5" />
                    <span>Add row</span>
                  </button>
                </>
              )}
            </div>

            {/* Step 3 Bottom Action Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="bg-[#eef0f4] hover:bg-neutral-200 text-neutral-800 font-semibold text-xs h-9 px-5 rounded-none border border-neutral-300 flex items-center gap-1.5"
              >
                <ChevronLeft className="size-4" />
                <span>Go back</span>
              </button>

              {editId ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteProduct}
                    disabled={submitting}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-9 px-4 rounded-none flex items-center gap-1.5 border border-rose-600"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete Product</span>
                  </button>

                  {isActive ? (
                    <button
                      type="button"
                      onClick={() => handleSaveProduct(false)}
                      disabled={submitting}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-semibold h-9 px-4 rounded-none flex items-center gap-1.5"
                      title="Pause product showcase on store"
                    >
                      <EyeOff className="size-3.5 text-amber-800" />
                      <span>Stop displaying</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSaveProduct(true)}
                      disabled={submitting}
                      className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 text-xs font-semibold h-9 px-4 rounded-none flex items-center gap-1.5"
                      title="Turn on product showcase on store"
                    >
                      <Eye className="size-3.5 text-emerald-800" />
                      <span>Turn On Display</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSaveProduct(isActive)}
                    disabled={submitting}
                    className="bg-black hover:bg-neutral-800 text-white text-xs font-semibold h-9 px-5 rounded-none flex items-center gap-1.5"
                  >
                    <Check className="size-4" />
                    <span>{submitting ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/admin/products">
                    <button
                      type="button"
                      className="bg-[#fee2e2] hover:bg-rose-100 text-rose-700 text-xs font-semibold h-9 px-4 rounded-none flex items-center gap-1 border border-rose-200"
                    >
                      <X className="size-3.5" />
                      <span>Cancel</span>
                    </button>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleSaveProduct(false)}
                    disabled={submitting}
                    className="bg-[#eef0f4] hover:bg-neutral-200 text-neutral-800 text-xs font-semibold h-9 px-4 rounded-none border border-neutral-300"
                  >
                    <span>Save as Draft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveProduct(true)}
                    disabled={submitting}
                    className="bg-black hover:bg-neutral-800 text-white text-xs font-semibold h-9 px-5 rounded-none flex items-center gap-1.5"
                  >
                    <Check className="size-4" />
                    <span>{submitting ? "Publishing..." : "Publish"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Upload Selector Modal */}
      {isUploadModalOpen && uploadModalVariantId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 font-sans">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 p-6 w-full max-w-md shadow-2xl rounded-none flex flex-col gap-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="size-4 text-black dark:text-white" />
                <span>Add Variant Images</span>
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-neutral-500 hover:text-black">
                <X className="size-4" />
              </button>
            </div>

            {uploadModalMode === "choice" && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Select how you would like to add images for this color variant:
                </p>

                <button
                  type="button"
                  onClick={handleFileSelectTrigger}
                  disabled={isUploadingFiles}
                  className="p-4 border border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white bg-neutral-50 dark:bg-neutral-800 text-left flex items-center gap-3 transition-all group"
                >
                  <div className="size-10 bg-black text-white flex items-center justify-center rounded-none shrink-0">
                    <FolderOpen className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white group-hover:underline">
                      Upload from Computer File Manager
                    </h4>
                    <p className="text-[11px] text-neutral-500">Select multiple JPG, PNG, WEBP files</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUploadModalMode("links")}
                  className="p-4 border border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white bg-neutral-50 dark:bg-neutral-800 text-left flex items-center gap-3 transition-all group"
                >
                  <div className="size-10 bg-black text-white flex items-center justify-center rounded-none shrink-0">
                    <LinkIcon className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white group-hover:underline">
                      Paste Image URLs (Bulk New Line Dump)
                    </h4>
                    <p className="text-[11px] text-neutral-500">Dump multiple image URLs (one per line)</p>
                  </div>
                </button>
              </div>
            )}

            {uploadModalMode === "links" && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Paste Image URLs (One link per line)
                  </label>
                  <textarea
                    rows={6}
                    value={bulkLinksText}
                    onChange={(e) => setBulkLinksText(e.target.value)}
                    placeholder={`https://example.com/image1.jpg\nhttps://example.com/image2.jpg\nhttps://example.com/image3.jpg`}
                    className="w-full p-3 text-xs font-mono border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-none focus:outline-none"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">Each line will be added as a separate image.</p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setUploadModalMode("choice")}
                    className="text-xs text-neutral-600 hover:underline"
                  >
                    ← Back to options
                  </button>

                  <button
                    type="button"
                    onClick={handleAddBulkLinks}
                    className="bg-black hover:bg-neutral-800 text-white font-semibold text-xs h-9 px-5 rounded-none"
                  >
                    Add Image Links
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-sans">Loading form...</div>}>
      <ProductFormContent />
    </Suspense>
  );
}

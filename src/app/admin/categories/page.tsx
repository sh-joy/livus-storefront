'use client';

import { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchAdminCategories, createAdminCategoryAction, deleteAdminCategoryAction } from "@/app/actions/admin-actions";
import { Plus, Trash2, Edit, Layers, Tag, AlertTriangle } from "lucide-react";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
}

const defaultProductTypes = [
  "Shirt",
  "Pant",
  "Two Piece",
  "Jersey",
  "Hoodie",
  "Jacket",
  "Shorts",
  "Casual",
  "Other",
];

const defaultCollections: CategoryRow[] = [
  { id: "cat-min", name: "Minimal", slug: "minimal", description: "Clean minimalist aesthetic apparel" },
  { id: "cat-div", name: "Divine", slug: "divine", description: "High-fashion luxury aesthetic" },
  { id: "cat-cas", name: "Casual", slug: "casual", description: "Everyday streetwear aesthetic" },
  { id: "cat-gam", name: "Gaming", slug: "gaming", description: "Esports & geometric performance apparel" },
  { id: "cat-flo", name: "Floral", slug: "floral", description: "Botanical and nature pattern aesthetic" },
];

export default function AdminCategoriesPage() {
  // Only 2 Tabs: "categories" | "types"
  const [activeTab, setActiveTab] = useState<"categories" | "types">("categories");

  const [categories, setCategories] = useState<CategoryRow[]>(defaultCollections);
  const [productTypes, setProductTypes] = useState<string[]>(defaultProductTypes);

  const [loading, setLoading] = useState(true);

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal State
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [editingTypeOriginal, setEditingTypeOriginal] = useState<string | null>(null);
  const [editingTypeName, setEditingTypeName] = useState("");

  // Confirmation Delete Modal States
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryRow | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAdminCategories();
    
    // Filter out legacy gender items
    const dbFiltered = data.filter(c =>
      !["for him", "for her", "unisex", "unisex / minimal"].includes(c.name.toLowerCase().trim())
    );

    // Merge DB categories with default aesthetic collections to prevent deletion loss
    const map = new Map<string, CategoryRow>();
    defaultCollections.forEach(c => map.set(c.slug, c));
    dbFiltered.forEach(c => map.set(c.slug, c));

    setCategories(Array.from(map.values()));

    if (typeof window !== "undefined") {
      const storedTypes = localStorage.getItem("my_store_product_types");
      if (storedTypes) {
        try {
          const parsed = JSON.parse(storedTypes);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProductTypes(parsed);
          }
        } catch (e) {}
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Add Category Handler with Auto Slug Generation
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    const generatedSlug = slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    
    const res = await createAdminCategoryAction({
      name: name.trim(),
      slug: generatedSlug,
      description: description.trim(),
    });

    if (res.success) {
      setName("");
      setSlug("");
      setDescription("");
      setIsAddOpen(false);
      await loadData();
    } else {
      // Local Fallback if server insert fails
      const newCatRow: CategoryRow = {
        id: `cat-${Date.now()}`,
        name: name.trim(),
        slug: generatedSlug,
        description: description.trim() || "Collection tag",
      };
      setCategories([...categories, newCatRow]);
      setName("");
      setSlug("");
      setDescription("");
      setIsAddOpen(false);
    }
    setSubmitting(false);
  };

  // Edit Category Handler
  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !name.trim()) return;

    setSubmitting(true);
    const generatedSlug = slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const updatedCategories = categories.map((c) =>
      c.id === editingCategory.id || c.slug === editingCategory.slug
        ? { ...c, name: name.trim(), slug: generatedSlug, description: description.trim() }
        : c
    );
    setCategories(updatedCategories);

    if (editingCategory.id && !editingCategory.id.startsWith("cat-")) {
      await deleteAdminCategoryAction(editingCategory.id);
      await createAdminCategoryAction({
        name: name.trim(),
        slug: generatedSlug,
        description: description.trim(),
      });
    }

    setName("");
    setSlug("");
    setDescription("");
    setEditingCategory(null);
    setSubmitting(false);
  };

  // Confirm & Delete Category Action
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setCategories(categories.filter((c) => c.id !== categoryToDelete.id && c.slug !== categoryToDelete.slug));
    if (categoryToDelete.id && !categoryToDelete.id.startsWith("cat-")) {
      await deleteAdminCategoryAction(categoryToDelete.id);
    }
    setCategoryToDelete(null);
  };

  // Add Product Type Handler
  const handleAddProductType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const updated = Array.from(new Set([...productTypes, name.trim()]));
    setProductTypes(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("my_store_product_types", JSON.stringify(updated));
    }
    setName("");
    setIsAddOpen(false);
  };

  // Edit Product Type Handler
  const handleEditProductType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTypeOriginal || !editingTypeName.trim()) return;

    const updated = productTypes.map((t) => (t === editingTypeOriginal ? editingTypeName.trim() : t));
    setProductTypes(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("my_store_product_types", JSON.stringify(updated));
    }
    setEditingTypeOriginal(null);
    setEditingTypeName("");
  };

  // Confirm & Delete Product Type Action
  const confirmDeleteProductType = () => {
    if (!typeToDelete) return;
    const updated = productTypes.filter((t) => t !== typeToDelete);
    setProductTypes(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("my_store_product_types", JSON.stringify(updated));
    }
    setTypeToDelete(null);
  };

  return (
    <div className="flex flex-col gap-5 font-sans relative">
      {/* Category Deletion Confirmation Modal Popup */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 w-full max-w-md rounded-none shadow-2xl font-sans animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <AlertTriangle className="size-6 shrink-0" />
              <h3 className="text-lg font-bold text-foreground">Confirm Category Deletion</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete category <strong className="text-foreground">{categoryToDelete.name}</strong> (<span className="font-mono text-[11px]">/{categoryToDelete.slug}</span>)?
            </p>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCategoryToDelete(null)}
                className="rounded-none text-xs border border-neutral-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmDeleteCategory}
                className="rounded-none text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete Category
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Product Type Deletion Confirmation Modal Popup */}
      {typeToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 w-full max-w-md rounded-none shadow-2xl font-sans animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <AlertTriangle className="size-6 shrink-0" />
              <h3 className="text-lg font-bold text-foreground">Confirm Product Type Deletion</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete product type <strong className="text-foreground">{typeToDelete}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTypeToDelete(null)}
                className="rounded-none text-xs border border-neutral-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmDeleteProductType}
                className="rounded-none text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete Product Type
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Page Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Categories</h2>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={
            <Button
              variant="default"
              onClick={() => {
                setName("");
                setSlug("");
                setDescription("");
              }}
              className="flex items-center gap-2 rounded-none bg-black text-white hover:bg-neutral-800 text-xs font-semibold h-9 px-4 shadow-none"
            >
              <Plus className="size-4" />
              <span>{activeTab === "categories" ? "Add Category" : "Add Product Type"}</span>
            </Button>
          } />
          <DialogContent className="rounded-none font-sans bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                {activeTab === "categories" ? "Add New Category" : "Add New Product Type"}
              </DialogTitle>
            </DialogHeader>

            {activeTab === "categories" ? (
              <form onSubmit={handleAddCategory} className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Category Name *</label>
                  <Input
                    required
                    placeholder="e.g. Minimal, Divine, Gaming, Casual, Floral"
                    className="rounded-none text-xs h-9 border border-neutral-200 focus:border-black bg-white"
                    value={name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setName(val);
                      setSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">URL Slug</label>
                  <Input
                    placeholder="e.g. minimal"
                    className="rounded-none text-xs h-9 border border-neutral-200 focus:border-black bg-white font-mono"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Description</label>
                  <Input
                    placeholder="Description"
                    className="rounded-none text-xs h-9 border border-neutral-200 focus:border-black bg-white"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddOpen(false)}
                    className="rounded-none text-xs border border-neutral-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    size="sm"
                    className="rounded-none text-xs bg-black text-white hover:bg-neutral-800"
                  >
                    {submitting ? "Saving..." : "Save Category"}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddProductType} className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Product Type Name *</label>
                  <Input
                    required
                    placeholder="e.g. Shirt, Pant, Two Piece, Jersey, Hoodie"
                    className="rounded-none text-xs h-9 border border-neutral-200 focus:border-black bg-white"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddOpen(false)}
                    className="rounded-none text-xs border border-neutral-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="rounded-none text-xs bg-black text-white hover:bg-neutral-800"
                  >
                    Save Product Type
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Category Dialog Modal */}
      {editingCategory && (
        <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
          <DialogContent className="rounded-none font-sans bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Edit Category
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditCategory} className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Category Name *</label>
                <Input
                  required
                  placeholder="Category Name"
                  className="rounded-none text-xs h-9 border border-neutral-200 focus:border-black bg-white"
                  value={name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setName(val);
                    setSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
                  }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">URL Slug</label>
                <Input
                  placeholder="URL Slug"
                  className="rounded-none text-xs h-9 border border-neutral-200 focus:border-black bg-white font-mono"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Description</label>
                <Input
                  placeholder="Description"
                  className="rounded-none text-xs h-9 border border-neutral-200 focus:border-black bg-white"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingCategory(null)}
                  className="rounded-none text-xs border border-neutral-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  size="sm"
                  className="rounded-none text-xs bg-black text-white hover:bg-neutral-800"
                >
                  {submitting ? "Updating..." : "Update Category"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Product Type Dialog Modal */}
      {editingTypeOriginal && (
        <Dialog open={!!editingTypeOriginal} onOpenChange={() => setEditingTypeOriginal(null)}>
          <DialogContent className="rounded-none font-sans bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Edit Product Type
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditProductType} className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Product Type Name *</label>
                <Input
                  required
                  placeholder="Product Type Name"
                  className="rounded-none text-xs h-9 border border-neutral-200 focus:border-black bg-white"
                  value={editingTypeName}
                  onChange={(e) => setEditingTypeName(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTypeOriginal(null)}
                  className="rounded-none text-xs border border-neutral-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-none text-xs bg-black text-white hover:bg-neutral-800"
                >
                  Update Product Type
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Tabs Navigation: Clean Product Types & Categories */}
      <div className="flex items-center gap-6 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 pb-3 text-xs font-semibold tracking-tight transition-colors border-b-2 ${
            activeTab === "categories"
              ? "border-black text-black"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <Tag className="size-4" />
          <span>Categories</span>
        </button>

        <button
          onClick={() => setActiveTab("types")}
          className={`flex items-center gap-2 pb-3 text-xs font-semibold tracking-tight transition-colors border-b-2 ${
            activeTab === "types"
              ? "border-black text-black"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <Layers className="size-4" />
          <span>Product Types</span>
        </button>
      </div>

      {/* TAB 1: CATEGORIES */}
      {activeTab === "categories" && (
        <div className="border border-neutral-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-neutral-200 bg-neutral-50/50">
                <TableHead className="py-2.5 px-4 font-medium text-xs text-neutral-600">Category Name</TableHead>
                <TableHead className="py-2.5 px-4 font-medium text-xs text-neutral-600">URL Slug</TableHead>
                <TableHead className="py-2.5 px-4 font-medium text-xs text-neutral-600">Description</TableHead>
                <TableHead className="text-right py-2.5 px-4 font-medium text-xs text-neutral-600">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-xs">
                    Loading categories...
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-xs">
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat.id} className="border-b border-neutral-200 hover:bg-neutral-50/50">
                    <TableCell className="py-3 px-4 font-semibold text-xs text-foreground">
                      {cat.name}
                    </TableCell>
                    <TableCell className="py-3 px-4 font-mono text-xs text-muted-foreground">
                      /{cat.slug}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs text-neutral-600 max-w-md">
                      {cat.description || "N/A"}
                    </TableCell>
                    <TableCell className="text-right py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCategory(cat);
                            setName(cat.name);
                            setSlug(cat.slug);
                            setDescription(cat.description || "");
                          }}
                          className="h-7 text-xs rounded-none gap-1 border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 hover:text-black shadow-none font-medium"
                        >
                          <Edit className="size-3" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCategoryToDelete(cat)}
                          className="size-7 p-0 flex items-center justify-center shrink-0 rounded-none border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 shadow-none"
                          title="Delete Category"
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
      )}

      {/* TAB 2: PRODUCT TYPES */}
      {activeTab === "types" && (
        <div className="border border-neutral-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-neutral-200 bg-neutral-50/50">
                <TableHead className="py-2.5 px-4 font-medium text-xs text-neutral-600">Product Type Name</TableHead>
                <TableHead className="py-2.5 px-4 font-medium text-xs text-neutral-600">Form Key</TableHead>
                <TableHead className="text-right py-2.5 px-4 font-medium text-xs text-neutral-600">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productTypes.map((type) => (
                <TableRow key={type} className="border-b border-neutral-200 hover:bg-neutral-50/50">
                  <TableCell className="py-3 px-4 font-semibold text-xs text-foreground">
                    {type}
                  </TableCell>
                  <TableCell className="py-3 px-4 font-mono text-xs text-muted-foreground">
                    {type.toLowerCase().replace(/\s+/g, "_")}
                  </TableCell>
                  <TableCell className="text-right py-3 px-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTypeOriginal(type);
                          setEditingTypeName(type);
                        }}
                        className="h-7 text-xs rounded-none gap-1 border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 hover:text-black shadow-none font-medium"
                      >
                        <Edit className="size-3" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTypeToDelete(type)}
                        className="size-7 p-0 flex items-center justify-center shrink-0 rounded-none border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 shadow-none"
                        title="Delete Product Type"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

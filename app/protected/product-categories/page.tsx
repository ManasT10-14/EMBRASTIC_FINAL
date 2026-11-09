"use client";

import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  EyeOff,
  FolderTree,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/* =========================================================
   TYPES
========================================================= */

type ProductCategory = {
  id: string;
  categoryCode: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: string;
  featured: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type CategoryForm = {
  id: string;
  categoryCode: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: string;
  featured: string;
  status: string;
};

/* =========================================================
   EMPTY FORM
========================================================= */

const EMPTY_FORM: CategoryForm = {
  id: "",
  categoryCode: "",
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  displayOrder: "",
  featured: "No",
  status: "Active",
};

/* =========================================================
   HELPERS
========================================================= */

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalize(value: unknown) {
  return clean(value).toLowerCase();
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `category-${Date.now()}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createCategoryCode(name: string) {
  const cleaned = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .trim();

  const words = cleaned
    .split(/\s+/)
    .filter(Boolean);

  let prefix = words
    .map((word) => word.slice(0, 3))
    .join("")
    .slice(0, 10);

  if (!prefix) {
    prefix = "CAT";
  }

  return prefix;
}

function numberValue(value: unknown) {
  const parsed = Number(clean(value));

  return Number.isFinite(parsed) ? parsed : 0;
}

function yes(value: unknown) {
  const text = normalize(value);

  return (
    text === "yes" ||
    text === "true" ||
    text === "1"
  );
}

function active(value: unknown) {
  const text = normalize(value);

  return !text || text === "active";
}

function safeImageUrl(value: unknown) {
  const url = clean(value);

  if (!url) {
    return "";
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/")
  ) {
    return url;
  }

  return "";
}

/* =========================================================
   PAGE
========================================================= */

export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState<
    ProductCategory[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] =
    useState<CategoryForm>(EMPTY_FORM);

  const [editing, setEditing] = useState(false);

  const [deleteTarget, setDeleteTarget] =
    useState<ProductCategory | null>(null);

  /* =====================================================
     LOAD CATEGORIES
  ====================================================== */

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/excel?sheet=ProductCategories",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const text = await response.text();

      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to load product categories."
        );
      }

      const rows = Array.isArray(data.rows)
        ? data.rows
        : [];

      setCategories(rows);
    } catch (err) {
      console.error(
        "Product category load error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load product categories."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  /* =====================================================
     SORTED + FILTERED
  ====================================================== */

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const orderA = numberValue(a.displayOrder);
      const orderB = numberValue(b.displayOrder);

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return clean(a.name).localeCompare(clean(b.name));
    });
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const query = normalize(search);

    return sortedCategories.filter((category) => {
      const matchesSearch =
        !query ||
        [
          category.categoryCode,
          category.name,
          category.slug,
          category.description,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        normalize(category.status) ===
          normalize(statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [
    sortedCategories,
    search,
    statusFilter,
  ]);

  /* =====================================================
     STATS
  ====================================================== */

  const totalCount = categories.length;

  const activeCount = categories.filter((category) =>
    active(category.status)
  ).length;

  const featuredCount = categories.filter((category) =>
    yes(category.featured)
  ).length;

  const hiddenCount = categories.filter(
    (category) => !active(category.status)
  ).length;

  /* =====================================================
     OPEN CREATE
  ====================================================== */

  function openCreate() {
    setEditing(false);
    setError("");
    setSuccess("");

    const nextOrder =
      categories.length > 0
        ? Math.max(
            ...categories.map((category) =>
              numberValue(category.displayOrder)
            )
          ) + 1
        : 1;

    setForm({
      ...EMPTY_FORM,
      id: createId(),
      displayOrder: String(nextOrder),
    });

    setFormOpen(true);
  }

  /* =====================================================
     OPEN EDIT
  ====================================================== */

  function openEdit(category: ProductCategory) {
    setEditing(true);
    setError("");
    setSuccess("");

    setForm({
      id: clean(category.id),
      categoryCode: clean(category.categoryCode),
      name: clean(category.name),
      slug: clean(category.slug),
      description: clean(category.description),
      imageUrl: clean(category.imageUrl),
      displayOrder:
        clean(category.displayOrder) || "0",
      featured: yes(category.featured)
        ? "Yes"
        : "No",
      status:
        clean(category.status) || "Active",
    });

    setFormOpen(true);
  }

  /* =====================================================
     CLOSE FORM
  ====================================================== */

  function closeForm() {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setEditing(false);
    setForm(EMPTY_FORM);
  }

  /* =====================================================
     FORM CHANGE
  ====================================================== */

  function updateForm(
    field: keyof CategoryForm,
    value: string
  ) {
    setForm((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      /*
       * Automatically create the slug and category code
       * while entering a NEW category.
       *
       * They can still be manually edited afterwards.
       */

      if (field === "name" && !editing) {
        const previousAutoSlug = slugify(
          current.name
        );

        const previousAutoCode =
          createCategoryCode(current.name);

        if (
          !current.slug ||
          current.slug === previousAutoSlug
        ) {
          next.slug = slugify(value);
        }

        if (
          !current.categoryCode ||
          current.categoryCode ===
            previousAutoCode
        ) {
          next.categoryCode =
            createCategoryCode(value);
        }
      }

      return next;
    });
  }

  /* =====================================================
     SAVE CATEGORY
  ====================================================== */

  async function saveCategory() {
    try {
      setError("");
      setSuccess("");

      const name = clean(form.name);
      const slug =
        clean(form.slug) || slugify(name);

      const categoryCode =
        clean(form.categoryCode) ||
        createCategoryCode(name);

      if (!name) {
        setError(
          "Category name is required."
        );
        return;
      }

      if (!slug) {
        setError(
          "Category slug is required."
        );
        return;
      }

      const duplicateName =
        categories.some(
          (category) =>
            category.id !== form.id &&
            normalize(category.name) ===
              normalize(name)
        );

      if (duplicateName) {
        setError(
          "A category with this name already exists."
        );
        return;
      }

      const duplicateSlug =
        categories.some(
          (category) =>
            category.id !== form.id &&
            normalize(category.slug) ===
              normalize(slug)
        );

      if (duplicateSlug) {
        setError(
          "A category with this slug already exists."
        );
        return;
      }

      setSaving(true);

      const now = new Date().toISOString();

      const record = {
        id: form.id || createId(),

        categoryCode,
        name,
        slug,

        description: clean(form.description),

        imageUrl: clean(form.imageUrl),

        displayOrder:
          clean(form.displayOrder) || "0",

        featured:
          form.featured === "Yes"
            ? "Yes"
            : "No",

        status:
          clean(form.status) || "Active",

        ...(editing
          ? {}
          : {
              createdAt: now,
            }),

        updatedAt: now,
      };

      const response = await fetch("/api/excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: editing ? "update" : "add",
          sheet: "ProductCategories",
          id: record.id,
          record,
        }),
      });

      const text = await response.text();

      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to save product category."
        );
      }

      closeForm();

      await loadCategories();

      setSuccess(
        editing
          ? "Product category updated successfully."
          : "Product category created successfully."
      );

      window.setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      console.error(
        "Product category save error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save product category."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     QUICK STATUS TOGGLE
  ====================================================== */

  async function toggleStatus(
    category: ProductCategory
  ) {
    try {
      setError("");
      setSuccess("");

      const newStatus = active(category.status)
        ? "Inactive"
        : "Active";

      const response = await fetch("/api/excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update",
          sheet: "ProductCategories",
          id: category.id,
          record: {
            status: newStatus,
            updatedAt: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to update category status."
        );
      }

      await loadCategories();

      setSuccess(
        `${category.name} is now ${newStatus}.`
      );

      window.setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update category."
      );
    }
  }

  /* =====================================================
     FEATURE TOGGLE
  ====================================================== */

  async function toggleFeatured(
    category: ProductCategory
  ) {
    try {
      setError("");
      setSuccess("");

      const newFeatured = yes(
        category.featured
      )
        ? "No"
        : "Yes";

      const response = await fetch("/api/excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update",
          sheet: "ProductCategories",
          id: category.id,
          record: {
            featured: newFeatured,
            updatedAt: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to update featured status."
        );
      }

      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update category."
      );
    }
  }

  /* =====================================================
     MOVE CATEGORY
  ====================================================== */

  async function moveCategory(
    category: ProductCategory,
    direction: "up" | "down"
  ) {
    const ordered = [...sortedCategories];

    const index = ordered.findIndex(
      (item) => item.id === category.id
    );

    if (index === -1) {
      return;
    }

    const targetIndex =
      direction === "up"
        ? index - 1
        : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= ordered.length
    ) {
      return;
    }

    const target = ordered[targetIndex];

    /*
     * We use the visible positions rather than trusting
     * duplicate / empty displayOrder values.
     */

    const currentOrder = index + 1;
    const targetOrder = targetIndex + 1;

    try {
      setError("");

      const firstResponse = await fetch(
        "/api/excel",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "update",
            sheet: "ProductCategories",
            id: category.id,
            record: {
              displayOrder:
                String(targetOrder),
              updatedAt:
                new Date().toISOString(),
            },
          }),
        }
      );

      const firstData =
        await firstResponse.json();

      if (
        !firstResponse.ok ||
        !firstData?.success
      ) {
        throw new Error(
          firstData?.message ||
            "Unable to reorder category."
        );
      }

      const secondResponse = await fetch(
        "/api/excel",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "update",
            sheet: "ProductCategories",
            id: target.id,
            record: {
              displayOrder:
                String(currentOrder),
              updatedAt:
                new Date().toISOString(),
            },
          }),
        }
      );

      const secondData =
        await secondResponse.json();

      if (
        !secondResponse.ok ||
        !secondData?.success
      ) {
        throw new Error(
          secondData?.message ||
            "Unable to reorder category."
        );
      }

      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reorder category."
      );
    }
  }

  /* =====================================================
     DELETE CATEGORY
  ====================================================== */

  async function deleteCategory() {
    if (!deleteTarget) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          sheet: "ProductCategories",
          id: deleteTarget.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to delete product category."
        );
      }

      const deletedName =
        deleteTarget.name;

      setDeleteTarget(null);

      await loadCategories();

      setSuccess(
        `${deletedName} deleted successfully.`
      );

      window.setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete product category."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     UI
  ====================================================== */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =================================================
          HEADER
      ================================================== */}

      <div className="border-b border-slate-200 bg-white">
        <div className="px-5 py-6 sm:px-7 lg:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                <FolderTree className="h-4 w-4" />
                Catalogue Management
              </div>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Product Categories
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage the collections customers see in
                the EMBRASTIC shop — such as Coffee
                Lovers, Anime Lovers, Plain T-Shirts,
                Hoodies and Custom Embroidery.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 sm:px-7 lg:px-8">
        {/* =================================================
            MESSAGES
        ================================================== */}

        {error && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* =================================================
            STATS
        ================================================== */}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Total Categories"
            value={totalCount}
          />

          <StatCard
            label="Active"
            value={activeCount}
          />

          <StatCard
            label="Featured"
            value={featuredCount}
          />

          <StatCard
            label="Inactive"
            value={hiddenCount}
          />
        </div>

        {/* =================================================
            SEARCH / FILTER
        ================================================== */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search category name, code or description..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none"
            >
              <option value="All">
                All Status
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>
          </div>
        </div>

        {/* =================================================
            CATEGORY LIST
        ================================================== */}

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />

                <div className="mt-3 text-sm font-bold text-slate-500">
                  Loading categories...
                </div>
              </div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <FolderTree className="h-7 w-7" />
              </div>

              <h2 className="mt-5 text-lg font-black text-slate-950">
                {categories.length === 0
                  ? "Create your first product category"
                  : "No matching categories"}
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {categories.length === 0
                  ? "Start with categories such as Plain T-Shirts, Cotton Polo T-Shirts, Hoodies, Coffee Lovers or Custom Embroidery."
                  : "Try changing your search or status filter."}
              </p>

              {categories.length === 0 && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
                >
                  <Plus className="h-4 w-4" />
                  Add First Category
                </button>
              )}
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-left">
                      <th className="w-[80px] px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Order
                      </th>

                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Category
                      </th>

                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Code
                      </th>

                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Storefront
                      </th>

                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Featured
                      </th>

                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCategories.map(
                      (category, index) => (
                        <CategoryTableRow
                          key={category.id}
                          category={category}
                          index={index}
                          total={
                            sortedCategories.length
                          }
                          onEdit={() =>
                            openEdit(category)
                          }
                          onDelete={() =>
                            setDeleteTarget(category)
                          }
                          onToggleStatus={() =>
                            void toggleStatus(category)
                          }
                          onToggleFeatured={() =>
                            void toggleFeatured(category)
                          }
                          onMoveUp={() =>
                            void moveCategory(
                              category,
                              "up"
                            )
                          }
                          onMoveDown={() =>
                            void moveCategory(
                              category,
                              "down"
                            )
                          }
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}

              <div className="divide-y divide-slate-100 lg:hidden">
                {filteredCategories.map(
                  (category) => (
                    <CategoryMobileCard
                      key={category.id}
                      category={category}
                      onEdit={() =>
                        openEdit(category)
                      }
                      onDelete={() =>
                        setDeleteTarget(category)
                      }
                      onToggleStatus={() =>
                        void toggleStatus(category)
                      }
                      onToggleFeatured={() =>
                        void toggleFeatured(category)
                      }
                    />
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* =================================================
          CREATE / EDIT DRAWER
      ================================================== */}

      {formOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close category form"
            onClick={closeForm}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
          />

          <div className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-2xl">
            {/* DRAWER HEADER */}

            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                  Catalogue Management
                </div>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  {editing
                    ? "Edit Product Category"
                    : "New Product Category"}
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  This category can appear directly
                  on the customer storefront.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* DRAWER BODY */}

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* NAME */}

                <Field
                  label="Category Name"
                  required
                  help="The customer-facing collection name."
                >
                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateForm(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Coffee Lovers"
                    className={inputClass}
                  />
                </Field>

                {/* CODE + ORDER */}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Category Code"
                    help="Internal short code."
                  >
                    <input
                      value={form.categoryCode}
                      onChange={(event) =>
                        updateForm(
                          "categoryCode",
                          event.target.value
                            .toUpperCase()
                            .replace(/\s+/g, "")
                        )
                      }
                      placeholder="COFLOV"
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Display Order"
                    help="Lower numbers appear first."
                  >
                    <input
                      type="number"
                      min="0"
                      value={form.displayOrder}
                      onChange={(event) =>
                        updateForm(
                          "displayOrder",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>

                {/* SLUG */}

                <Field
                  label="Store URL Slug"
                  help="Used in customer shop URLs."
                >
                  <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10">
                    <div className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-xs text-slate-400">
                      /products?category=
                    </div>

                    <input
                      value={form.slug}
                      onChange={(event) =>
                        updateForm(
                          "slug",
                          slugify(
                            event.target.value
                          )
                        )
                      }
                      placeholder="coffee-lovers"
                      className="h-11 min-w-0 flex-1 px-3 text-sm outline-none"
                    />
                  </div>
                </Field>

                {/* DESCRIPTION */}

                <Field
                  label="Description"
                  help="A short description for customers."
                >
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateForm(
                        "description",
                        event.target.value
                      )
                    }
                    rows={4}
                    placeholder="Embroidered designs for coffee lovers..."
                    className={`${inputClass} h-auto resize-none py-3`}
                  />
                </Field>

                {/* IMAGE */}

                <Field
                  label="Category Image"
                  help="For now paste an image URL. We can add direct image upload next."
                >
                  <input
                    value={form.imageUrl}
                    onChange={(event) =>
                      updateForm(
                        "imageUrl",
                        event.target.value
                      )
                    }
                    placeholder="https://..."
                    className={inputClass}
                  />
                </Field>

                {/* IMAGE PREVIEW */}

                {safeImageUrl(form.imageUrl) ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <div className="aspect-[16/7]">
                      <img
                        src={safeImageUrl(
                          form.imageUrl
                        )}
                        alt="Category preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-6 w-6 text-slate-300" />

                      <div className="mt-2 text-xs font-semibold text-slate-400">
                        Category image preview
                      </div>
                    </div>
                  </div>
                )}

                {/* FEATURED */}

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-black text-slate-950">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Featured Category
                      </div>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Featured categories can be
                        promoted on the customer home
                        page and at the top of the shop.
                      </p>
                    </div>

                    <Toggle
                      checked={
                        form.featured === "Yes"
                      }
                      onChange={(checked) =>
                        updateForm(
                          "featured",
                          checked ? "Yes" : "No"
                        )
                      }
                    />
                  </div>
                </div>

                {/* STATUS */}

                <Field
                  label="Status"
                  help="Inactive categories will be hidden from the customer storefront."
                >
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        updateForm(
                          "status",
                          "Active"
                        )
                      }
                      className={`rounded-xl border px-4 py-3 text-sm font-black transition ${
                        form.status === "Active"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-500"
                      }`}
                    >
                      Active
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateForm(
                          "status",
                          "Inactive"
                        )
                      }
                      className={`rounded-xl border px-4 py-3 text-sm font-black transition ${
                        form.status === "Inactive"
                          ? "border-slate-400 bg-slate-100 text-slate-800"
                          : "border-slate-200 bg-white text-slate-500"
                      }`}
                    >
                      Inactive
                    </button>
                  </div>
                </Field>
              </div>
            </div>

            {/* DRAWER FOOTER */}

            <div className="border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeForm}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void saveCategory()
                  }
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : editing ? (
                    "Save Changes"
                  ) : (
                    "Create Category"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          DELETE CONFIRMATION
      ================================================== */}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-5 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 className="h-5 w-5" />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-950">
              Delete category?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              You're about to delete{" "}
              <span className="font-black text-slate-800">
                {deleteTarget.name}
              </span>
              .
            </p>

            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
              Once Products are linked to categories,
              deleting a category should normally be
              avoided. Use Inactive instead when you
              simply want to hide it from customers.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setDeleteTarget(null)
                }
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void deleteCategory()
                }
                className="flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-black text-white disabled:opacity-60"
              >
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   DESKTOP ROW
========================================================= */

function CategoryTableRow({
  category,
  index,
  total,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleFeatured,
  onMoveUp,
  onMoveDown,
}: {
  category: ProductCategory;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onToggleFeatured: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const image = safeImageUrl(
    category.imageUrl
  );

  return (
    <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
      <td className="px-5 py-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-20"
            title="Move up"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            disabled={index === total - 1}
            onClick={onMoveDown}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-20"
            title="Move down"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            {image ? (
              <img
                src={image}
                alt={category.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="font-black text-slate-950">
              {category.name}
            </div>

            <div className="mt-0.5 max-w-[300px] truncate text-xs text-slate-400">
              {category.description ||
                "No description"}
            </div>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="text-xs font-black text-slate-700">
          {category.categoryCode || "—"}
        </div>

        <div className="mt-1 text-[10px] text-slate-400">
          {category.slug || "—"}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="text-xs font-bold text-slate-600">
          Order{" "}
          {clean(category.displayOrder) ||
            index + 1}
        </div>
      </td>

      <td className="px-5 py-4">
        <button
          type="button"
          onClick={onToggleFeatured}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-black ${
            yes(category.featured)
              ? "bg-amber-50 text-amber-700"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          <Sparkles className="h-3 w-3" />

          {yes(category.featured)
            ? "Featured"
            : "Not Featured"}
        </button>
      </td>

      <td className="px-5 py-4">
        <button
          type="button"
          onClick={onToggleStatus}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-black ${
            active(category.status)
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {active(category.status) ? (
            <Eye className="h-3 w-3" />
          ) : (
            <EyeOff className="h-3 w-3" />
          )}

          {active(category.status)
            ? "Active"
            : "Inactive"}
        </button>
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* =========================================================
   MOBILE CARD
========================================================= */

function CategoryMobileCard({
  category,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleFeatured,
}: {
  category: ProductCategory;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onToggleFeatured: () => void;
}) {
  const image = safeImageUrl(
    category.imageUrl
  );

  return (
    <div className="p-4">
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          {image ? (
            <img
              src={image}
              alt={category.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <ImageIcon className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-black text-slate-950">
            {category.name}
          </div>

          <div className="mt-1 text-xs text-slate-400">
            {category.categoryCode || "No code"} •{" "}
            {category.slug || "No slug"}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onToggleStatus}
              className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                active(category.status)
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {active(category.status)
                ? "Active"
                : "Inactive"}
            </button>

            <button
              type="button"
              onClick={onToggleFeatured}
              className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                yes(category.featured)
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {yes(category.featured)
                ? "Featured"
                : "Not Featured"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-100 text-xs font-black text-slate-600"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="flex h-9 items-center justify-center rounded-lg bg-red-50 px-4 text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>

      <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  help,
  required = false,
  children,
}: {
  label: string;
  help?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-black text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {help && (
        <div className="mt-1 text-[11px] leading-5 text-slate-400">
          {help}
        </div>
      )}

      <div className="mt-2">{children}</div>
    </div>
  );
}

/* =========================================================
   TOGGLE
========================================================= */

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        checked
          ? "bg-blue-600"
          : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
          checked
            ? "left-6"
            : "left-1"
        }`}
      />
    </button>
  );
}

/* =========================================================
   SHARED INPUT STYLE
========================================================= */

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10";
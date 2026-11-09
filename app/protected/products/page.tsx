"use client";

import {
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Package,
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
};

type PriceMasterRow = {
  id: string;
  sku: string;
  itemName: string;
  itemType: string;
  category: string;
  description: string;
  unit: string;
  sellingPrice: string | number;
  gstPercent: string | number;
  minimumSellingPrice?: string | number;
  costPrice?: string | number;
  customerPriceCategory?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: string;
};

type Product = {
  id: string;
  productCode: string;
  sku: string;

  name: string;
  slug: string;

  categoryId: string;
  categoryName: string;

  productType: string;
  garmentType: string;

  shortDescription: string;
  description: string;

  primaryImage: string;
  additionalImages: string;

  priceMasterId: string;
  priceMasterSku: string;

  originalPrice: string;

  badge: string;

  featured: string;
  newArrival: string;

  allowCustomisation: string;

  availableColours: string;
  availableSizes: string;

  displayOrder: string;

  status: string;

  createdAt: string;
  updatedAt: string;
};

type ProductForm = Product;

/* =========================================================
   EMPTY FORM
========================================================= */

const EMPTY_FORM: ProductForm = {
  id: "",
  productCode: "",
  sku: "",

  name: "",
  slug: "",

  categoryId: "",
  categoryName: "",

  productType: "Garment",
  garmentType: "",

  shortDescription: "",
  description: "",

  primaryImage: "",
  additionalImages: "",

  priceMasterId: "",
  priceMasterSku: "",

  originalPrice: "",

  badge: "",

  featured: "No",
  newArrival: "No",

  allowCustomisation: "Yes",

  availableColours: "",
  availableSizes: "",

  displayOrder: "",

  status: "Active",

  createdAt: "",
  updatedAt: "",
};

/* =========================================================
   OPTIONS
========================================================= */

const PRODUCT_TYPES = [
  "Garment",
  "Embroidered Design",
  "Custom Product",
  "Embroidery Service",
  "Patch",
  "Accessory",
];

const GARMENT_TYPES = [
  "T-Shirt",
  "Polo T-Shirt",
  "Hoodie",
  "Sweatshirt",
  "Shirt",
  "Jacket",
  "Cap",
  "Patch",
  "Customer Garment",
  "Other",
];

const BADGES = [
  "",
  "New",
  "Sale",
  "Bestseller",
  "Popular",
  "Premium",
  "Custom",
  "Personalised",
];

/* =========================================================
   HELPERS
========================================================= */

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalize(value: unknown) {
  return clean(value).toLowerCase();
}

function yes(value: unknown) {
  const valueText = normalize(value);

  return (
    valueText === "yes" ||
    valueText === "true" ||
    valueText === "1"
  );
}

function active(value: unknown) {
  const valueText = normalize(value);

  return !valueText || valueText === "active";
}

function numberValue(value: unknown) {
  const parsed = Number(
    clean(value)
      .replace(/,/g, "")
      .replace(/[₹%]/g, "")
  );

  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: unknown) {
  const amount = numberValue(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `product-${Date.now()}`;
}

function createProductCode(name: string) {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const prefix =
    words
      .map((word) => word.slice(0, 3))
      .join("")
      .slice(0, 10) || "PRD";

  return prefix;
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
   MAIN PAGE
========================================================= */

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<
    ProductCategory[]
  >([]);
  const [priceMaster, setPriceMaster] = useState<
    PriceMasterRow[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [formOpen, setFormOpen] = useState(false);

  const [editing, setEditing] = useState(false);

  const [form, setForm] =
    useState<ProductForm>(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] =
    useState<Product | null>(null);

  /* =====================================================
     LOAD ALL DATA
  ====================================================== */

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        productsResponse,
        categoriesResponse,
        pricesResponse,
      ] = await Promise.all([
        fetch("/api/excel?sheet=Products", {
          cache: "no-store",
        }),

        fetch(
          "/api/excel?sheet=ProductCategories",
          {
            cache: "no-store",
          }
        ),

        fetch("/api/excel?sheet=PriceMaster", {
          cache: "no-store",
        }),
      ]);

      const [
        productsText,
        categoriesText,
        pricesText,
      ] = await Promise.all([
        productsResponse.text(),
        categoriesResponse.text(),
        pricesResponse.text(),
      ]);

      let productsData: any = null;
      let categoriesData: any = null;
      let pricesData: any = null;

      try {
        productsData = productsText
          ? JSON.parse(productsText)
          : null;

        categoriesData = categoriesText
          ? JSON.parse(categoriesText)
          : null;

        pricesData = pricesText
          ? JSON.parse(pricesText)
          : null;
      } catch {
        throw new Error(
          "The server returned invalid catalogue data."
        );
      }

      if (
        !productsResponse.ok ||
        !productsData?.success
      ) {
        throw new Error(
          productsData?.message ||
            "Unable to load Products."
        );
      }

      if (
        !categoriesResponse.ok ||
        !categoriesData?.success
      ) {
        throw new Error(
          categoriesData?.message ||
            "Unable to load Product Categories."
        );
      }

      if (
        !pricesResponse.ok ||
        !pricesData?.success
      ) {
        throw new Error(
          pricesData?.message ||
            "Unable to load Price Master."
        );
      }

      setProducts(
        Array.isArray(productsData.rows)
          ? productsData.rows
          : []
      );

      setCategories(
        Array.isArray(categoriesData.rows)
          ? categoriesData.rows
          : []
      );

      setPriceMaster(
        Array.isArray(pricesData.rows)
          ? pricesData.rows
          : []
      );
    } catch (err) {
      console.error("Product load error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  /* =====================================================
     ACTIVE CATEGORIES
  ====================================================== */

  const activeCategories = useMemo(() => {
    return [...categories]
      .filter((category) =>
        active(category.status)
      )
      .sort((a, b) => {
        const orderA = numberValue(
          a.displayOrder
        );

        const orderB = numberValue(
          b.displayOrder
        );

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        return clean(a.name).localeCompare(
          clean(b.name)
        );
      });
  }, [categories]);

  /* =====================================================
     ACTIVE PRICE MASTER
  ====================================================== */

  const activePrices = useMemo(() => {
    return priceMaster
      .filter((price) => active(price.status))
      .sort((a, b) => {
        return clean(a.itemName).localeCompare(
          clean(b.itemName)
        );
      });
  }, [priceMaster]);

  /* =====================================================
     SORT PRODUCTS
  ====================================================== */

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const orderA = numberValue(
        a.displayOrder
      );

      const orderB = numberValue(
        b.displayOrder
      );

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return clean(a.name).localeCompare(
        clean(b.name)
      );
    });
  }, [products]);

  /* =====================================================
     FILTER PRODUCTS
  ====================================================== */

  const filteredProducts = useMemo(() => {
    const query = normalize(search);

    return sortedProducts.filter((product) => {
      const matchesSearch =
        !query ||
        [
          product.productCode,
          product.sku,
          product.name,
          product.categoryName,
          product.productType,
          product.garmentType,
          product.shortDescription,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        categoryFilter === "All" ||
        product.categoryId === categoryFilter;

      const matchesStatus =
        statusFilter === "All" ||
        normalize(product.status) ===
          normalize(statusFilter);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    sortedProducts,
    search,
    categoryFilter,
    statusFilter,
  ]);

  /* =====================================================
     STATS
  ====================================================== */

  const totalCount = products.length;

  const activeCount = products.filter((product) =>
    active(product.status)
  ).length;

  const featuredCount = products.filter((product) =>
    yes(product.featured)
  ).length;

  const customisableCount = products.filter(
    (product) =>
      yes(product.allowCustomisation)
  ).length;

  /* =====================================================
     PRICE LOOKUP
  ====================================================== */

  function getPrice(
    product: Product
  ): PriceMasterRow | undefined {
    if (product.priceMasterId) {
      const byId = priceMaster.find(
        (price) =>
          clean(price.id) ===
          clean(product.priceMasterId)
      );

      if (byId) {
        return byId;
      }
    }

    if (product.priceMasterSku) {
      return priceMaster.find(
        (price) =>
          normalize(price.sku) ===
          normalize(product.priceMasterSku)
      );
    }

    return undefined;
  }

  /* =====================================================
     OPEN CREATE
  ====================================================== */

  function openCreate() {
    setEditing(false);
    setError("");
    setSuccess("");

    const nextOrder =
      products.length > 0
        ? Math.max(
            ...products.map((product) =>
              numberValue(
                product.displayOrder
              )
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

  function openEdit(product: Product) {
    setEditing(true);
    setError("");
    setSuccess("");

    setForm({
      ...EMPTY_FORM,

      ...product,

      id: clean(product.id),

      productCode: clean(
        product.productCode
      ),

      sku: clean(product.sku),

      name: clean(product.name),

      slug: clean(product.slug),

      categoryId: clean(
        product.categoryId
      ),

      categoryName: clean(
        product.categoryName
      ),

      productType:
        clean(product.productType) ||
        "Garment",

      garmentType: clean(
        product.garmentType
      ),

      shortDescription: clean(
        product.shortDescription
      ),

      description: clean(
        product.description
      ),

      primaryImage: clean(
        product.primaryImage
      ),

      additionalImages: clean(
        product.additionalImages
      ),

      priceMasterId: clean(
        product.priceMasterId
      ),

      priceMasterSku: clean(
        product.priceMasterSku
      ),

      originalPrice: clean(
        product.originalPrice
      ),

      badge: clean(product.badge),

      featured: yes(product.featured)
        ? "Yes"
        : "No",

      newArrival: yes(product.newArrival)
        ? "Yes"
        : "No",

      allowCustomisation: yes(
        product.allowCustomisation
      )
        ? "Yes"
        : "No",

      availableColours: clean(
        product.availableColours
      ),

      availableSizes: clean(
        product.availableSizes
      ),

      displayOrder:
        clean(product.displayOrder) || "0",

      status:
        clean(product.status) || "Active",

      createdAt: clean(
        product.createdAt
      ),

      updatedAt: clean(
        product.updatedAt
      ),
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
     UPDATE FORM
  ====================================================== */

  function updateForm(
    field: keyof ProductForm,
    value: string
  ) {
    setForm((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (field === "name" && !editing) {
        const oldAutoSlug = slugify(
          current.name
        );

        const oldAutoCode =
          createProductCode(current.name);

        if (
          !current.slug ||
          current.slug === oldAutoSlug
        ) {
          next.slug = slugify(value);
        }

        if (
          !current.productCode ||
          current.productCode ===
            oldAutoCode
        ) {
          next.productCode =
            createProductCode(value);
        }
      }

      return next;
    });
  }

  /* =====================================================
     CATEGORY CHANGE
  ====================================================== */

  function changeCategory(
    categoryId: string
  ) {
    const category =
      categories.find(
        (item) => item.id === categoryId
      );

    setForm((current) => ({
      ...current,
      categoryId,
      categoryName: category
        ? clean(category.name)
        : "",
    }));
  }

  /* =====================================================
     PRICE MASTER CHANGE
  ====================================================== */

  function changePriceMaster(
    priceId: string
  ) {
    const price = priceMaster.find(
      (item) => item.id === priceId
    );

    setForm((current) => ({
      ...current,

      priceMasterId: priceId,

      priceMasterSku: price
        ? clean(price.sku)
        : "",

      sku:
        current.sku ||
        (price ? clean(price.sku) : ""),
    }));
  }

  /* =====================================================
     SAVE PRODUCT
  ====================================================== */

  async function saveProduct() {
    try {
      setError("");
      setSuccess("");

      const name = clean(form.name);

      if (!name) {
        setError(
          "Product name is required."
        );
        return;
      }

      if (!clean(form.categoryId)) {
        setError(
          "Please select a product category."
        );
        return;
      }

      if (!clean(form.priceMasterId)) {
        setError(
          "Please link the product to Price Master."
        );
        return;
      }

      const slug =
        clean(form.slug) ||
        slugify(name);

      const productCode =
        clean(form.productCode) ||
        createProductCode(name);

      const duplicateSlug =
        products.some(
          (product) =>
            product.id !== form.id &&
            normalize(product.slug) ===
              normalize(slug)
        );

      if (duplicateSlug) {
        setError(
          "Another product already uses this URL slug."
        );
        return;
      }

      const duplicateCode =
        products.some(
          (product) =>
            product.id !== form.id &&
            normalize(
              product.productCode
            ) === normalize(productCode)
        );

      if (duplicateCode) {
        setError(
          "Another product already uses this product code."
        );
        return;
      }

      const selectedCategory =
        categories.find(
          (category) =>
            category.id === form.categoryId
        );

      const selectedPrice =
        priceMaster.find(
          (price) =>
            price.id === form.priceMasterId
        );

      if (!selectedCategory) {
        setError(
          "The selected category could not be found."
        );
        return;
      }

      if (!selectedPrice) {
        setError(
          "The selected Price Master item could not be found."
        );
        return;
      }

      setSaving(true);

      const now =
        new Date().toISOString();

      const record = {
        id: form.id || createId(),

        productCode,

        sku:
          clean(form.sku) ||
          clean(selectedPrice.sku),

        name,

        slug,

        categoryId:
          selectedCategory.id,

        categoryName:
          selectedCategory.name,

        productType:
          clean(form.productType) ||
          "Garment",

        garmentType: clean(
          form.garmentType
        ),

        shortDescription: clean(
          form.shortDescription
        ),

        description: clean(
          form.description
        ),

        primaryImage: clean(
          form.primaryImage
        ),

        additionalImages: clean(
          form.additionalImages
        ),

        priceMasterId:
          selectedPrice.id,

        priceMasterSku:
          clean(selectedPrice.sku),

        originalPrice: clean(
          form.originalPrice
        ),

        badge: clean(form.badge),

        featured:
          form.featured === "Yes"
            ? "Yes"
            : "No",

        newArrival:
          form.newArrival === "Yes"
            ? "Yes"
            : "No",

        allowCustomisation:
          form.allowCustomisation ===
          "Yes"
            ? "Yes"
            : "No",

        availableColours: clean(
          form.availableColours
        ),

        availableSizes: clean(
          form.availableSizes
        ),

        displayOrder:
          clean(form.displayOrder) ||
          "0",

        status:
          clean(form.status) ||
          "Active",

        ...(editing
          ? {}
          : {
              createdAt: now,
            }),

        updatedAt: now,
      };

      const response = await fetch(
        "/api/excel",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            action: editing
              ? "update"
              : "add",

            sheet: "Products",

            id: record.id,

            record,
          }),
        }
      );

      const text =
        await response.text();

      let data: any = null;

      try {
        data = text
          ? JSON.parse(text)
          : null;
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to save product."
        );
      }

      closeForm();

      await loadData();

      setSuccess(
        editing
          ? "Product updated successfully."
          : "Product created successfully."
      );

      window.setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      console.error(
        "Product save error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     TOGGLE STATUS
  ====================================================== */

  async function toggleStatus(
    product: Product
  ) {
    try {
      setError("");

      const newStatus = active(
        product.status
      )
        ? "Inactive"
        : "Active";

      const response = await fetch(
        "/api/excel",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            action: "update",
            sheet: "Products",
            id: product.id,

            record: {
              status: newStatus,
              updatedAt:
                new Date().toISOString(),
            },
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to update product."
        );
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update product."
      );
    }
  }

  /* =====================================================
     TOGGLE FEATURED
  ====================================================== */

  async function toggleFeatured(
    product: Product
  ) {
    try {
      setError("");

      const newValue = yes(
        product.featured
      )
        ? "No"
        : "Yes";

      const response = await fetch(
        "/api/excel",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            action: "update",
            sheet: "Products",
            id: product.id,

            record: {
              featured: newValue,
              updatedAt:
                new Date().toISOString(),
            },
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to update product."
        );
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update product."
      );
    }
  }

  /* =====================================================
     DELETE PRODUCT
  ====================================================== */

  async function deleteProduct() {
    if (!deleteTarget) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        "/api/excel",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            action: "delete",
            sheet: "Products",
            id: deleteTarget.id,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to delete product."
        );
      }

      const name =
        deleteTarget.name;

      setDeleteTarget(null);

      await loadData();

      setSuccess(
        `${name} deleted successfully.`
      );

      window.setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete product."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     SELECTED PRICE PREVIEW
  ====================================================== */

  const selectedPrice =
    useMemo(() => {
      if (!form.priceMasterId) {
        return undefined;
      }

      return priceMaster.find(
        (price) =>
          price.id ===
          form.priceMasterId
      );
    }, [
      form.priceMasterId,
      priceMaster,
    ]);

  /* =====================================================
     UI
  ====================================================== */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}

      <div className="border-b border-slate-200 bg-white">
        <div className="px-5 py-6 sm:px-7 lg:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                <Package className="h-4 w-4" />
                Catalogue Management
              </div>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Products
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Manage the products customers can
                browse and customise. Each product
                belongs to a storefront category and
                gets its selling price from Price
                Master.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 sm:px-7 lg:px-8">
        {/* MESSAGES */}

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

        {/* STATS */}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Total Products"
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
            label="Customisable"
            value={customisableCount}
          />
        </div>

        {/* FILTERS */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search product, SKU, category..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="All">
                All Categories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                )
              )}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className={inputClass}
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

        {/* PRODUCTS */}

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />

                <div className="mt-3 text-sm font-bold text-slate-500">
                  Loading products...
                </div>
              </div>
            </div>
          ) : filteredProducts.length ===
            0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Package className="h-7 w-7" />
              </div>

              <h2 className="mt-5 text-lg font-black text-slate-950">
                {products.length === 0
                  ? "Create your first product"
                  : "No products found"}
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {products.length === 0
                  ? "Add a customer-facing product and link it to a category and Price Master item."
                  : "Try changing your search or filters."}
              </p>

              {products.length === 0 && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
                >
                  <Plus className="h-4 w-4" />
                  Add First Product
                </button>
              )}
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1150px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-left">
                      <TableHead>
                        Product
                      </TableHead>

                      <TableHead>
                        Category
                      </TableHead>

                      <TableHead>
                        Type
                      </TableHead>

                      <TableHead>
                        Selling Price
                      </TableHead>

                      <TableHead>
                        Featured
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>

                      <TableHead right>
                        Actions
                      </TableHead>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map(
                      (product) => {
                        const price =
                          getPrice(
                            product
                          );

                        return (
                          <tr
                            key={product.id}
                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <ProductImage
                                  src={
                                    product.primaryImage
                                  }
                                  alt={
                                    product.name
                                  }
                                />

                                <div className="min-w-0">
                                  <div className="font-black text-slate-950">
                                    {
                                      product.name
                                    }
                                  </div>

                                  <div className="mt-1 text-[11px] text-slate-400">
                                    {product.productCode ||
                                      "No code"}

                                    {product.sku
                                      ? ` • ${product.sku}`
                                      : ""}
                                  </div>

                                  {yes(
                                    product.newArrival
                                  ) && (
                                    <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-[9px] font-black uppercase text-blue-600">
                                      New Arrival
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="text-xs font-bold text-slate-700">
                                {product.categoryName ||
                                  "—"}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="text-xs font-bold text-slate-700">
                                {product.garmentType ||
                                  product.productType ||
                                  "—"}
                              </div>

                              {yes(
                                product.allowCustomisation
                              ) && (
                                <div className="mt-1 text-[10px] font-bold text-blue-600">
                                  Customisable
                                </div>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              {price ? (
                                <>
                                  <div className="text-sm font-black text-slate-950">
                                    {money(
                                      price.sellingPrice
                                    )}
                                  </div>

                                  <div className="mt-1 text-[10px] text-slate-400">
                                    {numberValue(
                                      price.gstPercent
                                    ) >
                                    0
                                      ? `${numberValue(
                                          price.gstPercent
                                        )}% GST`
                                      : "Price Master"}
                                  </div>
                                </>
                              ) : (
                                <span className="text-xs font-bold text-red-500">
                                  Price not linked
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  void toggleFeatured(
                                    product
                                  )
                                }
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-black ${
                                  yes(
                                    product.featured
                                  )
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                <Sparkles className="h-3 w-3" />

                                {yes(
                                  product.featured
                                )
                                  ? "Featured"
                                  : "No"}
                              </button>
                            </td>

                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  void toggleStatus(
                                    product
                                  )
                                }
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-black ${
                                  active(
                                    product.status
                                  )
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {active(
                                  product.status
                                ) ? (
                                  <Eye className="h-3 w-3" />
                                ) : (
                                  <EyeOff className="h-3 w-3" />
                                )}

                                {active(
                                  product.status
                                )
                                  ? "Active"
                                  : "Inactive"}
                              </button>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEdit(
                                      product
                                    )
                                  }
                                  title="Edit"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteTarget(
                                      product
                                    )
                                  }
                                  title="Delete"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE */}

              <div className="divide-y divide-slate-100 lg:hidden">
                {filteredProducts.map(
                  (product) => {
                    const price =
                      getPrice(product);

                    return (
                      <div
                        key={product.id}
                        className="p-4"
                      >
                        <div className="flex gap-3">
                          <ProductImage
                            src={
                              product.primaryImage
                            }
                            alt={product.name}
                            large
                          />

                          <div className="min-w-0 flex-1">
                            <div className="font-black text-slate-950">
                              {product.name}
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                              {product.categoryName ||
                                "No category"}
                            </div>

                            <div className="mt-2 text-sm font-black text-slate-950">
                              {price
                                ? money(
                                    price.sellingPrice
                                  )
                                : "Price not linked"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEdit(
                                product
                              )
                            }
                            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-100 text-xs font-black text-slate-600"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void toggleStatus(
                                product
                              )
                            }
                            className="h-9 rounded-lg bg-blue-50 px-3 text-xs font-black text-blue-600"
                          >
                            {active(
                              product.status
                            )
                              ? "Hide"
                              : "Activate"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget(
                                product
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }
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
            aria-label="Close product form"
            onClick={closeForm}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
          />

          <div className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-white shadow-2xl">
            {/* DRAWER HEADER */}

            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                  Catalogue Management
                </div>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  {editing
                    ? "Edit Product"
                    : "New Product"}
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Configure how this product appears
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
              <div className="space-y-7">
                {/* BASIC INFORMATION */}

                <FormSection
                  title="Basic Information"
                  description="The information customers will see in the shop."
                >
                  <Field
                    label="Product Name"
                    required
                  >
                    <input
                      value={form.name}
                      onChange={(event) =>
                        updateForm(
                          "name",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Premium Cotton Polo"
                      className={inputClass}
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Product Code">
                      <input
                        value={
                          form.productCode
                        }
                        onChange={(event) =>
                          updateForm(
                            "productCode",
                            event.target.value
                              .toUpperCase()
                              .replace(
                                /\s+/g,
                                ""
                              )
                          )
                        }
                        placeholder="PREPOL"
                        className={
                          inputClass
                        }
                      />
                    </Field>

                    <Field label="SKU">
                      <input
                        value={form.sku}
                        onChange={(event) =>
                          updateForm(
                            "sku",
                            event.target.value
                          )
                        }
                        placeholder="POLO-001"
                        className={
                          inputClass
                        }
                      />
                    </Field>
                  </div>

                  <Field
                    label="Store URL Slug"
                    help="Automatically generated from the product name."
                  >
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
                      placeholder="premium-cotton-polo"
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Product Category"
                    required
                    help="This controls which collection the product appears under."
                  >
                    <div className="relative">
                      <select
                        value={
                          form.categoryId
                        }
                        onChange={(event) =>
                          changeCategory(
                            event.target
                              .value
                          )
                        }
                        className={`${inputClass} appearance-none pr-10`}
                      >
                        <option value="">
                          Select category
                        </option>

                       {categories
  .slice()
  .sort((a, b) => {
    const orderA = numberValue(a.displayOrder);
    const orderB = numberValue(b.displayOrder);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return clean(a.name).localeCompare(clean(b.name));
  })
  .map((category) => (
    <option
      key={category.id}
      value={category.id}
    >
      {category.name}
      {!active(category.status) ? " — Inactive" : ""}
    </option>
  ))}
                      </select>

                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>

{categories.length === 0 && (
                      <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
No Product Categories found. Create a category first.
                      </div>
                    )}
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Product Type">
                      <select
                        value={
                          form.productType
                        }
                        onChange={(event) =>
                          updateForm(
                            "productType",
                            event.target
                              .value
                          )
                        }
                        className={inputClass}
                      >
                        {PRODUCT_TYPES.map(
                          (type) => (
                            <option
                              key={type}
                              value={type}
                            >
                              {type}
                            </option>
                          )
                        )}
                      </select>
                    </Field>

                    <Field label="Garment Type">
                      <select
                        value={
                          form.garmentType
                        }
                        onChange={(event) =>
                          updateForm(
                            "garmentType",
                            event.target
                              .value
                          )
                        }
                        className={inputClass}
                      >
                        <option value="">
                          Select
                        </option>

                        {GARMENT_TYPES.map(
                          (type) => (
                            <option
                              key={type}
                              value={type}
                            >
                              {type}
                            </option>
                          )
                        )}
                      </select>
                    </Field>
                  </div>
                </FormSection>

                {/* DESCRIPTION */}

                <FormSection
                  title="Product Description"
                  description="Explain the product clearly to customers."
                >
                  <Field
                    label="Short Description"
                    help="Used on product cards and catalogue previews."
                  >
                    <textarea
                      rows={3}
                      value={
                        form.shortDescription
                      }
                      onChange={(event) =>
                        updateForm(
                          "shortDescription",
                          event.target.value
                        )
                      }
                      placeholder="Premium cotton polo ideal for company logos, teams and uniforms."
                      className={`${inputClass} h-auto resize-none py-3`}
                    />
                  </Field>

                  <Field label="Full Description">
                    <textarea
                      rows={5}
                      value={
                        form.description
                      }
                      onChange={(event) =>
                        updateForm(
                          "description",
                          event.target.value
                        )
                      }
                      placeholder="Enter full product details..."
                      className={`${inputClass} h-auto resize-none py-3`}
                    />
                  </Field>
                </FormSection>

                {/* IMAGES */}

                <FormSection
                  title="Product Images"
                  description="Images displayed on the customer storefront."
                >
                  <Field
                    label="Primary Image URL"
                    help="Paste an image URL for now. Direct upload can be added later."
                  >
                    <input
                      value={
                        form.primaryImage
                      }
                      onChange={(event) =>
                        updateForm(
                          "primaryImage",
                          event.target.value
                        )
                      }
                      placeholder="https://..."
                      className={inputClass}
                    />
                  </Field>

                  {safeImageUrl(
                    form.primaryImage
                  ) ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                      <div className="aspect-[16/8]">
                        <img
                          src={safeImageUrl(
                            form.primaryImage
                          )}
                          alt="Product preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-6 w-6 text-slate-300" />

                        <div className="mt-2 text-xs font-semibold text-slate-400">
                          Product image
                          preview
                        </div>
                      </div>
                    </div>
                  )}

                  <Field
                    label="Additional Images"
                    help="Enter multiple image URLs separated by commas."
                  >
                    <textarea
                      rows={3}
                      value={
                        form.additionalImages
                      }
                      onChange={(event) =>
                        updateForm(
                          "additionalImages",
                          event.target.value
                        )
                      }
                      placeholder="https://image-2.jpg, https://image-3.jpg"
                      className={`${inputClass} h-auto resize-none py-3`}
                    />
                  </Field>
                </FormSection>

                {/* PRICING */}

                <FormSection
                  title="Pricing"
                  description="The live selling price comes from Price Master."
                >
                  <Field
                    label="Price Master Item"
                    required
                    help="Changing the selling price in Price Master will automatically change this product's storefront price."
                  >
                    <div className="relative">
                      <select
                        value={
                          form.priceMasterId
                        }
                        onChange={(event) =>
                          changePriceMaster(
                            event.target
                              .value
                          )
                        }
                        className={`${inputClass} appearance-none pr-10`}
                      >
                        <option value="">
                          Select Price
                          Master item
                        </option>

                        {activePrices.map(
                          (price) => (
                            <option
                              key={
                                price.id
                              }
                              value={
                                price.id
                              }
                            >
                              {price.sku
                                ? `${price.sku} — `
                                : ""}
                              {price.itemName ||
                                price.itemType ||
                                price.category}{" "}
                              —{" "}
                              {money(
                                price.sellingPrice
                              )}
                            </option>
                          )
                        )}
                      </select>

                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </Field>

                  {selectedPrice && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                        Customer Selling
                        Price
                      </div>

                      <div className="mt-2 text-2xl font-black text-slate-950">
                        {money(
                          selectedPrice.sellingPrice
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                        <span>
                          SKU:{" "}
                          <strong className="text-slate-700">
                            {selectedPrice.sku ||
                              "—"}
                          </strong>
                        </span>

                        <span>
                          GST:{" "}
                          <strong className="text-slate-700">
                            {numberValue(
                              selectedPrice.gstPercent
                            )}
                            %
                          </strong>
                        </span>

                        <span>
                          Unit:{" "}
                          <strong className="text-slate-700">
                            {selectedPrice.unit ||
                              "—"}
                          </strong>
                        </span>
                      </div>
                    </div>
                  )}

                  <Field
                    label="Original / MRP Price"
                    help="Optional. Use this when you want the storefront to show a crossed-out price, for example ₹1,499 → ₹999."
                  >
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.originalPrice
                      }
                      onChange={(event) =>
                        updateForm(
                          "originalPrice",
                          event.target.value
                        )
                      }
                      placeholder="1499"
                      className={inputClass}
                    />
                  </Field>
                </FormSection>

                {/* VARIANTS */}

                <FormSection
                  title="Customer Options"
                  description="Configure the choices available when customers order this product."
                >
                  <Field
                    label="Available Colours"
                    help="Separate colours with commas."
                  >
                    <input
                      value={
                        form.availableColours
                      }
                      onChange={(event) =>
                        updateForm(
                          "availableColours",
                          event.target.value
                        )
                      }
                      placeholder="Black, White, Navy, Red"
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Available Sizes"
                    help="Separate sizes with commas."
                  >
                    <input
                      value={
                        form.availableSizes
                      }
                      onChange={(event) =>
                        updateForm(
                          "availableSizes",
                          event.target.value
                        )
                      }
                      placeholder="XS, S, M, L, XL, XXL"
                      className={inputClass}
                    />
                  </Field>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <div className="text-sm font-black text-slate-950">
                          Allow
                          Customisation
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Customers can
                          select embroidery
                          placement and
                          upload their
                          artwork/logo.
                        </p>
                      </div>

                      <Toggle
                        checked={yes(
                          form.allowCustomisation
                        )}
                        onChange={(
                          checked
                        ) =>
                          updateForm(
                            "allowCustomisation",
                            checked
                              ? "Yes"
                              : "No"
                          )
                        }
                      />
                    </div>
                  </div>
                </FormSection>

                {/* STOREFRONT */}

                <FormSection
                  title="Storefront"
                  description="Control how the product is promoted and displayed."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Badge">
                      <select
                        value={
                          form.badge
                        }
                        onChange={(event) =>
                          updateForm(
                            "badge",
                            event.target
                              .value
                          )
                        }
                        className={inputClass}
                      >
                        {BADGES.map(
                          (badge) => (
                            <option
                              key={
                                badge ||
                                "none"
                              }
                              value={badge}
                            >
                              {badge ||
                                "No Badge"}
                            </option>
                          )
                        )}
                      </select>
                    </Field>

                    <Field label="Display Order">
                      <input
                        type="number"
                        min="0"
                        value={
                          form.displayOrder
                        }
                        onChange={(event) =>
                          updateForm(
                            "displayOrder",
                            event.target
                              .value
                          )
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <SwitchCard
                    title="Featured Product"
                    description="Promote this product in featured sections."
                    checked={yes(
                      form.featured
                    )}
                    onChange={(checked) =>
                      updateForm(
                        "featured",
                        checked
                          ? "Yes"
                          : "No"
                      )
                    }
                  />

                  <SwitchCard
                    title="New Arrival"
                    description="Show this product as a new arrival."
                    checked={yes(
                      form.newArrival
                    )}
                    onChange={(checked) =>
                      updateForm(
                        "newArrival",
                        checked
                          ? "Yes"
                          : "No"
                      )
                    }
                  />

                  <Field
                    label="Product Status"
                    help="Inactive products are hidden from customers."
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
                          form.status ===
                          "Active"
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
                          form.status ===
                          "Inactive"
                            ? "border-slate-400 bg-slate-100 text-slate-800"
                            : "border-slate-200 bg-white text-slate-500"
                        }`}
                      >
                        Inactive
                      </button>
                    </div>
                  </Field>
                </FormSection>
              </div>
            </div>

            {/* FOOTER */}

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
                    void saveProduct()
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
                    "Create Product"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE */}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-5 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 className="h-5 w-5" />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-950">
              Delete product?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              You're about to delete{" "}
              <span className="font-black text-slate-800">
                {deleteTarget.name}
              </span>
              .
            </p>

            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
              For products that have already been
              ordered, using Inactive is normally
              better than deleting them.
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
                  void deleteProduct()
                }
                className="flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-black text-white disabled:opacity-60"
              >
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function ProductImage({
  src,
  alt,
  large = false,
}: {
  src: string;
  alt: string;
  large?: boolean;
}) {
  const image = safeImageUrl(src);

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-xl bg-slate-100 ${
        large
          ? "h-20 w-20"
          : "h-14 w-14"
      }`}
    >
      {image ? (
        <img
          src={image}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-300">
          <ImageIcon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

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

function TableHead({
  children,
  right = false,
}: {
  children: React.ReactNode;
  right?: boolean;
}) {
  return (
    <th
      className={`px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 border-b border-slate-100 pb-3">
        <h3 className="text-sm font-black text-slate-950">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {description}
          </p>
        )}
      </div>

      <div className="space-y-5">
        {children}
      </div>
    </section>
  );
}

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

function SwitchCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-5">
        <div>
          <div className="text-sm font-black text-slate-950">
            {title}
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <Toggle
          checked={checked}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

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
   SHARED INPUT CLASS
========================================================= */

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10";
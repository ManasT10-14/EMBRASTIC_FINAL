"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  Grid2X2,
  Heart,
  Loader2,
  PackageSearch,
  Search,
  Shirt,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type CatalogCategory = {
  id: string;
  categoryCode: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  featured: boolean;
  productCount: number;
};

type ProductPrice = {
  sellingPrice: number;
  originalPrice: number | null;
  gstPercent: number;
  unit: string;
  priceMasterSku: string;
};

type CatalogProduct = {
  id: string;

  productCode: string;
  sku: string;

  name: string;
  slug: string;

  categoryId: string;
  categoryName: string;
  categorySlug: string;

  productType: string;
  garmentType: string;

  shortDescription: string;
  description: string;

  primaryImage: string;
  additionalImages: string[];

  badge: string;

  featured: boolean;
  newArrival: boolean;
  allowCustomisation: boolean;

  availableColours: string[];
  availableSizes: string[];

  displayOrder: number;

  price: ProductPrice;
};

type CatalogResponse = {
  success: boolean;
  message?: string;

  categories: CatalogCategory[];
  products: CatalogProduct[];

  totalProducts: number;
  totalCategories: number;
};

type SortOption =
  | "featured"
  | "newest"
  | "name"
  | "price-low"
  | "price-high";

/* =========================================================
   HELPERS
========================================================= */

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalize(value: unknown) {
  return clean(value).toLowerCase();
}

function formatMoney(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "₹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function safeImageUrl(value: unknown) {
  const url = clean(value);

  if (!url) {
    return "";
  }

  if (
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("/")
  ) {
    return url;
  }

  return "";
}

/* =========================================================
   PAGE WRAPPER

   useSearchParams is intentionally inside Suspense for
   Next.js 16 / cacheComponents compatibility.
========================================================= */

export default function CustomerProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent />
    </Suspense>
  );
}

/* =========================================================
   MAIN PRODUCTS PAGE
========================================================= */

function ProductsContent() {
  const searchParams = useSearchParams();

  const categoryFromUrl =
    searchParams.get("category") || "";

  const [categories, setCategories] = useState<
    CatalogCategory[]
  >([]);

  const [products, setProducts] = useState<
    CatalogProduct[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState(categoryFromUrl);

  const [sort, setSort] =
    useState<SortOption>("featured");

  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  /* =====================================================
     KEEP URL CATEGORY IN SYNC
  ====================================================== */

  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  /* =====================================================
     LOAD DYNAMIC CATALOGUE
  ====================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/customer/catalog",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const text = await response.text();

        let data: CatalogResponse | null = null;

        try {
          data = text
            ? JSON.parse(text)
            : null;
        } catch {
          throw new Error(
            "The catalogue service returned an invalid response."
          );
        }

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              "Unable to load the catalogue."
          );
        }

        if (cancelled) {
          return;
        }

        setCategories(
          Array.isArray(data.categories)
            ? data.categories
            : []
        );

        setProducts(
          Array.isArray(data.products)
            ? data.products
            : []
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Customer catalogue load error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load products."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =====================================================
     CATEGORY RESOLUTION

     Supports:
     ?category=anime-lovers
     ?category=Anime Lovers
     ?category=<category-id>
  ====================================================== */

  const activeCategory =
    useMemo(() => {
      if (!selectedCategory) {
        return null;
      }

      const wanted =
        normalize(selectedCategory);

      return (
        categories.find(
          (category) =>
            normalize(category.slug) ===
              wanted ||
            normalize(category.name) ===
              wanted ||
            normalize(category.id) ===
              wanted
        ) || null
      );
    }, [
      categories,
      selectedCategory,
    ]);

  /* =====================================================
     FILTER + SORT
  ====================================================== */

  const displayedProducts =
    useMemo(() => {
      const query = normalize(search);

      let result = products.filter(
        (product) => {
          const matchesCategory =
            !activeCategory ||
            product.categoryId ===
              activeCategory.id;

          if (!matchesCategory) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchable = [
            product.name,
            product.productCode,
            product.sku,
            product.categoryName,
            product.productType,
            product.garmentType,
            product.shortDescription,
            product.description,
            ...(product.availableColours ||
              []),
            ...(product.availableSizes ||
              []),
          ]
            .join(" ")
            .toLowerCase();

          return searchable.includes(query);
        }
      );

      result = [...result].sort(
        (a, b) => {
          if (sort === "price-low") {
            return (
              a.price.sellingPrice -
              b.price.sellingPrice
            );
          }

          if (sort === "price-high") {
            return (
              b.price.sellingPrice -
              a.price.sellingPrice
            );
          }

          if (sort === "name") {
            return a.name.localeCompare(
              b.name
            );
          }

          if (sort === "newest") {
            if (
              a.newArrival !==
              b.newArrival
            ) {
              return a.newArrival
                ? -1
                : 1;
            }

            return (
              a.displayOrder -
              b.displayOrder
            );
          }

          /*
           * Featured sorting.
           */

          if (
            a.featured !== b.featured
          ) {
            return a.featured
              ? -1
              : 1;
          }

          if (
            a.newArrival !==
            b.newArrival
          ) {
            return a.newArrival
              ? -1
              : 1;
          }

          if (
            a.displayOrder !==
            b.displayOrder
          ) {
            return (
              a.displayOrder -
              b.displayOrder
            );
          }

          return a.name.localeCompare(
            b.name
          );
        }
      );

      return result;
    }, [
      products,
      activeCategory,
      search,
      sort,
    ]);

  /* =====================================================
     FEATURED CATEGORIES
  ====================================================== */

  const quickCategories =
    useMemo(() => {
      const featured =
        categories.filter(
          (category) =>
            category.featured
        );

      const source =
        featured.length > 0
          ? featured
          : categories;

      return source.slice(0, 8);
    }, [categories]);

  /* =====================================================
     CATEGORY URL
  ====================================================== */

  function categoryHref(
    category: CatalogCategory
  ) {
    return `/customer/products?category=${encodeURIComponent(
      category.slug ||
        category.name ||
        category.id
    )}`;
  }

  /* =====================================================
     PRODUCT COUNT TEXT
  ====================================================== */

  const resultText =
    displayedProducts.length === 1
      ? "1 product"
      : `${displayedProducts.length} products`;

  /* =====================================================
     LOADING
  ====================================================== */

  if (loading) {
    return <ProductsLoading />;
  }

  /* =====================================================
     ERROR
  ====================================================== */

  if (error) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-5">
          <div className="max-w-lg text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <PackageSearch className="h-7 w-7" />
            </div>

            <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
              We couldn't load the shop
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      {/* =================================================
          SHOP HERO
      ================================================== */}

      <section className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto max-w-[1500px] px-5 py-12 sm:px-7 sm:py-16 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">
                <Sparkles className="h-3.5 w-3.5" />
                EMBRASTIC Custom Apparel
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                {activeCategory
                  ? activeCategory.name
                  : "Choose it. Customise it. Make it yours."}
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                {activeCategory?.description ||
                  "Browse garments, embroidery designs and custom products. Choose your product, select colours and sizes, add your logo or artwork, and we'll handle the embroidery and production."}
              </p>

              {activeCategory && (
                <Link
                  href="/customer/products"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-black text-blue-300 transition hover:text-white"
                >
                  View all products
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
              <HeroStat
                value={categories.length}
                label="Collections"
              />

              <HeroStat
                value={products.length}
                label="Products"
              />

              <HeroStat
                value={
                  products.filter(
                    (product) =>
                      product.allowCustomisation
                  ).length
                }
                label="Customisable"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          QUICK CATEGORY NAVIGATION
      ================================================== */}

      {quickCategories.length > 0 && (
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1500px] px-5 py-5 sm:px-7 lg:px-10">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Link
                href="/customer/products"
                className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-black transition ${
                  !activeCategory
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                }`}
              >
                All Products
              </Link>

              {quickCategories.map(
                (category) => {
                  const selected =
                    activeCategory?.id ===
                    category.id;

                  return (
                    <Link
                      key={category.id}
                      href={categoryHref(
                        category
                      )}
                      className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-black transition ${
                        selected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
                      }`}
                    >
                      {category.name}

                      {category.productCount >
                        0 && (
                        <span className="ml-1.5 opacity-60">
                          {
                            category.productCount
                          }
                        </span>
                      )}
                    </Link>
                  );
                }
              )}
            </div>
          </div>
        </section>
      )}

      {/* =================================================
          MOBILE FILTER BUTTON
      ================================================== */}

      <div className="border-b border-slate-200 bg-white lg:hidden">
        <div className="mx-auto max-w-[1500px] px-5 py-3 sm:px-7">
          <button
            type="button"
            onClick={() =>
              setMobileFiltersOpen(true)
            }
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Categories & Filters
          </button>
        </div>
      </div>

      {/* =================================================
          MAIN SHOP
      ================================================== */}

      <section>
        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
          <div className="grid gap-10 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
            {/* =============================================
                DESKTOP SIDEBAR
            ============================================== */}

            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-950">
                    <Grid2X2 className="h-4 w-4" />
                    Shop Categories
                  </div>
                </div>

                <div className="mt-3">
                  <CategoryLink
                    href="/customer/products"
                    name="All Products"
                    count={products.length}
                    selected={!activeCategory}
                  />

                  {categories.map(
                    (category) => (
                      <CategoryLink
                        key={category.id}
                        href={categoryHref(
                          category
                        )}
                        name={category.name}
                        count={
                          category.productCount
                        }
                        selected={
                          activeCategory?.id ===
                          category.id
                        }
                      />
                    )
                  )}
                </div>

                <div className="mt-8 rounded-2xl bg-slate-950 p-5 text-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                    <Shirt className="h-5 w-5" />
                  </div>

                  <h3 className="mt-4 text-base font-black">
                    Have your own garments?
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    We can embroider your logo or
                    artwork onto garments you already
                    have.
                  </p>

                  <Link
                    href="/customer/products?category=custom-embroidery"
                    className="mt-4 inline-flex items-center gap-2 text-xs font-black text-blue-300"
                  >
                    Explore embroidery
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </aside>

            {/* =============================================
                PRODUCT AREA
            ============================================== */}

            <div className="min-w-0">
              {/* TOOLBAR */}

              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                    {activeCategory
                      ? activeCategory.name
                      : "All Products"}
                  </div>

                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                    {activeCategory
                      ? `Shop ${activeCategory.name}`
                      : "Explore the collection"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    {resultText}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  {/* SEARCH */}

                  <div className="relative sm:w-64">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value
                        )
                      }
                      placeholder="Search products..."
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                    />

                    {search && (
                      <button
                        type="button"
                        onClick={() =>
                          setSearch("")
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* SORT */}

                  <select
                    value={sort}
                    onChange={(event) =>
                      setSort(
                        event.target
                          .value as SortOption
                      )
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="featured">
                      Featured
                    </option>

                    <option value="newest">
                      New Arrivals
                    </option>

                    <option value="name">
                      Name A–Z
                    </option>

                    <option value="price-low">
                      Price: Low to High
                    </option>

                    <option value="price-high">
                      Price: High to Low
                    </option>
                  </select>
                </div>
              </div>

              {/* PRODUCT GRID */}

              {displayedProducts.length >
              0 ? (
                <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
                  {displayedProducts.map(
                    (product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                      />
                    )
                  )}
                </div>
              ) : (
                <EmptyProducts
                  category={
                    activeCategory
                  }
                  search={search}
                  clearSearch={() =>
                    setSearch("")
                  }
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          CUSTOM ORDER CTA
      ================================================== */}

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-[1500px] px-5 py-14 sm:px-7 lg:px-10 lg:py-20">
          <div className="overflow-hidden rounded-[28px] bg-slate-950">
            <div className="grid lg:grid-cols-[1fr_380px]">
              <div className="p-7 sm:p-10 lg:p-12">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-blue-400">
                  Need something different?
                </div>

                <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.03em] text-white sm:text-4xl">
                  Tell us what you want embroidered.
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
                  Choose a garment from the shop or
                  bring your own. Upload your logo,
                  artwork or idea and we'll prepare
                  the embroidery design for approval
                  before production.
                </p>

                <Link
                  href="/customer/products?category=custom-embroidery"
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
                >
                  Start Custom Embroidery
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="hidden items-center justify-center border-l border-white/10 bg-white/[0.03] lg:flex">
                <div className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 text-white">
                    <ShoppingBag className="h-8 w-8" />
                  </div>

                  <div className="mt-4 text-sm font-black text-white">
                    Your Brand.
                  </div>

                  <div className="mt-1 text-sm font-black text-blue-400">
                    Stitched to stand out.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          MOBILE FILTER DRAWER
      ================================================== */}

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() =>
              setMobileFiltersOpen(false)
            }
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
          />

          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                  Shop
                </div>

                <div className="mt-1 text-xl font-black text-slate-950">
                  Categories
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <Link
                href="/customer/products"
                onClick={() =>
                  setMobileFiltersOpen(false)
                }
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-black ${
                  !activeCategory
                    ? "bg-slate-950 text-white"
                    : "text-slate-700"
                }`}
              >
                All Products

                <span className="text-xs opacity-60">
                  {products.length}
                </span>
              </Link>

              <div className="mt-2 space-y-1">
                {categories.map(
                  (category) => {
                    const selected =
                      activeCategory?.id ===
                      category.id;

                    return (
                      <Link
                        key={category.id}
                        href={categoryHref(
                          category
                        )}
                        onClick={() =>
                          setMobileFiltersOpen(
                            false
                          )
                        }
                        className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition ${
                          selected
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span>
                          {category.name}
                        </span>

                        <span className="text-xs opacity-50">
                          {
                            category.productCount
                          }
                        </span>
                      </Link>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
  product,
}: {
  product: CatalogProduct;
}) {
  const image = safeImageUrl(
    product.primaryImage
  );

  const hasSale =
    product.price.originalPrice !==
      null &&
    product.price.originalPrice >
      product.price.sellingPrice;

  const href = `/customer/products/${encodeURIComponent(
    product.slug || product.id
  )}`;

  return (
    <article className="group min-w-0">
      {/* IMAGE */}

      <div className="relative overflow-hidden rounded-2xl bg-slate-100">
        <Link
          href={href}
          className="block aspect-[4/5]"
        >
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-5 text-center">
              <Shirt className="h-10 w-10 text-slate-300" />

              <span className="mt-3 text-xs font-black text-slate-400">
                {product.garmentType ||
                  product.productType ||
                  "EMBRASTIC"}
              </span>
            </div>
          )}
        </Link>

        {/* BADGES */}

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.badge && (
            <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white">
              {product.badge}
            </span>
          )}

          {!product.badge &&
            product.newArrival && (
              <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white">
                New
              </span>
            )}

          {hasSale &&
            normalize(
              product.badge
            ) !== "sale" && (
              <span className="rounded-full bg-red-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white">
                Sale
              </span>
            )}
        </div>

        {/* WISHLIST VISUAL */}

        <button
          type="button"
          aria-label={`Save ${product.name}`}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-sm transition hover:text-red-500"
        >
          <Heart className="h-4 w-4" />
        </button>

        {/* DESKTOP HOVER CTA */}

        <Link
          href={href}
          className="absolute inset-x-3 bottom-3 hidden translate-y-2 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-950 opacity-0 shadow-xl transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 sm:flex"
        >
          {product.allowCustomisation
            ? "View & Customise"
            : "View Product"}

          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* PRODUCT INFO */}

      <div className="pt-4">
        <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
          {product.categoryName}
        </div>

        <Link href={href}>
          <h3 className="mt-1.5 line-clamp-2 text-sm font-black leading-5 text-slate-950 transition group-hover:text-blue-600 sm:text-[15px]">
            {product.name}
          </h3>
        </Link>

        {product.shortDescription && (
          <p className="mt-1.5 hidden line-clamp-2 text-xs leading-5 text-slate-400 sm:block">
            {product.shortDescription}
          </p>
        )}

        {/* VARIANT INFO */}

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-400">
          {product.availableColours
            .length > 0 && (
            <span>
              {
                product
                  .availableColours
                  .length
              }{" "}
              {product.availableColours
                .length === 1
                ? "colour"
                : "colours"}
            </span>
          )}

          {product.availableSizes
            .length > 0 && (
            <span>
              {
                product
                  .availableSizes
                  .length
              }{" "}
              {product.availableSizes
                .length === 1
                ? "size"
                : "sizes"}
            </span>
          )}

          {product.allowCustomisation && (
            <span className="text-blue-600">
              Customisable
            </span>
          )}
        </div>

        {/* PRICE */}

        <div className="mt-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-base font-black text-slate-950 sm:text-lg">
              {formatMoney(
                product.price
                  .sellingPrice
              )}
            </span>

            {hasSale && (
              <span className="text-xs font-semibold text-slate-400 line-through">
                {formatMoney(
                  product.price
                    .originalPrice
                )}
              </span>
            )}
          </div>

          <div className="mt-1 text-[10px] font-semibold text-slate-400">
            {product.price.gstPercent >
            0
              ? `Incl. ${product.price.gstPercent}% GST`
              : "Price shown per item"}
          </div>
        </div>

        {/* MOBILE CTA */}

        <Link
          href={href}
          className="mt-3 flex h-9 items-center justify-center rounded-lg border border-slate-200 text-[11px] font-black text-slate-700 sm:hidden"
        >
          {product.allowCustomisation
            ? "Customise"
            : "View Product"}
        </Link>
      </div>
    </article>
  );
}

/* =========================================================
   CATEGORY LINK
========================================================= */

function CategoryLink({
  href,
  name,
  count,
  selected,
}: {
  href: string;
  name: string;
  count: number;
  selected: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
        selected
          ? "bg-blue-50 font-black text-blue-700"
          : "font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      <span className="min-w-0 truncate">
        {name}
      </span>

      <div className="ml-3 flex shrink-0 items-center gap-1.5">
        <span
          className={`text-[10px] ${
            selected
              ? "font-black text-blue-500"
              : "text-slate-400"
          }`}
        >
          {count}
        </span>

        <ChevronRight
          className={`h-3.5 w-3.5 ${
            selected
              ? "text-blue-500"
              : "text-slate-300 transition group-hover:text-slate-500"
          }`}
        />
      </div>
    </Link>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyProducts({
  category,
  search,
  clearSearch,
}: {
  category: CatalogCategory | null;
  search: string;
  clearSearch: () => void;
}) {
  return (
    <div className="flex min-h-[450px] items-center justify-center">
      <div className="max-w-md px-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <PackageSearch className="h-7 w-7" />
        </div>

        <h3 className="mt-5 text-xl font-black text-slate-950">
          {search
            ? "No matching products"
            : category
              ? `No products in ${category.name} yet`
              : "No products available yet"}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {search
            ? `We couldn't find anything matching “${search}”.`
            : category
              ? "This category is active, but there are currently no active products with a valid Price Master selling price."
              : "Products added and activated in the Business OS will appear here automatically."}
        </p>

        {search ? (
          <button
            type="button"
            onClick={clearSearch}
            className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
          >
            Clear Search
          </button>
        ) : category ? (
          <Link
            href="/customer/products"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
          >
            Browse All Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/* =========================================================
   HERO STAT
========================================================= */

function HeroStat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-2 py-4 text-center">
      <div className="text-xl font-black text-white sm:text-2xl">
        {value}
      </div>

      <div className="mt-1 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function ProductsLoading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-7 lg:px-10">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-800" />

          <div className="mt-5 h-12 max-w-2xl animate-pulse rounded-xl bg-slate-800" />

          <div className="mt-4 h-5 max-w-xl animate-pulse rounded bg-slate-800" />
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-7 lg:px-10">
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

            <div className="mt-4 text-sm font-black text-slate-500">
              Loading EMBRASTIC products...
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
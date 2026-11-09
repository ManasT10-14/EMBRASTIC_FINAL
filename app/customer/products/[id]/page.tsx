"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Loader2,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  ChangeEvent,
  ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* =========================================================
   TYPES
========================================================= */

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
  products: CatalogProduct[];
};

type QuantityMap = Record<string, number>;

type ArtworkFile = {
  uploadId: string;
  name: string;
  storedName: string;
  size: number;
  type: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const EMBROIDERY_PLACEMENTS = [
  { id: "left-chest", label: "Left Chest", description: "Classic logo placement" },
  { id: "right-chest", label: "Right Chest", description: "Opposite chest placement" },
  { id: "left-sleeve", label: "Left Sleeve", description: "Small sleeve embroidery" },
  { id: "right-sleeve", label: "Right Sleeve", description: "Small sleeve embroidery" },
  { id: "back", label: "Back", description: "Large back embroidery" },
  { id: "front-centre", label: "Front Centre", description: "Central front embroidery" },
];

const EMBROIDERY_SIZES = [
  { id: "small", label: 'Small — up to 3"', description: "Compact chest logos and small branding" },
  { id: "medium", label: 'Medium — up to 5"', description: "Ideal for most chest and sleeve embroidery" },
  { id: "large", label: 'Large — up to 8"', description: "Suitable for larger front or back embroidery" },
  { id: "extra-large", label: 'Extra Large — above 8"', description: "Large-format embroidery; final pricing may require review" },
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

function safeImageUrl(value: unknown) {
  const url = clean(value);
  if (!url) return "";
  if (url.startsWith("https://") || url.startsWith("http://") || url.startsWith("/")) {
    return url;
  }
  return "";
}

function formatMoney(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TrustItem({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center p-3 text-center">
      <div className="text-blue-600">{icon}</div>
      <div className="mt-1 text-xs font-bold text-slate-900">{title}</div>
      <div className="text-[10px] text-slate-500">{text}</div>
    </div>
  );
}

function ConfiguratorSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
          {number}
        </span>
        <h3 className="text-base font-black text-slate-900">{title}</h3>
      </div>
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

/* =========================================================
   PAGE CONTENT
========================================================= */

function CustomerProductDetailContent() {
  const params = useParams();
  const rawId = params?.id;
  const productIdentifier = Array.isArray(rawId) ? rawId[0] || "" : clean(rawId);

  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedImage, setSelectedImage] = useState("");
  const [selectedColour, setSelectedColour] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantities, setQuantities] = useState<QuantityMap>({});

  const [selectedPlacement, setSelectedPlacement] = useState("");
  const [selectedEmbroiderySize, setSelectedEmbroiderySize] = useState("");
  const [instructions, setInstructions] = useState("");
  const [artwork, setArtwork] = useState<ArtworkFile | null>(null);
  const [artworkUploading, setArtworkUploading] = useState(false);
  const [artworkError, setArtworkError] = useState("");
  const [addedMessage, setAddedMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* LOAD PRODUCT */
  useEffect(() => {
    if (!productIdentifier) {
      setError("Product not found.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        let response = await fetch(
          `/api/customer/catalog?slug=${encodeURIComponent(productIdentifier)}`,
          { cache: "no-store" }
        );
        let text = await response.text();
        let data: CatalogResponse | null = null;

        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          throw new Error("The product service returned an invalid response.");
        }

        if (response.ok && data?.success && (!Array.isArray(data.products) || data.products.length === 0)) {
          response = await fetch(
            `/api/customer/catalog?id=${encodeURIComponent(productIdentifier)}`,
            { cache: "no-store" }
          );
          text = await response.text();
          try {
            data = text ? JSON.parse(text) : null;
          } catch {
            throw new Error("The product service returned an invalid response.");
          }
        }

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Unable to load this product.");
        }

        const foundProduct = Array.isArray(data.products) && data.products.length > 0 ? data.products[0] : null;

        if (!foundProduct) {
          throw new Error("This product is not available.");
        }

        if (cancelled) return;

        setProduct(foundProduct);

        const imgs = [
          safeImageUrl(foundProduct.primaryImage),
          ...(foundProduct.additionalImages || []).map((img) => safeImageUrl(img)).filter(Boolean),
        ].filter(Boolean);

        setSelectedImage(imgs[0] || "");
        setSelectedColour(foundProduct.availableColours?.[0] || "");

        const initialQuantities: QuantityMap = {};
        for (const size of foundProduct.availableSizes || []) {
          initialQuantities[size] = 0;
        }
        if (Object.keys(initialQuantities).length === 0) {
          initialQuantities["Quantity"] = 1;
        }
        setQuantities(initialQuantities);

        if (foundProduct.availableSizes?.length > 0) {
          const firstSize = foundProduct.availableSizes[0];
          setSelectedSize(firstSize);
          setQuantities({ [firstSize]: 1 });
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unable to load this product.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProduct();
    return () => {
      cancelled = true;
    };
  }, [productIdentifier]);

  const images = useMemo(() => {
    if (!product) return [];
    const result = [
      safeImageUrl(product.primaryImage),
      ...(product.additionalImages || []).map((img) => safeImageUrl(img)),
    ].filter(Boolean);
    return Array.from(new Set(result));
  }, [product]);

  const totalQuantity = useMemo(() => {
    return Object.values(quantities).reduce((total, qty) => total + qty, 0);
  }, [quantities]);

  const garmentTotal = useMemo(() => {
    if (!product) return 0;
    return product.price.sellingPrice * totalQuantity;
  }, [product, totalQuantity]);

  const estimatedTotal = garmentTotal;

  const hasSale =
    !!product &&
    product.price.originalPrice !== null &&
    product.price.originalPrice > product.price.sellingPrice;

  function changeQuantity(change: number) {
    if (!selectedSize) return;
    setQuantities((current) => {
      const currentValue = current[selectedSize] || 0;
      const nextValue = Math.max(0, currentValue + change);
      return {
        ...Object.fromEntries(Object.keys(current).map((size) => [size, 0])),
        [selectedSize]: nextValue,
      };
    });
  }

  function setQuantity(value: string) {
    if (!selectedSize) return;
    const parsed = Number(value);
    setQuantities((current) => ({
      ...Object.fromEntries(Object.keys(current).map((size) => [size, 0])),
      [selectedSize]: Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0,
    }));
  }

  async function handleArtwork(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setArtworkError("");
    setArtwork(null);

    const allowedExtensions = [".png", ".jpg", ".jpeg", ".svg", ".pdf"];
    const extension = file.name.includes(".") ? `.${file.name.split(".").pop()?.toLowerCase()}` : "";

    if (!allowedExtensions.includes(extension)) {
      setArtworkError("Please upload a PNG, JPG, JPEG, SVG or PDF file.");
      event.target.value = "";
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setArtworkError("Artwork must be 15 MB or smaller.");
      event.target.value = "";
      return;
    }

    try {
      setArtworkUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/customer/artwork", {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error("The artwork service returned an invalid response.");
      }

      if (response.status === 401 || data?.requiresLogin) {
        setArtworkError("Please sign in before uploading artwork.");
        event.target.value = "";
        return;
      }

      if (!response.ok || !data?.success || !data?.artwork?.uploadId) {
        throw new Error(data?.message || "Unable to upload artwork.");
      }

      setArtwork({
        uploadId: String(data.artwork.uploadId),
        name: String(data.artwork.name || file.name),
        storedName: String(data.artwork.storedName || ""),
        size: Number(data.artwork.size ?? file.size),
        type: String(data.artwork.type || file.type || "application/octet-stream"),
      });
    } catch (err) {
      setArtworkError(err instanceof Error ? err.message : "Unable to upload artwork.");
      event.target.value = "";
    } finally {
      setArtworkUploading(false);
    }
  }

  function addToOrder() {
    if (!product) return;
    setAddedMessage("");

    if (product.availableSizes.length === 0) {
      setAddedMessage("Size options are not configured for this product. Please contact us.");
      return;
    }
    if (!selectedSize) {
      setAddedMessage("Please select a size.");
      return;
    }
    if (totalQuantity <= 0) {
      setAddedMessage("Please enter the quantity required.");
      return;
    }
    if (product.availableColours.length > 0 && !selectedColour) {
      setAddedMessage("Please select a colour.");
      return;
    }

    if (product.allowCustomisation) {
      if (!selectedPlacement) {
        setAddedMessage("Please select an embroidery placement.");
        return;
      }
      if (!selectedEmbroiderySize) {
        setAddedMessage("Please select an embroidery size.");
        return;
      }
      if (!artwork?.uploadId) {
        setAddedMessage("Please upload your logo or artwork.");
        return;
      }
    }

    const selectedSizes = [{ size: selectedSize, quantity: totalQuantity }];
    const orderType = product.allowCustomisation ? "CUSTOM_EMBROIDERY" : "READY_EMBROIDERED";

    const cartItem = {
      id: `${product.id}-${Date.now()}`,
      orderType,
      productId: product.id,
      productCode: product.productCode,
      sku: product.sku,
      name: product.name,
      productType: product.productType,
      garmentType: product.garmentType,
      categoryId: product.categoryId,
      categoryName: product.categoryName,
      primaryImage: product.primaryImage,
      colour: selectedColour,
      sizes: selectedSizes,
      totalQuantity,
      allowCustomisation: product.allowCustomisation,
      embroideryPlacement: product.allowCustomisation ? selectedPlacement : "",
      embroiderySize: product.allowCustomisation ? selectedEmbroiderySize : "",
      artwork: product.allowCustomisation && artwork ? artwork : null,
      instructions: product.allowCustomisation ? clean(instructions) : "",
      unitPrice: product.price.sellingPrice,
      gstPercent: product.price.gstPercent,
      estimatedTotal,
      priceMasterSku: product.price.priceMasterSku,
    };

    try {
      const existingRaw = window.localStorage.getItem("embrastic_cart");
      let existing: unknown = [];
      if (existingRaw) {
        try {
          existing = JSON.parse(existingRaw);
        } catch {
          existing = [];
        }
      }
      const cart = Array.isArray(existing) ? existing : [];
      cart.push(cartItem);

      window.localStorage.setItem("embrastic_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("embrastic-cart-updated"));

      setAddedMessage(
        product.allowCustomisation
          ? "Custom embroidery item added to your order."
          : "Ready embroidered item added to your order."
      );
      window.setTimeout(() => setAddedMessage(""), 3000);
    } catch {
      setAddedMessage("Unable to add this item. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-5">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Shirt className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-2xl font-black text-slate-950">Product unavailable</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">{error || "This product could not be found."}</p>
            <Link
              href="/customer/products"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  let stepCount = 0;

  return (
    <main className="min-h-screen bg-white pb-24 text-slate-950 lg:pb-12">
      {/* BREADCRUMB */}
      <div className="border-b border-slate-200">
        <div className="mx-auto max-w-[1450px] px-5 py-4 sm:px-7 lg:px-10">
          <div className="flex items-center gap-2 overflow-hidden text-xs font-semibold text-slate-400">
            <Link href="/customer/products" className="shrink-0 transition hover:text-blue-600">
              Products
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link
              href={`/customer/products?category=${encodeURIComponent(product.categorySlug)}`}
              className="shrink-0 transition hover:text-blue-600"
            >
              {product.categoryName}
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="truncate font-bold text-slate-700">{product.name}</span>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <section className="mx-auto max-w-[1450px] px-5 py-7 sm:px-7 lg:px-10 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] xl:gap-16">
          {/* GALLERY */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="grid gap-3 sm:grid-cols-[76px_minmax(0,1fr)]">
              {images.length > 1 && (
                <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col sm:overflow-visible">
                  {images.map((image, index) => (
                    <button
                      type="button"
                      key={`${image}-${index}`}
                      onClick={() => setSelectedImage(image)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-slate-100 transition sm:h-[76px] sm:w-[76px] ${
                        selectedImage === image ? "border-blue-600" : "border-transparent hover:border-slate-300"
                      }`}
                    >
                      <img src={image} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="order-1 overflow-hidden rounded-[24px] bg-slate-100 sm:order-2">
                <div className="relative aspect-[4/5]">
                  {selectedImage ? (
                    <img src={selectedImage} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <Shirt className="h-16 w-16 text-slate-300" />
                      <div className="mt-4 text-sm font-black text-slate-400">
                        {product.garmentType || product.productType}
                      </div>
                    </div>
                  )}

                  <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
                    {product.badge && (
                      <span className="rounded-full bg-slate-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white">
                        {product.badge}
                      </span>
                    )}
                    {product.newArrival && normalize(product.badge) !== "new" && (
                      <span className="rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white">
                        New Arrival
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200">
              <TrustItem icon={<ShieldCheck className="h-4 w-4" />} title="Approval" text="Before production" />
              <TrustItem icon={<Sparkles className="h-4 w-4" />} title="Embroidery" text="Professional finish" />
              <TrustItem icon={<PackageCheck className="h-4 w-4" />} title="Tracked" text="Order progress" />
            </div>
          </div>

          {/* CONFIGURATION */}
          <div>
            <Link
              href={`/customer/products?category=${encodeURIComponent(product.categorySlug)}`}
              className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-600"
            >
              {product.categoryName}
            </Link>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
              {product.name}
            </h1>

            {product.shortDescription && (
              <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-[15px]">{product.shortDescription}</p>
            )}

            {/* PRICE */}
            <div className="mt-6 border-y border-slate-200 py-5">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-black tracking-tight text-slate-950">
                  {formatMoney(product.price.sellingPrice)}
                </span>
                {hasSale && (
                  <span className="text-base font-bold text-slate-400 line-through">
                    {formatMoney(product.price.originalPrice)}
                  </span>
                )}
                {hasSale && (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase text-red-600">
                    Save {formatMoney(Number(product.price.originalPrice) - product.price.sellingPrice)}
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-400">
                {product.price.gstPercent > 0
                  ? `Customer selling price • ${product.price.gstPercent}% GST configured`
                  : "Customer selling price"}
                {product.price.unit ? ` • per ${product.price.unit}` : ""}
              </div>
            </div>

            {/* OPTION 1: COLOUR */}
            {product.availableColours.length > 0 && (() => {
              stepCount++;
              const stepStr = String(stepCount).padStart(2, "0");
              return (
                <ConfiguratorSection
                  number={stepStr}
                  title="Choose Colour"
                  description={selectedColour ? `Selected: ${selectedColour}` : "Select your preferred garment colour."}
                >
                  <div className="flex flex-wrap gap-2">
                    {product.availableColours.map((colour) => {
                      const selected = selectedColour === colour;
                      return (
                        <button
                          type="button"
                          key={colour}
                          onClick={() => setSelectedColour(colour)}
                          className={`relative rounded-xl border px-4 py-3 text-xs font-black transition ${
                            selected
                              ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/10"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {selected && <Check className="h-3.5 w-3.5" />}
                            {colour}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </ConfiguratorSection>
              );
            })()}

            {/* OPTION 2: SIZE & QUANTITY */}
            {(() => {
              stepCount++;
              const stepStr = String(stepCount).padStart(2, "0");
              return (
                <ConfiguratorSection
                  number={stepStr}
                  title="Choose Size & Quantity"
                  description="Select a size and set the quantity required."
                >
                  {product.availableSizes.length > 0 ? (
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-slate-400">Size</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {product.availableSizes.map((size) => {
                          const selected = selectedSize === size;
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => {
                                setSelectedSize(size);
                                setQuantities((current) => ({
                                  ...Object.fromEntries(Object.keys(current).map((k) => [k, 0])),
                                  [size]: current[size] || 1,
                                }));
                              }}
                              className={`min-w-[54px] rounded-xl border px-4 py-3 text-sm font-black transition ${
                                selected
                                  ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/10"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>

                      {selectedSize && (
                        <div className="mt-6">
                          <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                            Quantity ({selectedSize})
                          </div>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex items-center rounded-xl border border-slate-200 bg-white">
                              <button
                                type="button"
                                onClick={() => changeQuantity(-1)}
                                className="flex h-11 w-11 items-center justify-center text-slate-500 hover:text-slate-900"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={quantities[selectedSize] ?? 0}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="h-11 w-16 text-center text-sm font-black text-slate-950 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => changeQuantity(1)}
                                className="flex h-11 w-11 items-center justify-center text-slate-500 hover:text-slate-900"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <span className="text-xs font-bold text-slate-500">
                              Total: {totalQuantity} item{totalQuantity === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">No size options configured for this item.</div>
                  )}
                </ConfiguratorSection>
              );
            })()}

            {/* OPTION 3: CUSTOM EMBROIDERY & ARTWORK UPLOAD (Conditional on allowCustomisation) */}
            {product.allowCustomisation && (
              <>
                {/* PLACEMENT */}
                {(() => {
                  stepCount++;
                  const stepStr = String(stepCount).padStart(2, "0");
                  return (
                    <ConfiguratorSection
                      number={stepStr}
                      title="Embroidery Placement"
                      description="Where should your logo or text be embroidered?"
                    >
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {EMBROIDERY_PLACEMENTS.map((placement) => {
                          const selected = selectedPlacement === placement.id;
                          return (
                            <button
                              type="button"
                              key={placement.id}
                              onClick={() => setSelectedPlacement(placement.id)}
                              className={`rounded-xl border p-3 text-left transition ${
                                selected
                                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600/10"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <div className="text-xs font-black text-slate-900">{placement.label}</div>
                              <div className="mt-1 text-[11px] text-slate-500">{placement.description}</div>
                            </button>
                          );
                        })}
                      </div>
                    </ConfiguratorSection>
                  );
                })()}

                {/* EMBROIDERY SIZE */}
                {(() => {
                  stepCount++;
                  const stepStr = String(stepCount).padStart(2, "0");
                  return (
                    <ConfiguratorSection
                      number={stepStr}
                      title="Embroidery Size"
                      description="Select the maximum size of your embroidery design."
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        {EMBROIDERY_SIZES.map((eSize) => {
                          const selected = selectedEmbroiderySize === eSize.id;
                          return (
                            <button
                              type="button"
                              key={eSize.id}
                              onClick={() => setSelectedEmbroiderySize(eSize.id)}
                              className={`rounded-xl border p-3 text-left transition ${
                                selected
                                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600/10"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <div className="text-xs font-black text-slate-900">{eSize.label}</div>
                              <div className="mt-1 text-[11px] text-slate-500">{eSize.description}</div>
                            </button>
                          );
                        })}
                      </div>
                    </ConfiguratorSection>
                  );
                })()}

                {/* ARTWORK UPLOAD */}
                {(() => {
                  stepCount++;
                  const stepStr = String(stepCount).padStart(2, "0");
                  return (
                    <ConfiguratorSection
                      number={stepStr}
                      title="Upload Artwork / Logo"
                      description="Upload high resolution files (PNG, JPG, SVG, or PDF up to 15MB)."
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleArtwork}
                        accept=".png,.jpg,.jpeg,.svg,.pdf"
                        className="hidden"
                      />

                      {artwork ? (
                        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <Upload className="h-5 w-5 shrink-0 text-blue-600" />
                            <div className="truncate">
                              <div className="truncate text-xs font-bold text-slate-900">{artwork.name}</div>
                              <div className="text-[11px] text-slate-500">{formatFileSize(artwork.size)}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setArtwork(null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="text-xs font-bold text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={artworkUploading}
                          className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-6 transition hover:border-blue-500 hover:bg-blue-50/30"
                        >
                          {artworkUploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                          ) : (
                            <>
                              <Upload className="h-6 w-6 text-slate-400" />
                              <span className="mt-2 text-xs font-bold text-slate-700">Click to upload artwork</span>
                              <span className="mt-1 text-[10px] text-slate-400">PNG, JPG, SVG, or PDF (Max 15MB)</span>
                            </>
                          )}
                        </button>
                      )}

                      {artworkError && (
                        <p className="mt-2 text-xs font-bold text-red-600">
                          {artworkError}
                        </p>
                      )}

                      <div className="mt-4">
                        <label className="block text-xs font-bold text-slate-700">Special Instructions (Optional)</label>
                        <textarea
                          rows={3}
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                          placeholder="Provide specific thread colours, position details, or sizing notes..."
                          className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                    </ConfiguratorSection>
                  );
                })()}
              </>
            )}

            {/* TOTAL SUMMARY & ADD TO ORDER */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <span className="text-sm font-bold text-slate-600">Garment Total ({totalQuantity} items)</span>
                <span className="text-xl font-black text-slate-950">{formatMoney(estimatedTotal)}</span>
              </div>

              {addedMessage && (
                <div className="mt-4 rounded-xl bg-blue-100 p-3 text-xs font-bold text-blue-900">{addedMessage}</div>
              )}

              <button
                type="button"
                onClick={addToOrder}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.99]"
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Order
              </button>
            </div>

            {/* DESCRIPTION */}
            {product.description && (
              <div className="mt-8 border-t border-slate-200 pt-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Product Details</h3>
                <div className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                  {product.description}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function CustomerProductDetailPage() {
  return (
    <Suspense fallback={null}>
      <CustomerProductDetailContent />
    </Suspense>
  );
}
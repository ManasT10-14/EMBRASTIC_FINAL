"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  ChangeEvent,
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
  {
    id: "left-chest",
    label: "Left Chest",
    description: "Classic logo placement",
  },
  {
    id: "right-chest",
    label: "Right Chest",
    description: "Opposite chest placement",
  },
  {
    id: "left-sleeve",
    label: "Left Sleeve",
    description: "Small sleeve embroidery",
  },
  {
    id: "right-sleeve",
    label: "Right Sleeve",
    description: "Small sleeve embroidery",
  },
  {
    id: "back",
    label: "Back",
    description: "Large back embroidery",
  },
  {
    id: "front-centre",
    label: "Front Centre",
    description: "Central front embroidery",
  },
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

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

/* =========================================================
   PAGE
========================================================= */

export default function CustomerProductDetailPage() {
  const params = useParams();

  const rawId = params?.id;

  const productIdentifier = Array.isArray(rawId)
    ? rawId[0] || ""
    : clean(rawId);

  const [product, setProduct] =
    useState<CatalogProduct | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [selectedImage, setSelectedImage] =
    useState("");

  const [selectedColour, setSelectedColour] =
    useState("");

  const [quantities, setQuantities] =
    useState<QuantityMap>({});

  const [selectedPlacement, setSelectedPlacement] =
    useState("left-chest");

  const [instructions, setInstructions] =
    useState("");

const [artwork, setArtwork] =
  useState<ArtworkFile | null>(null);

const [artworkUploading, setArtworkUploading] =
  useState(false);

const [artworkError, setArtworkError] =
  useState("");

const [addedMessage, setAddedMessage] =
  useState("");

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  /* =====================================================
     LOAD PRODUCT
  ====================================================== */

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

        /*
         * First try the URL value as a slug.
         */

        let response = await fetch(
          `/api/customer/catalog?slug=${encodeURIComponent(
            productIdentifier
          )}`,
          {
            cache: "no-store",
          }
        );

        let text = await response.text();

        let data: CatalogResponse | null = null;

        try {
          data = text
            ? JSON.parse(text)
            : null;
        } catch {
          throw new Error(
            "The product service returned an invalid response."
          );
        }

        /*
         * If no slug matched, try it as an ID.
         */

        if (
          response.ok &&
          data?.success &&
          (!Array.isArray(data.products) ||
            data.products.length === 0)
        ) {
          response = await fetch(
            `/api/customer/catalog?id=${encodeURIComponent(
              productIdentifier
            )}`,
            {
              cache: "no-store",
            }
          );

          text = await response.text();

          try {
            data = text
              ? JSON.parse(text)
              : null;
          } catch {
            throw new Error(
              "The product service returned an invalid response."
            );
          }
        }

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.message ||
              "Unable to load this product."
          );
        }

        const foundProduct =
          Array.isArray(data.products) &&
          data.products.length > 0
            ? data.products[0]
            : null;

        if (!foundProduct) {
          throw new Error(
            "This product is not available."
          );
        }

        if (cancelled) {
          return;
        }

        setProduct(foundProduct);

        const images = [
          safeImageUrl(
            foundProduct.primaryImage
          ),
          ...(foundProduct.additionalImages || [])
            .map((image) =>
              safeImageUrl(image)
            )
            .filter(Boolean),
        ].filter(Boolean);

        setSelectedImage(
          images[0] || ""
        );

        setSelectedColour(
          foundProduct.availableColours?.[0] ||
            ""
        );

        const initialQuantities: QuantityMap =
          {};

        for (const size of
          foundProduct.availableSizes || []) {
          initialQuantities[size] = 0;
        }

        /*
         * Products without size variants still need
         * a quantity control.
         */

        if (
          Object.keys(initialQuantities)
            .length === 0
        ) {
          initialQuantities["Quantity"] = 1;
        }

        setQuantities(initialQuantities);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Product detail load error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load this product."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      cancelled = true;
    };
  }, [productIdentifier]);

  /* =====================================================
     IMAGES
  ====================================================== */

  const images = useMemo(() => {
    if (!product) {
      return [];
    }

    const result = [
      safeImageUrl(product.primaryImage),

      ...(product.additionalImages || []).map(
        (image) => safeImageUrl(image)
      ),
    ].filter(Boolean);

    return Array.from(new Set(result));
  }, [product]);

  /* =====================================================
     TOTAL QUANTITY
  ====================================================== */

  const totalQuantity = useMemo(() => {
    return Object.values(
      quantities
    ).reduce(
      (total, quantity) =>
        total + quantity,
      0
    );
  }, [quantities]);

  /* =====================================================
     GARMENT TOTAL

     This is the linked Price Master selling price × qty.

     Embroidery/service pricing will be connected in the
     next pricing step rather than hard-coding fake charges.
  ====================================================== */

  const garmentTotal = useMemo(() => {
    if (!product) {
      return 0;
    }

    return (
      product.price.sellingPrice *
      totalQuantity
    );
  }, [product, totalQuantity]);

  /* =====================================================
     GST INFORMATION

     IMPORTANT:
     Our current catalogue displays the Price Master
     selling price as the customer-facing item price.

     We do not add GST again here because that could
     double-charge GST depending on how your Price Master
     selling price is configured.
  ====================================================== */

  const estimatedTotal = garmentTotal;

  /* =====================================================
     SALE
  ====================================================== */

  const hasSale =
    !!product &&
    product.price.originalPrice !== null &&
    product.price.originalPrice >
      product.price.sellingPrice;

  /* =====================================================
     QUANTITY
  ====================================================== */

  function changeQuantity(
    size: string,
    change: number
  ) {
    setQuantities((current) => {
      const currentValue =
        current[size] || 0;

      const nextValue = Math.max(
        0,
        currentValue + change
      );

      return {
        ...current,
        [size]: nextValue,
      };
    });
  }

  function setQuantity(
    size: string,
    value: string
  ) {
    const parsed = Number(value);

    setQuantities((current) => ({
      ...current,
      [size]:
        Number.isFinite(parsed) &&
        parsed >= 0
          ? Math.floor(parsed)
          : 0,
    }));
  }

  /* =====================================================
     ARTWORK
  ====================================================== */

  
 async function handleArtwork(
  event: ChangeEvent<HTMLInputElement>
) {
  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  setArtworkError("");
  setArtwork(null);

  /*
   * Keep client validation friendly, but the API
   * performs the authoritative validation.
   */
  const allowedExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".svg",
    ".pdf",
  ];

  const extension =
    file.name.includes(".")
      ? `.${file.name
          .split(".")
          .pop()
          ?.toLowerCase()}`
      : "";

  if (
    !allowedExtensions.includes(extension)
  ) {
    setArtworkError(
      "Please upload a PNG, JPG, JPEG, SVG or PDF file."
    );

    event.target.value = "";
    return;
  }

  if (
    file.size >
    15 * 1024 * 1024
  ) {
    setArtworkError(
      "Artwork must be 15 MB or smaller."
    );

    event.target.value = "";
    return;
  }

  try {
    setArtworkUploading(true);

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    const response =
      await fetch(
        "/api/customer/artwork",
        {
          method: "POST",
          body: formData,
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
        "The artwork service returned an invalid response."
      );
    }

    if (
      response.status === 401 ||
      data?.requiresLogin
    ) {
      /*
       * We don't navigate automatically here because doing
       * so would lose the selected browser File.
       *
       * The customer can sign in and then select the file
       * again.
       */
      setArtworkError(
        "Please sign in before uploading artwork."
      );

      event.target.value = "";
      return;
    }

    if (
      !response.ok ||
      !data?.success ||
      !data?.artwork?.uploadId
    ) {
      throw new Error(
        data?.message ||
          "Unable to upload artwork."
      );
    }

    setArtwork({
      uploadId:
        String(
          data.artwork.uploadId
        ),

      name:
        String(
          data.artwork.name ||
            file.name
        ),

      storedName:
        String(
          data.artwork.storedName ||
            ""
        ),

      size:
        Number(
          data.artwork.size ??
            file.size
        ),

      type:
        String(
          data.artwork.type ||
            file.type ||
            "application/octet-stream"
        ),
    });
  } catch (err) {
    console.error(
      "Artwork upload error:",
      err
    );

    setArtworkError(
      err instanceof Error
        ? err.message
        : "Unable to upload artwork."
    );

    event.target.value = "";
  } finally {
    setArtworkUploading(false);
  }
}
  /* =====================================================
     ADD TO ORDER

     For now this creates a local cart entry so the
     configuration survives navigation.

     Checkout will later convert these into real Orders.
  ====================================================== */

  function addToOrder() {
    if (!product) {
      return;
    }

    if (totalQuantity <= 0) {
      setAddedMessage(
        "Please select at least one item."
      );

      return;
    }
if (
  product.allowCustomisation &&
  !artwork?.uploadId
) {
  setAddedMessage(
    "Please upload your logo or artwork before adding this customised product to your order."
  );

  return;
}

    const selectedSizes =
      Object.entries(quantities)
        .filter(
          ([, quantity]) =>
            quantity > 0
        )
        .map(
          ([size, quantity]) => ({
            size:
              size === "Quantity"
                ? ""
                : size,
            quantity,
          })
        );

    const cartItem = {
      id: `${product.id}-${Date.now()}`,

      productId: product.id,
      productCode: product.productCode,
      sku: product.sku,

      name: product.name,

      categoryId: product.categoryId,
      categoryName:
        product.categoryName,

      primaryImage:
        product.primaryImage,

      colour: selectedColour,

      sizes: selectedSizes,

      totalQuantity,

      allowCustomisation:
        product.allowCustomisation,

      embroideryPlacement:
        product.allowCustomisation
          ? selectedPlacement
          : "",

artwork: artwork
  ? {
      uploadId:
        artwork.uploadId,

      name:
        artwork.name,

      storedName:
        artwork.storedName,

      size:
        artwork.size,

      type:
        artwork.type,
    }
  : null,

      instructions: clean(
        instructions
      ),

      unitPrice:
        product.price.sellingPrice,

      gstPercent:
        product.price.gstPercent,

      estimatedTotal,

      priceMasterSku:
        product.price.priceMasterSku,
    };

    try {
      const existingRaw =
        window.localStorage.getItem(
          "embrastic_cart"
        );

      let existing: unknown = [];

      if (existingRaw) {
        try {
          existing =
            JSON.parse(existingRaw);
        } catch {
          existing = [];
        }
      }

      const cart = Array.isArray(
        existing
      )
        ? existing
        : [];

      cart.push(cartItem);

      window.localStorage.setItem(
        "embrastic_cart",
        JSON.stringify(cart)
      );

      window.dispatchEvent(
        new Event(
          "embrastic-cart-updated"
        )
      );

      setAddedMessage(
        "Added to your order."
      );

      window.setTimeout(() => {
        setAddedMessage("");
      }, 3000);
    } catch {
      setAddedMessage(
        "Unable to add this item. Please try again."
      );
    }
  }

  /* =====================================================
     LOADING
  ====================================================== */

  if (loading) {
    return <ProductLoading />;
  }

  /* =====================================================
     ERROR
  ====================================================== */

  if (error || !product) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-5">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Shirt className="h-7 w-7" />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-950">
              Product unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {error ||
                "This product could not be found."}
            </p>

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

  /* =====================================================
     PAGE
  ====================================================== */

  return (
    <main className="min-h-screen bg-white pb-24 text-slate-950 lg:pb-0">
      {/* =================================================
          BREADCRUMB
      ================================================== */}

      <div className="border-b border-slate-200">
        <div className="mx-auto max-w-[1450px] px-5 py-4 sm:px-7 lg:px-10">
          <div className="flex items-center gap-2 overflow-hidden text-xs font-semibold text-slate-400">
            <Link
              href="/customer/products"
              className="shrink-0 transition hover:text-blue-600"
            >
              Products
            </Link>

            <ChevronRight className="h-3 w-3 shrink-0" />

            <Link
              href={`/customer/products?category=${encodeURIComponent(
                product.categorySlug
              )}`}
              className="shrink-0 transition hover:text-blue-600"
            >
              {product.categoryName}
            </Link>

            <ChevronRight className="h-3 w-3 shrink-0" />

            <span className="truncate font-bold text-slate-700">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      {/* =================================================
          PRODUCT
      ================================================== */}

      <section>
        <div className="mx-auto max-w-[1450px] px-5 py-7 sm:px-7 lg:px-10 lg:py-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] xl:gap-16">
            {/* =============================================
                GALLERY
            ============================================== */}

            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="grid gap-3 sm:grid-cols-[76px_minmax(0,1fr)]">
                {/* THUMBNAILS */}

                {images.length > 1 && (
                  <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col sm:overflow-visible">
                    {images.map(
                      (image, index) => (
                        <button
                          type="button"
                          key={`${image}-${index}`}
                          onClick={() =>
                            setSelectedImage(
                              image
                            )
                          }
                          className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-slate-100 transition sm:h-[76px] sm:w-[76px] ${
                            selectedImage ===
                            image
                              ? "border-blue-600"
                              : "border-transparent hover:border-slate-300"
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${product.name} ${
                              index + 1
                            }`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      )
                    )}
                  </div>
                )}

                {/* MAIN IMAGE */}

                <div className="order-1 overflow-hidden rounded-[24px] bg-slate-100 sm:order-2">
                  <div className="relative aspect-[4/5]">
                    {selectedImage ? (
                      <img
                        src={selectedImage}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        <Shirt className="h-16 w-16 text-slate-300" />

                        <div className="mt-4 text-sm font-black text-slate-400">
                          {product.garmentType ||
                            product.productType}
                        </div>
                      </div>
                    )}

                    {/* BADGES */}

                    <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
                      {product.badge && (
                        <span className="rounded-full bg-slate-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white">
                          {product.badge}
                        </span>
                      )}

                      {product.newArrival &&
                        normalize(
                          product.badge
                        ) !== "new" && (
                          <span className="rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white">
                            New Arrival
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* TRUST STRIP */}

              <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200">
                <TrustItem
                  icon={
                    <ShieldCheck className="h-4 w-4" />
                  }
                  title="Approval"
                  text="Before production"
                />

                <TrustItem
                  icon={
                    <Sparkles className="h-4 w-4" />
                  }
                  title="Embroidery"
                  text="Professional finish"
                />

                <TrustItem
                  icon={
                    <PackageCheck className="h-4 w-4" />
                  }
                  title="Tracked"
                  text="Order progress"
                />
              </div>
            </div>

            {/* =============================================
                CONFIGURATION
            ============================================== */}

            <div>
              {/* CATEGORY */}

              <Link
                href={`/customer/products?category=${encodeURIComponent(
                  product.categorySlug
                )}`}
                className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-600"
              >
                {product.categoryName}
              </Link>

              {/* TITLE */}

              <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
                {product.name}
              </h1>

              {/* SHORT DESCRIPTION */}

              {product.shortDescription && (
                <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-[15px]">
                  {product.shortDescription}
                </p>
              )}

              {/* PRICE */}

              <div className="mt-6 border-y border-slate-200 py-5">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-3xl font-black tracking-tight text-slate-950">
                    {formatMoney(
                      product.price
                        .sellingPrice
                    )}
                  </span>

                  {hasSale && (
                    <span className="text-base font-bold text-slate-400 line-through">
                      {formatMoney(
                        product.price
                          .originalPrice
                      )}
                    </span>
                  )}

                  {hasSale && (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase text-red-600">
                      Save{" "}
                      {formatMoney(
                        Number(
                          product.price
                            .originalPrice
                        ) -
                          product.price
                            .sellingPrice
                      )}
                    </span>
                  )}
                </div>

                <div className="mt-2 text-xs font-semibold text-slate-400">
                  {product.price.gstPercent >
                  0
                    ? `Customer selling price • ${product.price.gstPercent}% GST configured`
                    : "Customer selling price"}
                  {product.price.unit
                    ? ` • per ${product.price.unit}`
                    : ""}
                </div>
              </div>

              {/* ===========================================
                  COLOUR
              ============================================ */}

              {product.availableColours
                .length > 0 && (
                <ConfiguratorSection
                  number="01"
                  title="Choose Colour"
                  description={
                    selectedColour
                      ? `Selected: ${selectedColour}`
                      : "Select your preferred garment colour."
                  }
                >
                  <div className="flex flex-wrap gap-2">
                    {product.availableColours.map(
                      (colour) => {
                        const selected =
                          selectedColour ===
                          colour;

                        return (
                          <button
                            type="button"
                            key={colour}
                            onClick={() =>
                              setSelectedColour(
                                colour
                              )
                            }
                            className={`relative rounded-xl border px-4 py-3 text-xs font-black transition ${
                              selected
                                ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/10"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {selected && (
                                <Check className="h-3.5 w-3.5" />
                              )}

                              {colour}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </ConfiguratorSection>
              )}

              {/* ===========================================
                  SIZE + QUANTITY
              ============================================ */}

              <ConfiguratorSection
                number={
                  product.availableColours
                    .length > 0
                    ? "02"
                    : "01"
                }
                title={
                  product.availableSizes
                    .length > 0
                    ? "Select Sizes & Quantities"
                    : "Choose Quantity"
                }
                description="Enter how many garments you need."
              >
                {product.availableSizes
                  .length > 0 ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="grid grid-cols-[1fr_160px] border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <div>Size</div>
                      <div className="text-center">
                        Quantity
                      </div>
                    </div>

                    {product.availableSizes.map(
                      (size) => (
                        <div
                          key={size}
                          className="grid grid-cols-[1fr_160px] items-center border-b border-slate-100 px-4 py-3 last:border-b-0"
                        >
                          <div className="text-sm font-black text-slate-800">
                            {size}
                          </div>

                          <QuantityControl
                            value={
                              quantities[
                                size
                              ] || 0
                            }
                            decrease={() =>
                              changeQuantity(
                                size,
                                -1
                              )
                            }
                            increase={() =>
                              changeQuantity(
                                size,
                                1
                              )
                            }
                            setValue={(
                              value
                            ) =>
                              setQuantity(
                                size,
                                value
                              )
                            }
                          />
                        </div>
                      )
                    )}

                    <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                      <span className="text-xs font-black text-slate-500">
                        Total Quantity
                      </span>

                      <span className="text-lg font-black text-slate-950">
                        {totalQuantity}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[220px]">
                    <QuantityControl
                      value={
                        quantities[
                          "Quantity"
                        ] || 0
                      }
                      decrease={() =>
                        changeQuantity(
                          "Quantity",
                          -1
                        )
                      }
                      increase={() =>
                        changeQuantity(
                          "Quantity",
                          1
                        )
                      }
                      setValue={(value) =>
                        setQuantity(
                          "Quantity",
                          value
                        )
                      }
                    />
                  </div>
                )}
              </ConfiguratorSection>

              {/* ===========================================
                  CUSTOMISATION
              ============================================ */}

              {product.allowCustomisation && (
                <>
                  <ConfiguratorSection
                    number={
                      product.availableColours
                        .length > 0
                        ? "03"
                        : "02"
                    }
                    title="Embroidery Placement"
                    description="Choose where you'd like your logo or artwork embroidered."
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      {EMBROIDERY_PLACEMENTS.map(
                        (placement) => {
                          const selected =
                            selectedPlacement ===
                            placement.id;

                          return (
                            <button
                              type="button"
                              key={
                                placement.id
                              }
                              onClick={() =>
                                setSelectedPlacement(
                                  placement.id
                                )
                              }
                              className={`rounded-xl border p-4 text-left transition ${
                                selected
                                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600/10"
                                  : "border-slate-200 bg-white hover:border-slate-400"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div
                                    className={`text-sm font-black ${
                                      selected
                                        ? "text-blue-700"
                                        : "text-slate-800"
                                    }`}
                                  >
                                    {
                                      placement.label
                                    }
                                  </div>

                                  <div className="mt-1 text-[11px] text-slate-400">
                                    {
                                      placement.description
                                    }
                                  </div>
                                </div>

                                <div
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                    selected
                                      ? "border-blue-600 bg-blue-600 text-white"
                                      : "border-slate-300"
                                  }`}
                                >
                                  {selected && (
                                    <Check className="h-3 w-3" />
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </ConfiguratorSection>

                  {/* ARTWORK */}

                  <ConfiguratorSection
                    number={
                      product.availableColours
                        .length > 0
                        ? "04"
                        : "03"
                    }
                    title="Upload Your Logo / Artwork"
                    description="Upload the artwork you'd like us to embroider."
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf,.svg"
                      onChange={
                        handleArtwork
                      }
                      className="hidden"
                    />

                    {artworkUploading ? (
  <div className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 px-5 py-8 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>

    <div className="mt-3 text-sm font-black text-slate-800">
      Uploading artwork...
    </div>

    <div className="mt-1 text-xs text-slate-400">
      Please keep this page open.
    </div>
  </div>
) : !artwork ? (
                      <button
                        type="button"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                        className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center transition hover:border-blue-300 hover:bg-blue-50/40"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                          <Upload className="h-5 w-5" />
                        </div>

                        <div className="mt-3 text-sm font-black text-slate-800">
                          Upload logo or artwork
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          PNG, JPG, SVG or PDF
                        </div>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600">
                            <Check className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-sm font-black text-slate-800">
                              {artwork.name}
                            </div>

                            <div className="mt-0.5 text-[11px] text-slate-500">
                              {formatFileSize(
                                artwork.size
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setArtwork(
                              null
                            );

                            if (
                              fileInputRef.current
                            ) {
                              fileInputRef.current.value =
                                "";
                            }
                          }}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500"
                          title="Remove artwork"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    <div className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">
                      Your artwork will be reviewed
                      and converted into an embroidery
                      design. You'll approve the
                      design before production.
                    </div>
                  </ConfiguratorSection>

                  {/* INSTRUCTIONS */}

                  <ConfiguratorSection
                    number={
                      product.availableColours
                        .length > 0
                        ? "05"
                        : "04"
                    }
                    title="Additional Requirements"
                    description="Anything else we should know?"
                  >
                    <textarea
                      rows={4}
                      value={instructions}
                      onChange={(event) =>
                        setInstructions(
                          event.target.value
                        )
                      }
                      placeholder="Example: Please use white thread for the logo, approximately 8 cm wide..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </ConfiguratorSection>
                </>
              )}
{artworkError && (
  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-red-700">
    {artworkError}

    {artworkError
      .toLowerCase()
      .includes("sign in") && (
      <div className="mt-2">
        <Link
          href={`/customer/login?next=${encodeURIComponent(
            `/customer/products/${productIdentifier}`
          )}`}
          className="font-black underline underline-offset-2"
        >
          Sign in to upload artwork
        </Link>
      </div>
    )}
  </div>
)}

              {/* ===========================================
                  ORDER SUMMARY
              ============================================ */}

              <div className="mt-8 rounded-[22px] border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-slate-950">
                    Estimated Order
                  </h2>

                  <span className="text-xs font-bold text-slate-400">
                    {totalQuantity}{" "}
                    {totalQuantity === 1
                      ? "item"
                      : "items"}
                  </span>
                </div>

                <div className="mt-5 space-y-3 border-b border-slate-200 pb-5">
                  <SummaryRow
                    label="Garment price"
                    value={`${formatMoney(
                      product.price
                        .sellingPrice
                    )} × ${totalQuantity}`}
                  />

                  {selectedColour && (
                    <SummaryRow
                      label="Colour"
                      value={
                        selectedColour
                      }
                    />
                  )}

                  {product.allowCustomisation && (
                    <SummaryRow
                      label="Embroidery"
                      value={
                        EMBROIDERY_PLACEMENTS.find(
                          (placement) =>
                            placement.id ===
                            selectedPlacement
                        )?.label ||
                        "Selected"
                      }
                    />
                  )}

                  {product.allowCustomisation && (
                    <SummaryRow
                      label="Artwork"
                      value={
                        artwork
                          ? artwork.name
                           : "Required before ordering"
                      }
                    />
                  )}
                </div>

                <div className="flex items-end justify-between gap-4 pt-5">
                  <div>
                    <div className="text-xs font-bold text-slate-400">
                      Estimated product total
                    </div>

                    <div className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                      {formatMoney(
                        estimatedTotal
                      )}
                    </div>
                  </div>

                  {product.price.gstPercent >
                    0 && (
                    <div className="text-right text-[10px] leading-4 text-slate-400">
                      GST configured at
                      <br />
                      {
                        product.price
                          .gstPercent
                      }
                      %
                    </div>
                  )}
                </div>

                {product.allowCustomisation && (
                  <div className="mt-4 rounded-xl bg-white px-4 py-3 text-[11px] leading-5 text-slate-500">
                    Embroidery/digitizing charges are
                    not being guessed here. Those will
                    be calculated from your Price
                    Master when we connect service
                    pricing.
                  </div>
                )}

                {addedMessage && (
                  <div
                    className={`mt-4 rounded-xl px-4 py-3 text-xs font-bold ${
                      addedMessage ===
                      "Added to your order."
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {addedMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addToOrder}
                 disabled={
  totalQuantity <= 0 ||
  artworkUploading ||
  (product.allowCustomisation &&
    !artwork?.uploadId)
}
                  
                  className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {artworkUploading ? (
  <>
    <Loader2 className="h-4 w-4 animate-spin" />
    Uploading Artwork...
  </>
) : (
  <>
    <ShoppingBag className="h-4 w-4" />
    Add to Order
  </>
)}
                </button>

                <Link
                  href="/customer/cart"
                  className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 transition hover:border-slate-400"
                >
                  View My Order
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* ===========================================
                  FULL DESCRIPTION
              ============================================ */}

              {product.description && (
                <div className="mt-8 border-t border-slate-200 pt-7">
                  <h2 className="text-base font-black text-slate-950">
                    Product Details
                  </h2>

                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-500">
                    {product.description}
                  </p>
                </div>
              )}

              {/* PRODUCT META */}

              <div className="mt-7 border-t border-slate-200 pt-5 text-[11px] leading-6 text-slate-400">
                {product.sku && (
                  <div>
                    SKU:{" "}
                    <span className="font-bold text-slate-600">
                      {product.sku}
                    </span>
                  </div>
                )}

                {product.garmentType && (
                  <div>
                    Garment:{" "}
                    <span className="font-bold text-slate-600">
                      {product.garmentType}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          MOBILE STICKY ADD
      ================================================== */}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold text-slate-400">
              {totalQuantity}{" "}
              {totalQuantity === 1
                ? "item"
                : "items"}
            </div>

            <div className="text-lg font-black text-slate-950">
              {formatMoney(
                estimatedTotal
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={addToOrder}
disabled={
  totalQuantity <= 0 ||
  artworkUploading ||
  (product.allowCustomisation &&
    !artwork?.uploadId)
}
           
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-black text-white disabled:bg-slate-300"
          >
            <ShoppingBag className="h-4 w-4" />
            {artworkUploading ? (
  <>
    <Loader2 className="h-4 w-4 animate-spin" />
    Uploading Artwork...
  </>
) : (
  <>
    <ShoppingBag className="h-4 w-4" />
    Add to Order
  </>
)}
          </button>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   CONFIGURATOR SECTION
========================================================= */

function ConfiguratorSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-slate-200 py-7">
      <div className="flex gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-black text-white">
          {number}
        </div>

        <div>
          <h2 className="text-base font-black text-slate-950">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   QUANTITY CONTROL
========================================================= */

function QuantityControl({
  value,
  decrease,
  increase,
  setValue,
}: {
  value: number;
  decrease: () => void;
  increase: () => void;
  setValue: (value: string) => void;
}) {
  return (
    <div className="flex h-10 items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={decrease}
        disabled={value <= 0}
        className="flex h-full w-10 items-center justify-center text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) =>
          setValue(event.target.value)
        }
        className="h-full min-w-0 flex-1 border-x border-slate-200 text-center text-sm font-black text-slate-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={increase}
        className="flex h-full w-10 items-center justify-center text-slate-500 transition hover:bg-slate-50"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs">
      <span className="text-slate-400">
        {label}
      </span>

      <span className="max-w-[65%] text-right font-black text-slate-700">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   TRUST ITEM
========================================================= */

function TrustItem({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="px-2 py-4 text-center">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </div>

      <div className="mt-2 text-[10px] font-black text-slate-700">
        {title}
      </div>

      <div className="mt-0.5 hidden text-[9px] text-slate-400 sm:block">
        {text}
      </div>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function ProductLoading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1450px] px-5 py-10 sm:px-7 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-[4/5] animate-pulse rounded-[24px] bg-slate-100" />

          <div className="flex min-h-[500px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

              <div className="mt-4 text-sm font-black text-slate-500">
                Preparing your product...
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
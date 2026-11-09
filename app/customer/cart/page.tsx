"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type CartSize = {
  size: string;
  quantity: number;
};

type CartArtwork = {
  uploadId?: string;
  name: string;
  storedName?: string;
  size: number;
  type: string;
};

type CartItem = {
  id: string;

  orderType?: "READY_EMBROIDERED" | "CUSTOM_EMBROIDERY";

  productId: string;
  productCode: string;
  sku: string;

  name: string;

  categoryId: string;
  categoryName: string;

  primaryImage: string;

  colour: string;

  sizes: CartSize[];

  totalQuantity: number;

  allowCustomisation: boolean;

  embroideryPlacement: string;
  embroiderySize?: string;

  artwork: CartArtwork | null;

  instructions: string;

  unitPrice: number;

  gstPercent: number;

  estimatedTotal: number;

  priceMasterSku: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const CART_KEY = "embrastic_cart";

const PLACEMENT_LABELS: Record<
  string,
  string
> = {
  "left-chest": "Left Chest",
  "right-chest": "Right Chest",
  "left-sleeve": "Left Sleeve",
  "right-sleeve": "Right Sleeve",
  back: "Back",
  "front-centre": "Front Centre",
};

const EMBROIDERY_SIZE_LABELS: Record<
  string,
  string
> = {
  small: 'Small — up to 3"',
  medium: 'Medium — up to 5"',
  large: 'Large — up to 8"',
  "extra-large": 'Extra Large — above 8"',
};

/* =========================================================
   HELPERS
========================================================= */

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function numberValue(value: unknown) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function formatMoney(value: unknown) {
  const amount = numberValue(value);

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

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes)) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(
      bytes / 1024
    )} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function calculateQuantity(
  sizes: CartSize[]
) {
  return sizes.reduce(
    (total, item) =>
      total +
      Math.max(
        0,
        numberValue(item.quantity)
      ),
    0
  );
}

function isCustomEmbroidery(item: CartItem) {
  if (item.orderType) {
    return item.orderType === "CUSTOM_EMBROIDERY";
  }

  return !!item.allowCustomisation;
}

function getOrderTypeLabel(item: CartItem) {
  return isCustomEmbroidery(item)
    ? "Custom Embroidery"
    : "Ready Embroidered";
}

/* =========================================================
   PAGE
========================================================= */

export default function CustomerCartPage() {
  const [cart, setCart] = useState<
    CartItem[]
  >([]);

  const [loaded, setLoaded] =
    useState(false);

  const [expandedItems, setExpandedItems] =
    useState<Record<string, boolean>>(
      {}
    );

  /* =====================================================
     LOAD CART
  ====================================================== */

  useEffect(() => {
    try {
      const raw =
        window.localStorage.getItem(
          CART_KEY
        );

      if (!raw) {
        setCart([]);
        setLoaded(true);
        return;
      }

      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        setCart([]);
        setLoaded(true);
        return;
      }

      const validItems =
        parsed.filter(
          (
            item
          ): item is CartItem =>
            !!item &&
            typeof item ===
              "object" &&
            !!clean(item.id) &&
            !!clean(item.productId)
        );

      setCart(validItems);
    } catch {
      setCart([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  /* =====================================================
     SAVE CART
  ====================================================== */

  function saveCart(
    nextCart: CartItem[]
  ) {
    setCart(nextCart);

    try {
      window.localStorage.setItem(
        CART_KEY,
        JSON.stringify(nextCart)
      );

      window.dispatchEvent(
        new Event(
          "embrastic-cart-updated"
        )
      );
    } catch {
      // UI state still updates even if
      // localStorage is unavailable.
    }
  }

  /* =====================================================
     CALCULATIONS
  ====================================================== */

  const totalQuantity = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        calculateQuantity(
          item.sizes || []
        ),
      0
    );
  }, [cart]);

  const merchandiseTotal =
    useMemo(() => {
      return cart.reduce(
        (total, item) => {
          const quantity =
            calculateQuantity(
              item.sizes || []
            );

          return (
            total +
            numberValue(
              item.unitPrice
            ) *
              quantity
          );
        },
        0
      );
    }, [cart]);

  /*
   * IMPORTANT:
   *
   * We are not adding a separate GST amount yet.
   * Your current storefront uses the Price Master
   * sellingPrice as the customer-facing price.
   *
   * Until we define whether sellingPrice is
   * GST-inclusive or GST-exclusive, adding GST here
   * could charge it twice.
   */

  const estimatedTotal =
    merchandiseTotal;

  /* =====================================================
     UPDATE SIZE QUANTITY
  ====================================================== */

  function updateSizeQuantity(
    cartItemId: string,
    sizeIndex: number,
    change: number
  ) {
    const nextCart = cart
      .map((item) => {
        if (
          item.id !== cartItemId
        ) {
          return item;
        }

        const nextSizes = [
          ...(item.sizes || []),
        ];

        const target =
          nextSizes[sizeIndex];

        if (!target) {
          return item;
        }

        nextSizes[sizeIndex] = {
          ...target,
          quantity: Math.max(
            0,
            numberValue(
              target.quantity
            ) + change
          ),
        };

        const nextQuantity =
          calculateQuantity(
            nextSizes
          );

        return {
          ...item,
          sizes: nextSizes,
          totalQuantity:
            nextQuantity,
          estimatedTotal:
            numberValue(
              item.unitPrice
            ) * nextQuantity,
        };
      })
      .filter(
        (item) =>
          calculateQuantity(
            item.sizes || []
          ) > 0
      );

    saveCart(nextCart);
  }

  /* =====================================================
     REMOVE ITEM
  ====================================================== */

  function removeItem(id: string) {
    const nextCart =
      cart.filter(
        (item) => item.id !== id
      );

    saveCart(nextCart);
  }

  /* =====================================================
     CLEAR CART
  ====================================================== */

  function clearCart() {
    const confirmed =
      window.confirm(
        "Remove all items from your order?"
      );

    if (!confirmed) {
      return;
    }

    saveCart([]);
  }

  /* =====================================================
     EXPAND / COLLAPSE
  ====================================================== */

  function toggleExpanded(
    id: string
  ) {
    setExpandedItems(
      (current) => ({
        ...current,
        [id]: !current[id],
      })
    );
  }

  /* =====================================================
     LOADING
  ====================================================== */

  if (!loaded) {
    return <CartLoading />;
  }

  /* =====================================================
     EMPTY CART
  ====================================================== */

  if (cart.length === 0) {
    return <EmptyCart />;
  }

  /* =====================================================
     PAGE
  ====================================================== */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {/* =================================================
          HEADER
      ================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
          <Link
            href="/customer/products"
            className="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Continue Shopping
          </Link>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-600">
                Your EMBRASTIC Order
              </div>

              <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
                Review your order
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Check your garments,
                quantities and embroidery
                requirements before
                checkout.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 px-4 py-2.5">
                <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Total Quantity
                </div>

                <div className="mt-0.5 text-lg font-black text-slate-950">
                  {totalQuantity}
                </div>
              </div>

              <button
                type="button"
                onClick={clearCart}
                className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          CONTENT
      ================================================== */}

      <section>
        <div className="mx-auto max-w-[1400px] px-5 py-7 sm:px-7 lg:px-10 lg:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
            {/* =============================================
                CART ITEMS
            ============================================== */}

            <div className="space-y-4">
              {cart.map(
                (item, index) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    itemNumber={
                      index + 1
                    }
                    expanded={
                      !!expandedItems[
                        item.id
                      ]
                    }
                    toggleExpanded={() =>
                      toggleExpanded(
                        item.id
                      )
                    }
                    updateQuantity={(
                      sizeIndex,
                      change
                    ) =>
                      updateSizeQuantity(
                        item.id,
                        sizeIndex,
                        change
                      )
                    }
                    remove={() =>
                      removeItem(
                        item.id
                      )
                    }
                  />
                )
              )}

              {/* ADD MORE */}

              <Link
                href="/customer/products"
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white px-5 py-5 text-sm font-black text-slate-500 transition hover:border-blue-300 hover:bg-blue-50/30 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Another Product
              </Link>
            </div>

            {/* =============================================
                SUMMARY
            ============================================== */}

            <aside>
              <div className="lg:sticky lg:top-24">
                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                        <ShoppingBag className="h-4 w-4" />
                      </div>

                      <div>
                        <h2 className="text-base font-black text-slate-950">
                          Order Summary
                        </h2>

                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {cart.length}{" "}
                          {cart.length ===
                          1
                            ? "configured product"
                            : "configured products"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-5 sm:px-6">
                    <div className="space-y-4">
                      <SummaryRow
                        label="Products"
                        value={`${cart.length}`}
                      />

                      <SummaryRow
                        label="Total quantity"
                        value={`${totalQuantity}`}
                      />

                      <SummaryRow
                        label="Product subtotal"
                        value={formatMoney(
                          merchandiseTotal
                        )}
                      />

                      <SummaryRow
                        label="Embroidery / digitizing"
                        value="Calculated next"
                        muted
                      />
                    </div>

                    <div className="my-5 border-t border-slate-200" />

                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-slate-400">
                          Estimated total
                        </div>

                        <div className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                          {formatMoney(
                            estimatedTotal
                          )}
                        </div>
                      </div>

                      <div className="text-right text-[10px] leading-4 text-slate-400">
                        Product pricing
                        <br />
                        from Price Master
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-[11px] leading-5 text-blue-700">
                      Embroidery and
                      digitizing charges are
                      not being guessed. We
                      will connect these to
                      your Price Master so the
                      final amount is based on
                      your actual business
                      pricing.
                    </div>

                    <Link
                      href="/customer/checkout"
                      className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
                    >
                      Continue to Checkout
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/customer/products"
                      className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-600 transition hover:border-slate-400"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Continue Shopping
                    </Link>
                  </div>
                </div>

                {/* TRUST */}

                <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-white">
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
                    title="Quality"
                    text="Embroidery checked"
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
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   CART ITEM
========================================================= */

function CartItemCard({
  item,
  itemNumber,
  expanded,
  toggleExpanded,
  updateQuantity,
  remove,
}: {
  item: CartItem;
  itemNumber: number;
  expanded: boolean;
  toggleExpanded: () => void;
  updateQuantity: (
    sizeIndex: number,
    change: number
  ) => void;
  remove: () => void;
}) {
  const image = safeImageUrl(
    item.primaryImage
  );

  const totalQuantity =
    calculateQuantity(
      item.sizes || []
    );

  const itemTotal =
    numberValue(item.unitPrice) *
    totalQuantity;

  const productHref =
    `/customer/products/${encodeURIComponent(
      item.productId
    )}`;

  const placement =
    PLACEMENT_LABELS[
      clean(
        item.embroideryPlacement
      )
    ] ||
    clean(
      item.embroideryPlacement
    );

  const customEmbroidery =
    isCustomEmbroidery(item);

  const embroiderySize =
    EMBROIDERY_SIZE_LABELS[
      clean(item.embroiderySize)
    ] ||
    clean(item.embroiderySize);

  const orderTypeLabel =
    getOrderTypeLabel(item);

  return (
    <article className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
      <div className="p-4 sm:p-5">
        <div className="flex gap-4 sm:gap-5">
          {/* IMAGE */}

          <Link
            href={productHref}
            className="h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-36 sm:w-30"
          >
            {image ? (
              <img
                src={image}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Shirt className="h-8 w-8 text-slate-300" />
              </div>
            )}
          </Link>

          {/* INFO */}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">
                  Item {itemNumber}
                  {item.categoryName
                    ? ` • ${item.categoryName}`
                    : ""}
                </div>

                <Link
                  href={productHref}
                >
                  <h2 className="mt-1.5 text-base font-black leading-6 text-slate-950 transition hover:text-blue-600 sm:text-lg">
                    {item.name}
                  </h2>
                </Link>

                {item.sku && (
                  <div className="mt-1 text-[10px] font-semibold text-slate-400">
                    SKU: {item.sku}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={remove}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                title="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* QUICK CONFIG */}

            <div className="mt-3 flex flex-wrap gap-2">
              {item.colour && (
                <MiniTag
                  label="Colour"
                  value={item.colour}
                />
              )}

              {customEmbroidery &&
                placement && (
                  <MiniTag
                    label="Placement"
                    value={placement}
                  />
                )}

              {customEmbroidery &&
                embroiderySize && (
                  <MiniTag
                    label="Embroidery size"
                    value={embroiderySize}
                  />
                )}

              <MiniTag
                label="Quantity"
                value={`${totalQuantity}`}
              />
            </div>

            {/* PRICE */}

            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold text-slate-400">
                  {formatMoney(
                    item.unitPrice
                  )}{" "}
                  each
                </div>

                <div className="mt-0.5 text-lg font-black text-slate-950">
                  {formatMoney(
                    itemTotal
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={
                  toggleExpanded
                }
                className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-600 transition hover:bg-slate-200"
              >
                {expanded
                  ? "Hide details"
                  : "Edit quantities"}

                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          EXPANDED CONFIGURATION
      ================================================== */}

      {expanded && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-5 sm:px-5">
          <div className="grid gap-6 md:grid-cols-2">
            {/* SIZE QUANTITIES */}

            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                Sizes & Quantities
              </div>

              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {(item.sizes || []).map(
                  (
                    size,
                    sizeIndex
                  ) => (
                    <div
                      key={`${item.id}-${sizeIndex}`}
                      className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 last:border-b-0"
                    >
                      <div className="text-xs font-black text-slate-700">
                        {size.size ||
                          "Quantity"}
                      </div>

                      <div className="flex h-9 items-center overflow-hidden rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              sizeIndex,
                              -1
                            )
                          }
                          disabled={
                            size.quantity <=
                            0
                          }
                          className="flex h-full w-9 items-center justify-center text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
                        >
                          <Minus className="h-3 w-3" />
                        </button>

                        <div className="flex h-full w-11 items-center justify-center border-x border-slate-200 text-xs font-black text-slate-900">
                          {
                            size.quantity
                          }
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              sizeIndex,
                              1
                            )
                          }
                          className="flex h-full w-9 items-center justify-center text-slate-500 transition hover:bg-slate-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* CUSTOMISATION DETAILS */}

            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                Customisation
              </div>

              <div className="mt-3 space-y-2">
                <DetailRow
                  label="Order type"
                  value={orderTypeLabel}
                />

                {item.colour && (
                  <DetailRow
                    label="Colour"
                    value={
                      item.colour
                    }
                  />
                )}

                {customEmbroidery &&
                  placement && (
                    <DetailRow
                      label="Placement"
                      value={placement}
                    />
                  )}

                {customEmbroidery &&
                  embroiderySize && (
                    <DetailRow
                      label="Embroidery size"
                      value={embroiderySize}
                    />
                  )}

                {item.artwork && (
                  <DetailRow
                    label="Artwork"
                    value={`${item.artwork.name}${
                      item.artwork
                        .size
                        ? ` • ${formatFileSize(
                            item.artwork
                              .size
                          )}`
                        : ""
                    }`}
                  />
                )}

                {customEmbroidery &&
                  !item.artwork && (
                    <DetailRow
                      label="Artwork"
                      value="Not uploaded yet"
                    />
                  )}

                {item.instructions && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Requirements
                    </div>

                    <div className="mt-1.5 whitespace-pre-line text-xs leading-5 text-slate-600">
                      {
                        item.instructions
                      }
                    </div>
                  </div>
                )}
              </div>

              <Link
                href={productHref}
                className="mt-3 inline-flex items-center gap-2 text-[11px] font-black text-blue-600 transition hover:text-blue-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reconfigure product
              </Link>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

/* =========================================================
   SMALL TAG
========================================================= */

function MiniTag({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-100 px-2.5 py-1.5">
      <span className="text-[9px] font-bold text-slate-400">
        {label}
      </span>

      <span className="ml-1.5 text-[10px] font-black text-slate-700">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <span className="text-[10px] font-semibold text-slate-400">
        {label}
      </span>

      <span className="max-w-[65%] text-right text-[11px] font-black text-slate-700">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="text-slate-500">
        {label}
      </span>

      <span
        className={`text-right font-black ${
          muted
            ? "text-slate-400"
            : "text-slate-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   TRUST
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
   EMPTY CART
========================================================= */

function EmptyCart() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-[75vh] max-w-5xl items-center justify-center px-5">
        <div className="max-w-lg text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
            <ShoppingBag className="h-8 w-8" />
          </div>

          <div className="mt-6 text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
            Your Order
          </div>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
            Your order is empty
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
            Browse the EMBRASTIC
            collection, choose your
            garments and configure the
            embroidery you need.
          </p>

          <Link
            href="/customer/products"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white transition hover:bg-blue-700"
          >
            Explore Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   LOADING
========================================================= */

function CartLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-7 lg:px-10">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200" />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-[22px] bg-white" />

            <div className="h-48 animate-pulse rounded-[22px] bg-white" />
          </div>

          <div className="h-96 animate-pulse rounded-[24px] bg-white" />
        </div>
      </div>
    </main>
  );
}
"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

/* =========================================================
   TYPES
========================================================= */

type SizeQuantity = {
  size?: string;
  quantity?: number;
};

type Artwork = {
  name?: string;
  size?: number;
  type?: string;
} | null;

type OrderItem = {
  id?: string;
  productId?: string;
  productCode?: string;
  sku?: string;
  productName?: string;
  categoryId?: string;
  categoryName?: string;
  productType?: string;
  garmentType?: string;
  colour?: string;
  sizes?: SizeQuantity[];
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  gstPercent?: number;
  lineSubtotal?: number;
  allowCustomisation?: boolean;
  embroideryPlacement?: string;
  artwork?: Artwork;
  instructions?: string;
  priceMasterId?: string;
  priceMasterSku?: string;
};

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPoNumber: string;
  orderDate: string;
  deliveryDate: string;
  priority: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  shippingAddress: string;
  status: string;
  totalQuantity: number;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  success?: boolean;
  requiresLogin?: boolean;
  message?: string;
  order?: Order;
};

/* =========================================================
   TRACKING STEPS
========================================================= */

const TRACKING_STEPS = [
  {
    key: "received",
    title: "Order Received",
    description:
      "Your order has been received by EMBRASTIC.",
  },
  {
    key: "artwork",
    title: "Artwork & Design",
    description:
      "Artwork, digitizing and embroidery requirements are reviewed.",
  },
  {
    key: "production",
    title: "Production",
    description:
      "Your garments and embroidery are in production.",
  },
  {
    key: "quality",
    title: "Quality Check",
    description:
      "Finished work is inspected before dispatch.",
  },
  {
    key: "dispatch",
    title: "Dispatch",
    description:
      "Your completed order is prepared and sent for delivery.",
  },
  {
    key: "delivered",
    title: "Delivered",
    description:
      "Your order has been delivered.",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function money(value: unknown) {
  const amount = Number(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(
    Number.isFinite(amount) ? amount : 0
  );
}

function formatDate(value: string) {
  if (!value) {
    return "Not specified";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/* =========================================================
   STATUS HELPERS
========================================================= */

function getCurrentStep(statusValue: string) {
  const status = clean(statusValue).toLowerCase();

  if (
    status.includes("deliver") ||
    status.includes("complete")
  ) {
    return 5;
  }

  if (
    status.includes("dispatch") ||
    status.includes("ship")
  ) {
    return 4;
  }

  if (
    status.includes("quality") ||
    status.includes("qc")
  ) {
    return 3;
  }

  if (
    status.includes("production") ||
    status.includes("stitch") ||
    status.includes("embroider")
  ) {
    return 2;
  }

  if (
    status.includes("artwork") ||
    status.includes("design") ||
    status.includes("digit") ||
    status.includes("approval")
  ) {
    return 1;
  }

  return 0;
}

function getStatusStyle(statusValue: string) {
  const status = clean(statusValue).toLowerCase();

  if (
    status.includes("deliver") ||
    status.includes("complete")
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status.includes("cancel")) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    status.includes("dispatch") ||
    status.includes("ship")
  ) {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (
    status.includes("production") ||
    status.includes("stitch")
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    status.includes("quality") ||
    status.includes("qc")
  ) {
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

/* =========================================================
   MAIN PAGE
========================================================= */

function CustomerOrderDetailContent() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id;

  const orderId = Array.isArray(rawId)
    ? rawId[0]
    : clean(rawId);

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =====================================================
     LOAD ORDER
  ====================================================== */

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadOrder() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/customer/orders/${encodeURIComponent(
            orderId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const text = await response.text();

        let data: ApiResponse | null = null;

        try {
          data = text
            ? JSON.parse(text)
            : null;
        } catch {
          throw new Error(
            "The order service returned an invalid response."
          );
        }

        if (
          response.status === 401 ||
          data?.requiresLogin
        ) {
          router.replace(
            `/customer/login?next=${encodeURIComponent(
              `/customer/orders/${orderId}`
            )}`
          );

          return;
        }

        if (
          !response.ok ||
          !data?.success ||
          !data.order
        ) {
          throw new Error(
            data?.message ||
              "Unable to load this order."
          );
        }

        if (!cancelled) {
          setOrder(data.order);
        }
      } catch (err) {
        console.error(
          "Customer order detail error:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load this order."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  /* =====================================================
     LOADING
  ====================================================== */

  if (loading) {
    return <OrderLoading />;
  }

  /* =====================================================
     ERROR
  ====================================================== */

  if (error || !order) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-xl font-black text-red-600">
              !
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-950">
              Unable to load order
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
              {error ||
                "This order could not be found."}
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/customer/orders"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-700"
              >
                My Orders
              </Link>

              <Link
                href="/customer/products"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     VALUES
  ====================================================== */

  const currentStep = getCurrentStep(
    order.status
  );

  const items = Array.isArray(order.items)
    ? order.items
    : [];

  const cancelled =
    clean(order.status)
      .toLowerCase()
      .includes("cancel");

  /* =====================================================
     PAGE
  ====================================================== */

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HERO */}

      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <Link
                href="/customer/orders"
                className="text-sm font-bold text-slate-400 transition hover:text-white"
              >
                ← My Orders
              </Link>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-blue-300">
                  Customer Order
                </div>

                <div
                  className={`rounded-full border px-3 py-1.5 text-xs font-extrabold ${getStatusStyle(
                    order.status
                  )}`}
                >
                  {order.status ||
                    "Pending Review"}
                </div>
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                {order.orderNumber}
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Placed{" "}
                {formatDate(order.orderDate)}

                {order.customerPoNumber
                  ? ` • PO ${order.customerPoNumber}`
                  : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/customer/products"
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/10"
              >
                Continue Shopping
              </Link>

              <Link
                href="/customer/orders"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-500"
              >
                All Orders
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* CANCELLED MESSAGE */}

        {cancelled && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="text-sm font-black text-red-800">
              This order has been cancelled.
            </div>

            <p className="mt-1 text-sm leading-6 text-red-700">
              Please contact EMBRASTIC if you
              need more information about this
              order.
            </p>
          </div>
        )}

        {/* TRACKING */}

        {!cancelled && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-600">
                  Order Progress
                </div>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Track your order
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Follow your order from receipt
                  through artwork, production,
                  quality control and dispatch.
                </p>
              </div>

              {order.updatedAt && (
                <div className="text-xs font-medium text-slate-400">
                  Last updated{" "}
                  {formatDateTime(
                    order.updatedAt
                  )}
                </div>
              )}
            </div>

            <div className="mt-8">
              <div className="grid gap-0 lg:grid-cols-6">
                {TRACKING_STEPS.map(
                  (step, index) => {
                    const completed =
                      index < currentStep;

                    const current =
                      index === currentStep;

                    return (
                      <div
                        key={step.key}
                        className="relative"
                      >
                        {/* DESKTOP LINE */}

                        {index <
                          TRACKING_STEPS.length -
                            1 && (
                          <div
                            className={`absolute left-5 top-5 hidden h-0.5 w-[calc(100%-1rem)] lg:block ${
                              index <
                              currentStep
                                ? "bg-blue-600"
                                : "bg-slate-200"
                            }`}
                          />
                        )}

                        {/* MOBILE LINE */}

                        {index <
                          TRACKING_STEPS.length -
                            1 && (
                          <div
                            className={`absolute left-[19px] top-10 h-[calc(100%-1rem)] w-0.5 lg:hidden ${
                              index <
                              currentStep
                                ? "bg-blue-600"
                                : "bg-slate-200"
                            }`}
                          />
                        )}

                        <div className="relative flex gap-4 pb-7 lg:block lg:pb-0">
                          <div
                            className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black ${
                              completed
                                ? "border-blue-600 bg-blue-600 text-white"
                                : current
                                  ? "border-blue-600 bg-white text-blue-600 ring-4 ring-blue-50"
                                  : "border-slate-200 bg-white text-slate-400"
                            }`}
                          >
                            {completed
                              ? "✓"
                              : index + 1}
                          </div>

                          <div className="lg:mt-4 lg:pr-5">
                            <div
                              className={`text-sm font-extrabold ${
                                completed ||
                                current
                                  ? "text-slate-950"
                                  : "text-slate-400"
                              }`}
                            >
                              {step.title}
                            </div>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {step.description}
                            </p>

                            {current && (
                              <div className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">
                                Current
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </section>
        )}

        {/* SUMMARY */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Order Date"
            value={formatDate(
              order.orderDate
            )}
          />

          <SummaryCard
            label="Requested Delivery"
            value={formatDate(
              order.deliveryDate
            )}
          />

          <SummaryCard
            label="Total Quantity"
            value={`${order.totalQuantity} ${
              order.totalQuantity === 1
                ? "piece"
                : "pieces"
            }`}
          />

          <SummaryCard
            label="Order Total"
            value={money(
              order.totalAmount
            )}
            strong
          />
        </div>

        {/* MAIN GRID */}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            {/* ITEMS */}

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-lg font-black text-slate-950">
                  Order Items
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {items.length}{" "}
                  {items.length === 1
                    ? "product"
                    : "products"}{" "}
                  in this order
                </p>
              </div>

              {items.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No item details are
                  available for this order.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {items.map(
                    (item, index) => (
                      <OrderItemCard
                        key={
                          item.id ||
                          `${item.productId}-${index}`
                        }
                        item={item}
                      />
                    )
                  )}
                </div>
              )}
            </section>

            {/* DELIVERY DETAILS */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">
                Delivery Details
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Detail
                  label="Contact Person"
                  value={
                    order.contactPerson
                  }
                />

                <Detail
                  label="Phone"
                  value={
                    order.contactPhone
                  }
                />

                <Detail
                  label="Email"
                  value={
                    order.contactEmail
                  }
                />

                <Detail
                  label="Requested Delivery"
                  value={formatDate(
                    order.deliveryDate
                  )}
                />

                <div className="sm:col-span-2">
                  <Detail
                    label="Shipping Address"
                    value={
                      order.shippingAddress
                    }
                  />
                </div>
              </div>
            </section>
          </div>

          {/* SIDEBAR */}

          <aside className="space-y-6">
            {/* ORDER SUMMARY */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">
                Order Summary
              </h2>

              <div className="mt-5 space-y-3">
                <AmountRow
                  label="Merchandise"
                  value={money(
                    order.subtotal
                  )}
                />

                {order.gstAmount > 0 && (
                  <AmountRow
                    label="GST"
                    value={money(
                      order.gstAmount
                    )}
                  />
                )}

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="text-sm font-extrabold text-slate-950">
                        Order Total
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {order.totalQuantity}{" "}
                        {order.totalQuantity ===
                        1
                          ? "piece"
                          : "pieces"}
                      </div>
                    </div>

                    <div className="text-xl font-black text-slate-950">
                      {money(
                        order.totalAmount
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs leading-5 text-slate-500">
                  Final production,
                  embroidery, digitizing or
                  tax adjustments, if
                  applicable, will be
                  confirmed by EMBRASTIC
                  before invoicing.
                </p>
              </div>
            </section>

            {/* REFERENCE */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">
                Order Reference
              </h2>

              <div className="mt-5 space-y-5">
                <Detail
                  label="Order Number"
                  value={
                    order.orderNumber
                  }
                />

                <Detail
                  label="Customer PO"
                  value={
                    order.customerPoNumber ||
                    "Not provided"
                  }
                />

                <Detail
                  label="Priority"
                  value={
                    order.priority ||
                    "Normal"
                  }
                />

                <Detail
                  label="Status"
                  value={
                    order.status ||
                    "Pending Review"
                  }
                />
              </div>
            </section>

            {/* HELP */}

            <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
              <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-300">
                Need help?
              </div>

              <h2 className="mt-2 text-lg font-black">
                Questions about this
                order?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Keep your order number{" "}
                <strong className="text-white">
                  {order.orderNumber}
                </strong>{" "}
                handy when contacting
                EMBRASTIC.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function CustomerOrderDetailPage() {
  return (
    <Suspense fallback={<OrderLoading />}>
      <CustomerOrderDetailContent />
    </Suspense>
  );
}

/* =========================================================
   ORDER ITEM CARD
========================================================= */

function OrderItemCard({
  item,
}: {
  item: OrderItem;
}) {
  const sizes = Array.isArray(
    item.sizes
  )
    ? item.sizes.filter(
        (size) =>
          Number(size.quantity) > 0
      )
    : [];

  const quantity =
    Number(item.quantity) ||
    sizes.reduce(
      (total, size) =>
        total +
        Number(
          size.quantity || 0
        ),
      0
    );

  return (
    <div className="p-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row">
        {/* PRODUCT DETAILS */}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {item.categoryName && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                {item.categoryName}
              </span>
            )}

            {item.productCode && (
              <span className="text-xs font-bold text-slate-400">
                {item.productCode}
              </span>
            )}
          </div>

          <h3 className="mt-3 text-lg font-black text-slate-950">
            {item.productName ||
              "Product"}
          </h3>

          {item.sku && (
            <div className="mt-1 text-xs font-medium text-slate-400">
              SKU: {item.sku}
            </div>
          )}

          {/* OPTIONS */}

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {item.colour && (
              <div>
                <span className="font-bold text-slate-500">
                  Colour:
                </span>{" "}
                <span className="font-extrabold text-slate-800">
                  {item.colour}
                </span>
              </div>
            )}

            {item.embroideryPlacement && (
              <div>
                <span className="font-bold text-slate-500">
                  Placement:
                </span>{" "}
                <span className="font-extrabold text-slate-800">
                  {
                    item.embroideryPlacement
                  }
                </span>
              </div>
            )}
          </div>

          {/* SIZES */}

          {sizes.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
                Size Breakdown
              </div>

              <div className="flex flex-wrap gap-2">
                {sizes.map(
                  (size, index) => (
                    <div
                      key={`${size.size}-${index}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    >
                      <span className="font-extrabold text-slate-800">
                        {size.size ||
                          "Size"}
                      </span>

                      <span className="mx-1.5 text-slate-300">
                        ×
                      </span>

                      <span className="font-black text-blue-600">
                        {
                          size.quantity
                        }
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* EMBROIDERY */}

          {item.embroideryPlacement && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
                Customisation
              </div>

              <div className="mt-2 text-sm font-extrabold text-slate-800">
                Embroidery —{" "}
                {item.embroideryPlacement}
              </div>
            </div>
          )}

          {/* ARTWORK */}

          {item.artwork?.name && (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-blue-600">
                Artwork Reference
              </div>

              <div className="mt-1 break-all text-sm font-bold text-blue-950">
                {item.artwork.name}
              </div>

              {item.artwork.type && (
                <div className="mt-1 text-xs text-blue-700">
                  {item.artwork.type}
                </div>
              )}

              <p className="mt-2 text-xs leading-5 text-blue-700">
                Artwork information was
                submitted with this order.
              </p>
            </div>
          )}

          {/* INSTRUCTIONS */}

          {item.instructions && (
            <div className="mt-5">
              <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
                Instructions
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {item.instructions}
              </p>
            </div>
          )}
        </div>

        {/* PRICE */}

        <div className="shrink-0 border-t border-slate-100 pt-4 sm:min-w-40 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0 sm:text-right">
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Quantity
          </div>

          <div className="mt-1 text-lg font-black text-slate-950">
            {quantity}
          </div>

          <div className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Unit Price
          </div>

          <div className="mt-1 text-sm font-extrabold text-slate-800">
            {money(
              item.unitPrice
            )}
          </div>

          {Number(item.gstPercent) >
            0 && (
            <div className="mt-1 text-[11px] font-medium text-slate-400">
              GST{" "}
              {Number(
                item.gstPercent
              )}
              %
            </div>
          )}

          <div className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Line Total
          </div>

          <div className="mt-1 text-lg font-black text-blue-600">
            {money(
              item.lineSubtotal
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>

      <div
        className={`mt-2 font-black ${
          strong
            ? "text-xl text-blue-600"
            : "text-lg text-slate-950"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   DETAIL
========================================================= */

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>

      <div className="mt-1.5 whitespace-pre-wrap break-words text-sm font-bold leading-6 text-slate-800">
        {value ||
          "Not provided"}
      </div>
    </div>
  );
}

/* =========================================================
   AMOUNT ROW
========================================================= */

function AmountRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="font-medium text-slate-500">
        {label}
      </span>

      <span className="font-extrabold text-slate-800">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function OrderLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* HERO SKELETON */}

      <div className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />

          <div className="mt-6 h-7 w-32 animate-pulse rounded-full bg-slate-800" />

          <div className="mt-4 h-10 w-56 animate-pulse rounded-xl bg-slate-800" />

          <div className="mt-3 h-5 w-44 animate-pulse rounded bg-slate-800" />
        </div>
      </div>

      {/* CONTENT SKELETON */}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-white" />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            )
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-96 animate-pulse rounded-3xl border border-slate-200 bg-white" />

          <div className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white" />
        </div>
      </div>
    </main>
  );
}
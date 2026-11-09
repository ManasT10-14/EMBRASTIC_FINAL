"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type SizeQuantity = { size?: string; quantity?: number };

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

const TRACKING_STEPS = [
  { key: "received", title: "Order Received", short: "Received" },
  { key: "artwork", title: "Artwork & Design", short: "Design" },
  { key: "production", title: "Production", short: "Production" },
  { key: "quality", title: "Quality Check", short: "Quality" },
  { key: "dispatch", title: "Dispatch", short: "Dispatch" },
  { key: "delivered", title: "Delivered", short: "Delivered" },
];

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function money(value: unknown) {
  const amount = Number(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value: string) {
  if (!value) return "Not specified";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getCurrentStep(statusValue: string) {
  const status = clean(statusValue).toLowerCase();
  if (status.includes("deliver") || status.includes("complete")) return 5;
  if (status.includes("dispatch") || status.includes("ship")) return 4;
  if (status.includes("quality") || status.includes("qc")) return 3;
  if (
    status.includes("production") ||
    status.includes("stitch") ||
    status.includes("embroider")
  )
    return 2;
  if (
    status.includes("artwork") ||
    status.includes("design") ||
    status.includes("digit") ||
    status.includes("approval")
  )
    return 1;
  return 0;
}

function getStatusStyle(statusValue: string) {
  const status = clean(statusValue).toLowerCase();
  if (status.includes("deliver") || status.includes("complete"))
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status.includes("cancel"))
    return "border-red-200 bg-red-50 text-red-700";
  if (status.includes("dispatch") || status.includes("ship"))
    return "border-violet-200 bg-violet-50 text-violet-700";
  if (status.includes("production") || status.includes("stitch"))
    return "border-amber-200 bg-amber-50 text-amber-700";
  if (status.includes("quality") || status.includes("qc"))
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function CustomerOrderDetailContent() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const orderId = Array.isArray(rawId) ? rawId[0] : clean(rawId);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          `/api/customer/orders/${encodeURIComponent(orderId)}`,
          { method: "GET", cache: "no-store" }
        );

        const text = await response.text();
        let data: ApiResponse | null = null;

        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          throw new Error("The order service returned an invalid response.");
        }

        if (response.status === 401 || data?.requiresLogin) {
          router.replace(
            `/customer/login?next=${encodeURIComponent(
              `/customer/orders/${orderId}`
            )}`
          );
          return;
        }

        if (!response.ok || !data?.success || !data.order) {
          throw new Error(data?.message || "Unable to load this order.");
        }

        if (!cancelled) setOrder(data.order);
      } catch (err) {
        console.error("Customer order detail error:", err);
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load this order."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrder();
    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  if (loading) return <OrderLoading />;

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#f6f8fc]">
        <div className="mx-auto max-w-3xl px-5 py-20 sm:px-7">
          <div className="rounded-[28px] border border-red-100 bg-white p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl font-black text-red-600">
              !
            </div>
            <h1 className="mt-5 text-2xl font-black text-slate-950">
              Unable to load order
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
              {error || "This order could not be found."}
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/customer/orders"
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-600"
              >
                Back to My Orders
              </Link>
              <Link
                href="/customer/products"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const currentStep = getCurrentStep(order.status);
  const items = Array.isArray(order.items) ? order.items : [];
  const cancelled = clean(order.status).toLowerCase().includes("cancel");

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-blue-50 blur-3xl" />
        <div className="relative mx-auto max-w-[1380px] px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
          <Link
            href="/customer/orders"
            className="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-blue-600"
          >
            <span>←</span> Back to My Orders
          </Link>

          <div className="mt-7 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                  Customer Order
                </span>
                <span
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ${getStatusStyle(
                    order.status
                  )}`}
                >
                  {order.status || "Pending Review"}
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">
                {order.orderNumber}
              </h1>
              <p className="mt-3 text-sm font-medium text-slate-500">
                Placed {formatDate(order.orderDate)}
                {order.customerPoNumber ? `  •  PO ${order.customerPoNumber}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/customer/products"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
              >
                + New Order
              </Link>
              <Link
                href="/customer/orders"
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-blue-600"
              >
                All Orders
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1380px] px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
        {cancelled && (
          <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5">
            <div className="font-black text-red-900">This order has been cancelled.</div>
            <p className="mt-1 text-sm leading-6 text-red-700">
              Please contact EMBRASTIC if you need more information about this order.
            </p>
          </div>
        )}

        {!cancelled && (
          <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.05)] sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.17em] text-blue-600">
                  Order Journey
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Track your order
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  From confirmation to delivery, see exactly where your order stands.
                </p>
              </div>
              {order.updatedAt && (
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-500">
                  Updated {formatDateTime(order.updatedAt)}
                </div>
              )}
            </div>

            <div className="mt-8 grid gap-0 lg:grid-cols-6">
              {TRACKING_STEPS.map((step, index) => {
                const completed = index < currentStep;
                const current = index === currentStep;

                return (
                  <div key={step.key} className="relative">
                    {index < TRACKING_STEPS.length - 1 && (
                      <>
                        <div
                          className={`absolute left-5 top-5 hidden h-[3px] w-[calc(100%-1rem)] lg:block ${
                            index < currentStep ? "bg-blue-600" : "bg-slate-100"
                          }`}
                        />
                        <div
                          className={`absolute left-[19px] top-10 h-[calc(100%-1rem)] w-[3px] lg:hidden ${
                            index < currentStep ? "bg-blue-600" : "bg-slate-100"
                          }`}
                        />
                      </>
                    )}

                    <div className="relative flex gap-4 pb-7 lg:block lg:pb-0">
                      <div
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black ${
                          completed
                            ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-100"
                            : current
                              ? "border-blue-600 bg-white text-blue-600 ring-4 ring-blue-50"
                              : "border-slate-200 bg-white text-slate-400"
                        }`}
                      >
                        {completed ? "✓" : index + 1}
                      </div>

                      <div className="lg:mt-4 lg:pr-4">
                        <div
                          className={`text-sm font-black ${
                            completed || current ? "text-slate-950" : "text-slate-400"
                          }`}
                        >
                          {step.title}
                        </div>
                        <div className="mt-1 text-xs font-medium text-slate-400">
                          {current ? "Current stage" : completed ? "Completed" : "Upcoming"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={<CalendarIcon />} label="Order Date" value={formatDate(order.orderDate)} />
          <SummaryCard icon={<TruckIcon />} label="Requested Delivery" value={formatDate(order.deliveryDate)} />
          <SummaryCard icon={<BoxIcon />} label="Total Quantity" value={`${order.totalQuantity} ${order.totalQuantity === 1 ? "piece" : "pieces"}`} />
          <SummaryCard icon={<WalletIcon />} label="Order Total" value={money(order.totalAmount)} strong />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-7">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Order Items</h2>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {items.length} {items.length === 1 ? "product" : "products"} in this order
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <BoxIcon />
                </div>
              </div>

              {items.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  No item details are available for this order.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {items.map((item, index) => (
                    <OrderItemCard
                      key={item.id || `${item.productId}-${index}`}
                      item={item}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.05)] sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <TruckIcon />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-950">Delivery Details</h2>
                  <p className="text-xs font-medium text-slate-500">Where this order is going</p>
                </div>
              </div>

              <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <Detail label="Contact Person" value={order.contactPerson} />
                <Detail label="Phone" value={order.contactPhone} />
                <Detail label="Email" value={order.contactEmail} />
                <Detail label="Requested Delivery" value={formatDate(order.deliveryDate)} />
                <div className="sm:col-span-2 rounded-2xl bg-slate-50 p-4">
                  <Detail label="Shipping Address" value={order.shippingAddress} />
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[28px] bg-slate-950 p-6 text-white shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">
                Order Summary
              </div>
              <div className="mt-5 space-y-3">
                <AmountRow label="Merchandise" value={money(order.subtotal)} />
                {order.gstAmount > 0 && <AmountRow label="GST" value={money(order.gstAmount)} />}
              </div>
              <div className="my-5 h-px bg-white/10" />
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-sm font-black">Order Total</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {order.totalQuantity} {order.totalQuantity === 1 ? "piece" : "pieces"}
                  </div>
                </div>
                <div className="text-2xl font-black tracking-tight text-white">
                  {money(order.totalAmount)}
                </div>
              </div>
              <div className="mt-5 rounded-2xl bg-white/5 p-4 text-xs leading-5 text-slate-400">
                Final production, embroidery, digitizing or tax adjustments, if applicable,
                will be confirmed by EMBRASTIC before invoicing.
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Order Reference
              </div>
              <div className="mt-5 space-y-5">
                <Detail label="Order Number" value={order.orderNumber} />
                <Detail label="Customer PO" value={order.customerPoNumber || "Not provided"} />
                <Detail label="Priority" value={order.priority || "Normal"} />
                <Detail label="Status" value={order.status || "Pending Review"} />
              </div>
            </section>

            <section className="rounded-[28px] border border-blue-100 bg-blue-50 p-6">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                Need help?
              </div>
              <h2 className="mt-2 text-lg font-black text-slate-950">
                Questions about this order?
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Keep order number <strong className="text-slate-950">{order.orderNumber}</strong>{" "}
                handy when contacting EMBRASTIC.
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

function OrderItemCard({ item }: { item: OrderItem }) {
  const sizes = Array.isArray(item.sizes)
    ? item.sizes.filter((size) => Number(size.quantity) > 0)
    : [];

  const quantity =
    Number(item.quantity) ||
    sizes.reduce((total, size) => total + Number(size.quantity || 0), 0);

  return (
    <div className="p-6 sm:p-7">
      <div className="flex flex-col gap-6 md:flex-row md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {item.categoryName && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">
                {item.categoryName}
              </span>
            )}
            {item.productCode && (
              <span className="text-xs font-bold text-slate-400">{item.productCode}</span>
            )}
          </div>

          <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">
            {item.productName || "Product"}
          </h3>
          {item.sku && <div className="mt-1 text-xs font-medium text-slate-400">SKU: {item.sku}</div>}

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {item.colour && <InlineFact label="Colour" value={item.colour} />}
            {item.embroideryPlacement && <InlineFact label="Placement" value={item.embroideryPlacement} />}
          </div>

          {sizes.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                Size Breakdown
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size, index) => (
                  <div
                    key={`${size.size}-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  >
                    <span className="font-black text-slate-800">{size.size || "Size"}</span>
                    <span className="mx-2 text-slate-300">×</span>
                    <span className="font-black text-blue-600">{size.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {item.embroideryPlacement && (
            <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-500">
                Customisation
              </div>
              <div className="mt-1.5 text-sm font-black text-indigo-950">
                Embroidery — {item.embroideryPlacement}
              </div>
            </div>
          )}

          {item.artwork?.name && (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                Artwork Reference
              </div>
              <div className="mt-1.5 break-all text-sm font-black text-blue-950">
                {item.artwork.name}
              </div>
              {item.artwork.type && (
                <div className="mt-1 text-xs font-medium text-blue-700">{item.artwork.type}</div>
              )}
            </div>
          )}

          {item.instructions && (
            <div className="mt-5">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                Instructions
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {item.instructions}
              </p>
            </div>
          )}
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-3 border-t border-slate-100 pt-5 md:min-w-[190px] md:grid-cols-1 md:border-l md:border-t-0 md:pl-6 md:pt-0 md:text-right">
          <PriceFact label="Quantity" value={String(quantity)} />
          <PriceFact label="Unit Price" value={money(item.unitPrice)} />
          <PriceFact label="Line Total" value={money(item.lineSubtotal)} strong />
        </div>
      </div>
    </div>
  );
}

function InlineFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-bold text-slate-400">{label}: </span>
      <span className="font-black text-slate-800">{value}</span>
    </div>
  );
}

function PriceFact({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className={`mt-1 font-black ${strong ? "text-lg text-blue-600" : "text-sm text-slate-900"}`}>
        {value}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  strong = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</div>
          <div className={`mt-2 font-black tracking-tight ${strong ? "text-xl text-blue-600" : "text-lg text-slate-950"}`}>
            {value}
          </div>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</div>
      <div className="mt-1.5 whitespace-pre-wrap break-words text-sm font-bold leading-6 text-slate-800">
        {value || "Not provided"}
      </div>
    </div>
  );
}

function AmountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="font-medium text-slate-400">{label}</span>
      <span className="font-black text-white">{value}</span>
    </div>
  );
}

function OrderLoading() {
  return (
    <main className="min-h-screen bg-[#f6f8fc]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1380px] px-5 py-10 sm:px-7 lg:px-10">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
          <div className="mt-7 h-7 w-36 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-4 h-12 w-64 animate-pulse rounded-xl bg-slate-100" />
          <div className="mt-3 h-5 w-48 animate-pulse rounded bg-slate-100" />
        </div>
      </section>
      <div className="mx-auto max-w-[1380px] px-5 py-8 sm:px-7 lg:px-10">
        <div className="h-64 animate-pulse rounded-[28px] bg-white" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-3xl bg-white" />
          ))}
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
          <div className="h-96 animate-pulse rounded-[28px] bg-white" />
          <div className="h-80 animate-pulse rounded-[28px] bg-white" />
        </div>
      </div>
    </main>
  );
}

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M6 3v3M18 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"/></svg>;
}
function TruckIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>;
}
function BoxIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/></svg>;
}
function WalletIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H18v16H6.5A2.5 2.5 0 0 1 4 17.5v-11Z"/><path d="M4 8h14M14 12h6v4h-6a2 2 0 0 1 0-4Z"/></svg>;
}

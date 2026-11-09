"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CustomerOrder = {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerPoNumber?: string;
  orderDate?: string;
  deliveryDate?: string;
  priority?: string;
  status?: string;
  totalQuantity?: number;
  subtotal?: number;
  gstAmount?: number;
  totalAmount?: number;
  createdAt?: string;
  updatedAt?: string;
};

type OrdersApiResponse = {
  success?: boolean;
  requiresLogin?: boolean;
  message?: string;
  orders?: CustomerOrder[];
};

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

function formatDate(value?: string) {
  if (!value) return "Not specified";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalizeStatus(value?: string) {
  return clean(value).toLowerCase();
}

function getStatusStyle(statusValue?: string) {
  const status = normalizeStatus(statusValue);
  if (status.includes("deliver") || status.includes("complete"))
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status.includes("cancel"))
    return "border-red-200 bg-red-50 text-red-700";
  if (status.includes("dispatch") || status.includes("ship"))
    return "border-violet-200 bg-violet-50 text-violet-700";
  if (status.includes("quality") || status.includes("qc"))
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  if (
    status.includes("production") ||
    status.includes("stitch") ||
    status.includes("embroider")
  )
    return "border-amber-200 bg-amber-50 text-amber-700";
  if (
    status.includes("artwork") ||
    status.includes("design") ||
    status.includes("digit") ||
    status.includes("approval")
  )
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function getStatusLabel(status?: string) {
  return clean(status) || "Pending Review";
}

function getProgress(statusValue?: string) {
  const status = normalizeStatus(statusValue);
  if (status.includes("deliver") || status.includes("complete")) return 100;
  if (status.includes("dispatch") || status.includes("ship")) return 84;
  if (status.includes("quality") || status.includes("qc")) return 68;
  if (
    status.includes("production") ||
    status.includes("stitch") ||
    status.includes("embroider")
  )
    return 50;
  if (
    status.includes("artwork") ||
    status.includes("design") ||
    status.includes("digit") ||
    status.includes("approval")
  )
    return 32;
  return 16;
}

function progressText(statusValue?: string) {
  const status = normalizeStatus(statusValue);
  if (status.includes("deliver") || status.includes("complete")) return "Completed";
  if (status.includes("dispatch") || status.includes("ship")) return "On the way";
  if (status.includes("quality") || status.includes("qc")) return "Final checks";
  if (status.includes("production") || status.includes("stitch")) return "In production";
  if (status.includes("artwork") || status.includes("design") || status.includes("digit"))
    return "Design stage";
  return "Order received";
}

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/customer/orders", {
          method: "GET",
          cache: "no-store",
        });

        const text = await response.text();
        let data: OrdersApiResponse | null = null;

        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          throw new Error("The order service returned an invalid response.");
        }

        if (response.status === 401 || data?.requiresLogin) {
          router.replace(
            `/customer/login?next=${encodeURIComponent("/customer/orders")}`
          );
          return;
        }

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Unable to load your orders.");
        }

        if (!cancelled) {
          setOrders(Array.isArray(data.orders) ? data.orders : []);
        }
      } catch (err) {
        console.error("Customer orders error:", err);
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load your orders."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const filteredOrders = useMemo(() => {
    const query = clean(search).toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        clean(order.orderNumber).toLowerCase().includes(query) ||
        clean(order.customerPoNumber).toLowerCase().includes(query) ||
        clean(order.status).toLowerCase().includes(query);

      const status = normalizeStatus(order.status);
      let matchesStatus = true;

      if (statusFilter === "active") {
        matchesStatus =
          !status.includes("deliver") &&
          !status.includes("complete") &&
          !status.includes("cancel");
      }
      if (statusFilter === "completed") {
        matchesStatus =
          status.includes("deliver") || status.includes("complete");
      }
      if (statusFilter === "cancelled") {
        matchesStatus = status.includes("cancel");
      }

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const activeOrders = orders.filter((order) => {
    const status = normalizeStatus(order.status);
    return (
      !status.includes("deliver") &&
      !status.includes("complete") &&
      !status.includes("cancel")
    );
  }).length;

  const completedOrders = orders.filter((order) => {
    const status = normalizeStatus(order.status);
    return status.includes("deliver") || status.includes("complete");
  }).length;

  const totalValue = orders.reduce(
    (sum, order) => sum + (Number(order.totalAmount) || 0),
    0
  );

  if (loading) return <OrdersLoading />;

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-50 blur-3xl" />
        <div className="absolute left-1/3 top-0 h-48 w-48 rounded-full bg-indigo-50 blur-3xl" />

        <div className="relative mx-auto max-w-[1380px] px-5 py-10 sm:px-7 lg:px-10 lg:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Customer Portal
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">
                Your orders, beautifully organised.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                Review every EMBRASTIC order, see what stage it is in and open the
                complete order record whenever you need it.
              </p>
            </div>

            <Link
              href="/customer/products"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-blue-600"
            >
              <PlusIcon />
              Start New Order
              <span className="transition group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1380px] px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
        {error && (
          <div className="mb-7 rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white font-black text-red-600 shadow-sm">
                !
              </div>
              <div className="flex-1">
                <div className="font-black text-red-900">We couldn't load your orders</div>
                <p className="mt-1 text-sm leading-6 text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-3 text-sm font-black text-red-700 underline decoration-red-300 underline-offset-4"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {!error && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<OrderIcon />}
                label="Total Orders"
                value={String(orders.length)}
                description="All orders placed"
              />
              <StatCard
                icon={<PulseIcon />}
                label="In Progress"
                value={String(activeOrders)}
                description="Active right now"
              />
              <StatCard
                icon={<CheckIcon />}
                label="Completed"
                value={String(completedOrders)}
                description="Successfully completed"
              />
              <StatCard
                icon={<WalletIcon />}
                label="Order Value"
                value={money(totalValue)}
                description="Across all orders"
                compact
              />
            </div>

            <section className="mt-7 rounded-3xl border border-slate-200/80 bg-white p-3 shadow-[0_10px_40px_rgba(15,23,42,0.05)] sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                    <SearchIcon />
                  </div>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by order number, PO or status..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    ["all", "All"],
                    ["active", "In Progress"],
                    ["completed", "Completed"],
                    ["cancelled", "Cancelled"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatusFilter(value)}
                      className={`h-11 rounded-xl px-4 text-xs font-black transition ${
                        statusFilter === value
                          ? "bg-slate-950 text-white shadow-md"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="mt-7 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950">
                  Order history
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Showing {filteredOrders.length} of {orders.length} orders
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <EmptyOrders />
            ) : filteredOrders.length === 0 ? (
              <div className="mt-5 rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <SearchIcon />
                </div>
                <h2 className="mt-5 text-xl font-black text-slate-950">
                  No matching orders
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Try a different order number, customer PO or order status.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="mt-5 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-600"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                {filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function OrderCard({ order }: { order: CustomerOrder }) {
  const status = getStatusLabel(order.status);
  const progress = getProgress(order.status);
  const cancelled = normalizeStatus(order.status).includes("cancel");

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_210px]">
        <div className="p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/customer/orders/${encodeURIComponent(order.id)}`}
                  className="text-xl font-black tracking-[-0.025em] text-slate-950 transition group-hover:text-blue-600 sm:text-2xl"
                >
                  {order.orderNumber || "Order"}
                </Link>
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${getStatusStyle(
                    order.status
                  )}`}
                >
                  {status}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-slate-500">
                <span>Placed {formatDate(order.orderDate)}</span>
                {order.customerPoNumber && (
                  <span>
                    Customer PO{" "}
                    <strong className="text-slate-800">{order.customerPoNumber}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 sm:text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                Order Total
              </div>
              <div className="mt-1 text-xl font-black tracking-tight text-slate-950">
                {money(order.totalAmount)}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MiniDetail
              label="Quantity"
              value={`${Number(order.totalQuantity || 0)} ${
                Number(order.totalQuantity) === 1 ? "piece" : "pieces"
              }`}
            />
            <MiniDetail label="Delivery" value={formatDate(order.deliveryDate)} />
            <MiniDetail label="Priority" value={clean(order.priority) || "Normal"} />
          </div>

          {!cancelled ? (
            <div className="mt-6">
              <div className="mb-2.5 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                    Progress
                  </span>
                  <span className="ml-2 text-xs font-bold text-slate-700">
                    {progressText(order.status)}
                  </span>
                </div>
                <span className="text-xs font-black text-blue-600">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
              This order has been cancelled.
            </div>
          )}
        </div>

        <div className="flex items-center border-t border-slate-100 bg-slate-50/60 p-5 lg:border-l lg:border-t-0 lg:p-6">
          <Link
            href={`/customer/orders/${encodeURIComponent(order.id)}`}
            className="flex w-full items-center justify-between rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-600"
          >
            <span>View Order</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function MiniDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3.5">
      <div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
        {label}
      </div>
      <div className="mt-1.5 truncate text-sm font-black text-slate-800">{value}</div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
  compact = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
            {label}
          </div>
          <div
            className={`mt-2 font-black tracking-[-0.035em] text-slate-950 ${
              compact ? "text-2xl" : "text-3xl"
            }`}
          >
            {value}
          </div>
          <div className="mt-1 text-xs font-medium text-slate-500">{description}</div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function EmptyOrders() {
  return (
    <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="px-6 py-16 text-center sm:px-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
          <OrderIcon />
        </div>
        <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
          Your first order starts here
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
          Once you place an order, this page will become your central view for
          artwork, production, quality checks and dispatch progress.
        </p>
        <Link
          href="/customer/products"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-600"
        >
          Browse Products <span>→</span>
        </Link>
      </div>
    </section>
  );
}

function OrdersLoading() {
  return (
    <main className="min-h-screen bg-[#f6f8fc]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1380px] px-5 py-12 sm:px-7 lg:px-10">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-12 w-80 max-w-full animate-pulse rounded-xl bg-slate-100" />
          <div className="mt-4 h-5 w-full max-w-xl animate-pulse rounded bg-slate-100" />
        </div>
      </section>
      <div className="mx-auto max-w-[1380px] px-5 py-8 sm:px-7 lg:px-10">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-3xl bg-white" />
          ))}
        </div>
        <div className="mt-7 h-20 animate-pulse rounded-3xl bg-white" />
        <div className="mt-7 space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-64 animate-pulse rounded-3xl bg-white" />
          ))}
        </div>
      </div>
    </main>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden="true">
      <path d="M6 3h12l2 4v14H4V7l2-4Z" />
      <path d="M4 7h16" />
      <path d="M9 11h6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H18v16H6.5A2.5 2.5 0 0 1 4 17.5v-11Z" />
      <path d="M4 8h14M14 12h6v4h-6a2 2 0 0 1 0-4Z" />
    </svg>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* =========================================================
   TYPES
========================================================= */

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

function formatDate(value?: string) {
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

function normalizeStatus(value?: string) {
  return clean(value).toLowerCase();
}

/* =========================================================
   STATUS
========================================================= */

function getStatusStyle(statusValue?: string) {
  const status = normalizeStatus(statusValue);

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
    status.includes("quality") ||
    status.includes("qc")
  ) {
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }

  if (
    status.includes("production") ||
    status.includes("stitch") ||
    status.includes("embroider")
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    status.includes("artwork") ||
    status.includes("design") ||
    status.includes("digit") ||
    status.includes("approval")
  ) {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function getStatusLabel(status?: string) {
  return clean(status) || "Pending Review";
}

function getProgress(statusValue?: string) {
  const status = normalizeStatus(statusValue);

  if (
    status.includes("deliver") ||
    status.includes("complete")
  ) {
    return 100;
  }

  if (
    status.includes("dispatch") ||
    status.includes("ship")
  ) {
    return 84;
  }

  if (
    status.includes("quality") ||
    status.includes("qc")
  ) {
    return 68;
  }

  if (
    status.includes("production") ||
    status.includes("stitch") ||
    status.includes("embroider")
  ) {
    return 50;
  }

  if (
    status.includes("artwork") ||
    status.includes("design") ||
    status.includes("digit") ||
    status.includes("approval")
  ) {
    return 32;
  }

  return 16;
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function CustomerOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<CustomerOrder[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  /* =====================================================
     LOAD ORDERS
  ====================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/customer/orders",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const text = await response.text();

        let data: OrdersApiResponse | null = null;

        try {
          data = text ? JSON.parse(text) : null;
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
              "/customer/orders"
            )}`
          );

          return;
        }

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.message ||
              "Unable to load your orders."
          );
        }

        if (!cancelled) {
          setOrders(
            Array.isArray(data.orders)
              ? data.orders
              : []
          );
        }
      } catch (err) {
        console.error(
          "Customer orders error:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your orders."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /* =====================================================
     FILTERED ORDERS
  ====================================================== */

  const filteredOrders = useMemo(() => {
    const query = clean(search).toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        clean(order.orderNumber)
          .toLowerCase()
          .includes(query) ||
        clean(order.customerPoNumber)
          .toLowerCase()
          .includes(query) ||
        clean(order.status)
          .toLowerCase()
          .includes(query);

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
          status.includes("deliver") ||
          status.includes("complete");
      }

      if (statusFilter === "cancelled") {
        matchesStatus = status.includes("cancel");
      }

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  /* =====================================================
     STATS
  ====================================================== */

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

    return (
      status.includes("deliver") ||
      status.includes("complete")
    );
  }).length;

  /* =====================================================
     LOADING
  ====================================================== */

  if (loading) {
    return <OrdersLoading />;
  }

  /* =====================================================
     PAGE
  ====================================================== */

  return (
    <main className="min-h-screen bg-slate-50">
      {/* =================================================
          HERO
      ================================================== */}

      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-blue-300">
                Customer Account
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                My Orders
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                View your EMBRASTIC orders and
                follow artwork, production,
                quality control and dispatch
                progress.
              </p>
            </div>

            <Link
              href="/customer/products"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-500"
            >
              Start New Order
            </Link>
          </div>
        </div>
      </section>

      {/* =================================================
          CONTENT
      ================================================== */}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="font-extrabold text-red-800">
              We couldn't load your orders
            </div>

            <p className="mt-1 text-sm leading-6 text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-extrabold text-red-700 transition hover:bg-red-100"
            >
              Try Again
            </button>
          </div>
        )}

        {/* =================================================
            STATS
        ================================================== */}

        {!error && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Total Orders"
                value={orders.length}
                description="Orders placed"
              />

              <StatCard
                label="In Progress"
                value={activeOrders}
                description="Currently active"
              />

              <StatCard
                label="Completed"
                value={completedOrders}
                description="Delivered orders"
              />
            </div>

            {/* =============================================
                SEARCH / FILTER
            ============================================== */}

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                    <SearchIcon />
                  </div>

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search order number or PO..."
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                  className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 md:min-w-48"
                >
                  <option value="all">
                    All Orders
                  </option>

                  <option value="active">
                    In Progress
                  </option>

                  <option value="completed">
                    Completed
                  </option>

                  <option value="cancelled">
                    Cancelled
                  </option>
                </select>
              </div>
            </section>

            {/* =============================================
                EMPTY
            ============================================== */}

            {orders.length === 0 ? (
              <EmptyOrders />
            ) : filteredOrders.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <SearchIcon />
                </div>

                <h2 className="mt-5 text-xl font-black text-slate-950">
                  No matching orders
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Try another order number,
                  customer PO or status.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="mt-5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              /* ===========================================
                 ORDERS
              ============================================ */

              <div className="mt-6 space-y-4">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/* =========================================================
   ORDER CARD
========================================================= */

function OrderCard({
  order,
}: {
  order: CustomerOrder;
}) {
  const status = getStatusLabel(order.status);

  const progress = getProgress(order.status);

  const cancelled = normalizeStatus(
    order.status
  ).includes("cancel");

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="p-5 sm:p-6">
        {/* TOP */}

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/customer/orders/${encodeURIComponent(
                  order.id
                )}`}
                className="text-xl font-black tracking-tight text-slate-950 transition hover:text-blue-600"
              >
                {order.orderNumber ||
                  "Order"}
              </Link>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-extrabold ${getStatusStyle(
                  order.status
                )}`}
              >
                {status}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs font-medium text-slate-500">
              <span>
                Ordered{" "}
                {formatDate(order.orderDate)}
              </span>

              {order.customerPoNumber && (
                <span>
                  PO:{" "}
                  <strong className="text-slate-700">
                    {order.customerPoNumber}
                  </strong>
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-end justify-between gap-6 lg:block lg:text-right">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
                Order Total
              </div>

              <div className="mt-1 text-xl font-black text-slate-950">
                {money(order.totalAmount)}
              </div>
            </div>

            <Link
              href={`/customer/orders/${encodeURIComponent(
                order.id
              )}`}
              className="hidden rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-blue-700 sm:inline-flex"
            >
              View Order
            </Link>
          </div>
        </div>

        {/* DETAILS */}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MiniDetail
            label="Quantity"
            value={`${Number(
              order.totalQuantity || 0
            )} ${
              Number(order.totalQuantity) === 1
                ? "piece"
                : "pieces"
            }`}
          />

          <MiniDetail
            label="Requested Delivery"
            value={formatDate(
              order.deliveryDate
            )}
          />

          <MiniDetail
            label="Priority"
            value={
              clean(order.priority) || "Normal"
            }
          />
        </div>

        {/* PROGRESS */}

        {!cancelled && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
                Order Progress
              </span>

              <span className="text-xs font-extrabold text-blue-600">
                {status}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* MOBILE BUTTON */}

        <Link
          href={`/customer/orders/${encodeURIComponent(
            order.id
          )}`}
          className="mt-5 flex w-full items-center justify-between rounded-xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-600 sm:hidden"
        >
          <span>View & Track Order</span>

          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

/* =========================================================
   MINI DETAIL
========================================================= */

function MiniDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-sm font-extrabold text-slate-800">
        {value}
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
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>

      <div className="mt-2 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </div>

      <div className="mt-1 text-xs font-medium text-slate-500">
        {description}
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY ORDERS
========================================================= */

function EmptyOrders() {
  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="px-6 py-14 text-center sm:px-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <OrderIcon />
        </div>

        <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
          No orders yet
        </h2>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
          When you place an order with
          EMBRASTIC, you'll be able to track
          artwork approval, production,
          quality control and dispatch from
          here.
        </p>

        <Link
          href="/customer/products"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-blue-700"
        >
          Browse Products
        </Link>
      </div>
    </section>
  );
}

/* =========================================================
   LOADING
========================================================= */

function OrdersLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-7 w-36 animate-pulse rounded-full bg-slate-800" />

          <div className="mt-4 h-10 w-56 animate-pulse rounded-xl bg-slate-800" />

          <div className="mt-3 h-5 w-full max-w-xl animate-pulse rounded bg-slate-800" />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>

        <div className="mt-6 h-20 animate-pulse rounded-2xl border border-slate-200 bg-white" />

        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-3xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   ICONS
========================================================= */

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <path d="M6 3h12l2 4v14H4V7l2-4Z" />

      <path d="M4 7h16" />

      <path d="M9 11h6" />
    </svg>
  );
}
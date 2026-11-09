"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  IndianRupee,
  Loader2,
  Package,
  ReceiptText,
  Search,
  Truck,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type Invoice = {
  id: string;
  invoiceNumber?: string;

  customer?: string;
  customerId?: string;

  orderNumber?: string;
  orderId?: string;

  dispatchNumber?: string;
  dispatchStatus?: string;
  dispatchDate?: string;

  courierName?: string;
  trackingNumber?: string;

  invoiceDate?: string;
  dueDate?: string;

  items?: unknown;

  subtotal?: number | string;
  discount?: number | string;
  gstPercent?: number | string;
  taxableAmount?: number | string;
  taxAmount?: number | string;
  totalAmount?: number | string;
  paidAmount?: number | string;
  outstandingAmount?: number | string;

  notes?: string;
  status?: string;
};

type InvoiceResponse = {
  success: boolean;

  customer?: {
    id?: string;
    customerCode?: string;
    name?: string;
    businessName?: string;
    email?: string;
  };

  summary?: {
    count?: number;
    totalInvoiced?: number;
    totalPaid?: number;
    totalOutstanding?: number;
  };

  invoices?: Invoice[];

  message?: string;
};

function money(value: unknown) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(
    Number.isFinite(amount) ? amount : 0
  );
}

function formatDate(value?: string) {
  if (!value) return "—";

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

function getStatusStyle(status?: string) {
  const value = String(
    status ?? ""
  ).toLowerCase();

  if (
    value.includes("paid") &&
    !value.includes("unpaid") &&
    !value.includes("part")
  ) {
    return {
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
    };
  }

  if (
    value.includes("overdue") ||
    value.includes("unpaid")
  ) {
    return {
      className:
        "border-red-200 bg-red-50 text-red-700",
      icon: Clock3,
    };
  }

  if (
    value.includes("partial") ||
    value.includes("pending")
  ) {
    return {
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
      icon: Clock3,
    };
  }

  return {
    className:
      "border-slate-200 bg-slate-50 text-slate-600",
    icon: ReceiptText,
  };
}

export default function CustomerInvoicesPage() {
  const [data, setData] =
    useState<InvoiceResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadInvoices() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/customer/invoices",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const result =
          (await response.json()) as InvoiceResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Unable to load invoices."
          );
        }

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load invoices."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInvoices();

    return () => {
      cancelled = true;
    };
  }, []);

  const invoices = data?.invoices ?? [];

  const filteredInvoices = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase();

    if (!term) {
      return invoices;
    }

    return invoices.filter((invoice) => {
      return [
        invoice.invoiceNumber,
        invoice.orderNumber,
        invoice.status,
        invoice.dispatchNumber,
        invoice.trackingNumber,
        invoice.courierName,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(term)
        );
    });
  }, [invoices, search]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your invoices...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <div className="font-black text-red-700">
            Unable to load invoices
          </div>

          <div className="mt-1 text-sm text-red-600">
            {error}
          </div>
        </div>
      </main>
    );
  }

  const summary = data?.summary;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* HEADER */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 px-6 py-8 text-white sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                Billing & Payments
              </div>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                My Invoices
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Review your EMBRASTIC invoices,
                payment status and outstanding
                balances.
              </p>
            </div>

            {data?.customer?.customerCode && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Customer
                </div>

                <div className="mt-1 text-sm font-black">
                  {data.customer.customerCode}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid border-b border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Invoices"
            value={String(
              summary?.count ?? 0
            )}
            icon={
              <FileText className="h-5 w-5" />
            }
          />

          <SummaryCard
            label="Total Invoiced"
            value={money(
              summary?.totalInvoiced
            )}
            icon={
              <IndianRupee className="h-5 w-5" />
            }
          />

          <SummaryCard
            label="Paid"
            value={money(
              summary?.totalPaid
            )}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
          />

          <SummaryCard
            label="Outstanding"
            value={money(
              summary?.totalOutstanding
            )}
            icon={
              <Clock3 className="h-5 w-5" />
            }
            last
          />
        </div>

        {/* BODY */}
        <div className="p-5 sm:p-7 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Invoice History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {invoices.length
                  ? `${invoices.length} invoice${
                      invoices.length === 1
                        ? ""
                        : "s"
                    } found`
                  : "No invoices issued yet"}
              </p>
            </div>

            {invoices.length > 0 && (
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search invoices..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400"
                />
              </div>
            )}
          </div>

          {invoices.length === 0 ? (
            <EmptyInvoices />
          ) : filteredInvoices.length ===
            0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <Search className="mx-auto h-8 w-8 text-slate-300" />

              <div className="mt-4 font-black text-slate-900">
                No matching invoices
              </div>

              <div className="mt-1 text-sm text-slate-500">
                Try a different invoice or
                order number.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map(
                (invoice) => (
                  <InvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                  />
                )
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  last = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`p-5 sm:p-6 ${
        last
          ? ""
          : "border-b border-slate-200 sm:border-r lg:border-b-0"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
            {label}
          </div>

          <div className="mt-2 text-xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function InvoiceCard({
  invoice,
}: {
  invoice: Invoice;
}) {
  const statusStyle =
    getStatusStyle(invoice.status);

  const StatusIcon = statusStyle.icon;

  const outstanding = Number(
    invoice.outstandingAmount ?? 0
  );

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <ReceiptText className="h-5 w-5" />
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                Invoice
              </div>

              <div className="mt-0.5 text-base font-black text-slate-950">
                {invoice.invoiceNumber ||
                  invoice.id}
              </div>
            </div>

            <div
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${statusStyle.className}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {invoice.status ||
                "Invoice"}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-400" />

              <span>
                Invoice:{" "}
                <strong className="text-slate-700">
                  {formatDate(
                    invoice.invoiceDate
                  )}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-slate-400" />

              <span>
                Due:{" "}
                <strong className="text-slate-700">
                  {formatDate(
                    invoice.dueDate
                  )}
                </strong>
              </span>
            </div>

            {invoice.orderNumber && (
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-400" />

                <span>
                  Order:{" "}
                  <strong className="text-slate-700">
                    {
                      invoice.orderNumber
                    }
                  </strong>
                </span>
              </div>
            )}

            {invoice.dispatchStatus && (
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-slate-400" />

                <span>
                  {
                    invoice.dispatchStatus
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 lg:min-w-[290px] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                Invoice Total
              </div>

              <div className="mt-1 text-xl font-black text-slate-950">
                {money(
                  invoice.totalAmount
                )}
              </div>
            </div>

            {outstanding > 0 && (
              <div className="text-right">
                <div className="text-[9px] font-black uppercase tracking-[0.12em] text-red-400">
                  Outstanding
                </div>

                <div className="mt-1 text-sm font-black text-red-600">
                  {money(outstanding)}
                </div>
              </div>
            )}
          </div>

          {invoice.orderId && (
            <Link
              href={`/customer/orders/${encodeURIComponent(
                invoice.orderId
              )}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white transition hover:bg-slate-800"
            >
              View Related Order
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function EmptyInvoices() {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-14 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm">
        <ReceiptText className="h-7 w-7" />
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-950">
        No invoices yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Your invoices will appear here once
        EMBRASTIC generates an invoice against
        one of your orders.
      </p>

      <Link
        href="/customer/orders"
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-black text-white transition hover:bg-slate-800"
      >
        View My Orders
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
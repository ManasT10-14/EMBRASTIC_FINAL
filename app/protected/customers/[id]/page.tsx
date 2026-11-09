"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

/* =========================================================
   TYPES
========================================================= */

type Row = Record<string, any>;

type Customer = {
  id: string;
  customerCode: string;
  name: string;
  businessName: string;
  contactPerson: string;
  phone: string;
  alternatePhone: string;
  email: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
  status: string;
  createdAt: string;
  [key: string]: any;
};

type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  deliveryDate: string;
  totalAmount: number;
  totalQuantity: number;
  status: string;
  [key: string]: any;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: string;
  orderId: string;
  orderNumber: string;
  dispatchId: string;
  dispatchNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
  [key: string]: any;
};

type Payment = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  [key: string]: any;
};

/* =========================================================
   HELPERS
========================================================= */

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function norm(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateOnly(value: unknown) {
  const text = clean(value);
  return text ? text.split("T")[0] : "";
}

function formatDate(value: string) {
  if (!value) return "—";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}-${month}-${year}`;
}

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function parseJsonArray(value: unknown) {
  if (Array.isArray(value)) return value;
  const text = clean(value);
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function invoiceTotal(row: any) {
  if (num(row?.totalAmount) > 0) return num(row?.totalAmount);

  const items = parseJsonArray(row?.items);
  const subtotal = items.reduce(
    (sum: number, item: any) =>
      sum + num(item?.quantity) * num(item?.rate ?? item?.unitPrice),
    0
  );

  const discount = num(row?.discount);
  const gstPercent = num(row?.gstPercent);
  const taxable = Math.max(subtotal - discount, 0);
  return taxable + (taxable * gstPercent) / 100;
}

function sameCustomer(row: any, customer: Customer) {
  const id = clean(row?.customerId);

  if (id && id === customer.id) {
    return true;
  }

  const rowName = norm(
    row?.customerName ??
      row?.customer ??
      row?.clientName
  );

  const names = [
    customer.name,
    customer.businessName,
    customer.contactPerson,
  ]
    .map(norm)
    .filter(Boolean);

  return Boolean(rowName && names.includes(rowName));
}

function normalizeCustomer(row: any): Customer {
  return {
    ...row,
    id: clean(row?.id),
    customerCode: clean(row?.customerCode ?? row?.code),
    name: clean(row?.name ?? row?.customerName),
    businessName: clean(row?.businessName ?? row?.companyName),
    contactPerson: clean(row?.contactPerson),
    phone: clean(row?.phone),
    alternatePhone: clean(row?.alternatePhone),
    email: clean(row?.email),
    gstin: clean(row?.gstin ?? row?.gstNumber),
    address: clean(row?.address),
    city: clean(row?.city),
    state: clean(row?.state),
    postalCode: clean(row?.postalCode ?? row?.pincode),
    country: clean(row?.country),
    notes: clean(row?.notes),
    status: clean(row?.status) || "Active",
    createdAt: clean(row?.createdAt),
  };
}

function normalizeOrder(row: any): Order {
  return {
    ...row,
    id: clean(row?.id),
    orderNumber: clean(row?.orderNumber),
    customerId: clean(row?.customerId),
    customerName: clean(row?.customerName ?? row?.customer),
    orderDate: dateOnly(row?.orderDate),
    deliveryDate: dateOnly(row?.deliveryDate),
    totalAmount: num(row?.totalAmount ?? row?.orderValue ?? row?.amount),
    totalQuantity: num(row?.totalQuantity),
    status: clean(row?.status),
  };
}

function normalizeInvoice(row: any): Invoice {
  const total = invoiceTotal(row);
  const paid = num(row?.paidAmount);
  const outstanding =
    row?.outstandingAmount !== undefined &&
    row?.outstandingAmount !== null &&
    clean(row?.outstandingAmount) !== ""
      ? num(row?.outstandingAmount)
      : Math.max(total - paid, 0);

  return {
    ...row,
    id: clean(row?.id),
    invoiceNumber: clean(row?.invoiceNumber),
    customerId: clean(row?.customerId),
    customer: clean(row?.customer ?? row?.customerName),
    orderId: clean(row?.orderId),
    orderNumber: clean(row?.orderNumber),
    dispatchId: clean(row?.dispatchId),
    dispatchNumber: clean(row?.dispatchNumber),
    invoiceDate: dateOnly(row?.invoiceDate),
    dueDate: dateOnly(row?.dueDate),
    totalAmount: total,
    paidAmount: paid,
    outstandingAmount: outstanding,
    status: clean(row?.status),
  };
}

function normalizePayment(row: any): Payment {
  return {
    ...row,
    id: clean(row?.id),
    invoiceId: clean(row?.invoiceId),
    invoiceNumber: clean(row?.invoiceNumber),
    customerId: clean(row?.customerId),
    customerName: clean(row?.customerName ?? row?.customer),
    paymentDate: dateOnly(row?.paymentDate),
    amount: num(row?.amount),
    paymentMethod: clean(row?.paymentMethod ?? row?.method),
    reference: clean(row?.reference ?? row?.transactionReference),
  };
}

/* =========================================================
   PAGE
========================================================= */

export default function Customer360Page() {
  const params = useParams<{ id: string }>();
  const customerId = clean(params?.id);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [quotations, setQuotations] = useState<Row[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [designs, setDesigns] = useState<Row[]>([]);
  const [digitizing, setDigitizing] = useState<Row[]>([]);
  const [workOrders, setWorkOrders] = useState<Row[]>([]);
  const [production, setProduction] = useState<Row[]>([]);
  const [qualityControl, setQualityControl] = useState<Row[]>([]);
  const [dispatches, setDispatches] = useState<Row[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [returnsRework, setReturnsRework] = useState<Row[]>([]);

  useEffect(() => {
    if (customerId) {
      void loadData();
    }
  }, [customerId]);

  async function loadSheet(sheet: string) {
    const response = await fetch(
      `/api/excel?sheet=${encodeURIComponent(sheet)}`,
      { cache: "no-store" }
    );

    let data: any = {};

    try {
      data = await response.json();
    } catch {
      // ignore invalid body so standard error can be shown
    }

    if (!response.ok || !data?.success) {
      throw new Error(
        data?.message ||
          data?.error ||
          `Unable to load ${sheet}.`
      );
    }

    return Array.isArray(data.rows) ? data.rows : [];
  }

  async function loadOptionalSheet(
    candidates: string[]
  ) {
    let lastError: unknown = null;

    for (const sheet of candidates) {
      try {
        return await loadSheet(sheet);
      } catch (error) {
        lastError = error;

        const message =
          error instanceof Error
            ? error.message
            : String(error);

        /*
         * Different EMBRASTIC builds may use different sheet
         * names for the same module (for example Artwork vs
         * Designs). If a candidate sheet does not exist, try
         * the next alias instead of breaking Customer 360.
         */
        if (
          !message
            .toLowerCase()
            .includes("unknown sheet")
        ) {
          console.warn(
            `Unable to load optional sheet ${sheet}:`,
            error
          );
        }
      }
    }

    if (lastError) {
      console.warn(
        `Customer 360 optional sheet unavailable: ${candidates.join(
          " / "
        )}`
      );
    }

    return [];
  }

  async function loadData(silent = false) {
    try {
      setError("");
      silent ? setRefreshing(true) : setLoading(true);

      const [
        customerRows,
        quotationRows,
        orderRows,
        designRows,
        digitizingRows,
        workOrderRows,
        productionRows,
        qcRows,
        dispatchRows,
        invoiceRows,
        paymentRows,
        returnRows,
      ] = await Promise.all([
        loadSheet("Customers"),

        loadOptionalSheet([
          "Quotations",
        ]),

        loadOptionalSheet([
          "Orders",
        ]),

        loadOptionalSheet([
          "Designs",
          "Artwork",
          "ArtworkDesigns",
        ]),

        loadOptionalSheet([
          "Digitizing",
        ]),

        loadOptionalSheet([
          "WorkOrders",
        ]),

        loadOptionalSheet([
          "Production",
        ]),

        loadOptionalSheet([
          "QualityControl",
        ]),

        loadOptionalSheet([
          "Dispatch",
        ]),

        loadOptionalSheet([
          "Invoices",
        ]),

        loadOptionalSheet([
          "Payments",
        ]),

        loadOptionalSheet([
          "ReturnsRework",
          "Returns",
        ]),
      ]);

      const allCustomers = customerRows
        .map(normalizeCustomer)
        .filter((row: Customer) => Boolean(row.id));

      const selected = allCustomers.find(
        (row: Customer) => row.id === customerId
      );

      if (!selected) {
        setCustomer(null);
        setError("Customer not found.");
        return;
      }

      setCustomer(selected);

      setQuotations(
        quotationRows.filter((row: any) =>
          sameCustomer(row, selected)
        )
      );

      setOrders(
        orderRows
          .map(normalizeOrder)
          .filter((row: Order) =>
            sameCustomer(row, selected)
          )
          .sort((a: Order, b: Order) =>
            String(b.orderDate).localeCompare(
              String(a.orderDate)
            )
          )
      );

      setDesigns(
        designRows.filter((row: any) =>
          sameCustomer(row, selected)
        )
      );

      setDigitizing(
        digitizingRows.filter((row: any) =>
          sameCustomer(row, selected)
        )
      );

      setWorkOrders(
        workOrderRows.filter((row: any) =>
          sameCustomer(row, selected)
        )
      );

      setProduction(
        productionRows.filter((row: any) =>
          sameCustomer(row, selected)
        )
      );

      setQualityControl(
        qcRows.filter((row: any) =>
          sameCustomer(row, selected)
        )
      );

      setDispatches(
        dispatchRows.filter((row: any) =>
          sameCustomer(row, selected)
        )
      );

      setInvoices(
        invoiceRows
          .map(normalizeInvoice)
          .filter((row: Invoice) =>
            sameCustomer(row, selected)
          )
          .sort((a: Invoice, b: Invoice) =>
            String(b.invoiceDate).localeCompare(
              String(a.invoiceDate)
            )
          )
      );

      setPayments(
        paymentRows
          .map(normalizePayment)
          .filter((row: Payment) =>
            sameCustomer(row, selected)
          )
          .sort((a: Payment, b: Payment) =>
            String(b.paymentDate).localeCompare(
              String(a.paymentDate)
            )
          )
      );

      setReturnsRework(
        returnRows.filter((row: any) =>
          sameCustomer(row, selected)
        )
      );
    } catch (err) {
      console.error("Customer 360 load error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Customer 360."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /* =======================================================
     KPI
  ======================================================= */

  const invoiced = useMemo(
    () =>
      invoices.reduce(
        (sum, row) => sum + row.totalAmount,
        0
      ),
    [invoices]
  );

  const paid = useMemo(() => {
    if (payments.length) {
      return payments.reduce(
        (sum, row) => sum + row.amount,
        0
      );
    }

    return invoices.reduce(
      (sum, row) => sum + row.paidAmount,
      0
    );
  }, [payments, invoices]);

  const outstanding = useMemo(
    () =>
      invoices.reduce(
        (sum, row) => sum + row.outstandingAmount,
        0
      ),
    [invoices]
  );

  const averageOrderValue =
    orders.length > 0
      ? invoiced / orders.length
      : 0;

  const openOrders = useMemo(
    () =>
      orders.filter(
        (row) =>
          ![
            "completed",
            "delivered",
            "closed",
            "cancelled",
            "paid",
          ].includes(norm(row.status))
      ).length,
    [orders]
  );

  const repeatCustomer = orders.length >= 2;

  const activeWorkOrders = useMemo(
    () =>
      workOrders.filter(
        (row) =>
          ![
            "completed",
            "cancelled",
          ].includes(norm(row?.status))
      ).length,
    [workOrders]
  );

  const returnsCount = returnsRework.filter(
    (row) =>
      [
        "customer return",
        "customer complaint",
        "replacement",
      ].includes(norm(row?.caseType))
  ).length;

  const reworkQty = returnsRework.reduce(
    (sum, row) =>
      sum + num(row?.reworkQuantity),
    0
  );

  const latestOrder = orders[0];

  const recentActivity = useMemo(() => {
    const activity: {
      date: string;
      type: string;
      title: string;
      detail: string;
      route: string;
    }[] = [];

    orders.forEach((row) => {
      activity.push({
        date: row.orderDate,
        type: "Order",
        title: row.orderNumber,
        detail: row.status || "Order created",
        route: "/protected/orders",
      });
    });

    invoices.forEach((row) => {
      activity.push({
        date: row.invoiceDate,
        type: "Invoice",
        title: row.invoiceNumber,
        detail: `${money(row.totalAmount)} · ${row.status || "Invoice"}`,
        route: "/protected/invoices",
      });
    });

    payments.forEach((row) => {
      activity.push({
        date: row.paymentDate,
        type: "Payment",
        title: row.invoiceNumber || "Payment",
        detail: `${money(row.amount)} · ${row.paymentMethod || "Payment"}`,
        route: "/protected/payments",
      });
    });

    dispatches.forEach((row) => {
      activity.push({
        date: dateOnly(row?.dispatchDate),
        type: "Dispatch",
        title: clean(row?.dispatchNumber) || "Dispatch",
        detail: `${num(row?.dispatchQuantity)} pcs · ${clean(row?.status)}`,
        route: "/protected/dispatch",
      });
    });

    returnsRework.forEach((row) => {
      activity.push({
        date: dateOnly(row?.reportedDate),
        type: "Return / Rework",
        title: clean(row?.caseNumber) || "Case",
        detail: `${clean(row?.caseType)} · ${clean(row?.status)}`,
        route: "/protected/returns-rework",
      });
    });

    return activity
      .filter((row) => row.date)
      .sort((a, b) =>
        b.date.localeCompare(a.date)
      )
      .slice(0, 12);
  }, [
    orders,
    invoices,
    payments,
    dispatches,
    returnsRework,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Loading Customer 360...
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-black">Customer 360</h1>
        <p className="mt-3 text-red-600">
          {error || "Customer not found."}
        </p>
        <Link
          href="/protected/customers"
          className="mt-5 inline-flex rounded-xl bg-blue-700 px-4 py-3 font-bold text-white"
        >
          Back to Customers
        </Link>
      </div>
    );
  }

  const displayName =
    customer.businessName ||
    customer.name ||
    customer.contactPerson ||
    "Customer";

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="mx-auto w-full max-w-7xl space-y-6 pb-24">

        {/* HEADER */}
        <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-200">
                Customer 360°
              </div>

              <h1 className="text-3xl font-black sm:text-4xl">
                {displayName}
              </h1>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-300">
                {customer.customerCode && <span>{customer.customerCode}</span>}
                {customer.contactPerson && <span>{customer.contactPerson}</span>}
                {customer.phone && <span>{customer.phone}</span>}
                {customer.email && <span>{customer.email}</span>}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadData(true)}
                disabled={refreshing}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15 disabled:opacity-50"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <Link
                href="/protected/customers"
                className="rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-900"
              >
                ← Customers
              </Link>
            </div>
          </div>
        </section>

        {/* KPI */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Lifetime Invoiced" value={money(invoiced)} caption={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`} tone="blue" />
          <Metric label="Payments Received" value={money(paid)} caption="Recorded customer payments" tone="green" />
          <Metric label="Outstanding" value={money(outstanding)} caption={outstanding > 0 ? "Receivable requiring follow-up" : "No outstanding balance"} tone={outstanding > 0 ? "amber" : "green"} />
          <Metric label="Orders" value={String(orders.length)} caption={repeatCustomer ? "Repeat customer" : "First-order customer"} tone="violet" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Average Order Value" value={money(averageOrderValue)} caption="Invoiced value ÷ orders" tone="cyan" />
          <Metric label="Open Orders" value={String(openOrders)} caption="Still moving through workflow" tone="amber" />
          <Metric label="Active Job Cards" value={String(activeWorkOrders)} caption="Open Work Orders" tone="blue" />
          <Metric label="Returns / Rework" value={`${returnsCount} / ${reworkQty}`} caption="Customer cases / rework quantity" tone={returnsCount || reworkQty ? "rose" : "green"} />
        </div>

        {/* CUSTOMER PROFILE + CURRENT POSITION */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
          <Section title="Customer Profile" description="Commercial and contact master data.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Business / Customer" value={displayName} />
              <Info label="Contact Person" value={customer.contactPerson || customer.name || "—"} />
              <Info label="Phone" value={customer.phone || "—"} />
              <Info label="Email" value={customer.email || "—"} />
              <Info label="GSTIN" value={customer.gstin || "—"} />
              <Info label="Status" value={customer.status || "Active"} />
            </div>

            <div className="mt-4 rounded-xl border bg-white p-4">
              <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Address</div>
              <div className="mt-2 text-sm leading-6 text-slate-700">
                {[customer.address, customer.city, customer.state, customer.postalCode, customer.country]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </div>
            </div>
          </Section>

          <Section title="Relationship Snapshot" description="The key things an owner usually wants before speaking to this customer.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Last Order" value={latestOrder ? `${latestOrder.orderNumber} · ${formatDate(latestOrder.orderDate)}` : "No orders"} />
              <Info label="Repeat Customer" value={repeatCustomer ? "Yes" : "No"} />
              <Info label="Quotations" value={String(quotations.length)} />
              <Info label="Designs" value={String(designs.length)} />
              <Info label="Digitizing Jobs" value={String(digitizing.length)} />
              <Info label="Dispatches" value={String(dispatches.length)} />
              <Info label="QC Inspections" value={String(qualityControl.length)} />
              <Info label="Production Jobs" value={String(production.length)} />
              <Info label="Payments" value={String(payments.length)} />
            </div>
          </Section>
        </div>

        {/* QUICK ACTIONS */}
        <Section title="Customer Actions" description="Jump directly into the relevant business module for this relationship.">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            <QuickLink href="/protected/quotations" icon="📝" label="Quotation" />
            <QuickLink href="/protected/orders" icon="📦" label="Order" />
            <QuickLink href="/protected/designs" icon="🎨" label="Design" />
            <QuickLink href="/protected/invoices" icon="🧾" label="Invoice" />
            <QuickLink href="/protected/payments" icon="💳" label="Payment" />
            <QuickLink href="/protected/returns-rework" icon="↩️" label="Return / Rework" />
          </div>
        </Section>

        {/* ORDERS */}
        <Section title="Order History" description="Confirmed work for this customer, newest first.">
          {orders.length === 0 ? (
            <Empty text="No Orders recorded for this customer." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border bg-white">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Delivery</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 12).map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-black text-blue-700">{row.orderNumber}</td>
                      <td className="px-4 py-3">{formatDate(row.orderDate)}</td>
                      <td className="px-4 py-3">{formatDate(row.deliveryDate)}</td>
                      <td className="px-4 py-3 font-bold">{row.totalQuantity || "—"}</td>
                      <td className="px-4 py-3 font-bold">{row.totalAmount ? money(row.totalAmount) : "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* INVOICES / PAYMENTS */}
        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="Invoices" description="Billing history and current receivables.">
            {invoices.length === 0 ? (
              <Empty text="No invoices recorded." />
            ) : (
              <div className="space-y-3">
                {invoices.slice(0, 8).map((row) => (
                  <div key={row.id} className="flex flex-col justify-between gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="font-black text-violet-700">{row.invoiceNumber}</div>
                      <div className="mt-1 text-xs text-slate-500">{row.dispatchNumber || row.orderNumber || "—"} · {formatDate(row.invoiceDate)}</div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="font-black">{money(row.totalAmount)}</div>
                      <div className={`mt-1 text-xs font-bold ${row.outstandingAmount > 0 ? "text-amber-600" : "text-green-600"}`}>
                        Outstanding {money(row.outstandingAmount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Recent Payments" description="Latest customer receipts.">
            {payments.length === 0 ? (
              <Empty text="No payments recorded." />
            ) : (
              <div className="space-y-3">
                {payments.slice(0, 8).map((row) => (
                  <div key={row.id} className="flex flex-col justify-between gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="font-black text-emerald-700">{row.invoiceNumber || "Payment"}</div>
                      <div className="mt-1 text-xs text-slate-500">{formatDate(row.paymentDate)} · {row.paymentMethod || "—"}</div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="font-black text-emerald-700">{money(row.amount)}</div>
                      <div className="mt-1 text-xs text-slate-400">{row.reference || "No reference"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* RETURNS */}
        <Section title="Returns, Complaints & Rework" description="Customer-quality history and cost-of-poor-quality signals.">
          {returnsRework.length === 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-800">
              No return or rework cases recorded for this customer.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border bg-white">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                    <th className="px-4 py-3">Case</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Cost</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {returnsRework.slice(0, 10).map((row: any) => (
                    <tr key={clean(row?.id)} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-black text-rose-700">{clean(row?.caseNumber) || "—"}</td>
                      <td className="px-4 py-3">{clean(row?.caseType) || "—"}</td>
                      <td className="px-4 py-3">{clean(row?.reasonCategory ?? row?.defectType) || "—"}</td>
                      <td className="px-4 py-3 font-bold">{num(row?.quantity)}</td>
                      <td className="px-4 py-3 font-bold">{money(num(row?.actualCost ?? row?.estimatedCost))}</td>
                      <td className="px-4 py-3"><StatusBadge status={clean(row?.status)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ACTIVITY */}
        <Section title="Relationship Timeline" description="Recent commercial and operational activity for this customer.">
          {recentActivity.length === 0 ? (
            <Empty text="No recent activity." />
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <Link
                  key={`${activity.type}-${activity.title}-${index}`}
                  href={activity.route}
                  className="flex flex-col justify-between gap-3 rounded-xl border bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">{activity.type}</span>
                      <span className="font-black text-slate-900">{activity.title}</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-500">{activity.detail}</div>
                  </div>
                  <div className="text-xs font-bold text-slate-400">{formatDate(activity.date)}</div>
                </Link>
              ))}
            </div>
          )}
        </Section>

        {customer.notes && (
          <Section title="Customer Notes" description="Internal relationship notes from the customer master.">
            <div className="whitespace-pre-wrap rounded-xl border bg-white p-4 text-sm leading-6 text-slate-700">
              {customer.notes}
            </div>
          </Section>
        )}

      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Metric({
  label,
  value,
  caption,
  tone,
}: {
  label: string;
  value: string;
  caption: string;
  tone: "blue" | "green" | "amber" | "violet" | "cyan" | "rose";
}) {
  const styles = {
    blue: "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50",
    green: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50",
    amber: "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50",
    violet: "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50",
    cyan: "border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-sky-50",
    rose: "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-50",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${styles[tone]}`}>
      <div className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{caption}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-slate-50 p-4">
      <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 break-words text-sm font-black text-slate-900">{value || "—"}</div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"
    >
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 text-sm font-black text-slate-800 group-hover:text-blue-700">{label}</div>
    </Link>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-slate-50 p-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const value = norm(status);

  const style =
    ["completed", "delivered", "paid", "pass", "closed", "resolved"].includes(value)
      ? "bg-green-100 text-green-700"
      : ["cancelled", "failed", "fail", "returned"].includes(value)
      ? "bg-red-100 text-red-700"
      : ["in production", "in transit", "in inspection"].includes(value)
      ? "bg-blue-100 text-blue-700"
      : ["rework required", "on hold", "pending"].includes(value)
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${style}`}>
      {status || "—"}
    </span>
  );
}

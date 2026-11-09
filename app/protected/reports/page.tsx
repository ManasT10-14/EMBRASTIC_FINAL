"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type Period =
  | "This Month"
  | "This Year"
  | "All Time";

type Customer = {
  id: string;
  name: string;
  businessName: string;
  createdAt: string;
};

type Quotation = {
  id: string;
  quotationNumber: string;

  customerId: string;
  customerName: string;

  quotationDate: string;

  status: string;

  totalAmount: number;

  createdAt: string;
};

type Order = {
  id: string;
  orderNumber: string;

  quotationId: string;
  quotationNumber: string;

  customerId: string;
  customerName: string;

  orderDate: string;
  deliveryDate: string;

  status: string;

  totalAmount: number;

  createdAt: string;
};

type Production = {
  id: string;

  orderId: string;
  orderNumber: string;

  customerId: string;
  customerName: string;

  designName: string;

  status: string;

  productionQuantity: number;
  rejectedQuantity: number;
  reworkQuantity: number;

  startDate: string;
  completedDate: string;

  createdAt: string;
};

type QualityControl = {
  id: string;

  orderId: string;
  orderNumber: string;

  customerId: string;
  customerName: string;

  qcStatus: string;
  status: string;
  result: string;

  inspectedQuantity: number;
  passedQuantity: number;
  rejectedQuantity: number;
  failedQuantity: number;
  reworkQuantity: number;

  inspectionDate: string;

  dispatchReady: string;

  createdAt: string;
};

type DispatchRecord = {
  id: string;

  orderId: string;
  orderNumber: string;

  customerId: string;
  customerName: string;

  dispatchDate: string;
  expectedDeliveryDate: string;
  deliveredDate: string;

  status: string;

  createdAt: string;
};

type InvoiceItem = {
  description: string;
  quantity: number;
  rate: number;
};

type Invoice = {
  id: string;

  invoiceNumber: string;

  customerId: string;
  customer: string;

  orderId: string;
  orderNumber: string;

  invoiceDate: string;
  dueDate: string;

  items: InvoiceItem[];

  discount: number;
  gstPercent: number;

  status: string;

  createdAt: string;
};

type Payment = {
  id: string;

  invoiceId: string;
  invoiceNumber: string;

  customerId: string;
  customer: string;

  orderId: string;
  orderNumber: string;

  date: string;

  amount: number;

  method: string;

  createdAt: string;
};

type Expense = {
  id: string;

  date: string;

  category: string;

  description: string;

  amount: number;

  gstAmount: number;

  totalAmount: number;

  createdAt: string;
};

type InventoryItem = {
  id: string;

  name: string;
  sku: string;

  category: string;

  quantity: number;
  currentStock: number;

  minimumStock: number;
  reorderLevel: number;

  purchasePrice: number;

  createdAt: string;
};

type CustomerPerformance = {
  key: string;
  customer: string;

  orders: number;
  invoiced: number;
  received: number;
  outstanding: number;
};

/* =========================================================
   HELPERS
========================================================= */

function clean(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
}

function normalizeText(
  value: unknown
) {
  return clean(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function numberValue(
  value: unknown
) {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function percent(
  numerator: number,
  denominator: number
) {
  if (
    denominator <= 0
  ) {
    return 0;
  }

  return (
    numerator /
    denominator
  ) * 100;
}

function formatPercent(
  value: number
) {
  return `${value.toFixed(
    1
  )}%`;
}

function money(
  value: number
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency:
        "INR",

      maximumFractionDigits:
        0,
    }
  ).format(
    value || 0
  );
}

function compactMoney(
  value: number
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency:
        "INR",

      notation:
        "compact",

      maximumFractionDigits:
        1,
    }
  ).format(
    value || 0
  );
}

function normalizeDate(
  value: unknown
) {
  const text =
    clean(value);

  return text
    ? text.split(
        "T"
      )[0]
    : "";
}

function parseDate(
  value: string
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(
      `${value.split("T")[0]}T00:00:00`
    );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

function daysBetween(
  from: string,
  to: string
) {
  const start =
    parseDate(from);

  const end =
    parseDate(to);

  if (
    !start ||
    !end
  ) {
    return null;
  }

  return Math.round(
    (
      end.getTime() -
      start.getTime()
    ) /
      86400000
  );
}

function sameText(
  first: unknown,
  second: unknown
) {
  const a =
    normalizeText(first);

  const b =
    normalizeText(second);

  return Boolean(
    a &&
    b &&
    a === b
  );
}

function customerKey(
  customerId: string,
  customerName: string
) {
  if (
    clean(customerId)
  ) {
    return `id:${normalizeText(
      customerId
    )}`;
  }

  return `name:${normalizeText(
    customerName
  )}`;
}

function isCancelled(
  status: string
) {
  return [
    "cancelled",
    "canceled",
    "rejected",
    "void",
  ].includes(
    normalizeText(
      status
    )
  );
}

function isReturned(
  status: string
) {
  const normalized =
    normalizeText(
      status
    );

  return (
    normalized ===
      "returned" ||
    normalized ===
      "return" ||
    normalized ===
      "rto" ||
    normalized ===
      "return to origin" ||
    normalized ===
      "returned to origin" ||
    normalized.includes(
      "returned"
    )
  );
}

function isDelivered(
  status: string
) {
  return [
    "delivered",
    "completed",
  ].includes(
    normalizeText(
      status
    )
  );
}

function isQcPassed(
  qc: QualityControl
) {
  return [
    qc.qcStatus,
    qc.result,
  ].some(
    (
      value
    ) =>
      [
        "pass",
        "passed",
        "approved",
        "qc pass",
        "qc passed",
      ].includes(
        normalizeText(
          value
        )
      )
  ) ||
    [
      "yes",
      "true",
      "ready",
      "ready for dispatch",
    ].includes(
      normalizeText(
        qc.dispatchReady
      )
    );
}

function isProductionCompleted(
  status: string
) {
  return [
    "completed",
    "complete",
    "production completed",
    "paid",
    "closed",
  ].includes(
    normalizeText(
      status
    )
  );
}

/* =========================================================
   PERIOD FILTERING
========================================================= */

type Clock = {
  year: number;
  month: number;
};

function inPeriod(
  rawDate: string,
  period: Period,
  clock: Clock | null
) {
  if (
    period ===
    "All Time"
  ) {
    return true;
  }

  if (
    !clock ||
    !rawDate
  ) {
    return false;
  }

  const date =
    parseDate(
      rawDate
    );

  if (!date) {
    return false;
  }

  if (
    period ===
    "This Year"
  ) {
    return (
      date.getFullYear() ===
      clock.year
    );
  }

  return (
    date.getFullYear() ===
      clock.year &&
    date.getMonth() ===
      clock.month
  );
}

/* =========================================================
   INVOICE HELPERS
========================================================= */

function parseItems(
  value: unknown
): InvoiceItem[] {
  try {
    if (
      Array.isArray(value)
    ) {
      return value.map(
        (
          item: any
        ) => ({
          description:
            clean(
              item?.description
            ),

          quantity:
            numberValue(
              item?.quantity
            ),

          rate:
            numberValue(
              item?.rate
            ),
        })
      );
    }

    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      const parsed =
        JSON.parse(value);

      if (
        Array.isArray(
          parsed
        )
      ) {
        return parsed.map(
          (
            item: any
          ) => ({
            description:
              clean(
                item?.description
              ),

            quantity:
              numberValue(
                item?.quantity
              ),

            rate:
              numberValue(
                item?.rate
              ),
          })
        );
      }
    }
  } catch {
    //
  }

  return [];
}

function invoiceSubtotal(
  invoice: Invoice
) {
  return invoice.items.reduce(
    (
      total,
      item
    ) =>
      total +
      item.quantity *
        item.rate,
    0
  );
}

function invoiceTotal(
  invoice: Invoice
) {
  const subtotal =
    invoiceSubtotal(
      invoice
    );

  const discount =
    Math.min(
      Math.max(
        invoice.discount,
        0
      ),
      subtotal
    );

  const taxable =
    Math.max(
      subtotal -
        discount,
      0
    );

  const gst =
    taxable *
    invoice.gstPercent /
    100;

  return (
    taxable +
    gst
  );
}

/* =========================================================
   NORMALIZERS
========================================================= */

function normalizeCustomer(
  row: any
): Customer {
  return {
    id:
      clean(row?.id),

    name:
      clean(
        row?.name ??
          row?.customerName
      ),

    businessName:
      clean(
        row?.businessName ??
          row?.companyName
      ),

    createdAt:
      clean(
        row?.createdAt
      ),
  };
}

function normalizeQuotation(
  row: any
): Quotation {
  return {
    id:
      clean(row?.id),

    quotationNumber:
      clean(
        row?.quotationNumber ??
          row?.quoteNumber
      ),

    customerId:
      clean(
        row?.customerId
      ),

    customerName:
      clean(
        row?.customerName ??
          row?.customer
      ),

    quotationDate:
      normalizeDate(
        row?.quotationDate ??
          row?.date
      ),

    status:
      clean(
        row?.status
      ),

    totalAmount:
      numberValue(
        row?.totalAmount ??
          row?.grandTotal ??
          row?.total
      ),

    createdAt:
      clean(
        row?.createdAt
      ),
  };
}

function normalizeOrder(
  row: any
): Order {
  return {
    id:
      clean(row?.id),

    orderNumber:
      clean(
        row?.orderNumber
      ),

    quotationId:
      clean(
        row?.quotationId
      ),

    quotationNumber:
      clean(
        row?.quotationNumber
      ),

    customerId:
      clean(
        row?.customerId
      ),

    customerName:
      clean(
        row?.customerName ??
          row?.customer
      ),

    orderDate:
      normalizeDate(
        row?.orderDate
      ),

    deliveryDate:
      normalizeDate(
        row?.deliveryDate
      ),

    status:
      clean(
        row?.status
      ),

    totalAmount:
      numberValue(
        row?.totalAmount ??
          row?.grandTotal ??
          row?.total ??
          row?.amount
      ),

    createdAt:
      clean(
        row?.createdAt
      ),
  };
}

function normalizeProduction(
  row: any
): Production {
  return {
    id:
      clean(row?.id),

    orderId:
      clean(
        row?.orderId
      ),

    orderNumber:
      clean(
        row?.orderNumber
      ),

    customerId:
      clean(
        row?.customerId
      ),

    customerName:
      clean(
        row?.customerName ??
          row?.customer
      ),

    designName:
      clean(
        row?.designName
      ),

    status:
      clean(
        row?.status
      ),

    productionQuantity:
      numberValue(
        row?.productionQuantity ??
          row?.quantity
      ),

    rejectedQuantity:
      numberValue(
        row?.rejectedQuantity
      ),

    reworkQuantity:
      numberValue(
        row?.reworkQuantity
      ),

    startDate:
      normalizeDate(
        row?.startDate
      ),

    completedDate:
      normalizeDate(
        row?.completedDate
      ),

    createdAt:
      clean(
        row?.createdAt
      ),
  };
}

function normalizeQC(
  row: any
): QualityControl {
  return {
    id:
      clean(row?.id),

    orderId:
      clean(
        row?.orderId
      ),

    orderNumber:
      clean(
        row?.orderNumber
      ),

    customerId:
      clean(
        row?.customerId
      ),

    customerName:
      clean(
        row?.customerName ??
          row?.customer
      ),

    qcStatus:
      clean(
        row?.qcStatus
      ),

    status:
      clean(
        row?.status
      ),

    result:
      clean(
        row?.result
      ),

    inspectedQuantity:
      numberValue(
        row?.inspectedQuantity ??
          row?.checkedQuantity
      ),

    passedQuantity:
      numberValue(
        row?.passedQuantity
      ),

    rejectedQuantity:
      numberValue(
        row?.rejectedQuantity
      ),

    failedQuantity:
      numberValue(
        row?.failedQuantity
      ),

    reworkQuantity:
      numberValue(
        row?.reworkQuantity
      ),

    inspectionDate:
      normalizeDate(
        row?.inspectionDate ??
          row?.checkedDate
      ),

    dispatchReady:
      clean(
        row?.dispatchReady
      ),

    createdAt:
      clean(
        row?.createdAt
      ),
  };
}

function normalizeDispatch(
  row: any
): DispatchRecord {
  return {
    id:
      clean(row?.id),

    orderId:
      clean(
        row?.orderId
      ),

    orderNumber:
      clean(
        row?.orderNumber
      ),

    customerId:
      clean(
        row?.customerId
      ),

    customerName:
      clean(
        row?.customerName ??
          row?.customer
      ),

    dispatchDate:
      normalizeDate(
        row?.dispatchDate
      ),

    expectedDeliveryDate:
      normalizeDate(
        row?.expectedDeliveryDate ??
          row?.deliveryDate
      ),

    deliveredDate:
      normalizeDate(
        row?.deliveredDate ??
          row?.deliveryCompletedDate
      ),

    status:
      clean(
        row?.status
      ),

    createdAt:
      clean(
        row?.createdAt
      ),
  };
}

function normalizeInvoice(
  row: any
): Invoice {
  return {
    id:
      clean(row?.id),

    invoiceNumber:
      clean(
        row?.invoiceNumber
      ),

    customerId:
      clean(
        row?.customerId
      ),

    customer:
      clean(
        row?.customer ??
          row?.customerName
      ),

    orderId:
      clean(
        row?.orderId
      ),

    orderNumber:
      clean(
        row?.orderNumber
      ),

    invoiceDate:
      normalizeDate(
        row?.invoiceDate
      ),

    dueDate:
      normalizeDate(
        row?.dueDate
      ),

    items:
      parseItems(
        row?.items
      ),

    discount:
      numberValue(
        row?.discount
      ),

    gstPercent:
      numberValue(
        row?.gstPercent
      ),

    status:
      clean(
        row?.status
      ),

    createdAt:
      clean(
        row?.createdAt
      ),
  };
}

function normalizePayment(
  row: any
): Payment {
  return {
    id:
      clean(row?.id),

    invoiceId:
      clean(
        row?.invoiceId
      ),

    invoiceNumber:
      clean(
        row?.invoiceNumber
      ),

    customerId:
      clean(
        row?.customerId
      ),

    customer:
      clean(
        row?.customer ??
          row?.customerName
      ),

    orderId:
      clean(
        row?.orderId
      ),

    orderNumber:
      clean(
        row?.orderNumber
      ),

    date:
      normalizeDate(
        row?.date
      ),

    amount:
      numberValue(
        row?.amount
      ),

    method:
      clean(
        row?.method
      ),

    createdAt:
      clean(
        row?.createdAt
      ),
  };
}

function normalizeExpense(
  row: any
): Expense {
  const amount =
    numberValue(
      row?.amount
    );

  const gstAmount =
    numberValue(
      row?.gstAmount ??
        row?.taxAmount
    );

  return {
    id:
      clean(row?.id),

    date:
      normalizeDate(
        row?.date ??
          row?.expenseDate
      ),

    category:
      clean(
        row?.category
      ),

    description:
      clean(
        row?.description
      ),

    amount,

    gstAmount,

    totalAmount:
      numberValue(
        row?.totalAmount
      ) ||
      amount +
        gstAmount,

    createdAt:
      clean(
        row?.createdAt
      ),
  };
}

function normalizeInventory(
  row: any
): InventoryItem {
  return {
    id:
      clean(row?.id),

    name:
      clean(
        row?.name ??
          row?.itemName
      ),

    sku:
      clean(
        row?.sku
      ),

    category:
      clean(
        row?.category
      ),

    quantity:
      numberValue(
        row?.quantity
      ),

    currentStock:
      numberValue(
        row?.currentStock ??
          row?.quantity
      ),

    minimumStock:
      numberValue(
        row?.minimumStock
      ),

    reorderLevel:
      numberValue(
        row?.reorderLevel ??
          row?.minimumStock
      ),

    purchasePrice:
      numberValue(
        row?.purchasePrice
      ),

    createdAt:
      clean(
        row?.createdAt
      ),
  };
}

/* =========================================================
   PAGE
========================================================= */

export default function ReportsPage() {
  const [
    customers,
    setCustomers,
  ] =
    useState<Customer[]>(
      []
    );

  const [
    quotations,
    setQuotations,
  ] =
    useState<
      Quotation[]
    >([]);

  const [
    orders,
    setOrders,
  ] =
    useState<Order[]>(
      []
    );

  const [
    production,
    setProduction,
  ] =
    useState<
      Production[]
    >([]);

  const [
    quality,
    setQuality,
  ] =
    useState<
      QualityControl[]
    >([]);

  const [
    dispatches,
    setDispatches,
  ] =
    useState<
      DispatchRecord[]
    >([]);

  const [
    invoices,
    setInvoices,
  ] =
    useState<Invoice[]>(
      []
    );

  const [
    payments,
    setPayments,
  ] =
    useState<Payment[]>(
      []
    );

  const [
    expenses,
    setExpenses,
  ] =
    useState<Expense[]>(
      []
    );

  const [
    inventory,
    setInventory,
  ] =
    useState<
      InventoryItem[]
    >([]);

  const [
    period,
    setPeriod,
  ] =
    useState<Period>(
      "This Month"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  /*
   * Current date is set after browser mount.
   * No new Date() is evaluated during initial
   * Next.js Client Component prerender.
   */
  const [
    clock,
    setClock,
  ] =
    useState<Clock | null>(
      null
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    const now =
      new Date();

    setClock({
      year:
        now.getFullYear(),

      month:
        now.getMonth(),
    });

    void loadData();
  }, []);

  /* =======================================================
     LOAD EXCEL
  ======================================================= */

  async function loadSheet(
    sheet: string
  ) {
    const response =
      await fetch(
        `/api/excel?sheet=${encodeURIComponent(
          sheet
        )}`,
        {
          cache:
            "no-store",
        }
      );

    let data: any = {};

    try {
      data =
        await response.json();
    } catch {
      //
    }

    if (
      !response.ok ||
      !data?.success
    ) {
      throw new Error(
        data?.message ||
          data?.error ||
          `Unable to load ${sheet}.`
      );
    }

    return Array.isArray(
      data.rows
    )
      ? data.rows
      : [];
  }

  /* =======================================================
     LOAD ALL REPORT DATA
  ======================================================= */

  async function loadData(
    silent = false
  ) {
    try {
      if (silent) {
        setRefreshing(
          true
        );
      } else {
        setLoading(
          true
        );
      }

      setError("");

      const [
        customerRows,
        quotationRows,
        orderRows,
        productionRows,
        qcRows,
        dispatchRows,
        invoiceRows,
        paymentRows,
        expenseRows,
        inventoryRows,
      ] =
        await Promise.all([
          loadSheet(
            "Customers"
          ),

          loadSheet(
            "Quotations"
          ),

          loadSheet(
            "Orders"
          ),

          loadSheet(
            "Production"
          ),

          loadSheet(
            "QualityControl"
          ),

          loadSheet(
            "Dispatch"
          ),

          loadSheet(
            "Invoices"
          ),

          loadSheet(
            "Payments"
          ),

          loadSheet(
            "Expenses"
          ),

          loadSheet(
            "Inventory"
          ),
        ]);

      setCustomers(
        customerRows
          .map(
            normalizeCustomer
          )
          .filter(
            (
              row
            ) =>
              Boolean(
                row.id
              )
          )
      );

      setQuotations(
        quotationRows
          .map(
            normalizeQuotation
          )
          .filter(
            (
              row
            ) =>
              Boolean(
                row.id
              )
          )
      );

      setOrders(
        orderRows
          .map(
            normalizeOrder
          )
          .filter(
            (
              row
            ) =>
              Boolean(
                row.id ||
                  row.orderNumber
              )
          )
      );

      setProduction(
        productionRows
          .map(
            normalizeProduction
          )
          .filter(
            (
              row
            ) =>
              Boolean(
                row.id
              )
          )
      );

      setQuality(
        qcRows
          .map(
            normalizeQC
          )
          .filter(
            (
              row
            ) =>
              Boolean(
                row.id
              )
          )
      );

      setDispatches(
        dispatchRows
          .map(
            normalizeDispatch
          )
          .filter(
            (
              row
            ) =>
              Boolean(
                row.id
              )
          )
      );

      setInvoices(
        invoiceRows
          .map(
            normalizeInvoice
          )
          .filter(
            (
              row
            ) =>
              Boolean(
                row.id
              )
          )
      );

      setPayments(
        paymentRows
          .map(
            normalizePayment
          )
          .filter(
            (
              row
            ) =>
              Boolean(
                row.id
              )
          )
      );

      setExpenses(
        expenseRows
          .map(
            normalizeExpense
          )
          .filter(
            (
              row
            ) =>
              Boolean(
                row.id
              )
          )
      );

      setInventory(
        inventoryRows
          .map(
            normalizeInventory
          )
          .filter(
            (
              row
            ) =>
              Boolean(
                row.id
              )
          )
      );
    } catch (
      error
    ) {
      console.error(
        "Reports load error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load Reports."
      );
    } finally {
      setLoading(
        false
      );

      setRefreshing(
        false
      );
    }
  }

  /* =======================================================
     PERIOD DATA
  ======================================================= */

  const periodOrders =
    useMemo(
      () =>
        orders.filter(
          (
            row
          ) =>
            inPeriod(
              row.orderDate ||
                row.createdAt,
              period,
              clock
            )
        ),
      [
        orders,
        period,
        clock,
      ]
    );

  const periodQuotations =
    useMemo(
      () =>
        quotations.filter(
          (
            row
          ) =>
            inPeriod(
              row.quotationDate ||
                row.createdAt,
              period,
              clock
            )
        ),
      [
        quotations,
        period,
        clock,
      ]
    );

  const periodInvoices =
    useMemo(
      () =>
        invoices.filter(
          (
            row
          ) =>
            inPeriod(
              row.invoiceDate ||
                row.createdAt,
              period,
              clock
            )
        ),
      [
        invoices,
        period,
        clock,
      ]
    );

  const periodPayments =
    useMemo(
      () =>
        payments.filter(
          (
            row
          ) =>
            inPeriod(
              row.date ||
                row.createdAt,
              period,
              clock
            )
        ),
      [
        payments,
        period,
        clock,
      ]
    );

  const periodExpenses =
    useMemo(
      () =>
        expenses.filter(
          (
            row
          ) =>
            inPeriod(
              row.date ||
                row.createdAt,
              period,
              clock
            )
        ),
      [
        expenses,
        period,
        clock,
      ]
    );

  const periodProduction =
    useMemo(
      () =>
        production.filter(
          (
            row
          ) =>
            inPeriod(
              row.completedDate ||
                row.startDate ||
                row.createdAt,
              period,
              clock
            )
        ),
      [
        production,
        period,
        clock,
      ]
    );

  const periodQuality =
    useMemo(
      () =>
        quality.filter(
          (
            row
          ) =>
            inPeriod(
              row.inspectionDate ||
                row.createdAt,
              period,
              clock
            )
        ),
      [
        quality,
        period,
        clock,
      ]
    );

  const periodDispatch =
    useMemo(
      () =>
        dispatches.filter(
          (
            row
          ) =>
            inPeriod(
              row.dispatchDate ||
                row.createdAt,
              period,
              clock
            )
        ),
      [
        dispatches,
        period,
        clock,
      ]
    );

  /* =======================================================
     FINANCE
  ======================================================= */

  const finance =
    useMemo(() => {
      const invoiced =
        periodInvoices.reduce(
          (
            total,
            invoice
          ) =>
            total +
            invoiceTotal(
              invoice
            ),
          0
        );

      const received =
        periodPayments.reduce(
          (
            total,
            payment
          ) =>
            total +
            payment.amount,
          0
        );

      const expenseTotal =
        periodExpenses.reduce(
          (
            total,
            expense
          ) =>
            total +
            (
              expense.totalAmount ||
              expense.amount
            ),
          0
        );

      /*
       * Operating surplus here is:
       *
       * cash received - recorded expenses
       *
       * It is NOT formal accounting net profit.
       */
      const operatingSurplus =
        received -
        expenseTotal;

      const allInvoiceValue =
        invoices.reduce(
          (
            total,
            invoice
          ) =>
            total +
            invoiceTotal(
              invoice
            ),
          0
        );

      const allReceived =
        payments.reduce(
          (
            total,
            payment
          ) =>
            total +
            payment.amount,
          0
        );

      const outstanding =
        Math.max(
          allInvoiceValue -
            allReceived,
          0
        );

      return {
        invoiced,
        received,
        expenses:
          expenseTotal,

        operatingSurplus,

        outstanding,

        collectionRate:
          percent(
            received,
            invoiced
          ),
      };
    }, [
      periodInvoices,
      periodPayments,
      periodExpenses,
      invoices,
      payments,
    ]);

  /* =======================================================
     SALES / ORDER KPIs
  ======================================================= */

  const salesMetrics =
    useMemo(() => {
      const validOrders =
        periodOrders.filter(
          (
            order
          ) =>
            !isCancelled(
              order.status
            )
        );

      const cancelled =
        periodOrders.filter(
          (
            order
          ) =>
            isCancelled(
              order.status
            )
        ).length;

      const orderValue =
        validOrders.reduce(
          (
            total,
            order
          ) =>
            total +
            order.totalAmount,
          0
        );

      const averageOrderValue =
        validOrders.length
          ? orderValue /
            validOrders.length
          : 0;

      return {
        orders:
          validOrders.length,

        cancelled,

        cancellationRate:
          percent(
            cancelled,
            periodOrders.length
          ),

        averageOrderValue,
      };
    }, [
      periodOrders,
    ]);

  /* =======================================================
     REPEAT CUSTOMER / REPEAT ORDER KPIs

     Repeat Customer:
     customer with 2+ non-cancelled orders.

     Repeat Order Rate:
     orders beyond the customer's first order /
     all valid orders.
  ======================================================= */

  const repeatMetrics =
    useMemo(() => {
      const validOrders =
        periodOrders.filter(
          (
            order
          ) =>
            !isCancelled(
              order.status
            )
        );

      const map =
        new Map<
          string,
          number
        >();

      validOrders.forEach(
        (
          order
        ) => {
          const key =
            customerKey(
              order.customerId,
              order.customerName
            );

          if (
            key ===
            "name:"
          ) {
            return;
          }

          map.set(
            key,
            (
              map.get(
                key
              ) || 0
            ) +
              1
          );
        }
      );

      const orderingCustomers =
        map.size;

      const repeatCustomers =
        [...map.values()]
          .filter(
            (
              count
            ) =>
              count >= 2
          ).length;

      const repeatOrders =
        [...map.values()]
          .reduce(
            (
              total,
              count
            ) =>
              total +
              Math.max(
                count -
                  1,
                0
              ),
            0
          );

      return {
        orderingCustomers,

        repeatCustomers,

        repeatCustomerRate:
          percent(
            repeatCustomers,
            orderingCustomers
          ),

        repeatOrders,

        repeatOrderRate:
          percent(
            repeatOrders,
            validOrders.length
          ),
      };
    }, [
      periodOrders,
    ]);

  /* =======================================================
     QUOTATION CONVERSION
  ======================================================= */

  const quotationMetrics =
    useMemo(() => {
      const converted =
        periodQuotations.filter(
          (
            quotation
          ) => {
            const directStatus =
              normalizeText(
                quotation.status
              );

            if (
              directStatus.includes(
                "convert"
              )
            ) {
              return true;
            }

            return orders.some(
              (
                order
              ) =>
                (
                  quotation.id &&
                  order.quotationId &&
                  sameText(
                    quotation.id,
                    order.quotationId
                  )
                ) ||
                (
                  quotation.quotationNumber &&
                  order.quotationNumber &&
                  sameText(
                    quotation.quotationNumber,
                    order.quotationNumber
                  )
                )
            );
          }
        ).length;

      return {
        quotations:
          periodQuotations.length,

        converted,

        conversionRate:
          percent(
            converted,
            periodQuotations.length
          ),
      };
    }, [
      periodQuotations,
      orders,
    ]);

  /* =======================================================
     RETURNS / DELIVERY
  ======================================================= */

  const deliveryMetrics =
    useMemo(() => {
      const returned =
        periodDispatch.filter(
          (
            dispatch
          ) =>
            isReturned(
              dispatch.status
            )
        ).length;

      const delivered =
        periodDispatch.filter(
          (
            dispatch
          ) =>
            isDelivered(
              dispatch.status
            )
        );

      const onTime =
        delivered.filter(
          (
            dispatch
          ) => {
            if (
              !dispatch.deliveredDate ||
              !dispatch.expectedDeliveryDate
            ) {
              return false;
            }

            return (
              dispatch.deliveredDate <=
              dispatch.expectedDeliveryDate
            );
          }
        ).length;

      const deliveryRecordsWithDates =
        delivered.filter(
          (
            dispatch
          ) =>
            Boolean(
              dispatch.deliveredDate &&
                dispatch.expectedDeliveryDate
            )
        ).length;

      return {
        dispatched:
          periodDispatch.length,

        delivered:
          delivered.length,

        returned,

        returnRate:
          percent(
            returned,
            periodDispatch.length
          ),

        onTime,

        onTimeRate:
          percent(
            onTime,
            deliveryRecordsWithDates
          ),
      };
    }, [
      periodDispatch,
    ]);

  /* =======================================================
     QC
  ======================================================= */

  const qualityMetrics =
    useMemo(() => {
      const passed =
        periodQuality.filter(
          isQcPassed
        ).length;

      const inspected =
        periodQuality.reduce(
          (
            total,
            qc
          ) =>
            total +
            qc.inspectedQuantity,
          0
        );

      const rejected =
        periodQuality.reduce(
          (
            total,
            qc
          ) =>
            total +
            (
              qc.rejectedQuantity ||
              qc.failedQuantity
            ),
          0
        );

      const rework =
        periodQuality.reduce(
          (
            total,
            qc
          ) =>
            total +
            qc.reworkQuantity,
          0
        );

      return {
        inspections:
          periodQuality.length,

        passed,

        passRate:
          percent(
            passed,
            periodQuality.length
          ),

        inspected,

        rejected,

        rejectionRate:
          percent(
            rejected,
            inspected
          ),

        rework,

        reworkRate:
          percent(
            rework,
            inspected
          ),
      };
    }, [
      periodQuality,
    ]);

  /* =======================================================
     PRODUCTION
  ======================================================= */

  const productionMetrics =
    useMemo(() => {
      const completed =
        periodProduction.filter(
          (
            row
          ) =>
            isProductionCompleted(
              row.status
            )
        );

      const producedQty =
        completed.reduce(
          (
            total,
            row
          ) =>
            total +
            row.productionQuantity,
          0
        );

      const rejected =
        periodProduction.reduce(
          (
            total,
            row
          ) =>
            total +
            row.rejectedQuantity,
          0
        );

      const rework =
        periodProduction.reduce(
          (
            total,
            row
          ) =>
            total +
            row.reworkQuantity,
          0
        );

      const cycleDays =
        completed
          .map(
            (
              row
            ) =>
              daysBetween(
                row.startDate,
                row.completedDate
              )
          )
          .filter(
            (
              days
            ): days is number =>
              days !==
              null &&
              days >= 0
          );

      const averageCycleDays =
        cycleDays.length
          ? cycleDays.reduce(
              (
                total,
                days
              ) =>
                total +
                days,
              0
            ) /
            cycleDays.length
          : 0;

      return {
        completedJobs:
          completed.length,

        producedQty,

        rejected,

        rework,

        averageCycleDays,
      };
    }, [
      periodProduction,
    ]);

  /* =======================================================
     INVENTORY
  ======================================================= */

  const inventoryMetrics =
    useMemo(() => {
      const lowStock =
        inventory.filter(
          (
            item
          ) => {
            const stock =
              item.currentStock ||
              item.quantity;

            const minimum =
              item.reorderLevel ||
              item.minimumStock;

            return (
              minimum > 0 &&
              stock <=
                minimum
            );
          }
        );

      const stockValue =
        inventory.reduce(
          (
            total,
            item
          ) =>
            total +
            (
              item.currentStock ||
              item.quantity
            ) *
              item.purchasePrice,
          0
        );

      return {
        items:
          inventory.length,

        lowStock,

        stockValue,
      };
    }, [
      inventory,
    ]);

  /* =======================================================
     CUSTOMER PERFORMANCE
  ======================================================= */

  const customerPerformance =
    useMemo<
      CustomerPerformance[]
    >(() => {
      const map =
        new Map<
          string,
          CustomerPerformance
        >();

      periodOrders
        .filter(
          (
            order
          ) =>
            !isCancelled(
              order.status
            )
        )
        .forEach(
          (
            order
          ) => {
            const key =
              customerKey(
                order.customerId,
                order.customerName
              );

            const current =
              map.get(key) || {
                key,

                customer:
                  order.customerName ||
                  "Unknown Customer",

                orders: 0,

                invoiced: 0,

                received: 0,

                outstanding:
                  0,
              };

            current.orders +=
              1;

            map.set(
              key,
              current
            );
          }
        );

      periodInvoices.forEach(
        (
          invoice
        ) => {
          const key =
            customerKey(
              invoice.customerId,
              invoice.customer
            );

          const current =
            map.get(key) || {
              key,

              customer:
                invoice.customer ||
                "Unknown Customer",

              orders: 0,

              invoiced: 0,

              received: 0,

              outstanding:
                0,
            };

          current.invoiced +=
            invoiceTotal(
              invoice
            );

          map.set(
            key,
            current
          );
        }
      );

      periodPayments.forEach(
        (
          payment
        ) => {
          const key =
            customerKey(
              payment.customerId,
              payment.customer
            );

          const current =
            map.get(key) || {
              key,

              customer:
                payment.customer ||
                "Unknown Customer",

              orders: 0,

              invoiced: 0,

              received: 0,

              outstanding:
                0,
            };

          current.received +=
            payment.amount;

          map.set(
            key,
            current
          );
        }
      );

      return [...map.values()]
        .map(
          (
            row
          ) => ({
            ...row,

            outstanding:
              Math.max(
                row.invoiced -
                  row.received,
                0
              ),
          })
        )
        .sort(
          (
            a,
            b
          ) =>
            b.invoiced -
            a.invoiced
        );
    }, [
      periodOrders,
      periodInvoices,
      periodPayments,
    ]);

  /* =======================================================
     CUSTOMER CONCENTRATION
  ======================================================= */

  const customerConcentration =
    useMemo(() => {
      const total =
        customerPerformance.reduce(
          (
            sum,
            row
          ) =>
            sum +
            row.invoiced,
          0
        );

      const top =
        customerPerformance[
          0
        ]?.invoiced ||
        0;

      const top3 =
        customerPerformance
          .slice(
            0,
            3
          )
          .reduce(
            (
              sum,
              row
            ) =>
              sum +
              row.invoiced,
            0
          );

      return {
        topCustomer:
          percent(
            top,
            total
          ),

        top3:
          percent(
            top3,
            total
          ),
      };
    }, [
      customerPerformance,
    ]);

  /* =======================================================
     EXPENSE BREAKDOWN
  ======================================================= */

  const expenseCategories =
    useMemo(() => {
      const map =
        new Map<
          string,
          number
        >();

      periodExpenses.forEach(
        (
          expense
        ) => {
          const category =
            expense.category ||
            "Other";

          map.set(
            category,
            (
              map.get(
                category
              ) || 0
            ) +
              (
                expense.totalAmount ||
                expense.amount
              )
          );
        }
      );

      return [...map.entries()]
        .map(
          (
            [
              category,
              value,
            ]
          ) => ({
            category,
            value,
          })
        )
        .sort(
          (
            a,
            b
          ) =>
            b.value -
            a.value
        );
    }, [
      periodExpenses,
    ]);

  const largestExpense =
    Math.max(
      1,
      ...expenseCategories.map(
        (
          row
        ) =>
          row.value
      )
    );

  const largestCustomer =
    Math.max(
      1,
      ...customerPerformance.map(
        (
          row
        ) =>
          row.invoiced
      )
    );

  /* =======================================================
     KPI HEALTH
  ======================================================= */

  const healthIndicators = [
    {
      label:
        "Repeat Customer Rate",

      value:
        formatPercent(
          repeatMetrics.repeatCustomerRate
        ),

      good:
        repeatMetrics.repeatCustomerRate >=
        30,

      caption:
        "Customers placing 2+ orders",
    },

    {
      label:
        "Quotation Conversion",

      value:
        formatPercent(
          quotationMetrics.conversionRate
        ),

      good:
        quotationMetrics.conversionRate >=
        40,

      caption:
        "Quotes becoming orders",
    },

    {
      label:
        "QC Pass Rate",

      value:
        formatPercent(
          qualityMetrics.passRate
        ),

      good:
        qualityMetrics.passRate >=
        95,

      caption:
        "QC records passing inspection",
    },

    {
      label:
        "Return / RTO Rate",

      value:
        formatPercent(
          deliveryMetrics.returnRate
        ),

      good:
        deliveryMetrics.returnRate <=
        5,

      caption:
        "Dispatches returned or RTO",
    },

    {
      label:
        "On-Time Delivery",

      value:
        formatPercent(
          deliveryMetrics.onTimeRate
        ),

      good:
        deliveryMetrics.onTimeRate >=
        90,

      caption:
        "Delivered by expected date",
    },

    {
      label:
        "Collection Rate",

      value:
        formatPercent(
          finance.collectionRate
        ),

      good:
        finance.collectionRate >=
        90,

      caption:
        "Collections vs period invoices",
    },
  ];

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">

      <div className="mx-auto w-full max-w-[1500px] space-y-6 pb-24">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-xl">

          <div className="relative p-6 sm:p-8">

            <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-center">

              <div>

                <div className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-300">
                  BUSINESS INTELLIGENCE
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                  Business Performance Reports
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                  Track financial health, customer retention, repeat business, quotation conversion, production quality, returns, delivery performance and operational efficiency.
                </p>

              </div>

              <div className="flex flex-wrap gap-3">

                <select
                  value={
                    period
                  }
                  onChange={(e) =>
                    setPeriod(
                      e.target
                        .value as Period
                    )
                  }
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none"
                >

                  <option
                    className="text-slate-900"
                    value="This Month"
                  >
                    This Month
                  </option>

                  <option
                    className="text-slate-900"
                    value="This Year"
                  >
                    This Year
                  </option>

                  <option
                    className="text-slate-900"
                    value="All Time"
                  >
                    All Time
                  </option>

                </select>

                <button
                  type="button"
                  onClick={() =>
                    void loadData(
                      true
                    )
                  }
                  disabled={
                    refreshing
                  }
                  className="rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50"
                >
                  {refreshing
                    ? "Refreshing..."
                    : "↻ Refresh"}
                </button>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            ERROR / LOADING
        ================================================= */}

        {error && (

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

            <div className="font-black text-red-700">
              Unable to load complete report data
            </div>

            <div className="mt-1 text-sm text-red-600">
              {error}
            </div>

          </div>

        )}

        {loading && (

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm font-bold text-blue-700">
            Calculating business KPIs from Excel records...
          </div>

        )}

        {/* =================================================
            FINANCIAL KPI ROW
        ================================================= */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

          <KpiCard
            icon="🧾"
            label="Sales / Invoiced"
            value={
              money(
                finance.invoiced
              )
            }
            caption={`${period} invoice value`}
          />

          <KpiCard
            icon="💳"
            label="Collections"
            value={
              money(
                finance.received
              )
            }
            caption={`${formatPercent(
              finance.collectionRate
            )} collection rate`}
          />

          <KpiCard
            icon="💰"
            label="Expenses"
            value={
              money(
                finance.expenses
              )
            }
            caption="Recorded operating expenses"
          />

          <KpiCard
            icon="📈"
            label="Cash Surplus"
            value={
              money(
                finance.operatingSurplus
              )
            }
            caption="Collections minus expenses"
            positive={
              finance.operatingSurplus >=
              0
            }
          />

          <KpiCard
            icon="⏳"
            label="Outstanding"
            value={
              money(
                finance.outstanding
              )
            }
            caption="All-time customer receivable"
            warning={
              finance.outstanding >
              0
            }
          />

        </div>

        {/* =================================================
            CUSTOMER / SALES KPI ROW
        ================================================= */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <KpiCard
            icon="📦"
            label="Orders"
            value={String(
              salesMetrics.orders
            )}
            caption={`${period} confirmed orders`}
          />

          <KpiCard
            icon="🛍️"
            label="Average Order Value"
            value={
              money(
                salesMetrics.averageOrderValue
              )
            }
            caption="Average confirmed order"
          />

          <KpiCard
            icon="🔁"
            label="Repeat Customers"
            value={
              formatPercent(
                repeatMetrics.repeatCustomerRate
              )
            }
            caption={`${repeatMetrics.repeatCustomers} of ${repeatMetrics.orderingCustomers} ordering customers`}
          />

          <KpiCard
            icon="♻️"
            label="Repeat Order Rate"
            value={
              formatPercent(
                repeatMetrics.repeatOrderRate
              )
            }
            caption={`${repeatMetrics.repeatOrders} repeat orders`}
          />

        </div>

        {/* =================================================
            BUSINESS HEALTH
        ================================================= */}

        <ReportSection
          icon="🩺"
          title="Business Health Indicators"
          description="High-level KPIs commonly used to spot sales, customer, quality and fulfillment problems early."
        >

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

            {healthIndicators.map(
              (
                item
              ) => (

                <HealthCard
                  key={
                    item.label
                  }
                  {...item}
                />

              )
            )}

          </div>

        </ReportSection>

        {/* =================================================
            SALES FUNNEL
        ================================================= */}

        <div className="grid gap-6 xl:grid-cols-2">

          <ReportSection
            icon="🎯"
            title="Sales Funnel"
            description="Quotation performance, conversion and order loss."
          >

            <div className="grid gap-4 sm:grid-cols-2">

              <MetricBox
                label="Quotations"
                value={String(
                  quotationMetrics.quotations
                )}
              />

              <MetricBox
                label="Converted"
                value={String(
                  quotationMetrics.converted
                )}
              />

              <MetricBox
                label="Conversion Rate"
                value={
                  formatPercent(
                    quotationMetrics.conversionRate
                  )
                }
              />

              <MetricBox
                label="Cancelled Orders"
                value={String(
                  salesMetrics.cancelled
                )}
                caption={
                  formatPercent(
                    salesMetrics.cancellationRate
                  )
                }
              />

            </div>

          </ReportSection>

          {/* CUSTOMER CONCENTRATION */}

          <ReportSection
            icon="👥"
            title="Customer Quality"
            description="Retention and dependency on a small number of customers."
          >

            <div className="grid gap-4 sm:grid-cols-2">

              <MetricBox
                label="Repeat Customers"
                value={String(
                  repeatMetrics.repeatCustomers
                )}
                caption={
                  formatPercent(
                    repeatMetrics.repeatCustomerRate
                  )
                }
              />

              <MetricBox
                label="Repeat Orders"
                value={String(
                  repeatMetrics.repeatOrders
                )}
                caption={
                  formatPercent(
                    repeatMetrics.repeatOrderRate
                  )
                }
              />

              <MetricBox
                label="Top Customer Share"
                value={
                  formatPercent(
                    customerConcentration.topCustomer
                  )
                }
                caption="Share of invoiced sales"
              />

              <MetricBox
                label="Top 3 Customer Share"
                value={
                  formatPercent(
                    customerConcentration.top3
                  )
                }
                caption="Revenue concentration"
              />

            </div>

          </ReportSection>

        </div>

        {/* =================================================
            QUALITY / PRODUCTION
        ================================================= */}

        <div className="grid gap-6 xl:grid-cols-2">

          <ReportSection
            icon="✅"
            title="Quality Performance"
            description="Inspection quality, rejection and rework performance."
          >

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <MetricBox
                label="QC Inspections"
                value={String(
                  qualityMetrics.inspections
                )}
              />

              <MetricBox
                label="QC Pass Rate"
                value={
                  formatPercent(
                    qualityMetrics.passRate
                  )
                }
              />

              <MetricBox
                label="Inspected Qty"
                value={String(
                  qualityMetrics.inspected
                )}
              />

              <MetricBox
                label="Rejected Qty"
                value={String(
                  qualityMetrics.rejected
                )}
                caption={
                  formatPercent(
                    qualityMetrics.rejectionRate
                  )
                }
              />

              <MetricBox
                label="Rework Qty"
                value={String(
                  qualityMetrics.rework
                )}
                caption={
                  formatPercent(
                    qualityMetrics.reworkRate
                  )
                }
              />

              <MetricBox
                label="Passed Jobs"
                value={String(
                  qualityMetrics.passed
                )}
              />

            </div>

          </ReportSection>

          <ReportSection
            icon="🪡"
            title="Production Efficiency"
            description="Production completion, throughput and cycle time."
          >

            <div className="grid gap-4 sm:grid-cols-2">

              <MetricBox
                label="Completed Jobs"
                value={String(
                  productionMetrics.completedJobs
                )}
              />

              <MetricBox
                label="Produced Quantity"
                value={String(
                  productionMetrics.producedQty
                )}
              />

              <MetricBox
                label="Avg. Cycle Time"
                value={`${productionMetrics.averageCycleDays.toFixed(
                  1
                )} days`}
              />

              <MetricBox
                label="Production Rework"
                value={String(
                  productionMetrics.rework
                )}
              />

            </div>

          </ReportSection>

        </div>

        {/* =================================================
            DELIVERY / RETURNS
        ================================================= */}

        <ReportSection
          icon="🚚"
          title="Delivery, Returns & Customer Fulfilment"
          description="Returns and RTO are derived from Dispatch records whose status is Returned, RTO or Return to Origin."
        >

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

            <MetricBox
              label="Dispatches"
              value={String(
                deliveryMetrics.dispatched
              )}
            />

            <MetricBox
              label="Delivered"
              value={String(
                deliveryMetrics.delivered
              )}
            />

            <MetricBox
              label="Returns / RTO"
              value={String(
                deliveryMetrics.returned
              )}
              caption={
                formatPercent(
                  deliveryMetrics.returnRate
                )
              }
            />

            <MetricBox
              label="On-Time Deliveries"
              value={String(
                deliveryMetrics.onTime
              )}
            />

            <MetricBox
              label="On-Time Rate"
              value={
                formatPercent(
                  deliveryMetrics.onTimeRate
                )
              }
            />

          </div>

        </ReportSection>

        {/* =================================================
            TOP CUSTOMERS + EXPENSES
        ================================================= */}

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">

          {/* TOP CUSTOMERS */}

          <ReportSection
            icon="🏆"
            title="Top Customers"
            description="Customers ranked by invoice value in the selected period."
          >

            {customerPerformance.length ===
            0 ? (

              <EmptyState
                message="No customer sales are available for this period."
              />

            ) : (

              <div className="space-y-4">

                {customerPerformance
                  .slice(
                    0,
                    8
                  )
                  .map(
                    (
                      customer,
                      index
                    ) => {

                      const width =
                        customer.invoiced >
                        0
                          ? (
                              customer.invoiced /
                              largestCustomer
                            ) *
                            100
                          : 0;

                      return (

                        <div
                          key={
                            customer.key
                          }
                        >

                          <div className="mb-2 flex items-center justify-between gap-4">

                            <div className="flex min-w-0 items-center gap-3">

                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black">
                                {index +
                                  1}
                              </div>

                              <div className="min-w-0">

                                <div className="truncate text-sm font-black">
                                  {
                                    customer.customer
                                  }
                                </div>

                                <div className="text-xs text-slate-400">
                                  {
                                    customer.orders
                                  }{" "}
                                  orders
                                </div>

                              </div>

                            </div>

                            <div className="text-right">

                              <div className="font-black">
                                {money(
                                  customer.invoiced
                                )}
                              </div>

                              {customer.outstanding >
                                0 && (

                                <div className="text-xs font-semibold text-amber-600">
                                  {money(
                                    customer.outstanding
                                  )}{" "}
                                  due
                                </div>

                              )}

                            </div>

                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{
                                width:
                                  `${width}%`,
                              }}
                            />

                          </div>

                        </div>

                      );
                    }
                  )}

              </div>

            )}

          </ReportSection>

          {/* EXPENSE BREAKDOWN */}

          <ReportSection
            icon="💸"
            title="Expense Breakdown"
            description="Where operating cash is being spent."
          >

            {expenseCategories.length ===
            0 ? (

              <EmptyState
                message="No expenses are recorded for this period."
              />

            ) : (

              <div className="space-y-4">

                {expenseCategories
                  .slice(
                    0,
                    8
                  )
                  .map(
                    (
                      row
                    ) => {

                      const width =
                        (
                          row.value /
                          largestExpense
                        ) *
                        100;

                      return (

                        <div
                          key={
                            row.category
                          }
                        >

                          <div className="mb-2 flex justify-between gap-4">

                            <div className="truncate text-sm font-bold">
                              {
                                row.category
                              }
                            </div>

                            <div className="whitespace-nowrap text-sm font-black">
                              {money(
                                row.value
                              )}
                            </div>

                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                            <div
                              className="h-full rounded-full bg-slate-700"
                              style={{
                                width:
                                  `${width}%`,
                              }}
                            />

                          </div>

                        </div>

                      );
                    }
                  )}

              </div>

            )}

          </ReportSection>

        </div>

        {/* =================================================
            INVENTORY
        ================================================= */}

        <ReportSection
          icon="📋"
          title="Inventory Risk"
          description="Stock value and items that have reached or fallen below their reorder threshold."
        >

          <div className="grid gap-4 md:grid-cols-3">

            <MetricBox
              label="Inventory Items"
              value={String(
                inventoryMetrics.items
              )}
            />

            <MetricBox
              label="Low Stock Items"
              value={String(
                inventoryMetrics.lowStock.length
              )}
            />

            <MetricBox
              label="Estimated Stock Value"
              value={
                money(
                  inventoryMetrics.stockValue
                )
              }
            />

          </div>

          {inventoryMetrics.lowStock.length >
            0 && (

            <div className="mt-5 overflow-x-auto">

              <table className="w-full min-w-[650px] text-left text-sm">

                <thead>

                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                    <th className="px-4 py-3">
                      Item
                    </th>

                    <th className="px-4 py-3">
                      SKU
                    </th>

                    <th className="px-4 py-3">
                      Category
                    </th>

                    <th className="px-4 py-3">
                      Stock
                    </th>

                    <th className="px-4 py-3">
                      Reorder At
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {inventoryMetrics.lowStock
                    .slice(
                      0,
                      10
                    )
                    .map(
                      (
                        item
                      ) => (

                        <tr
                          key={
                            item.id
                          }
                          className="border-b last:border-0"
                        >

                          <td className="px-4 py-3 font-bold">
                            {
                              item.name ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-3">
                            {
                              item.sku ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-3">
                            {
                              item.category ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-3 font-black text-red-600">
                            {
                              item.currentStock ||
                              item.quantity
                            }
                          </td>

                          <td className="px-4 py-3">
                            {
                              item.reorderLevel ||
                              item.minimumStock
                            }
                          </td>

                        </tr>

                      )
                    )}

                </tbody>

              </table>

            </div>

          )}

        </ReportSection>

        {/* =================================================
            MANAGEMENT SUMMARY
        ================================================= */}

        <ReportSection
          icon="🧠"
          title="Management Snapshot"
          description="A compact view of the most important numbers a business owner should review regularly."
        >

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <SummaryLine
              label="Sales"
              value={
                compactMoney(
                  finance.invoiced
                )
              }
            />

            <SummaryLine
              label="Cash Collected"
              value={
                compactMoney(
                  finance.received
                )
              }
            />

            <SummaryLine
              label="Operating Expenses"
              value={
                compactMoney(
                  finance.expenses
                )
              }
            />

            <SummaryLine
              label="Outstanding"
              value={
                compactMoney(
                  finance.outstanding
                )
              }
            />

            <SummaryLine
              label="Order Volume"
              value={String(
                salesMetrics.orders
              )}
            />

            <SummaryLine
              label="Repeat Customer Rate"
              value={
                formatPercent(
                  repeatMetrics.repeatCustomerRate
                )
              }
            />

            <SummaryLine
              label="QC Pass Rate"
              value={
                formatPercent(
                  qualityMetrics.passRate
                )
              }
            />

            <SummaryLine
              label="Return Rate"
              value={
                formatPercent(
                  deliveryMetrics.returnRate
                )
              }
            />

          </div>

        </ReportSection>

        {/* =================================================
            KPI DEFINITIONS
        ================================================= */}

        <div className="rounded-2xl border bg-slate-50 p-5 text-xs leading-6 text-slate-500">

          <div className="font-black text-slate-700">
            KPI calculation notes
          </div>

          <p className="mt-2">
            Repeat customer rate counts customers with two or more non-cancelled orders in the selected period. Repeat-order rate counts orders beyond each customer's first order. Returns are derived from Dispatch statuses such as Returned, RTO and Return to Origin. On-time delivery requires both Expected Delivery Date and Delivered Date. Cash Surplus is collections less recorded expenses and should not be treated as formal accounting net profit.
          </p>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function ReportSection({
  icon,
  title,
  description,
  children,
}: {
  icon: string;

  title: string;

  description: string;

  children:
    ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

      <div className="border-b bg-slate-50/70 px-5 py-4 sm:px-6">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
            {icon}
          </div>

          <div>

            <h2 className="text-lg font-black">
              {title}
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>

          </div>

        </div>

      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>

    </section>
  );
}

function KpiCard({
  icon,
  label,
  value,
  caption,
  warning = false,
  positive,
}: {
  icon: string;

  label: string;

  value: string;

  caption: string;

  warning?: boolean;

  positive?:
    boolean;
}) {
  const valueStyle =
    warning
      ? "text-amber-700"
      : positive ===
        false
      ? "text-red-700"
      : positive ===
        true
      ? "text-green-700"
      : "text-slate-950";

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg">
          {icon}
        </div>

      </div>

      <div className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div
        className={`mt-1 text-2xl font-black tracking-tight ${valueStyle}`}
      >
        {value}
      </div>

      <div className="mt-2 text-xs leading-5 text-slate-400">
        {caption}
      </div>

    </div>
  );
}

function MetricBox({
  label,
  value,
  caption,
}: {
  label: string;

  value: string;

  caption?: string;
}) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-4">

      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-xl font-black text-slate-950">
        {value}
      </div>

      {caption && (

        <div className="mt-1 text-xs text-slate-400">
          {caption}
        </div>

      )}

    </div>
  );
}

function HealthCard({
  label,
  value,
  caption,
  good,
}: {
  label: string;

  value: string;

  caption: string;

  good: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        good
          ? "border-green-200 bg-green-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >

      <div className="flex items-start justify-between gap-3">

        <div>

          <div className="text-xs font-bold text-slate-600">
            {label}
          </div>

          <div
            className={`mt-2 text-2xl font-black ${
              good
                ? "text-green-700"
                : "text-amber-700"
            }`}
          >
            {value}
          </div>

        </div>

        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
            good
              ? "bg-green-200 text-green-800"
              : "bg-amber-200 text-amber-800"
          }`}
        >
          {good
            ? "✓"
            : "!"}
        </div>

      </div>

      <div className="mt-2 text-xs leading-5 text-slate-500">
        {caption}
      </div>

    </div>
  );
}

function SummaryLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-slate-50 px-4 py-3">

      <span className="text-sm font-semibold text-slate-500">
        {label}
      </span>

      <span className="font-black text-slate-900">
        {value}
      </span>

    </div>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed bg-slate-50 p-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
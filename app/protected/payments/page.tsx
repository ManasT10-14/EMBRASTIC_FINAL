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

type PaymentMethod =
  | "Cash"
  | "UPI"
  | "Bank Transfer"
  | "Card"
  | "Cheque"
  | "Other";

type InvoiceItem = {
  id?: string;

  orderItemId?: string;
  priceMasterId?: string;

  sku?: string;

  description: string;

  quantity: number;
  unit?: string;

  rate: number;
  gstPercent?: number;
};

type Invoice = {
  id: string;

  invoiceNumber: string;

  customer: string;
  customerId: string;

  orderId: string;
  orderNumber: string;

  dispatchId: string;
  dispatchNumber: string;

  invoiceDate: string;
  dueDate: string;

  items: InvoiceItem[];

  discount: number;
  gstPercent: number;

  subtotal: number;
  taxAmount: number;
  totalAmount: number;

  notes: string;

  status: string;

  createdAt: string;
  updatedAt: string;

  [key: string]: any;
};

type Payment = {
  id: string;

  invoiceId: string;
  invoiceNumber: string;

  customer: string;
  customerId: string;

  orderId: string;
  orderNumber: string;

  dispatchId: string;
  dispatchNumber: string;

  date: string;

  amount: number;

  method: PaymentMethod;

  reference: string;

  notes: string;

  createdAt: string;

  [key: string]: any;
};

type Order = {
  id: string;
  orderNumber: string;

  customerId: string;
  customerName: string;

  status: string;

  updatedAt: string;

  [key: string]: any;
};

type Digitizing = {
  id: string;

  orderId: string;
  orderNumber: string;

  status: string;

  updatedAt: string;

  [key: string]: any;
};

type Production = {
  id: string;

  orderId: string;
  orderNumber: string;

  status: string;

  updatedAt: string;

  [key: string]: any;
};

type QualityControl = {
  id: string;

  orderId: string;
  orderNumber: string;

  status: string;

  qcStatus: string;

  result: string;

  dispatchReady: string;

  updatedAt: string;

  [key: string]: any;
};

type PaymentForm = {
  invoiceId: string;

  date: string;

  amount: number;

  method: PaymentMethod;

  reference: string;

  notes: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash",
  "UPI",
  "Bank Transfer",
  "Card",
  "Cheque",
  "Other",
];

/* =========================================================
   FORM
========================================================= */

function emptyForm(): PaymentForm {
  return {
    invoiceId: "",

    date: "",

    amount: 0,

    method: "UPI",

    reference: "",

    notes: "",
  };
}

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
    .replace(
      /[_-]+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function sameText(
  value1: unknown,
  value2: unknown
) {
  const first =
    normalizeText(
      value1
    );

  const second =
    normalizeText(
      value2
    );

  return Boolean(
    first &&
      second &&
      first ===
        second
  );
}

function toNumber(
  value: unknown
) {
  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

function getToday() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

function getNow() {
  return new Date()
    .toISOString();
}

function generateId() {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `pay-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function money(
  value: number
) {
  return `₹${Number(
    value || 0
  ).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  )}`;
}

function formatDate(
  value: string
) {
  if (
    !value
  ) {
    return "—";
  }

  const raw =
    value.split(
      "T"
    )[0];

  const parts =
    raw.split("-");

  if (
    parts.length !==
    3
  ) {
    return raw;
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function daysBetween(
  from: string,
  to: string
) {
  if (
    !from ||
    !to
  ) {
    return 0;
  }

  const fromDate =
    new Date(
      `${from.split("T")[0]}T00:00:00`
    );

  const toDate =
    new Date(
      `${to.split("T")[0]}T00:00:00`
    );

  if (
    Number.isNaN(
      fromDate.getTime()
    ) ||
    Number.isNaN(
      toDate.getTime()
    )
  ) {
    return 0;
  }

  return Math.floor(
    (
      toDate.getTime() -
      fromDate.getTime()
    ) /
      86400000
  );
}

/* =========================================================
   INVOICE ITEMS
========================================================= */

function normalizeItems(
  value: any
): InvoiceItem[] {
  try {
    let parsed =
      value;

    if (
      typeof value ===
      "string"
    ) {
      if (
        !value.trim()
      ) {
        return [];
      }

      parsed =
        JSON.parse(
          value
        );
    }

    if (
      !Array.isArray(
        parsed
      )
    ) {
      return [];
    }

    return parsed.map(
      (
        item: any
      ) => ({
        id:
          clean(
            item?.id
          ),

        orderItemId:
          clean(
            item?.orderItemId
          ),

        priceMasterId:
          clean(
            item?.priceMasterId
          ),

        sku:
          clean(
            item?.sku ??
              item?.itemCode
          ),

        description:
          clean(
            item?.description ??
              item?.itemName ??
              item?.service
          ),

        quantity:
          toNumber(
            item?.quantity
          ),

        unit:
          clean(
            item?.unit
          ) ||
          "pcs",

        rate:
          toNumber(
            item?.rate ??
              item?.unitPrice
          ),

        gstPercent:
          toNumber(
            item?.gstPercent
          ),
      })
    );
  } catch {
    return [];
  }
}

/* =========================================================
   NORMALIZERS
========================================================= */

function normalizeInvoice(
  row: any
): Invoice {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    invoiceNumber:
      clean(
        row?.invoiceNumber
      ),

    customer:
      clean(
        row?.customer ??
          row?.customerName
      ),

    customerId:
      clean(
        row?.customerId
      ),

    orderId:
      clean(
        row?.orderId
      ),

    orderNumber:
      clean(
        row?.orderNumber
      ),

    dispatchId:
      clean(
        row?.dispatchId
      ),

    dispatchNumber:
      clean(
        row?.dispatchNumber
      ),

    invoiceDate:
      clean(
        row?.invoiceDate
      ).split(
        "T"
      )[0],

    dueDate:
      clean(
        row?.dueDate
      ).split(
        "T"
      )[0],

    items:
      normalizeItems(
        row?.items
      ),

    discount:
      toNumber(
        row?.discount
      ),

    gstPercent:
      toNumber(
        row?.gstPercent
      ),

    subtotal:
      toNumber(
        row?.subtotal
      ),

    taxAmount:
      toNumber(
        row?.taxAmount
      ),

    totalAmount:
      toNumber(
        row?.totalAmount
      ),

    notes:
      clean(
        row?.notes
      ),

    status:
      clean(
        row?.status
      ) ||
      "UNPAID",

    createdAt:
      clean(
        row?.createdAt
      ),

    updatedAt:
      clean(
        row?.updatedAt
      ),
  };
}

function normalizePayment(
  row: any
): Payment {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    invoiceId:
      clean(
        row?.invoiceId
      ),

    invoiceNumber:
      clean(
        row?.invoiceNumber
      ),

    customer:
      clean(
        row?.customer
      ),

    customerId:
      clean(
        row?.customerId
      ),

    orderId:
      clean(
        row?.orderId
      ),

    orderNumber:
      clean(
        row?.orderNumber
      ),

    dispatchId:
      clean(
        row?.dispatchId
      ),

    dispatchNumber:
      clean(
        row?.dispatchNumber
      ),

    date:
      clean(
        row?.date
      ).split(
        "T"
      )[0],

    amount:
      toNumber(
        row?.amount
      ),

    method:
      (
        PAYMENT_METHODS.includes(
          row?.method
        )
          ? row.method
          : "Other"
      ) as PaymentMethod,

    reference:
      clean(
        row?.reference
      ),

    notes:
      clean(
        row?.notes
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
    ...row,

    id:
      clean(
        row?.id
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

    status:
      clean(
        row?.status
      ),

    updatedAt:
      clean(
        row?.updatedAt
      ),
  };
}

function normalizeDigitizing(
  row: any
): Digitizing {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    orderId:
      clean(
        row?.orderId
      ),

    orderNumber:
      clean(
        row?.orderNumber
      ),

    status:
      clean(
        row?.status
      ),

    updatedAt:
      clean(
        row?.updatedAt
      ),
  };
}

function normalizeProduction(
  row: any
): Production {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    orderId:
      clean(
        row?.orderId
      ),

    orderNumber:
      clean(
        row?.orderNumber
      ),

    status:
      clean(
        row?.status
      ),

    updatedAt:
      clean(
        row?.updatedAt
      ),
  };
}

function normalizeQC(
  row: any
): QualityControl {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    orderId:
      clean(
        row?.orderId
      ),

    orderNumber:
      clean(
        row?.orderNumber
      ),

    status:
      clean(
        row?.status
      ),

    qcStatus:
      clean(
        row?.qcStatus
      ),

    result:
      clean(
        row?.result
      ),

    dispatchReady:
      clean(
        row?.dispatchReady
      ),

    updatedAt:
      clean(
        row?.updatedAt
      ),
  };
}

/* =========================================================
   INVOICE CALCULATIONS
========================================================= */

function invoiceSubtotal(
  invoice: Invoice
) {
  if (
    invoice.subtotal >
    0
  ) {
    return invoice.subtotal;
  }

  return invoice.items.reduce(
    (
      total,
      item
    ) =>
      total +
      Number(
        item.quantity ||
          0
      ) *
        Number(
          item.rate ||
            0
        ),
    0
  );
}

function invoiceDiscount(
  invoice: Invoice
) {
  return Math.min(
    Math.max(
      Number(
        invoice.discount ||
          0
      ),
      0
    ),

    invoiceSubtotal(
      invoice
    )
  );
}

function invoiceTax(
  invoice: Invoice
) {
  /*
   * New Invoice page stores taxAmount.
   * Use that first because it preserves line-level GST.
   */
  if (
    invoice.taxAmount >
    0
  ) {
    return invoice.taxAmount;
  }

  const subtotal =
    invoiceSubtotal(
      invoice
    );

  const discount =
    invoiceDiscount(
      invoice
    );

  const taxable =
    Math.max(
      subtotal -
        discount,
      0
    );

  /*
   * New invoices may contain different GST %
   * on different item lines.
   */
  const hasLineGst =
    invoice.items.some(
      (
        item
      ) =>
        Number(
          item.gstPercent ||
            0
        ) >
        0
    );

  if (
    hasLineGst
  ) {
    const discountRatio =
      subtotal >
      0
        ? Math.min(
            Math.max(
              discount /
                subtotal,
              0
            ),
            1
          )
        : 0;

    const rawTax =
      invoice.items.reduce(
        (
          total,
          item
        ) => {
          const line =
            Number(
              item.quantity ||
                0
            ) *
            Number(
              item.rate ||
                0
            );

          return (
            total +
            (
              line *
              Number(
                item.gstPercent ||
                  0
              )
            ) /
              100
          );
        },
        0
      );

    return (
      rawTax *
      (
        1 -
        discountRatio
      )
    );
  }

  /*
   * Legacy invoice fallback.
   */
  return (
    taxable *
    Number(
      invoice.gstPercent ||
        0
    )
  ) /
    100;
}

function invoiceTotal(
  invoice: Invoice
) {
  /*
   * The new Invoice page stores the final frozen total.
   * That becomes the primary source.
   */
  if (
    invoice.totalAmount >
    0
  ) {
    return invoice.totalAmount;
  }

  return (
    Math.max(
      invoiceSubtotal(
        invoice
      ) -
        invoiceDiscount(
          invoice
        ),
      0
    ) +
    invoiceTax(
      invoice
    )
  );
}

/* =========================================================
   ORDER LINKING
========================================================= */

function rowBelongsToOrder(
  row: {
    orderId?: string;
    orderNumber?: string;
  },

  invoice: Invoice
) {
  return (
    (
      row.orderId &&
      invoice.orderId &&
      sameText(
        row.orderId,
        invoice.orderId
      )
    ) ||
    (
      row.orderNumber &&
      invoice.orderNumber &&
      sameText(
        row.orderNumber,
        invoice.orderNumber
      )
    )
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function PaymentsPage() {
  const [
    invoices,
    setInvoices,
  ] =
    useState<
      Invoice[]
    >([]);

  const [
    payments,
    setPayments,
  ] =
    useState<
      Payment[]
    >([]);

  const [
    orders,
    setOrders,
  ] =
    useState<
      Order[]
    >([]);

  const [
    digitizingRecords,
    setDigitizingRecords,
  ] =
    useState<
      Digitizing[]
    >([]);

  const [
    productionRecords,
    setProductionRecords,
  ] =
    useState<
      Production[]
    >([]);

  const [
    qualityRecords,
    setQualityRecords,
  ] =
    useState<
      QualityControl[]
    >([]);

  const [
    form,
    setForm,
  ] =
    useState<
      PaymentForm
    >(
      emptyForm()
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  const [
    showForm,
    setShowForm,
  ] =
    useState(
      false
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    methodFilter,
    setMethodFilter,
  ] =
    useState(
      "All"
    );

  const [
    selectedPayment,
    setSelectedPayment,
  ] =
    useState<
      Payment | null
    >(
      null
    );

  /* =======================================================
     INITIAL
  ======================================================= */

  useEffect(
    () => {
      setForm(
        (
          current
        ) => ({
          ...current,

          date:
            getToday(),
        })
      );

      void loadData();
    },
    []
  );

  useEffect(
    () => {
      if (
        !showForm &&
        !selectedPayment
      ) {
        return;
      }

      const previous =
        document.body
          .style
          .overflow;

      document.body
        .style
        .overflow =
        "hidden";

      return () => {
        document.body
          .style
          .overflow =
          previous;
      };
    },
    [
      showForm,
      selectedPayment,
    ]
  );

  /* =======================================================
     API
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

    let data:
      any =
      {};

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

  async function saveExcel(
    body: any
  ) {
    const response =
      await fetch(
        "/api/excel",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              body
            ),
        }
      );

    let data:
      any =
      {};

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
        data?.error ||
          data?.message ||
          "Failed to process Excel request."
      );
    }

    return data;
  }

  /* =======================================================
     LOAD EVERYTHING
  ======================================================= */

  async function loadData(
    silent =
      false
  ) {
    try {
      if (
        silent
      ) {
        setRefreshing(
          true
        );
      } else {
        setLoading(
          true
        );
      }

      const [
        invoiceRows,
        paymentRows,
        orderRows,
        digitizingRows,
        productionRows,
        qcRows,
      ] =
        await Promise.all([
          loadSheet(
            "Invoices"
          ),

          loadSheet(
            "Payments"
          ),

          loadSheet(
            "Orders"
          ),

          loadSheet(
            "Digitizing"
          ),

          loadSheet(
            "Production"
          ),

          loadSheet(
            "QualityControl"
          ),
        ]);

      setInvoices(
        invoiceRows
          .map(
            normalizeInvoice
          )
          .filter(
            (
              row:
                Invoice
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
              row:
                Payment
            ) =>
              Boolean(
                row.id
              )
          )
          .sort(
            (
              a:
                Payment,
              b:
                Payment
            ) =>
              `${b.date}${b.createdAt}`.localeCompare(
                `${a.date}${a.createdAt}`
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
              row:
                Order
            ) =>
              Boolean(
                row.id
              )
          )
      );

      setDigitizingRecords(
        digitizingRows
          .map(
            normalizeDigitizing
          )
          .filter(
            (
              row:
                Digitizing
            ) =>
              Boolean(
                row.id
              )
          )
      );

      setProductionRecords(
        productionRows
          .map(
            normalizeProduction
          )
          .filter(
            (
              row:
                Production
            ) =>
              Boolean(
                row.id
              )
          )
      );

      setQualityRecords(
        qcRows
          .map(
            normalizeQC
          )
          .filter(
            (
              row:
                QualityControl
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
        "Payment loading error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to load Payments."
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
     PAYMENT TOTALS
  ======================================================= */

  function paymentsForInvoice(
    invoice:
      Invoice
  ) {
    return payments.filter(
      (
        payment
      ) =>
        (
          payment.invoiceId &&
          sameText(
            payment.invoiceId,
            invoice.id
          )
        ) ||
        (
          payment.invoiceNumber &&
          sameText(
            payment.invoiceNumber,
            invoice.invoiceNumber
          )
        )
    );
  }

  function paidAmount(
    invoice:
      Invoice
  ) {
    return paymentsForInvoice(
      invoice
    ).reduce(
      (
        total,
        payment
      ) =>
        total +
        Number(
          payment.amount ||
            0
        ),
      0
    );
  }

  function balance(
    invoice:
      Invoice
  ) {
    return Math.max(
      invoiceTotal(
        invoice
      ) -
        paidAmount(
          invoice
        ),
      0
    );
  }

  function invoicePaymentStatus(
    invoice:
      Invoice
  ) {
    const total =
      invoiceTotal(
        invoice
      );

    const paid =
      paidAmount(
        invoice
      );

    if (
      total >
        0 &&
      paid >=
        total -
          0.01
    ) {
      return "PAID";
    }

    if (
      paid >
      0
    ) {
      return "PARTIAL";
    }

    return "UNPAID";
  }

  /* =======================================================
     AGEING
  ======================================================= */

  function overdueDays(
    invoice:
      Invoice
  ) {
    if (
      balance(
        invoice
      ) <=
      0.009
    ) {
      return 0;
    }

    if (
      !invoice.dueDate
    ) {
      return 0;
    }

    const today =
      getToday();

    if (
      invoice.dueDate >=
      today
    ) {
      return 0;
    }

    return Math.max(
      daysBetween(
        invoice.dueDate,
        today
      ),
      0
    );
  }

  function ageingBucket(
    invoice:
      Invoice
  ) {
    const days =
      overdueDays(
        invoice
      );

    if (
      days <=
      0
    ) {
      return "Current";
    }

    if (
      days <=
      30
    ) {
      return "1–30 Days";
    }

    if (
      days <=
      60
    ) {
      return "31–60 Days";
    }

    if (
      days <=
      90
    ) {
      return "61–90 Days";
    }

    return "90+ Days";
  }

  /* =======================================================
     OUTSTANDING
  ======================================================= */

  const outstandingInvoices =
    useMemo(
      () =>
        invoices
          .filter(
            (
              invoice
            ) =>
              balance(
                invoice
              ) >
              0.009
          )
          .sort(
            (
              a,
              b
            ) =>
              String(
                a.dueDate ||
                  a.invoiceDate
              ).localeCompare(
                String(
                  b.dueDate ||
                    b.invoiceDate
                )
              )
          ),
      [
        invoices,
        payments,
      ]
    );

  const selectedInvoice =
    useMemo(
      () =>
        invoices.find(
          (
            invoice
          ) =>
            sameText(
              invoice.id,
              form.invoiceId
            )
        ),
      [
        invoices,
        form.invoiceId,
      ]
    );

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredPayments =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return payments.filter(
          (
            payment
          ) => {
            const methodMatches =
              methodFilter ===
                "All" ||
              payment.method ===
                methodFilter;

            const searchMatches =
              !query ||
              [
                payment.invoiceNumber,

                payment.customer,

                payment.orderNumber,

                payment.dispatchNumber,

                payment.reference,

                payment.method,

                payment.date,
              ]
                .join(
                  " "
                )
                .toLowerCase()
                .includes(
                  query
                );

            return (
              methodMatches &&
              searchMatches
            );
          }
        );
      },
      [
        payments,
        search,
        methodFilter,
      ]
    );

  /* =======================================================
     STATS
  ======================================================= */

  const statistics =
    useMemo(
      () => {
        const totalReceived =
          payments.reduce(
            (
              total,
              payment
            ) =>
              total +
              Number(
                payment.amount ||
                  0
              ),
            0
          );

        const outstanding =
          invoices.reduce(
            (
              total,
              invoice
            ) =>
              total +
              balance(
                invoice
              ),
            0
          );

        const paidInvoices =
          invoices.filter(
            (
              invoice
            ) =>
              invoicePaymentStatus(
                invoice
              ) ===
              "PAID"
          ).length;

        const overdue =
          invoices.reduce(
            (
              total,
              invoice
            ) =>
              overdueDays(
                invoice
              ) >
              0
                ? total +
                  balance(
                    invoice
                  )
                : total,
            0
          );

        return {
          totalReceived,

          outstanding,

          overdue,

          paidInvoices,

          openInvoices:
            outstandingInvoices.length,
        };
      },
      [
        payments,
        invoices,
        outstandingInvoices,
      ]
    );

  /* =======================================================
     OPEN PAYMENT
  ======================================================= */

  function openPayment(
    invoice?:
      Invoice
  ) {
    setForm({
      ...emptyForm(),

      invoiceId:
        invoice?.id ||
        "",

      date:
        getToday(),

      amount:
        invoice
          ? balance(
              invoice
            )
          : 0,
    });

    setShowForm(
      true
    );
  }

  function closePayment() {
    setShowForm(
      false
    );

    setForm(
      emptyForm()
    );
  }

  /* =======================================================
     UPDATE INVOICE STATUS
  ======================================================= */

  async function updateInvoiceStatus(
    invoice:
      Invoice,

    paymentStatus:
      | "UNPAID"
      | "PARTIAL"
      | "PAID",

    now:
      string
  ) {
    await saveExcel({
      action:
        "update",

      sheet:
        "Invoices",

      id:
        invoice.id,

      record: {
        ...invoice,

        /*
         * Excel stores invoice items as JSON text.
         */
        items:
          JSON.stringify(
            invoice.items
          ),

        status:
          paymentStatus,

        updatedAt:
          now,
      },
    });
  }

  /* =======================================================
     FULL PAYMENT → COMPLETE WORKFLOW
  ======================================================= */

  async function completeWorkflow(
    invoice:
      Invoice,

    now:
      string
  ) {
    const updates:
      Promise<any>[] =
      [];

    /* ORDER */

    orders
      .filter(
        (
          order
        ) =>
          rowBelongsToOrder(
            order,
            invoice
          )
      )
      .forEach(
        (
          order
        ) => {
          updates.push(
            saveExcel({
              action:
                "update",

              sheet:
                "Orders",

              id:
                order.id,

              record: {
                ...order,

                status:
                  "Completed",

                updatedAt:
                  now,
              },
            })
          );
        }
      );

    /* DIGITIZING */

    digitizingRecords
      .filter(
        (
          record
        ) =>
          rowBelongsToOrder(
            record,
            invoice
          )
      )
      .forEach(
        (
          record
        ) => {
          updates.push(
            saveExcel({
              action:
                "update",

              sheet:
                "Digitizing",

              id:
                record.id,

              record: {
                ...record,

                status:
                  "Completed",

                updatedAt:
                  now,
              },
            })
          );
        }
      );

    /* PRODUCTION */

    productionRecords
      .filter(
        (
          record
        ) =>
          rowBelongsToOrder(
            record,
            invoice
          )
      )
      .forEach(
        (
          record
        ) => {
          updates.push(
            saveExcel({
              action:
                "update",

              sheet:
                "Production",

              id:
                record.id,

              record: {
                ...record,

                status:
                  "Completed",

                updatedAt:
                  now,
              },
            })
          );
        }
      );

    /* QUALITY CONTROL */

    qualityRecords
      .filter(
        (
          record
        ) =>
          rowBelongsToOrder(
            record,
            invoice
          )
      )
      .forEach(
        (
          record
        ) => {
          updates.push(
            saveExcel({
              action:
                "update",

              sheet:
                "QualityControl",

              id:
                record.id,

              record: {
                ...record,

                status:
                  "Completed",

                /*
                 * Preserve QC Pass evidence.
                 */
                qcStatus:
                  record.qcStatus ||
                  "Pass",

                result:
                  record.result ||
                  "Pass",

                dispatchReady:
                  "Yes",

                updatedAt:
                  now,
              },
            })
          );
        }
      );

    await Promise.all(
      updates
    );
  }

  /* =======================================================
     SAVE PAYMENT
  ======================================================= */

  async function savePayment() {
    const invoice =
      selectedInvoice;

    if (
      !invoice
    ) {
      alert(
        "Please select an Invoice."
      );

      return;
    }

    if (
      !form.date
    ) {
      alert(
        "Payment Date is required."
      );

      return;
    }

    const amount =
      Number(
        form.amount ||
          0
      );

    if (
      amount <=
      0
    ) {
      alert(
        "Payment amount must be greater than zero."
      );

      return;
    }

    const outstanding =
      balance(
        invoice
      );

    if (
      amount >
      outstanding +
        0.01
    ) {
      alert(
        `Payment cannot exceed outstanding balance of ${money(
          outstanding
        )}.`
      );

      return;
    }

    if (
      form.method ===
        "Cheque" &&
      !form.reference.trim()
    ) {
      alert(
        "Cheque Number / Reference is required for Cheque payments."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      const now =
        getNow();

      const payment:
        Payment = {
        id:
          generateId(),

        invoiceId:
          invoice.id,

        invoiceNumber:
          invoice.invoiceNumber,

        customer:
          invoice.customer,

        customerId:
          invoice.customerId,

        orderId:
          invoice.orderId,

        orderNumber:
          invoice.orderNumber,

        dispatchId:
          invoice.dispatchId,

        dispatchNumber:
          invoice.dispatchNumber,

        date:
          form.date,

        amount,

        method:
          form.method,

        reference:
          form.reference.trim(),

        notes:
          form.notes.trim(),

        createdAt:
          now,
      };

      /* SAVE PAYMENT */

      await saveExcel({
        action:
          "add",

        sheet:
          "Payments",

        record:
          payment,
      });

      const previousPaid =
        paidAmount(
          invoice
        );

      const total =
        invoiceTotal(
          invoice
        );

      const newPaid =
        previousPaid +
        amount;

      const remaining =
        Math.max(
          total -
            newPaid,
          0
        );

      const fullyPaid =
        remaining <=
        0.01;

      const newStatus =
        fullyPaid
          ? "PAID"
          : newPaid >
            0
          ? "PARTIAL"
          : "UNPAID";

      await updateInvoiceStatus(
        invoice,

        newStatus,

        now
      );

      if (
        fullyPaid
      ) {
        await completeWorkflow(
          invoice,

          now
        );
      }

      closePayment();

      await loadData(
        true
      );

      if (
        fullyPaid
      ) {
        alert(
          `Payment saved successfully.\n\n${invoice.invoiceNumber} is fully PAID.\n\nOrder ${invoice.orderNumber || ""} and the linked workflow have been marked Completed.`
        );
      } else {
        alert(
          `Payment saved successfully.\n\nRemaining balance: ${money(
            remaining
          )}`
        );
      }
    } catch (
      error
    ) {
      console.error(
        "Payment save error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to save payment."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     DELETE PAYMENT
  ======================================================= */

  async function deletePayment(
    payment:
      Payment
  ) {
    if (
      !confirm(
        `Delete payment of ${money(
          payment.amount
        )} against ${payment.invoiceNumber}?`
      )
    ) {
      return;
    }

    try {
      setSaving(
        true
      );

      await saveExcel({
        action:
          "delete",

        sheet:
          "Payments",

        id:
          payment.id,
      });

      const invoice =
        invoices.find(
          (
            row
          ) =>
            sameText(
              row.id,
              payment.invoiceId
            ) ||
            sameText(
              row.invoiceNumber,
              payment.invoiceNumber
            )
        );

      if (
        invoice
      ) {
        const remainingPayments =
          payments.filter(
            (
              row
            ) =>
              row.id !==
                payment.id &&
              (
                sameText(
                  row.invoiceId,
                  invoice.id
                ) ||
                sameText(
                  row.invoiceNumber,
                  invoice.invoiceNumber
                )
              )
          );

        const paid =
          remainingPayments.reduce(
            (
              total,
              row
            ) =>
              total +
              Number(
                row.amount ||
                  0
              ),
            0
          );

        const total =
          invoiceTotal(
            invoice
          );

        let newStatus:
          | "UNPAID"
          | "PARTIAL"
          | "PAID" =
          "UNPAID";

        if (
          total >
            0 &&
          paid >=
            total -
              0.01
        ) {
          newStatus =
            "PAID";
        } else if (
          paid >
          0
        ) {
          newStatus =
            "PARTIAL";
        }

        await updateInvoiceStatus(
          invoice,

          newStatus,

          getNow()
        );
      }

      setSelectedPayment(
        null
      );

      await loadData(
        true
      );
    } catch (
      error
    ) {
      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to delete payment."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     RECEIPT
  ======================================================= */

  function printReceipt(
    payment:
      Payment
  ) {
    const invoice =
      invoices.find(
        (
          row
        ) =>
          sameText(
            row.id,
            payment.invoiceId
          ) ||
          sameText(
            row.invoiceNumber,
            payment.invoiceNumber
          )
      );

    const windowRef =
      window.open(
        "",
        "_blank",
        "width=800,height=900"
      );

    if (
      !windowRef
    ) {
      alert(
        "Please allow pop-ups to print the Payment Receipt."
      );

      return;
    }

    const total =
      invoice
        ? invoiceTotal(
            invoice
          )
        : 0;

    const totalPaid =
      invoice
        ? paidAmount(
            invoice
          )
        : payment.amount;

    const remaining =
      Math.max(
        total -
          totalPaid,
        0
      );

    windowRef.document.write(`
      <!doctype html>
      <html>
      <head>
        <title>Payment Receipt</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #0f172a;
          }

          h1 {
            margin-bottom: 4px;
          }

          .muted {
            color: #64748b;
          }

          .box {
            margin-top: 24px;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 24px;
          }

          .amount {
            margin: 10px 0 20px;
            font-size: 32px;
            font-weight: 800;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          td {
            padding: 10px 0;
            border-bottom: 1px solid #f1f5f9;
          }

          td:last-child {
            text-align: right;
            font-weight: 700;
          }
        </style>
      </head>

      <body>

        <h1>Payment Receipt</h1>

        <div class="muted">
          Customer Receipt
        </div>

        <div class="box">

          <div class="muted">
            Amount Received
          </div>

          <div class="amount">
            ${money(
              payment.amount
            )}
          </div>

          <table>

            <tr>
              <td>Date</td>
              <td>${formatDate(
                payment.date
              )}</td>
            </tr>

            <tr>
              <td>Customer</td>
              <td>${payment.customer || "—"}</td>
            </tr>

            <tr>
              <td>Invoice</td>
              <td>${payment.invoiceNumber || "—"}</td>
            </tr>

            <tr>
              <td>Order</td>
              <td>${payment.orderNumber || "—"}</td>
            </tr>

            <tr>
              <td>Dispatch</td>
              <td>${payment.dispatchNumber || "—"}</td>
            </tr>

            <tr>
              <td>Method</td>
              <td>${payment.method}</td>
            </tr>

            <tr>
              <td>Reference</td>
              <td>${payment.reference || "—"}</td>
            </tr>

            ${
              invoice
                ? `
                <tr>
                  <td>Invoice Total</td>
                  <td>${money(
                    total
                  )}</td>
                </tr>

                <tr>
                  <td>Total Paid</td>
                  <td>${money(
                    totalPaid
                  )}</td>
                </tr>

                <tr>
                  <td>Outstanding</td>
                  <td>${money(
                    remaining
                  )}</td>
                </tr>
                `
                : ""
            }

          </table>

          ${
            payment.notes
              ? `
                <p>
                  <strong>Notes:</strong>
                  ${payment.notes}
                </p>
                `
              : ""
          }

        </div>

        <script>
          window.onload = () => window.print();
        </script>

      </body>
      </html>
    `);

    windowRef.document.close();
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="h-full min-h-0 overflow-y-auto">

      <div className="mx-auto w-full max-w-7xl space-y-6 pb-24">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

          <div>

            <div className="mb-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
              Accounts Receivable
            </div>

            <h1 className="text-3xl font-black">
              Payments
            </h1>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Record customer receipts against Invoices,
              track partial payments, outstanding balances
              and overdue receivables.
            </p>

          </div>

          <div className="flex gap-2">

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
              className="rounded-xl border bg-white px-4 py-3 text-sm font-bold disabled:opacity-50"
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              type="button"
              onClick={() =>
                openPayment()
              }
              className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800"
            >
              + Record Payment
            </button>

          </div>

        </div>

        {/* FLOW */}

        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-blue-50 p-5">

          <div className="font-black text-slate-900">
            💲 Price Master → Order → Invoice → Payment
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Payments use the final Invoice value. The
            Invoice already contains the selling price
            frozen on the Order, so later Price Master
            changes do not affect customer balances.
          </p>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">

          <StatCard
            label="Total Received"
            value={money(
              statistics.totalReceived
            )}
            caption="All customer receipts"
            tone="green"
          />

          <StatCard
            label="Outstanding"
            value={money(
              statistics.outstanding
            )}
            caption="Customer balance due"
            tone="amber"
          />

          <StatCard
            label="Overdue"
            value={money(
              statistics.overdue
            )}
            caption="Past due balances"
            tone="rose"
          />

          <StatCard
            label="Paid Invoices"
            value={String(
              statistics.paidInvoices
            )}
            caption="Fully settled"
            tone="blue"
          />

          <StatCard
            label="Open Invoices"
            value={String(
              statistics.openInvoices
            )}
            caption="Balance still pending"
            tone="violet"
          />

        </div>

        {/* OUTSTANDING */}

        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          <div className="flex items-center justify-between border-b bg-slate-50 px-5 py-4">

            <div>

              <h2 className="font-black">
                Outstanding Invoices
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Open customer invoices including partial
                and overdue balances.
              </p>

            </div>

            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
              {
                outstandingInvoices.length
              }
            </span>

          </div>

          {loading ? (

            <div className="p-10 text-center text-slate-500">
              Loading invoices...
            </div>

          ) : outstandingInvoices.length ===
            0 ? (

            <div className="p-10 text-center">

              <div className="text-4xl">
                ✅
              </div>

              <div className="mt-3 font-black">
                No Outstanding Invoices
              </div>

              <p className="mt-1 text-sm text-slate-500">
                All current invoices are fully settled.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1150px] text-left text-sm">

                <thead>

                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                    <th className="px-4 py-4">
                      Invoice
                    </th>

                    <th className="px-4 py-4">
                      Order
                    </th>

                    <th className="px-4 py-4">
                      Customer
                    </th>

                    <th className="px-4 py-4">
                      Total
                    </th>

                    <th className="px-4 py-4">
                      Paid
                    </th>

                    <th className="px-4 py-4">
                      Balance
                    </th>

                    <th className="px-4 py-4">
                      Due
                    </th>

                    <th className="px-4 py-4">
                      Ageing
                    </th>

                    <th className="px-4 py-4">
                      Status
                    </th>

                    <th className="px-4 py-4">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {outstandingInvoices.map(
                    (
                      invoice
                    ) => {

                      const status =
                        invoicePaymentStatus(
                          invoice
                        );

                      return (

                        <tr
                          key={
                            invoice.id
                          }
                          className="border-b last:border-0 hover:bg-slate-50"
                        >

                          <td className="px-4 py-4">

                            <div className="font-black text-blue-700">
                              {
                                invoice.invoiceNumber
                              }
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                              {formatDate(
                                invoice.invoiceDate
                              )}
                            </div>

                          </td>

                          <td className="px-4 py-4">

                            <div className="font-bold">
                              {
                                invoice.orderNumber ||
                                "—"
                              }
                            </div>

                            {invoice.dispatchNumber && (

                              <div className="mt-1 text-xs text-violet-600">
                                {
                                  invoice.dispatchNumber
                                }
                              </div>

                            )}

                          </td>

                          <td className="px-4 py-4">
                            {
                              invoice.customer ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-4 font-bold">
                            {money(
                              invoiceTotal(
                                invoice
                              )
                            )}
                          </td>

                          <td className="px-4 py-4 font-bold text-green-700">
                            {money(
                              paidAmount(
                                invoice
                              )
                            )}
                          </td>

                          <td className="px-4 py-4 font-black text-orange-600">
                            {money(
                              balance(
                                invoice
                              )
                            )}
                          </td>

                          <td className="px-4 py-4">
                            {formatDate(
                              invoice.dueDate
                            )}
                          </td>

                          <td className="px-4 py-4">

                            <AgeingBadge
                              bucket={
                                ageingBucket(
                                  invoice
                                )
                              }
                              days={
                                overdueDays(
                                  invoice
                                )
                              }
                            />

                          </td>

                          <td className="px-4 py-4">

                            <PaymentStatus
                              status={
                                status
                              }
                            />

                          </td>

                          <td className="px-4 py-4">

                            <button
                              type="button"
                              onClick={() =>
                                openPayment(
                                  invoice
                                )
                              }
                              className="rounded-xl bg-green-700 px-4 py-2 text-xs font-black text-white hover:bg-green-800"
                            >
                              + Payment
                            </button>

                          </td>

                        </tr>

                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* FILTER */}

        <div className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">

          <input
            value={
              search
            }
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search invoice, order, dispatch, customer or reference..."
            className="rounded-xl border px-4 py-3"
          />

          <select
            value={
              methodFilter
            }
            onChange={(e) =>
              setMethodFilter(
                e.target.value
              )
            }
            className="rounded-xl border bg-white px-4 py-3"
          >

            <option value="All">
              All Methods
            </option>

            {PAYMENT_METHODS.map(
              (
                method
              ) => (

                <option
                  key={
                    method
                  }
                  value={
                    method
                  }
                >
                  {method}
                </option>

              )
            )}

          </select>

        </div>

        {/* PAYMENT HISTORY */}

        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          <div className="border-b px-5 py-4">

            <h2 className="font-black">
              Payment History
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Complete customer payment record.
            </p>

          </div>

          {loading ? (

            <div className="p-10 text-center text-slate-500">
              Loading payments...
            </div>

          ) : filteredPayments.length ===
            0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl">
                💳
              </div>

              <div className="mt-4 font-black">
                No Payment Records
              </div>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1100px] text-left text-sm">

                <thead>

                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                    <th className="px-4 py-4">
                      Date
                    </th>

                    <th className="px-4 py-4">
                      Invoice
                    </th>

                    <th className="px-4 py-4">
                      Order
                    </th>

                    <th className="px-4 py-4">
                      Customer
                    </th>

                    <th className="px-4 py-4">
                      Amount
                    </th>

                    <th className="px-4 py-4">
                      Method
                    </th>

                    <th className="px-4 py-4">
                      Reference
                    </th>

                    <th className="px-4 py-4">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredPayments.map(
                    (
                      payment
                    ) => (

                      <tr
                        key={
                          payment.id
                        }
                        className="border-b last:border-0 hover:bg-slate-50"
                      >

                        <td className="px-4 py-4">
                          {formatDate(
                            payment.date
                          )}
                        </td>

                        <td className="px-4 py-4 font-bold text-blue-700">
                          {
                            payment.invoiceNumber
                          }
                        </td>

                        <td className="px-4 py-4">

                          <div className="font-semibold">
                            {
                              payment.orderNumber ||
                              "—"
                            }
                          </div>

                          {payment.dispatchNumber && (

                            <div className="mt-1 text-xs text-violet-600">
                              {
                                payment.dispatchNumber
                              }
                            </div>

                          )}

                        </td>

                        <td className="px-4 py-4">
                          {
                            payment.customer ||
                            "—"
                          }
                        </td>

                        <td className="px-4 py-4 font-black text-green-700">
                          {money(
                            payment.amount
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {
                            payment.method
                          }
                        </td>

                        <td className="px-4 py-4">
                          {
                            payment.reference ||
                            "—"
                          }
                        </td>

                        <td className="px-4 py-4">

                          <div className="flex gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPayment(
                                  payment
                                )
                              }
                              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                printReceipt(
                                  payment
                                )
                              }
                              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                            >
                              Receipt
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void deletePayment(
                                  payment
                                )
                              }
                              disabled={
                                saving
                              }
                              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-50"
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

      {/* =================================================
          PAYMENT MODAL
      ================================================= */}

      {showForm && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">

          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">

            <div className="my-8 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex items-start justify-between border-b px-6 py-5">

                <div>

                  <div className="text-xs font-black uppercase tracking-wide text-emerald-600">
                    Customer Receipt
                  </div>

                  <h2 className="mt-1 text-2xl font-black">
                    Record Payment
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Record a full or partial receipt
                    against an outstanding Invoice.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closePayment
                  }
                  disabled={
                    saving
                  }
                  className="text-3xl text-slate-400"
                >
                  ×
                </button>

              </div>

              <div className="space-y-6 p-6">

                {/* INVOICE */}

                <Section
                  title="Invoice"
                  description="Only invoices with an outstanding balance are available."
                >

                  <Field
                    label="Invoice *"
                    caption="Select the customer Invoice receiving payment."
                  >

                    <select
                      value={
                        form.invoiceId
                      }
                      onChange={(e) => {
                        const id =
                          e.target.value;

                        const invoice =
                          invoices.find(
                            (
                              row
                            ) =>
                              row.id ===
                              id
                          );

                        setForm(
                          (
                            current
                          ) => ({
                            ...current,

                            invoiceId:
                              id,

                            amount:
                              invoice
                                ? balance(
                                    invoice
                                  )
                                : 0,
                          })
                        );
                      }}
                      className="w-full rounded-xl border bg-white px-4 py-3"
                    >

                      <option value="">
                        Select Invoice
                      </option>

                      {outstandingInvoices.map(
                        (
                          invoice
                        ) => (

                          <option
                            key={
                              invoice.id
                            }
                            value={
                              invoice.id
                            }
                          >
                            {
                              invoice.invoiceNumber
                            }

                            {" — "}

                            {
                              invoice.customer
                            }

                            {" — Balance "}

                            {money(
                              balance(
                                invoice
                              )
                            )}
                          </option>

                        )
                      )}

                    </select>

                  </Field>

                </Section>

                {/* INVOICE SUMMARY */}

                {selectedInvoice && (

                  <>

                    <div className="grid gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:grid-cols-2 lg:grid-cols-3">

                      <Info
                        label="Customer"
                        value={
                          selectedInvoice.customer
                        }
                      />

                      <Info
                        label="Order"
                        value={
                          selectedInvoice.orderNumber
                        }
                      />

                      <Info
                        label="Dispatch"
                        value={
                          selectedInvoice.dispatchNumber ||
                          "—"
                        }
                      />

                      <Info
                        label="Invoice Total"
                        value={money(
                          invoiceTotal(
                            selectedInvoice
                          )
                        )}
                      />

                      <Info
                        label="Already Paid"
                        value={money(
                          paidAmount(
                            selectedInvoice
                          )
                        )}
                      />

                      <Info
                        label="Outstanding"
                        value={money(
                          balance(
                            selectedInvoice
                          )
                        )}
                      />

                      <Info
                        label="Due Date"
                        value={formatDate(
                          selectedInvoice.dueDate
                        )}
                      />

                      <Info
                        label="Ageing"
                        value={
                          ageingBucket(
                            selectedInvoice
                          )
                        }
                      />

                      <Info
                        label="Status"
                        value={
                          invoicePaymentStatus(
                            selectedInvoice
                          )
                        }
                      />

                    </div>

                    {overdueDays(
                      selectedInvoice
                    ) >
                      0 && (

                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">

                        ⚠ Invoice is overdue by{" "}

                        {overdueDays(
                          selectedInvoice
                        )}

                        {" "}

                        day
                        {overdueDays(
                          selectedInvoice
                        ) ===
                        1
                          ? ""
                          : "s"}.

                      </div>

                    )}

                  </>

                )}

                {/* PAYMENT */}

                <Section
                  title="Payment Details"
                  description="Enter the amount and customer receipt information."
                >

                  <div className="grid gap-5 sm:grid-cols-2">

                    <Field
                      label="Payment Date *"
                      caption="Date payment was received."
                    >

                      <input
                        type="date"
                        value={
                          form.date
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,

                            date:
                              e.target.value,
                          })
                        }
                        className="w-full rounded-xl border px-4 py-3"
                      />

                    </Field>

                    <Field
                      label="Amount *"
                      caption="Partial payments are allowed. Payment cannot exceed the outstanding balance."
                    >

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        max={
                          selectedInvoice
                            ? balance(
                                selectedInvoice
                              )
                            : undefined
                        }
                        value={
                          form.amount
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,

                            amount:
                              Number(
                                e.target.value
                              ),
                          })
                        }
                        className="w-full rounded-xl border px-4 py-3"
                      />

                    </Field>

                    <Field
                      label="Payment Method"
                      caption="How the customer paid."
                    >

                      <select
                        value={
                          form.method
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,

                            method:
                              e.target
                                .value as PaymentMethod,
                          })
                        }
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      >

                        {PAYMENT_METHODS.map(
                          (
                            method
                          ) => (

                            <option
                              key={
                                method
                              }
                              value={
                                method
                              }
                            >
                              {
                                method
                              }
                            </option>

                          )
                        )}

                      </select>

                    </Field>

                    <Field
                      label={
                        form.method ===
                        "Cheque"
                          ? "Cheque Number *"
                          : "Reference"
                      }
                      caption="UPI reference, bank transaction number, cheque number or other receipt reference."
                    >

                      <input
                        value={
                          form.reference
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,

                            reference:
                              e.target.value,
                          })
                        }
                        className="w-full rounded-xl border px-4 py-3"
                      />

                    </Field>

                  </div>

                  <div className="mt-5">

                    <Field
                      label="Notes"
                      caption="Optional payment or reconciliation comments."
                    >

                      <textarea
                        value={
                          form.notes
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,

                            notes:
                              e.target.value,
                          })
                        }
                        className="min-h-24 w-full rounded-xl border px-4 py-3"
                      />

                    </Field>

                  </div>

                </Section>

                {/* BALANCE AFTER */}

                {selectedInvoice &&
                  form.amount >
                    0 && (

                  <div className="grid gap-4 sm:grid-cols-2">

                    <SummaryBox
                      label="Balance Before Payment"
                      value={money(
                        balance(
                          selectedInvoice
                        )
                      )}
                    />

                    <SummaryBox
                      label="Balance After Payment"
                      value={money(
                        Math.max(
                          balance(
                            selectedInvoice
                          ) -
                            Number(
                              form.amount ||
                                0
                            ),
                          0
                        )
                      )}
                      emphasis={
                        balance(
                          selectedInvoice
                        ) -
                          Number(
                            form.amount ||
                              0
                          ) <=
                        0.01
                      }
                    />

                  </div>

                )}

                {/* FULL PAYMENT */}

                {selectedInvoice &&
                  form.amount >
                    0 &&
                  balance(
                    selectedInvoice
                  ) -
                    Number(
                      form.amount
                    ) <=
                    0.01 && (

                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

                    <div className="font-black text-green-900">
                      ✓ Full Payment
                    </div>

                    <p className="mt-2 text-sm leading-6 text-green-700">
                      Saving this payment will mark the
                      Invoice as PAID and close the linked
                      Order, Digitizing, Production and
                      Quality Control workflow.
                    </p>

                  </div>

                )}

              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-3 border-t px-6 py-4">

                <button
                  type="button"
                  onClick={
                    closePayment
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border px-5 py-3 font-bold disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void savePayment()
                  }
                  disabled={
                    saving ||
                    !selectedInvoice
                  }
                  className="rounded-xl bg-emerald-700 px-6 py-3 font-black text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Payment"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* =================================================
          VIEW PAYMENT
      ================================================= */}

      {selectedPayment && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">

          <div className="flex min-h-full items-start justify-center p-4">

            <div className="my-8 w-full max-w-xl rounded-2xl bg-white shadow-2xl">

              <div className="flex items-start justify-between border-b px-6 py-5">

                <div>

                  <div className="text-xs font-black uppercase text-emerald-600">
                    Payment Receipt
                  </div>

                  <h2 className="mt-1 text-2xl font-black">
                    {money(
                      selectedPayment.amount
                    )}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      selectedPayment.invoiceNumber
                    }
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedPayment(
                      null
                    )
                  }
                  className="text-3xl text-slate-400"
                >
                  ×
                </button>

              </div>

              <div className="grid gap-3 p-6 sm:grid-cols-2">

                <InfoCard
                  label="Date"
                  value={formatDate(
                    selectedPayment.date
                  )}
                />

                <InfoCard
                  label="Method"
                  value={
                    selectedPayment.method
                  }
                />

                <InfoCard
                  label="Customer"
                  value={
                    selectedPayment.customer
                  }
                />

                <InfoCard
                  label="Invoice"
                  value={
                    selectedPayment.invoiceNumber
                  }
                />

                <InfoCard
                  label="Order"
                  value={
                    selectedPayment.orderNumber
                  }
                />

                <InfoCard
                  label="Dispatch"
                  value={
                    selectedPayment.dispatchNumber ||
                    "—"
                  }
                />

                <InfoCard
                  label="Reference"
                  value={
                    selectedPayment.reference ||
                    "—"
                  }
                />

                <InfoCard
                  label="Amount"
                  value={money(
                    selectedPayment.amount
                  )}
                />

              </div>

              {selectedPayment.notes && (

                <div className="mx-6 mb-6 rounded-xl border bg-slate-50 p-4">

                  <div className="text-xs font-black uppercase text-slate-400">
                    Notes
                  </div>

                  <div className="mt-2 whitespace-pre-wrap text-sm">
                    {
                      selectedPayment.notes
                    }
                  </div>

                </div>

              )}

              <div className="flex justify-end gap-3 border-t px-6 py-4">

                <button
                  type="button"
                  onClick={() =>
                    printReceipt(
                      selectedPayment
                    )
                  }
                  className="rounded-xl bg-blue-50 px-5 py-3 font-bold text-blue-700"
                >
                  Print Receipt
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedPayment(
                      null
                    )
                  }
                  className="rounded-xl border px-5 py-3 font-bold"
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

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

  description:
    string;

  children:
    ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-slate-50/50 p-5">

      <h3 className="font-black">
        {title}
      </h3>

      <p className="mb-5 mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>

      {children}

    </section>
  );
}

function Field({
  label,
  caption,
  children,
}: {
  label:
    string;

  caption:
    string;

  children:
    ReactNode;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-bold">
        {label}
      </label>

      {children}

      <p className="mt-1.5 text-xs leading-5 text-slate-400">
        {caption}
      </p>

    </div>
  );
}

function Info({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div>

      <div className="text-xs text-slate-500">
        {label}
      </div>

      <div className="mt-1 break-words font-black">
        {value ||
          "—"}
      </div>

    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-xl border bg-slate-50 p-4">

      <div className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 break-words font-black">
        {value ||
          "—"}
      </div>

    </div>
  );
}

function SummaryBox({
  label,
  value,
  emphasis = false,
}: {
  label:
    string;

  value:
    string;

  emphasis?:
    boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        emphasis
          ? "border-emerald-200 bg-emerald-50"
          : "bg-white"
      }`}
    >

      <div className="text-xs font-black uppercase text-slate-400">
        {label}
      </div>

      <div
        className={`mt-1 text-xl font-black ${
          emphasis
            ? "text-emerald-700"
            : "text-slate-900"
        }`}
      >
        {value}
      </div>

    </div>
  );
}

function StatCard({
  label,
  value,
  caption,
  tone,
}: {
  label:
    string;

  value:
    string;

  caption:
    string;

  tone:
    | "green"
    | "amber"
    | "rose"
    | "blue"
    | "violet";
}) {
  const styles = {
    green:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50",

    amber:
      "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50",

    rose:
      "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-50",

    blue:
      "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50",

    violet:
      "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50",
  };

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        styles[
          tone
        ]
      }`}
    >

      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-2xl font-black">
        {value}
      </div>

      <div className="mt-1 text-xs text-slate-500">
        {caption}
      </div>

    </div>
  );
}

function PaymentStatus({
  status,
}: {
  status:
    | "UNPAID"
    | "PARTIAL"
    | "PAID";
}) {
  const style =
    status ===
    "PAID"
      ? "bg-green-100 text-green-700"
      : status ===
        "PARTIAL"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${style}`}
    >
      {status}
    </span>
  );
}

function AgeingBadge({
  bucket,
  days,
}: {
  bucket:
    string;

  days:
    number;
}) {
  const style =
    days <=
    0
      ? "bg-emerald-100 text-emerald-700"
      : days <=
        30
      ? "bg-amber-100 text-amber-700"
      : days <=
        60
      ? "bg-orange-100 text-orange-700"
      : "bg-red-100 text-red-700";

  return (
    <div>

      <span
        className={`rounded-full px-3 py-1 text-xs font-black ${style}`}
      >
        {bucket}
      </span>

      {days >
        0 && (

        <div className="mt-1 text-[11px] font-semibold text-red-500">
          {days} days overdue
        </div>

      )}

    </div>
  );
}
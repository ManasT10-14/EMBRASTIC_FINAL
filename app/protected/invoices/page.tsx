"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  type AppSettings,
} from "@/lib/app-settings";

/* =========================================================
   TYPES
========================================================= */

type InvoiceStatus =
  | "UNPAID"
  | "PARTIAL"
  | "PAID";

type OrderItem = {
  id: string;

  itemType: string;
  description: string;

  designName: string;
  embroideryService: string;
  placement: string;

  color: string;
  size: string;

  quantity: number;
  unit: string;

  customerSku: string;

  unitPrice: number;

  [key: string]: any;
};
type Order = {
  id: string;
  orderNumber: string;

  customerId: string;
  customerName: string;

  orderDate: string;
  deliveryDate: string;

  items: string;
  orderItems: string;

  subtotal: number;
  discount: number;
  gstPercent: number;
  totalAmount: number;

  status: string;

  notes: string;

  createdAt: string;

  [key: string]: any;
};

type Dispatch = {
  id: string;

  dispatchNumber: string;

  orderId: string;
  orderNumber: string;
  orderItemId: string;

  customerId: string;
  customerName: string;

  workOrderId: string;
  workOrderNumber: string;

  productionId: string;
  productionNumber: string;

  qualityControlId: string;
  qcNumber: string;

  designName: string;

  itemDescription: string;

  garmentColor: string;
  garmentSize: string;

  qcPassedQuantity: number;
  dispatchQuantity: number;

  dispatchDate: string;

  courierName: string;
  trackingNumber: string;

  shippingMode: string;

  deliveryAddress: string;

  status: string;

  createdAt: string;
  updatedAt: string;

  [key: string]: any;
};

type InvoiceItem = {
  description: string;
  quantity: number;
  rate: number;
};

type Payment = {
  id: string;

  invoiceId: string;
  invoiceNumber: string;

  customer: string;
  customerId: string;

  orderId: string;
  orderNumber: string;

  date: string;

  amount: number;

  method: string;
  reference: string;

  notes: string;

  createdAt: string;

  [key: string]: any;
};

type Invoice = {
  id: string;

  invoiceNumber: string;

  customer: string;
  customerId: string;

  orderNumber: string;
  orderId: string;

  dispatchId: string;
  dispatchNumber: string;

  workOrderId: string;
  workOrderNumber: string;

  productionId: string;
  productionNumber: string;

  qualityControlId: string;
  qcNumber: string;

  dispatchStatus: string;
  dispatchDate: string;

  courierName: string;
  trackingNumber: string;

  invoiceDate: string;
  dueDate: string;

  items: InvoiceItem[];

  discount: number;
  gstPercent: number;

  notes: string;

  status: string;

  createdAt: string;
  updatedAt: string;

  payments: Payment[];

  [key: string]: any;
};

type InvoiceForm = {
  dispatchId: string;
  orderId: string;

  invoiceDate: string;
  dueDate: string;

  discount: number;
  gstPercent: number;

  notes: string;
};

/* =========================================================
   DISPATCH STATUSES

   IMPORTANT:
   ALL of these remain visible for invoicing.
========================================================= */

const DISPATCH_STATUSES = [
  "Preparing",
  "Dispatched",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Delivery Failed",
  "Returned",
  "Cancelled",
];

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

function sameValue(
  value1: unknown,
  value2: unknown
) {
  const first =
    normalizeText(value1);

  const second =
    normalizeText(value2);

  return Boolean(
    first &&
      second &&
      first === second
  );
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

function dateOnly(
  value: unknown
) {
  const text =
    clean(value);

  return text
    ? text.split("T")[0]
    : "";
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

function addDays(
  date: string,
  days: number
) {
  if (!date) {
    return "";
  }

  const value =
    new Date(
      `${date}T00:00:00`
    );

  if (
    Number.isNaN(
      value.getTime()
    )
  ) {
    return date;
  }

  value.setDate(
    value.getDate() +
      Number(
        days || 0
      )
  );

  return value
    .toISOString()
    .split("T")[0];
}

function generateId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `invoice-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function money(
  value: number,
  symbol = "₹"
) {
  return `${symbol}${Number(
    value || 0
  ).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatDate(
  value: string
) {
  if (!value) {
    return "—";
  }

  const raw =
    value.split("T")[0];

  const parts =
    raw.split("-");

  if (
    parts.length !== 3
  ) {
    return raw;
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

/* =========================================================
   PARSE ORDER ITEMS
========================================================= */

function normalizeOrderItem(
  item: any
): OrderItem {
  return {
    ...item,

    id:
      clean(
        item?.id
      ),

    itemType:
      clean(
        item?.itemType ??
          item?.type
      ),

    description:
      clean(
        item?.description ??
          item?.itemName ??
          item?.item ??
          item?.name
      ),

    designName:
      clean(
        item?.designName
      ),

    embroideryService:
      clean(
        item?.embroideryService ??
          item?.service
      ),

    placement:
      clean(
        item?.placement
      ),

    color:
      clean(
        item?.color ??
          item?.colour
      ),

    size:
      clean(
        item?.size
      ),

    quantity:
      numberValue(
        item?.quantity
      ),

    unit:
      clean(
        item?.unit
      ) || "pcs",

    customerSku:
      clean(
        item?.customerSku ??
          item?.customerSKU
      ),

    unitPrice:
      numberValue(
        item?.unitPrice ??
          item?.rate ??
          item?.sellingPrice ??
          item?.price
      ),
  };
}

function parseOrderItems(
  value: unknown
): OrderItem[] {
  /*
   * Order data has existed in a few shapes across the workbook/API:
   * - an array
   * - a JSON string containing an array
   * - a double-encoded JSON string
   * - an object containing items/orderItems
   *
   * Keep this parser deliberately tolerant so Invoice never loses valid
   * Order lines just because one alias is empty or encoded differently.
   */
  if (Array.isArray(value)) {
    return value
      .map(normalizeOrderItem)
      .filter(item =>
        Boolean(
          item.description ||
            item.itemType ||
            item.designName ||
            item.embroideryService ||
            item.id
        )
      );
  }

  if (value && typeof value === "object") {
    const objectValue = value as any;

    const nestedOrderItems = parseOrderItems(
      objectValue.orderItems
    );
    if (nestedOrderItems.length > 0) {
      return nestedOrderItems;
    }

    const nestedItems = parseOrderItems(
      objectValue.items
    );
    if (nestedItems.length > 0) {
      return nestedItems;
    }

    // Some APIs return a single order-line object instead of an array.
    const single = normalizeOrderItem(objectValue);
    return Boolean(
      single.description ||
        single.itemType ||
        single.designName ||
        single.embroideryService ||
        single.id
    )
      ? [single]
      : [];
  }

  const text = clean(value);
  if (!text) {
    return [];
  }

  try {
    const parsed = JSON.parse(text);

    // Recursion also handles double-encoded JSON strings.
    return parseOrderItems(parsed);
  } catch {
    return [];
  }
}

function orderItemDescription(
  item: OrderItem
) {
  const primary =
    item.description ||
    item.itemType ||
    "Order Item";

  const details = [
    item.embroideryService,
    item.placement,
    item.designName,
    item.color
      ? `Colour: ${item.color}`
      : "",
    item.size
      ? `Size: ${item.size}`
      : "",
    item.customerSku
      ? `SKU: ${item.customerSku}`
      : "",
  ].filter(Boolean);

  return details.length > 0
    ? `${primary} - ${details.join(" - ")}`
    : primary;
}

/* =========================================================
   INVOICE ITEMS
========================================================= */

function normalizeInvoiceItems(
  value: unknown
): InvoiceItem[] {
  if (
    Array.isArray(value)
  ) {
    return value.map(
      (item: any) => ({
        description:
          clean(
            item?.description ??
              item?.itemName ??
              item?.name
          ),

        quantity:
          numberValue(
            item?.quantity
          ),

        rate:
          numberValue(
            item?.rate ??
              item?.sellingPrice ??
              item?.unitPrice ??
              item?.price
          ),
      })
    );
  }

  const text =
    clean(value);

  if (!text) {
    return [];
  }

  try {
    return normalizeInvoiceItems(
      JSON.parse(text)
    );
  } catch {
    return [];
  }
}

/* =========================================================
   NORMALIZE ORDER
========================================================= */

function normalizeOrder(
  row: any
): Order {
  /*
   * Orders in the workbook have used both "items" and
   * "orderItems" over time. Read either one and normalize
   * both aliases to the same serialized list.
   */
  /*
   * IMPORTANT: do not use `row.items ?? row.orderItems` here.
   * An empty string / "[]" in `items` is not nullish, so it used to hide
   * valid lines stored in `orderItems`. Parse both aliases independently
   * and keep the first one that actually contains Order lines.
   */
  const itemsFromOrderItems =
    parseOrderItems(
      row?.orderItems
    );

  const itemsFromItems =
    parseOrderItems(
      row?.items
    );

  const parsedItems =
    itemsFromOrderItems.length > 0
      ? itemsFromOrderItems
      : itemsFromItems;

  const serializedItems =
    JSON.stringify(
      parsedItems
    );

  return {
    ...row,

    id:
      clean(row?.id),

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

    orderDate:
      dateOnly(
        row?.orderDate
      ),

    deliveryDate:
      dateOnly(
        row?.deliveryDate
      ),

    items:
      serializedItems,

    orderItems:
      serializedItems,

    subtotal:
      numberValue(
        row?.subtotal
      ),

    discount:
      numberValue(
        row?.discount
      ),

    gstPercent:
      numberValue(
        row?.gstPercent ??
          18
      ),

    totalAmount:
      numberValue(
        row?.totalAmount ??
          row?.orderValue
      ),

    status:
      clean(
        row?.status
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

/* =========================================================
   NORMALIZE DISPATCH
========================================================= */

function normalizeDispatch(
  row: any
): Dispatch {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    dispatchNumber:
      clean(
        row?.dispatchNumber
      ),

    orderId:
      clean(
        row?.orderId
      ),

    orderNumber:
      clean(
        row?.orderNumber
      ),

    orderItemId:
      clean(
        row?.orderItemId
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

    workOrderId:
      clean(
        row?.workOrderId
      ),

    workOrderNumber:
      clean(
        row?.workOrderNumber
      ),

    productionId:
      clean(
        row?.productionId
      ),

    productionNumber:
      clean(
        row?.productionNumber
      ),

    qualityControlId:
      clean(
        row?.qualityControlId
      ),

    qcNumber:
      clean(
        row?.qcNumber
      ),

    designName:
      clean(
        row?.designName
      ),

    itemDescription:
      clean(
        row?.itemDescription
      ),

    garmentColor:
      clean(
        row?.garmentColor
      ),

    garmentSize:
      clean(
        row?.garmentSize
      ),

    qcPassedQuantity:
      numberValue(
        row?.qcPassedQuantity
      ),

    dispatchQuantity:
      numberValue(
        row?.dispatchQuantity ??
          row?.dispatchedQuantity ??
          row?.quantityDispatched ??
          row?.dispatchedQty ??
          row?.qty ??
          row?.quantity
      ),

    dispatchDate:
      dateOnly(
        row?.dispatchDate
      ),

    courierName:
      clean(
        row?.courierName
      ),

    trackingNumber:
      clean(
        row?.trackingNumber
      ),

    shippingMode:
      clean(
        row?.shippingMode
      ),

    deliveryAddress:
      clean(
        row?.deliveryAddress
      ),

    status:
      clean(
        row?.status
      ) ||
      "Preparing",

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

/* =========================================================
   NORMALIZE PAYMENT
========================================================= */

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

    date:
      dateOnly(
        row?.date ??
          row?.paymentDate
      ),

    amount:
      numberValue(
        row?.amount
      ),

    method:
      clean(
        row?.method ??
          row?.paymentMethod
      ),

    reference:
      clean(
        row?.reference ??
          row?.transactionReference
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

/* =========================================================
   NORMALIZE INVOICE
========================================================= */

function normalizeInvoice(
  row: any,
  payments: Payment[]
): Invoice {
  const id =
    clean(
      row?.id
    );

  const invoiceNumber =
    clean(
      row?.invoiceNumber
    );

  return {
    ...row,

    id,

    invoiceNumber,

    customer:
      clean(
        row?.customer ??
          row?.customerName
      ),

    customerId:
      clean(
        row?.customerId
      ),

    orderNumber:
      clean(
        row?.orderNumber
      ),

    orderId:
      clean(
        row?.orderId
      ),

    dispatchId:
      clean(
        row?.dispatchId
      ),

    dispatchNumber:
      clean(
        row?.dispatchNumber
      ),

    workOrderId:
      clean(
        row?.workOrderId
      ),

    workOrderNumber:
      clean(
        row?.workOrderNumber
      ),

    productionId:
      clean(
        row?.productionId
      ),

    productionNumber:
      clean(
        row?.productionNumber
      ),

    qualityControlId:
      clean(
        row?.qualityControlId
      ),

    qcNumber:
      clean(
        row?.qcNumber
      ),

    dispatchStatus:
      clean(
        row?.dispatchStatus
      ),

    dispatchDate:
      dateOnly(
        row?.dispatchDate
      ),

    courierName:
      clean(
        row?.courierName
      ),

    trackingNumber:
      clean(
        row?.trackingNumber
      ),

    invoiceDate:
      dateOnly(
        row?.invoiceDate
      ),

    dueDate:
      dateOnly(
        row?.dueDate
      ),

    items:
      normalizeInvoiceItems(
        row?.items
      ),

    discount:
      numberValue(
        row?.discount
      ),

    gstPercent:
      numberValue(
        row?.gstPercent ??
          18
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

    payments:
      payments.filter(
        payment =>
          sameValue(
            payment.invoiceId,
            id
          ) ||
          (
            invoiceNumber &&
            sameValue(
              payment.invoiceNumber,
              invoiceNumber
            )
          )
      ),
  };
}

/* =========================================================
   CALCULATIONS
========================================================= */

function invoiceSubtotal(
  invoice: Invoice
) {
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

function invoiceTaxable(
  invoice: Invoice
) {
  return Math.max(
    invoiceSubtotal(
      invoice
    ) -
      invoiceDiscount(
        invoice
      ),
    0
  );
}

function invoiceGST(
  invoice: Invoice
) {
  return (
    invoiceTaxable(
      invoice
    ) *
    Number(
      invoice.gstPercent ||
        0
    )
  ) / 100;
}

function invoiceTotal(
  invoice: Invoice
) {
  return (
    invoiceTaxable(
      invoice
    ) +
    invoiceGST(
      invoice
    )
  );
}

function invoicePaid(
  invoice: Invoice
) {
  return invoice.payments.reduce(
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

function invoiceBalance(
  invoice: Invoice
) {
  return Math.max(
    invoiceTotal(
      invoice
    ) -
      invoicePaid(
        invoice
      ),
    0
  );
}

function calculateInvoiceStatus(
  invoice: Invoice
): InvoiceStatus {
  const total =
    invoiceTotal(
      invoice
    );

  const paid =
    invoicePaid(
      invoice
    );

  if (
    total > 0 &&
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

/* =========================================================
   PAGE
========================================================= */

export default function InvoicesPage() {
  const [
    invoices,
    setInvoices,
  ] =
    useState<
      Invoice[]
    >([]);

  const [
    orders,
    setOrders,
  ] =
    useState<
      Order[]
    >([]);

  const [
    dispatches,
    setDispatches,
  ] =
    useState<
      Dispatch[]
    >([]);

  const [
    appSettings,
    setAppSettings,
  ] =
    useState<AppSettings>(
      DEFAULT_APP_SETTINGS
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
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState(
      "All"
    );

  const [
    dispatchStatusFilter,
    setDispatchStatusFilter,
  ] =
    useState(
      "All"
    );

  const [
    showForm,
    setShowForm,
  ] =
    useState(
      false
    );

  const [
    viewing,
    setViewing,
  ] =
    useState<
      Invoice | null
    >(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<
      InvoiceForm
    >({
      dispatchId: "",
      orderId: "",

      invoiceDate: "",
      dueDate: "",

      discount: 0,
      gstPercent: 18,

      notes: "",
    });

  const [
    items,
    setItems,
  ] =
    useState<
      InvoiceItem[]
    >([
      {
        description:
          "",

        quantity:
          1,

        rate:
          0,
      },
    ]);

  /* =======================================================
     LOAD
  ======================================================= */

  useEffect(
    () => {
      void loadData();
    },
    []
  );

  useEffect(
    () => {
      if (
        !showForm &&
        !viewing
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
      viewing,
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
      any = {};

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
      any = {};

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
          "Unable to process Invoice request."
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
        orderRows,
        dispatchRows,
        invoiceRows,
        paymentRows,
        settings,
      ] =
        await Promise.all([
          loadSheet(
            "Orders"
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

          loadAppSettings(),
        ]);

      const loadedOrders =
        orderRows
          .map(
            normalizeOrder
          )
          .filter(
            (
              order:
                Order
            ) =>
              Boolean(
                order.id ||
                  order.orderNumber
              )
          );

      const loadedDispatches =
        dispatchRows
          .map(
            normalizeDispatch
          )
          .filter(
            (
              dispatch:
                Dispatch
            ) =>
              Boolean(
                dispatch.id ||
                  dispatch.dispatchNumber
              )
          );

      const loadedPayments =
        paymentRows
          .map(
            normalizePayment
          )
          .filter(
            (
              payment:
                Payment
            ) =>
              Boolean(
                payment.id
              )
          );

      const loadedInvoices =
        invoiceRows
          .map(
            (row: any) =>
              normalizeInvoice(
                row,
                loadedPayments
              )
          )
          .filter(
            (
              invoice:
                Invoice
            ) =>
              Boolean(
                invoice.id
              )
          )
          .sort(
            (
              a,
              b
            ) =>
              String(
                b.createdAt ||
                  b.invoiceDate
              ).localeCompare(
                String(
                  a.createdAt ||
                    a.invoiceDate
                )
              )
          );

      setOrders(
        loadedOrders
      );

      setDispatches(
        loadedDispatches
      );

      setInvoices(
        loadedInvoices
      );

      setAppSettings(
        settings
      );
    } catch (
      error
    ) {
      console.error(
        "Invoices load error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to load Invoices."
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
     AVAILABLE DISPATCHES

     MAIN FIX:
     NO dispatch status is excluded.

     Preparing
     Dispatched
     In Transit
     Out for Delivery
     Delivered
     Delivery Failed
     Returned
     Cancelled

     ALL remain visible.

     We only require:
     1. Dispatch quantity > 0
     2. Dispatch not already invoiced
  ======================================================= */

  /* =======================================================
   AVAILABLE DISPATCHES

   IMPORTANT:
   Every Dispatch remains visible until it is invoiced.

   We DO NOT filter by:
   - Preparing
   - Dispatched
   - In Transit
   - Out for Delivery
   - Delivered
   - Delivery Failed
   - Returned
   - Cancelled

   We also DO NOT hide records here because of quantity.

   Quantity is checked only when the Invoice is actually
   saved.
======================================================= */

const availableDispatches =
  useMemo(
    () => {
      return dispatches
        .filter(
          dispatch => {
            const alreadyInvoiced =
              invoices.some(
                invoice =>
                  (
                    dispatch.id &&
                    sameValue(
                      invoice.dispatchId,
                      dispatch.id
                    )
                  ) ||
                  (
                    dispatch.dispatchNumber &&
                    sameValue(
                      invoice.dispatchNumber,
                      dispatch.dispatchNumber
                    )
                  )
              );

            return !alreadyInvoiced;
          }
        )
        .sort(
          (
            a,
            b
          ) =>
            String(
              b.dispatchDate ||
                b.createdAt
            ).localeCompare(
              String(
                a.dispatchDate ||
                  a.createdAt
              )
            )
        );
    },
    [
      dispatches,
      invoices,
    ]
  );
/* =======================================================
   DISPLAYED DISPATCHES

   Status only controls what is displayed.
   It does NOT determine invoice eligibility.
======================================================= */

const displayedDispatches =
  useMemo(
    () =>
      availableDispatches.filter(
        dispatch =>
          dispatchStatusFilter ===
            "All" ||
          normalizeText(
            dispatch.status
          ) ===
            normalizeText(
              dispatchStatusFilter
            )
      ),
    [
      availableDispatches,
      dispatchStatusFilter,
    ]
  );
  /* =======================================================
     SELECTED DISPATCH
  ======================================================= */

  const selectedDispatch =
    useMemo(
      () =>
        dispatches.find(
          dispatch =>
            sameValue(
              dispatch.id,
              form.dispatchId
            )
        ),
      [
        dispatches,
        form.dispatchId,
      ]
    );

  /* =======================================================
     SELECTED ORDER
  ======================================================= */

  const selectedOrder =
    useMemo(
      () => {
        if (
          !form.orderId &&
          !selectedDispatch
        ) {
          return undefined;
        }

        return orders.find(
          order =>
            (
              form.orderId &&
              sameValue(
                order.id,
                form.orderId
              )
            ) ||
            (
              selectedDispatch?.orderId &&
              sameValue(
                order.id,
                selectedDispatch.orderId
              )
            ) ||
            (
              selectedDispatch?.orderNumber &&
              sameValue(
                order.orderNumber,
                selectedDispatch.orderNumber
              )
            )
        );
      },
      [
        orders,
        form.orderId,
        selectedDispatch,
      ]
    );

  /* =======================================================
     CURRENT TOTAL
  ======================================================= */

  const currentSubtotal =
    useMemo(
      () =>
        items.reduce(
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
        ),
      [
        items,
      ]
    );

  const currentTaxable =
    Math.max(
      currentSubtotal -
        Number(
          form.discount ||
            0
        ),
      0
    );

  const currentGST =
    (
      currentTaxable *
      Number(
        form.gstPercent ||
          0
      )
    ) /
    100;

  const currentTotal =
    currentTaxable +
    currentGST;

  /* =======================================================
     RESET
  ======================================================= */

  function resetForm() {
    const today =
      getToday();

    setForm({
      dispatchId:
        "",

      orderId:
        "",

      invoiceDate:
        today,

      dueDate:
        addDays(
          today,
          7
        ),

      discount:
        0,

      gstPercent:
        18,

      notes:
        "",
    });

    setItems([
      {
        description:
          "Embroidery Service",

        quantity:
          1,

        rate:
          0,
      },
    ]);

    setDispatchStatusFilter(
      "All"
    );
  }

  async function openCreate() {
    try {
      /*
       * Always load fresh Orders, Dispatches,
       * Invoices and Payments before showing
       * the Create Invoice screen.
       */
      await loadData(
        true
      );

      resetForm();

      setShowForm(
        true
      );
    } catch (
      error
    ) {
      console.error(
        "Unable to refresh Dispatch records:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to refresh Dispatch records."
      );
    }
  }

  function closeForm() {
    setShowForm(
      false
    );

    resetForm();
  }

  /* =======================================================
     DISPATCH CHANGE
  ======================================================= */

  function handleDispatchChange(
    dispatchId: string
  ) {
    const dispatch =
      dispatches.find(
        row =>
          sameValue(
            row.id,
            dispatchId
          )
      );

    if (
      !dispatch
    ) {
      setForm(
        old => ({
          ...old,

          dispatchId:
            "",

          orderId:
            "",
        })
      );

      setItems([
        {
          description:
            "",

          quantity:
            1,

          rate:
            0,
        },
      ]);

      return;
    }

    const order =
      orders.find(
        row =>
          (
            dispatch.orderId &&
            sameValue(
              row.id,
              dispatch.orderId
            )
          ) ||
          (
            dispatch.orderNumber &&
            sameValue(
              row.orderNumber,
              dispatch.orderNumber
            )
          )
      );

    setForm(
      old => ({
        ...old,

        dispatchId:
          dispatch.id,

        orderId:
          order?.id ||
          dispatch.orderId ||
          "",

        /*
         * Invoice commercial values are driven by the Order.
         */
        discount:
          Number(
            order?.discount ||
              0
          ),

        gstPercent:
          Number(
            order?.gstPercent ||
              18
          ),
      })
    );

    if (
      !order
    ) {
      setItems([
        {
          description:
            dispatch.itemDescription ||
            dispatch.designName ||
            "Order Item",

          quantity:
            Math.max(
              Number(
                dispatch.dispatchQuantity ||
                  0
              ),
              1
            ),

          rate:
            0,
        },
      ]);

      return;
    }

    /* =====================================================
       FETCH INVOICE ITEMS DIRECTLY FROM THE ORDER

       The Order is the commercial source of truth for:
       - description
       - embroidery service
       - placement
       - design
       - colour / size
       - quantity
       - selling rate / unit price
    ===================================================== */

    const orderItems =
      parseOrderItems(
        order.items ||
          order.orderItems
      );

    if (
      orderItems.length ===
      0
    ) {
      setItems([
        {
          description:
            dispatch.itemDescription ||
            dispatch.designName ||
            `Order ${order.orderNumber}`,

          quantity:
            Math.max(
              Number(
                dispatch.dispatchQuantity ||
                  0
              ),
              1
            ),

          rate:
            0,
        },
      ]);

      return;
    }

    /*
     * If the Dispatch points to a specific Order line,
     * invoice that exact Order item and use the dispatched
     * quantity for that line.
     */
    const linkedOrderItem =
      orderItems.find(
        item =>
          dispatch.orderItemId &&
          sameValue(
            item.id,
            dispatch.orderItemId
          )
      );

    if (
      linkedOrderItem
    ) {
      setItems([
        {
          description:
            orderItemDescription(
              linkedOrderItem
            ),

          quantity:
            Math.max(
              Number(
                dispatch.dispatchQuantity ||
                  0
              ),
              1
            ),

          rate:
            Number(
              linkedOrderItem.unitPrice ||
                0
            ),
        },
      ]);

      return;
    }

    /*
     * If the Dispatch is linked only at Order level, fetch
     * every Order line into the Invoice. No invoice item is
     * manually invented here.
     */
    setItems(
      orderItems.map(
        item => ({
          description:
            orderItemDescription(
              item
            ),

          quantity:
            Math.max(
              Number(
                item.quantity ||
                  0
              ),
              1
            ),

          rate:
            Number(
              item.unitPrice ||
                0
            ),
        })
      )
    );
  }

  /* =======================================================
     ITEM FUNCTIONS
  ======================================================= */

  function addItem() {
    setItems(
      old => [
        ...old,

        {
          description:
            "",

          quantity:
            1,

          rate:
            0,
        },
      ]
    );
  }

  function removeItem(
    index: number
  ) {
    if (
      items.length <=
      1
    ) {
      return;
    }

    setItems(
      old =>
        old.filter(
          (
            _,
            itemIndex
          ) =>
            itemIndex !==
            index
        )
    );
  }

  function updateItem(
    index: number,
    field:
      keyof InvoiceItem,
    value:
      string | number
  ) {
    setItems(
      old =>
        old.map(
          (
            item,
            itemIndex
          ) =>
            itemIndex ===
            index
              ? {
                  ...item,

                  [field]:
                    field ===
                    "description"
                      ? String(
                          value
                        )
                      : Number(
                          value
                        ),
                }
              : item
        )
    );
  }

  /* =======================================================
     NEXT INVOICE NUMBER
  ======================================================= */

  function nextInvoiceNumber(
    source:
      Invoice[]
  ) {
    const year =
      new Date()
        .getFullYear();

    const prefix =
      `INV-${year}-`;

    let highest =
      0;

    source.forEach(
      invoice => {
        if (
          !invoice.invoiceNumber.startsWith(
            prefix
          )
        ) {
          return;
        }

        const match =
          invoice.invoiceNumber.match(
            /(\d+)$/
          );

        if (
          match
        ) {
          highest =
            Math.max(
              highest,
              Number(
                match[1]
              )
            );
        }
      }
    );

    return `${prefix}${String(
      highest +
        1
    ).padStart(
      4,
      "0"
    )}`;
  }

  /* =======================================================
     CREATE INVOICE

     IMPORTANT:
     NO dispatch-status rejection exists here.
  ======================================================= */

  async function createInvoice() {
    const dispatch =
      selectedDispatch;

    if (
      !dispatch
    ) {
      alert(
        "Please select a Dispatch."
      );

      return;
    }

    const order =
      selectedOrder;

    if (
      !order
    ) {
      alert(
        "The Order linked to this Dispatch could not be found."
      );

      return;
    }

    /*
     * STATUS IS NOT USED TO REJECT THE RECORD.
     *
     * Preparing
     * Dispatched
     * In Transit
     * Out for Delivery
     * Delivered
     * Delivery Failed
     * Returned
     * Cancelled
     *
     * can all remain visible / invoiceable.
     */

    /*
     * Older Dispatch rows may not contain dispatchQuantity
     * even though the Dispatch itself is valid.
     *
     * Do not block Invoice creation merely because the
     * Dispatch quantity field is blank/zero. The Invoice
     * quantities are fetched from the linked Order.
     */
    const recordedDispatchQuantity =
      Number(
        dispatch.dispatchQuantity ||
          0
      );

    if (
      invoices.some(
        invoice =>
          (
            dispatch.id &&
            sameValue(
              invoice.dispatchId,
              dispatch.id
            )
          ) ||
          (
            dispatch.dispatchNumber &&
            sameValue(
              invoice.dispatchNumber,
              dispatch.dispatchNumber
            )
          )
      )
    ) {
      alert(
        `An Invoice already exists for ${dispatch.dispatchNumber}.`
      );

      return;
    }

    if (
      !form.invoiceDate
    ) {
      alert(
        "Invoice Date is required."
      );

      return;
    }

    if (
      !form.dueDate
    ) {
      alert(
        "Due Date is required."
      );

      return;
    }

    if (
      form.dueDate <
      form.invoiceDate
    ) {
      alert(
        "Due Date cannot be before Invoice Date."
      );

      return;
    }

    if (
      items.some(
        item =>
          !item.description.trim()
      )
    ) {
      alert(
        "Every Invoice item requires a description."
      );

      return;
    }

    if (
      items.some(
        item =>
          Number(
            item.quantity
          ) <=
          0
      )
    ) {
      alert(
        "Invoice Item Quantity must be greater than zero."
      );

      return;
    }

    const invoicedQuantity =
      items.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.quantity ||
              0
          ),
        0
      );

    /*
     * If a Dispatch quantity is actually recorded, protect
     * against invoicing more than that quantity.
     *
     * If the older Dispatch record has no quantity value,
     * use the Order-derived Invoice items and allow save.
     */
    if (
      recordedDispatchQuantity >
        0 &&
      invoicedQuantity >
        recordedDispatchQuantity
    ) {
      alert(
        `Invoice quantity cannot exceed Dispatch Quantity of ${recordedDispatchQuantity}.`
      );

      return;
    }

    if (
      items.some(
        item =>
          Number(
            item.rate
          ) <
          0
      )
    ) {
      alert(
        "Invoice Item Rate cannot be negative."
      );

      return;
    }

    if (
      Number(
        form.discount
      ) >
      currentSubtotal
    ) {
      alert(
        "Discount cannot exceed Subtotal."
      );

      return;
    }

    if (
      currentTotal <=
      0
    ) {
      alert(
        "Invoice Total must be greater than zero."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      /*
       * Reload live invoices immediately before save
       * to protect against duplicate Dispatch invoicing.
       */
      const [
        liveInvoiceRows,
        paymentRows,
      ] =
        await Promise.all([
          loadSheet(
            "Invoices"
          ),

          loadSheet(
            "Payments"
          ),
        ]);

      const livePayments =
        paymentRows.map(
          normalizePayment
        );

      const liveInvoices =
        liveInvoiceRows
          .map(
            (row: any) =>
              normalizeInvoice(
                row,
                livePayments
              )
          )
          .filter(
            (
              invoice:
                Invoice
            ) =>
              Boolean(
                invoice.id
              )
          );

      const duplicate =
        liveInvoices.find(
          invoice =>
            (
              dispatch.id &&
              sameValue(
                invoice.dispatchId,
                dispatch.id
              )
            ) ||
            (
              dispatch.dispatchNumber &&
              sameValue(
                invoice.dispatchNumber,
                dispatch.dispatchNumber
              )
            )
        );

      if (
        duplicate
      ) {
        throw new Error(
          `${dispatch.dispatchNumber} is already invoiced as ${duplicate.invoiceNumber}.`
        );
      }

      const now =
        getNow();

      const invoiceNumber =
        nextInvoiceNumber(
          liveInvoices
        );

      const record = {
        id:
          generateId(),

        invoiceNumber,

        customer:
          order.customerName ||
          dispatch.customerName,

        customerId:
          order.customerId ||
          dispatch.customerId,

        orderNumber:
          order.orderNumber,

        orderId:
          order.id,

        dispatchId:
          dispatch.id,

        dispatchNumber:
          dispatch.dispatchNumber,

        workOrderId:
          dispatch.workOrderId,

        workOrderNumber:
          dispatch.workOrderNumber,

        productionId:
          dispatch.productionId,

        productionNumber:
          dispatch.productionNumber,

        qualityControlId:
          dispatch.qualityControlId,

        qcNumber:
          dispatch.qcNumber,

        /*
         * Snapshot Dispatch details on Invoice.
         */
        dispatchStatus:
          dispatch.status,

        dispatchDate:
          dispatch.dispatchDate,

        courierName:
          dispatch.courierName,

        trackingNumber:
          dispatch.trackingNumber,

        invoiceDate:
          form.invoiceDate,

        dueDate:
          form.dueDate,

        items:
          JSON.stringify(
            items.map(
              item => ({
                description:
                  item.description.trim(),

                quantity:
                  Number(
                    item.quantity
                  ),

                rate:
                  Number(
                    item.rate
                  ),
              })
            )
          ),

        discount:
          Number(
            form.discount
          ),

        gstPercent:
          Number(
            form.gstPercent
          ),

        subtotal:
          currentSubtotal,

        taxableAmount:
          currentTaxable,

        taxAmount:
          currentGST,

        totalAmount:
          currentTotal,

        paidAmount:
          0,

        outstandingAmount:
          currentTotal,

        notes:
          form.notes.trim(),

        status:
          "UNPAID",

        createdAt:
          now,

        updatedAt:
          now,
      };

      await saveExcel({
        action:
          "add",

        sheet:
          "Invoices",

        record,
      });

      closeForm();

      await loadData(
        true
      );

      alert(
        `${invoiceNumber} created successfully for ${dispatch.dispatchNumber}.\n\nDispatch Status: ${dispatch.status}`
      );
    } catch (
      error
    ) {
      console.error(
        "Invoice save error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to create Invoice."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function deleteInvoice(
    invoice:
      Invoice
  ) {
    if (
      invoice.payments.length >
      0
    ) {
      alert(
        "This Invoice has Payments and cannot be deleted."
      );

      return;
    }

    if (
      !confirm(
        `Delete ${invoice.invoiceNumber}?`
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
          "Invoices",

        id:
          invoice.id,
      });

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
          : "Unable to delete Invoice."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     FILTERED INVOICE REGISTER
  ======================================================= */

  const filteredInvoices =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return invoices.filter(
          invoice => {
            const status =
              calculateInvoiceStatus(
                invoice
              );

            const statusOK =
              statusFilter ===
                "All" ||
              status ===
                statusFilter;

            const text =
              [
                invoice.invoiceNumber,
                invoice.customer,
                invoice.orderNumber,
                invoice.dispatchNumber,
                invoice.dispatchStatus,
                invoice.trackingNumber,
                invoice.status,
              ]
                .join(" ")
                .toLowerCase();

            return (
              statusOK &&
              (
                !query ||
                text.includes(
                  query
                )
              )
            );
          }
        );
      },
      [
        invoices,
        search,
        statusFilter,
      ]
    );

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statistics =
    useMemo(
      () => {
        const invoiced =
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

        const received =
          invoices.reduce(
            (
              total,
              invoice
            ) =>
              total +
              invoicePaid(
                invoice
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
              invoiceBalance(
                invoice
              ),
            0
          );

        const paid =
          invoices.filter(
            invoice =>
              calculateInvoiceStatus(
                invoice
              ) ===
              "PAID"
          ).length;

        return {
          invoiced,
          received,
          outstanding,
          paid,
        };
      },
      [
        invoices,
      ]
    );

  /* =======================================================
     PRINT
  ======================================================= */

  function printInvoice(
    invoice:
      Invoice
  ) {
    const popup =
      window.open(
        "",
        "_blank",
        "width=900,height=950"
      );

    if (
      !popup
    ) {
      alert(
        "Please allow pop-ups to print the Invoice."
      );

      return;
    }

    const symbol =
      appSettings.currencySymbol ||
      "₹";

    const itemRows =
      invoice.items
        .map(
          (
            item,
            index
          ) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td style="text-align:right">${money(
                item.rate,
                symbol
              )}</td>
              <td style="text-align:right">${money(
                item.quantity *
                  item.rate,
                symbol
              )}</td>
            </tr>
          `
        )
        .join("");

    popup.document.write(`
      <!doctype html>

      <html>
        <head>
          <title>${invoice.invoiceNumber}</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              color: #0f172a;
              margin: 40px;
            }

            h1 {
              margin: 0;
            }

            .muted {
              color: #64748b;
            }

            .header {
              display: flex;
              justify-content: space-between;
              gap: 30px;
              margin-bottom: 30px;
            }

            .box {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 20px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            th,
            td {
              border-bottom: 1px solid #e2e8f0;
              padding: 10px;
              text-align: left;
            }

            th {
              background: #f8fafc;
            }

            .totals {
              width: 360px;
              margin-left: auto;
              margin-top: 20px;
            }

            .totals td:last-child {
              text-align: right;
              font-weight: bold;
            }
          </style>
        </head>

        <body>

          <div class="header">

            <div>
              <h1>INVOICE</h1>
              <div class="muted">${invoice.invoiceNumber}</div>
            </div>

            <div style="text-align:right">
              <strong>${invoice.customer}</strong><br/>
              Order: ${invoice.orderNumber}<br/>
              Dispatch: ${invoice.dispatchNumber}<br/>
              Dispatch Status: ${invoice.dispatchStatus || "—"}
            </div>

          </div>

          <div class="box">

            Invoice Date:
            <strong>${formatDate(invoice.invoiceDate)}</strong>

            &nbsp;&nbsp;&nbsp;

            Due Date:
            <strong>${formatDate(invoice.dueDate)}</strong>

          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Qty</th>
                <th style="text-align:right">Rate</th>
                <th style="text-align:right">Amount</th>
              </tr>
            </thead>

            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <table class="totals">

            <tr>
              <td>Subtotal</td>
              <td>${money(
                invoiceSubtotal(
                  invoice
                ),
                symbol
              )}</td>
            </tr>

            <tr>
              <td>Discount</td>
              <td>-${money(
                invoiceDiscount(
                  invoice
                ),
                symbol
              )}</td>
            </tr>

            <tr>
              <td>GST (${invoice.gstPercent}%)</td>
              <td>${money(
                invoiceGST(
                  invoice
                ),
                symbol
              )}</td>
            </tr>

            <tr>
              <td><strong>Total</strong></td>
              <td><strong>${money(
                invoiceTotal(
                  invoice
                ),
                symbol
              )}</strong></td>
            </tr>

            <tr>
              <td>Paid</td>
              <td>${money(
                invoicePaid(
                  invoice
                ),
                symbol
              )}</td>
            </tr>

            <tr>
              <td>Balance</td>
              <td>${money(
                invoiceBalance(
                  invoice
                ),
                symbol
              )}</td>
            </tr>

          </table>

          ${
            invoice.notes
              ? `
                <div class="box">
                  <strong>Notes</strong><br/><br/>
                  ${invoice.notes}
                </div>
              `
              : ""
          }

          <script>
            window.onload = () => window.print();
          </script>

        </body>
      </html>
    `);

    popup.document.close();
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="h-full min-h-0 overflow-y-auto">

      <div className="mx-auto w-full max-w-7xl space-y-6 pb-24">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>

            <div className="mb-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
              Customer Billing
            </div>

            <h1 className="text-3xl font-black">
              Invoices
            </h1>

            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
              Create customer Invoices from Dispatch
              records and track billed, collected and
              outstanding amounts.
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
                void openCreate()
              }
              className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800"
            >
              + Create Invoice
            </button>

          </div>

        </div>

        {/* WORKFLOW NOTICE */}

        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-emerald-50 p-5">

          <div className="font-black text-blue-900">
            🧾 Dispatch → Invoice → Payment
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Dispatch records remain available for
            invoicing regardless of their current
            delivery status. A Dispatch disappears
            from the Create Invoice list only after
            it has already been invoiced.
          </p>

        </div>

        {/* STATS */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            label="Total Invoiced"
            value={money(
              statistics.invoiced,
              appSettings.currencySymbol ||
                "₹"
            )}
            tone="blue"
          />

          <StatCard
            label="Received"
            value={money(
              statistics.received,
              appSettings.currencySymbol ||
                "₹"
            )}
            tone="green"
          />

          <StatCard
            label="Outstanding"
            value={money(
              statistics.outstanding,
              appSettings.currencySymbol ||
                "₹"
            )}
            tone="amber"
          />

          <StatCard
            label="Paid Invoices"
            value={String(
              statistics.paid
            )}
            tone="violet"
          />

        </div>

        {/* FILTER */}

        <div className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">

          <input
            value={
              search
            }
            onChange={e =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search invoice, customer, order, dispatch or delivery status..."
            className="rounded-xl border px-4 py-3"
          />

          <select
            value={
              statusFilter
            }
            onChange={e =>
              setStatusFilter(
                e.target.value
              )
            }
            className="rounded-xl border bg-white px-4 py-3"
          >

            <option value="All">
              All Payment Statuses
            </option>

            <option value="UNPAID">
              UNPAID
            </option>

            <option value="PARTIAL">
              PARTIAL
            </option>

            <option value="PAID">
              PAID
            </option>

          </select>

        </div>

        {/* TABLE */}

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          {loading ? (

            <div className="p-10 text-center text-slate-500">
              Loading Invoices...
            </div>

          ) : filteredInvoices.length ===
            0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl">
                🧾
              </div>

              <h2 className="mt-4 text-xl font-black">
                No Invoices Found
              </h2>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1250px] text-left text-sm">

                <thead>

                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                    <th className="px-4 py-4">
                      Invoice
                    </th>

                    <th className="px-4 py-4">
                      Customer
                    </th>

                    <th className="px-4 py-4">
                      Order
                    </th>

                    <th className="px-4 py-4">
                      Dispatch
                    </th>

                    <th className="px-4 py-4">
                      Delivery Status
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
                      Payment Status
                    </th>

                    <th className="px-4 py-4">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredInvoices.map(
                    invoice => (

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

                        <td className="px-4 py-4 font-bold">
                          {
                            invoice.customer
                          }
                        </td>

                        <td className="px-4 py-4 font-bold">
                          {
                            invoice.orderNumber
                          }
                        </td>

                        <td className="px-4 py-4">

                          <div className="font-bold text-cyan-700">
                            {
                              invoice.dispatchNumber ||
                              "—"
                            }
                          </div>

                          {invoice.trackingNumber && (

                            <div className="mt-1 text-xs text-slate-400">
                              {
                                invoice.trackingNumber
                              }
                            </div>

                          )}

                        </td>

                        <td className="px-4 py-4">

                          <DispatchStatusBadge
                            status={
                              invoice.dispatchStatus ||
                              dispatches.find(
                                dispatch =>
                                  sameValue(
                                    dispatch.id,
                                    invoice.dispatchId
                                  )
                              )?.status ||
                              "—"
                            }
                          />

                        </td>

                        <td className="px-4 py-4 font-black">
                          {money(
                            invoiceTotal(
                              invoice
                            ),
                            appSettings.currencySymbol ||
                              "₹"
                          )}
                        </td>

                        <td className="px-4 py-4 font-bold text-green-700">
                          {money(
                            invoicePaid(
                              invoice
                            ),
                            appSettings.currencySymbol ||
                              "₹"
                          )}
                        </td>

                        <td className="px-4 py-4 font-black text-orange-600">
                          {money(
                            invoiceBalance(
                              invoice
                            ),
                            appSettings.currencySymbol ||
                              "₹"
                          )}
                        </td>

                        <td className="px-4 py-4">

                          <InvoiceStatusBadge
                            status={
                              calculateInvoiceStatus(
                                invoice
                              )
                            }
                          />

                        </td>

                        <td className="px-4 py-4">

                          <div className="flex gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setViewing(
                                  invoice
                                )
                              }
                              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                printInvoice(
                                  invoice
                                )
                              }
                              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                            >
                              Print
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void deleteInvoice(
                                  invoice
                                )
                              }
                              disabled={
                                saving ||
                                invoice.payments.length >
                                  0
                              }
                              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-40"
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

        </div>

      </div>

      {/* =================================================
          CREATE INVOICE
      ================================================= */}

      {showForm && (

        <ModalOverlay>

          <div className="my-5 flex max-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

            <ModalHeader
              title="Create Invoice"
              caption="Customer Billing"
              onClose={
                closeForm
              }
            />

            <div className="min-h-0 flex-1 overflow-y-auto p-6">

              <div className="space-y-6">

                {/* DISPATCH */}

                <Section
  title="Dispatch"
  description="Select any Dispatch that has not already been invoiced. Delivery status does not prevent invoicing."
>

  <div className="grid gap-5 md:grid-cols-[260px_1fr]">

    {/* =========================================
        STATUS FILTER
    ========================================= */}

    <Field
      label="Delivery Status Filter"
      caption="Optional filter only. All statuses remain invoiceable."
    >

      <select
        value={
          dispatchStatusFilter
        }
        onChange={e => {
          setDispatchStatusFilter(
            e.target.value
          );

          setForm(
            current => ({
              ...current,

              dispatchId:
                "",

              orderId:
                "",
            })
          );
        }}
        className="w-full rounded-xl border bg-white px-4 py-3"
      >

        <option value="All">
          All Dispatch Statuses
        </option>

        {DISPATCH_STATUSES.map(
          status => (

            <option
              key={
                status
              }
              value={
                status
              }
            >
              {status}
            </option>

          )
        )}

      </select>

    </Field>

    {/* =========================================
        DISPATCH
    ========================================= */}

    <Field
      label="Dispatch *"
      caption={`${displayedDispatches.length} Dispatch record(s) available.`}
    >

      <select
        value={
          form.dispatchId
        }
        onChange={e =>
          handleDispatchChange(
            e.target.value
          )
        }
        className="w-full rounded-xl border bg-white px-4 py-3"
      >

        <option value="">
          Select Dispatch
        </option>

        {displayedDispatches.map(
          dispatch => (

            <option
              key={
                dispatch.id ||
                dispatch.dispatchNumber
              }
              value={
                dispatch.id
              }
            >
              {dispatch.dispatchNumber ||
                "Dispatch"}

              {" — "}

              {dispatch.orderNumber ||
                "No Order"}

              {" — "}

              {dispatch.customerName ||
                "No Customer"}

              {" — "}

              {dispatch.status ||
                "No Status"}

              {" — Qty "}

              {Number(
                dispatch.dispatchQuantity
              ) > 0
                ? dispatch.dispatchQuantity
                : "Order Qty"}
            </option>

          )
        )}

      </select>

    </Field>

  </div>

  {/* =========================================
      DIAGNOSTIC COUNTS
  ========================================= */}

  <div className="mt-4 flex flex-wrap gap-2">

    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
      Dispatch Sheet: {dispatches.length}
    </span>

    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
      Not Invoiced: {availableDispatches.length}
    </span>

    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
      Visible: {displayedDispatches.length}
    </span>

  </div>

  {/* =========================================
      EMPTY STATE
  ========================================= */}

  {dispatches.length ===
    0 && (

    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">

      <div className="font-black text-red-700">
        No Dispatch records were loaded
      </div>

      <p className="mt-1 text-sm text-red-600">
        The Invoice page received zero rows from
        the Dispatch sheet.
      </p>

    </div>

  )}

  {dispatches.length >
    0 &&
    displayedDispatches.length ===
      0 && (

    <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">

      <div className="font-black text-orange-700">
        No Dispatch available for this filter
      </div>

      <p className="mt-1 text-sm text-orange-600">
        Dispatch records exist, but none are
        currently visible for the selected status
        or they have already been invoiced.
      </p>

    </div>

  )}

</Section>

                {/* DATES */}

                <Section
                  title="Invoice Details"
                  description="Set Invoice date, payment due date and GST."
                >

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

                    <Field
                      label="Invoice Date *"
                      caption="Customer billing date."
                    >

                      <input
                        type="date"
                        value={
                          form.invoiceDate
                        }
                        onChange={e =>
                          setForm({
                            ...form,

                            invoiceDate:
                              e.target.value,
                          })
                        }
                        className="w-full rounded-xl border px-4 py-3"
                      />

                    </Field>

                    <Field
                      label="Due Date *"
                      caption="Customer payment due date."
                    >

                      <input
                        type="date"
                        value={
                          form.dueDate
                        }
                        onChange={e =>
                          setForm({
                            ...form,

                            dueDate:
                              e.target.value,
                          })
                        }
                        className="w-full rounded-xl border px-4 py-3"
                      />

                    </Field>

                    <Field
                      label="Discount"
                      caption="Invoice-level discount before GST."
                    >

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          form.discount
                        }
                        onChange={e =>
                          setForm({
                            ...form,

                            discount:
                              Number(
                                e.target.value
                              ),
                          })
                        }
                        className="w-full rounded-xl border px-4 py-3"
                      />

                    </Field>

                    <Field
                      label="GST %"
                      caption="Invoice GST percentage."
                    >

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          form.gstPercent
                        }
                        onChange={e =>
                          setForm({
                            ...form,

                            gstPercent:
                              Number(
                                e.target.value
                              ),
                          })
                        }
                        className="w-full rounded-xl border px-4 py-3"
                      />

                    </Field>

                  </div>

                </Section>

                {/* ITEMS */}

                <Section
                  title="Invoice Items"
                  description="Items, descriptions, quantities and selling rates are fetched from the linked Order. If the Dispatch points to one Order line, that exact line is used."
                >

                  <div className="space-y-4">

                    {items.map(
                      (
                        item,
                        index
                      ) => (

                        <div
                          key={
                            index
                          }
                          className="grid gap-4 rounded-xl border bg-white p-4 md:grid-cols-[1fr_150px_180px_160px_auto]"
                        >

                          <Field
                            label="Description"
                            caption="Item / service being billed."
                          >

                            <input
                              value={
                                item.description
                              }
                              readOnly
                              className="w-full rounded-xl border bg-slate-50 px-3 py-2.5 font-semibold text-slate-700"
                            />

                          </Field>

                          <Field
                            label="Quantity"
                            caption="Billing quantity."
                          >

                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={
                                item.quantity
                              }
                              readOnly
                              className="w-full rounded-xl border bg-slate-50 px-3 py-2.5 font-semibold text-slate-700"
                            />

                          </Field>

                          <Field
                            label="Rate"
                            caption="Selling rate."
                          >

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                item.rate
                              }
                              readOnly
                              className="w-full rounded-xl border bg-slate-50 px-3 py-2.5 font-semibold text-slate-700"
                            />

                          </Field>

                          <Info
                            label="Amount"
                            value={money(
                              item.quantity *
                                item.rate,
                              appSettings.currencySymbol ||
                                "₹"
                            )}
                          />

                          <div className="self-center rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-black text-emerald-700">
                            From Order
                          </div>

                        </div>

                      )
                    )}

                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs font-semibold text-blue-700">
                      Invoice items are linked to the selected Order. Update the Order if the commercial item, quantity or selling rate needs to change.
                    </div>

                  </div>

                </Section>

                {/* TOTAL */}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

                  <Info
                    label="Subtotal"
                    value={money(
                      currentSubtotal,
                      appSettings.currencySymbol ||
                        "₹"
                    )}
                  />

                  <Info
                    label="Discount"
                    value={money(
                      form.discount,
                      appSettings.currencySymbol ||
                        "₹"
                    )}
                  />

                  <Info
                    label="Taxable"
                    value={money(
                      currentTaxable,
                      appSettings.currencySymbol ||
                        "₹"
                    )}
                  />

                  <Info
                    label="GST"
                    value={money(
                      currentGST,
                      appSettings.currencySymbol ||
                        "₹"
                    )}
                  />

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                    <div className="text-[10px] font-black uppercase text-emerald-600">
                      Invoice Total
                    </div>

                    <div className="mt-1 text-xl font-black text-emerald-800">
                      {money(
                        currentTotal,
                        appSettings.currencySymbol ||
                          "₹"
                      )}
                    </div>

                  </div>

                </div>

                <Field
                  label="Notes"
                  caption="Payment terms, customer instructions or internal notes."
                >

                  <textarea
                    value={
                      form.notes
                    }
                    onChange={e =>
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

            </div>

            {/* FOOTER */}

            <div className="flex shrink-0 justify-end gap-3 border-t bg-white px-6 py-4">

              <button
                type="button"
                onClick={
                  closeForm
                }
                disabled={
                  saving
                }
                className="rounded-xl border px-5 py-3 font-bold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void createInvoice()
                }
                disabled={
                  saving ||
                  !selectedDispatch
                }
                className="rounded-xl bg-blue-700 px-6 py-3 font-black text-white disabled:opacity-40"
              >
                {saving
                  ? "Creating..."
                  : "Create Invoice"}
              </button>

            </div>

          </div>

        </ModalOverlay>

      )}

      {/* =================================================
          VIEW INVOICE
      ================================================= */}

      {viewing && (

        <ModalOverlay>

          <div className="my-8 max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <ModalHeader
              title={
                viewing.invoiceNumber
              }
              caption="Invoice"
              onClose={() =>
                setViewing(
                  null
                )
              }
            />

            <div className="space-y-6 p-6">

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                <Info
                  label="Customer"
                  value={
                    viewing.customer
                  }
                />

                <Info
                  label="Order"
                  value={
                    viewing.orderNumber
                  }
                />

                <Info
                  label="Dispatch"
                  value={
                    viewing.dispatchNumber ||
                    "—"
                  }
                />

                <div className="rounded-xl border bg-white p-4">

                  <div className="text-[10px] font-black uppercase text-slate-400">
                    Dispatch Status
                  </div>

                  <div className="mt-2">

                    <DispatchStatusBadge
                      status={
                        viewing.dispatchStatus ||
                        dispatches.find(
                          dispatch =>
                            sameValue(
                              dispatch.id,
                              viewing.dispatchId
                            )
                        )?.status ||
                        "—"
                      }
                    />

                  </div>

                </div>

                <Info
                  label="Invoice Date"
                  value={formatDate(
                    viewing.invoiceDate
                  )}
                />

                <Info
                  label="Due Date"
                  value={formatDate(
                    viewing.dueDate
                  )}
                />

                <Info
                  label="Invoice Total"
                  value={money(
                    invoiceTotal(
                      viewing
                    ),
                    appSettings.currencySymbol ||
                      "₹"
                  )}
                />

                <Info
                  label="Balance"
                  value={money(
                    invoiceBalance(
                      viewing
                    ),
                    appSettings.currencySymbol ||
                      "₹"
                  )}
                />

              </div>

              <div className="overflow-x-auto rounded-xl border">

                <table className="w-full min-w-[650px] text-left text-sm">

                  <thead>

                    <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                      <th className="px-4 py-3">
                        Description
                      </th>

                      <th className="px-4 py-3">
                        Qty
                      </th>

                      <th className="px-4 py-3">
                        Rate
                      </th>

                      <th className="px-4 py-3">
                        Amount
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {viewing.items.map(
                      (
                        item,
                        index
                      ) => (

                        <tr
                          key={
                            index
                          }
                          className="border-b last:border-0"
                        >

                          <td className="px-4 py-3">
                            {
                              item.description
                            }
                          </td>

                          <td className="px-4 py-3 font-bold">
                            {
                              item.quantity
                            }
                          </td>

                          <td className="px-4 py-3">
                            {money(
                              item.rate,
                              appSettings.currencySymbol ||
                                "₹"
                            )}
                          </td>

                          <td className="px-4 py-3 font-black">
                            {money(
                              item.quantity *
                                item.rate,
                              appSettings.currencySymbol ||
                                "₹"
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

              <div className="flex justify-end">

                <button
                  type="button"
                  onClick={() =>
                    printInvoice(
                      viewing
                    )
                  }
                  className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white"
                >
                  Print Invoice
                </button>

              </div>

            </div>

          </div>

        </ModalOverlay>

      )}

    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function ModalOverlay({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      {children}
    </div>
  );
}

function ModalHeader({
  title,
  caption,
  onClose,
}: {
  title:
    string;

  caption:
    string;

  onClose:
    () => void;
}) {
  return (
    <div className="flex shrink-0 items-start justify-between border-b px-6 py-5">

      <div>

        <div className="text-xs font-black uppercase tracking-wide text-blue-600">
          {caption}
        </div>

        <h2 className="mt-1 text-2xl font-black">
          {title}
        </h2>

      </div>

      <button
        type="button"
        onClick={
          onClose
        }
        className="text-3xl text-slate-400 hover:text-slate-700"
      >
        ×
      </button>

    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title:
    string;

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
    <div className="rounded-xl border bg-white p-4">

      <div className="text-[10px] font-black uppercase text-slate-400">
        {label}
      </div>

      <div className="mt-1 break-words text-sm font-black">
        {value ||
          "—"}
      </div>

    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label:
    string;

  value:
    string;

  tone:
    | "blue"
    | "green"
    | "amber"
    | "violet";
}) {
  const styles = {
    blue:
      "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50",

    green:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50",

    amber:
      "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50",

    violet:
      "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-purple-50",
  };

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${styles[tone]}`}
    >

      <div className="text-xs font-bold uppercase text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-2xl font-black">
        {value}
      </div>

    </div>
  );
}

function InvoiceStatusBadge({
  status,
}: {
  status:
    InvoiceStatus;
}) {
  const style =
    status ===
    "PAID"
      ? "bg-green-100 text-green-700"
      : status ===
        "PARTIAL"
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${style}`}
    >
      {status}
    </span>
  );
}

function DispatchStatusBadge({
  status,
}: {
  status:
    string;
}) {
  const normalized =
    normalizeText(
      status
    );

  let style =
    "bg-slate-100 text-slate-700";

  if (
    normalized ===
    "preparing"
  ) {
    style =
      "bg-slate-100 text-slate-700";
  } else if (
    normalized ===
    "dispatched"
  ) {
    style =
      "bg-blue-100 text-blue-700";
  } else if (
    normalized ===
      "in transit" ||
    normalized ===
      "out for delivery"
  ) {
    style =
      "bg-amber-100 text-amber-700";
  } else if (
    normalized ===
    "delivered"
  ) {
    style =
      "bg-emerald-100 text-emerald-700";
  } else if (
    normalized ===
      "delivery failed" ||
    normalized ===
      "returned"
  ) {
    style =
      "bg-red-100 text-red-700";
  } else if (
    normalized ===
    "cancelled"
  ) {
    style =
      "bg-slate-200 text-slate-600";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${style}`}
    >
      {status ||
        "—"}
    </span>
  );
}
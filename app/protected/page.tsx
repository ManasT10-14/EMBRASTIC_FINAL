"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  type AppSettings,
} from "@/lib/app-settings";

/* =========================================================
   TYPES
========================================================= */

type Customer = {
  id: string;
  name: string;
  businessName: string;
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

  totalAmount: number;

  status: string;

  createdAt: string;
};

type Artwork = {
  id: string;

  orderId: string;
  orderNumber: string;

  customerName: string;

  designName: string;

  status: string;

  createdAt: string;
};

type Digitizing = {
  id: string;

  digitizingNumber: string;

  orderId: string;
  orderNumber: string;

  customerName: string;

  designName: string;

  status: string;

  createdAt: string;
};

type Production = {
  id: string;

  productionNumber: string;

  orderId: string;
  orderNumber: string;

  customerName: string;

  designName: string;

  productionQuantity: number;

  status: string;

  createdAt: string;
};

type QualityControl = {
  id: string;

  qcNumber: string;

  productionId: string;

  orderId: string;
  orderNumber: string;

  customerName: string;

  qcStatus: string;

  status: string;
  result: string;

  dispatchReady: string;

  createdAt: string;
};

type DispatchRecord = {
  id: string;

  dispatchNumber: string;

  orderId: string;
  orderNumber: string;

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

  customer: string;

  orderId: string;
  orderNumber: string;

  invoiceDate: string;

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

  orderId: string;
  orderNumber: string;

  amount: number;

  date: string;

  createdAt: string;
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

function getNumber(
  value: unknown
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
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

function sameText(
  left: unknown,
  right: unknown
) {
  const a =
    normalizeText(left);

  const b =
    normalizeText(right);

  return Boolean(
    a &&
      b &&
      a === b
  );
}

function formatCurrency(
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

function formatDate(
  value: string
) {
  if (!value) {
    return "—";
  }

  const raw =
    clean(value)
      .split("T")[0];

  const parts =
    raw.split("-");

  if (
    parts.length !== 3
  ) {
    return raw;
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function safeTimestamp(
  value: string
) {
  if (!value) {
    return 0;
  }

  const timestamp =
    Date.parse(value);

  return Number.isFinite(
    timestamp
  )
    ? timestamp
    : 0;
}

/* =========================================================
   ITEMS
========================================================= */

function parseItems(
  value: unknown
): InvoiceItem[] {
  try {
    if (
      Array.isArray(value)
    ) {
      return value.map(
        (item: any) => ({
          description:
            clean(
              item?.description
            ),

          quantity:
            getNumber(
              item?.quantity
            ),

          rate:
            getNumber(
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
          (item: any) => ({
            description:
              clean(
                item?.description
              ),

            quantity:
              getNumber(
                item?.quantity
              ),

            rate:
              getNumber(
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

function getInvoiceSubtotal(
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

function getInvoiceTotal(
  invoice: Invoice
) {
  const subtotal =
    getInvoiceSubtotal(
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
    (
      taxable *
      invoice.gstPercent
    ) / 100;

  return (
    taxable +
    gst
  );
}

/* =========================================================
   WORKFLOW STATUS HELPERS
========================================================= */

function isOrderNew(
  status: string
) {
  return [
    "new",
    "new order",
    "pending",
    "confirmed",
  ].includes(
    normalizeText(
      status
    )
  );
}

/*
 * ARTWORK IS ACTIVE ONLY WHILE IT STILL REQUIRES
 * ARTWORK ACTION.

 * Ready for Digitizing / Approved / Completed
 * must NOT remain in Artwork count.
 */
function isArtworkActive(
  status: string
) {
  const normalized =
    normalizeText(
      status
    );

  if (
    [
      "",
      "draft",
      "pending",
      "in progress",
      "awaiting customer approval",
      "revision required",
      "changes required",
      "under review",
    ].includes(
      normalized
    )
  ) {
    return true;
  }

  return false;
}

/*
 * DIGITIZING IS ACTIVE ONLY WHILE DIGITIZING
 * STILL REQUIRES WORK.

 * Completed records are excluded.
 */
function isDigitizingActive(
  status: string
) {
  const normalized =
    normalizeText(
      status
    );

  return [
    "pending",
    "ready",
    "ready for digitizing",
    "in progress",
    "digitizing",
    "started",
    "rework",
    "rework required",
  ].includes(
    normalized
  );
}

/*
 * MAIN PRODUCTION FIX.

 * The dashboard now reads the actual Production sheet.

 * Only production records whose own status represents
 * pending/active production are counted.

 * Completed / paid / cancelled / QC / dispatch records
 * can never appear in Pending Production.
 */
function isProductionActive(
  status: string
) {
  const normalized =
    normalizeText(
      status
    );

  return [
    "pending",
    "scheduled",
    "ready",
    "ready for production",
    "production",
    "in production",
    "in progress",
    "started",
    "running",
    "rework",
    "rework required",
  ].includes(
    normalized
  );
}

function isProductionCompleted(
  status: string
) {
  return [
    "completed",
    "complete",
    "production completed",
    "completed production",
    "paid",
    "closed",
  ].includes(
    normalizeText(
      status
    )
  );
}

function isQcPassed(
  qc: QualityControl
) {
  const statuses = [
    qc.qcStatus,
    qc.result,
  ]
    .map(
      normalizeText
    )
    .filter(Boolean);

  /*
   * READY FOR DISPATCH MUST COME FROM AN ACTUAL QC PASS.
   *
   * Do not treat dispatchReady="Yes" / "Ready" as proof
   * that QC passed. Older QC rows may contain that flag
   * even when the final QC status is not Passed.
   */
  return statuses.some(
    (status) =>
      [
        "pass",
        "passed",
        "approved",
        "qc pass",
        "qc passed",
      ].includes(
        status
      )
  );
}

function isQcActive(
  qc: QualityControl
) {
  if (
    isQcPassed(qc)
  ) {
    return false;
  }

  const status =
    normalizeText(
      qc.qcStatus ||
        qc.status ||
        qc.result
    );

  return [
    "",
    "pending",
    "hold",
    "in inspection",
    "inspection",
    "quality control",
    "qc",
    "rework required",
  ].includes(
    status
  );
}

function dispatchIsOpen(
  dispatch:
    DispatchRecord
) {
  return ![
    "delivered",
    "completed",
    "cancelled",
    "closed",
  ].includes(
    normalizeText(
      dispatch.status
    )
  );
}

function recordMatchesOrder(
  record: {
    orderId?: string;
    orderNumber?: string;
  },
  order: {
    id?: string;
    orderNumber?: string;
  }
) {
  return (
    (
      record.orderId &&
      order.id &&
      sameText(
        record.orderId,
        order.id
      )
    ) ||
    (
      record.orderNumber &&
      order.orderNumber &&
      sameText(
        record.orderNumber,
        order.orderNumber
      )
    )
  );
}

function orderKey(
  orderId: string,
  orderNumber: string
) {
  if (
    clean(orderId)
  ) {
    return `id:${normalizeText(
      orderId
    )}`;
  }

  return `number:${normalizeText(
    orderNumber
  )}`;
}

/* =========================================================
   PAGE
========================================================= */

export default function DashboardPage() {
  const router =
    useRouter();

  const [
    appSettings,
    setAppSettings,
  ] =
    useState<AppSettings>(
      DEFAULT_APP_SETTINGS
    );

  const [
    customers,
    setCustomers,
  ] =
    useState<Customer[]>(
      []
    );

  const [
    orders,
    setOrders,
  ] =
    useState<Order[]>(
      []
    );

  const [
    artworks,
    setArtworks,
  ] =
    useState<Artwork[]>(
      []
    );

  const [
    digitizing,
    setDigitizing,
  ] =
    useState<
      Digitizing[]
    >([]);

  const [
    production,
    setProduction,
  ] =
    useState<
      Production[]
    >([]);

  const [
    qualityControl,
    setQualityControl,
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
   * Current date information is populated after mount.
   * This avoids Next.js 16 blocking-route issues caused
   * by new Date() during prerender.
   */
  const [
    clock,
    setClock,
  ] =
    useState<{
      year: number;
      month: number;
      dateLabel: string;
    } | null>(null);

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

      dateLabel:
        new Intl.DateTimeFormat(
          "en-IN",
          {
            weekday:
              "long",

            day:
              "2-digit",

            month:
              "long",

            year:
              "numeric",
          }
        ).format(now),
    });

    void loadDashboard();
  }, []);

  /* =======================================================
     LOAD SHEET
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
     LOAD DASHBOARD
  ======================================================= */

  async function loadDashboard(
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
        orderRows,
        artworkRows,
        digitizingRows,
        productionRows,
        qcRows,
        dispatchRows,
        invoiceRows,
        paymentRows,
        settings,
      ] =
        await Promise.all([
          loadSheet(
            "Customers"
          ),

          loadSheet(
            "Orders"
          ),

          loadSheet(
            "Artwork"
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

      /* SETTINGS */

      setAppSettings(
        settings
      );

      /* CUSTOMERS */

      setCustomers(
        customerRows
          .map(
            (
              row: any
            ): Customer => ({
              id:
                clean(
                  row?.id
                ),

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
            })
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

      /* ORDERS */

      setOrders(
        orderRows
          .map(
            (
              row: any
            ): Order => ({
              id:
                clean(
                  row?.id
                ),

              orderNumber:
                clean(
                  row?.orderNumber ??
                    row?.orderNo ??
                    row?.id
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
                clean(
                  row?.orderDate
                ).split(
                  "T"
                )[0],

              deliveryDate:
                clean(
                  row?.deliveryDate
                ).split(
                  "T"
                )[0],

              items:
                clean(
                  row?.items
                ),

              orderItems:
                clean(
                  row?.orderItems
                ),

              totalAmount:
                getNumber(
                  row?.totalAmount ??
                    row?.grandTotal ??
                    row?.total ??
                    row?.amount
                ),

              status:
                clean(
                  row?.status
                ) ||
                "Pending",

              createdAt:
                clean(
                  row?.createdAt ??
                    row?.orderDate
                ),
            })
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

      /* ARTWORK */

      setArtworks(
        artworkRows
          .map(
            (
              row: any
            ): Artwork => ({
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

              customerName:
                clean(
                  row?.customerName
                ),

              designName:
                clean(
                  row?.designName
                ),

              status:
                clean(
                  row?.status
                ),

              createdAt:
                clean(
                  row?.createdAt
                ),
            })
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

      /* DIGITIZING */

      setDigitizing(
        digitizingRows
          .map(
            (
              row: any
            ): Digitizing => ({
              id:
                clean(
                  row?.id
                ),

              digitizingNumber:
                clean(
                  row?.digitizingNumber
                ),

              orderId:
                clean(
                  row?.orderId
                ),

              orderNumber:
                clean(
                  row?.orderNumber
                ),

              customerName:
                clean(
                  row?.customerName
                ),

              designName:
                clean(
                  row?.designName
                ),

              status:
                clean(
                  row?.status
                ),

              createdAt:
                clean(
                  row?.createdAt
                ),
            })
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

      /* PRODUCTION */

      setProduction(
        productionRows
          .map(
            (
              row: any
            ): Production => ({
              id:
                clean(
                  row?.id
                ),

              productionNumber:
                clean(
                  row?.productionNumber ??
                    row?.productionNo
                ),

              orderId:
                clean(
                  row?.orderId
                ),

              orderNumber:
                clean(
                  row?.orderNumber
                ),

              customerName:
                clean(
                  row?.customerName
                ),

              designName:
                clean(
                  row?.designName
                ),

              productionQuantity:
                getNumber(
                  row?.productionQuantity ??
                    row?.quantity ??
                    row?.completedQuantity
                ),

              status:
                clean(
                  row?.status ??
                    row?.productionStatus
                ),

              createdAt:
                clean(
                  row?.createdAt
                ),
            })
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

      /* QUALITY CONTROL */

      setQualityControl(
        qcRows
          .map(
            (
              row: any
            ): QualityControl => ({
              id:
                clean(
                  row?.id
                ),

              qcNumber:
                clean(
                  row?.qcNumber ??
                    row?.qualityNumber
                ),

              productionId:
                clean(
                  row?.productionId
                ),

              orderId:
                clean(
                  row?.orderId
                ),

              orderNumber:
                clean(
                  row?.orderNumber
                ),

              customerName:
                clean(
                  row?.customerName
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

              dispatchReady:
                clean(
                  row?.dispatchReady
                ),

              createdAt:
                clean(
                  row?.createdAt
                ),
            })
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

      /* DISPATCH */

      setDispatches(
        dispatchRows
          .map(
            (
              row: any
            ): DispatchRecord => ({
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

              status:
                clean(
                  row?.status
                ),

              createdAt:
                clean(
                  row?.createdAt
                ),
            })
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

      /* INVOICES */

      setInvoices(
        invoiceRows
          .map(
            (
              row: any
            ): Invoice => ({
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

              orderId:
                clean(
                  row?.orderId
                ),

              orderNumber:
                clean(
                  row?.orderNumber
                ),

              invoiceDate:
                clean(
                  row?.invoiceDate
                ).split(
                  "T"
                )[0],

              items:
                parseItems(
                  row?.items
                ),

              discount:
                getNumber(
                  row?.discount
                ),

              gstPercent:
                getNumber(
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
            })
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

      /* PAYMENTS */

      setPayments(
        paymentRows
          .map(
            (
              row: any
            ): Payment => ({
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

              orderId:
                clean(
                  row?.orderId
                ),

              orderNumber:
                clean(
                  row?.orderNumber
                ),

              amount:
                getNumber(
                  row?.amount
                ),

              date:
                clean(
                  row?.date
                ),

              createdAt:
                clean(
                  row?.createdAt
                ),
            })
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
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load Dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /* =======================================================
     PIPELINE
  ======================================================= */

  const pipeline =
    useMemo(() => {
      /* -----------------------------------------------
         NEW ORDERS
      ----------------------------------------------- */

      const newOrders =
        orders.filter(
          (
            order
          ) =>
            isOrderNew(
              order.status
            )
        ).length;

      /* -----------------------------------------------
         ARTWORK

         Count unique active order references.
      ----------------------------------------------- */

      const artworkKeys =
        new Set<string>();

      artworks
        .filter(
          (
            artwork
          ) =>
            isArtworkActive(
              artwork.status
            )
        )
        .forEach(
          (
            artwork
          ) => {
            artworkKeys.add(
              orderKey(
                artwork.orderId,
                artwork.orderNumber
              )
            );
          }
        );

      /* -----------------------------------------------
         DIGITIZING

         Count actual open Digitizing jobs,
         not Orders whose status happens to mention it.
      ----------------------------------------------- */

      const digitizingKeys =
        new Set<string>();

      digitizing
        .filter(
          (
            record
          ) =>
            isDigitizingActive(
              record.status
            )
        )
        .forEach(
          (
            record
          ) => {
            digitizingKeys.add(
              orderKey(
                record.orderId,
                record.orderNumber
              )
            );
          }
        );

      /* -----------------------------------------------
         PRODUCTION

         THIS FIXES THE PHANTOM "1".

         Only actual Production rows that remain active
         count here.
      ----------------------------------------------- */

      const productionKeys =
        new Set<string>();

      production
        .filter(
          (
            record
          ) =>
            isProductionActive(
              record.status
            )
        )
        .forEach(
          (
            record
          ) => {
            productionKeys.add(
              orderKey(
                record.orderId,
                record.orderNumber
              )
            );
          }
        );

      /* -----------------------------------------------
         QUALITY CONTROL

         1. Existing open QC records.
         2. Completed Production with no QC record yet.
      ----------------------------------------------- */

      const qcKeys =
        new Set<string>();

      qualityControl
        .filter(
          (
            record
          ) =>
            isQcActive(
              record
            )
        )
        .forEach(
          (
            record
          ) => {
            qcKeys.add(
              orderKey(
                record.orderId,
                record.orderNumber
              )
            );
          }
        );

      production
        .filter(
          (
            record
          ) =>
            isProductionCompleted(
              record.status
            )
        )
        .forEach(
          (
            record
          ) => {
            const hasQC =
              qualityControl.some(
                (
                  qc
                ) =>
                  (
                    qc.productionId &&
                    sameText(
                      qc.productionId,
                      record.id
                    )
                  ) ||
                  (
                    qc.orderId &&
                    sameText(
                      qc.orderId,
                      record.orderId
                    )
                  ) ||
                  (
                    qc.orderNumber &&
                    sameText(
                      qc.orderNumber,
                      record.orderNumber
                    )
                  )
              );

            if (
              !hasQC
            ) {
              qcKeys.add(
                orderKey(
                  record.orderId,
                  record.orderNumber
                )
              );
            }
          }
        );

      /* -----------------------------------------------
         READY FOR DISPATCH

         A QC-passed Order is ready ONLY when the same
         Order has no Dispatch record at all.

         IMPORTANT:
         Resolve the QC record through the Orders sheet first.
         This fixes cases where QC stores orderId while Dispatch
         stores orderNumber (or vice versa).
      ----------------------------------------------- */

      const readyKeys =
        new Set<string>();

      qualityControl
        .filter(
          isQcPassed
        )
        .forEach(
          (
            qc
          ) => {
            const linkedOrder =
              orders.find(
                (
                  order
                ) =>
                  recordMatchesOrder(
                    qc,
                    order
                  )
              );

            const alreadyDispatched =
              dispatches.some(
                (
                  dispatch
                ) => {
                  if (
                    linkedOrder
                  ) {
                    return recordMatchesOrder(
                      dispatch,
                      linkedOrder
                    );
                  }

                  return (
                    (
                      qc.orderId &&
                      dispatch.orderId &&
                      sameText(
                        qc.orderId,
                        dispatch.orderId
                      )
                    ) ||
                    (
                      qc.orderNumber &&
                      dispatch.orderNumber &&
                      sameText(
                        qc.orderNumber,
                        dispatch.orderNumber
                      )
                    )
                  );
                }
              );

            if (
              !alreadyDispatched
            ) {
              readyKeys.add(
                linkedOrder
                  ? orderKey(
                      linkedOrder.id,
                      linkedOrder.orderNumber
                    )
                  : orderKey(
                      qc.orderId,
                      qc.orderNumber
                    )
              );
            }
          }
        );

      /* -----------------------------------------------
         DISPATCH PIPELINE

         These are actual Dispatch records. Once a dispatch
         exists, that Order must never remain Ready for Dispatch.
      ----------------------------------------------- */

      const inTransitKeys =
        new Set<string>();

      const dispatchActiveKeys =
        new Set<string>();

      const deliveryExceptionKeys =
        new Set<string>();

      dispatches.forEach(
        (
          dispatch
        ) => {
          const linkedOrder =
            orders.find(
              (
                order
              ) =>
                recordMatchesOrder(
                  dispatch,
                  order
                )
            );

          const key =
            linkedOrder
              ? orderKey(
                  linkedOrder.id,
                  linkedOrder.orderNumber
                )
              : orderKey(
                  dispatch.orderId,
                  dispatch.orderNumber
                );

          const status =
            normalizeText(
              dispatch.status
            );

          if (
            dispatchIsOpen(
              dispatch
            )
          ) {
            dispatchActiveKeys.add(
              key
            );
          }

          if (
            [
              "dispatched",
              "in transit",
              "out for delivery",
            ].includes(
              status
            )
          ) {
            inTransitKeys.add(
              key
            );
          }

          if (
            [
              "delivery failed",
              "returned",
              "return to origin",
              "returned to origin",
              "rto",
            ].includes(
              status
            )
          ) {
            deliveryExceptionKeys.add(
              key
            );
          }
        }
      );

      return {
        newOrders,

        artwork:
          artworkKeys.size,

        digitizing:
          digitizingKeys.size,

        production:
          productionKeys.size,

        qualityControl:
          qcKeys.size,

        ready:
          readyKeys.size,

        dispatchActive:
          dispatchActiveKeys.size,

        inTransit:
          inTransitKeys.size,

        deliveryExceptions:
          deliveryExceptionKeys.size,
      };
    }, [
      orders,
      artworks,
      digitizing,
      production,
      qualityControl,
      dispatches,
    ]);

  /* =======================================================
     FINANCIALS
  ======================================================= */

  const finance =
    useMemo(() => {
      const paymentByInvoice =
        new Map<
          string,
          number
        >();

      payments.forEach(
        (
          payment
        ) => {
          const keys = [
            clean(
              payment.invoiceId
            ),
            clean(
              payment.invoiceNumber
            ),
          ].filter(Boolean);

          keys.forEach(
            (
              key
            ) => {
              paymentByInvoice.set(
                key,
                (
                  paymentByInvoice.get(
                    key
                  ) || 0
                ) +
                  payment.amount
              );
            }
          );
        }
      );

      let totalInvoiced = 0;
      let outstanding = 0;
      let monthlySales = 0;

      invoices.forEach(
        (
          invoice
        ) => {
          const total =
            getInvoiceTotal(
              invoice
            );

          totalInvoiced +=
            total;

          const paidById =
            paymentByInvoice.get(
              invoice.id
            ) || 0;

          const paidByNumber =
            paymentByInvoice.get(
              invoice.invoiceNumber
            ) || 0;

          /*
           * Payments may be indexed by ID or Invoice Number.
           * Use the greater value to avoid counting the same
           * payment twice.
           */
          const paid =
            Math.max(
              paidById,
              paidByNumber
            );

          outstanding +=
            Math.max(
              total -
                paid,
              0
            );

          if (
            clock &&
            invoice.invoiceDate
          ) {
            const raw =
              invoice.invoiceDate
                .split(
                  "T"
                )[0];

            const [
              year,
              month,
            ] =
              raw.split(
                "-"
              );

            if (
              Number(year) ===
                clock.year &&
              Number(month) ===
                clock.month +
                  1
            ) {
              monthlySales +=
                total;
            }
          }
        }
      );

      const totalReceived =
        payments.reduce(
          (
            total,
            payment
          ) =>
            total +
            payment.amount,
          0
        );

      return {
        totalInvoiced,
        monthlySales,
        totalReceived,
        outstanding,
      };
    }, [
      invoices,
      payments,
      clock,
    ]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const activeOrders =
    useMemo(
      () =>
        orders.filter(
          (
            order
          ) =>
            ![
              "completed",
              "cancelled",
              "closed",
              "paid",
            ].includes(
              normalizeText(
                order.status
              )
            )
        ).length,
      [orders]
    );

  const deliveredDispatches =
    useMemo(
      () =>
        dispatches.filter(
          (
            record
          ) =>
            normalizeText(
              record.status
            ) ===
            "delivered"
        ).length,
      [dispatches]
    );

  const activeDispatches =
    useMemo(
      () =>
        dispatches.filter(
          dispatchIsOpen
        ).length,
      [dispatches]
    );

  const workflowOpen =
    pipeline.newOrders +
    pipeline.artwork +
    pipeline.digitizing +
    pipeline.production +
    pipeline.qualityControl +
    pipeline.ready +
    pipeline.dispatchActive;

  /* =======================================================
     RECENT ORDERS
  ======================================================= */

  const recentOrders =
    useMemo(
      () =>
        [...orders]
          .sort(
            (
              a,
              b
            ) =>
              safeTimestamp(
                b.createdAt ||
                  b.orderDate
              ) -
              safeTimestamp(
                a.createdAt ||
                  a.orderDate
              )
          )
          .slice(
            0,
            6
          ),
      [orders]
    );

  /* =======================================================
     ATTENTION ITEMS
  ======================================================= */

  const attentionItems =
    useMemo(() => {
      const items: Array<{
        icon: string;
        title: string;
        caption: string;
        count: number;
        route: string;
      }> = [];

      if (
        pipeline.newOrders >
        0
      ) {
        items.push({
          icon: "📦",

          title:
            "New orders waiting",

          caption:
            "Confirm requirements and begin artwork workflow.",

          count:
            pipeline.newOrders,

          route:
            "/protected/orders",
        });
      }

      if (
        pipeline.artwork >
        0
      ) {
        items.push({
          icon: "🎨",

          title:
            "Artwork needs attention",

          caption:
            "Artwork is still awaiting completion or approval.",

          count:
            pipeline.artwork,

          route:
            "/protected/designs",
        });
      }

      if (
        pipeline.digitizing >
        0
      ) {
        items.push({
          icon: "🧵",

          title:
            "Digitizing jobs open",

          caption:
            "Embroidery files are still being prepared.",

          count:
            pipeline.digitizing,

          route:
            "/protected/digitizing",
        });
      }

      if (
        pipeline.production >
        0
      ) {
        items.push({
          icon: "🪡",

          title:
            "Production jobs active",

          caption:
            "Production records are Pending, Scheduled or In Progress.",

          count:
            pipeline.production,

          route:
            "/protected/production",
        });
      }

      if (
        pipeline.qualityControl >
        0
      ) {
        items.push({
          icon: "✅",

          title:
            "Quality inspection required",

          caption:
            "Completed production is waiting for QC action.",

          count:
            pipeline.qualityControl,

          route:
            "/protected/quality-control",
        });
      }

      if (
        pipeline.ready >
        0
      ) {
        items.push({
          icon: "🚚",

          title:
            "Orders ready to dispatch",

          caption:
            "QC has passed and dispatch has not yet been created.",

          count:
            pipeline.ready,

          route:
            "/protected/dispatch",
        });
      }

      if (
        pipeline.inTransit >
        0
      ) {
        items.push({
          icon: "🚛",

          title:
            "Shipments in transit",

          caption:
            "Dispatches are currently Dispatched, In Transit or Out for Delivery and should be monitored until delivery.",

          count:
            pipeline.inTransit,

          route:
            "/protected/dispatch",
        });
      }

      if (
        pipeline.deliveryExceptions >
        0
      ) {
        items.push({
          icon: "⚠️",

          title:
            "Dispatch exceptions",

          caption:
            "Delivery failed / returned shipments require follow-up.",

          count:
            pipeline.deliveryExceptions,

          route:
            "/protected/dispatch",
        });
      }

      if (
        finance.outstanding >
        0
      ) {
        items.push({
          icon: "💳",

          title:
            "Customer balance outstanding",

          caption:
            `${formatCurrency(
              finance.outstanding
            )} remains to be collected.`,

          count:
            invoices.filter(
              (
                invoice
              ) =>
                normalizeText(
                  invoice.status
                ) !==
                "paid"
            ).length,

          route:
            "/protected/payments",
        });
      }

      return items.slice(
        0,
        6
      );
    }, [
      pipeline,
      finance.outstanding,
      invoices,
    ]);

  /* =======================================================
     PIPELINE CONFIG
  ======================================================= */

  const pipelineItems = [
    {
      label:
        "New Orders",

      count:
        pipeline.newOrders,

      icon:
        "📦",

      route:
        "/protected/orders",

      description:
        "Confirmed work awaiting workflow",
    },

    {
      label:
        "Artwork",

      count:
        pipeline.artwork,

      icon:
        "🎨",

      route:
        "/protected/designs",

      description:
        "Artwork still requiring action",
    },

    {
      label:
        "Digitizing",

      count:
        pipeline.digitizing,

      icon:
        "🧵",

      route:
        "/protected/digitizing",

      description:
        "Digitizing jobs not completed",
    },

    {
      label:
        "Production",

      count:
        pipeline.production,

      icon:
        "🪡",

      route:
        "/protected/production",

      description:
        "Actual active Production records",
    },

    {
      label:
        "Quality Control",

      count:
        pipeline.qualityControl,

      icon:
        "✅",

      route:
        "/protected/quality-control",

      description:
        "Jobs waiting for QC completion",
    },

    {
      label:
        "Ready for Dispatch",

      count:
        pipeline.ready,

      icon:
        "🚚",

      route:
        "/protected/dispatch",

      description:
        "QC passed and no Dispatch record exists",
    },

    {
      label:
        "In Transit",

      count:
        pipeline.inTransit,

      icon:
        "📍",

      route:
        "/protected/dispatch",

      description:
        "Dispatched / in transit / out for delivery",
    },
  ];

  const pipelineMax =
    Math.max(
      1,
      ...pipelineItems.map(
        (
          item
        ) =>
          item.count
      )
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 pb-24">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 shadow-xl">

        <div className="relative p-6 sm:p-8">

          {/* DECORATION */}

          <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 right-1/3 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-center">

            <div>

              <div className="mb-3 flex flex-wrap items-center gap-2">

                <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
                  EMBRASTIC BUSINESS OS
                </span>

                {clock?.dateLabel && (

                  <span className="text-xs font-medium text-slate-400">
                    {clock.dateLabel}
                  </span>

                )}

              </div>

              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl">
                Welcome back,{" "}
                {appSettings.businessOwnerName ||
                  "Business Owner"}
              </h1>

              <p className="mt-2 text-sm font-bold text-cyan-300">
                Business command centre
              </p>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Live operational and financial visibility from customer order through artwork, digitizing, production, quality control, dispatch, invoice and payment.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                onClick={() =>
                  void loadDashboard(
                    true
                  )
                }
                disabled={
                  refreshing
                }
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                {refreshing
                  ? "Refreshing..."
                  : "↻ Refresh"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/protected/orders"
                  )
                }
                className="rounded-xl bg-gradient-to-r from-amber-300 to-orange-400 px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:from-amber-200 hover:to-orange-300"
              >
                + New Order
              </button>

            </div>

          </div>

          {/* HERO MINI STATS */}

          <div className="relative mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <HeroStat
              label="Open Workflow"
              value={String(
                workflowOpen
              )}
              caption="Jobs needing action"
            />

            <HeroStat
              label="Active Orders"
              value={String(
                activeOrders
              )}
              caption="Not yet closed"
            />

            <HeroStat
              label="Open Dispatch"
              value={String(
                activeDispatches
              )}
              caption="Shipment activity"
            />

            <HeroStat
              label="Outstanding"
              value={formatCurrency(
                finance.outstanding
              )}
              caption="Customer receivables"
            />

          </div>

        </div>

      </section>

      {/* =================================================
          LOAD / ERROR
      ================================================= */}

      {loading && (

        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-700">
          Loading live business information from Excel...
        </div>

      )}

      {error && (

        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 md:flex-row md:items-center">

          <div>

            <div className="font-black text-red-700">
              Dashboard could not load all business data
            </div>

            <div className="mt-1 text-sm text-red-600">
              {error}
            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              void loadDashboard()
            }
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white"
          >
            Retry
          </button>

        </div>

      )}

      {/* =================================================
          KPI CARDS
      ================================================= */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <KpiCard
          icon="📦"
          label="Total Orders"
          value={String(
            orders.length
          )}
          caption={`${activeOrders} currently active`}
          action="View Orders"
          onClick={() =>
            router.push(
              "/protected/orders"
            )
          }
        />

        <KpiCard
          icon="🪡"
          label="Pending Production"
          value={String(
            pipeline.production
          )}
          caption="Based on actual Production records"
          action="View Production"
          onClick={() =>
            router.push(
              "/protected/production"
            )
          }
          attention={
            pipeline.production >
            0
          }
        />

        <KpiCard
          icon="📈"
          label="This Month Sales"
          value={formatCurrency(
            finance.monthlySales
          )}
          caption="Invoice value this month"
          action="View Invoices"
          onClick={() =>
            router.push(
              "/protected/invoices"
            )
          }
        />

        <KpiCard
          icon="💳"
          label="Outstanding"
          value={formatCurrency(
            finance.outstanding
          )}
          caption="Invoice balance remaining"
          action="View Payments"
          onClick={() =>
            router.push(
              "/protected/payments"
            )
          }
          attention={
            finance.outstanding >
            0
          }
        />

      </section>

      {/* =================================================
          SECONDARY KPI STRIP
      ================================================= */}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <MiniKpi
          label="Customers"
          value={String(
            customers.length
          )}
          icon="👥"
          route="/protected/customers"
          onOpen={
            router.push
          }
        />

        <MiniKpi
          label="Total Invoiced"
          value={formatCurrency(
            finance.totalInvoiced
          )}
          icon="🧾"
          route="/protected/invoices"
          onOpen={
            router.push
          }
        />

        <MiniKpi
          label="Payments Received"
          value={formatCurrency(
            finance.totalReceived
          )}
          icon="💰"
          route="/protected/payments"
          onOpen={
            router.push
          }
        />

        <MiniKpi
          label="Delivered"
          value={String(
            deliveredDispatches
          )}
          icon="✅"
          route="/protected/dispatch"
          onOpen={
            router.push
          }
        />

      </section>

      {/* =================================================
          PIPELINE + ATTENTION
      ================================================= */}

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">

        {/* PIPELINE */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm">

          <div className="flex flex-col justify-between gap-4 border-b bg-gradient-to-r from-slate-50 to-blue-50/70 px-6 py-5 sm:flex-row sm:items-center">

            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 text-xl">
                  🧵
                </div>

                <div>

                  <h2 className="text-lg font-black text-slate-900">
                    Production Pipeline
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Calculated from the actual module records — not just the Order status.
                  </p>

                </div>

              </div>

            </div>

            <span className="rounded-full bg-gradient-to-r from-slate-900 to-blue-900 px-3 py-1.5 text-xs font-black text-white">
              {workflowOpen} open
            </span>

          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">

            {pipelineItems.map(
              (
                item,
                index
              ) => {

                const pipelinePalette = [
                  {
                    card: "from-blue-50 to-cyan-50/60",
                    border: "border-blue-200",
                    icon: "bg-blue-100 text-blue-700",
                    bar: "bg-blue-600",
                    count: "text-blue-800",
                  },
                  {
                    card: "from-fuchsia-50 to-pink-50/60",
                    border: "border-fuchsia-200",
                    icon: "bg-fuchsia-100 text-fuchsia-700",
                    bar: "bg-fuchsia-600",
                    count: "text-fuchsia-800",
                  },
                  {
                    card: "from-violet-50 to-purple-50/60",
                    border: "border-violet-200",
                    icon: "bg-violet-100 text-violet-700",
                    bar: "bg-violet-600",
                    count: "text-violet-800",
                  },
                  {
                    card: "from-amber-50 to-orange-50/60",
                    border: "border-amber-200",
                    icon: "bg-amber-100 text-amber-700",
                    bar: "bg-amber-500",
                    count: "text-amber-800",
                  },
                  {
                    card: "from-emerald-50 to-green-50/60",
                    border: "border-emerald-200",
                    icon: "bg-emerald-100 text-emerald-700",
                    bar: "bg-emerald-600",
                    count: "text-emerald-800",
                  },
                  {
                    card: "from-sky-50 to-blue-50/60",
                    border: "border-sky-200",
                    icon: "bg-sky-100 text-sky-700",
                    bar: "bg-sky-600",
                    count: "text-sky-800",
                  },
                  {
                    card: "from-indigo-50 to-cyan-50/60",
                    border: "border-indigo-200",
                    icon: "bg-indigo-100 text-indigo-700",
                    bar: "bg-indigo-600",
                    count: "text-indigo-800",
                  },
                ][index % 7];

                const percent =
                  item.count ===
                  0
                    ? 0
                    : Math.max(
                        8,
                        (
                          item.count /
                          pipelineMax
                        ) *
                          100
                      );

                return (

                  <button
                    key={
                      item.label
                    }
                    type="button"
                    onClick={() =>
                      router.push(
                        item.route
                      )
                    }
                    className={`group rounded-2xl border bg-gradient-to-br ${pipelinePalette.card} ${pipelinePalette.border} p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md`}
                  >

                    <div className="flex items-start justify-between">

                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg shadow-sm transition ${pipelinePalette.icon}`} >
                        {
                          item.icon
                        }
                      </div>

                      <div
                        className={`text-2xl font-black ${
                          item.count > 0
                            ? pipelinePalette.count
                            : "text-slate-300"
                        }`}
                      >
                        {
                          item.count
                        }
                      </div>

                    </div>

                    <div className="mt-4 font-black text-slate-900">
                      {
                        item.label
                      }
                    </div>

                    <div className="mt-1 min-h-[32px] text-xs leading-4 text-slate-500">
                      {
                        item.description
                      }
                    </div>

                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">

                      <div
                        className={`h-full rounded-full ${pipelinePalette.bar} transition-all duration-500`}
                        style={{
                          width:
                            `${percent}%`,
                        }}
                      />

                    </div>

                    <div className={`mt-3 text-xs font-bold opacity-0 transition group-hover:opacity-100 ${pipelinePalette.count}`}>
                      Open module →
                    </div>

                  </button>

                );
              }
            )}

          </div>

        </div>

        {/* ATTENTION */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm">

          <div className="border-b bg-gradient-to-r from-slate-50 to-blue-50/70 px-6 py-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-xl">
                ⚡
              </div>

              <div>

                <h2 className="text-lg font-black">
                  Needs Attention
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Current operational priorities
                </p>

              </div>

            </div>

          </div>

          <div className="p-4">

            {attentionItems.length ===
            0 ? (

              <div className="py-10 text-center">

                <div className="text-4xl">
                  ✓
                </div>

                <div className="mt-3 font-black text-green-700">
                  Nothing urgent
                </div>

                <div className="mt-1 text-sm text-slate-500">
                  No operational queues currently require attention.
                </div>

              </div>

            ) : (

              <div className="space-y-2">

                {attentionItems.map(
                  (
                    item,
                    index
                  ) => {
                    const attentionPalette = [
                      {
                        card: "border-blue-200 bg-blue-50/70",
                        icon: "bg-blue-100 text-blue-700",
                        count: "bg-blue-100 text-blue-800",
                      },
                      {
                        card: "border-violet-200 bg-violet-50/70",
                        icon: "bg-violet-100 text-violet-700",
                        count: "bg-violet-100 text-violet-800",
                      },
                      {
                        card: "border-amber-200 bg-amber-50/70",
                        icon: "bg-amber-100 text-amber-700",
                        count: "bg-amber-100 text-amber-800",
                      },
                      {
                        card: "border-emerald-200 bg-emerald-50/70",
                        icon: "bg-emerald-100 text-emerald-700",
                        count: "bg-emerald-100 text-emerald-800",
                      },
                      {
                        card: "border-sky-200 bg-sky-50/70",
                        icon: "bg-sky-100 text-sky-700",
                        count: "bg-sky-100 text-sky-800",
                      },
                      {
                        card: "border-rose-200 bg-rose-50/70",
                        icon: "bg-rose-100 text-rose-700",
                        count: "bg-rose-100 text-rose-800",
                      },
                    ][index % 6];

                    return (

                    <button
                      key={
                        `${item.route}-${item.title}`
                      }
                      type="button"
                      onClick={() =>
                        router.push(
                          item.route
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${attentionPalette.card}`}
                    >

                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${attentionPalette.icon}`}>
                        {
                          item.icon
                        }
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="truncate text-sm font-black">
                          {
                            item.title
                          }
                        </div>

                        <div className="mt-0.5 line-clamp-2 text-xs leading-4 text-slate-500">
                          {
                            item.caption
                          }
                        </div>

                      </div>

                      <div className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-black ${attentionPalette.count}`}>
                        {
                          item.count
                        }
                      </div>

                    </button>

                    );
                  }
                )}

              </div>

            )}

          </div>

        </div>

      </section>

      {/* =================================================
          FINANCE + QUICK ACTIONS
      ================================================= */}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">

        {/* FINANCIAL HEALTH */}

        <div className="rounded-3xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-lg font-black">
                Financial Snapshot
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Invoice and collection position
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/protected/reports"
                )
              }
              className="text-sm font-bold text-blue-700"
            >
              Reports →
            </button>

          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">

            <FinancialBox
              label="Total Invoiced"
              value={formatCurrency(
                finance.totalInvoiced
              )}
              caption="All invoices"
            />

            <FinancialBox
              label="Received"
              value={formatCurrency(
                finance.totalReceived
              )}
              caption="Payments recorded"
            />

            <FinancialBox
              label="Outstanding"
              value={formatCurrency(
                finance.outstanding
              )}
              caption="Still to collect"
              attention={
                finance.outstanding >
                0
              }
            />

          </div>

          {finance.totalInvoiced >
            0 && (

            <div className="mt-6">

              <div className="mb-2 flex justify-between text-xs">

                <span className="font-semibold text-slate-500">
                  Collection progress
                </span>

                <span className="font-black text-slate-800">
                  {Math.min(
                    100,
                    Math.round(
                      (
                        finance.totalReceived /
                        finance.totalInvoiced
                      ) *
                        100
                    )
                  )}
                  %
                </span>

              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                <div
                  className="h-full rounded-full bg-green-600"
                  style={{
                    width: `${Math.min(
                      100,
                      (
                        finance.totalReceived /
                        finance.totalInvoiced
                      ) *
                        100
                    )}%`,
                  }}
                />

              </div>

            </div>

          )}

        </div>

        {/* QUICK ACTIONS */}

        <div className="rounded-3xl border bg-white p-6 shadow-sm">

          <div>

            <h2 className="text-lg font-black">
              Quick Actions
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Jump directly to common business tasks
            </p>

          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">

            <QuickAction
              icon="👥"
              label="Customer"
              onClick={() =>
                router.push(
                  "/protected/customers"
                )
              }
            />

            <QuickAction
              icon="📝"
              label="Quotation"
              onClick={() =>
                router.push(
                  "/protected/quotations"
                )
              }
            />

            <QuickAction
              icon="📦"
              label="Order"
              onClick={() =>
                router.push(
                  "/protected/orders"
                )
              }
            />

            <QuickAction
              icon="🎨"
              label="Artwork"
              onClick={() =>
                router.push(
                  "/protected/designs"
                )
              }
            />

            <QuickAction
              icon="🧵"
              label="Digitizing"
              onClick={() =>
                router.push(
                  "/protected/digitizing"
                )
              }
            />

            <QuickAction
              icon="🪡"
              label="Production"
              onClick={() =>
                router.push(
                  "/protected/production"
                )
              }
            />

            <QuickAction
              icon="✅"
              label="QC"
              onClick={() =>
                router.push(
                  "/protected/quality-control"
                )
              }
            />

            <QuickAction
              icon="🚚"
              label="Dispatch"
              onClick={() =>
                router.push(
                  "/protected/dispatch"
                )
              }
            />

            <QuickAction
              icon="🧾"
              label="Invoice"
              onClick={() =>
                router.push(
                  "/protected/invoices"
                )
              }
            />

          </div>

        </div>

      </section>

      {/* =================================================
          RECENT ORDERS
      ================================================= */}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm">

        <div className="flex flex-col justify-between gap-4 border-b bg-gradient-to-r from-slate-50 to-blue-50/70 px-6 py-5 sm:flex-row sm:items-center">

          <div>

            <h2 className="text-lg font-black">
              Recent Orders
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Latest customer orders recorded in the system
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/protected/orders"
              )
            }
            className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold hover:bg-slate-50"
          >
            View All Orders →
          </button>

        </div>

        {recentOrders.length ===
        0 ? (

          <div className="py-14 text-center">

            <div className="text-5xl">
              📦
            </div>

            <div className="mt-4 text-lg font-black">
              No orders recorded
            </div>

            <div className="mt-1 text-sm text-slate-500">
              Create the first customer order to begin the workflow.
            </div>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] text-left text-sm">

              <thead>

                <tr className="border-b bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">

                  <th className="px-5 py-4">
                    Order
                  </th>

                  <th className="px-5 py-4">
                    Customer
                  </th>

                  <th className="px-5 py-4">
                    Order Date
                  </th>

                  <th className="px-5 py-4">
                    Delivery
                  </th>

                  <th className="px-5 py-4">
                    Value
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {recentOrders.map(
                  (
                    order
                  ) => (

                    <tr
                      key={
                        order.id ||
                        order.orderNumber
                      }
                      onClick={() =>
                        router.push(
                          "/protected/orders"
                        )
                      }
                      className="cursor-pointer border-b last:border-0 transition hover:bg-blue-50/40"
                    >

                      <td className="px-5 py-4">

                        <div className="font-black text-blue-700">
                          {
                            order.orderNumber ||
                            "—"
                          }
                        </div>

                      </td>

                      <td className="px-5 py-4">

                        <div className="font-bold text-slate-900">
                          {
                            order.customerName ||
                            "—"
                          }
                        </div>

                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(
                          order.orderDate
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(
                          order.deliveryDate
                        )}
                      </td>

                      <td className="px-5 py-4 font-bold">
                        {order.totalAmount >
                        0
                          ? formatCurrency(
                              order.totalAmount
                            )
                          : "—"}
                      </td>

                      <td className="px-5 py-4">

                        <OrderStatusBadge
                          status={
                            order.status
                          }
                        />

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

      {/* =================================================
          BUSINESS MODULES
      ================================================= */}

      <section className="rounded-3xl border bg-white p-6 shadow-sm">

        <div>

          <h2 className="text-lg font-black">
            Business Modules
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Complete EMBRASTIC operational workspace
          </p>

        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">

          {[
            [
              "Customers",
              "👥",
              "/protected/customers",
            ],

            [
              "Quotations",
              "📝",
              "/protected/quotations",
            ],

            [
              "Orders",
              "📦",
              "/protected/orders",
            ],

            [
              "Artwork",
              "🎨",
              "/protected/designs",
            ],

            [
              "Digitizing",
              "🧵",
              "/protected/digitizing",
            ],

            [
              "Work Orders",
              "🧰",
              "/protected/work-orders",
            ],

            [
              "Production",
              "🪡",
              "/protected/production",
            ],

            [
              "Quality Control",
              "✅",
              "/protected/quality-control",
            ],

            [
              "Dispatch",
              "🚚",
              "/protected/dispatch",
            ],

            [
              "Inventory",
              "📋",
              "/protected/inventory",
            ],

            [
              "Invoices",
              "🧾",
              "/protected/invoices",
            ],

            [
              "Payments",
              "💳",
              "/protected/payments",
            ],

            [
              "Expenses",
              "💰",
              "/protected/expenses",
            ],

            [
              "Reports",
              "📈",
              "/protected/reports",
            ],

            [
              "Settings",
              "⚙️",
              "/protected/settings",
            ],
          ].map(
            (
              [
                name,
                icon,
                route,
              ]
            ) => (

              <button
                key={
                  route
                }
                type="button"
                onClick={() =>
                  router.push(
                    route
                  )
                }
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"
              >

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg group-hover:bg-white">
                  {icon}
                </div>

                <div className="min-w-0">

                  <div className="truncate text-sm font-black">
                    {name}
                  </div>

                  <div className="mt-0.5 text-[11px] text-slate-400">
                    Open →
                  </div>

                </div>

              </button>

            )
          )}

        </div>

      </section>

    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function HeroStat({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  const tone =
    label === "Open Workflow"
      ? "from-blue-500/20 to-cyan-400/10 border-blue-400/20"
      : label === "Active Orders"
      ? "from-violet-500/20 to-fuchsia-400/10 border-violet-400/20"
      : label === "Open Dispatch"
      ? "from-amber-400/20 to-orange-400/10 border-amber-300/20"
      : "from-emerald-500/20 to-teal-400/10 border-emerald-400/20";

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br ${tone} p-4 backdrop-blur`}
    >

      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">
        {label}
      </div>

      <div className="mt-2 text-2xl font-black text-white">
        {value}
      </div>

      <div className="mt-1 text-xs text-slate-300">
        {caption}
      </div>

    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  caption,
  action,
  attention = false,
  onClick,
}: {
  icon: string;
  label: string;
  value: string;
  caption: string;
  action: string;
  attention?: boolean;
  onClick:
    () => void;
}) {
  const palette =
    label === "Total Orders"
      ? {
          border: "border-blue-200",
          card: "from-blue-50 via-white to-cyan-50/70",
          icon: "bg-blue-100 text-blue-700",
          value: "text-blue-900",
          action: "text-blue-700",
        }
      : label === "Pending Production"
      ? {
          border: attention
            ? "border-amber-300"
            : "border-violet-200",
          card: attention
            ? "from-amber-50 via-white to-orange-50/70"
            : "from-violet-50 via-white to-fuchsia-50/60",
          icon: attention
            ? "bg-amber-100 text-amber-700"
            : "bg-violet-100 text-violet-700",
          value: attention
            ? "text-amber-900"
            : "text-violet-900",
          action: attention
            ? "text-amber-700"
            : "text-violet-700",
        }
      : label === "This Month Sales"
      ? {
          border: "border-emerald-200",
          card: "from-emerald-50 via-white to-teal-50/70",
          icon: "bg-emerald-100 text-emerald-700",
          value: "text-emerald-900",
          action: "text-emerald-700",
        }
      : {
          border: attention
            ? "border-rose-200"
            : "border-orange-200",
          card: attention
            ? "from-rose-50 via-white to-pink-50/70"
            : "from-orange-50 via-white to-amber-50/60",
          icon: attention
            ? "bg-rose-100 text-rose-700"
            : "bg-orange-100 text-orange-700",
          value: attention
            ? "text-rose-900"
            : "text-orange-900",
          action: attention
            ? "text-rose-700"
            : "text-orange-700",
        };

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`group relative overflow-hidden rounded-3xl border bg-gradient-to-br ${palette.card} ${palette.border} p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg`}
    >

      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/50 blur-2xl" />

      <div className="relative flex items-start justify-between">

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-sm ${palette.icon}`}
        >
          {icon}
        </div>

        <span
          className={`text-[11px] font-black opacity-80 transition group-hover:opacity-100 ${palette.action}`}
        >
          {action} →
        </span>

      </div>

      <div className="relative mt-5 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>

      <div className={`relative mt-1 text-2xl font-black tracking-tight ${palette.value}`}>
        {value}
      </div>

      <div className="relative mt-2 text-xs leading-5 text-slate-500">
        {caption}
      </div>

    </button>
  );
}

function MiniKpi({
  label,
  value,
  icon,
  route,
  onOpen,
}: {
  label: string;
  value: string;
  icon: string;
  route: string;
  onOpen:
    (
      route: string
    ) => void;
}) {
  const palette =
    label === "Customers"
      ? {
          border: "border-violet-200",
          card: "from-violet-50 to-fuchsia-50/60",
          icon: "bg-violet-100 text-violet-700",
          value: "text-violet-900",
        }
      : label === "Total Invoiced"
      ? {
          border: "border-cyan-200",
          card: "from-cyan-50 to-blue-50/60",
          icon: "bg-cyan-100 text-cyan-700",
          value: "text-cyan-900",
        }
      : label === "Payments Received"
      ? {
          border: "border-emerald-200",
          card: "from-emerald-50 to-teal-50/60",
          icon: "bg-emerald-100 text-emerald-700",
          value: "text-emerald-900",
        }
      : {
          border: "border-green-200",
          card: "from-green-50 to-lime-50/60",
          icon: "bg-green-100 text-green-700",
          value: "text-green-900",
        };

  return (
    <button
      type="button"
      onClick={() =>
        onOpen(
          route
        )
      }
      className={`group flex items-center gap-4 rounded-2xl border bg-gradient-to-br ${palette.card} ${palette.border} p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
    >

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl shadow-sm ${palette.icon}`}
      >
        {icon}
      </div>

      <div className="min-w-0">

        <div className="truncate text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
        </div>

        <div className={`mt-1 truncate text-lg font-black ${palette.value}`}>
          {value}
        </div>

      </div>

    </button>
  );
}

function FinancialBox({
  label,
  value,
  caption,
  attention = false,
}: {
  label: string;
  value: string;
  caption: string;
  attention?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        attention
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >

      <div className="text-xs font-semibold text-slate-500">
        {label}
      </div>

      <div
        className={`mt-2 text-xl font-black ${
          attention
            ? "text-amber-800"
            : "text-slate-950"
        }`}
      >
        {value}
      </div>

      <div className="mt-1 text-[11px] text-slate-400">
        {caption}
      </div>

    </div>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="group rounded-2xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"
    >

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg transition group-hover:bg-white">
        {icon}
      </div>

      <div className="mt-3 text-sm font-black">
        {label}
      </div>

      <div className="mt-1 text-[11px] font-semibold text-blue-600">
        Open →
      </div>

    </button>
  );
}

function OrderStatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    normalizeText(
      status
    );

  let style =
    "bg-slate-100 text-slate-700";

  if (
    [
      "completed",
      "paid",
      "closed",
    ].includes(
      normalized
    )
  ) {
    style =
      "bg-emerald-100 text-emerald-700";
  } else if (
    [
      "production",
      "in production",
      "in progress",
    ].includes(
      normalized
    )
  ) {
    style =
      "bg-violet-100 text-violet-700";
  } else if (
    normalized.includes(
      "quality"
    )
  ) {
    style =
      "bg-cyan-100 text-cyan-700";
  } else if (
    normalized.includes(
      "digit"
    )
  ) {
    style =
      "bg-indigo-100 text-indigo-700";
  } else if (
    normalized.includes(
      "art"
    )
  ) {
    style =
      "bg-pink-100 text-pink-700";
  } else if (
    normalized.includes(
      "dispatch"
    )
  ) {
    style =
      "bg-emerald-100 text-emerald-700";
  } else if (
    [
      "pending",
      "new",
      "new order",
    ].includes(
      normalized
    )
  ) {
    style =
      "bg-amber-100 text-amber-700";
  }

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ${style}`}
    >
      {status ||
        "—"}
    </span>
  );
}
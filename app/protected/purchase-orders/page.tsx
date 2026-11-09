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

type Supplier = {
  id: string;

  supplierCode: string;
  supplierName: string;

  gstin: string;

  paymentTermsDays: number;
  leadTimeDays: number;

  status: string;

  [key: string]: any;
};

type InventoryItem = {
  id: string;

  sku: string;

  itemName: string;
  description: string;

  category: string;

  unit: string;

  quantity: number;

  /*
   * Weighted average inventory cost.
   * Stored in Inventory.price.
   */
  unitCost: number;

  supplier: string;

  [key: string]: any;
};

type PurchaseOrderItem = {
  id: string;

  inventoryId: string;

  sku: string;

  itemName: string;
  description: string;

  category: string;

  quantity: number;

  unit: string;

  unitPrice: number;

  gstPercent: number;

  expectedDate: string;

  receivedQuantity: number;
};

type PurchaseOrder = {
  id: string;

  purchaseOrderNumber: string;

  supplierId: string;
  supplierCode: string;
  supplierName: string;
  supplierGstin: string;

  poDate: string;

  expectedDeliveryDate: string;

  paymentTermsDays: number;

  reference: string;

  items: string;

  subtotal: number;
  taxAmount: number;
  totalAmount: number;

  receivedQuantity: number;
  pendingQuantity: number;

  status: string;

  deliveryAddress: string;

  notes: string;

  createdAt: string;
  updatedAt: string;

  [key: string]: any;
};

type SupplierBill = {
  id: string;

  billNumber: string;

  supplierInvoiceNumber: string;

  supplierId: string;
  supplierCode: string;
  supplierName: string;

  purchaseOrderId: string;
  purchaseOrderNumber: string;

  billDate: string;
  dueDate: string;

  subtotal: number;
  taxAmount: number;
  totalAmount: number;

  notes: string;

  status: string;

  createdAt: string;
  updatedAt: string;

  [key: string]: any;
};

type PurchaseOrderForm = {
  supplierId: string;

  poDate: string;

  expectedDeliveryDate: string;

  paymentTermsDays: number;

  reference: string;

  status: string;

  deliveryAddress: string;

  notes: string;
};

type ReceiptItem = {
  poItemId: string;

  inventoryId: string;

  sku: string;

  itemName: string;

  unit: string;

  orderedQuantity: number;

  alreadyReceived: number;

  pendingQuantity: number;

  receiveQuantity: number;

  unitCost: number;

  gstPercent: number;
};

type ReceiptForm = {
  receiptDate: string;

  supplierInvoiceNumber: string;

  paymentMethod: string;

  reference: string;

  notes: string;
};

/* =========================================================
   OPTIONS
========================================================= */

const PO_STATUSES = [
  "Draft",
  "Approved",
  "Sent to Supplier",
  "Partially Received",
  "Received",
  "Closed",
  "Cancelled",
];

const PAYMENT_METHODS = [
  "Cash",
  "UPI",
  "Bank Transfer",
  "Card",
  "Cheque",
  "Credit",
  "Other",
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

function sameValue(
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
      first === second
  );
}

function numberValue(
  value: unknown
) {
  const parsed =
    Number(
      value
    );

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
    clean(
      value
    );

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

  return `po-${Date.now()}-${Math.random()
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

function roundMoney(
  value: number
) {
  return Math.round(
    (
      Number(value) +
      Number.EPSILON
    ) *
      100
  ) / 100;
}

/* =========================================================
   EMPTY VALUES
========================================================= */

function emptyItem():
  PurchaseOrderItem {
  return {
    id:
      generateId(),

    inventoryId:
      "",

    sku:
      "",

    itemName:
      "",

    description:
      "",

    category:
      "",

    quantity:
      1,

    unit:
      "pcs",

    unitPrice:
      0,

    gstPercent:
      18,

    expectedDate:
      "",

    receivedQuantity:
      0,
  };
}

function emptyForm():
  PurchaseOrderForm {
  return {
    supplierId:
      "",

    poDate:
      "",

    expectedDeliveryDate:
      "",

    paymentTermsDays:
      30,

    reference:
      "",

    status:
      "Draft",

    deliveryAddress:
      "",

    notes:
      "",
  };
}

function emptyReceiptForm():
  ReceiptForm {
  return {
    receiptDate:
      getToday(),

    supplierInvoiceNumber:
      "",

    paymentMethod:
      "Credit",

    reference:
      "",

    notes:
      "",
  };
}

/* =========================================================
   NORMALIZE SUPPLIER
========================================================= */

function normalizeSupplier(
  row: any
):
  Supplier {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    supplierCode:
      clean(
        row?.supplierCode
      ),

    supplierName:
      clean(
        row?.supplierName ??
          row?.name
      ),

    gstin:
      clean(
        row?.gstin
      ),

    paymentTermsDays:
      numberValue(
        row?.paymentTermsDays
      ) ||
      30,

    leadTimeDays:
      numberValue(
        row?.leadTimeDays
      ) ||
      7,

    status:
      clean(
        row?.status
      ) ||
      "Active",
  };
}

/* =========================================================
   NORMALIZE INVENTORY
========================================================= */

function normalizeInventory(
  row: any
):
  InventoryItem {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    sku:
      clean(
        row?.sku ??
          row?.SKU
      ),

    itemName:
      clean(
        row?.itemName ??
          row?.name ??
          row?.item
      ),

    description:
      clean(
        row?.description
      ),

    category:
      clean(
        row?.category
      ),

    unit:
      clean(
        row?.unit
      ) ||
      "pcs",

    quantity:
      numberValue(
        row?.quantity
      ),

    /*
     * Inventory uses price for weighted average cost.
     */
    unitCost:
      numberValue(
        row?.price ??
          row?.unitCost ??
          row?.averageCost ??
          row?.cost
      ),

    supplier:
      clean(
        row?.supplier
      ),
  };
}

/* =========================================================
   NORMALIZE PO ITEM
========================================================= */

function normalizePOItem(
  row: any
):
  PurchaseOrderItem {
  return {
    id:
      clean(
        row?.id
      ) ||
      generateId(),

    inventoryId:
      clean(
        row?.inventoryId
      ),

    sku:
      clean(
        row?.sku
      ),

    itemName:
      clean(
        row?.itemName
      ),

    description:
      clean(
        row?.description
      ),

    category:
      clean(
        row?.category
      ),

    quantity:
      numberValue(
        row?.quantity
      ),

    unit:
      clean(
        row?.unit
      ) ||
      "pcs",

    unitPrice:
      numberValue(
        row?.unitPrice
      ),

    gstPercent:
      numberValue(
        row?.gstPercent
      ),

    expectedDate:
      dateOnly(
        row?.expectedDate
      ),

    receivedQuantity:
      numberValue(
        row?.receivedQuantity
      ),
  };
}

function parseItems(
  value: unknown
):
  PurchaseOrderItem[] {
  if (
    Array.isArray(
      value
    )
  ) {
    return value.map(
      normalizePOItem
    );
  }

  const text =
    clean(
      value
    );

  if (!text) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(
        text
      );

    if (
      Array.isArray(
        parsed
      )
    ) {
      return parsed.map(
        normalizePOItem
      );
    }
  } catch {
    //
  }

  return [];
}

/* =========================================================
   NORMALIZE PURCHASE ORDER
========================================================= */

function normalizePO(
  row: any
):
  PurchaseOrder {
  const items =
    parseItems(
      row?.items
    );

  const ordered =
    items.reduce(
      (
        total,
        item
      ) =>
        total +
        item.quantity,
      0
    );

  const received =
    items.reduce(
      (
        total,
        item
      ) =>
        total +
        item.receivedQuantity,
      0
    );

  const subtotal =
    items.reduce(
      (
        total,
        item
      ) =>
        total +
        item.quantity *
          item.unitPrice,
      0
    );

  const taxAmount =
    items.reduce(
      (
        total,
        item
      ) =>
        total +
        (
          item.quantity *
          item.unitPrice *
          item.gstPercent
        ) /
          100,
      0
    );

  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    purchaseOrderNumber:
      clean(
        row?.purchaseOrderNumber ??
          row?.poNumber
      ),

    supplierId:
      clean(
        row?.supplierId
      ),

    supplierCode:
      clean(
        row?.supplierCode
      ),

    supplierName:
      clean(
        row?.supplierName
      ),

    supplierGstin:
      clean(
        row?.supplierGstin
      ),

    poDate:
      dateOnly(
        row?.poDate
      ),

    expectedDeliveryDate:
      dateOnly(
        row?.expectedDeliveryDate
      ),

    paymentTermsDays:
      numberValue(
        row?.paymentTermsDays
      ),

    reference:
      clean(
        row?.reference
      ),

    items:
      typeof row?.items ===
      "string"
        ? row.items
        : JSON.stringify(
            items
          ),

    subtotal:
      numberValue(
        row?.subtotal
      ) ||
      subtotal,

    taxAmount:
      numberValue(
        row?.taxAmount
      ) ||
      taxAmount,

    totalAmount:
      numberValue(
        row?.totalAmount
      ) ||
      subtotal +
        taxAmount,

    receivedQuantity:
      numberValue(
        row?.receivedQuantity
      ) ||
      received,

    pendingQuantity:
      row?.pendingQuantity !==
      undefined
        ? numberValue(
            row?.pendingQuantity
          )
        : Math.max(
            ordered -
              received,
            0
          ),

    status:
      clean(
        row?.status
      ) ||
      "Draft",

    deliveryAddress:
      clean(
        row?.deliveryAddress
      ),

    notes:
      clean(
        row?.notes
      ),

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
   NORMALIZE SUPPLIER BILL
========================================================= */

function normalizeSupplierBill(
  row: any
):
  SupplierBill {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    billNumber:
      clean(
        row?.billNumber
      ),

    supplierInvoiceNumber:
      clean(
        row?.supplierInvoiceNumber
      ),

    supplierId:
      clean(
        row?.supplierId
      ),

    supplierCode:
      clean(
        row?.supplierCode
      ),

    supplierName:
      clean(
        row?.supplierName
      ),

    purchaseOrderId:
      clean(
        row?.purchaseOrderId
      ),

    purchaseOrderNumber:
      clean(
        row?.purchaseOrderNumber
      ),

    billDate:
      dateOnly(
        row?.billDate
      ),

    dueDate:
      dateOnly(
        row?.dueDate
      ),

    subtotal:
      numberValue(
        row?.subtotal
      ),

    taxAmount:
      numberValue(
        row?.taxAmount
      ),

    totalAmount:
      numberValue(
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

/* =========================================================
   PAGE
========================================================= */

export default function PurchaseOrdersPage() {
  const [
    suppliers,
    setSuppliers,
  ] =
    useState<
      Supplier[]
    >([]);

  const [
    inventory,
    setInventory,
  ] =
    useState<
      InventoryItem[]
    >([]);

  const [
    purchaseOrders,
    setPurchaseOrders,
  ] =
    useState<
      PurchaseOrder[]
    >([]);

  const [
    supplierBills,
    setSupplierBills,
  ] =
    useState<
      SupplierBill[]
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
    showForm,
    setShowForm,
  ] =
    useState(
      false
    );

  const [
    editing,
    setEditing,
  ] =
    useState<
      PurchaseOrder | null
    >(
      null
    );

  const [
    viewing,
    setViewing,
  ] =
    useState<
      PurchaseOrder | null
    >(
      null
    );

  const [
    receivingPO,
    setReceivingPO,
  ] =
    useState<
      PurchaseOrder | null
    >(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<
      PurchaseOrderForm
    >(
      emptyForm()
    );

  const [
  items,
  setItems,
] =
  useState<
    PurchaseOrderItem[]
  >([]);

  const [
  receiptForm,
  setReceiptForm,
] =
  useState<ReceiptForm>({
    receiptDate: "",
    supplierInvoiceNumber: "",
    paymentMethod: "Credit",
    reference: "",
    notes: "",
  });
const [
  receiptItems,
  setReceiptItems,
] =
  useState<
    ReceiptItem[]
  >([]);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(
    () => {
      void loadData();
    },
    []
  );

  /* =======================================================
     BODY SCROLL LOCK
  ======================================================= */

  useEffect(
    () => {
      if (
        !showForm &&
        !viewing &&
        !receivingPO
      ) {
        return;
      }

      const oldOverflow =
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
          oldOverflow;
      };
    },
    [
      showForm,
      viewing,
      receivingPO,
    ]
  );

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

  /* =======================================================
     SAVE EXCEL
  ======================================================= */

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
      console.error(
        "Purchase Order Excel request failed:",
        {
          request:
            body,

          response:
            data,
        }
      );

      throw new Error(
        data?.message ||
          data?.error ||
          "Unable to process Excel request."
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
        supplierRows,
        inventoryRows,
        poRows,
        billRows,
        settings,
      ] =
        await Promise.all([
          loadSheet(
            "Suppliers"
          ),

          loadSheet(
            "Inventory"
          ),

          loadSheet(
            "PurchaseOrders"
          ),

          loadSheet(
            "SupplierBills"
          ),

          loadAppSettings(),
        ]);

      setSuppliers(
        supplierRows
          .map(
            normalizeSupplier
          )
          .filter(
            (
              supplier:
                Supplier
            ) =>
              Boolean(
                supplier.id
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
              item:
                InventoryItem
            ) =>
              Boolean(
                item.id &&
                item.sku
              )
          )
      );

      setPurchaseOrders(
        poRows
          .map(
            normalizePO
          )
          .filter(
            (
              po:
                PurchaseOrder
            ) =>
              Boolean(
                po.id
              )
          )
          .sort(
            (
              a,
              b
            ) =>
              String(
                b.createdAt ||
                  b.poDate
              ).localeCompare(
                String(
                  a.createdAt ||
                    a.poDate
                )
              )
          )
      );

      setSupplierBills(
        billRows
          .map(
            normalizeSupplierBill
          )
          .filter(
            (
              bill:
                SupplierBill
            ) =>
              Boolean(
                bill.id
              )
          )
      );

      setAppSettings(
        settings
      );
    } catch (
      error
    ) {
      console.error(
        "PO load error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to load Purchase Orders."
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
     ACTIVE SUPPLIERS
  ======================================================= */

  const activeSuppliers =
    useMemo(
      () =>
        suppliers.filter(
          (
            supplier
          ) =>
            normalizeText(
              supplier.status
            ) ===
            "active"
        ),
      [
        suppliers,
      ]
    );

  const selectedSupplier =
    useMemo(
      () =>
        suppliers.find(
          (
            supplier
          ) =>
            supplier.id ===
            form.supplierId
        ),
      [
        suppliers,
        form.supplierId,
      ]
    );

  /* =======================================================
     TOTALS
  ======================================================= */

  const subtotal =
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
                item.unitPrice ||
                  0
              ),
          0
        ),
      [
        items,
      ]
    );

  const taxAmount =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item
          ) =>
            total +
            (
              Number(
                item.quantity ||
                  0
              ) *
              Number(
                item.unitPrice ||
                  0
              ) *
              Number(
                item.gstPercent ||
                  0
              )
            ) /
              100,
          0
        ),
      [
        items,
      ]
    );

  const totalAmount =
    subtotal +
    taxAmount;

  const totalQty =
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
            ),
          0
        ),
      [
        items,
      ]
    );

  const receivedQty =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.receivedQuantity ||
                0
            ),
          0
        ),
      [
        items,
      ]
    );

  /* =======================================================
     PO NUMBER
  ======================================================= */

  function nextPONumber(
    year: number,
    source =
      purchaseOrders
  ) {
    const prefix =
      `PO-${year}-`;

    let highest =
      0;

    source.forEach(
      (
        po
      ) => {
        if (
          !po.purchaseOrderNumber.startsWith(
            prefix
          )
        ) {
          return;
        }

        const match =
          po.purchaseOrderNumber.match(
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
     SUPPLIER BILL NUMBER
  ======================================================= */

  function nextBillNumber(
    year: number,
    source =
      supplierBills
  ) {
    const prefix =
      `BILL-${year}-`;

    let highest =
      0;

    source.forEach(
      (
        bill
      ) => {
        if (
          !bill.billNumber.startsWith(
            prefix
          )
        ) {
          return;
        }

        const match =
          bill.billNumber.match(
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
     CREATE PO FORM
  ======================================================= */

  function openCreate() {
    const date =
      getToday();

    setEditing(
      null
    );

    setForm({
      ...emptyForm(),

      poDate:
        date,

      expectedDeliveryDate:
        addDays(
          date,
          7
        ),
    });

    setItems([
      {
        ...emptyItem(),

        expectedDate:
          addDays(
            date,
            7
          ),
      },
    ]);

    setShowForm(
      true
    );
  }

  /* =======================================================
     EDIT PO
  ======================================================= */

  function openEdit(
    po:
      PurchaseOrder
  ) {
    if (
      po.receivedQuantity >
      0
    ) {
      alert(
        "This Purchase Order already has received stock. Use Receive Stock for further deliveries instead of changing the commercial PO lines."
      );

      return;
    }

    setEditing(
      po
    );

    setForm({
      supplierId:
        po.supplierId,

      poDate:
        po.poDate,

      expectedDeliveryDate:
        po.expectedDeliveryDate,

      paymentTermsDays:
        po.paymentTermsDays,

      reference:
        po.reference,

      status:
        po.status,

      deliveryAddress:
        po.deliveryAddress,

      notes:
        po.notes,
    });

    const parsed =
      parseItems(
        po.items
      );

    setItems(
      parsed.length >
        0
        ? parsed
        : [
            emptyItem(),
          ]
    );

    setShowForm(
      true
    );
  }

  function closeForm() {
    setShowForm(
      false
    );

    setEditing(
      null
    );

    setForm(
      emptyForm()
    );

    setItems([
      emptyItem(),
    ]);
  }

  /* =======================================================
     SUPPLIER CHANGE
  ======================================================= */

  function handleSupplierChange(
    supplierId:
      string
  ) {
    const supplier =
      suppliers.find(
        (
          row
        ) =>
          row.id ===
          supplierId
      );

    setForm(
      (
        current
      ) => ({
        ...current,

        supplierId,

        paymentTermsDays:
          supplier
            ?.paymentTermsDays ||
          current.paymentTermsDays,

        expectedDeliveryDate:
          current.poDate
            ? addDays(
                current.poDate,
                supplier
                  ?.leadTimeDays ||
                  7
              )
            : current.expectedDeliveryDate,
      })
    );
  }

  /* =======================================================
     ITEMS
  ======================================================= */

  function addItem() {
    setItems(
      (
        current
      ) => [
        ...current,

        {
          ...emptyItem(),

          expectedDate:
            form.expectedDeliveryDate,
        },
      ]
    );
  }

  function removeItem(
    id: string
  ) {
    if (
      items.length <=
      1
    ) {
      alert(
        "A Purchase Order must contain at least one item."
      );

      return;
    }

    setItems(
      (
        current
      ) =>
        current.filter(
          (
            item
          ) =>
            item.id !==
            id
        )
    );
  }

  function updateItem<
    K extends
      keyof PurchaseOrderItem
  >(
    id: string,
    field: K,
    value:
      PurchaseOrderItem[K]
  ) {
    setItems(
      (
        current
      ) =>
        current.map(
          (
            item
          ) =>
            item.id ===
            id
              ? {
                  ...item,

                  [field]:
                    value,
                }
              : item
        )
    );
  }

  /* =======================================================
     SELECT INVENTORY SKU
  ======================================================= */

  function selectInventory(
    poItemId: string,
    inventoryId: string
  ) {
    const source =
      inventory.find(
        (
          item
        ) =>
          item.id ===
          inventoryId
      );

    setItems(
      (
        current
      ) =>
        current.map(
          (
            item
          ) => {
            if (
              item.id !==
              poItemId
            ) {
              return item;
            }

            if (
              !source
            ) {
              return {
                ...item,

                inventoryId:
                  "",

                sku:
                  "",

                itemName:
                  "",

                description:
                  "",

                category:
                  "",

                unit:
                  "pcs",

                unitPrice:
                  0,
              };
            }

            return {
              ...item,

              inventoryId:
                source.id,

              sku:
                source.sku,

              itemName:
                source.itemName,

              description:
                source.description ||
                source.itemName,

              category:
                source.category,

              unit:
                source.unit,

              /*
               * Suggest current weighted-average
               * Inventory cost.
               *
               * User can overwrite with supplier quote.
               */
              unitPrice:
                source.unitCost ||
                item.unitPrice,
            };
          }
        )
    );
  }

  /* =======================================================
     DERIVE PO STATUS
  ======================================================= */

  function deriveStatus(
    currentItems =
      items
  ) {
    if (
      form.status ===
        "Cancelled" ||
      form.status ===
        "Closed"
    ) {
      return form.status;
    }

    const ordered =
      currentItems.reduce(
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

    const received =
      currentItems.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.receivedQuantity ||
              0
          ),
        0
      );

    if (
      ordered >
        0 &&
      received >=
        ordered
    ) {
      return "Received";
    }

    if (
      received >
      0
    ) {
      return "Partially Received";
    }

    return form.status;
  }

  /* =======================================================
     SAVE PO
  ======================================================= */

  async function savePO() {
    if (
      !selectedSupplier
    ) {
      alert(
        "Please select an active Supplier."
      );

      return;
    }

    if (
      !form.poDate
    ) {
      alert(
        "PO Date is required."
      );

      return;
    }

    if (
      !form.expectedDeliveryDate
    ) {
      alert(
        "Expected Delivery Date is required."
      );

      return;
    }

    if (
      form.expectedDeliveryDate <
      form.poDate
    ) {
      alert(
        "Expected Delivery Date cannot be before PO Date."
      );

      return;
    }

    if (
      Number(
        form.paymentTermsDays
      ) <
      0
    ) {
      alert(
        "Payment Terms cannot be negative."
      );

      return;
    }

    for (
      let index =
        0;
      index <
        items.length;
      index +=
        1
    ) {
      const item =
        items[index];

      if (
        !item.inventoryId
      ) {
        alert(
          `Item ${index + 1}: Select an Inventory SKU.`
        );

        return;
      }

      if (
        !item.sku
      ) {
        alert(
          `Item ${index + 1}: SKU is required.`
        );

        return;
      }

      if (
        !item.itemName
      ) {
        alert(
          `Item ${index + 1}: Item Name is required.`
        );

        return;
      }

      if (
        Number(
          item.quantity
        ) <=
        0
      ) {
        alert(
          `Item ${index + 1}: Quantity must be greater than zero.`
        );

        return;
      }

      if (
        Number(
          item.unitPrice
        ) <
        0
      ) {
        alert(
          `Item ${index + 1}: Unit Cost cannot be negative.`
        );

        return;
      }

      if (
        Number(
          item.gstPercent
        ) <
        0
      ) {
        alert(
          `Item ${index + 1}: GST cannot be negative.`
        );

        return;
      }
    }

    /*
     * Prevent same SKU appearing twice.
     */
    const usedSkus =
      new Set<string>();

    for (
      const item of
      items
    ) {
      const key =
        normalizeText(
          item.sku
        );

      if (
        usedSkus.has(
          key
        )
      ) {
        alert(
          `SKU ${item.sku} appears more than once. Combine it into one Purchase Order line.`
        );

        return;
      }

      usedSkus.add(
        key
      );
    }

    try {
      setSaving(
        true
      );

      /*
       * Reload live Purchase Orders before creating
       * next PO number.
       */
      const liveRows =
        await loadSheet(
          "PurchaseOrders"
        );

      const livePOs =
        liveRows
          .map(
            normalizePO
          )
          .filter(
            (
              po:
                PurchaseOrder
            ) =>
              Boolean(
                po.id
              )
          );

      const now =
        getNow();

      const year =
        Number(
          form.poDate.slice(
            0,
            4
          )
        );

      const poNumber =
        editing
          ? editing.purchaseOrderNumber
          : nextPONumber(
              year,
              livePOs
            );

      const safeItems =
        items.map(
          (
            item
          ) => ({
            ...item,

            /*
             * Receiving is never typed manually.
             */
            receivedQuantity:
              editing
                ? item.receivedQuantity
                : 0,
          })
        );

      const ordered =
        safeItems.reduce(
          (
            total,
            item
          ) =>
            total +
            item.quantity,
          0
        );

      const received =
        safeItems.reduce(
          (
            total,
            item
          ) =>
            total +
            item.receivedQuantity,
          0
        );

      const record = {
        purchaseOrderNumber:
          poNumber,

        supplierId:
          selectedSupplier.id,

        supplierCode:
          selectedSupplier.supplierCode,

        supplierName:
          selectedSupplier.supplierName,

        supplierGstin:
          selectedSupplier.gstin,

        poDate:
          form.poDate,

        expectedDeliveryDate:
          form.expectedDeliveryDate,

        paymentTermsDays:
          Number(
            form.paymentTermsDays
          ),

        reference:
          form.reference.trim(),

        items:
          JSON.stringify(
            safeItems
          ),

        subtotal:
          roundMoney(
            subtotal
          ),

        taxAmount:
          roundMoney(
            taxAmount
          ),

        totalAmount:
          roundMoney(
            totalAmount
          ),

        receivedQuantity:
          received,

        pendingQuantity:
          Math.max(
            ordered -
              received,
            0
          ),

        status:
          deriveStatus(
            safeItems
          ),

        deliveryAddress:
          form.deliveryAddress.trim(),

        notes:
          form.notes.trim(),

        updatedAt:
          now,
      };

      await saveExcel({
        action:
          editing
            ? "update"
            : "add",

        sheet:
          "PurchaseOrders",

        ...(editing
          ? {
              id:
                editing.id,
            }
          : {}),

        record:
          editing
            ? {
                ...editing,

                ...record,
              }
            : {
                id:
                  generateId(),

                ...record,

                createdAt:
                  now,
              },
      });

      closeForm();

      await loadData(
        true
      );

      alert(
        `${poNumber} saved successfully.`
      );
    } catch (
      error
    ) {
      console.error(
        "PO save error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to save Purchase Order."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     OPEN RECEIVE STOCK
  ======================================================= */

  function openReceive(
    po:
      PurchaseOrder
  ) {
    if (
      po.status ===
      "Draft"
    ) {
      alert(
        "Approve or send the Purchase Order before receiving stock."
      );

      return;
    }

    if (
      [
        "Cancelled",
        "Closed",
      ].includes(
        po.status
      )
    ) {
      alert(
        `${po.status} Purchase Orders cannot receive stock.`
      );

      return;
    }

    const poItems =
      parseItems(
        po.items
      );

    const remainingItems =
      poItems
        .filter(
          (
            item
          ) =>
            item.receivedQuantity <
            item.quantity
        )
        .map(
          (
            item
          ) => ({
            poItemId:
              item.id,

            inventoryId:
              item.inventoryId,

            sku:
              item.sku,

            itemName:
              item.itemName,

            unit:
              item.unit,

            orderedQuantity:
              item.quantity,

            alreadyReceived:
              item.receivedQuantity,

            pendingQuantity:
              Math.max(
                item.quantity -
                  item.receivedQuantity,
                0
              ),

            receiveQuantity:
              Math.max(
                item.quantity -
                  item.receivedQuantity,
                0
              ),

            unitCost:
              item.unitPrice,

            gstPercent:
              item.gstPercent,
          })
        );

    if (
      remainingItems.length ===
      0
    ) {
      alert(
        "This Purchase Order is already fully received."
      );

      return;
    }

    setReceivingPO(
      po
    );

    setReceiptForm(
      emptyReceiptForm()
    );

    setReceiptItems(
      remainingItems
    );
  }

  function closeReceive() {
    setReceivingPO(
      null
    );

    setReceiptItems(
      []
    );

    setReceiptForm(
      emptyReceiptForm()
    );
  }

  function updateReceiptItem(
    poItemId: string,
    field:
      | "receiveQuantity"
      | "unitCost",
    value: number
  ) {
    setReceiptItems(
      (
        current
      ) =>
        current.map(
          (
            item
          ) =>
            item.poItemId ===
            poItemId
              ? {
                  ...item,

                  [field]:
                    value,
                }
              : item
        )
    );
  }

  /* =======================================================
     RECEIPT TOTALS
  ======================================================= */

  const receivingSubtotal =
    useMemo(
      () =>
        receiptItems.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.receiveQuantity ||
                0
            ) *
              Number(
                item.unitCost ||
                  0
              ),
          0
        ),
      [
        receiptItems,
      ]
    );

  const receivingTax =
    useMemo(
      () =>
        receiptItems.reduce(
          (
            total,
            item
          ) =>
            total +
            (
              Number(
                item.receiveQuantity ||
                  0
              ) *
              Number(
                item.unitCost ||
                  0
              ) *
              Number(
                item.gstPercent ||
                  0
              )
            ) /
              100,
          0
        ),
      [
        receiptItems,
      ]
    );

  const receivingTotal =
    receivingSubtotal +
    receivingTax;

  /* =======================================================
     RECEIVE STOCK
  ======================================================= */

  async function receiveStock() {
    if (
      !receivingPO
    ) {
      return;
    }

    if (
      !receiptForm.receiptDate
    ) {
      alert(
        "Receipt Date is required."
      );

      return;
    }

    if (
      !receiptForm.supplierInvoiceNumber.trim()
    ) {
      alert(
        "Supplier Invoice / Delivery Note Number is required."
      );

      return;
    }

    if (
      receiptForm.paymentMethod ===
        "Cheque" &&
      !receiptForm.reference.trim()
    ) {
      alert(
        "Cheque Number / Payment Reference is required."
      );

      return;
    }

    const receiving =
      receiptItems.filter(
        (
          item
        ) =>
          Number(
            item.receiveQuantity
          ) >
          0
      );

    if (
      receiving.length ===
      0
    ) {
      alert(
        "Enter at least one quantity to receive."
      );

      return;
    }

    for (
      const item of
      receiving
    ) {
      if (
        item.receiveQuantity >
        item.pendingQuantity
      ) {
        alert(
          `${item.sku}: Receive quantity cannot exceed ${item.pendingQuantity} ${item.unit}.`
        );

        return;
      }

      if (
        Number(
          item.unitCost
        ) <=
        0
      ) {
        alert(
          `${item.sku}: Actual Unit Cost must be greater than zero.`
        );

        return;
      }
    }

    try {
      setSaving(
        true
      );

      /*
       * Reload everything important before posting receipt.
       */
      const [
        livePoRows,
        liveInventoryRows,
        transactionRows,
        liveBillRows,
      ] =
        await Promise.all([
          loadSheet(
            "PurchaseOrders"
          ),

          loadSheet(
            "Inventory"
          ),

          loadSheet(
            "InventoryTransactions"
          ),

          loadSheet(
            "SupplierBills"
          ),
        ]);

      const livePO =
        livePoRows
          .map(
            normalizePO
          )
          .find(
            (
              po
            ) =>
              po.id ===
              receivingPO.id
          );

      if (
        !livePO
      ) {
        throw new Error(
          "Purchase Order no longer exists."
        );
      }

      if (
        [
          "Cancelled",
          "Closed",
        ].includes(
          livePO.status
        )
      ) {
        throw new Error(
          `${livePO.status} Purchase Orders cannot receive stock.`
        );
      }

      const existingTransactions =
        transactionRows.map(
          (
            row:
              any
          ) => ({
            ...row,

            inventoryId:
              clean(
                row?.inventoryId
              ),

            supplier:
              clean(
                row?.supplier
              ),

            purchaseNumber:
              clean(
                row?.purchaseNumber
              ),

            referenceId:
              clean(
                row?.referenceId
              ),
          })
        );

      /*
       * Warn against duplicate supplier document.
       */
      const duplicateReceipt =
        existingTransactions.some(
          (
            transaction
          ) =>
            sameValue(
              transaction.purchaseNumber,
              receiptForm.supplierInvoiceNumber
            ) &&
            sameValue(
              transaction.referenceId,
              livePO.purchaseOrderNumber
            ) &&
            sameValue(
              transaction.supplier,
              livePO.supplierName
            )
        );

      if (
        duplicateReceipt
      ) {
        const proceed =
          confirm(
            `Supplier document ${receiptForm.supplierInvoiceNumber} has already been recorded against ${livePO.purchaseOrderNumber}.\n\nContinue anyway?`
          );

        if (
          !proceed
        ) {
          return;
        }
      }

      /*
       * Credit invoice duplicate check.
       */
      const liveBills =
        liveBillRows
          .map(
            normalizeSupplierBill
          )
          .filter(
            (
              bill
            ) =>
              Boolean(
                bill.id
              )
          );

      if (
        receiptForm.paymentMethod ===
        "Credit"
      ) {
        const duplicateBill =
          liveBills.find(
            (
              bill
            ) =>
              sameValue(
                bill.supplierId,
                livePO.supplierId
              ) &&
              sameValue(
                bill.supplierInvoiceNumber,
                receiptForm.supplierInvoiceNumber
              )
          );

        if (
          duplicateBill
        ) {
          throw new Error(
            `Supplier Invoice ${receiptForm.supplierInvoiceNumber} already exists as ${duplicateBill.billNumber}.`
          );
        }
      }

      const liveInventory =
        liveInventoryRows.map(
          normalizeInventory
        );

      const livePOItems =
        parseItems(
          livePO.items
        );

      const now =
        getNow();

      let receiptSubtotal =
        0;

      let receiptTax =
        0;

      /*
       * ===============================================
       * PROCESS EACH RECEIVED ITEM
       * ===============================================
       */
      for (
        const receiptItem of
        receiving
      ) {
        const livePOItem =
          livePOItems.find(
            (
              item
            ) =>
              item.id ===
                receiptItem.poItemId ||
              (
                item.inventoryId &&
                item.inventoryId ===
                  receiptItem.inventoryId
              )
          );

        if (
          !livePOItem
        ) {
          throw new Error(
            `Unable to find PO Item ${receiptItem.sku}.`
          );
        }

        const livePending =
          Math.max(
            livePOItem.quantity -
              livePOItem.receivedQuantity,
            0
          );

        if (
          receiptItem.receiveQuantity >
          livePending
        ) {
          throw new Error(
            `${receiptItem.sku} now has only ${livePending} ${receiptItem.unit} pending. Please refresh and try again.`
          );
        }

        const inventoryItem =
          liveInventory.find(
            (
              item
            ) =>
              item.id ===
                receiptItem.inventoryId ||
              sameValue(
                item.sku,
                receiptItem.sku
              )
          );

        if (
          !inventoryItem
        ) {
          throw new Error(
            `Inventory SKU ${receiptItem.sku} no longer exists.`
          );
        }

        const previousQuantity =
          Number(
            inventoryItem.quantity ||
              0
          );

        const receivedQuantity =
          Number(
            receiptItem.receiveQuantity
          );

        const newQuantity =
          previousQuantity +
          receivedQuantity;

        const previousAverageCost =
          Number(
            inventoryItem.unitCost ||
              0
          );

        const actualUnitCost =
          Number(
            receiptItem.unitCost
          );

        const previousValue =
          previousQuantity *
          previousAverageCost;

        const receivedValue =
          receivedQuantity *
          actualUnitCost;

        /*
         * Weighted Average:
         *
         * existing value + new value
         * --------------------------
         *       new quantity
         */
        const newAverageCost =
          newQuantity >
          0
            ? roundMoney(
                (
                  previousValue +
                  receivedValue
                ) /
                  newQuantity
              )
            : actualUnitCost;

        /*
         * ===========================================
         * 1. UPDATE INVENTORY
         * ===========================================
         */

        await saveExcel({
          action:
            "update",

          sheet:
            "Inventory",

          id:
            inventoryItem.id,

          record: {
            ...inventoryItem,

            /*
             * Inventory master uses name.
             */
            name:
              inventoryItem.itemName,

            quantity:
              newQuantity,

            /*
             * Inventory.price stores
             * weighted-average cost.
             */
            price:
              newAverageCost,

            supplier:
              livePO.supplierName,

            updatedAt:
              now,
          },
        });

        /*
         * Keep in-memory copy accurate.
         */
        inventoryItem.quantity =
          newQuantity;

        inventoryItem.unitCost =
          newAverageCost;

        /*
         * ===========================================
         * 2. INVENTORY TRANSACTION
         * ===========================================
         */

        await saveExcel({
          action:
            "add",

          sheet:
            "InventoryTransactions",

          record: {
            id:
              generateId(),

            inventoryId:
              inventoryItem.id,

            sku:
              inventoryItem.sku,

            itemName:
              inventoryItem.itemName,

            type:
              "IN",

            quantity:
              receivedQuantity,

            previousQuantity,

            newQuantity,

            supplier:
              livePO.supplierName,

            purchaseNumber:
              receiptForm
                .supplierInvoiceNumber
                .trim(),

            unitCost:
              actualUnitCost,

            purchaseAmount:
              roundMoney(
                receivedValue
              ),

            referenceType:
              "Purchase Order",

            referenceId:
              livePO.purchaseOrderNumber,

            notes:
              receiptForm.notes.trim(),

            createdAt:
              now,
          },
        });

        /*
         * ===========================================
         * 3. UPDATE PO ITEM RECEIVED QTY
         * ===========================================
         */

        livePOItem.receivedQuantity =
          livePOItem.receivedQuantity +
          receivedQuantity;

        /*
         * Save actual supplier invoice cost.
         */
        livePOItem.unitPrice =
          actualUnitCost;

        const lineTax =
          (
            receivedValue *
            Number(
              livePOItem.gstPercent ||
                0
            )
          ) /
          100;

        receiptSubtotal +=
          receivedValue;

        receiptTax +=
          lineTax;
      }

      /*
       * ===============================================
       * UPDATE PO STATUS AND TOTALS
       * ===============================================
       */

      const orderedTotal =
        livePOItems.reduce(
          (
            total,
            item
          ) =>
            total +
            item.quantity,
          0
        );

      const receivedTotal =
        livePOItems.reduce(
          (
            total,
            item
          ) =>
            total +
            item.receivedQuantity,
          0
        );

      const pendingTotal =
        Math.max(
          orderedTotal -
            receivedTotal,
          0
        );

      const updatedSubtotal =
        livePOItems.reduce(
          (
            total,
            item
          ) =>
            total +
            item.quantity *
              item.unitPrice,
          0
        );

      const updatedTax =
        livePOItems.reduce(
          (
            total,
            item
          ) =>
            total +
            (
              item.quantity *
              item.unitPrice *
              item.gstPercent
            ) /
              100,
          0
        );

      const newPOStatus =
        pendingTotal <=
        0
          ? "Received"
          : receivedTotal >
            0
          ? "Partially Received"
          : livePO.status;

      await saveExcel({
        action:
          "update",

        sheet:
          "PurchaseOrders",

        id:
          livePO.id,

        record: {
          ...livePO,

          items:
            JSON.stringify(
              livePOItems
            ),

          subtotal:
            roundMoney(
              updatedSubtotal
            ),

          taxAmount:
            roundMoney(
              updatedTax
            ),

          totalAmount:
            roundMoney(
              updatedSubtotal +
                updatedTax
            ),

          receivedQuantity:
            receivedTotal,

          pendingQuantity:
            pendingTotal,

          status:
            newPOStatus,

          updatedAt:
            now,
        },
      });

      /*
       * ===============================================
       * RECEIPT VALUE
       * ===============================================
       */

      const receiptSubtotalRounded =
        roundMoney(
          receiptSubtotal
        );

      const receiptTaxRounded =
        roundMoney(
          receiptTax
        );

      const receiptTotal =
        roundMoney(
          receiptSubtotal +
            receiptTax
        );

      /*
       * ===============================================
       * 4. RECORD PURCHASE COST / EXPENSE
       * ===============================================
       */

      await saveExcel({
        action:
          "add",

        sheet:
          "Expenses",

        record: {
          id:
            generateId(),

          date:
            receiptForm.receiptDate,

          category:
            "Inventory Purchase",

          recommendedCategory:
            "Inventory Purchase",

          description:
            `Inventory received against ${livePO.purchaseOrderNumber} from ${livePO.supplierName}`,

          amount:
            receiptTotal,

          paymentMethod:
            receiptForm.paymentMethod,

          reference:
            receiptForm
              .supplierInvoiceNumber
              .trim(),

          supplier:
            livePO.supplierName,

          supplierId:
            livePO.supplierId,

          supplierCode:
            livePO.supplierCode,

          purchaseOrderId:
            livePO.id,

          purchaseOrderNumber:
            livePO.purchaseOrderNumber,

          supplierInvoiceNumber:
            receiptForm
              .supplierInvoiceNumber
              .trim(),

          subtotal:
            receiptSubtotalRounded,

          taxAmount:
            receiptTaxRounded,

          notes:
            receiptForm.notes.trim(),

          createdAt:
            now,
        },
      });

      /*
       * ===============================================
       * 5. CREDIT PURCHASE → SUPPLIER BILL
       * ===============================================
       */

      let createdBillNumber =
        "";

      if (
        receiptForm.paymentMethod ===
        "Credit"
      ) {
        const supplier =
          suppliers.find(
            (
              row
            ) =>
              row.id ===
              livePO.supplierId
          );

        const terms =
          Number(
            supplier
              ?.paymentTermsDays ||
              livePO.paymentTermsDays ||
              30
          );

        const dueDate =
          addDays(
            receiptForm.receiptDate,
            terms
          );

        const year =
          Number(
            receiptForm.receiptDate.slice(
              0,
              4
            )
          );

        createdBillNumber =
          nextBillNumber(
            year,
            liveBills
          );

        await saveExcel({
          action:
            "add",

          sheet:
            "SupplierBills",

          record: {
            id:
              generateId(),

            billNumber:
              createdBillNumber,

            supplierInvoiceNumber:
              receiptForm
                .supplierInvoiceNumber
                .trim(),

            supplierId:
              livePO.supplierId,

            supplierCode:
              livePO.supplierCode,

            supplierName:
              livePO.supplierName,

            purchaseOrderId:
              livePO.id,

            purchaseOrderNumber:
              livePO.purchaseOrderNumber,

            billDate:
              receiptForm.receiptDate,

            dueDate,

            subtotal:
              receiptSubtotalRounded,

            taxAmount:
              receiptTaxRounded,

            totalAmount:
              receiptTotal,

            notes:
              receiptForm.notes.trim(),

            status:
              "UNPAID",

            createdAt:
              now,

            updatedAt:
              now,
          },
        });
      }

      const supplierInvoice =
        receiptForm
          .supplierInvoiceNumber;

      const paymentMethod =
        receiptForm
          .paymentMethod;

      closeReceive();

      setViewing(
        null
      );

      await loadData(
        true
      );

      if (
        paymentMethod ===
        "Credit"
      ) {
        alert(
          `Stock received successfully.\n\n${livePO.purchaseOrderNumber}\nSupplier Invoice: ${supplierInvoice}\nReceipt Value: ${money(
            receiptTotal,
            appSettings.currencySymbol ||
              "₹"
          )}\n\nSupplier Bill ${createdBillNumber} created as UNPAID.\nPO Status: ${newPOStatus}`
        );
      } else {
        alert(
          `Stock received successfully.\n\n${livePO.purchaseOrderNumber}\nSupplier Invoice: ${supplierInvoice}\nReceipt Value: ${money(
            receiptTotal,
            appSettings.currencySymbol ||
              "₹"
          )}\nPayment Method: ${paymentMethod}\nPO Status: ${newPOStatus}`
        );
      }
    } catch (
      error
    ) {
      console.error(
        "PO receipt error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to receive Purchase Order."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     DELETE PO
  ======================================================= */

  async function deletePO(
    po:
      PurchaseOrder
  ) {
    if (
      Number(
        po.receivedQuantity
      ) >
        0 ||
      [
        "Partially Received",
        "Received",
        "Closed",
      ].includes(
        po.status
      )
    ) {
      alert(
        "A Purchase Order with received stock cannot be deleted."
      );

      return;
    }

    const linkedBill =
      supplierBills.some(
        (
          bill
        ) =>
          sameValue(
            bill.purchaseOrderId,
            po.id
          ) ||
          sameValue(
            bill.purchaseOrderNumber,
            po.purchaseOrderNumber
          )
      );

    if (
      linkedBill
    ) {
      alert(
        "This Purchase Order has Supplier Bill history and cannot be deleted."
      );

      return;
    }

    if (
      !confirm(
        `Delete ${po.purchaseOrderNumber}?`
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
          "PurchaseOrders",

        id:
          po.id,
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
          : "Unable to delete Purchase Order."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     FILTER
  ======================================================= */

  const filtered =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return purchaseOrders.filter(
          (
            po
          ) => {
            const statusOK =
              statusFilter ===
                "All" ||
              po.status ===
                statusFilter;

            const text =
              [
                po.purchaseOrderNumber,
                po.supplierName,
                po.supplierCode,
                po.reference,
                po.status,
                po.items,
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
        purchaseOrders,
        search,
        statusFilter,
      ]
    );

  /* =======================================================
     STATS
  ======================================================= */

  const openPOs =
    purchaseOrders.filter(
      (
        po
      ) =>
        ![
          "Received",
          "Closed",
          "Cancelled",
        ].includes(
          po.status
        )
    );

  const openPOValue =
    openPOs.reduce(
      (
        total,
        po
      ) =>
        total +
        po.totalAmount,
      0
    );

  const totalPendingQty =
    purchaseOrders.reduce(
      (
        total,
        po
      ) =>
        total +
        po.pendingQuantity,
      0
    );

  const overduePOs =
    purchaseOrders.filter(
      (
        po
      ) =>
        po.pendingQuantity >
          0 &&
        po.expectedDeliveryDate &&
        po.expectedDeliveryDate <
          getToday() &&
        ![
          "Cancelled",
          "Closed",
        ].includes(
          po.status
        )
    ).length;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="h-full min-h-0 overflow-y-auto">

      <div className="mx-auto w-full max-w-7xl space-y-6 pb-24">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>

            <div className="mb-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-700">
              Procurement
            </div>

            <h1 className="text-3xl font-black">
              Purchase Orders
            </h1>

            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
              Purchase existing Inventory SKUs,
              receive supplier deliveries and
              automatically update stock, weighted
              average cost, purchase expenses and
              supplier payables.
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
              onClick={
                openCreate
              }
              className="rounded-xl bg-amber-600 px-5 py-3 font-black text-white hover:bg-amber-700"
            >
              + Create Purchase Order
            </button>

          </div>

        </div>

        {/* FLOW */}

        <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-5">

          <div className="font-black text-amber-900">
            📦 Supplier → Purchase Order → Goods Receipt → Inventory
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Creating a Purchase Order does not
            increase stock. Inventory changes only
            when goods are physically received.
            Credit receipts also create a Supplier
            Bill automatically.
          </p>

        </div>

        {/* STATS */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <Stat
            label="Purchase Orders"
            value={String(
              purchaseOrders.length
            )}
            tone="blue"
          />

          <Stat
            label="Open POs"
            value={String(
              openPOs.length
            )}
            tone="amber"
          />

          <Stat
            label="Pending Qty"
            value={String(
              totalPendingQty
            )}
            tone="violet"
          />

          <Stat
            label="Open PO Value"
            value={money(
              openPOValue,
              appSettings.currencySymbol ||
                "₹"
            )}
            tone="green"
          />

          <Stat
            label="Overdue POs"
            value={String(
              overduePOs
            )}
            tone="rose"
          />

        </div>

        {/* FILTER */}

        <div className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[1fr_240px]">

          <input
            value={
              search
            }
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search PO, supplier, SKU, item or status..."
            className="rounded-xl border px-4 py-3"
          />

          <select
            value={
              statusFilter
            }
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="rounded-xl border bg-white px-4 py-3"
          >

            <option value="All">
              All Statuses
            </option>

            {PO_STATUSES.map(
              (
                status
              ) => (

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

        </div>

        {/* TABLE */}

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          {loading ? (

            <div className="p-10 text-center text-slate-500">
              Loading Purchase Orders...
            </div>

          ) : filtered.length ===
            0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl">
                🧾
              </div>

              <h2 className="mt-4 text-xl font-black">
                No Purchase Orders Found
              </h2>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1350px] text-left text-sm">

                <thead>

                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                    <th className="px-4 py-4">
                      PO Number
                    </th>

                    <th className="px-4 py-4">
                      Supplier
                    </th>

                    <th className="px-4 py-4">
                      PO Date
                    </th>

                    <th className="px-4 py-4">
                      Expected
                    </th>

                    <th className="px-4 py-4">
                      Items
                    </th>

                    <th className="px-4 py-4">
                      Received
                    </th>

                    <th className="px-4 py-4">
                      Pending
                    </th>

                    <th className="px-4 py-4">
                      Value
                    </th>

                    <th className="px-4 py-4">
                      Status
                    </th>

                    <th className="px-4 py-4">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filtered.map(
                    (
                      po
                    ) => {
                      const poItems =
                        parseItems(
                          po.items
                        );

                      const canReceive =
                        po.pendingQuantity >
                          0 &&
                        ![
                          "Draft",
                          "Cancelled",
                          "Closed",
                        ].includes(
                          po.status
                        );

                      const overdue =
                        po.pendingQuantity >
                          0 &&
                        Boolean(
                          po.expectedDeliveryDate
                        ) &&
                        po.expectedDeliveryDate <
                          getToday() &&
                        ![
                          "Cancelled",
                          "Closed",
                        ].includes(
                          po.status
                        );

                      return (

                        <tr
                          key={
                            po.id
                          }
                          className="border-b last:border-0 hover:bg-slate-50"
                        >

                          <td className="px-4 py-4">

                            <div className="font-black text-amber-700">
                              {
                                po.purchaseOrderNumber
                              }
                            </div>

                            {overdue && (

                              <div className="mt-1 text-xs font-bold text-red-600">
                                Delivery overdue
                              </div>

                            )}

                          </td>

                          <td className="px-4 py-4">

                            <div className="font-semibold">
                              {
                                po.supplierName
                              }
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                              {
                                po.supplierCode
                              }
                            </div>

                          </td>

                          <td className="px-4 py-4">
                            {
                              po.poDate ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-4">
                            {
                              po.expectedDeliveryDate ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-4">

                            <div className="font-semibold text-blue-700">
                              {
                                poItems[0]
                                  ?.sku ||
                                "—"
                              }
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {
                                poItems[0]
                                  ?.itemName ||
                                "—"
                              }
                            </div>

                            {poItems.length >
                              1 && (

                              <div className="mt-1 text-xs font-bold text-blue-600">
                                +{poItems.length - 1} more
                              </div>

                            )}

                          </td>

                          <td className="px-4 py-4 font-black text-green-700">
                            {
                              po.receivedQuantity
                            }
                          </td>

                          <td className="px-4 py-4 font-black text-orange-600">
                            {
                              po.pendingQuantity
                            }
                          </td>

                          <td className="px-4 py-4 font-black">
                            {money(
                              po.totalAmount,
                              appSettings.currencySymbol ||
                                "₹"
                            )}
                          </td>

                          <td className="px-4 py-4">

                            <StatusBadge
                              status={
                                po.status
                              }
                            />

                          </td>

                          <td className="px-4 py-4">

                            <div className="flex flex-wrap gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  setViewing(
                                    po
                                  )
                                }
                                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold"
                              >
                                View
                              </button>

                              {canReceive && (

                                <button
                                  type="button"
                                  onClick={() =>
                                    openReceive(
                                      po
                                    )
                                  }
                                  className="rounded-lg bg-green-50 px-3 py-2 text-xs font-black text-green-700"
                                >
                                  Receive Stock
                                </button>

                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    po
                                  )
                                }
                                disabled={
                                  po.receivedQuantity >
                                  0
                                }
                                className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-40"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void deletePO(
                                    po
                                  )
                                }
                                disabled={
                                  saving ||
                                  po.receivedQuantity >
                                    0
                                }
                                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-40"
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        </tr>

                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

      {/* =================================================
          CREATE / EDIT PO
      ================================================= */}

      {showForm && (

        <ModalOverlay>

          <div className="my-5 flex max-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

            <ModalHeader
              title={
                editing
                  ? `Edit ${editing.purchaseOrderNumber}`
                  : "Create Purchase Order"
              }
              caption="Supplier Purchase Order"
              onClose={
                closeForm
              }
            />

            <div className="min-h-0 flex-1 overflow-y-auto p-6">

              <div className="space-y-6">

                {/* SUPPLIER */}

                <Section
                  title="Supplier & Commercial Terms"
                  description="Select an active Supplier and define the Purchase Order terms."
                >

                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

                    <Field
                      label="Supplier *"
                      caption="Only Active Supplier Masters are available."
                    >

                      <select
                        value={
                          form.supplierId
                        }
                        onChange={(e) =>
                          handleSupplierChange(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      >

                        <option value="">
                          Select Supplier
                        </option>

                        {activeSuppliers.map(
                          (
                            supplier
                          ) => (

                            <option
                              key={
                                supplier.id
                              }
                              value={
                                supplier.id
                              }
                            >
                              {
                                supplier.supplierCode
                              }
                              {" — "}
                              {
                                supplier.supplierName
                              }
                            </option>

                          )
                        )}

                      </select>

                    </Field>

                    <DateField
                      label="PO Date *"
                      caption="Purchase Order issue date."
                      value={
                        form.poDate
                      }
                      set={(value) => {
                        setForm({
                          ...form,

                          poDate:
                            value,
                        });
                      }}
                    />

                    <DateField
                      label="Expected Delivery *"
                      caption="Expected supplier delivery date."
                      value={
                        form.expectedDeliveryDate
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          expectedDeliveryDate:
                            value,
                        })
                      }
                    />

                    <NumberField
                      label="Payment Terms (Days)"
                      caption="Default supplier credit period."
                      value={
                        form.paymentTermsDays
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          paymentTermsDays:
                            value,
                        })
                      }
                    />

                    <Input
                      label="Supplier Quote / Reference"
                      caption="Supplier quotation or purchasing reference."
                      value={
                        form.reference
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          reference:
                            value,
                        })
                      }
                    />

                    <Field
                      label="PO Status"
                      caption="Approve or send a PO before goods can be received."
                    >

                      <select
                        value={
                          form.status
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,

                            status:
                              e.target.value,
                          })
                        }
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      >

                        {[
                          "Draft",
                          "Approved",
                          "Sent to Supplier",
                          "Closed",
                          "Cancelled",
                        ].map(
                          (
                            status
                          ) => (

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

                  </div>

                  {selectedSupplier && (

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">

                      <Info
                        label="Supplier Code"
                        value={
                          selectedSupplier.supplierCode
                        }
                      />

                      <Info
                        label="GSTIN"
                        value={
                          selectedSupplier.gstin ||
                          "—"
                        }
                      />

                      <Info
                        label="Lead Time"
                        value={`${selectedSupplier.leadTimeDays} days`}
                      />

                    </div>

                  )}

                </Section>

                {/* ITEMS */}

                <Section
                  title="Purchase Items"
                  description="Purchase existing Inventory SKUs. Do not create duplicate stock items from a Purchase Order."
                >

                  <div className="space-y-4">

                    {items.map(
                      (
                        item,
                        index
                      ) => (

                        <div
                          key={
                            item.id
                          }
                          className="rounded-2xl border bg-white p-4 shadow-sm"
                        >

                          <div className="mb-4 flex items-center justify-between">

                            <div>

                              <div className="text-xs font-black uppercase text-amber-600">
                                Item {index + 1}
                              </div>

                              <div className="mt-1 font-black">
                                {
                                  item.itemName ||
                                  "Purchase Item"
                                }
                              </div>

                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  item.id
                                )
                              }
                              disabled={
                                items.length ===
                                1
                              }
                              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-30"
                            >
                              Remove
                            </button>

                          </div>

                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                            <Field
                              label="Inventory SKU *"
                              caption="Permanent stock SKU being purchased."
                            >

                              <select
                                value={
                                  item.inventoryId
                                }
                                onChange={(e) =>
                                  selectInventory(
                                    item.id,
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-xl border bg-white px-3 py-2.5"
                              >

                                <option value="">
                                  Select Inventory SKU
                                </option>

                                {inventory.map(
                                  (
                                    stock
                                  ) => (

                                    <option
                                      key={
                                        stock.id
                                      }
                                      value={
                                        stock.id
                                      }
                                    >
                                      {
                                        stock.sku
                                      }
                                      {" — "}
                                      {
                                        stock.itemName
                                      }
                                    </option>

                                  )
                                )}

                              </select>

                            </Field>

                            <ReadOnly
                              label="SKU"
                              caption="Fetched from Inventory Master."
                              value={
                                item.sku
                              }
                            />

                            <ReadOnly
                              label="Item Name"
                              caption="Fetched from Inventory Master."
                              value={
                                item.itemName
                              }
                            />

                            <ReadOnly
                              label="Category"
                              caption="Fetched from Inventory Master."
                              value={
                                item.category
                              }
                            />

                            <Input
                              label="Description"
                              caption="Optional supplier purchasing specification."
                              value={
                                item.description
                              }
                              set={(value) =>
                                updateItem(
                                  item.id,
                                  "description",
                                  value
                                )
                              }
                            />

                            <NumberField
                              label="Quantity *"
                              caption="Quantity being ordered."
                              value={
                                item.quantity
                              }
                              set={(value) =>
                                updateItem(
                                  item.id,
                                  "quantity",
                                  value
                                )
                              }
                            />

                            <ReadOnly
                              label="Unit"
                              caption="Fetched from Inventory Master."
                              value={
                                item.unit
                              }
                            />

                            <NumberField
                              label="Purchase Unit Cost ₹ *"
                              caption="Supplier quoted price. Current Inventory average cost is suggested initially."
                              value={
                                item.unitPrice
                              }
                              set={(value) =>
                                updateItem(
                                  item.id,
                                  "unitPrice",
                                  value
                                )
                              }
                            />

                            <NumberField
                              label="GST %"
                              caption="Purchase GST rate."
                              value={
                                item.gstPercent
                              }
                              set={(value) =>
                                updateItem(
                                  item.id,
                                  "gstPercent",
                                  value
                                )
                              }
                            />

                            <DateField
                              label="Expected Date"
                              caption="Optional line-specific delivery date."
                              value={
                                item.expectedDate
                              }
                              set={(value) =>
                                updateItem(
                                  item.id,
                                  "expectedDate",
                                  value
                                )
                              }
                            />

                            <Info
                              label="Current Stock"
                              value={
                                (() => {
                                  const stock =
                                    inventory.find(
                                      (
                                        row
                                      ) =>
                                        row.id ===
                                        item.inventoryId
                                    );

                                  return stock
                                    ? `${stock.quantity} ${stock.unit}`
                                    : "—";
                                })()
                              }
                            />

                            <Info
                              label="Line Total"
                              value={money(
                                Number(
                                  item.quantity ||
                                    0
                                ) *
                                  Number(
                                    item.unitPrice ||
                                      0
                                  ) *
                                  (
                                    1 +
                                    Number(
                                      item.gstPercent ||
                                        0
                                    ) /
                                      100
                                  ),
                                appSettings.currencySymbol ||
                                  "₹"
                              )}
                            />

                          </div>

                        </div>

                      )
                    )}

                    <button
                      type="button"
                      onClick={
                        addItem
                      }
                      className="w-full rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/50 px-4 py-4 font-black text-amber-700"
                    >
                      + Add Purchase Item
                    </button>

                  </div>

                </Section>

                {/* TOTALS */}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

                  <Info
                    label="Ordered Qty"
                    value={String(
                      totalQty
                    )}
                  />

                  <Info
                    label="Subtotal"
                    value={money(
                      subtotal,
                      appSettings.currencySymbol ||
                        "₹"
                    )}
                  />

                  <Info
                    label="GST"
                    value={money(
                      taxAmount,
                      appSettings.currencySymbol ||
                        "₹"
                    )}
                  />

                  <Info
                    label="PO Total"
                    value={money(
                      totalAmount,
                      appSettings.currencySymbol ||
                        "₹"
                    )}
                  />

                  <Info
                    label="Status"
                    value={
                      deriveStatus()
                    }
                  />

                </div>

                {/* DELIVERY */}

                <Section
                  title="Delivery & Notes"
                  description="Delivery destination and Purchase Order instructions."
                >

                  <div className="grid gap-5 md:grid-cols-2">

                    <Field
                      label="Delivery Address"
                      caption="Where the Supplier should deliver."
                    >

                      <textarea
                        value={
                          form.deliveryAddress
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,

                            deliveryAddress:
                              e.target.value,
                          })
                        }
                        className="min-h-24 w-full rounded-xl border px-4 py-3"
                      />

                    </Field>

                    <Field
                      label="Notes"
                      caption="Purchasing instructions or internal notes."
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

              </div>

            </div>

            {/* FOOTER */}

            <div className="flex shrink-0 flex-col gap-3 border-t bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="text-sm text-slate-500">

                <strong>
                  {totalQty}
                </strong>

                {" "}units ·{" "}

                <strong>
                  {money(
                    totalAmount,
                    appSettings.currencySymbol ||
                      "₹"
                  )}
                </strong>

              </div>

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={
                    closeForm
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
                    void savePO()
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl bg-amber-600 px-6 py-3 font-black text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update Purchase Order"
                    : "Create Purchase Order"}
                </button>

              </div>

            </div>

          </div>

        </ModalOverlay>

      )}

      {/* =================================================
          RECEIVE STOCK
      ================================================= */}

      {receivingPO && (

        <ModalOverlay>

          <div className="my-5 flex max-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

            <ModalHeader
              title={`Receive ${receivingPO.purchaseOrderNumber}`}
              caption={`${receivingPO.supplierName} · Goods Receipt`}
              onClose={
                closeReceive
              }
            />

            <div className="min-h-0 flex-1 overflow-y-auto p-6">

              <div className="space-y-6">

                <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

                  <div className="font-black text-green-900">
                    📥 Goods Receipt
                  </div>

                  <p className="mt-1 text-sm leading-6 text-green-700">
                    This action increases Inventory,
                    updates weighted-average cost,
                    records the stock ledger and
                    purchase cost. Credit purchases
                    also create a Supplier Bill.
                  </p>

                </div>

                {/* RECEIPT HEADER */}

                <Section
                  title="Supplier Receipt"
                  description="Capture the actual Supplier Invoice or delivery document."
                >

                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

                    <DateField
                      label="Receipt Date *"
                      caption="Date goods were actually received."
                      value={
                        receiptForm.receiptDate
                      }
                      set={(value) =>
                        setReceiptForm({
                          ...receiptForm,

                          receiptDate:
                            value,
                        })
                      }
                    />

                    <Input
                      label="Supplier Invoice / Delivery Note *"
                      caption="Required for reconciliation and duplicate control."
                      value={
                        receiptForm.supplierInvoiceNumber
                      }
                      set={(value) =>
                        setReceiptForm({
                          ...receiptForm,

                          supplierInvoiceNumber:
                            value,
                        })
                      }
                    />

                    <Field
                      label="Payment Method"
                      caption="Choose Credit when Supplier payment will be made later."
                    >

                      <select
                        value={
                          receiptForm.paymentMethod
                        }
                        onChange={(e) =>
                          setReceiptForm({
                            ...receiptForm,

                            paymentMethod:
                              e.target.value,
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
                              {method}
                            </option>

                          )
                        )}

                      </select>

                    </Field>

                    <Input
                      label={
                        receiptForm.paymentMethod ===
                        "Cheque"
                          ? "Cheque / Payment Reference *"
                          : "Payment Reference"
                      }
                      caption="UTR, transaction number, cheque number or other payment reference."
                      value={
                        receiptForm.reference
                      }
                      set={(value) =>
                        setReceiptForm({
                          ...receiptForm,

                          reference:
                            value,
                        })
                      }
                    />

                  </div>

                  {receiptForm.paymentMethod ===
                    "Credit" && (

                    <div className="mt-5 rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-4">

                      <div className="font-black text-fuchsia-800">
                        Supplier Payable Will Be Created
                      </div>

                      <p className="mt-1 text-sm text-fuchsia-700">
                        Saving this receipt will create an
                        UNPAID Supplier Bill using the
                        Supplier&apos;s payment terms.
                      </p>

                    </div>

                  )}

                </Section>

                {/* ITEMS */}

                <Section
                  title="Items Received"
                  description="Enter only quantities physically received today. Partial receipts are supported."
                >

                  <div className="space-y-4">

                    {receiptItems.map(
                      (
                        item
                      ) => (

                        <div
                          key={
                            item.poItemId
                          }
                          className="rounded-2xl border bg-white p-4"
                        >

                          <div className="mb-4">

                            <div className="font-mono text-xs font-black text-blue-700">
                              {
                                item.sku
                              }
                            </div>

                            <div className="mt-1 font-black">
                              {
                                item.itemName
                              }
                            </div>

                          </div>

                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">

                            <Info
                              label="Ordered"
                              value={`${item.orderedQuantity} ${item.unit}`}
                            />

                            <Info
                              label="Already Received"
                              value={`${item.alreadyReceived} ${item.unit}`}
                            />

                            <Info
                              label="Pending"
                              value={`${item.pendingQuantity} ${item.unit}`}
                            />

                            <NumberField
                              label="Receive Now *"
                              caption={`Maximum ${item.pendingQuantity} ${item.unit}.`}
                              value={
                                item.receiveQuantity
                              }
                              set={(value) =>
                                updateReceiptItem(
                                  item.poItemId,
                                  "receiveQuantity",
                                  value
                                )
                              }
                            />

                            <NumberField
                              label="Actual Unit Cost ₹ *"
                              caption="Actual supplier invoice unit price."
                              value={
                                item.unitCost
                              }
                              set={(value) =>
                                updateReceiptItem(
                                  item.poItemId,
                                  "unitCost",
                                  value
                                )
                              }
                            />

                            <Info
                              label="Receipt Value"
                              value={money(
                                item.receiveQuantity *
                                  item.unitCost *
                                  (
                                    1 +
                                    item.gstPercent /
                                      100
                                  ),
                                appSettings.currencySymbol ||
                                  "₹"
                              )}
                            />

                          </div>

                        </div>

                      )
                    )}

                  </div>

                </Section>

                {/* TOTAL */}

                <div className="grid gap-4 sm:grid-cols-3">

                  <Info
                    label="Receipt Subtotal"
                    value={money(
                      receivingSubtotal,
                      appSettings.currencySymbol ||
                        "₹"
                    )}
                  />

                  <Info
                    label="GST"
                    value={money(
                      receivingTax,
                      appSettings.currencySymbol ||
                        "₹"
                    )}
                  />

                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">

                    <div className="text-[10px] font-black uppercase text-green-600">
                      Receipt Total
                    </div>

                    <div className="mt-1 text-xl font-black text-green-800">
                      {money(
                        receivingTotal,
                        appSettings.currencySymbol ||
                          "₹"
                      )}
                    </div>

                  </div>

                </div>

                <Field
                  label="Receipt Notes"
                  caption="Shortage, damage, delivery or Supplier Invoice comments."
                >

                  <textarea
                    value={
                      receiptForm.notes
                    }
                    onChange={(e) =>
                      setReceiptForm({
                        ...receiptForm,

                        notes:
                          e.target.value,
                      })
                    }
                    className="min-h-24 w-full rounded-xl border px-4 py-3"
                  />

                </Field>

              </div>

            </div>

            {/* RECEIPT FOOTER */}

            <div className="flex shrink-0 justify-end gap-3 border-t bg-white px-6 py-4">

              <button
                type="button"
                onClick={
                  closeReceive
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
                  void receiveStock()
                }
                disabled={
                  saving
                }
                className="rounded-xl bg-green-700 px-6 py-3 font-black text-white hover:bg-green-800 disabled:opacity-50"
              >
                {saving
                  ? "Receiving..."
                  : receiptForm.paymentMethod ===
                    "Credit"
                  ? "Receive Stock & Create Bill"
                  : "Receive Stock"}
              </button>

            </div>

          </div>

        </ModalOverlay>

      )}

      {/* =================================================
          VIEW PO
      ================================================= */}

      {viewing && (

        <ModalOverlay>

          <div className="my-8 max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <ModalHeader
              title={
                viewing.purchaseOrderNumber
              }
              caption={`${viewing.supplierName} · Purchase Order`}
              onClose={() =>
                setViewing(
                  null
                )
              }
            />

            <div className="space-y-6 p-6">

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

                <Info
                  label="PO Date"
                  value={
                    viewing.poDate
                  }
                />

                <Info
                  label="Expected"
                  value={
                    viewing.expectedDeliveryDate
                  }
                />

                <Info
                  label="Received Qty"
                  value={String(
                    viewing.receivedQuantity
                  )}
                />

                <Info
                  label="Pending Qty"
                  value={String(
                    viewing.pendingQuantity
                  )}
                />

                <Info
                  label="PO Total"
                  value={money(
                    viewing.totalAmount,
                    appSettings.currencySymbol ||
                      "₹"
                  )}
                />

              </div>

              {/* ITEMS */}

              <div className="overflow-x-auto rounded-xl border">

                <table className="w-full min-w-[900px] text-left text-sm">

                  <thead>

                    <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                      <th className="px-4 py-3">
                        SKU
                      </th>

                      <th className="px-4 py-3">
                        Item
                      </th>

                      <th className="px-4 py-3">
                        Ordered
                      </th>

                      <th className="px-4 py-3">
                        Received
                      </th>

                      <th className="px-4 py-3">
                        Pending
                      </th>

                      <th className="px-4 py-3">
                        Unit Cost
                      </th>

                      <th className="px-4 py-3">
                        GST
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {parseItems(
                      viewing.items
                    ).map(
                      (
                        item
                      ) => (

                        <tr
                          key={
                            item.id
                          }
                          className="border-b last:border-0"
                        >

                          <td className="px-4 py-3 font-mono font-bold text-blue-700">
                            {
                              item.sku
                            }
                          </td>

                          <td className="px-4 py-3">
                            {
                              item.itemName
                            }
                          </td>

                          <td className="px-4 py-3 font-bold">
                            {
                              item.quantity
                            }{" "}
                            {
                              item.unit
                            }
                          </td>

                          <td className="px-4 py-3 font-bold text-green-700">
                            {
                              item.receivedQuantity
                            }
                          </td>

                          <td className="px-4 py-3 font-bold text-orange-600">
                            {Math.max(
                              item.quantity -
                                item.receivedQuantity,
                              0
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {money(
                              item.unitPrice,
                              appSettings.currencySymbol ||
                                "₹"
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {
                              item.gstPercent
                            }%
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

              {/* LINKED SUPPLIER BILLS */}

              <Section
                title="Supplier Bills"
                description="Credit supplier invoices created from goods receipts against this Purchase Order."
              >

                {supplierBills.filter(
                  (
                    bill
                  ) =>
                    sameValue(
                      bill.purchaseOrderId,
                      viewing.id
                    ) ||
                    sameValue(
                      bill.purchaseOrderNumber,
                      viewing.purchaseOrderNumber
                    )
                ).length ===
                  0 ? (

                  <div className="rounded-xl bg-white p-5 text-center text-sm text-slate-500">
                    No Supplier Bills linked to this Purchase Order.
                  </div>

                ) : (

                  <div className="overflow-x-auto rounded-xl border bg-white">

                    <table className="w-full min-w-[750px] text-left text-sm">

                      <thead>

                        <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                          <th className="px-4 py-3">
                            Bill
                          </th>

                          <th className="px-4 py-3">
                            Supplier Invoice
                          </th>

                          <th className="px-4 py-3">
                            Date
                          </th>

                          <th className="px-4 py-3">
                            Due
                          </th>

                          <th className="px-4 py-3">
                            Amount
                          </th>

                          <th className="px-4 py-3">
                            Status
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {supplierBills
                          .filter(
                            (
                              bill
                            ) =>
                              sameValue(
                                bill.purchaseOrderId,
                                viewing.id
                              ) ||
                              sameValue(
                                bill.purchaseOrderNumber,
                                viewing.purchaseOrderNumber
                              )
                          )
                          .map(
                            (
                              bill
                            ) => (

                              <tr
                                key={
                                  bill.id
                                }
                                className="border-b last:border-0"
                              >

                                <td className="px-4 py-3 font-black text-fuchsia-700">
                                  {
                                    bill.billNumber
                                  }
                                </td>

                                <td className="px-4 py-3">
                                  {
                                    bill.supplierInvoiceNumber
                                  }
                                </td>

                                <td className="px-4 py-3">
                                  {
                                    bill.billDate
                                  }
                                </td>

                                <td className="px-4 py-3">
                                  {
                                    bill.dueDate
                                  }
                                </td>

                                <td className="px-4 py-3 font-black">
                                  {money(
                                    bill.totalAmount,
                                    appSettings.currencySymbol ||
                                      "₹"
                                  )}
                                </td>

                                <td className="px-4 py-3">

                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-black ${
                                      bill.status ===
                                      "PAID"
                                        ? "bg-green-100 text-green-700"
                                        : bill.status ===
                                          "PARTIAL"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {
                                      bill.status
                                    }
                                  </span>

                                </td>

                              </tr>

                            )
                          )}

                      </tbody>

                    </table>

                  </div>

                )}

              </Section>

              {/* RECEIVE BUTTON */}

              {viewing.pendingQuantity >
                0 &&
                ![
                  "Draft",
                  "Cancelled",
                  "Closed",
                ].includes(
                  viewing.status
                ) && (

                <div className="flex justify-end">

                  <button
                    type="button"
                    onClick={() => {
                      const current =
                        viewing;

                      setViewing(
                        null
                      );

                      openReceive(
                        current
                      );
                    }}
                    className="rounded-xl bg-green-700 px-6 py-3 font-black text-white hover:bg-green-800"
                  >
                    Receive Stock
                  </button>

                </div>

              )}

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

        <div className="text-xs font-black uppercase tracking-wide text-amber-600">
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

function Input({
  label,
  caption,
  value,
  set,
}: {
  label:
    string;

  caption:
    string;

  value:
    string;

  set:
    (
      value:
        string
    ) => void;
}) {
  return (
    <Field
      label={
        label
      }
      caption={
        caption
      }
    >

      <input
        value={
          value
        }
        onChange={(e) =>
          set(
            e.target.value
          )
        }
        className="w-full rounded-xl border px-3 py-2.5"
      />

    </Field>
  );
}

function NumberField({
  label,
  caption,
  value,
  set,
}: {
  label:
    string;

  caption:
    string;

  value:
    number;

  set:
    (
      value:
        number
    ) => void;
}) {
  return (
    <Field
      label={
        label
      }
      caption={
        caption
      }
    >

      <input
        type="number"
        min="0"
        step="0.01"
        value={
          value
        }
        onChange={(e) =>
          set(
            Number(
              e.target.value
            )
          )
        }
        className="w-full rounded-xl border px-3 py-2.5"
      />

    </Field>
  );
}

function DateField({
  label,
  caption,
  value,
  set,
}: {
  label:
    string;

  caption:
    string;

  value:
    string;

  set:
    (
      value:
        string
    ) => void;
}) {
  return (
    <Field
      label={
        label
      }
      caption={
        caption
      }
    >

      <input
        type="date"
        value={
          value
        }
        onChange={(e) =>
          set(
            e.target.value
          )
        }
        className="w-full rounded-xl border px-3 py-2.5"
      />

    </Field>
  );
}

function ReadOnly({
  label,
  caption,
  value,
}: {
  label:
    string;

  caption:
    string;

  value:
    string;
}) {
  return (
    <Field
      label={
        label
      }
      caption={
        caption
      }
    >

      <input
        value={
          value
        }
        readOnly
        className="w-full rounded-xl border bg-slate-100 px-3 py-2.5 font-semibold text-slate-700"
      />

    </Field>
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

      <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 break-words text-sm font-black">
        {value ||
          "—"}
      </div>

    </div>
  );
}

function Stat({
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
    | "amber"
    | "violet"
    | "green"
    | "rose";
}) {
  const styles = {
    blue:
      "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50",

    amber:
      "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50",

    violet:
      "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50",

    green:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50",

    rose:
      "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-50",
  };

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${styles[tone]}`}
    >

      <div className="text-xs font-bold uppercase text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-3xl font-black">
        {value}
      </div>

    </div>
  );
}

function StatusBadge({
  status,
}: {
  status:
    string;
}) {
  const normalized =
    normalizeText(
      status
    );

  const style =
    normalized ===
      "received" ||
    normalized ===
      "closed"
      ? "bg-green-100 text-green-700"
      : normalized ===
        "partially received"
      ? "bg-blue-100 text-blue-700"
      : normalized ===
        "cancelled"
      ? "bg-red-100 text-red-700"
      : normalized ===
          "approved" ||
        normalized ===
          "sent to supplier"
      ? "bg-violet-100 text-violet-700"
      : "bg-amber-100 text-amber-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${style}`}
    >
      {status ||
        "Draft"}
    </span>
  );
}
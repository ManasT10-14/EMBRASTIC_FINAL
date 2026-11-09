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

type Customer = {
  id: string;
  customerCode: string;

  name: string;
  businessName: string;

  contactPerson: string;
  phone: string;
  email: string;

  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
};

type PriceMasterRow = {
  id: string;

  sku: string;
  itemName: string;

  itemType: string;
  category: string;

  description: string;

  unit: string;

  sellingPrice: number;
  gstPercent: number;

  minimumSellingPrice: number;
  costPrice: number;

  customerPriceCategory: string;

  effectiveFrom: string;
  effectiveTo: string;

  status: string;

  notes: string;
};

type OrderArtwork = {
  uploadId: string;
  name: string;
  storedName: string;
  size: number;
  type: string;
};

type OrderSize = {
  size: string;
  quantity: number;
};

type OrderItem = {
  id: string;

  orderType: "READY_EMBROIDERED" | "CUSTOM_EMBROIDERY" | "";

  /*
   * PRICE MASTER LINK
   */
  priceMasterId: string;

  sku: string;

  masterItemName: string;

  masterItemType: string;

  category: string;

  /*
   * OPERATIONAL ITEM INFORMATION
   */
  itemType: string;

  description: string;

  designName: string;

  embroideryService: string;

  placement: string;

  embroiderySize: string;

  color: string;

  size: string;

  sizes: OrderSize[];

  quantity: number;

  artwork: OrderArtwork | null;

  instructions: string;

  unit: string;

  customerSku: string;

  /*
   * COMMERCIAL
   */
  unitPrice: number;

  gstPercent: number;

  minimumSellingPrice: number;

  /*
   * EXTRA
   */
  notes: string;
};

type Order = {
  id: string;

  orderNumber: string;

  quotationId: string;
  quotationNumber: string;

  customerId: string;
  customerName: string;

  customerPoNumber: string;

  orderDate: string;
  deliveryDate: string;

  priority: string;

  orderSource: string;

  contactPerson: string;

  contactPhone: string;

  contactEmail: string;

  shippingAddress: string;

  paymentTermsDays: number;

  status: string;

  items: string;

  orderItems: string;

  totalQuantity: number;

  subtotal: number;

  totalAmount: number;

  notes: string;

  createdAt: string;

  updatedAt?: string;

  [key: string]: any;
};

type OrderForm = {
  orderNumber: string;

  quotationId: string;

  quotationNumber: string;

  customerId: string;

  customerName: string;

  customerPoNumber: string;

  orderDate: string;

  deliveryDate: string;

  priority: string;

  orderSource: string;

  contactPerson: string;

  contactPhone: string;

  contactEmail: string;

  shippingAddress: string;

  paymentTermsDays: number;

  status: string;

  notes: string;
};

/* =========================================================
   OPTIONS
========================================================= */

const ORDER_STATUSES = [
  "Pending Review",
  "Artwork & Design",
  "Awaiting Approval",
  "Digitizing",
  "Production",
  "Quality Control",
  "Ready for Dispatch",
  "Dispatched",
  "In Transit",
  "Delivered",
  "Completed",
  "Cancelled",
];
const PRIORITIES = [
  "Normal",
  "High",
  "Urgent",
];

const ORDER_SOURCES = [
  "Direct",
  "Quotation",
  "WhatsApp",
  "Instagram",
  "Website",
  "Email",
  "Referral",
  "Repeat Customer",
  "Walk-in",
  "Other",
];

const ITEM_TYPES = [
  "Customer Garment - Embroidery Only",
  "T-Shirt",
  "Polo T-Shirt",
  "Shirt",
  "Sweatshirt",
  "Hoodie",
  "Jacket",
  "Cap",
  "Patch / Badge",
  "Bag",
  "Towel",
  "Uniform",
  "Fabric Panel",
  "Embroidery Service",
  "Digitizing",
  "Artwork / Design",
  "Packaging",
  "Delivery / Logistics",
  "Other",
];

const EMBROIDERY_SERVICES = [
  "Not Applicable",

  "Logo Embroidery",
  "Name Embroidery",
  "Monogram / Initials",

  "Flat Embroidery",
  "3D Puff Embroidery",
  "Applique Embroidery",

  "Patch / Badge Embroidery",

  "Cap Embroidery",

  "Corporate Branding",

  "School / College Logo",

  "Sports Team Embroidery",

  "Uniform Embroidery",

  "Custom Design Embroidery",

  "Digitizing + Embroidery",

  "Other",
];

const PLACEMENTS = [
  "Not Applicable",

  "Left Chest",
  "Right Chest",
  "Center Chest",

  "Full Front",
  "Upper Front",

  "Pocket",

  "Upper Back",
  "Full Back",

  "Left Sleeve",
  "Right Sleeve",

  "Cap Front",
  "Cap Side",
  "Cap Back",

  "Neck",

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

function normalizeItemTypeForForm(
  value: unknown,
  garmentType?: unknown
) {
  const raw =
    clean(value) ||
    clean(garmentType);

  const normalized =
    normalizeText(raw);

  if (!normalized) {
    return "";
  }

  const exact = ITEM_TYPES.find(
    (option) =>
      normalizeText(option) ===
      normalized
  );

  if (exact) {
    return exact;
  }

  if (
    normalized.includes("polo")
  ) {
    return "Polo T-Shirt";
  }

  if (
    normalized.includes("t shirt") ||
    normalized.includes("tshirt") ||
    normalized.includes("tee")
  ) {
    return "T-Shirt";
  }

  if (normalized.includes("hoodie")) {
    return "Hoodie";
  }

  if (
    normalized.includes("sweatshirt")
  ) {
    return "Sweatshirt";
  }

  if (normalized.includes("shirt")) {
    return "Shirt";
  }

  if (normalized.includes("jacket")) {
    return "Jacket";
  }

  if (normalized.includes("cap")) {
    return "Cap";
  }

  if (
    normalized.includes("embroidery")
  ) {
    return "Embroidery Service";
  }

  return "Other";
}

function normalizeEmbroideryServiceForForm(
  value: unknown,
  orderType?: unknown
) {
  const raw = clean(value);

  const normalized =
    normalizeText(raw);

  const exact =
    EMBROIDERY_SERVICES.find(
      (option) =>
        normalizeText(option) ===
        normalized
    );

  if (exact) {
    return exact;
  }

  if (
    normalizeText(orderType) ===
      "custom embroidery" ||
    normalized === "embroidery" ||
    normalized.includes("custom")
  ) {
    return "Custom Design Embroidery";
  }

  if (
    normalized &&
    normalized !== "not applicable"
  ) {
    return "Other";
  }

  return "Not Applicable";
}

function normalizePlacementForForm(
  value: unknown
) {
  const raw = clean(value);

  if (!raw) {
    return "Not Applicable";
  }

  const normalized =
    normalizeText(raw);

  const exact = PLACEMENTS.find(
    (option) =>
      normalizeText(option) ===
      normalized
  );

  return exact || "Other";
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

function generateId() {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .substring(
      2,
      10
    )}`;
}

function getToday() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

function addDays(
  date: string,
  days: number
) {
  if (!date) {
    return "";
  }

  const parsed =
    new Date(
      `${date}T00:00:00`
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return date;
  }

  parsed.setDate(
    parsed.getDate() +
      Number(
        days || 0
      )
  );

  return parsed
    .toISOString()
    .split("T")[0];
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
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        2,
    }
  )}`;
}

/* =========================================================
   EMPTY ITEM
========================================================= */

function emptyItem():
  OrderItem {
  return {
    id:
      generateId(),

    orderType:
      "",

    priceMasterId:
      "",

    sku:
      "",

    masterItemName:
      "",

    masterItemType:
      "",

    category:
      "",

    itemType:
      "",

    description:
      "",

    designName:
      "",

    embroideryService:
      "Not Applicable",

    placement:
      "Not Applicable",

    embroiderySize:
      "",

    color:
      "",

    size:
      "",

    sizes:
      [],

    quantity:
      1,

    artwork:
      null,

    instructions:
      "",

    unit:
      "pcs",

    customerSku:
      "",

    unitPrice:
      0,

    gstPercent:
      0,

    minimumSellingPrice:
      0,

    notes:
      "",
  };
}

/* =========================================================
   EMPTY FORM
========================================================= */

function emptyForm():
  OrderForm {
  return {
    orderNumber:
      "",

    quotationId:
      "",

    quotationNumber:
      "",

    customerId:
      "",

    customerName:
      "",

    customerPoNumber:
      "",

    orderDate:
      "",

    deliveryDate:
      "",

    priority:
      "Normal",

    orderSource:
      "Direct",

    contactPerson:
      "",

    contactPhone:
      "",

    contactEmail:
      "",

    shippingAddress:
      "",

    paymentTermsDays:
      30,

    status:
      "Pending Review",

    notes:
      "",
  };
}

/* =========================================================
   NORMALIZE CUSTOMER
========================================================= */

function normalizeCustomer(
  row: any
): Customer {
  return {
    id:
      clean(
        row?.id
      ),

    customerCode:
      clean(
        row?.customerCode
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

    contactPerson:
      clean(
        row?.contactPerson
      ),

    phone:
      clean(
        row?.phone
      ),

    email:
      clean(
        row?.email
      ),

    shippingAddress:
      clean(
        row?.shippingAddress ??
          row?.billingAddress ??
          row?.address
      ),

    shippingCity:
      clean(
        row?.shippingCity ??
          row?.billingCity
      ),

    shippingState:
      clean(
        row?.shippingState ??
          row?.billingState
      ),

    shippingPostalCode:
      clean(
        row?.shippingPostalCode ??
          row?.billingPostalCode ??
          row?.postalCode
      ),

    shippingCountry:
      clean(
        row?.shippingCountry ??
          row?.billingCountry ??
          row?.country ??
          "India"
      ),
  };
}

/* =========================================================
   NORMALIZE PRICE MASTER
========================================================= */

function normalizePriceMaster(
  row: any
):
  PriceMasterRow {
  return {
    id:
      clean(
        row?.id
      ),

    sku:
      clean(
        row?.sku ??
          row?.itemCode
      ),

    itemName:
      clean(
        row?.itemName ??
          row?.name
      ),

    itemType:
      clean(
        row?.itemType
      ),

    category:
      clean(
        row?.category
      ),

    description:
      clean(
        row?.description
      ),

    unit:
      clean(
        row?.unit
      ) ||
      "pcs",

    sellingPrice:
      numberValue(
        row?.sellingPrice ??
          row?.price ??
          row?.rate
      ),

    gstPercent:
      numberValue(
        row?.gstPercent
      ),

    minimumSellingPrice:
      numberValue(
        row?.minimumSellingPrice
      ),

    costPrice:
      numberValue(
        row?.costPrice
      ),

    customerPriceCategory:
      clean(
        row?.customerPriceCategory
      ) ||
      "Standard",

    effectiveFrom:
      clean(
        row?.effectiveFrom
      ).split(
        "T"
      )[0],

    effectiveTo:
      clean(
        row?.effectiveTo
      ).split(
        "T"
      )[0],

    status:
      clean(
        row?.status
      ) ||
      "Active",

    notes:
      clean(
        row?.notes
      ),
  };
}

/* =========================================================
   NORMALIZE ORDER ITEM
========================================================= */

function normalizeOrderItem(
  item: any
):
  OrderItem {
  const priceMasterId =
    clean(
      item?.priceMasterId
    );

  const sku =
    clean(
      item?.sku ??
        item?.itemCode
    );

  const masterName =
    clean(
      item?.masterItemName ??
        item?.itemName ??
        item?.service
    );

  const masterType =
    clean(
      item?.masterItemType ??
        item?.priceItemType
    );

  /*
   * IMPORTANT:
   *
   * Quotations use "service" + "rate".
   * Orders use "embroideryService" + "unitPrice".
   *
   * This normalizer accepts BOTH structures.
   */
  const service =
    clean(
      item?.embroideryService ??
        item?.service
    );

  const description =
    clean(
      item?.description ??
        item?.item ??
        item?.name ??
        masterName
    );

const itemType =
  normalizeItemTypeForForm(
    item?.itemType ??
      item?.productType ??
      item?.type ??
      masterType,
    item?.garmentType
  );

  const submittedOrderType =
    clean(item?.orderType).toUpperCase();

  const orderType:
    OrderItem["orderType"] =
      submittedOrderType === "CUSTOM_EMBROIDERY"
        ? "CUSTOM_EMBROIDERY"
        : submittedOrderType === "READY_EMBROIDERED"
        ? "READY_EMBROIDERED"
        : "";

  const sizes: OrderSize[] =
    Array.isArray(item?.sizes)
      ? item.sizes
          .map((row: any) => ({
            size: clean(row?.size),
            quantity: numberValue(row?.quantity),
          }))
          .filter(
            (row: OrderSize) =>
              Boolean(row.size) &&
              row.quantity > 0
          )
      : [];

  const artwork: OrderArtwork | null =
    item?.artwork &&
    typeof item.artwork === "object"
      ? {
          uploadId: clean(item.artwork.uploadId),
          name: clean(item.artwork.name),
          storedName: clean(item.artwork.storedName),
          size: numberValue(item.artwork.size),
          type: clean(item.artwork.type),
        }
      : null;

  return {
    id:
      clean(
        item?.id
      ) ||
      generateId(),

    orderType,

    priceMasterId,

    sku,

    masterItemName:
      masterName ||
      description ||
      service,

    masterItemType:
      masterType ||
      itemType,

    category:
      clean(
        item?.category
      ),

    itemType,

    description,

    designName:
      clean(
        item?.designName
      ),

embroideryService:
  normalizeEmbroideryServiceForForm(
    service,
    orderType
  ),

placement:
  normalizePlacementForForm(
    item?.placement ??
      item?.embroideryPlacement
  ),

    embroiderySize:
      clean(item?.embroiderySize),

    color:
      clean(
        item?.color ??
          item?.colour
      ),

    size:
      clean(
        item?.size
      ),

    sizes,

    quantity:
      numberValue(
        item?.quantity
      ) ||
      sizes.reduce(
        (total, row) =>
          total + row.quantity,
        0
      ) ||
      1,

    artwork,

    instructions:
      clean(
        item?.instructions
      ),

    unit:
      clean(
        item?.unit
      ) ||
      "pcs",

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

    gstPercent:
      numberValue(
        item?.gstPercent ??
          item?.itemGstPercent
      ),

    minimumSellingPrice:
      numberValue(
        item?.minimumSellingPrice
      ),

    notes:
      clean(
        item?.notes
      ),
  };
}

/* =========================================================
   PARSE ORDER ITEMS
========================================================= */

function parseOrderItems(
  value: unknown
):
  OrderItem[] {
  if (
    Array.isArray(
      value
    )
  ) {
    return value.map(
      normalizeOrderItem
    );
  }

  const text =
    clean(
      value
    );

  if (
    !text
  ) {
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
        normalizeOrderItem
      );
    }
  } catch {
    /*
     * Older Orders may contain free-text
     * inside the "items" column.
     */
  }

  return [
    {
      ...emptyItem(),

      description:
        text,

      masterItemName:
        text,

      quantity:
        1,
    },
  ];
}

/* =========================================================
   NORMALIZE ORDER
========================================================= */

function normalizeOrder(
  row: any
):
  Order {
  /*
   * Prefer orderItems because the older "items"
   * field may contain only a human-readable summary.
   */
  const parsedItems =
    parseOrderItems(
      row?.orderItems ||
        row?.items
    );

  const totalQuantity =
    numberValue(
      row?.totalQuantity
    ) ||
    parsedItems.reduce(
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

  const subtotal =
    numberValue(
      row?.subtotal
    ) ||
    parsedItems.reduce(
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
    );

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

    customerPoNumber:
      clean(
        row?.customerPoNumber ??
          row?.customerPO ??
          row?.poNumber
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

    priority:
      clean(
        row?.priority
      ) ||
      "Normal",

    orderSource:
      clean(
        row?.orderSource ??
          row?.source
      ) ||
      (
        row?.quotationId
          ? "Quotation"
          : "Direct"
      ),

    contactPerson:
      clean(
        row?.contactPerson
      ),

    contactPhone:
      clean(
        row?.contactPhone ??
          row?.phone ??
          row?.customerPhone
      ),

    contactEmail:
      clean(
        row?.contactEmail ??
          row?.email ??
          row?.customerEmail
      ),

    shippingAddress:
      clean(
        row?.shippingAddress
      ),

    paymentTermsDays:
      numberValue(
        row?.paymentTermsDays
      ) ||
      30,

    status:
      clean(
        row?.status
      ) ||
      "Pending",

    items:
      clean(
        row?.items
      ) ||
      JSON.stringify(
        parsedItems
      ),

    orderItems:
      clean(
        row?.orderItems
      ) ||
      JSON.stringify(
        parsedItems
      ),

    totalQuantity,

    subtotal,

    totalAmount:
      numberValue(
        row?.totalAmount
      ) ||
      subtotal,

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
   CUSTOMER HELPERS
========================================================= */

function customerDisplayName(
  customer:
    Customer
) {
  if (
    customer.businessName &&
    customer.name &&
    normalizeText(
      customer.businessName
    ) !==
      normalizeText(
        customer.name
      )
  ) {
    return `${customer.name} — ${customer.businessName}`;
  }

  return (
    customer.name ||
    customer.businessName ||
    "Customer"
  );
}

function customerShippingAddress(
  customer:
    Customer | undefined
) {
  if (
    !customer
  ) {
    return "";
  }

  return [
    customer.shippingAddress,

    customer.shippingCity,

    customer.shippingState,

    customer.shippingPostalCode,

    customer.shippingCountry,
  ]
    .filter(
      Boolean
    )
    .join(
      ", "
    );
}

/* =========================================================
   PAGE
========================================================= */

export default function OrdersPage() {
  const [
    orders,
    setOrders,
  ] =
    useState<
      Order[]
    >([]);

  const [
    customers,
    setCustomers,
  ] =
    useState<
      Customer[]
    >([]);

  const [
    priceMaster,
    setPriceMaster,
  ] =
    useState<
      PriceMasterRow[]
    >([]);

  const [
    appSettings,
    setAppSettings,
  ] =
    useState<
      AppSettings
    >(
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
  sortBy,
  setSortBy,
] = useState("orderDate-desc");

  const [
    showForm,
    setShowForm,
  ] =
    useState(
      false
    );

  const [
    editingOrder,
    setEditingOrder,
  ] =
    useState<
      Order | null
    >(
      null
    );

  const [
    viewingOrder,
    setViewingOrder,
  ] =
    useState<
      Order | null
    >(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<
      OrderForm
    >(
      emptyForm()
    );

const [
  items,
  setItems,
] =
  useState<
    OrderItem[]
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

    let data: any =
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

    let data: any =
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
        "Order Excel request failed:",
        {
          body,
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
     LOAD
  ======================================================= */

  async function loadData(
    silent = false
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
        customerRows,
        priceRows,
        settings,
      ] =
        await Promise.all([
          loadSheet(
            "Orders"
          ),

          loadSheet(
            "Customers"
          ),

          loadSheet(
            "PriceMaster"
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
              row:
                Order
            ) =>
              Boolean(
                row.id ||
                  row.orderNumber
              )
          )
          .sort(
            (
              a:
                Order,
              b:
                Order
            ) =>
              String(
                b.createdAt ||
                  b.orderDate
              ).localeCompare(
                String(
                  a.createdAt ||
                    a.orderDate
                )
              )
          );

      const loadedCustomers =
        customerRows
          .map(
            normalizeCustomer
          )
          .filter(
            (
              row:
                Customer
            ) =>
              Boolean(
                row.id
              )
          )
          .sort(
            (
              a:
                Customer,
              b:
                Customer
            ) =>
              customerDisplayName(
                a
              ).localeCompare(
                customerDisplayName(
                  b
                )
              )
          );

      const loadedPriceMaster =
        priceRows
          .map(
            normalizePriceMaster
          )
          .filter(
            (
              row:
                PriceMasterRow
            ) =>
              Boolean(
                row.id &&
                  row.itemName
              )
          )
          .sort(
            (
              a:
                PriceMasterRow,
              b:
                PriceMasterRow
            ) =>
              a.itemName.localeCompare(
                b.itemName
              )
          );

      setOrders(
        loadedOrders
      );

      setCustomers(
        loadedCustomers
      );

      setPriceMaster(
        loadedPriceMaster
      );

      setAppSettings(
        settings
      );
    } catch (
      error
    ) {
      console.error(
        "Orders loading error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to load Orders."
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
     ACTIVE PRICE MASTER
  ======================================================= */

  const activePriceMaster = useMemo(() => {
  const selectedDate = form.orderDate;

  return priceMaster.filter((row) => {
    if (normalizeText(row.status) !== "active") {
      return false;
    }

    // Before an order date has been selected, don't evaluate
    // date-based Price Master validity during prerendering.
    if (!selectedDate) {
      return true;
    }

    if (
      row.effectiveFrom &&
      row.effectiveFrom > selectedDate
    ) {
      return false;
    }

    if (
      row.effectiveTo &&
      row.effectiveTo < selectedDate
    ) {
      return false;
    }

    return true;
  });
}, [priceMaster, form.orderDate]);

  /* =======================================================
     CALCULATIONS
  ======================================================= */

  const totalQuantity =
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

  const gstAmount =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item
          ) => {
            const lineValue =
              Number(
                item.quantity ||
                  0
              ) *
              Number(
                item.unitPrice ||
                  0
              );

            return (
              total +
              lineValue *
                Number(
                  item.gstPercent ||
                    0
                ) /
                100
            );
          },
          0
        ),
      [
        items,
      ]
    );

  const orderTotal =
    subtotal +
    gstAmount;

  /* =======================================================
     ORDER NUMBER
  ======================================================= */

  function nextOrderNumber(
    year: number
  ) {
    const prefix =
      `${
        appSettings.orderPrefix ||
        "ORD"
      }-${year}-`;

    let highest =
      0;

    orders.forEach(
      (
        order
      ) => {
        if (
          !order.orderNumber.startsWith(
            prefix
          )
        ) {
          return;
        }

        const match =
          order.orderNumber.match(
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
     CREATE
  ======================================================= */

  async function openCreateForm() {
    /*
     * Reload all data so newly added Price Master
     * rows are immediately available.
     */
    await loadData(
      true
    );

    const settings =
      await loadAppSettings();

    setAppSettings(
      settings
    );

    const currentDate =
      getToday();

    setEditingOrder(
      null
    );

    setForm({
      ...emptyForm(),

      orderNumber:
        nextOrderNumber(
          Number(
            currentDate.slice(
              0,
              4
            )
          )
        ),

      orderDate:
        currentDate,

      deliveryDate:
        addDays(
          currentDate,

          Number(
            settings.defaultOrderLeadDays ||
              7
          )
        ),

      paymentTermsDays:
        Number(
          settings.defaultPaymentTermsDays ||
            30
        ),
    });

    setItems([
      emptyItem(),
    ]);

    setShowForm(
      true
    );
  }

  /* =======================================================
     EDIT
  ======================================================= */

  function openEditForm(
    order:
      Order
  ) {
    setEditingOrder(
      order
    );

    setForm({
      orderNumber:
        order.orderNumber,

      quotationId:
        order.quotationId,

      quotationNumber:
        order.quotationNumber,

      customerId:
        order.customerId,

      customerName:
        order.customerName,

      customerPoNumber:
        order.customerPoNumber,

      orderDate:
        order.orderDate,

      deliveryDate:
        order.deliveryDate,

      priority:
        order.priority ||
        "Normal",

      orderSource:
        order.orderSource ||
        (
          order.quotationId
            ? "Quotation"
            : "Direct"
        ),

      contactPerson:
        order.contactPerson,

      contactPhone:
        order.contactPhone,

      contactEmail:
        order.contactEmail,

      shippingAddress:
        order.shippingAddress,

      paymentTermsDays:
        Number(
          order.paymentTermsDays ||
            30
        ),

      status:
        order.status ||
        "Pending Review",

      notes:
        order.notes,
    });

    const parsed =
      parseOrderItems(
        order.orderItems ||
          order.items
      );

    setItems(
      parsed.length
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

    setEditingOrder(
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
     FORM UPDATE
  ======================================================= */

  function updateForm<
    K extends
      keyof OrderForm
  >(
    key: K,

    value:
      OrderForm[K]
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,

        [key]:
          value,
      })
    );
  }

  /* =======================================================
     CUSTOMER
  ======================================================= */

  function handleCustomerChange(
    customerId:
      string
  ) {
    const customer =
      customers.find(
        (
          item
        ) =>
          item.id ===
          customerId
      );

    setForm(
      (
        current
      ) => ({
        ...current,

        customerId,

        customerName:
          customer?.name ||
          customer?.businessName ||
          "",

        contactPerson:
          customer?.contactPerson ||
          current.contactPerson,

        contactPhone:
          customer?.phone ||
          current.contactPhone,

        contactEmail:
          customer?.email ||
          current.contactEmail,

        shippingAddress:
          customerShippingAddress(
            customer
          ) ||
          current.shippingAddress,
      })
    );
  }

  /* =======================================================
     LINE ITEMS
  ======================================================= */

  function addItem() {
    setItems(
      (
        current
      ) => [
        ...current,

        emptyItem(),
      ]
    );
  }

  function removeItem(
    id:
      string
  ) {
    if (
      items.length ===
      1
    ) {
      alert(
        "An Order must contain at least one item."
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
      keyof OrderItem
  >(
    id:
      string,

    key:
      K,

    value:
      OrderItem[K]
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

                  [key]:
                    value,
                }
              : item
        )
    );
  }

  /* =======================================================
     PRICE MASTER SELECTION
  ======================================================= */

  function handlePriceMasterChange(
    itemId:
      string,

    priceMasterId:
      string
  ) {
    if (
      !priceMasterId
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
              itemId
                ? {
                    ...item,

                    priceMasterId:
                      "",

                    sku:
                      "",

                    masterItemName:
                      "",

                    masterItemType:
                      "",

                    category:
                      "",

                    unitPrice:
                      0,

                    gstPercent:
                      0,

                    minimumSellingPrice:
                      0,
                  }
                : item
          )
      );

      return;
    }

    const selected =
      activePriceMaster.find(
        (
          row
        ) =>
          row.id ===
          priceMasterId
      );

    if (
      !selected
    ) {
      alert(
        "Selected Price Master item was not found."
      );

      return;
    }

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
              itemId
            ) {
              return item;
            }

            const isEmbroidery =
              normalizeText(
                selected.itemType
              ) ===
                "embroidery service" ||
              normalizeText(
                selected.category
              ) ===
                "embroidery";

            return {
              ...item,

              priceMasterId:
                selected.id,

              sku:
                selected.sku,

              masterItemName:
                selected.itemName,

              masterItemType:
                selected.itemType,

              category:
                selected.category,

              itemType:
                selected.itemType ||
                item.itemType,

              description:
                selected.description ||
                selected.itemName ||
                item.description,

              unit:
                selected.unit ||
                item.unit,

              unitPrice:
                selected.sellingPrice,

              gstPercent:
                selected.gstPercent,

              minimumSellingPrice:
                selected.minimumSellingPrice,

              embroideryService:
                isEmbroidery
                  ? selected.itemName
                  : item.embroideryService ===
                    "Not Applicable"
                  ? "Not Applicable"
                  : item.embroideryService,

              placement:
                isEmbroidery
                  ? item.placement ===
                    "Not Applicable"
                    ? "Left Chest"
                    : item.placement
                  : item.placement,
            };
          }
        )
    );
  }

  /* =======================================================
     VALIDATE
  ======================================================= */

  function validate() {
    if (
      !form.orderNumber.trim()
    ) {
      return "Order Number is required.";
    }

    if (
      !form.customerId
    ) {
      return "Customer is required.";
    }

    if (
      !form.orderDate
    ) {
      return "Order Date is required.";
    }

    if (
      !form.deliveryDate
    ) {
      return "Required Delivery Date is required.";
    }

    if (
      form.deliveryDate <
      form.orderDate
    ) {
      return "Delivery Date cannot be before Order Date.";
    }

    if (
      items.length ===
      0
    ) {
      return "Please add at least one Order item.";
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
        !item.priceMasterId
      ) {
        /*
         * Existing historical Orders converted from old
         * Quotations may not have Price Master IDs.
         *
         * We allow them while EDITING, but all NEW
         * direct Orders must use Price Master.
         */
        if (
          !editingOrder
        ) {
          return `Item ${index + 1}: Price Master Item is required.`;
        }
      }

if (!editingOrder) {
  if (!item.itemType) {
    return `Item ${index + 1}: Item Type is required.`;
  }

  if (!item.description.trim()) {
    return `Item ${index + 1}: Description is required.`;
  }
}

      if (
        Number(
          item.quantity
        ) <=
        0
      ) {
        return `Item ${index + 1}: Quantity must be greater than zero.`;
      }

      if (
        !item.unit
      ) {
        return `Item ${index + 1}: Unit is required.`;
      }

      if (
        Number(
          item.unitPrice
        ) <
        0
      ) {
        return `Item ${index + 1}: Selling Price cannot be negative.`;
      }

      if (
        item.minimumSellingPrice >
          0 &&
        item.unitPrice <
          item.minimumSellingPrice
      ) {
        return `Item ${index + 1}: Selling Price cannot be below ${money(
          item.minimumSellingPrice,

          appSettings.currencySymbol ||
            "₹"
        )}.`;
      }

      /*
       * Only require embroidery details when the
       * selected master item is actually embroidery.
       */
      const embroideryItem =
        normalizeText(
          item.masterItemType
        ) ===
          "embroidery service" ||
        normalizeText(
          item.category
        ) ===
          "embroidery" ||
        normalizeText(
          item.itemType
        ).includes(
          "embroidery"
        );

      if (
  !editingOrder &&
  embroideryItem &&        (
          !item.embroideryService ||
          normalizeText(
            item.embroideryService
          ) ===
            "not applicable"
        )
      ) {
        return `Item ${index + 1}: Embroidery Service is required.`;
      }

      if (
        embroideryItem &&
        (
          !item.placement ||
          normalizeText(
            item.placement
          ) ===
            "not applicable"
        )
      ) {
        return `Item ${index + 1}: Placement is required.`;
      }
    }

    return "";
  }

  /* =======================================================
     SAVE
  ======================================================= */

  async function saveOrder() {
    const validation =
      validate();

    if (
      validation
    ) {
      alert(
        validation
      );

      return;
    }

    try {
      setSaving(
        true
      );

      const customer =
        customers.find(
          (
            row
          ) =>
            row.id ===
            form.customerId
        );

      if (
        !customer
      ) {
        throw new Error(
          "Selected customer could not be found."
        );
      }

      /*
       * Prevent duplicate Order numbers.
       */
      const duplicate =
        orders.find(
          (
            order
          ) =>
            order.id !==
              editingOrder?.id &&

            normalizeText(
              order.orderNumber
            ) ===
              normalizeText(
                form.orderNumber
              )
        );

      if (
        duplicate
      ) {
        throw new Error(
          `Order number ${form.orderNumber} already exists.`
        );
      }

      const now =
        new Date()
          .toISOString();

      /*
       * Copy every Price Master commercial field into
       * the Order JSON.
       *
       * This preserves historical pricing.
       */
      const cleanedItems =
        items.map(
          (
            item
          ) => ({
            ...item,

            priceMasterId:
              item.priceMasterId,

            sku:
              item.sku.trim(),

            masterItemName:
              item.masterItemName.trim(),

            masterItemType:
              item.masterItemType.trim(),

            category:
              item.category.trim(),

            itemType:
              item.itemType,

            description:
              item.description.trim(),

            designName:
              item.designName.trim(),

            embroideryService:
              item.embroideryService,

            placement:
              item.placement,

            color:
              item.color.trim(),

            size:
              item.size.trim(),

            customerSku:
              item.customerSku.trim(),

            quantity:
              Number(
                item.quantity
              ),

            unit:
              item.unit,

            unitPrice:
              Number(
                item.unitPrice ||
                  0
              ),

            gstPercent:
              Number(
                item.gstPercent ||
                  0
              ),

            minimumSellingPrice:
              Number(
                item.minimumSellingPrice ||
                  0
              ),

            notes:
              item.notes.trim(),
          })
        );

      const serializedItems =
        JSON.stringify(
          cleanedItems
        );

      const itemSummary =
        cleanedItems
          .map(
            (
              item
            ) =>
              `${
                item.sku
                  ? `${item.sku} - `
                  : ""
              }${item.description} - ${item.quantity} ${item.unit}`
          )
          .join(
            "; "
          );

      const record = {
        orderNumber:
          form.orderNumber.trim(),

        quotationId:
          form.quotationId,

        quotationNumber:
          form.quotationNumber,

        customerId:
          customer.id,

        customerName:
          customer.name ||
          customer.businessName,

        customerPoNumber:
          form.customerPoNumber.trim(),

        orderDate:
          form.orderDate,

        deliveryDate:
          form.deliveryDate,

        priority:
          form.priority,

        orderSource:
          form.orderSource,

        contactPerson:
          form.contactPerson.trim(),

        contactPhone:
          form.contactPhone.trim(),

        contactEmail:
          form.contactEmail.trim(),

        shippingAddress:
          form.shippingAddress.trim(),

        paymentTermsDays:
          Number(
            form.paymentTermsDays ||
              0
          ),

        status:
          form.status,

        /*
         * "items" remains human-readable for compatibility.
         * "orderItems" stores the complete item JSON.
         */
        items:
          itemSummary,

        orderItems:
          serializedItems,

        totalQuantity,

        subtotal,

        gstAmount,

        totalAmount:
          orderTotal,

        notes:
          form.notes.trim(),

        updatedAt:
          now,
      };

      await saveExcel({
        action:
          editingOrder
            ? "update"
            : "add",

        sheet:
          "Orders",

        ...(editingOrder
          ? {
              id:
                editingOrder.id,
            }
          : {}),

        record:
          editingOrder
            ? {
                ...editingOrder,

                ...record,

                createdAt:
                  editingOrder.createdAt ||
                  now,
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
        editingOrder
          ? "Order updated successfully."
          : "Order created successfully."
      );
    } catch (
      error
    ) {
      console.error(
        "Order save error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to save Order."
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

  async function deleteOrder(
    order:
      Order
  ) {
    if (
      !confirm(
        `Delete ${order.orderNumber}?`
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
          "Orders",

        id:
          order.id,
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
          : "Unable to delete Order."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     FILTERS
  ======================================================= */

  const filteredOrders = useMemo(() => {
  const query = search.trim().toLowerCase();

  const filtered = orders.filter((order) => {
    const statusMatches =
      statusFilter === "All" ||
      normalizeText(order.status) ===
        normalizeText(statusFilter);

    const itemText = parseOrderItems(
      order.orderItems || order.items
    )
      .map((item) =>
        [
          item.sku,
          item.masterItemName,
          item.itemType,
          item.description,
          item.designName,
          item.embroideryService,
          item.placement,
          item.embroiderySize,
          item.orderType,
          item.color,
          item.size,
          item.sizes
            .map(
              (row) =>
                `${row.size} ${row.quantity}`
            )
            .join(" "),
          item.artwork?.name,
          item.instructions,
          item.customerSku,
        ].join(" ")
      )
      .join(" ");

    const searchMatches =
      !query ||
      [
        order.orderNumber,
        order.customerName,
        order.customerPoNumber,
        order.status,
        order.priority,
        order.orderSource,
        order.quotationNumber,
        itemText,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

    return statusMatches && searchMatches;
  });

  return [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "orderDate-asc":
        return String(a.orderDate).localeCompare(
          String(b.orderDate)
        );

      case "orderDate-desc":
        return String(b.orderDate).localeCompare(
          String(a.orderDate)
        );

      case "deliveryDate-asc":
        return String(a.deliveryDate).localeCompare(
          String(b.deliveryDate)
        );

      case "deliveryDate-desc":
        return String(b.deliveryDate).localeCompare(
          String(a.deliveryDate)
        );

      case "customer-asc":
        return String(
          a.customerName || ""
        ).localeCompare(
          String(b.customerName || ""),
          undefined,
          { sensitivity: "base" }
        );

      case "customer-desc":
        return String(
          b.customerName || ""
        ).localeCompare(
          String(a.customerName || ""),
          undefined,
          { sensitivity: "base" }
        );

      case "amount-desc":
        return (
          Number(b.totalAmount || 0) -
          Number(a.totalAmount || 0)
        );

      case "amount-asc":
        return (
          Number(a.totalAmount || 0) -
          Number(b.totalAmount || 0)
        );

      default:
        return 0;
    }
  });
}, [
  orders,
  search,
  statusFilter,
  sortBy,
]);
  /* =======================================================
     STATS
  ======================================================= */

  const activeOrders =
    orders.filter(
      (
        order
      ) =>
        ![
          "completed",
          "delivered",
          "cancelled",
          "closed",
          "paid",
        ].includes(
          normalizeText(
            order.status
          )
        )
    ).length;

  const urgentOrders =
    orders.filter(
      (
        order
      ) =>
        normalizeText(
          order.priority
        ) ===
          "urgent" &&

        ![
          "completed",
          "delivered",
          "cancelled",
        ].includes(
          normalizeText(
            order.status
          )
        )
    ).length;

  const totalOpenQty =
    orders
      .filter(
        (
          order
        ) =>
          ![
            "completed",
            "delivered",
            "cancelled",
          ].includes(
            normalizeText(
              order.status
            )
          )
      )
      .reduce(
        (
          total,
          order
        ) =>
          total +
          Number(
            order.totalQuantity ||
              0
          ),
        0
      );

  const completedOrders =
    orders.filter(
      (
        order
      ) =>
        [
          "completed",
          "delivered",
          "paid",
        ].includes(
          normalizeText(
            order.status
          )
        )
    ).length;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="w-full min-h-full">

      <div className="mx-auto w-full max-w-7xl space-y-6 pb-24">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>

            <div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
              Customer Fulfilment
            </div>

            <h1 className="text-3xl font-black">
              Orders
            </h1>

            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
              Capture customer orders with approved
              Price Master rates, item quantities,
              garment information, embroidery details
              and delivery requirements.
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
                void openCreateForm()
              }
              className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800"
            >
              + Create Order
            </button>

          </div>

        </div>

        {/* PRICE MASTER INFO */}

        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 p-5">

          <div className="font-black text-slate-900">
            💲 Price Master Controlled Selling Rates
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Direct Orders now select products and
            services from Price Master. SKU, selling
            price, GST and unit are fetched
            automatically. The selling price is copied
            into the Order when saved so future master
            price changes will not alter historical
            Orders.
          </p>

        </div>

        {/* SUMMARY */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            label="Total Orders"
            value={String(
              orders.length
            )}
            caption="All customer orders"
            tone="blue"
          />

          <StatCard
            label="Active Orders"
            value={String(
              activeOrders
            )}
            caption="Not yet delivered / closed"
            tone="violet"
          />

          <StatCard
            label="Open Quantity"
            value={String(
              totalOpenQty
            )}
            caption="Units across active orders"
            tone="amber"
          />

          <StatCard
            label="Urgent"
            value={String(
              urgentOrders
            )}
            caption={`${completedOrders} orders completed`}
            tone="rose"
          />

        </div>

        {/* FILTERS */}

        <div className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[1fr_250px]">

          <input
            value={
              search
            }
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search order, customer, SKU, PO, item, design, colour, size or status..."
            className="rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
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

            {ORDER_STATUSES.map(
              (
                orderStatus
              ) => (

                <option
                  key={
                    orderStatus
                  }
                  value={
                    orderStatus
                  }
                >
                  {orderStatus}
                </option>

              )
            )}

          </select>
<select
  value={sortBy}
  onChange={(e) =>
    setSortBy(
      e.target.value
    )
  }
  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400"
>
  <option value="orderDate-desc">
    Order Date — Newest First
  </option>

  <option value="orderDate-asc">
    Order Date — Oldest First
  </option>

  <option value="deliveryDate-asc">
    Delivery Date — Earliest First
  </option>

  <option value="deliveryDate-desc">
    Delivery Date — Latest First
  </option>

  <option value="customer-asc">
    Customer — A to Z
  </option>

  <option value="customer-desc">
    Customer — Z to A
  </option>

  <option value="amount-desc">
    Amount — High to Low
  </option>

  <option value="amount-asc">
    Amount — Low to High
  </option>
</select>

        </div>

        {/* TABLE */}

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          {loading ? (

            <div className="p-10 text-center text-slate-500">
              Loading Orders...
            </div>

          ) : filteredOrders.length ===
            0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl">
                📦
              </div>

              <h2 className="mt-4 text-xl font-black">
                No Orders found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Create an Order with at least one
                Price Master item.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1350px] text-left text-sm">

                <thead>

                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                    <th className="px-4 py-4">
                      Order
                    </th>

                    <th className="px-4 py-4">
                      Customer
                    </th>

                    <th className="px-4 py-4">
                      PO / Source
                    </th>

                    <th className="px-4 py-4">
                      Items
                    </th>

                    <th className="px-4 py-4">
                      Qty
                    </th>

                    <th className="px-4 py-4">
                      Order Value
                    </th>

                    <th className="px-4 py-4">
                      Delivery
                    </th>

                    <th className="px-4 py-4">
                      Priority
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

                  {filteredOrders.map(
                    (
                      order
                    ) => {

                      const orderItems =
                        parseOrderItems(
                          order.orderItems ||
                            order.items
                        );

                      return (

                        <tr
                          key={
                            order.id
                          }
                          className="border-b last:border-0 hover:bg-slate-50"
                        >

                          <td className="px-4 py-4">

                            <div className="font-black text-blue-700">
                              {
                                order.orderNumber
                              }
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                              {
                                order.orderDate ||
                                "—"
                              }
                            </div>

                            {order.quotationNumber && (

                              <div className="mt-1 text-xs font-bold text-violet-600">
                                {order.quotationNumber}
                              </div>

                            )}

                          </td>

                          <td className="px-4 py-4 font-semibold">
                            {
                              order.customerName ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-4">

                            <div className="font-semibold">
                              {
                                order.customerPoNumber ||
                                "—"
                              }
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                              {
                                order.orderSource
                              }
                            </div>

                          </td>

                          <td className="max-w-[300px] px-4 py-4">

                            <div className="font-semibold">

                              {orderItems[0]?.sku && (
                                <span className="text-emerald-700">
                                  {orderItems[0].sku}
                                  {" — "}
                                </span>
                              )}

                              {
                                orderItems[0]?.masterItemName ||
                                orderItems[0]?.description ||
                                "—"
                              }

                            </div>

                            {orderItems.length >
                              1 && (

                              <div className="mt-1 text-xs text-blue-600">
                                +
                                {
                                  orderItems.length -
                                  1
                                }{" "}
                                more item
                                {orderItems.length -
                                  1 ===
                                1
                                  ? ""
                                  : "s"}
                              </div>

                            )}

                          </td>

                          <td className="px-4 py-4 text-lg font-black">
                            {
                              order.totalQuantity ||
                              orderItems.reduce(
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
                              )
                            }
                          </td>

                          <td className="px-4 py-4 font-black text-emerald-700">
                            {money(
                              order.totalAmount ||
                                order.subtotal,

                              appSettings.currencySymbol ||
                                "₹"
                            )}
                          </td>

                          <td className="px-4 py-4">
                            {
                              order.deliveryDate ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-4">

                            <PriorityBadge
                              priority={
                                order.priority
                              }
                            />

                          </td>

                          <td className="px-4 py-4">

                            <StatusBadge
                              status={
                                order.status
                              }
                            />

                          </td>

                          <td className="px-4 py-4">

                            <div className="flex gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  setViewingOrder(
                                    order
                                  )
                                }
                                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                              >
                                View
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openEditForm(
                                    order
                                  )
                                }
                                className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void deleteOrder(
                                    order
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

                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

      {/* ===================================================
          CREATE / EDIT MODAL
      =================================================== */}

      {showForm && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">

          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">

            <div className="my-5 flex max-h-[calc(100vh-2.5rem)] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex shrink-0 items-start justify-between border-b bg-white px-5 py-5 sm:px-7">

                <div>

                  <div className="text-xs font-black uppercase tracking-wide text-blue-600">
                    Customer Order
                  </div>

                  <h2 className="mt-1 text-2xl font-black">
                    {editingOrder
                      ? `Edit ${editingOrder.orderNumber}`
                      : "Create New Order"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Select approved products and services
                    from Price Master and capture
                    production requirements.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  className="ml-4 text-3xl text-slate-400 disabled:opacity-50"
                >
                  ×
                </button>

              </div>

              {/* BODY */}

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">

                <div className="space-y-6">

                  {/* BASIC */}

                  <Section
                    title="Order Information"
                    description="Order reference, customer, PO and required delivery information."
                  >

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

                      <Field
                        label="Order Number *"
                        caption="Unique EMBRASTIC order reference."
                      >

                        <input
                          value={
                            form.orderNumber
                          }
                          onChange={(e) =>
                            updateForm(
                              "orderNumber",

                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Customer *"
                        caption="Customer placing the order."
                      >

                        <select
                          value={
                            form.customerId
                          }
                          onChange={(e) =>
                            handleCustomerChange(
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >

                          <option value="">
                            Select Customer
                          </option>

                          {customers.map(
                            (
                              customer
                            ) => (

                              <option
                                key={
                                  customer.id
                                }
                                value={
                                  customer.id
                                }
                              >
                                {
                                  customerDisplayName(
                                    customer
                                  )
                                }
                              </option>

                            )
                          )}

                        </select>

                      </Field>

                      <Field
                        label="Customer PO / Reference"
                        caption="Customer purchase order or reference."
                      >

                        <input
                          value={
                            form.customerPoNumber
                          }
                          onChange={(e) =>
                            updateForm(
                              "customerPoNumber",

                              e.target.value
                            )
                          }
                          placeholder="e.g. PO-4589"
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Order Date *"
                        caption="Date order is confirmed."
                      >

                        <input
                          type="date"
                          value={
                            form.orderDate
                          }
                          onChange={(e) =>
                            updateForm(
                              "orderDate",

                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Required Delivery Date *"
                        caption="Customer committed delivery date."
                      >

                        <input
                          type="date"
                          min={
                            form.orderDate ||
                            undefined
                          }
                          value={
                            form.deliveryDate
                          }
                          onChange={(e) =>
                            updateForm(
                              "deliveryDate",

                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Priority"
                        caption="Use Urgent only when operationally required."
                      >

                        <select
                          value={
                            form.priority
                          }
                          onChange={(e) =>
                            updateForm(
                              "priority",

                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >

                          {PRIORITIES.map(
                            (
                              priority
                            ) => (

                              <option
                                key={
                                  priority
                                }
                                value={
                                  priority
                                }
                              >
                                {priority}
                              </option>

                            )
                          )}

                        </select>

                      </Field>

                      <Field
                        label="Order Source"
                        caption="Useful for sales and repeat-customer reporting."
                      >

                        <select
                          value={
                            form.orderSource
                          }
                          onChange={(e) =>
                            updateForm(
                              "orderSource",

                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >

                          {ORDER_SOURCES.map(
                            (
                              source
                            ) => (

                              <option
                                key={
                                  source
                                }
                                value={
                                  source
                                }
                              >
                                {source}
                              </option>

                            )
                          )}

                        </select>

                      </Field>

                      <Field
                        label="Payment Terms (Days)"
                        caption="Commercial credit period for invoicing."
                      >

                        <input
                          type="number"
                          min="0"
                          value={
                            form.paymentTermsDays
                          }
                          onChange={(e) =>
                            updateForm(
                              "paymentTermsDays",

                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Order Status"
                        caption="Workflow status is also updated by downstream modules."
                      >

                        <select
                          value={
                            form.status
                          }
                          onChange={(e) =>
                            updateForm(
                              "status",

                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >

                          {ORDER_STATUSES.map(
                            (
                              orderStatus
                            ) => (

                              <option
                                key={
                                  orderStatus
                                }
                                value={
                                  orderStatus
                                }
                              >
                                {orderStatus}
                              </option>

                            )
                          )}

                        </select>

                      </Field>

                      {form.quotationNumber && (

                        <Field
                          label="Source Quotation"
                          caption="Quotation from which this Order was created."
                        >

                          <input
                            value={
                              form.quotationNumber
                            }
                            readOnly
                            className="w-full rounded-xl border bg-violet-50 px-4 py-3 font-bold text-violet-700"
                          />

                        </Field>

                      )}

                    </div>

                  </Section>

                  {/* CONTACT */}

                  <Section
                    title="Customer Contact & Delivery"
                    description="Operational contact and shipment destination for this specific order."
                  >

                    <div className="grid gap-5 md:grid-cols-3">

                      <Field
                        label="Contact Person"
                        caption="Person coordinating this order."
                      >

                        <input
                          value={
                            form.contactPerson
                          }
                          onChange={(e) =>
                            updateForm(
                              "contactPerson",

                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Contact Phone"
                        caption="Phone / WhatsApp contact for order coordination."
                      >

                        <input
                          value={
                            form.contactPhone
                          }
                          onChange={(e) =>
                            updateForm(
                              "contactPhone",

                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Contact Email"
                        caption="Email for order and dispatch communication."
                      >

                        <input
                          type="email"
                          value={
                            form.contactEmail
                          }
                          onChange={(e) =>
                            updateForm(
                              "contactEmail",

                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <div className="md:col-span-3">

                        <Field
                          label="Shipping / Delivery Address"
                          caption="Copied from Customer record and editable for this Order."
                        >

                          <textarea
                            value={
                              form.shippingAddress
                            }
                            onChange={(e) =>
                              updateForm(
                                "shippingAddress",

                                e.target.value
                              )
                            }
                            className="min-h-20 w-full rounded-xl border px-4 py-3"
                          />

                        </Field>

                      </div>

                    </div>

                  </Section>

                  {/* ITEMS */}

                  <Section
                    title="Order Items & Selling Price"
                    description="Select each sellable product or service from Price Master. Additional production information can then be entered for that Order line."
                  >

                    <div className="space-y-5">

                      {items.map(
                        (
                          item,
                          index
                        ) => {

                          const selectedPrice =
                            priceMaster.find(
                              (
                                price
                              ) =>
                                price.id ===
                                item.priceMasterId
                            );

                          const belowMinimum =
                            item.minimumSellingPrice >
                              0 &&
                            item.unitPrice <
                              item.minimumSellingPrice;

                          const lineSubtotal =
                            Number(
                              item.quantity ||
                                0
                            ) *
                            Number(
                              item.unitPrice ||
                                0
                            );

                          const lineGst =
                            lineSubtotal *
                            Number(
                              item.gstPercent ||
                                0
                            ) /
                            100;

                          const embroideryItem =
                            normalizeText(
                              item.masterItemType
                            ) ===
                              "embroidery service" ||
                            normalizeText(
                              item.category
                            ) ===
                              "embroidery" ||
                            normalizeText(
                              item.itemType
                            ).includes(
                              "embroidery"
                            );

                          return (

                            <div
                              key={
                                item.id
                              }
                              className="rounded-2xl border bg-white p-5 shadow-sm"
                            >

                              <div className="mb-5 flex items-center justify-between">

                                <div>

                                  <div className="text-xs font-black uppercase tracking-wide text-blue-600">
                                    Item{" "}
                                    {index +
                                      1}
                                  </div>

                                  <div className="mt-1 font-black text-slate-900">

                                    {item.sku && (
                                      <span className="text-emerald-700">
                                        {item.sku}
                                        {" — "}
                                      </span>
                                    )}

                                    {
                                      item.masterItemName ||
                                      item.description ||
                                      "Order Item"
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

                                {/* PRICE MASTER */}

                                <div className="lg:col-span-2">

                                  <Field
                                    label="Price Master Item *"
                                    caption="Select approved item / service and selling price."
                                  >

                                    <select
                                      value={
                                        item.priceMasterId
                                      }
                                      onChange={(e) =>
                                        handlePriceMasterChange(
                                          item.id,

                                          e.target.value
                                        )
                                      }
                                      className="w-full rounded-xl border bg-white px-3 py-2.5"
                                    >

                                      <option value="">
                                        Select Item / Service
                                      </option>

                                      {activePriceMaster.map(
                                        (
                                          price
                                        ) => (

                                          <option
                                            key={
                                              price.id
                                            }
                                            value={
                                              price.id
                                            }
                                          >
                                            {price.sku
                                              ? `${price.sku} — `
                                              : ""}

                                            {price.itemName}

                                            {" — "}

                                            {money(
                                              price.sellingPrice,

                                              appSettings.currencySymbol ||
                                                "₹"
                                            )}

                                            {" / "}

                                            {price.unit}
                                          </option>

                                        )
                                      )}

                                    </select>

                                  </Field>

                                </div>

                                {/* SKU */}

                                <Field
                                  label="SKU"
                                  caption="Standard item code from Price Master."
                                >

                                  <input
                                    value={
                                      item.sku
                                    }
                                    readOnly
                                    className="w-full rounded-xl border bg-slate-50 px-3 py-2.5 font-black text-emerald-700"
                                  />

                                </Field>

                                {/* UNIT */}

                                <Field
                                  label="Unit"
                                  caption="Pricing unit from Price Master."
                                >

                                  <input
                                    value={
                                      item.unit
                                    }
                                    readOnly
                                    className="w-full rounded-xl border bg-slate-50 px-3 py-2.5"
                                  />

                                </Field>

                                {/* ITEM TYPE */}

                                <Field
                                  label="Item Type *"
                                  caption="Product / service classification."
                                >

                                  <select
                                    value={
                                      item.itemType
                                    }
                                    onChange={(e) =>
                                      updateItem(
                                        item.id,

                                        "itemType",

                                        e.target.value
                                      )
                                    }
                                    className="w-full rounded-xl border bg-white px-3 py-2.5"
                                  >

                                    <option value="">
                                      Select Item
                                    </option>

                                    {ITEM_TYPES.map(
                                      (
                                        value
                                      ) => (

                                        <option
                                          key={
                                            value
                                          }
                                          value={
                                            value
                                          }
                                        >
                                          {value}
                                        </option>

                                      )
                                    )}

                                  </select>

                                </Field>

                                {/* DESCRIPTION */}

                                <div className="lg:col-span-2">

                                  <Field
                                    label="Item Description *"
                                    caption="Master description can be adjusted for this specific Order."
                                  >

                                    <input
                                      value={
                                        item.description
                                      }
                                      onChange={(e) =>
                                        updateItem(
                                          item.id,

                                          "description",

                                          e.target.value
                                        )
                                      }
                                      placeholder="Product / garment description"
                                      className="w-full rounded-xl border px-3 py-2.5"
                                    />

                                  </Field>

                                </div>

                                {/* QUANTITY */}

                                <Field
                                  label="Quantity *"
                                  caption="Number of units ordered."
                                >

                                  <input
                                    type="number"
                                    min="1"
                                    value={
                                      item.quantity
                                    }
                                    onChange={(e) =>
                                      updateItem(
                                        item.id,

                                        "quantity",

                                        Number(
                                          e.target.value
                                        )
                                      )
                                    }
                                    className="w-full rounded-xl border px-3 py-2.5"
                                  />

                                </Field>

                                {/* SELLING PRICE */}

                                <Field
                                  label="Selling Price ₹ *"
                                  caption={
                                    item.minimumSellingPrice >
                                    0
                                      ? `Minimum approved: ${money(
                                          item.minimumSellingPrice,

                                          appSettings.currencySymbol ||
                                            "₹"
                                        )}`
                                      : "Fetched from Price Master."
                                  }
                                >

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      item.unitPrice
                                    }
                                    onChange={(e) =>
                                      updateItem(
                                        item.id,

                                        "unitPrice",

                                        Number(
                                          e.target.value
                                        )
                                      )
                                    }
                                    className={`w-full rounded-xl border px-3 py-2.5 ${
                                      belowMinimum
                                        ? "border-red-400 bg-red-50 text-red-700"
                                        : ""
                                    }`}
                                  />

                                </Field>

                                {/* GST */}

                                <Field
                                  label="GST %"
                                  caption="Fetched from Price Master."
                                >

                                  <input
                                    value={
                                      item.gstPercent
                                    }
                                    readOnly
                                    className="w-full rounded-xl border bg-slate-50 px-3 py-2.5"
                                  />

                                </Field>

                                {/* CATEGORY */}

                                <Field
                                  label="Price Category"
                                  caption="Master commercial classification."
                                >

                                  <input
                                    value={
                                      selectedPrice?.customerPriceCategory ||
                                      "—"
                                    }
                                    readOnly
                                    className="w-full rounded-xl border bg-slate-50 px-3 py-2.5"
                                  />

                                </Field>

                                {/* LINE VALUE */}

                                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                                  <div className="text-xs font-bold uppercase tracking-wide text-blue-600">
                                    Line Value
                                  </div>

                                  <div className="mt-1 text-lg font-black text-blue-900">
                                    {money(
                                      lineSubtotal,

                                      appSettings.currencySymbol ||
                                        "₹"
                                    )}
                                  </div>

                                  <div className="mt-1 text-xs text-blue-600">
                                    GST{" "}
                                    {money(
                                      lineGst,

                                      appSettings.currencySymbol ||
                                        "₹"
                                    )}
                                  </div>

                                </div>

                                {/* COLOUR */}

                                <Field
                                  label="Colour"
                                  caption="Garment / item colour."
                                >

                                  <input
                                    value={
                                      item.color
                                    }
                                    onChange={(e) =>
                                      updateItem(
                                        item.id,

                                        "color",

                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g. Black"
                                    className="w-full rounded-xl border px-3 py-2.5"
                                  />

                                </Field>

                                {/* SIZE */}

                                <Field
                                  label="Size"
                                  caption="Garment size, if applicable."
                                >

                                  <input
                                    value={
                                      item.size
                                    }
                                    onChange={(e) =>
                                      updateItem(
                                        item.id,

                                        "size",

                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g. L / XL"
                                    className="w-full rounded-xl border px-3 py-2.5"
                                  />

                                </Field>

                                {/* DESIGN */}

                                <Field
                                  label="Design Name"
                                  caption="Name / reference for artwork and digitizing."
                                >

                                  <input
                                    value={
                                      item.designName
                                    }
                                    onChange={(e) =>
                                      updateItem(
                                        item.id,

                                        "designName",

                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g. ABC Company Logo"
                                    className="w-full rounded-xl border px-3 py-2.5"
                                  />

                                </Field>

                                {/* CUSTOMER SKU */}

                                <Field
                                  label="Customer SKU / Style Code"
                                  caption="Customer product or style code, where applicable."
                                >

                                  <input
                                    value={
                                      item.customerSku
                                    }
                                    onChange={(e) =>
                                      updateItem(
                                        item.id,

                                        "customerSku",

                                        e.target.value
                                      )
                                    }
                                    placeholder="Optional"
                                    className="w-full rounded-xl border px-3 py-2.5"
                                  />

                                </Field>

                                {/* EMBROIDERY */}

                                <Field
                                  label={
                                    embroideryItem
                                      ? "Embroidery Service *"
                                      : "Embroidery Service"
                                  }
                                  caption="Work to be performed where embroidery is required."
                                >

                                  <select
                                    value={
                                      item.embroideryService
                                    }
                                    onChange={(e) =>
                                      updateItem(
                                        item.id,

                                        "embroideryService",

                                        e.target.value
                                      )
                                    }
                                    className="w-full rounded-xl border bg-white px-3 py-2.5"
                                  >

                                    {EMBROIDERY_SERVICES.map(
                                      (
                                        value
                                      ) => (

                                        <option
                                          key={
                                            value
                                          }
                                          value={
                                            value
                                          }
                                        >
                                          {value}
                                        </option>

                                      )
                                    )}

                                  </select>

                                </Field>

                                {/* PLACEMENT */}

                                <Field
                                  label={
                                    embroideryItem
                                      ? "Placement *"
                                      : "Placement"
                                  }
                                  caption="Embroidery location on item, where applicable."
                                >

                                  <select
                                    value={
                                      item.placement
                                    }
                                    onChange={(e) =>
                                      updateItem(
                                        item.id,

                                        "placement",

                                        e.target.value
                                      )
                                    }
                                    className="w-full rounded-xl border bg-white px-3 py-2.5"
                                  >

                                    {PLACEMENTS.map(
                                      (
                                        value
                                      ) => (

                                        <option
                                          key={
                                            value
                                          }
                                          value={
                                            value
                                          }
                                        >
                                          {value}
                                        </option>

                                      )
                                    )}

                                  </select>

                                </Field>

                                {/* NOTES */}

                                <div className="lg:col-span-2">

                                  <Field
                                    label="Item Notes"
                                    caption="Line-specific commercial or production instructions."
                                  >

                                    <input
                                      value={
                                        item.notes
                                      }
                                      onChange={(e) =>
                                        updateItem(
                                          item.id,

                                          "notes",

                                          e.target.value
                                        )
                                      }
                                      className="w-full rounded-xl border px-3 py-2.5"
                                    />

                                  </Field>

                                </div>

                              </div>

                              {belowMinimum && (

                                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
                                  ⚠ Selling Price is below
                                  the approved minimum of{" "}
                                  {money(
                                    item.minimumSellingPrice,

                                    appSettings.currencySymbol ||
                                      "₹"
                                  )}.
                                </div>

                              )}

                            </div>

                          );
                        }
                      )}

                      <button
                        type="button"
                        onClick={
                          addItem
                        }
                        className="w-full rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-4 py-4 font-black text-blue-700 hover:bg-blue-50"
                      >
                        + Add Another Order Item
                      </button>

                    </div>

                  </Section>

                  {/* ORDER TOTAL */}

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

                    <InfoMetric
                      label="Line Items"
                      value={String(
                        items.length
                      )}
                    />

                    <InfoMetric
                      label="Total Quantity"
                      value={String(
                        totalQuantity
                      )}
                    />

                    <InfoMetric
                      label="Subtotal"
                      value={money(
                        subtotal,

                        appSettings.currencySymbol ||
                          "₹"
                      )}
                    />

                    <InfoMetric
                      label="GST"
                      value={money(
                        gstAmount,

                        appSettings.currencySymbol ||
                          "₹"
                      )}
                    />

                    <InfoMetric
                      label="Order Value"
                      value={money(
                        orderTotal,

                        appSettings.currencySymbol ||
                          "₹"
                      )}
                      highlight
                    />

                  </div>

                  {/* NOTES */}

                  <Section
                    title="Production & Customer Notes"
                    description="Special instructions such as thread colour matching, garment handling, packing, approval or deadline requirements."
                  >

                    <textarea
                      value={
                        form.notes
                      }
                      onChange={(e) =>
                        updateForm(
                          "notes",

                          e.target.value
                        )
                      }
                      placeholder="Special order instructions..."
                      className="min-h-28 w-full rounded-xl border px-4 py-3"
                    />

                  </Section>

                </div>

              </div>

              {/* FOOTER */}

              <div className="flex shrink-0 flex-col gap-3 border-t bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">

                <div className="text-sm text-slate-500">

                  <span className="font-black text-slate-900">
                    {totalQuantity}
                  </span>

                  {" "}
                  units ·{" "}

                  <span className="font-black text-slate-900">
                    {items.length}
                  </span>

                  {" "}
                  line item
                  {items.length ===
                  1
                    ? ""
                    : "s"}

                  {" · "}

                  <span className="font-black text-emerald-700">
                    {money(
                      orderTotal,

                      appSettings.currencySymbol ||
                        "₹"
                    )}
                  </span>

                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row">

                  <button
                    type="button"
                    onClick={
                      closeForm
                    }
                    disabled={
                      saving
                    }
                    className="rounded-xl border px-5 py-3 font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void saveOrder()
                    }
                    disabled={
                      saving
                    }
                    className="rounded-xl bg-blue-700 px-6 py-3 font-black text-white hover:bg-blue-800 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingOrder
                      ? "Update Order"
                      : "Create Order"}
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* ===================================================
          VIEW ORDER
      =================================================== */}

      {viewingOrder && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">

          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">

            <div className="my-6 w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">

              <div className="flex items-start justify-between border-b px-6 py-5">

                <div>

                  <div className="text-xs font-black uppercase tracking-wide text-blue-600">
                    Order Summary
                  </div>

                  <h2 className="mt-1 text-2xl font-black">
                    {
                      viewingOrder.orderNumber
                    }
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      viewingOrder.customerName
                    }
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setViewingOrder(
                      null
                    )
                  }
                  className="text-3xl text-slate-400"
                >
                  ×
                </button>

              </div>

              <div className="space-y-6 p-6">

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

                  <InfoMetric
                    label="Order Date"
                    value={
                      viewingOrder.orderDate ||
                      "—"
                    }
                  />

                  <InfoMetric
                    label="Delivery"
                    value={
                      viewingOrder.deliveryDate ||
                      "—"
                    }
                  />

                  <InfoMetric
                    label="Total Quantity"
                    value={String(
                      viewingOrder.totalQuantity ||
                        0
                    )}
                  />

                  <InfoMetric
                    label="Order Value"
                    value={money(
                      viewingOrder.totalAmount ||
                        viewingOrder.subtotal,

                      appSettings.currencySymbol ||
                        "₹"
                    )}
                  />

                  <InfoMetric
                    label="Status"
                    value={
                      viewingOrder.status
                    }
                  />

                </div>

                {viewingOrder.quotationNumber && (

                  <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">

                    <div className="text-xs font-black uppercase text-violet-600">
                      Source Quotation
                    </div>

                    <div className="mt-1 font-black text-violet-900">
                      {
                        viewingOrder.quotationNumber
                      }
                    </div>

                  </div>

                )}

                <div className="overflow-x-auto rounded-2xl border">

                  <table className="w-full min-w-[1250px] text-left text-sm">

                    <thead>

                      <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                        <th className="px-4 py-3">
                          SKU
                        </th>

                        <th className="px-4 py-3">
                          Item
                        </th>

                        <th className="px-4 py-3">
                          Colour / Size
                        </th>

                        <th className="px-4 py-3">
                          Design
                        </th>

                        <th className="px-4 py-3">
                          Embroidery
                        </th>

                        <th className="px-4 py-3">
                          Placement
                        </th>

                        <th className="px-4 py-3">
                          Qty
                        </th>

                        <th className="px-4 py-3">
                          Unit Price
                        </th>

                        <th className="px-4 py-3">
                          GST
                        </th>

                        <th className="px-4 py-3">
                          Total
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {parseOrderItems(
                        viewingOrder.orderItems ||
                          viewingOrder.items
                      ).map(
                        (
                          item
                        ) => {

                          const lineTotal =
                            Number(
                              item.quantity ||
                                0
                            ) *
                            Number(
                              item.unitPrice ||
                                0
                            );

                          return (

                            <tr
                              key={
                                item.id
                              }
                              className="border-b last:border-0"
                            >

                              <td className="px-4 py-3 font-black text-emerald-700">
                                {
                                  item.sku ||
                                  "—"
                                }
                              </td>

                              <td className="px-4 py-3">

                                <div className="font-black">
                                  {
                                    item.masterItemName ||
                                    item.description
                                  }
                                </div>

                                <div className="mt-1 text-xs text-slate-400">
                                  {
                                    item.description
                                  }
                                </div>

                                {item.orderType && (
                                  <div className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
                                    {item.orderType === "CUSTOM_EMBROIDERY"
                                      ? "Custom Embroidery"
                                      : "Ready Embroidered"}
                                  </div>
                                )}

                                {item.sizes.length > 0 && (
                                  <div className="mt-2 text-xs font-bold text-slate-600">
                                    Sizes:{" "}
                                    {item.sizes
                                      .map(
                                        (row) =>
                                          `${row.size} × ${row.quantity}`
                                      )
                                      .join(", ")}
                                  </div>
                                )}

                                {item.embroiderySize && (
                                  <div className="mt-1 text-xs text-slate-600">
                                    Embroidery size:{" "}
                                    <span className="font-bold">
                                      {item.embroiderySize}
                                    </span>
                                  </div>
                                )}

                                {item.artwork?.name && (
                                  <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 p-2 text-xs">
                                    <div className="font-black text-blue-800">
                                      Customer artwork
                                    </div>
                                    <div className="mt-1 break-all text-blue-700">
                                      {item.artwork.name}
                                    </div>
                                    {item.artwork.uploadId && (
                                      <>
                                        <div className="mt-1 break-all text-[10px] text-blue-500">
                                          Upload ID: {item.artwork.uploadId}
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                          <a
                                            href={`/api/protected/artwork/${encodeURIComponent(
                                              item.artwork.uploadId
                                            )}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-black text-white transition hover:bg-blue-700"
                                          >
                                            View Artwork
                                          </a>

                                          <a
                                            href={`/api/protected/artwork/${encodeURIComponent(
                                              item.artwork.uploadId
                                            )}?download=1`}
                                            className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-black text-blue-700 transition hover:bg-blue-50"
                                          >
                                            Download Artwork
                                          </a>
                                        </div>
                                      </>
                                    )}
                                    {item.artwork.storedName && (
                                      <div className="mt-2 break-all text-[10px] text-blue-500">
                                        Stored file: {item.artwork.storedName}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {item.instructions && (
                                  <div className="mt-2 rounded-xl bg-amber-50 p-2 text-xs text-amber-900">
                                    <span className="font-black">
                                      Customer requirements:
                                    </span>{" "}
                                    {item.instructions}
                                  </div>
                                )}

                              </td>

                              <td className="px-4 py-3">
                                {
                                  [
                                    item.color,
                                    item.sizes.length
                                      ? item.sizes
                                          .map(
                                            (row) =>
                                              `${row.size} × ${row.quantity}`
                                          )
                                          .join(", ")
                                      : item.size,
                                  ]
                                    .filter(Boolean)
                                    .join(" / ") ||
                                  "—"
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  item.designName ||
                                  "—"
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  item.embroideryService ||
                                  "—"
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  item.placement ||
                                  "—"
                                }
                              </td>

                              <td className="px-4 py-3 font-black">
                                {
                                  item.quantity
                                }{" "}
                                {
                                  item.unit
                                }
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
                                }
                                %
                              </td>

                              <td className="px-4 py-3 font-black text-blue-700">
                                {money(
                                  lineTotal,

                                  appSettings.currencySymbol ||
                                    "₹"
                                )}
                              </td>

                            </tr>

                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

                {viewingOrder.notes && (

                  <div className="rounded-2xl border bg-slate-50 p-5">

                    <div className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Notes
                    </div>

                    <div className="mt-2 whitespace-pre-wrap text-sm leading-6">
                      {
                        viewingOrder.notes
                      }
                    </div>

                  </div>

                )}

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
  title:
    string;

  description:
    string;

  children:
    ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-slate-50/50 p-4 sm:p-5">

      <div className="mb-5">

        <h3 className="font-black text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {
            description
          }
        </p>

      </div>

      {
        children
      }

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

      <label className="mb-2 block text-sm font-bold text-slate-800">
        {
          label
        }
      </label>

      {
        children
      }

      <p className="mt-1.5 text-xs leading-5 text-slate-400">
        {
          caption
        }
      </p>

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
    | "blue"
    | "violet"
    | "amber"
    | "rose";
}) {
  const styles = {
    blue:
      "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50",

    violet:
      "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50",

    amber:
      "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50",

    rose:
      "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-50",
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
        {
          label
        }
      </div>

      <div className="mt-2 text-3xl font-black text-slate-950">
        {
          value
        }
      </div>

      <div className="mt-1 text-xs text-slate-500">
        {
          caption
        }
      </div>

    </div>
  );
}

function InfoMetric({
  label,
  value,
  highlight = false,
}: {
  label:
    string;

  value:
    string;

  highlight?:
    boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-emerald-200 bg-emerald-50"
          : "bg-white"
      }`}
    >

      <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {
          label
        }
      </div>

      <div
        className={`mt-1 text-xl font-black ${
          highlight
            ? "text-emerald-700"
            : "text-slate-900"
        }`}
      >
        {
          value
        }
      </div>

    </div>
  );
}

function PriorityBadge({
  priority,
}: {
  priority:
    string;
}) {
  const normalized =
    normalizeText(
      priority
    );

  const style =
    normalized ===
    "urgent"
      ? "bg-red-100 text-red-700"
      : normalized ===
        "high"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${style}`}
    >
      {
        priority ||
        "Normal"
      }
    </span>
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

  let style =
    "bg-slate-100 text-slate-700";

  if (
    [
      "completed",
      "delivered",
      "paid",
    ].includes(
      normalized
    )
  ) {
    style =
      "bg-emerald-100 text-emerald-700";
  } else if (
    [
      "production",
      "quality control",
    ].includes(
      normalized
    )
  ) {
    style =
      "bg-blue-100 text-blue-700";
  } else if (
    [
      "ready for dispatch",
      "dispatched",
      "in transit",
    ].includes(
      normalized
    )
  ) {
    style =
      "bg-violet-100 text-violet-700";
  } else if (
    normalized ===
    "cancelled"
  ) {
    style =
      "bg-red-100 text-red-700";
  } else if (
    [
      "pending",
      "artwork",
      "digitizing",
    ].includes(
      normalized
    )
  ) {
    style =
      "bg-amber-100 text-amber-700";
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${style}`}
    >
      {
        status ||
        "Pending"
      }
    </span>
  );
}
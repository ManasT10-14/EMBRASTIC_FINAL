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

type Customer = {
  id: string;
  customerCode: string;

  name: string;
  businessName: string;

  status: string;

  phone: string;
  email: string;

  gstNumber: string;
  contactPerson: string;

  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  billingCountry: string;

  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;

  paymentTermsDays: number;
  priceCategory: string;
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

type QuotationItem = {
  id: string;

  priceMasterId: string;
  sku: string;

  service: string;
  description: string;

  quantity: number;
  unit: string;

  rate: number;

  gstPercent: number;
  minimumSellingPrice: number;

  placement: string;
  size: string;
  threadType: string;

  notes: string;
};

type Quotation = {
  id: string;

  quotationNumber: string;

  customer: string;
  customerId: string;

  date: string;
  validUntil: string;

  items: QuotationItem[];

  discount: number;
  gstPercent: number;

  notes: string;

  status: string;

  createdAt: string;
  updatedAt: string;
};

type OrderRow = {
  id: string;

  orderNumber: string;

  customerId?: string;
  customerName?: string;

  orderDate?: string;
  deliveryDate?: string;

  status?: string;

  items?: string;
  orderItems?: string;

  notes?: string;

  quotationId?: string;
  quotationNumber?: string;

  createdAt?: string;
  updatedAt?: string;

  [key: string]: any;
};

/* =========================================================
   OPTIONS
========================================================= */

const QUOTATION_STATUSES = [
  "Draft",
  "Sent",
  "Accepted",
  "Rejected",
  "Expired",
  "Converted to Order",
  "Cancelled",
];

const EMBROIDERY_PLACEMENTS = [
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

  "Collar",
  "Neck",
  "Cuff",

  "Bag Front",
  "Towel Corner",

  "Custom Placement",
];

const EMBROIDERY_SIZES = [
  "Not Applicable",

  "Up to 2 inch",
  "Up to 3 inch",
  "Up to 4 inch",
  "Up to 5 inch",
  "Up to 6 inch",
  "Up to 8 inch",
  "Up to 10 inch",

  "Large / Full Back",

  "Custom Size",
];

const THREAD_TYPES = [
  "Standard Polyester",
  "Rayon",
  "Metallic",
  "Glow in the Dark",
  "Reflective",
  "Cotton",
  "Specialty Thread",
  "Customer Specified",
  "Not Applicable",
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
  value: string,
  days: number
) {
  if (!value) {
    return "";
  }

  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  date.setDate(
    date.getDate() +
      days
  );

  return [
    date.getFullYear(),

    String(
      date.getMonth() +
        1
    ).padStart(
      2,
      "0"
    ),

    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    ),
  ].join("-");
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
        0,

      maximumFractionDigits:
        2,
    }
  )}`;
}

function createEmptyItem():
  QuotationItem {
  return {
    id:
      generateId(),

    priceMasterId:
      "",

    sku:
      "",

    service:
      "",

    description:
      "",

    quantity:
      1,

    unit:
      "pcs",

    rate:
      0,

    gstPercent:
      18,

    minimumSellingPrice:
      0,

    placement:
      "Not Applicable",

    size:
      "Not Applicable",

    threadType:
      "Standard Polyester",

    notes:
      "",
  };
}

/* =========================================================
   NORMALIZERS
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

    status:
      clean(
        row?.status
      ) ||
      "Active",

    phone:
      clean(
        row?.phone
      ),

    email:
      clean(
        row?.email
      ),

    gstNumber:
      clean(
        row?.gstNumber ??
          row?.gstin
      ),

    contactPerson:
      clean(
        row?.contactPerson
      ),

    billingAddress:
      clean(
        row?.billingAddress ??
          row?.address
      ),

    billingCity:
      clean(
        row?.billingCity
      ),

    billingState:
      clean(
        row?.billingState
      ),

    billingPostalCode:
      clean(
        row?.billingPostalCode
      ),

    billingCountry:
      clean(
        row?.billingCountry
      ) ||
      "India",

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
          row?.billingPostalCode
      ),

    shippingCountry:
      clean(
        row?.shippingCountry ??
          row?.billingCountry
      ) ||
      "India",

    paymentTermsDays:
      numberValue(
        row?.paymentTermsDays
      ),

    priceCategory:
      clean(
        row?.priceCategory
      ) ||
      "Standard",
  };
}

function normalizePriceMaster(
  row: any
): PriceMasterRow {
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

function normalizeItems(
  value: any
): QuotationItem[] {
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
        item: any,
        index: number
      ) => ({
        id:
          clean(
            item?.id
          ) ||
          `existing-item-${index}`,

        priceMasterId:
          clean(
            item?.priceMasterId
          ),

        sku:
          clean(
            item?.sku ??
              item?.itemCode
          ),

        service:
          clean(
            item?.service ??
              item?.itemName ??
              item?.description
          ),

        description:
          clean(
            item?.description
          ),

        quantity:
          numberValue(
            item?.quantity
          ) ||
          1,

        unit:
          clean(
            item?.unit
          ) ||
          "pcs",

        rate:
          numberValue(
            item?.rate ??
              item?.sellingPrice
          ),

        gstPercent:
          numberValue(
            item?.gstPercent
          ) ||
          18,

        minimumSellingPrice:
          numberValue(
            item?.minimumSellingPrice
          ),

        placement:
          clean(
            item?.placement
          ) ||
          "Not Applicable",

        size:
          clean(
            item?.size
          ) ||
          "Not Applicable",

        threadType:
          clean(
            item?.threadType
          ) ||
          "Standard Polyester",

        notes:
          clean(
            item?.notes
          ),
      })
    );
  } catch {
    return [];
  }
}

function normalizeQuotation(
  row: any
): Quotation {
  return {
    id:
      clean(
        row?.id
      ),

    quotationNumber:
      clean(
        row?.quotationNumber
      ),

    customer:
      clean(
        row?.customer
      ),

    customerId:
      clean(
        row?.customerId
      ),

    date:
      clean(
        row?.date
      ).split(
        "T"
      )[0],

    validUntil:
      clean(
        row?.validUntil
      ).split(
        "T"
      )[0],

    items:
      normalizeItems(
        row?.items
      ),

    discount:
      numberValue(
        row?.discount
      ),

    gstPercent:
      numberValue(
        row?.gstPercent
      ) ||
      18,

    notes:
      clean(
        row?.notes
      ),

    status:
      clean(
        row?.status
      ) ||
      "Draft",

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

function normalizeOrder(
  row: any
): OrderRow {
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
        row?.customerName
      ),

    quotationId:
      clean(
        row?.quotationId
      ),

    quotationNumber:
      clean(
        row?.quotationNumber
      ),

    notes:
      clean(
        row?.notes
      ),
  };
}

/* =========================================================
   PAGE
========================================================= */

export default function QuotationsPage() {
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
    quotations,
    setQuotations,
  ] =
    useState<
      Quotation[]
    >([]);

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
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    generatingPdfId,
    setGeneratingPdfId,
  ] =
    useState<
      string | null
    >(null);

  const [
    showForm,
    setShowForm,
  ] =
    useState(false);

  const [
    editing,
    setEditing,
  ] =
    useState<
      Quotation | null
    >(null);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("All");

  const [
    customerId,
    setCustomerId,
  ] =
    useState("");

  const [
    quotationDate,
    setQuotationDate,
  ] =
    useState("");

  const [
    validUntil,
    setValidUntil,
  ] =
    useState("");

  const [
    discount,
    setDiscount,
  ] =
    useState(0);

  const [
    status,
    setStatus,
  ] =
    useState(
      "Draft"
    );

  const [
    notes,
    setNotes,
  ] =
    useState("");

  const [
    items,
    setItems,
  ] =
    useState<
      QuotationItem[]
    >([]);

  /* =======================================================
     INITIALIZE
  ======================================================= */

  useEffect(() => {
    const today =
      getToday();

    setQuotationDate(
      today
    );

    setValidUntil(
      addDays(
        today,
        15
      )
    );

    setItems([
      createEmptyItem(),
    ]);

    void loadData();
  }, []);

  useEffect(() => {
    if (
      !showForm
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
  }, [
    showForm,
  ]);

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

  async function saveExcelRecord(
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
      throw new Error(
        data?.message ||
          data?.error ||
          "Unable to save data."
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
        customerRows,
        quotationRows,
        priceRows,
      ] =
        await Promise.all([
          loadSheet(
            "Customers"
          ),

          loadSheet(
            "Quotations"
          ),

          loadSheet(
            "PriceMaster"
          ),
        ]);

      const loadedCustomers =
        customerRows
          .map(
            normalizeCustomer
          )
          .filter(
            (
              customer:
                Customer
            ) =>
              Boolean(
                customer.id &&
                  customer.name
              )
          )
          .sort(
            (
              a:
                Customer,
              b:
                Customer
            ) =>
              a.name.localeCompare(
                b.name
              )
          );

      const loadedPrices =
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

      const loadedQuotations =
        quotationRows
          .map(
            normalizeQuotation
          )
          .filter(
            (
              quotation:
                Quotation
            ) =>
              Boolean(
                quotation.id
              )
          )
          .sort(
            (
              a:
                Quotation,
              b:
                Quotation
            ) =>
              String(
                b.createdAt ||
                  b.date
              ).localeCompare(
                String(
                  a.createdAt ||
                    a.date
                )
              )
          );

      setCustomers(
        loadedCustomers
      );

      setPriceMaster(
        loadedPrices
      );

      setQuotations(
        loadedQuotations
      );
    } catch (
      error
    ) {
      console.error(
        "Quotation load error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to load Quotations."
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
     CUSTOMER / PRICE MASTER
  ======================================================= */

  const selectableCustomers =
    useMemo(
      () =>
        customers.filter(
          (
            customer
          ) =>
            normalizeText(
              customer.status
            ) !==
            "blocked"
        ),
      [
        customers,
      ]
    );

  const selectedCustomer =
    useMemo(
      () =>
        customers.find(
          (
            customer
          ) =>
            customer.id ===
            customerId
        ),
      [
        customers,
        customerId,
      ]
    );

const activePriceMaster =
  useMemo(
    () => {
      /*
       * quotationDate is populated after mount.
       *
       * Do not call getToday() here because this useMemo
       * executes during render/prerender, and Next.js 16
       * does not allow current-time reads there.
       */
      if (!quotationDate) {
        return [];
      }

      const effectiveDate =
        quotationDate;

      return priceMaster.filter(
        (row) => {
          if (
            normalizeText(
              row.status
            ) !== "active"
          ) {
            return false;
          }

          if (
            row.effectiveFrom &&
            row.effectiveFrom >
              effectiveDate
          ) {
            return false;
          }

          if (
            row.effectiveTo &&
            row.effectiveTo <
              effectiveDate
          ) {
            return false;
          }

          return true;
        }
      );
    },
    [
      priceMaster,
      quotationDate,
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
                item.rate ||
                  0
              ),
          0
        ),
      [
        items,
      ]
    );

  const taxableAmount =
    Math.max(
      subtotal -
        Number(
          discount ||
            0
        ),
      0
    );

  /*
   * Calculate GST line-by-line.
   * This allows different Price Master items
   * to have different GST rates.
   */
  const rawTax =
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
                item.rate ||
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

  const gstAmount =
    rawTax *
    (
      1 -
      discountRatio
    );

  const totalAmount =
    taxableAmount +
    gstAmount;

  const commonGstPercent =
    items.length >
      0 &&
    items.every(
      (
        item
      ) =>
        item.gstPercent ===
        items[0]
          .gstPercent
    )
      ? items[0]
          .gstPercent
      : 0;

  /* =======================================================
     FORM
  ======================================================= */

  function resetForm() {
    setEditing(
      null
    );

    setCustomerId(
      ""
    );

    const today =
      getToday();

    setQuotationDate(
      today
    );

    setValidUntil(
      addDays(
        today,
        15
      )
    );

    setDiscount(
      0
    );

    setStatus(
      "Draft"
    );

    setNotes(
      ""
    );

    setItems([
      createEmptyItem(),
    ]);
  }

  async function openCreate() {
    await loadData(
      true
    );

    resetForm();

    setShowForm(
      true
    );
  }

  function closeForm() {
    setShowForm(
      false
    );

    resetForm();
  }

  function openEdit(
    quotation:
      Quotation
  ) {
    setEditing(
      quotation
    );

    setCustomerId(
      quotation.customerId
    );

    const today =
      getToday();

    const quoteDate =
      quotation.date ||
      today;

    setQuotationDate(
      quoteDate
    );

    setValidUntil(
      quotation.validUntil ||
        addDays(
          quoteDate,
          15
        )
    );

    setDiscount(
      quotation.discount
    );

    setStatus(
      quotation.status
    );

    setNotes(
      quotation.notes
    );

    setItems(
      quotation.items.length >
        0
        ? quotation.items.map(
            (
              item
            ) => ({
              ...item,

              id:
                item.id.startsWith(
                  "existing-item-"
                )
                  ? generateId()
                  : item.id,
            })
          )
        : [
            createEmptyItem(),
          ]
    );

    setShowForm(
      true
    );
  }

  function addItem() {
    setItems(
      (
        current
      ) => [
        ...current,

        createEmptyItem(),
      ]
    );
  }

  function removeItem(
    id: string
  ) {
    if (
      items.length ===
      1
    ) {
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

  function updateItem(
    id: string,
    field:
      keyof QuotationItem,
    value:
      string | number
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
                    [
                      "quantity",
                      "rate",
                      "gstPercent",
                      "minimumSellingPrice",
                    ].includes(
                      field
                    )
                      ? Number(
                          value
                        )
                      : String(
                          value
                        ),
                }
              : item
        )
    );
  }

  function selectPriceItem(
    itemId: string,
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
                ? createEmptyItemWithId(
                    itemId
                  )
                : item
          )
      );

      return;
    }

    const price =
      activePriceMaster.find(
        (
          row
        ) =>
          row.id ===
          priceMasterId
      );

    if (!price) {
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
          ) =>
            item.id ===
            itemId
              ? {
                  ...item,

                  priceMasterId:
                    price.id,

                  sku:
                    price.sku,

                  service:
                    price.itemName,

                  description:
                    price.description,

                  unit:
                    price.unit,

                  rate:
                    price.sellingPrice,

                  gstPercent:
                    price.gstPercent,

                  minimumSellingPrice:
                    price.minimumSellingPrice,

                  placement:
                    price.itemType ===
                    "Embroidery Service"
                      ? item.placement ===
                        "Not Applicable"
                        ? "Left Chest"
                        : item.placement
                      : "Not Applicable",

                  size:
                    price.itemType ===
                    "Embroidery Service"
                      ? item.size ===
                        "Not Applicable"
                        ? "Up to 4 inch"
                        : item.size
                      : "Not Applicable",

                  threadType:
                    price.itemType ===
                    "Embroidery Service"
                      ? item.threadType
                      : "Not Applicable",
                }
              : item
        )
    );
  }

  /* =======================================================
     NUMBERS
  ======================================================= */

  function nextQuotationNumber(
    year: number
  ) {
    let max =
      0;

    const prefix =
      `QUO-${year}-`;

    quotations.forEach(
      (
        quotation
      ) => {
        if (
          !quotation
            .quotationNumber
            .startsWith(
              prefix
            )
        ) {
          return;
        }

        const match =
          quotation
            .quotationNumber
            .match(
              /(\d+)$/
            );

        if (
          match
        ) {
          max =
            Math.max(
              max,

              Number(
                match[1]
              )
            );
        }
      }
    );

    return `QUO-${year}-${String(
      max + 1
    ).padStart(
      4,
      "0"
    )}`;
  }

  function nextOrderNumber(
    orders:
      OrderRow[],
    year:
      number
  ) {
    let max =
      0;

    const prefix =
      `ORD-${year}-`;

    orders.forEach(
      (
        order
      ) => {
        if (
          !order
            .orderNumber
            .startsWith(
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
          max =
            Math.max(
              max,

              Number(
                match[1]
              )
            );
        }
      }
    );

    return `ORD-${year}-${String(
      max + 1
    ).padStart(
      4,
      "0"
    )}`;
  }

  /* =======================================================
     QUOTATION → ORDER
  ======================================================= */

  async function convertQuotationToOrder({
    quotationId,
    quotationNumber,
    customer,
    quotationItems,
    quotationNotes,
    quoteTotal,
  }: {
    quotationId:
      string;

    quotationNumber:
      string;

    customer:
      Customer;

    quotationItems:
      QuotationItem[];

    quotationNotes:
      string;

    quoteTotal:
      number;
  }) {
    const orderRows =
      await loadSheet(
        "Orders"
      );

    const orders:
      OrderRow[] =
      orderRows.map(
        normalizeOrder
      );

    const marker =
      `SOURCE_QUOTATION:${quotationId}`;

    const existingOrder =
      orders.find(
        (
          order
        ) =>
          order.quotationId ===
            quotationId ||

          order.quotationNumber ===
            quotationNumber ||

          clean(
            order.notes
          ).includes(
            marker
          )
      );

    if (
      existingOrder
    ) {
      return {
        created:
          false,

        orderNumber:
          existingOrder.orderNumber,

        orderId:
          existingOrder.id,
      };
    }

    const orderDate =
      getToday();

    const orderYear =
      Number(
        orderDate.slice(
          0,
          4
        )
      );

    const orderNumber =
      nextOrderNumber(
        orders,
        orderYear
      );

    const orderId =
      generateId();

    const itemSummary =
      quotationItems
        .map(
          (
            item
          ) =>
            `${
              item.sku
                ? `${item.sku} - `
                : ""
            }${item.service} - ${item.quantity} ${item.unit}`
        )
        .join(
          "; "
        );

    const orderNotes =
      [
        `Automatically converted from quotation ${quotationNumber}.`,

        marker,

        `Quotation Total: ${money(
          quoteTotal
        )}`,

        quotationNotes
          ? `Quotation Notes: ${quotationNotes}`
          : "",
      ]
        .filter(
          Boolean
        )
        .join(
          "\n"
        );

    const orderRecord =
      {
        id:
          orderId,

        orderNumber,

        customerId:
          customer.id,

        customerName:
          customer.name,

        customerCode:
          customer.customerCode,

        businessName:
          customer.businessName,

        customerPhone:
          customer.phone,

        customerEmail:
          customer.email,

        customerGST:
          customer.gstNumber,

        contactPerson:
          customer.contactPerson,

        orderDate,

        deliveryDate:
          "",

        status:
          "Pending",

        items:
          itemSummary,

        /*
         * This preserves the SKU + master-linked price
         * inside the Order.
         */
        orderItems:
          JSON.stringify(
            quotationItems
          ),

        notes:
          orderNotes,

        quotationId,

        quotationNumber,

        source:
          "Quotation",

        quoteTotal,

        totalAmount:
          quoteTotal,

        billingAddress:
          customer.billingAddress,

        billingCity:
          customer.billingCity,

        billingState:
          customer.billingState,

        billingPostalCode:
          customer.billingPostalCode,

        billingCountry:
          customer.billingCountry,

        shippingAddress:
          customer.shippingAddress,

        shippingCity:
          customer.shippingCity,

        shippingState:
          customer.shippingState,

        shippingPostalCode:
          customer.shippingPostalCode,

        shippingCountry:
          customer.shippingCountry,

        createdAt:
          new Date()
            .toISOString(),

        updatedAt:
          new Date()
            .toISOString(),
      };

    await saveExcelRecord({
      action:
        "add",

      sheet:
        "Orders",

      record:
        orderRecord,
    });

    return {
      created:
        true,

      orderNumber,

      orderId,
    };
  }

  /* =======================================================
     SAVE
  ======================================================= */

  async function saveQuotation() {
    const customer =
      customers.find(
        (
          row
        ) =>
          row.id ===
          customerId
      );

    if (
      !customer
    ) {
      alert(
        "Please select a valid Customer."
      );

      return;
    }

    if (
      normalizeText(
        customer.status
      ) ===
      "blocked"
    ) {
      alert(
        "This Customer is Blocked."
      );

      return;
    }

    if (
      !quotationDate
    ) {
      alert(
        "Quotation Date is required."
      );

      return;
    }

    if (
      !validUntil
    ) {
      alert(
        "Valid Until date is required."
      );

      return;
    }

    if (
      validUntil <
      quotationDate
    ) {
      alert(
        "Valid Until cannot be before Quotation Date."
      );

      return;
    }

    if (
      items.length ===
      0
    ) {
      alert(
        "At least one Item / Service is required."
      );

      return;
    }

    if (
      items.some(
        (
          item
        ) =>
          !item
            .priceMasterId
      )
    ) {
      alert(
        "Please select every quotation item from Price Master."
      );

      return;
    }

    if (
      items.some(
        (
          item
        ) =>
          !item
            .service
            .trim()
      )
    ) {
      alert(
        "Item / Service is required for every line."
      );

      return;
    }

    if (
      items.some(
        (
          item
        ) =>
          Number(
            item.quantity
          ) <= 0
      )
    ) {
      alert(
        "Quantity must be greater than zero."
      );

      return;
    }

    if (
      items.some(
        (
          item
        ) =>
          Number(
            item.rate
          ) <
          0
      )
    ) {
      alert(
        "Rate cannot be negative."
      );

      return;
    }

    const belowMinimum =
      items.find(
        (
          item
        ) =>
          Number(
            item.minimumSellingPrice
          ) >
            0 &&
          Number(
            item.rate
          ) <
            Number(
              item.minimumSellingPrice
            )
      );

    if (
      belowMinimum
    ) {
      alert(
        `${belowMinimum.service} is below the minimum approved selling price of ${money(
          belowMinimum.minimumSellingPrice
        )}.`
      );

      return;
    }

    if (
      Number(
        discount
      ) >
      subtotal
    ) {
      alert(
        "Discount cannot exceed Subtotal."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      /*
       * Re-read customers before save so Order conversion
       * uses current customer data.
       */
      const latestRows =
        await loadSheet(
          "Customers"
        );

      const latestCustomers =
        latestRows
          .map(
            normalizeCustomer
          )
          .filter(
            (
              row:
                Customer
            ) =>
              Boolean(
                row.id &&
                  row.name
              )
          );

      const latestCustomer =
        latestCustomers.find(
          (
            row
          ) =>
            row.id ===
            customerId
        );

      if (
        !latestCustomer
      ) {
        throw new Error(
          "Selected Customer no longer exists."
        );
      }

      const now =
        new Date()
          .toISOString();

      const quotationYear =
        Number(
          quotationDate.slice(
            0,
            4
          )
        );

      if (
        !quotationYear
      ) {
        throw new Error(
          "Invalid Quotation Date."
        );
      }

      const quotationNumber =
        editing
          ? editing.quotationNumber
          : nextQuotationNumber(
              quotationYear
            );

      const quotationId =
        editing
          ? editing.id
          : generateId();

      /*
       * IMPORTANT:
       * Price Master values are copied into the saved
       * quotation item.
       *
       * Therefore changing Price Master tomorrow does
       * NOT change an old quotation.
       */
      const cleanItems =
        items.map(
          (
            item
          ) => ({
            id:
              item.id,

            priceMasterId:
              item.priceMasterId,

            sku:
              item.sku,

            service:
              item.service.trim(),

            description:
              item.description.trim(),

            quantity:
              Number(
                item.quantity
              ),

            unit:
              item.unit,

            rate:
              Number(
                item.rate
              ),

            gstPercent:
              Number(
                item.gstPercent
              ),

            minimumSellingPrice:
              Number(
                item.minimumSellingPrice
              ),

            placement:
              item.placement,

            size:
              item.size,

            threadType:
              item.threadType,

            notes:
              item.notes.trim(),
          })
        );

      const record =
        {
          quotationNumber,

          customer:
            latestCustomer.name,

          customerId:
            latestCustomer.id,

          date:
            quotationDate,

          validUntil,

          items:
            JSON.stringify(
              cleanItems
            ),

          discount:
            Number(
              discount
            ),

          /*
           * Retained for compatibility with your current
           * quotation PDF/backend.
           *
           * If all items use one GST rate it stores it here.
           * Mixed GST remains stored at line level.
           */
          gstPercent:
            commonGstPercent,

          notes:
            notes.trim(),

          status,

          updatedAt:
            now,
        };

      await saveExcelRecord({
        action:
          editing
            ? "update"
            : "add",

        sheet:
          "Quotations",

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
                  quotationId,

                ...record,

                createdAt:
                  now,
              },
      });

      let conversion:
        | {
            created:
              boolean;

            orderNumber:
              string;

            orderId:
              string;
          }
        | null =
        null;

      if (
        status ===
        "Converted to Order"
      ) {
        conversion =
          await convertQuotationToOrder({
            quotationId,

            quotationNumber,

            customer:
              latestCustomer,

            quotationItems:
              cleanItems,

            quotationNotes:
              notes.trim(),

            quoteTotal:
              totalAmount,
          });
      }

      setShowForm(
        false
      );

      resetForm();

      await loadData(
        true
      );

      if (
        conversion
      ) {
        if (
          conversion.created
        ) {
          alert(
            `${quotationNumber} saved successfully.\n\nOrder ${conversion.orderNumber} was automatically created and is now available on the Orders page.`
          );
        } else {
          alert(
            `${quotationNumber} saved successfully.\n\nIt was already linked to Order ${conversion.orderNumber}, so no duplicate Order was created.`
          );
        }
      } else {
        alert(
          `${quotationNumber} saved successfully.`
        );
      }
    } catch (
      error
    ) {
      console.error(
        "Quotation save / conversion error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to save Quotation."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     PDF
  ======================================================= */

  async function generatePdf(
    quotation:
      Quotation
  ) {
    try {
      setGeneratingPdfId(
        quotation.id
      );

      const customer =
        customers.find(
          (
            row
          ) =>
            row.id ===
            quotation.customerId
        );

      if (
        !customer
      ) {
        throw new Error(
          "Customer linked to this quotation was not found."
        );
      }

      const response =
        await fetch(
          "/api/quotations/pdf",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                quotation,
                customer,
              }),
          }
        );

      if (
        !response.ok
      ) {
        let message =
          "Unable to generate quotation PDF.";

        try {
          const data =
            await response.json();

          message =
            data?.message ||
            message;
        } catch {
          //
        }

        throw new Error(
          message
        );
      }

      const blob =
        await response.blob();

      const filename =
        response.headers.get(
          "X-Quotation-Filename"
        ) ||
        `${quotation.quotationNumber}.pdf`;

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        url;

      link.download =
        filename;

      document.body
        .appendChild(
          link
        );

      link.click();

      link.remove();

      window.setTimeout(
        () => {
          URL.revokeObjectURL(
            url
          );
        },
        0
      );
    } catch (
      error
    ) {
      console.error(
        "PDF generation error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to generate PDF."
      );
    } finally {
      setGeneratingPdfId(
        null
      );
    }
  }

  async function generateEditingPdf() {
    if (
      !editing
    ) {
      alert(
        "Save the quotation first."
      );

      return;
    }

    const quotation:
      Quotation = {
      ...editing,

      customerId,

      customer:
        selectedCustomer?.name ||
        editing.customer,

      date:
        quotationDate,

      validUntil,

      items,

      discount,

      gstPercent:
        commonGstPercent,

      notes,

      status,

      updatedAt:
        editing.updatedAt,
    };

    await generatePdf(
      quotation
    );
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function deleteQuotation(
    quotation:
      Quotation
  ) {
    if (
      quotation.status ===
      "Converted to Order"
    ) {
      alert(
        "A quotation already converted to an Order should not be deleted."
      );

      return;
    }

    if (
      !confirm(
        `Delete ${quotation.quotationNumber}?`
      )
    ) {
      return;
    }

    try {
      await saveExcelRecord({
        action:
          "delete",

        sheet:
          "Quotations",

        id:
          quotation.id,
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
          : "Unable to delete quotation."
      );
    }
  }

  /* =======================================================
     LIST
  ======================================================= */

  function getCustomer(
    quotation:
      Quotation
  ) {
    return customers.find(
      (
        customer
      ) =>
        customer.id ===
        quotation.customerId
    );
  }

  function quotationTotal(
    quotation:
      Quotation
  ) {
    const quoteSubtotal =
      quotation.items.reduce(
        (
          sum,
          item
        ) =>
          sum +
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

    const taxable =
      Math.max(
        quoteSubtotal -
          Number(
            quotation.discount ||
              0
          ),
        0
      );

    const rawQuoteTax =
      quotation.items.reduce(
        (
          sum,
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
            sum +
            line *
              Number(
                item.gstPercent ||
                  quotation.gstPercent ||
                  0
              ) /
              100
          );
        },
        0
      );

    const quoteDiscountRatio =
      quoteSubtotal >
      0
        ? Math.min(
            Math.max(
              Number(
                quotation.discount ||
                  0
              ) /
                quoteSubtotal,
              0
            ),
            1
          )
        : 0;

    return (
      taxable +
      rawQuoteTax *
        (
          1 -
          quoteDiscountRatio
        )
    );
  }

  const filtered =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return quotations.filter(
          (
            quotation
          ) => {
            const customer =
              customers.find(
                (
                  row
                ) =>
                  row.id ===
                  quotation.customerId
              );

            const statusMatches =
              statusFilter ===
                "All" ||
              quotation.status ===
                statusFilter;

            const searchMatches =
              !query ||
              [
                quotation
                  .quotationNumber,

                quotation
                  .customer,

                customer?.name,

                customer
                  ?.businessName,

                customer
                  ?.customerCode,

                quotation.status,

                quotation.items
                  .map(
                    (
                      item
                    ) =>
                      `${item.sku} ${item.service} ${item.description}`
                  )
                  .join(
                    " "
                  ),
              ]
                .filter(
                  Boolean
                )
                .join(
                  " "
                )
                .toLowerCase()
                .includes(
                  query
                );

            return (
              statusMatches &&
              searchMatches
            );
          }
        );
      },
      [
        quotations,
        customers,
        search,
        statusFilter,
      ]
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="h-full min-h-0 overflow-y-auto">

      <div className="mx-auto w-full max-w-7xl space-y-6 pb-24">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>

            <div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
              Sales
            </div>

            <h1 className="text-3xl font-black">
              Quotations
            </h1>

            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
              Create quotations using approved Price
              Master rates, generate customer PDFs and
              automatically convert accepted quotations
              into Orders.
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
              className="rounded-xl border bg-white px-4 py-3 font-bold disabled:opacity-50"
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
              className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
            >
              + New Quotation
            </button>

          </div>

        </div>

        {/* WORKFLOW */}

        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-blue-50 p-5">

          <div className="font-black text-slate-900">
            💲 Price Master → Quotation → Order
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Select each quotation line from Price Master.
            SKU, item/service, unit, standard selling
            price, GST and minimum approved price are
            fetched automatically.
          </p>

        </div>

        {/* SEARCH */}

        <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1fr_230px]">

          <input
            value={
              search
            }
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search quotation, customer, SKU or service..."
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

            {QUOTATION_STATUSES.map(
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

        </div>

        {/* TABLE */}

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          {loading ? (

            <div className="p-10 text-center text-slate-500">
              Loading Quotations...
            </div>

          ) : filtered.length ===
            0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl">
                📝
              </div>

              <h2 className="mt-4 text-xl font-bold">
                No Quotations found
              </h2>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="min-w-[1250px] w-full text-left text-sm">

                <thead>

                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                    <th className="px-4 py-4">
                      Quotation
                    </th>

                    <th className="px-4 py-4">
                      Customer
                    </th>

                    <th className="px-4 py-4">
                      Date
                    </th>

                    <th className="px-4 py-4">
                      Valid Until
                    </th>

                    <th className="px-4 py-4">
                      Items
                    </th>

                    <th className="px-4 py-4">
                      Total
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
                      quotation
                    ) => {

                      const customer =
                        getCustomer(
                          quotation
                        );

                      const generating =
                        generatingPdfId ===
                        quotation.id;

                      return (

                        <tr
                          key={
                            quotation.id
                          }
                          className="border-b last:border-0 hover:bg-slate-50"
                        >

                          <td className="px-4 py-4 font-black text-blue-700">
                            {
                              quotation.quotationNumber
                            }
                          </td>

                          <td className="px-4 py-4">

                            <div className="font-bold">
                              {
                                customer?.name ||
                                quotation.customer ||
                                "—"
                              }
                            </div>

                            {customer?.businessName && (

                              <div className="text-xs text-slate-500">
                                {
                                  customer.businessName
                                }
                              </div>

                            )}

                          </td>

                          <td className="px-4 py-4">
                            {
                              quotation.date ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-4">
                            {
                              quotation.validUntil ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-4">

                            <div className="font-semibold">

                              {quotation.items[0]?.sku && (
                                <>
                                  <span className="text-emerald-700">
                                    {quotation.items[0].sku}
                                  </span>
                                  {" — "}
                                </>
                              )}

                              {
                                quotation.items[0]?.service ||
                                "—"
                              }

                            </div>

                            {quotation.items.length >
                              1 && (

                              <div className="text-xs text-slate-500">
                                +{" "}
                                {
                                  quotation.items.length -
                                  1
                                }{" "}
                                more
                              </div>

                            )}

                          </td>

                          <td className="px-4 py-4 font-black">
                            {money(
                              quotationTotal(
                                quotation
                              )
                            )}
                          </td>

                          <td className="px-4 py-4">

                            <StatusBadge
                              status={
                                quotation.status
                              }
                            />

                          </td>

                          <td className="px-4 py-4">

                            <div className="flex flex-wrap gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  void generatePdf(
                                    quotation
                                  )
                                }
                                disabled={
                                  generating
                                }
                                className="rounded-xl bg-green-600 px-4 py-2.5 text-xs font-black text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                {generating
                                  ? "Generating..."
                                  : "📄 Generate PDF"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    quotation
                                  )
                                }
                                className="rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void deleteQuotation(
                                    quotation
                                  )
                                }
                                className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600"
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
          QUOTATION FORM
      ================================================= */}

      {showForm && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">

          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">

            <div className="my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex shrink-0 items-start justify-between border-b px-6 py-5">

                <div>

                  <h2 className="text-2xl font-black">
                    {editing
                      ? `Edit ${editing.quotationNumber}`
                      : "Create Quotation"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Select items from Price Master. Approved
                    selling price, unit and GST are fetched
                    automatically.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  className="text-3xl text-slate-400"
                >
                  ×
                </button>

              </div>

              {/* BODY */}

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">

                <div className="space-y-7">

                  {/* CUSTOMER */}

                  <Section
                    title="Customer"
                    description="Customer information is fetched directly from the Customers master."
                  >

                    <Field
                      label="Customer *"
                      caption="Select the customer receiving this quotation."
                    >

                      <select
                        value={
                          customerId
                        }
                        onChange={(e) =>
                          setCustomerId(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      >

                        <option value="">
                          Select Customer
                        </option>

                        {selectableCustomers.map(
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
                              {customer.customerCode
                                ? `${customer.customerCode} — `
                                : ""}

                              {
                                customer.name
                              }

                              {customer.businessName
                                ? ` — ${customer.businessName}`
                                : ""}
                            </option>

                          )
                        )}

                      </select>

                    </Field>

                    {selectedCustomer && (

                      <div className="mt-5 grid gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:grid-cols-2 lg:grid-cols-4">

                        <Info
                          label="Customer"
                          value={
                            selectedCustomer.name
                          }
                        />

                        <Info
                          label="Business"
                          value={
                            selectedCustomer.businessName
                          }
                        />

                        <Info
                          label="Price Category"
                          value={
                            selectedCustomer.priceCategory
                          }
                        />

                        <Info
                          label="Payment Terms"
                          value={
                            selectedCustomer.paymentTermsDays
                              ? `${selectedCustomer.paymentTermsDays} days`
                              : "—"
                          }
                        />

                      </div>

                    )}

                  </Section>

                  {/* QUOTATION DETAILS */}

                  <Section
                    title="Quotation Details"
                    description="Quotation date, validity and commercial status."
                  >

                    <div className="grid gap-5 md:grid-cols-3">

                      <Field
                        label="Quotation Date *"
                        caption="Date on which this quotation is issued."
                      >

                        <input
                          type="date"
                          value={
                            quotationDate
                          }
                          onChange={(e) =>
                            setQuotationDate(
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Valid Until *"
                        caption="Date until which the quotation remains valid."
                      >

                        <input
                          type="date"
                          value={
                            validUntil
                          }
                          onChange={(e) =>
                            setValidUntil(
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Status"
                        caption="Converted to Order automatically creates the linked Order."
                      >

                        <select
                          value={
                            status
                          }
                          onChange={(e) =>
                            setStatus(
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >

                          {QUOTATION_STATUSES.map(
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

                    </div>

                  </Section>

                  {/* PRICE MASTER ITEMS */}

                  <Section
                    title="Items & Services"
                    description="Every quotation line is linked to Price Master. Historical prices remain saved with the quotation."
                  >

                    <div className="mb-4 flex items-center justify-between">

                      <div className="text-sm font-semibold text-slate-600">
                        {items.length} item
                        {items.length ===
                        1
                          ? ""
                          : "s"}
                      </div>

                      <button
                        type="button"
                        onClick={
                          addItem
                        }
                        className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700"
                      >
                        + Add Item
                      </button>

                    </div>

                    <div className="space-y-5">

                      {items.map(
                        (
                          item,
                          index
                        ) => {

                          const selectedPrice =
                            priceMaster.find(
                              (
                                row
                              ) =>
                                row.id ===
                                item.priceMasterId
                            );

                          const belowMinimum =
                            item.minimumSellingPrice >
                              0 &&
                            item.rate <
                              item.minimumSellingPrice;

                          return (

                            <div
                              key={
                                item.id
                              }
                              className="rounded-2xl border bg-white p-5"
                            >

                              <div className="mb-5 flex items-center justify-between">

                                <div className="font-black">
                                  Item{" "}
                                  {index + 1}
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
                                  className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-40"
                                >
                                  Remove
                                </button>

                              </div>

                              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

                                <div className="lg:col-span-2">

                                  <Field
                                    label="Price Master Item *"
                                    caption="Select the approved product or service."
                                  >

                                    <select
                                      value={
                                        item.priceMasterId
                                      }
                                      onChange={(e) =>
                                        selectPriceItem(
                                          item.id,

                                          e.target.value
                                        )
                                      }
                                      className="w-full rounded-xl border bg-white px-4 py-3"
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
                                              price.sellingPrice
                                            )}

                                            {" / "}

                                            {price.unit}
                                          </option>

                                        )
                                      )}

                                    </select>

                                  </Field>

                                </div>

                                <Field
                                  label="SKU"
                                  caption="Standard code from Price Master."
                                >

                                  <input
                                    value={
                                      item.sku
                                    }
                                    readOnly
                                    className="w-full rounded-xl border bg-slate-50 px-4 py-3 font-black text-emerald-700"
                                  />

                                </Field>

                                <Field
                                  label="Pricing Unit"
                                  caption="Fetched from Price Master."
                                >

                                  <input
                                    value={
                                      item.unit
                                    }
                                    readOnly
                                    className="w-full rounded-xl border bg-slate-50 px-4 py-3"
                                  />

                                </Field>

                                <div className="lg:col-span-4">

                                  <Field
                                    label="Description / Specification"
                                    caption="Master description is loaded automatically but can be expanded for this quotation."
                                  >

                                    <textarea
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
                                      className="min-h-24 w-full rounded-xl border px-4 py-3"
                                    />

                                  </Field>

                                </div>

                                <Field
                                  label="Quantity *"
                                  caption="Number of units being quoted."
                                >

                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={
                                      item.quantity
                                    }
                                    onChange={(e) =>
                                      updateItem(
                                        item.id,

                                        "quantity",

                                        e.target.value
                                      )
                                    }
                                    className="w-full rounded-xl border px-4 py-3"
                                  />

                                </Field>

                                <Field
                                  label="Selling Rate ₹ *"
                                  caption={
                                    item.minimumSellingPrice >
                                    0
                                      ? `Minimum approved: ${money(
                                          item.minimumSellingPrice
                                        )}`
                                      : "Selling price fetched from Price Master."
                                  }
                                >

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      item.rate
                                    }
                                    onChange={(e) =>
                                      updateItem(
                                        item.id,

                                        "rate",

                                        e.target.value
                                      )
                                    }
                                    className={`w-full rounded-xl border px-4 py-3 ${
                                      belowMinimum
                                        ? "border-red-400 bg-red-50 text-red-700"
                                        : ""
                                    }`}
                                  />

                                </Field>

                                <Field
                                  label="GST %"
                                  caption="Fetched from Price Master."
                                >

                                  <input
                                    value={
                                      item.gstPercent
                                    }
                                    readOnly
                                    className="w-full rounded-xl border bg-slate-50 px-4 py-3"
                                  />

                                </Field>

                                <Field
                                  label="Line Total"
                                  caption="Quantity × selling rate."
                                >

                                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-lg font-black text-blue-700">
                                    {money(
                                      Number(
                                        item.quantity
                                      ) *
                                        Number(
                                          item.rate
                                        )
                                    )}
                                  </div>

                                </Field>

                                <Field
                                  label="Placement"
                                  caption="Embroidery location, if applicable."
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
                                    className="w-full rounded-xl border bg-white px-4 py-3"
                                  >

                                    {EMBROIDERY_PLACEMENTS.map(
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

                                <Field
                                  label="Embroidery Size"
                                  caption="Approximate finished embroidery size."
                                >

                                  <select
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
                                    className="w-full rounded-xl border bg-white px-4 py-3"
                                  >

                                    {EMBROIDERY_SIZES.map(
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

                                <Field
                                  label="Thread Type"
                                  caption="Thread requirement for embroidery."
                                >

                                  <select
                                    value={
                                      item.threadType
                                    }
                                    onChange={(e) =>
                                      updateItem(
                                        item.id,

                                        "threadType",

                                        e.target.value
                                      )
                                    }
                                    className="w-full rounded-xl border bg-white px-4 py-3"
                                  >

                                    {THREAD_TYPES.map(
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

                                <Field
                                  label="Price Category"
                                  caption="Commercial category from Price Master."
                                >

                                  <input
                                    value={
                                      selectedPrice?.customerPriceCategory ||
                                      "—"
                                    }
                                    readOnly
                                    className="w-full rounded-xl border bg-slate-50 px-4 py-3"
                                  />

                                </Field>

                                <div className="lg:col-span-4">

                                  <Field
                                    label="Item Notes"
                                    caption="Line-specific commercial or technical notes."
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
                                      className="w-full rounded-xl border px-4 py-3"
                                    />

                                  </Field>

                                </div>

                              </div>

                              {belowMinimum && (

                                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
                                  ⚠ Selling rate is below the
                                  minimum approved price of{" "}
                                  {money(
                                    item.minimumSellingPrice
                                  )}.
                                </div>

                              )}

                            </div>

                          );
                        }
                      )}

                    </div>

                  </Section>

                  {/* COMMERCIAL */}

                  <Section
                    title="Commercial Summary"
                    description="Discount is applied before GST. GST is calculated using the rate stored against each Price Master item."
                  >

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">

                      <SummaryBox
                        label="Subtotal"
                        value={
                          money(
                            subtotal
                          )
                        }
                      />

                      <Field
                        label="Discount ₹"
                        caption="Optional discount applied before GST."
                      >

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            discount
                          }
                          onChange={(e) =>
                            setDiscount(
                              Math.max(
                                0,

                                Number(
                                  e.target.value
                                ) ||
                                  0
                              )
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <SummaryBox
                        label="Taxable Value"
                        value={
                          money(
                            taxableAmount
                          )
                        }
                      />

                      <SummaryBox
                        label="GST"
                        value={
                          money(
                            gstAmount
                          )
                        }
                      />

                      <SummaryBox
                        label="Quotation Total"
                        value={
                          money(
                            totalAmount
                          )
                        }
                        emphasis
                      />

                    </div>

                  </Section>

                  {/* NOTES */}

                  <Section
                    title="Terms & Notes"
                    description="These notes are carried into the linked Order and printed on the quotation PDF."
                  >

                    <Field
                      label="Quotation Notes / Terms"
                      caption="Include payment, sample approval, artwork approval, delivery assumptions, exclusions or other commercial terms."
                    >

                      <textarea
                        value={
                          notes
                        }
                        onChange={(e) =>
                          setNotes(
                            e.target.value
                          )
                        }
                        className="min-h-32 w-full rounded-xl border px-4 py-3"
                      />

                    </Field>

                  </Section>

                </div>

              </div>

              {/* FOOTER */}

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t bg-white px-6 py-4 sm:flex-row sm:justify-end">

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

                {editing && (

                  <button
                    type="button"
                    onClick={() =>
                      void generateEditingPdf()
                    }
                    disabled={
                      generatingPdfId ===
                      editing.id
                    }
                    className="rounded-xl bg-green-600 px-5 py-3 font-black text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {generatingPdfId ===
                    editing.id
                      ? "Generating PDF..."
                      : "📄 Generate PDF"}
                  </button>

                )}

                <button
                  type="button"
                  onClick={() =>
                    void saveQuotation()
                  }
                  disabled={
                    saving
                  }
                  className={`rounded-xl px-6 py-3 font-bold text-white disabled:opacity-50 ${
                    status ===
                    "Converted to Order"
                      ? "bg-green-700 hover:bg-green-800"
                      : "bg-blue-700 hover:bg-blue-800"
                  }`}
                >
                  {saving
                    ? status ===
                      "Converted to Order"
                      ? "Saving & Creating Order..."
                      : "Saving..."
                    : status ===
                      "Converted to Order"
                    ? editing
                      ? "📦 Update & Create Order"
                      : "📦 Save & Create Order"
                    : editing
                    ? "Update Quotation"
                    : "Create Quotation"}
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
   HELPERS
========================================================= */

function createEmptyItemWithId(
  id: string
):
  QuotationItem {
  return {
    ...createEmptyItem(),

    id,
  };
}

/* =========================================================
   COMPONENTS
========================================================= */

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
        {label}
      </label>

      {children}

      <p className="mt-1.5 text-xs leading-5 text-slate-400">
        {caption}
      </p>

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
    <div className="rounded-2xl border bg-slate-50/50 p-5">

      <div className="mb-5">

        <h3 className="font-black">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>

      </div>

      {children}

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
    <div>

      <div className="mb-2 text-sm font-bold text-slate-800">
        {label}
      </div>

      <div
        className={`rounded-xl border px-4 py-3 text-lg font-black ${
          emphasis
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : "bg-white text-slate-900"
        }`}
      >
        {value}
      </div>

      <p className="mt-1.5 text-xs text-slate-400">
        Calculated automatically.
      </p>

    </div>
  );
}

function StatusBadge({
  status,
}: {
  status:
    string;
}) {
  let style =
    "bg-slate-100 text-slate-700";

  if (
    status ===
    "Accepted"
  ) {
    style =
      "bg-green-100 text-green-700";
  } else if (
    status ===
    "Converted to Order"
  ) {
    style =
      "bg-blue-100 text-blue-700";
  } else if (
    status ===
    "Sent"
  ) {
    style =
      "bg-purple-100 text-purple-700";
  } else if (
    status ===
      "Rejected" ||
    status ===
      "Cancelled"
  ) {
    style =
      "bg-red-100 text-red-700";
  } else if (
    status ===
    "Expired"
  ) {
    style =
      "bg-orange-100 text-orange-700";
  } else if (
    status ===
    "Draft"
  ) {
    style =
      "bg-yellow-100 text-yellow-700";
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}
    >
      {status}
    </span>
  );
}
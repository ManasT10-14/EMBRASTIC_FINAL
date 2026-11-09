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

type InventoryItem = {
id: string;

  name: string;

  inventoryType: string;
  category: string;

  purchasable: boolean;
  trackStock: boolean;
  sellable: boolean;
  customerVisible: boolean;
  active: boolean;

  sku: string;

  brand: string;

  color: string;
  colorCode: string;

  size: string;
  variant: string;

  quantity: number;

  unit: string;

  minimumStock: number;

  /*
   * price = weighted average inventory cost
   *
   * We retain the existing column name "price"
   * so no data migration is required.
   */
  price: number;

  supplier: string;

  notes: string;

  createdAt: string;
  updatedAt: string;

  [key: string]: any;
};

type InventoryTransaction = {
  id: string;

  inventoryId: string;

  sku: string;
  itemName: string;

  type:
    | "IN"
    | "OUT";

  quantity: number;

  previousQuantity: number;
  newQuantity: number;

  supplier: string;

  purchaseNumber: string;

  unitCost: number;
  purchaseAmount: number;

  referenceType: string;
  referenceId: string;

  notes: string;

  createdAt: string;

  [key: string]: any;
};

type InventoryForm = {
  name: string;

  inventoryType: string;
  category: string;

  purchasable: boolean;
  trackStock: boolean;
  sellable: boolean;
  customerVisible: boolean;
  active: boolean;

  sku: string;


  brand: string;

  color: string;
  colorCode: string;

  size: string;
  variant: string;

  unit: string;

  minimumStock: number;

  price: number;

  supplier: string;

  notes: string;
};

type StockForm = {
  type:
    | "IN"
    | "OUT";

  quantity: number;

  supplier: string;

  purchaseNumber: string;

  unitCost: number;

  purchaseDate: string;

  paymentMethod: string;

  referenceType: string;

  referenceId: string;

  notes: string;
};



/* =========================================================
   OPTIONS
========================================================= */

const CATEGORIES = [
  "Embroidery Thread",
  "Bobbin",
  "Stabilizer",
  "Needle",
  "Garment / Blank",
  "Backing Material",
  "Topping",
  "Machine Consumable",
  "Packaging",
  "Accessory",
  "Other",
];
const INVENTORY_TYPES = [
  "Production Material",
  "Resale Item",
  "Packaging",
  "Consumable",
  "Operating Supply",
  "Asset",
];

const UNITS = [
  "pcs",
  "cones",
  "rolls",
  "meters",
  "yards",
  "kg",
  "grams",
  "boxes",
  "packs",
  "sets",
  "sheets",
];

const REFERENCE_TYPES = [
  "Purchase",
  "Order",
  "Production",
  "Return",
  "Rework",
  "Wastage",
  "Damage",
  "Adjustment",
  "Sample",
  "Other",
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

const GARMENT_SIZES = [
  "",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "Free Size",
  "Custom",
];

/* =========================================================
   CATEGORY SKU PREFIX
========================================================= */

const CATEGORY_PREFIX:
  Record<
    string,
    string
  > = {
  "Embroidery Thread":
    "THR",

  Bobbin:
    "BOB",

  Stabilizer:
    "STB",

  Needle:
    "NDL",

  "Garment / Blank":
    "GAR",

  "Backing Material":
    "BCK",

  Topping:
    "TOP",

  "Machine Consumable":
    "MAC",

  Packaging:
    "PKG",

  Accessory:
    "ACC",

  Other:
    "ITM",
};

/* =========================================================
   RECOMMENDED INVENTORY ITEMS
========================================================= */

const RECOMMENDED_ITEMS = [
  {
    name:
      "Polyester Embroidery Thread",
    category:
      "Embroidery Thread",
    unit:
      "cones",
    minimumStock:
      5,
  },

  {
    name:
      "Rayon Embroidery Thread",
    category:
      "Embroidery Thread",
    unit:
      "cones",
    minimumStock:
      5,
  },

  {
    name:
      "Metallic Embroidery Thread",
    category:
      "Embroidery Thread",
    unit:
      "cones",
    minimumStock:
      2,
  },

  {
    name:
      "Pre-Wound Bobbin",
    category:
      "Bobbin",
    unit:
      "boxes",
    minimumStock:
      2,
  },

  {
    name:
      "Bobbin Thread",
    category:
      "Bobbin",
    unit:
      "cones",
    minimumStock:
      3,
  },

  {
    name:
      "Cut-Away Stabilizer",
    category:
      "Stabilizer",
    unit:
      "rolls",
    minimumStock:
      2,
  },

  {
    name:
      "Tear-Away Stabilizer",
    category:
      "Stabilizer",
    unit:
      "rolls",
    minimumStock:
      2,
  },

  {
    name:
      "Water-Soluble Stabilizer",
    category:
      "Stabilizer",
    unit:
      "rolls",
    minimumStock:
      1,
  },

  {
    name:
      "Water-Soluble Topping",
    category:
      "Topping",
    unit:
      "rolls",
    minimumStock:
      1,
  },

  {
    name:
      "Embroidery Needle 75/11",
    category:
      "Needle",
    unit:
      "packs",
    minimumStock:
      3,
  },

  {
    name:
      "Embroidery Needle 80/12",
    category:
      "Needle",
    unit:
      "packs",
    minimumStock:
      3,
  },

  {
    name:
      "Embroidery Needle 90/14",
    category:
      "Needle",
    unit:
      "packs",
    minimumStock:
      3,
  },

  {
    name:
      "Plain Polo T-Shirt",
    category:
      "Garment / Blank",
    unit:
      "pcs",
    minimumStock:
      10,
  },

  {
    name:
      "Plain Round Neck T-Shirt",
    category:
      "Garment / Blank",
    unit:
      "pcs",
    minimumStock:
      10,
  },

  {
    name:
      "Plain Sweatshirt",
    category:
      "Garment / Blank",
    unit:
      "pcs",
    minimumStock:
      5,
  },

  {
    name:
      "Plain Hoodie",
    category:
      "Garment / Blank",
    unit:
      "pcs",
    minimumStock:
      5,
  },

  {
    name:
      "Plain Cap",
    category:
      "Garment / Blank",
    unit:
      "pcs",
    minimumStock:
      10,
  },

  {
    name:
      "Machine Oil",
    category:
      "Machine Consumable",
    unit:
      "pcs",
    minimumStock:
      2,
  },

  {
    name:
      "Temporary Adhesive Spray",
    category:
      "Machine Consumable",
    unit:
      "pcs",
    minimumStock:
      2,
  },

  {
    name:
      "Packing Polybag",
    category:
      "Packaging",
    unit:
      "packs",
    minimumStock:
      5,
  },

  {
    name:
      "Carton Box",
    category:
      "Packaging",
    unit:
      "pcs",
    minimumStock:
      10,
  },
];

/* =========================================================
   EMPTY FORMS
========================================================= */

const EMPTY_FORM:
  InventoryForm = {
  name: "",

  inventoryType:
    "Production Material",

  category: "",

  purchasable: true,
  trackStock: true,
  sellable: false,
  customerVisible: false,
  active: true,
  sku: "",

  brand: "",

  color: "",
  colorCode: "",

  size: "",

  variant: "",

  unit: "pcs",

  minimumStock: 5,

  price: 0,

  supplier: "",

  notes: "",
};

const EMPTY_STOCK_FORM:
  StockForm = {
  type: "IN",

  quantity: 0,

  supplier: "",

  purchaseNumber: "",

  unitCost: 0,

  purchaseDate: "",

  paymentMethod:
    "Bank Transfer",

  referenceType:
    "Purchase",

  referenceId: "",

  notes: "",
};

/* =========================================================
   GENERAL HELPERS
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

function today() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

function nowIso() {
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

  return `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 10)}`;
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
   SKU HELPERS
========================================================= */

function skuToken(
  value: unknown,
  maxLength = 8
) {
  return clean(value)
    .toUpperCase()
    .replace(
      /[^A-Z0-9]/g,
      ""
    )
    .slice(
      0,
      maxLength
    );
}

function itemToken(
  name: string
) {
  const normalized =
    normalizeText(
      name
    );

  const known:
    Array<
      [
        string,
        string
      ]
    > = [
    [
      "polyester embroidery thread",
      "POL",
    ],

    [
      "rayon embroidery thread",
      "RAY",
    ],

    [
      "metallic embroidery thread",
      "MET",
    ],

    [
      "pre wound bobbin",
      "PRE",
    ],

    [
      "bobbin thread",
      "THR",
    ],

    [
      "cut away stabilizer",
      "CUT",
    ],

    [
      "tear away stabilizer",
      "TEAR",
    ],

    [
      "water soluble stabilizer",
      "WSS",
    ],

    [
      "water soluble topping",
      "WST",
    ],

    [
      "plain polo t shirt",
      "POLO",
    ],

    [
      "plain round neck t shirt",
      "RND",
    ],

    [
      "plain sweatshirt",
      "SWT",
    ],

    [
      "plain hoodie",
      "HDY",
    ],

    [
      "plain cap",
      "CAP",
    ],

    [
      "machine oil",
      "OIL",
    ],

    [
      "temporary adhesive spray",
      "SPR",
    ],

    [
      "packing polybag",
      "POLY",
    ],

    [
      "carton box",
      "BOX",
    ],
  ];

  const found =
    known.find(
      (
        [key]
      ) =>
        normalized ===
        key
    );

  if (
    found
  ) {
    return found[1];
  }

  /*
   * Needle size should form part of
   * the permanent SKU.
   */
  if (
    normalized.includes(
      "needle"
    )
  ) {
    const size =
      name.match(
        /\d+\s*\/\s*\d+/
      );

    if (
      size
    ) {
      return skuToken(
        size[0],
        6
      );
    }
  }

  const ignored =
    new Set([
      "plain",
      "embroidery",
      "thread",
      "material",
      "machine",
      "blank",
      "the",
      "and",
    ]);

  const words =
    clean(name)
      .split(/\s+/)
      .map(
        (
          word
        ) =>
          skuToken(
            word,
            4
          )
      )
      .filter(
        (
          word
        ) =>
          word &&
          !ignored.has(
            word.toLowerCase()
          )
      );

  if (
    words.length ===
    0
  ) {
    return "ITEM";
  }

  if (
    words.length ===
    1
  ) {
    return words[0].slice(
      0,
      6
    );
  }

  return words
    .slice(
      0,
      2
    )
    .map(
      (
        word
      ) =>
        word.slice(
          0,
          4
        )
    )
    .join("");
}

/* =========================================================
   STANDARD PERMANENT SKU
========================================================= */

function generateStandardSku(
  form:
    InventoryForm
) {
  if (
    !form.category ||
    !form.name
  ) {
    return "";
  }

  const category =
    CATEGORY_PREFIX[
      form.category
    ] ||
    "ITM";

  const parts = [
    category,

    itemToken(
      form.name
    ),
  ];

  /*
   * Brand forms part of stock identity.
   */
  if (
    form.brand
  ) {
    parts.push(
      skuToken(
        form.brand,
        5
      )
    );
  }

  /*
   * Manufacturer colour code has priority
   * because thread colours can vary
   * between manufacturers.
   */
  if (
    form.colorCode
  ) {
    parts.push(
      skuToken(
        form.colorCode,
        8
      )
    );
  } else if (
    form.color
  ) {
    parts.push(
      skuToken(
        form.color,
        5
      )
    );
  }

  if (
    form.size
  ) {
    parts.push(
      skuToken(
        form.size,
        5
      )
    );
  }

  if (
    form.variant
  ) {
    parts.push(
      skuToken(
        form.variant,
        8
      )
    );
  }

  return parts
    .filter(Boolean)
    .join("-");
}

/* =========================================================
   INVENTORY IDENTITY
========================================================= */

function inventoryIdentity(
  item: {
    name: string;
    category: string;
    brand?: string;
    color?: string;
    colorCode?: string;
    size?: string;
    variant?: string;
    unit?: string;
  }
) {
  return [
    normalizeText(
      item.category
    ),

    normalizeText(
      item.name
    ),

    normalizeText(
      item.brand
    ),

    normalizeText(
      item.color
    ),

    normalizeText(
      item.colorCode
    ),

    normalizeText(
      item.size
    ),

    normalizeText(
      item.variant
    ),

    normalizeText(
      item.unit
    ),
  ].join("|");
}

function variantSummary(
  item: {
    brand?: string;
    color?: string;
    colorCode?: string;
    size?: string;
    variant?: string;
  }
) {
  const values = [
    clean(
      item.brand
    ),

    clean(
      item.color
    ),

    clean(
      item.colorCode
    )
      ? `Code ${clean(
          item.colorCode
        )}`
      : "",

    clean(
      item.size
    )
      ? `Size ${clean(
          item.size
        )}`
      : "",

    clean(
      item.variant
    ),
  ].filter(Boolean);

  return values.length
    ? values.join(
        " · "
      )
    : "Standard variant";
}

/* =========================================================
   NORMALIZERS
========================================================= */

function normalizeItem(
  row: any
):
  InventoryItem {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    name:
      clean(
        row?.name ??
          row?.itemName
      ),
inventoryType:
  clean(
    row?.inventoryType
  ) ||
  (
    clean(row?.category) ===
    "Packaging"
      ? "Packaging"
      : clean(row?.category) ===
          "Machine Consumable"
        ? "Consumable"
        : "Production Material"
  ),

purchasable:
  row?.purchasable ===
  undefined
    ? true
    : Boolean(
        row.purchasable
      ),

trackStock:
  row?.trackStock ===
  undefined
    ? true
    : Boolean(
        row.trackStock
      ),

sellable:
  row?.sellable ===
  undefined
    ? false
    : Boolean(
        row.sellable
      ),

customerVisible:
  row?.customerVisible ===
  undefined
    ? false
    : Boolean(
        row.customerVisible
      ),

active:
  row?.active ===
  undefined
    ? true
    : Boolean(
        row.active
      ),
    category:
      clean(
        row?.category
      ),

    sku:
      clean(
        row?.sku
      ),

    brand:
      clean(
        row?.brand
      ),

    color:
      clean(
        row?.color ??
          row?.colour
      ),

    colorCode:
      clean(
        row?.colorCode ??
          row?.colourCode
      ),

    size:
      clean(
        row?.size
      ),

    variant:
      clean(
        row?.variant
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

    minimumStock:
      numberValue(
        row?.minimumStock
      ),

    price:
      numberValue(
        row?.price
      ),

    supplier:
      clean(
        row?.supplier
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

function normalizeTransaction(
  row: any
):
  InventoryTransaction {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

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

    type:
      clean(
        row?.type
      ) ===
      "OUT"
        ? "OUT"
        : "IN",

    quantity:
      numberValue(
        row?.quantity
      ),

    previousQuantity:
      numberValue(
        row?.previousQuantity
      ),

    newQuantity:
      numberValue(
        row?.newQuantity
      ),

    supplier:
      clean(
        row?.supplier
      ),

    purchaseNumber:
      clean(
        row?.purchaseNumber
      ),

    unitCost:
      numberValue(
        row?.unitCost
      ),

    purchaseAmount:
      numberValue(
        row?.purchaseAmount
      ),

    referenceType:
      clean(
        row?.referenceType
      ),

    referenceId:
      clean(
        row?.referenceId
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
   PAGE
========================================================= */

export default function InventoryPage() {
  const [
    items,
    setItems,
  ] =
    useState<
      InventoryItem[]
    >([]);

  const [
    transactions,
    setTransactions,
  ] =
    useState<
      InventoryTransaction[]
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
    categoryFilter,
    setCategoryFilter,
  ] =
    useState(
      "All"
    );

  const [
    stockFilter,
    setStockFilter,
  ] =
    useState(
      "All"
    );

  const [
    showItemForm,
    setShowItemForm,
  ] =
    useState(
      false
    );

  const [
    showStockForm,
    setShowStockForm,
  ] =
    useState(
      false
    );

  const [
    showHistory,
    setShowHistory,
  ] =
    useState(
      false
    );

  const [
    editingItem,
    setEditingItem,
  ] =
    useState<
      InventoryItem | null
    >(
      null
    );

  const [
    selectedItem,
    setSelectedItem,
  ] =
    useState<
      InventoryItem | null
    >(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<
      InventoryForm
    >({
      ...EMPTY_FORM,
    });

  const [
    stockForm,
    setStockForm,
  ] =
    useState<
      StockForm
    >({
      ...EMPTY_STOCK_FORM,
    });

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(
    () => {
      void reload();
    },
    []
  );

  /* =======================================================
     MODAL BODY LOCK
  ======================================================= */

  useEffect(
    () => {
      if (
        !showItemForm &&
        !showStockForm &&
        !showHistory
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
      showItemForm,
      showStockForm,
      showHistory,
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
      console.error(
        "Inventory Excel error:",
        {
          body,
          data,
        }
      );

      throw new Error(
        data?.message ||
          data?.error ||
          "Unable to process Inventory request."
      );
    }

    return data;
  }

  /* =======================================================
     RELOAD
  ======================================================= */

  async function reload(
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
        inventoryRows,
        transactionRows,
        settings,
      ] =
        await Promise.all([
          loadSheet(
            "Inventory"
          ),

          loadSheet(
            "InventoryTransactions"
          ),

          loadAppSettings(),
        ]);

      setItems(
        inventoryRows
          .map(
            normalizeItem
          )
          .filter(
            (
              item
            ) =>
              Boolean(
                item.id
              )
          )
      );

      setTransactions(
        transactionRows
          .map(
            normalizeTransaction
          )
          .filter(
            (
              row
            ) =>
              Boolean(
                row.id
              )
          )
          .sort(
            (
              a,
              b
            ) =>
              String(
                b.createdAt
              ).localeCompare(
                String(
                  a.createdAt
                )
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
        "Inventory reload error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to load Inventory."
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
     RECOMMENDED ITEM
  ======================================================= */

  function selectRecommendedItem(
    name:
      string
  ) {
    const selected =
      RECOMMENDED_ITEMS.find(
        (
          item
        ) =>
          item.name ===
          name
      );

    if (
      !selected
    ) {
      return;
    }

    setForm(
      (
        current
      ) => {
        const next = {
          ...current,

          name:
            selected.name,

          category:
            selected.category,

          unit:
            selected.unit,

          minimumStock:
            selected.minimumStock,
        };

        return {
          ...next,

          sku:
            generateStandardSku(
              next
            ),
        };
      }
    );
  }

  /* =======================================================
     ITEM FORM
  ======================================================= */

  function openNewItem() {
    setEditingItem(
      null
    );

    setForm({
      ...EMPTY_FORM,

      unit:
        appSettings
          .inventoryDefaultUnit ||
        "pcs",

      minimumStock:
        Number(
          appSettings
            .lowStockThreshold
        ) ||
        5,
    });

    setShowItemForm(
      true
    );
  }

  function openEditItem(
    item:
      InventoryItem
  ) {
    setEditingItem(
      item
    );

    setForm({
       name:
    item.name,

  inventoryType:
    item.inventoryType,

  category:
    item.category,

  purchasable:
    item.purchasable,

  trackStock:
    item.trackStock,

  sellable:
    item.sellable,

  customerVisible:
    item.customerVisible,

  active:
    item.active,

  sku:
    item.sku,
      brand:
        item.brand,

      color:
        item.color,

      colorCode:
        item.colorCode,

      size:
        item.size,

      variant:
        item.variant,

      unit:
        item.unit,

      minimumStock:
        item.minimumStock,

      price:
        item.price,

      supplier:
        item.supplier,

      notes:
        item.notes,
    });

    setShowItemForm(
      true
    );
  }

  function updateForm<
    K extends
      keyof InventoryForm
  >(
    field: K,

    value:
      InventoryForm[K]
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,

        [field]:
          value,
      })
    );
  }

function updateInventoryType(
  inventoryType: string
) {
  setForm((current) => {
    const next = {
      ...current,
      inventoryType,
    };

    switch (inventoryType) {
      case "Production Material":
        return {
          ...next,
          purchasable: true,
          trackStock: true,
          sellable: false,
          customerVisible: false,
        };

      case "Resale Item":
        return {
          ...next,
          purchasable: true,
          trackStock: true,
          sellable: true,
          customerVisible:
            current.customerVisible,
        };

      case "Packaging":
        return {
          ...next,
          purchasable: true,
          trackStock: true,
          sellable: false,
          customerVisible: false,
        };

      case "Consumable":
        return {
          ...next,
          purchasable: true,
          trackStock: true,
          sellable: false,
          customerVisible: false,
        };

      case "Operating Supply":
        return {
          ...next,
          purchasable: true,
          trackStock: true,
          sellable: false,
          customerVisible: false,
        };

      case "Asset":
        return {
          ...next,
          purchasable: true,
          trackStock: false,
          sellable: false,
          customerVisible: false,
        };

      default:
        return next;
    }
  });
}

  /* =======================================================
     SKU PREVIEW
  ======================================================= */

  const suggestedSku =
    useMemo(
      () =>
        generateStandardSku(
          form
        ),
      [
        form.name,
        form.category,
        form.brand,
        form.color,
        form.colorCode,
        form.size,
        form.variant,
      ]
    );

  /* =======================================================
     DUPLICATE PREVIEW
  ======================================================= */

  const matchingExistingItem =
    useMemo(
      () => {
        const identity =
          inventoryIdentity(
            form
          );

        return items.find(
          (
            item
          ) =>
            item.id !==
              editingItem?.id &&
            inventoryIdentity(
              item
            ) ===
              identity
        );
      },
      [
        items,
        form,
        editingItem,
      ]
    );

  /* =======================================================
     SAVE SKU MASTER
  ======================================================= */

  async function saveItem() {
    if (
      !form.name.trim()
    ) {
      alert(
        "Item Name is required."
      );

      return;
    }

    if (
      !form.category
    ) {
      alert(
        "Category is required."
      );

      return;
    }

    if (
      !form.unit
    ) {
      alert(
        "Unit is required."
      );

      return;
    }

    /*
     * Existing SKU is permanently retained.
     *
     * New SKU can use manual code or generated code.
     */
    const sku =
      editingItem
        ? editingItem.sku
        : clean(
            form.sku
          ) ||
          suggestedSku;

    if (
      !sku
    ) {
      alert(
        "Unable to generate SKU. Enter Item Name and Category."
      );

      return;
    }

    /*
     * Duplicate master identity.
     */
    const duplicate =
      items.find(
        (
          item
        ) =>
          item.id !==
            editingItem?.id &&
          inventoryIdentity(
            item
          ) ===
            inventoryIdentity(
              form
            )
      );

    if (
      duplicate
    ) {
      const openExisting =
        confirm(
          `"${duplicate.name}" with this Brand / Colour / Size / Variant already exists as SKU ${duplicate.sku}.\n\nOpen Stock In against the existing SKU instead?`
        );

      if (
        openExisting
      ) {
        setShowItemForm(
          false
        );

        openStock(
          duplicate,
          "IN"
        );
      }

      return;
    }

    try {
      setSaving(
        true
      );

      /*
       * Re-read the live Inventory immediately
       * before writing to prevent duplicate records.
       */
      const liveRows =
        await loadSheet(
          "Inventory"
        );

      const liveItems =
        liveRows
          .map(
            normalizeItem
          )
          .filter(
            (
              item
            ) =>
              Boolean(
                item.id
              )
          );

      const duplicateSku =
        liveItems.find(
          (
            item
          ) =>
            item.id !==
              editingItem?.id &&
            normalizeText(
              item.sku
            ) ===
              normalizeText(
                sku
              )
        );

      if (
        duplicateSku
      ) {
        throw new Error(
          `SKU ${sku} already exists for "${duplicateSku.name}". Use Stock In against the existing SKU.`
        );
      }

      const liveDuplicate =
        liveItems.find(
          (
            item
          ) =>
            item.id !==
              editingItem?.id &&
            inventoryIdentity(
              item
            ) ===
              inventoryIdentity(
                form
              )
        );

      if (
        liveDuplicate
      ) {
        throw new Error(
          `This exact inventory variant already exists as SKU ${liveDuplicate.sku}. Use Stock In instead.`
        );
      }

      const now =
        nowIso();

      const common = {
  name:
    form.name.trim(),

  inventoryType:
    form.inventoryType,

  category:
    form.category,

  purchasable:
    form.purchasable,

  trackStock:
    form.trackStock,

  sellable:
    form.sellable,

  customerVisible:
    form.customerVisible,

  active:
    form.active,

  sku:
    sku.toUpperCase(),

        brand:
          form.brand.trim(),

        color:
          form.color.trim(),

        /*
         * Keep UK alias for older pages.
         */
        colour:
          form.color.trim(),

        colorCode:
          form.colorCode.trim(),

        colourCode:
          form.colorCode.trim(),

        size:
          form.size.trim(),

        variant:
          form.variant.trim(),

        unit:
          form.unit,

        minimumStock:
          Math.max(
            Number(
              form.minimumStock ||
                0
            ),
            0
          ),

        /*
         * On edit, average cost remains unchanged.
         * Cost must change through Stock In.
         */
        price:
          editingItem
            ? editingItem.price
            : Math.max(
                Number(
                  form.price ||
                    0
                ),
                0
              ),

        supplier:
          form.supplier.trim(),

        notes:
          form.notes.trim(),

        updatedAt:
          now,
      };

      const record =
        editingItem
          ? {
              ...editingItem,

              ...common,

              quantity:
                editingItem.quantity,
            }
          : {
              id:
                generateId(),

              ...common,

              quantity:
                0,

              createdAt:
                now,
            };

      await saveExcel({
        action:
          editingItem
            ? "update"
            : "add",

        sheet:
          "Inventory",

        ...(editingItem
          ? {
              id:
                editingItem.id,
            }
          : {}),

        record,
      });

      setShowItemForm(
        false
      );

      setEditingItem(
        null
      );

      setForm({
        ...EMPTY_FORM,
      });

      await reload(
        true
      );
    } catch (
      error
    ) {
      console.error(
        "Inventory item save error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to save inventory item."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     STOCK FORM
  ======================================================= */

  function openStock(
    item:
      InventoryItem,

    type:
      | "IN"
      | "OUT"
  ) {
    setSelectedItem(
      item
    );

    setStockForm({
      ...EMPTY_STOCK_FORM,

      type,

      purchaseDate:
        today(),

      supplier:
        type ===
        "IN"
          ? item.supplier ||
            ""
          : "",

      /*
       * Suggest existing weighted average cost.
       * User enters actual purchase cost.
       */
      unitCost:
        type ===
        "IN"
          ? Number(
              item.price ||
                0
            )
          : 0,

      referenceType:
        type ===
        "IN"
          ? "Purchase"
          : "Production",
    });

    setShowStockForm(
      true
    );
  }

  function closeStock() {
    setShowStockForm(
      false
    );

    setSelectedItem(
      null
    );

    setStockForm({
      ...EMPTY_STOCK_FORM,
    });
  }

  /* =======================================================
     SAVE STOCK MOVEMENT
  ======================================================= */

  async function saveStockTransaction() {
    if (
      !selectedItem
    ) {
      return;
    }

    const quantity =
      Number(
        stockForm.quantity
      );

    if (
      !Number.isFinite(
        quantity
      ) ||
      quantity <=
        0
    ) {
      alert(
        "Quantity must be greater than zero."
      );

      return;
    }

    /* -------------------------------------------------------
       PURCHASE VALIDATION
    ------------------------------------------------------- */

    if (
      stockForm.type ===
      "IN"
    ) {
      if (
        !stockForm.purchaseDate
      ) {
        alert(
          "Purchase Date is required."
        );

        return;
      }

      if (
        !stockForm.supplier.trim()
      ) {
        alert(
          "Supplier is required for Inventory Purchase."
        );

        return;
      }

      if (
        !stockForm.purchaseNumber.trim()
      ) {
        alert(
          "Supplier Invoice / Purchase Number is required."
        );

        return;
      }

      if (
        Number(
          stockForm.unitCost
        ) <=
        0
      ) {
        alert(
          "Unit Cost must be greater than zero for purchased stock."
        );

        return;
      }

      /*
       * Duplicate purchase warning.
       *
       * Same supplier invoice + SKU may be accidental
       * double posting. We warn instead of hard blocking,
       * because one supplier invoice could legitimately
       * contain multiple deliveries.
       */
      const duplicatePurchase =
        transactions.find(
          (
            row
          ) =>
            row.type ===
              "IN" &&
            row.inventoryId ===
              selectedItem.id &&
            normalizeText(
              row.purchaseNumber
            ) ===
              normalizeText(
                stockForm.purchaseNumber
              ) &&
            normalizeText(
              row.supplier
            ) ===
              normalizeText(
                stockForm.supplier
              )
        );

      if (
        duplicatePurchase
      ) {
        const proceed =
          confirm(
            `Warning: Supplier Invoice ${stockForm.purchaseNumber} has already been used for SKU ${selectedItem.sku}.\n\nContinue anyway?`
          );

        if (
          !proceed
        ) {
          return;
        }
      }
    }

    /* -------------------------------------------------------
       STOCK OUT VALIDATION
    ------------------------------------------------------- */

    if (
      stockForm.type ===
        "OUT" &&
      (
        stockForm.referenceType ===
          "Production" ||
        stockForm.referenceType ===
          "Order"
      ) &&
      !stockForm.referenceId.trim()
    ) {
      alert(
        `${stockForm.referenceType} reference is required for this Stock Out.`
      );

      return;
    }

    try {
      setSaving(
        true
      );

      /*
       * Always reload current stock before posting.
       */
      const [
        inventoryRows,
        transactionRows,
      ] =
        await Promise.all([
          loadSheet(
            "Inventory"
          ),

          loadSheet(
            "InventoryTransactions"
          ),
        ]);

      const liveItems =
        inventoryRows.map(
          normalizeItem
        );

      const liveTransactions =
        transactionRows.map(
          normalizeTransaction
        );

      const liveItem =
        liveItems.find(
          (
            item
          ) =>
            item.id ===
            selectedItem.id
        );

      if (
        !liveItem
      ) {
        throw new Error(
          "Inventory item no longer exists."
        );
      }

      /*
       * Duplicate purchase check again against live data.
       */
      if (
        stockForm.type ===
        "IN"
      ) {
        const liveDuplicate =
          liveTransactions.find(
            (
              row
            ) =>
              row.type ===
                "IN" &&
              row.inventoryId ===
                liveItem.id &&
              normalizeText(
                row.purchaseNumber
              ) ===
                normalizeText(
                  stockForm.purchaseNumber
                ) &&
              normalizeText(
                row.supplier
              ) ===
                normalizeText(
                  stockForm.supplier
                )
          );

        if (
          liveDuplicate
        ) {
          const proceed =
            confirm(
              `Supplier Invoice ${stockForm.purchaseNumber} is already recorded against ${liveItem.sku}.\n\nAre you certain this is another valid Stock In?`
            );

          if (
            !proceed
          ) {
            setSaving(
              false
            );

            return;
          }
        }
      }

      const previousQuantity =
        Number(
          liveItem.quantity ||
            0
        );

      let newQuantity =
        previousQuantity;

      if (
        stockForm.type ===
        "IN"
      ) {
        newQuantity =
          previousQuantity +
          quantity;
      } else {
        if (
          quantity >
          previousQuantity
        ) {
          throw new Error(
            `Cannot issue ${quantity} ${liveItem.unit}. Only ${previousQuantity} ${liveItem.unit} are available.`
          );
        }

        newQuantity =
          previousQuantity -
          quantity;
      }

      const purchaseUnitCost =
        stockForm.type ===
        "IN"
          ? Number(
              stockForm.unitCost ||
                0
            )
          : 0;

      const purchaseAmount =
        stockForm.type ===
        "IN"
          ? roundMoney(
              quantity *
                purchaseUnitCost
            )
          : 0;

      /*
       * WEIGHTED AVERAGE COST
       *
       * Existing stock:
       * 10 pcs @ ₹100 = ₹1,000
       *
       * New purchase:
       * 10 pcs @ ₹120 = ₹1,200
       *
       * New average:
       * ₹2,200 / 20 = ₹110
       *
       * This is better inventory valuation than simply
       * replacing all old stock with the latest cost.
       */
      let newAverageCost =
        Number(
          liveItem.price ||
            0
        );

      if (
        stockForm.type ===
          "IN" &&
        newQuantity >
          0
      ) {
        const previousValue =
          previousQuantity *
          Number(
            liveItem.price ||
              0
          );

        const receivedValue =
          quantity *
          purchaseUnitCost;

        newAverageCost =
          roundMoney(
            (
              previousValue +
              receivedValue
            ) /
              newQuantity
          );
      }

      const now =
        nowIso();

      const transactionId =
        generateId();

      /* ===================================================
         1. UPDATE INVENTORY BALANCE
      =================================================== */

      await saveExcel({
        action:
          "update",

        sheet:
          "Inventory",

        id:
          liveItem.id,

        record: {
          ...liveItem,

          quantity:
            newQuantity,

          /*
           * Weighted Average Cost
           */
          price:
            newAverageCost,

          supplier:
            stockForm.type ===
              "IN" &&
            stockForm.supplier.trim()
              ? stockForm.supplier.trim()
              : liveItem.supplier,

          updatedAt:
            now,
        },
      });

      /* ===================================================
         2. STOCK LEDGER
      =================================================== */

      const transaction:
        InventoryTransaction = {
        id:
          transactionId,

        inventoryId:
          liveItem.id,

        sku:
          liveItem.sku,

        itemName:
          liveItem.name,

        type:
          stockForm.type,

        quantity,

        previousQuantity,

        newQuantity,

        supplier:
          stockForm.type ===
          "IN"
            ? stockForm.supplier.trim()
            : "",

        purchaseNumber:
          stockForm.type ===
          "IN"
            ? stockForm.purchaseNumber.trim()
            : "",

        /*
         * For OUT transactions we record the
         * current weighted average cost as a useful
         * historical reference.
         */
        unitCost:
          stockForm.type ===
          "IN"
            ? purchaseUnitCost
            : Number(
                liveItem.price ||
                  0
              ),

        purchaseAmount,

        referenceType:
          stockForm.referenceType,

        referenceId:
          stockForm.referenceId.trim(),

        notes:
          stockForm.notes.trim(),

        createdAt:
          now,
      };

      await saveExcel({
        action:
          "add",

        sheet:
          "InventoryTransactions",

        record:
          transaction,
      });

      /* ===================================================
         3. PURCHASE → EXPENSE
      =================================================== */

      if (
        stockForm.type ===
          "IN" &&
        purchaseAmount >
          0
      ) {
        await saveExcel({
          action:
            "add",

          sheet:
            "Expenses",

          record: {
            id:
              generateId(),

            date:
              stockForm.purchaseDate,

            category:
              "Inventory Purchase",

            recommendedCategory:
              "Inventory Purchase",

            description:
              `${liveItem.name} (${liveItem.sku}) - ${quantity} ${liveItem.unit}`,

            amount:
              purchaseAmount,

            paymentMethod:
              stockForm.paymentMethod,

            reference:
              stockForm.purchaseNumber.trim(),

            supplier:
              stockForm.supplier.trim(),

            inventoryTransactionId:
              transactionId,

            inventoryId:
              liveItem.id,

            sku:
              liveItem.sku,

            itemName:
              liveItem.name,

            quantity,

            unit:
              liveItem.unit,

            unitCost:
              purchaseUnitCost,

            notes:
              stockForm.notes.trim(),

            createdAt:
              now,
          },
        });
      }

      closeStock();

      await reload(
        true
      );

      alert(
        stockForm.type ===
          "IN"
          ? `Stock received successfully.\n\n${liveItem.sku}: ${previousQuantity} → ${newQuantity} ${liveItem.unit}\n\nNew weighted average cost: ${money(
              newAverageCost
            )}`
          : `Stock issued successfully.\n\n${liveItem.sku}: ${previousQuantity} → ${newQuantity} ${liveItem.unit}`
      );
    } catch (
      error
    ) {
      console.error(
        "Stock transaction error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to process stock movement."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     DELETE SKU
  ======================================================= */

  async function deleteItem(
    item:
      InventoryItem
  ) {
    if (
      Number(
        item.quantity
      ) !==
      0
    ) {
      alert(
        "Use Stock Out to reduce quantity to zero before deleting this inventory SKU."
      );

      return;
    }

    const hasHistory =
      transactions.some(
        (
          transaction
        ) =>
          transaction.inventoryId ===
          item.id
      );

    if (
      hasHistory
    ) {
      const proceed =
        confirm(
          `${item.sku} has historical stock transactions.\n\nDeleting the SKU master can make old purchase and stock records harder to interpret.\n\nDelete anyway?`
        );

      if (
        !proceed
      ) {
        return;
      }
    } else if (
      !confirm(
        `Delete "${item.name}" (${item.sku})?`
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
          "Inventory",

        id:
          item.id,
      });

      await reload(
        true
      );
    } catch (
      error
    ) {
      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to delete Inventory item."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     HISTORY
  ======================================================= */

  function openHistory(
    item:
      InventoryItem
  ) {
    setSelectedItem(
      item
    );

    setShowHistory(
      true
    );
  }

  const selectedHistory =
    useMemo(
      () => {
        if (
          !selectedItem
        ) {
          return [];
        }

        return transactions.filter(
          (
            row
          ) =>
            row.inventoryId ===
            selectedItem.id
        );
      },
      [
        transactions,
        selectedItem,
      ]
    );

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statistics =
    useMemo(
      () => {
        const lowStock =
          items.filter(
            (
              item
            ) =>
              item.quantity <=
              item.minimumStock
          );

        const outOfStock =
          items.filter(
            (
              item
            ) =>
              item.quantity <=
              0
          );

        const stockValue =
          items.reduce(
            (
              total,
              item
            ) =>
              total +
              item.quantity *
                item.price,
            0
          );

        const purchaseValue =
          transactions
            .filter(
              (
                row
              ) =>
                row.type ===
                "IN"
            )
            .reduce(
              (
                total,
                row
              ) =>
                total +
                Number(
                  row.purchaseAmount ||
                    0
                ),
              0
            );

        return {
          totalItems:
            items.length,

          lowStock:
            lowStock.length,

          outOfStock:
            outOfStock.length,

          stockValue,

          purchaseValue,
        };
      },
      [
        items,
        transactions,
      ]
    );

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredItems =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return items
          .filter(
            (
              item
            ) => {
              const categoryOK =
                categoryFilter ===
                  "All" ||
                item.category ===
                  categoryFilter;

              let stockOK =
                true;

              if (
                stockFilter ===
                "Low"
              ) {
                stockOK =
                  item.quantity <=
                    item.minimumStock &&
                  item.quantity >
                    0;
              }

              if (
                stockFilter ===
                "Out"
              ) {
                stockOK =
                  item.quantity <=
                  0;
              }

              if (
                stockFilter ===
                "Healthy"
              ) {
                stockOK =
                  item.quantity >
                  item.minimumStock;
              }

              const searchOK =
                !query ||
                [
                  item.name,
                  item.category,
                  item.sku,
                  item.brand,
                  item.color,
                  item.colorCode,
                  item.size,
                  item.variant,
                  item.supplier,
                ]
                  .join(" ")
                  .toLowerCase()
                  .includes(
                    query
                  );

              return (
                categoryOK &&
                stockOK &&
                searchOK
              );
            }
          )
          .sort(
            (
              a,
              b
            ) => {
              const aLow =
                a.quantity <=
                a.minimumStock;

              const bLow =
                b.quantity <=
                b.minimumStock;

              if (
                aLow !==
                bLow
              ) {
                return aLow
                  ? -1
                  : 1;
              }

              return a.name.localeCompare(
                b.name
              );
            }
          );
      },
      [
        items,
        search,
        categoryFilter,
        stockFilter,
      ]
    );

  const purchaseAmount =
    stockForm.type ===
    "IN"
      ? Number(
          stockForm.quantity ||
            0
        ) *
        Number(
          stockForm.unitCost ||
            0
        )
      : 0;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">

      <div className="mx-auto w-full max-w-7xl space-y-6 pb-24">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>

            <div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
              Stock & Materials
            </div>

            <h1 className="text-3xl font-black">
              Inventory
            </h1>

            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
              One permanent SKU per stockable
              item / variant. Repeat purchases
              increase stock against the same SKU.
            </p>

          </div>

          <div className="flex gap-2">

            <button
              type="button"
              onClick={() =>
                void reload(
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
                openNewItem
              }
              className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800"
            >
              + Create SKU
            </button>

          </div>

        </div>

        {/* MASTER RULE */}

        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-violet-50 p-5">

          <div className="font-black text-blue-900">
            📦 Inventory Master Rule
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Create the SKU once. Future purchases,
            returns, production consumption and
            adjustments should move stock against
            that SKU instead of creating another item.
          </p>

        </div>

        {/* IMPORTANT COMMERCIAL SEPARATION */}

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">

          <div className="font-black text-emerald-900">
            💰 Purchase Cost ≠ Selling Price
          </div>

          <p className="mt-1 text-sm leading-6 text-emerald-700">
            Inventory maintains the weighted-average
            <strong>
              {" "}purchase cost
            </strong>.
            Customer selling prices belong in
            <strong>
              {" "}Price Master
            </strong>.
            The two values should not overwrite one another.
          </p>

        </div>

        {/* SUMMARY */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <StatCard
            label="SKU Masters"
            value={String(
              statistics.totalItems
            )}
            caption="Unique stock variants"
            tone="blue"
          />

          <StatCard
            label="Low Stock"
            value={String(
              statistics.lowStock
            )}
            caption="At or below minimum"
            tone="amber"
          />

          <StatCard
            label="Out of Stock"
            value={String(
              statistics.outOfStock
            )}
            caption="Zero stock SKUs"
            tone="rose"
          />

          <StatCard
            label="Stock Value"
            value={money(
              statistics.stockValue
            )}
            caption="Qty × average cost"
            tone="green"
          />

          <StatCard
            label="Purchases"
            value={money(
              statistics.purchaseValue
            )}
            caption="Recorded Stock In value"
            tone="violet"
          />

        </div>

        {/* FILTERS */}

        <div className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm lg:grid-cols-[1fr_240px_180px]">

          <input
            value={
              search
            }
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search SKU, item, brand, colour, size, supplier..."
            className="rounded-xl border px-4 py-3"
          />

          <select
            value={
              categoryFilter
            }
            onChange={(e) =>
              setCategoryFilter(
                e.target.value
              )
            }
            className="rounded-xl border bg-white px-4 py-3"
          >

            <option value="All">
              All Categories
            </option>

            {CATEGORIES.map(
              (
                category
              ) => (

                <option
                  key={
                    category
                  }
                  value={
                    category
                  }
                >
                  {category}
                </option>

              )
            )}

          </select>

          <select
            value={
              stockFilter
            }
            onChange={(e) =>
              setStockFilter(
                e.target.value
              )
            }
            className="rounded-xl border bg-white px-4 py-3"
          >

            <option value="All">
              All Stock
            </option>

            <option value="Healthy">
              In Stock
            </option>

            <option value="Low">
              Low Stock
            </option>

            <option value="Out">
              Out of Stock
            </option>

          </select>

        </div>

        {/* INVENTORY TABLE */}

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          {loading ? (

            <div className="p-10 text-center text-slate-500">
              Loading inventory...
            </div>

          ) : filteredItems.length ===
            0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl">
                📦
              </div>

              <div className="mt-4 text-lg font-black">
                No Inventory SKUs Found
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Create a permanent inventory SKU
                to begin stock tracking.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1300px] text-left text-sm">

                <thead>

                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                    <th className="px-4 py-4">
                      Item
                    </th>

                    <th className="px-4 py-4">
                      SKU
                    </th>

                    <th className="px-4 py-4">
                      Variant
                    </th>

                    <th className="px-4 py-4">
                      Category
                    </th>

                    <th className="px-4 py-4">
                      Stock
                    </th>

                    <th className="px-4 py-4">
                      Minimum
                    </th>

                    <th className="px-4 py-4">
                      Avg Cost
                    </th>

                    <th className="px-4 py-4">
                      Stock Value
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

                  {filteredItems.map(
                    (
                      item
                    ) => {
                      const outOfStock =
                        item.quantity <=
                        0;

                      const lowStock =
                        !outOfStock &&
                        item.quantity <=
                          item.minimumStock;

                      return (

                        <tr
                          key={
                            item.id
                          }
                          className="border-b last:border-0 hover:bg-slate-50"
                        >

                          <td className="px-4 py-4">

                            <div className="font-black">
                              {
                                item.name
                              }
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                              {
                                item.supplier ||
                                "No default supplier"
                              }
                            </div>

                          </td>

                          <td className="px-4 py-4">

                            <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 font-mono text-xs font-black text-blue-800">
                              {
                                item.sku ||
                                "—"
                              }
                            </span>

                          </td>

                          <td className="max-w-[230px] px-4 py-4 text-xs leading-5 text-slate-600">
                            {variantSummary(
                              item
                            )}
                          </td>

                          <td className="px-4 py-4">
                            {
                              item.category
                            }
                          </td>

                          <td className="px-4 py-4">

                            <span className="text-lg font-black">
                              {
                                item.quantity
                              }
                            </span>

                            <span className="ml-1 text-xs text-slate-400">
                              {
                                item.unit
                              }
                            </span>

                          </td>

                          <td className="px-4 py-4">
                            {
                              item.minimumStock
                            }{" "}
                            {
                              item.unit
                            }
                          </td>

                          <td className="px-4 py-4 font-bold">
                            {money(
                              item.price
                            )}
                          </td>

                          <td className="px-4 py-4 font-black text-emerald-700">
                            {money(
                              item.quantity *
                                item.price
                            )}
                          </td>

                          <td className="px-4 py-4">

                            <StockStatus
                              outOfStock={
                                outOfStock
                              }
                              lowStock={
                                lowStock
                              }
                            />

                          </td>

                          <td className="px-4 py-4">

                            <div className="flex flex-wrap gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openStock(
                                    item,
                                    "IN"
                                  )
                                }
                                className="rounded-lg bg-green-50 px-3 py-2 text-xs font-black text-green-700"
                              >
                                + Stock In
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openStock(
                                    item,
                                    "OUT"
                                  )
                                }
                                disabled={
                                  item.quantity <=
                                  0
                                }
                                className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-black text-orange-700 disabled:opacity-40"
                              >
                                − Stock Out
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openHistory(
                                    item
                                  )
                                }
                                className="rounded-lg bg-purple-50 px-3 py-2 text-xs font-black text-purple-700"
                              >
                                History
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openEditItem(
                                    item
                                  )
                                }
                                className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-700"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void deleteItem(
                                    item
                                  )
                                }
                                disabled={
                                  saving
                                }
                                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-600 disabled:opacity-50"
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
          ITEM MASTER MODAL
      =================================================== */}

      {showItemForm && (

        <ModalOverlay>

          <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <ModalHeader
              title={
                editingItem
                  ? "Edit SKU Master"
                  : "Create Inventory SKU"
              }
              caption={
                editingItem
                  ? `Permanent SKU ${editingItem.sku}`
                  : "Create one permanent SKU for each unique stockable variant."
              }
              onClose={() =>
                setShowItemForm(
                  false
                )
              }
            />

            <div className="p-6">

              {!editingItem && (

                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">

                  <div className="font-black text-amber-900">
                    Before Creating a SKU
                  </div>

                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    Search Inventory first. If the same
                    item / brand / colour / size / variant
                    already exists, use Stock In instead.
                  </p>

                </div>

              )}

              <Section
                title="Item Identity"
                description="These fields define the stockable item or variant."
              >

                {!editingItem && (

                  <div className="mb-5">

                    <Field
                      label="Recommended Item"
                      caption="Choose a common embroidery item to prefill the basic master data."
                    >

                      <select
                        value=""
                        onChange={(e) =>
                          selectRecommendedItem(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      >

                        <option value="">
                          Select recommended item...
                        </option>

                        {RECOMMENDED_ITEMS.map(
                          (
                            item
                          ) => (

                            <option
                              key={
                                item.name
                              }
                              value={
                                item.name
                              }
                            >
                              {
                                item.name
                              }
                            </option>

                          )
                        )}

                      </select>

                    </Field>

                  </div>

                )}

                <div className="grid gap-5 md:grid-cols-2">

                  <Field
                    label="Item Name *"
                    caption="Generic material or blank name."
                  >

                    <input
                      value={
                        form.name
                      }
                      onChange={(e) =>
                        updateForm(
                          "name",
                          e.target.value
                        )
                      }
                      placeholder="e.g. Plain Polo T-Shirt"
                      className="w-full rounded-xl border px-4 py-3"
                    />

                  </Field>

                  <Field
                    label="Category *"
                    caption="Main inventory classification."
                  >

                    <select
                      value={
                        form.category
                      }
                      onChange={(e) =>
                        updateForm(
                          "category",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border bg-white px-4 py-3"
                    >

                      <option value="">
                        Select Category
                      </option>

                      {CATEGORIES.map(
                        (
                          category
                        ) => (

                          <option
                            key={
                              category
                            }
                            value={
                              category
                            }
                          >
                            {category}
                          </option>

                        )
                      )}

                    </select>

                  </Field>

                  <Field
                    label="Brand / Manufacturer"
                    caption="Useful where the same item is stocked from different manufacturers."
                  >

                    <input
                      value={
                        form.brand
                      }
                      onChange={(e) =>
                        updateForm(
                          "brand",
                          e.target.value
                        )
                      }
                      placeholder="e.g. Madeira"
                      className="w-full rounded-xl border px-4 py-3"
                    />

                  </Field>

                  <Field
                    label="Colour"
                    caption="Human-readable colour."
                  >

                    <input
                      value={
                        form.color
                      }
                      onChange={(e) =>
                        updateForm(
                          "color",
                          e.target.value
                        )
                      }
                      placeholder="e.g. Navy"
                      className="w-full rounded-xl border px-4 py-3"
                    />

                  </Field>

                  <Field
                    label="Colour / Thread Code"
                    caption="Manufacturer colour code where applicable."
                  >

                    <input
                      value={
                        form.colorCode
                      }
                      onChange={(e) =>
                        updateForm(
                          "colorCode",
                          e.target.value
                        )
                      }
                      placeholder="e.g. 1000"
                      className="w-full rounded-xl border px-4 py-3"
                    />

                  </Field>

                  <Field
                    label="Size"
                    caption="Stock size where relevant."
                  >

                    {form.category ===
                    "Garment / Blank" ? (

                      <select
                        value={
                          form.size
                        }
                        onChange={(e) =>
                          updateForm(
                            "size",
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      >

                        {GARMENT_SIZES.map(
                          (
                            size
                          ) => (

                            <option
                              key={
                                size ||
                                "none"
                              }
                              value={
                                size
                              }
                            >
                              {size ||
                                "No Size"}
                            </option>

                          )
                        )}

                      </select>

                    ) : (

                      <input
                        value={
                          form.size
                        }
                        onChange={(e) =>
                          updateForm(
                            "size",
                            e.target.value
                          )
                        }
                        placeholder="Optional"
                        className="w-full rounded-xl border px-4 py-3"
                      />

                    )}

                  </Field>

                  <Field
                    label="Variant"
                    caption="Other stock-defining attribute such as 5000m, Heavy Weight, etc."
                  >

                    <input
                      value={
                        form.variant
                      }
                      onChange={(e) =>
                        updateForm(
                          "variant",
                          e.target.value
                        )
                      }
                      placeholder="Optional variant"
                      className="w-full rounded-xl border px-4 py-3"
                    />

                  </Field>

                  <Field
                    label="Unit *"
                    caption="How stock is counted."
                  >

                    <select
                      value={
                        form.unit
                      }
                      onChange={(e) =>
                        updateForm(
                          "unit",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border bg-white px-4 py-3"
                    >

                      {UNITS.map(
                        (
                          unit
                        ) => (

                          <option
                            key={
                              unit
                            }
                            value={
                              unit
                            }
                          >
                            {unit}
                          </option>

                        )
                      )}

                    </select>

                  </Field>

                </div>

              </Section>

              {/* BUSINESS CLASSIFICATION */}

              <div className="mt-6">

                <Section
                  title="Business Classification"
                  description="Define how this item is used across purchasing, inventory and sales."
                >

                  <div className="grid gap-5 md:grid-cols-2">

                    <Field
                      label="Inventory Type *"
                      caption="Defines the commercial and operational role of this item."
                    >

                      <select
                        value={
                          form.inventoryType
                        }
                        onChange={(e) =>
                          updateInventoryType(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      >

                        {INVENTORY_TYPES.map(
                          (type) => (
                            <option
                              key={type}
                              value={type}
                            >
                              {type}
                            </option>
                          )
                        )}

                      </select>

                    </Field>

                    <div>
                      <div className="text-sm font-black text-slate-800">
                        Status
                      </div>

                      <div className="mt-2 flex min-h-[50px] items-center rounded-xl border bg-white px-4">

                        <label className="flex cursor-pointer items-center gap-3">

                          <input
                            type="checkbox"
                            checked={
                              form.active
                            }
                            onChange={(e) =>
                              updateForm(
                                "active",
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 rounded border-slate-300"
                          />

                          <div>
                            <div className="text-sm font-bold text-slate-800">
                              Active
                            </div>

                            <div className="text-xs text-slate-500">
                              Available for normal business use
                            </div>
                          </div>

                        </label>

                      </div>
                    </div>

                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

                    {/* PURCHASABLE */}

                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/30">

                      <input
                        type="checkbox"
                        checked={
                          form.purchasable
                        }
                        onChange={(e) =>
                          updateForm(
                            "purchasable",
                            e.target.checked
                          )
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                      />

                      <div>
                        <div className="text-sm font-black text-slate-800">
                          Purchasable
                        </div>

                        <div className="mt-1 text-xs leading-5 text-slate-500">
                          Can be purchased from suppliers.
                        </div>
                      </div>

                    </label>

                    {/* TRACK STOCK */}

                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/30">

                      <input
                        type="checkbox"
                        checked={
                          form.trackStock
                        }
                        onChange={(e) =>
                          updateForm(
                            "trackStock",
                            e.target.checked
                          )
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                      />

                      <div>
                        <div className="text-sm font-black text-slate-800">
                          Track Inventory
                        </div>

                        <div className="mt-1 text-xs leading-5 text-slate-500">
                          Maintain stock quantity and movement history.
                        </div>
                      </div>

                    </label>

                    {/* SELLABLE */}

                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/30">

                      <input
                        type="checkbox"
                        checked={
                          form.sellable
                        }
                        onChange={(e) => {
                          const checked =
                            e.target.checked;

                          setForm(
                            (current) => ({
                              ...current,

                              sellable:
                                checked,

                              customerVisible:
                                checked
                                  ? current.customerVisible
                                  : false,
                            })
                          );
                        }}
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                      />

                      <div>
                        <div className="text-sm font-black text-slate-800">
                          Sellable
                        </div>

                        <div className="mt-1 text-xs leading-5 text-slate-500">
                          Can be sold directly as an inventory item.
                        </div>
                      </div>

                    </label>

                    {/* CUSTOMER VISIBLE */}

                    <label
                      className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                        form.sellable
                          ? "cursor-pointer border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/30"
                          : "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
                      }`}
                    >

                      <input
                        type="checkbox"
                        checked={
                          form.customerVisible
                        }
                        disabled={
                          !form.sellable
                        }
                        onChange={(e) =>
                          updateForm(
                            "customerVisible",
                            e.target.checked
                          )
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                      />

                      <div>
                        <div className="text-sm font-black text-slate-800">
                          Customer Visible
                        </div>

                        <div className="mt-1 text-xs leading-5 text-slate-500">
                          Eligible to appear in customer-facing sales channels.
                        </div>
                      </div>

                    </label>

                  </div>

                  <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">

                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                      Classification Summary
                    </div>

                    <div className="mt-2 text-sm font-bold text-slate-800">
                      {form.inventoryType}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">

                      {form.purchasable && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                          Purchasable
                        </span>
                      )}

                      {form.trackStock && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                          Stock Tracked
                        </span>
                      )}

                      {form.sellable && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                          Sellable
                        </span>
                      )}

                      {form.customerVisible && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                          Customer Visible
                        </span>
                      )}

                      {!form.active && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-red-600 shadow-sm">
                          Inactive
                        </span>
                      )}

                    </div>

                  </div>

                </Section>

              </div>

              {/* SKU */}

              <div className="mt-6">

                <Section
                  title="Permanent SKU"
                  description="Once created, the SKU remains permanently attached to this inventory record."
                >

                  <Field
                    label="SKU / Item Code *"
                    caption={
                      editingItem
                        ? "Existing SKU is locked to protect references in purchases, expenses and stock history."
                        : "Automatically generated from item identity. You can override it before first save."
                    }
                  >

                    <div className="flex flex-col gap-2 sm:flex-row">

                      <input
                        value={
                          editingItem
                            ? editingItem.sku
                            : form.sku
                        }
                        readOnly={
                          Boolean(
                            editingItem
                          )
                        }
                        onChange={(e) =>
                          updateForm(
                            "sku",
                            e.target.value
                              .toUpperCase()
                              .replace(
                                /\s+/g,
                                "-"
                              )
                          )
                        }
                        placeholder={
                          suggestedSku ||
                          "SKU will be generated"
                        }
                        className={`min-w-0 flex-1 rounded-xl border px-4 py-3 font-mono font-black uppercase ${
                          editingItem
                            ? "bg-slate-100 text-slate-600"
                            : ""
                        }`}
                      />

                      {!editingItem && (

                        <button
                          type="button"
                          onClick={() =>
                            updateForm(
                              "sku",
                              suggestedSku
                            )
                          }
                          disabled={
                            !suggestedSku
                          }
                          className="rounded-xl border px-4 py-3 text-sm font-black text-blue-700 disabled:opacity-40"
                        >
                          Use Standard SKU
                        </button>

                      )}

                    </div>

                  </Field>

                  {!editingItem &&
                    suggestedSku && (

                    <div className="mt-4 rounded-xl bg-slate-900 p-4 text-white">

                      <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                        Suggested Permanent SKU
                      </div>

                      <div className="mt-1 font-mono text-lg font-black">
                        {
                          suggestedSku
                        }
                      </div>

                    </div>

                  )}

                  {matchingExistingItem &&
                    !editingItem && (

                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">

                      <div className="font-black text-red-800">
                        Existing SKU Detected
                      </div>

                      <p className="mt-1 text-sm text-red-700">
                        This exact variant already exists as{" "}
                        <strong>
                          {
                            matchingExistingItem.sku
                          }
                        </strong>.
                        {" "}Use Stock In instead.
                      </p>

                    </div>

                  )}

                </Section>

              </div>

              {/* STOCK CONTROLS */}

              <div className="mt-6">

                <Section
                  title="Stock Controls"
                  description="Quantity and average cost should normally be changed by Stock In / Stock Out transactions."
                >

                  <div className="grid gap-5 md:grid-cols-2">

                    <Field
                      label="Current Quantity"
                      caption="Live stock balance."
                    >

                      <input
                        value={
                          editingItem?.quantity ??
                          0
                        }
                        readOnly
                        className="w-full rounded-xl border bg-slate-100 px-4 py-3 font-black"
                      />

                    </Field>

                    <Field
                      label="Minimum Stock Level"
                      caption="Low-stock warning triggers at or below this quantity."
                    >

                      <input
                        type="number"
                        min="0"
                        value={
                          form.minimumStock
                        }
                        onChange={(e) =>
                          updateForm(
                            "minimumStock",
                            Number(
                              e.target.value
                            )
                          )
                        }
                        className="w-full rounded-xl border px-4 py-3"
                      />

                    </Field>

                    <Field
                      label="Weighted Average Cost ₹"
                      caption={
                        editingItem
                          ? "Calculated automatically from Stock In purchases."
                          : "Optional opening average cost. Future purchases recalculate this automatically."
                      }
                    >

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          form.price
                        }
                        readOnly={
                          Boolean(
                            editingItem
                          )
                        }
                        onChange={(e) =>
                          updateForm(
                            "price",
                            Number(
                              e.target.value
                            )
                          )
                        }
                        className={`w-full rounded-xl border px-4 py-3 ${
                          editingItem
                            ? "bg-slate-100"
                            : ""
                        }`}
                      />

                    </Field>

                    <Field
                      label="Default Supplier"
                      caption="Preferred supplier for future purchases."
                    >

                      <input
                        value={
                          form.supplier
                        }
                        onChange={(e) =>
                          updateForm(
                            "supplier",
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border px-4 py-3"
                      />

                    </Field>

                  </div>

                  <div className="mt-5">

                    <Field
                      label="Notes"
                      caption="Specification, storage information or purchasing notes."
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
                        className="min-h-24 w-full rounded-xl border px-4 py-3"
                      />

                    </Field>

                  </div>

                </Section>

              </div>

              {/* ITEM FORM BUTTONS */}

              <div className="mt-6 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowItemForm(
                      false
                    )
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
                    void saveItem()
                  }
                  disabled={
                    saving ||
                    Boolean(
                      matchingExistingItem &&
                      !editingItem
                    )
                  }
                  className="rounded-xl bg-blue-700 px-6 py-3 font-black text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingItem
                    ? "Update SKU Master"
                    : "Create SKU Master"}
                </button>

              </div>

            </div>

          </div>

        </ModalOverlay>

      )}

      {/* ===================================================
          STOCK IN / STOCK OUT
      =================================================== */}

      {showStockForm &&
        selectedItem && (

        <ModalOverlay>

          <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <ModalHeader
              title={
                stockForm.type ===
                "IN"
                  ? "Stock In / Purchase"
                  : "Stock Out"
              }
              caption={`${selectedItem.name} · ${selectedItem.sku}`}
              onClose={
                closeStock
              }
            />

            <div className="p-6">

              {/* ITEM SUMMARY */}

              <div className="mb-5 grid gap-3 sm:grid-cols-3">

                <InfoCard
                  label="SKU"
                  value={
                    selectedItem.sku
                  }
                />

                <InfoCard
                  label="Current Stock"
                  value={`${selectedItem.quantity} ${selectedItem.unit}`}
                />

                <InfoCard
                  label="Average Cost"
                  value={money(
                    selectedItem.price
                  )}
                />

              </div>

              <div
                className={`mb-5 rounded-xl border p-4 ${
                  stockForm.type ===
                  "IN"
                    ? "border-green-200 bg-green-50"
                    : "border-orange-200 bg-orange-50"
                }`}
              >

                <div className="text-xs font-black uppercase text-slate-500">
                  Resulting Quantity
                </div>

                <div className="mt-1 text-2xl font-black">
                  {stockForm.type ===
                  "IN"
                    ? selectedItem.quantity +
                      Number(
                        stockForm.quantity ||
                          0
                      )
                    : Math.max(
                        selectedItem.quantity -
                          Number(
                            stockForm.quantity ||
                              0
                          ),
                        0
                      )}{" "}
                  {
                    selectedItem.unit
                  }
                </div>

              </div>

              <div className="space-y-5">

                <Field
                  label="Quantity *"
                  caption={
                    stockForm.type ===
                    "IN"
                      ? `Quantity received in ${selectedItem.unit}.`
                      : `Quantity issued in ${selectedItem.unit}.`
                  }
                >

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      stockForm.quantity
                    }
                    onChange={(e) =>
                      setStockForm({
                        ...stockForm,

                        quantity:
                          Number(
                            e.target.value
                          ),
                      })
                    }
                    className="w-full rounded-xl border px-4 py-3"
                  />

                </Field>

                {/* PURCHASE FIELDS */}

                {stockForm.type ===
                  "IN" && (

                  <Section
                    title="Purchase Details"
                    description="Capture the actual supplier purchase information. The same transaction will be recorded as an Inventory Purchase expense."
                  >

                    <div className="grid gap-5 md:grid-cols-2">

                      <Field
                        label="Purchase / Receipt Date *"
                        caption="Date the inventory was purchased or received."
                      >

                        <input
                          type="date"
                          value={
                            stockForm.purchaseDate
                          }
                          onChange={(e) =>
                            setStockForm({
                              ...stockForm,

                              purchaseDate:
                                e.target.value,
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Supplier *"
                        caption="Supplier from whom this stock was purchased."
                      >

                        <input
                          value={
                            stockForm.supplier
                          }
                          onChange={(e) =>
                            setStockForm({
                              ...stockForm,

                              supplier:
                                e.target.value,
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Supplier Invoice / Purchase No. *"
                        caption="Used to identify and reconcile the purchase."
                      >

                        <input
                          value={
                            stockForm.purchaseNumber
                          }
                          onChange={(e) =>
                            setStockForm({
                              ...stockForm,

                              purchaseNumber:
                                e.target.value,
                            })
                          }
                          placeholder="e.g. SUP-458"
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label={`Purchase Cost ₹ / ${selectedItem.unit} *`}
                        caption="Actual purchase cost per inventory unit."
                      >

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            stockForm.unitCost
                          }
                          onChange={(e) =>
                            setStockForm({
                              ...stockForm,

                              unitCost:
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
                        caption="How this supplier purchase was paid."
                      >

                        <select
                          value={
                            stockForm.paymentMethod
                          }
                          onChange={(e) =>
                            setStockForm({
                              ...stockForm,

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

                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                        <div className="text-xs font-black uppercase text-blue-600">
                          Purchase Amount
                        </div>

                        <div className="mt-1 text-2xl font-black text-blue-800">
                          {money(
                            purchaseAmount
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-blue-600">
                          Quantity × actual purchase cost.
                          Automatically recorded in Expenses.
                        </p>

                      </div>

                    </div>

                    {stockForm.quantity >
                      0 &&
                      stockForm.unitCost >
                        0 && (

                      <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">

                        <div className="text-xs font-black uppercase text-emerald-700">
                          Estimated New Average Cost
                        </div>

                        <div className="mt-1 text-lg font-black text-emerald-900">
                          {money(
                            (
                              selectedItem.quantity *
                                selectedItem.price +
                              Number(
                                stockForm.quantity
                              ) *
                                Number(
                                  stockForm.unitCost
                                )
                            ) /
                              Math.max(
                                selectedItem.quantity +
                                  Number(
                                    stockForm.quantity
                                  ),
                                1
                              )
                          )}
                        </div>

                      </div>

                    )}

                  </Section>

                )}

                {/* REFERENCE */}

                <Field
                  label="Reason / Reference Type"
                  caption="Reason for this stock movement."
                >

                  <select
                    value={
                      stockForm.referenceType
                    }
                    onChange={(e) =>
                      setStockForm({
                        ...stockForm,

                        referenceType:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-xl border bg-white px-4 py-3"
                  >

                    {REFERENCE_TYPES.map(
                      (
                        type
                      ) => (

                        <option
                          key={
                            type
                          }
                          value={
                            type
                          }
                        >
                          {type}
                        </option>

                      )
                    )}

                  </select>

                </Field>

                <Field
                  label={
                    stockForm.type ===
                      "OUT" &&
                    (
                      stockForm.referenceType ===
                        "Production" ||
                      stockForm.referenceType ===
                        "Order"
                    )
                      ? `${stockForm.referenceType} Reference *`
                      : "Reference"
                  }
                  caption="Order number, Production reference, Return number or other supporting reference."
                >

                  <input
                    value={
                      stockForm.referenceId
                    }
                    onChange={(e) =>
                      setStockForm({
                        ...stockForm,

                        referenceId:
                          e.target.value,
                      })
                    }
                    placeholder="e.g. ORD-2026-0001"
                    className="w-full rounded-xl border px-4 py-3"
                  />

                </Field>

                <Field
                  label="Notes"
                  caption="Optional comments for the stock movement."
                >

                  <textarea
                    value={
                      stockForm.notes
                    }
                    onChange={(e) =>
                      setStockForm({
                        ...stockForm,

                        notes:
                          e.target.value,
                      })
                    }
                    className="min-h-24 w-full rounded-xl border px-4 py-3"
                  />

                </Field>

              </div>

              <div className="mt-6 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={
                    closeStock
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
                    void saveStockTransaction()
                  }
                  disabled={
                    saving
                  }
                  className={`rounded-xl px-6 py-3 font-black text-white disabled:opacity-50 ${
                    stockForm.type ===
                    "IN"
                      ? "bg-green-700 hover:bg-green-800"
                      : "bg-orange-600 hover:bg-orange-700"
                  }`}
                >
                  {saving
                    ? "Saving..."
                    : stockForm.type ===
                      "IN"
                    ? "Receive Stock & Record Purchase"
                    : "Issue Stock"}
                </button>

              </div>

            </div>

          </div>

        </ModalOverlay>

      )}

      {/* ===================================================
          STOCK HISTORY
      =================================================== */}

      {showHistory &&
        selectedItem && (

        <ModalOverlay>

          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <ModalHeader
              title="Stock Ledger"
              caption={`${selectedItem.name} · ${selectedItem.sku}`}
              onClose={() => {
                setShowHistory(
                  false
                );

                setSelectedItem(
                  null
                );
              }}
            />

            <div className="p-6">

              <div className="mb-5 grid gap-3 sm:grid-cols-4">

                <InfoCard
                  label="SKU"
                  value={
                    selectedItem.sku
                  }
                />

                <InfoCard
                  label="Variant"
                  value={variantSummary(
                    selectedItem
                  )}
                />

                <InfoCard
                  label="Current Stock"
                  value={`${selectedItem.quantity} ${selectedItem.unit}`}
                />

                <InfoCard
                  label="Average Cost"
                  value={money(
                    selectedItem.price
                  )}
                />

              </div>

              {selectedHistory.length ===
                0 ? (

                <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">
                  No stock movements recorded yet.
                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[1050px] text-left text-sm">

                    <thead>

                      <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                        <th className="px-4 py-3">
                          Date
                        </th>

                        <th className="px-4 py-3">
                          Type
                        </th>

                        <th className="px-4 py-3">
                          Quantity
                        </th>

                        <th className="px-4 py-3">
                          Previous
                        </th>

                        <th className="px-4 py-3">
                          New
                        </th>

                        <th className="px-4 py-3">
                          Supplier
                        </th>

                        <th className="px-4 py-3">
                          Cost
                        </th>

                        <th className="px-4 py-3">
                          Purchase
                        </th>

                        <th className="px-4 py-3">
                          Reason
                        </th>

                        <th className="px-4 py-3">
                          Reference
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {selectedHistory.map(
                        (
                          row
                        ) => (

                          <tr
                            key={
                              row.id
                            }
                            className="border-b last:border-0"
                          >

                            <td className="px-4 py-3">
                              {String(
                                row.createdAt
                              )
                                .replace(
                                  "T",
                                  " "
                                )
                                .slice(
                                  0,
                                  16
                                )}
                            </td>

                            <td className="px-4 py-3">

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${
                                  row.type ===
                                  "IN"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {row.type ===
                                "IN"
                                  ? "STOCK IN"
                                  : "STOCK OUT"}
                              </span>

                            </td>

                            <td className="px-4 py-3 font-black">
                              {
                                row.quantity
                              }
                            </td>

                            <td className="px-4 py-3">
                              {
                                row.previousQuantity
                              }
                            </td>

                            <td className="px-4 py-3 font-black">
                              {
                                row.newQuantity
                              }
                            </td>

                            <td className="px-4 py-3">
                              {
                                row.supplier ||
                                "—"
                              }
                            </td>

                            <td className="px-4 py-3">
                              {row.unitCost >
                              0
                                ? money(
                                    row.unitCost
                                  )
                                : "—"}
                            </td>

                            <td className="px-4 py-3 font-bold">
                              {row.type ===
                              "IN"
                                ? money(
                                    row.purchaseAmount
                                  )
                                : "—"}
                            </td>

                            <td className="px-4 py-3">
                              {
                                row.referenceType ||
                                "—"
                              }
                            </td>

                            <td className="px-4 py-3">
                              {
                                row.purchaseNumber ||
                                row.referenceId ||
                                "—"
                              }
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
    <div className="flex items-start justify-between border-b px-6 py-5">

      <div>

        <h2 className="text-2xl font-black">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {caption}
        </p>

      </div>

      <button
        type="button"
        onClick={
          onClose
        }
        className="ml-4 text-3xl text-slate-400 hover:text-slate-700"
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

      <div className="mb-5">

        <h3 className="font-black text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>

      </div>

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
    | "amber"
    | "rose"
    | "green"
    | "violet";
}) {
  const styles = {
    blue:
      "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50",

    amber:
      "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50",

    rose:
      "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-50",

    green:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50",

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

      <div className="mt-1 break-words text-sm font-black">
        {value ||
          "—"}
      </div>

    </div>
  );
}

function StockStatus({
  lowStock,
  outOfStock,
}: {
  lowStock:
    boolean;

  outOfStock:
    boolean;
}) {
  if (
    outOfStock
  ) {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
        OUT OF STOCK
      </span>
    );
  }

  if (
    lowStock
  ) {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
        LOW STOCK
      </span>
    );
  }

  return (
    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
      IN STOCK
    </span>
  );
}
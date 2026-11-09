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

type PriceStatus =
  | "Active"
  | "Inactive";

type PriceRecord = {
  id: string;

  category: string;
  itemType: string;
  itemName: string;

  sellingPrice: number;

  unit: string;
  gstPercent: number;

  status: PriceStatus;

  notes: string;

  createdAt: string;
  updatedAt: string;

  [key: string]: any;
};

type PriceForm = {
  category: string;
  itemType: string;
  itemName: string;

  sellingPrice: number;

  unit: string;
  gstPercent: number;

  status: PriceStatus;

  notes: string;
};

type ItemTypeDefinition = {
  name: string;
  items: string[];
};

type CategoryDefinition = {
  category: string;

  itemTypes:
    ItemTypeDefinition[];
};

/* =========================================================
   MASTER HIERARCHY

   CATEGORY
      ↓
   ITEM TYPE
      ↓
   ITEM / SERVICE NAME
========================================================= */

const PRICE_HIERARCHY:
  CategoryDefinition[] = [
  /* =======================================================
     EMBROIDERY
  ======================================================= */

  {
    category:
      "Embroidery",

    itemTypes: [
      {
        name:
          "Left Chest",

        items: [
          "Standard Logo Embroidery",
          "Premium Logo Embroidery",
          "Name / Text Embroidery",
          "Monogram Embroidery",
          "Logo + Name Embroidery",
          "Custom Left Chest Embroidery",
        ],
      },

      {
        name:
          "Right Chest",

        items: [
          "Standard Logo Embroidery",
          "Premium Logo Embroidery",
          "Name / Text Embroidery",
          "Monogram Embroidery",
          "Logo + Name Embroidery",
          "Custom Right Chest Embroidery",
        ],
      },

      {
        name:
          "Center Chest",

        items: [
          "Small Center Chest Embroidery",
          "Medium Center Chest Embroidery",
          "Logo Embroidery",
          "Text Embroidery",
          "Custom Center Chest Embroidery",
        ],
      },

      {
        name:
          "Full Front",

        items: [
          "Full Front Logo Embroidery",
          "Full Front Artwork Embroidery",
          "Large Design Embroidery",
          "Text + Logo Embroidery",
          "Custom Full Front Embroidery",
        ],
      },

      {
        name:
          "Full Back",

        items: [
          "Full Back Logo Embroidery",
          "Full Back Artwork Embroidery",
          "Large Back Design Embroidery",
          "Text + Logo Embroidery",
          "Custom Full Back Embroidery",
        ],
      },

      {
        name:
          "Upper Back",

        items: [
          "Upper Back Logo Embroidery",
          "Upper Back Text Embroidery",
          "Name Embroidery",
          "Custom Upper Back Embroidery",
        ],
      },

      {
        name:
          "Left Sleeve",

        items: [
          "Sleeve Logo Embroidery",
          "Sleeve Text Embroidery",
          "Initial / Monogram Embroidery",
          "Custom Left Sleeve Embroidery",
        ],
      },

      {
        name:
          "Right Sleeve",

        items: [
          "Sleeve Logo Embroidery",
          "Sleeve Text Embroidery",
          "Initial / Monogram Embroidery",
          "Custom Right Sleeve Embroidery",
        ],
      },

      {
        name:
          "Pocket",

        items: [
          "Pocket Logo Embroidery",
          "Pocket Name Embroidery",
          "Pocket Monogram",
          "Custom Pocket Embroidery",
        ],
      },

      {
        name:
          "Cap Front",

        items: [
          "Cap Front Logo Embroidery",
          "Cap Front Text Embroidery",
          "Cap Front Monogram",
          "Custom Cap Front Embroidery",
        ],
      },

      {
        name:
          "Cap Side",

        items: [
          "Cap Side Logo Embroidery",
          "Cap Side Text Embroidery",
          "Custom Cap Side Embroidery",
        ],
      },

      {
        name:
          "Cap Back",

        items: [
          "Cap Back Text Embroidery",
          "Cap Back Logo Embroidery",
          "Custom Cap Back Embroidery",
        ],
      },

      {
        name:
          "Towel / Fabric",

        items: [
          "Name Embroidery",
          "Monogram Embroidery",
          "Logo Embroidery",
          "Custom Fabric Embroidery",
        ],
      },

      {
        name:
          "Patch",

        items: [
          "Embroidered Patch - Small",
          "Embroidered Patch - Medium",
          "Embroidered Patch - Large",
          "Custom Embroidered Patch",
        ],
      },

      {
        name:
          "Other Placement",

        items: [
          "Custom Embroidery Service",
        ],
      },
    ],
  },

  /* =======================================================
     DIGITIZING
  ======================================================= */

  {
    category:
      "Digitizing",

    itemTypes: [
      {
        name:
          "Left / Right Chest",

        items: [
          "Standard Logo Digitizing",
          "Detailed Logo Digitizing",
          "Text / Name Digitizing",
          "Monogram Digitizing",
          "Custom Chest Digitizing",
        ],
      },

      {
        name:
          "Full Front",

        items: [
          "Full Front Design Digitizing",
          "Large Logo Digitizing",
          "Artwork Digitizing",
          "Complex Full Front Digitizing",
        ],
      },

      {
        name:
          "Full Back",

        items: [
          "Full Back Design Digitizing",
          "Large Back Logo Digitizing",
          "Artwork Digitizing",
          "Complex Full Back Digitizing",
        ],
      },

      {
        name:
          "Cap",

        items: [
          "Cap Logo Digitizing",
          "Cap Text Digitizing",
          "3D Puff Cap Digitizing",
          "Custom Cap Digitizing",
        ],
      },

      {
        name:
          "Sleeve",

        items: [
          "Sleeve Logo Digitizing",
          "Sleeve Text Digitizing",
          "Custom Sleeve Digitizing",
        ],
      },

      {
        name:
          "Patch",

        items: [
          "Patch Digitizing",
          "Badge Digitizing",
          "Complex Patch Digitizing",
        ],
      },

      {
        name:
          "Other",

        items: [
          "Custom Digitizing Service",
          "Design File Conversion",
          "Digitizing Modification",
        ],
      },
    ],
  },

  /* =======================================================
     GARMENTS / PRODUCTS
  ======================================================= */

  {
    category:
      "Garment / Apparel",

    itemTypes: [
      {
        name:
          "T-Shirt",

        items: [
          "Round Neck T-Shirt",
          "Premium Round Neck T-Shirt",
          "Dry Fit T-Shirt",
          "Oversized T-Shirt",
          "Kids T-Shirt",
          "Custom T-Shirt",
        ],
      },

      {
        name:
          "Polo T-Shirt",

        items: [
          "Standard Polo T-Shirt",
          "Premium Polo T-Shirt",
          "Dry Fit Polo T-Shirt",
          "Corporate Polo T-Shirt",
          "Custom Polo T-Shirt",
        ],
      },

      {
        name:
          "Shirt",

        items: [
          "Formal Shirt",
          "Casual Shirt",
          "Uniform Shirt",
          "Corporate Shirt",
          "Custom Shirt",
        ],
      },

      {
        name:
          "Sweatshirt",

        items: [
          "Round Neck Sweatshirt",
          "Premium Sweatshirt",
          "Custom Sweatshirt",
        ],
      },

      {
        name:
          "Hoodie",

        items: [
          "Pullover Hoodie",
          "Zip Hoodie",
          "Premium Hoodie",
          "Custom Hoodie",
        ],
      },

      {
        name:
          "Jacket",

        items: [
          "Corporate Jacket",
          "Bomber Jacket",
          "Sports Jacket",
          "Custom Jacket",
        ],
      },

      {
        name:
          "Cap",

        items: [
          "Baseball Cap",
          "Premium Cap",
          "Corporate Cap",
          "Sports Cap",
          "Custom Cap",
        ],
      },

      {
        name:
          "Apron",

        items: [
          "Standard Apron",
          "Chef Apron",
          "Corporate Apron",
          "Custom Apron",
        ],
      },

      {
        name:
          "Bag",

        items: [
          "Tote Bag",
          "Canvas Bag",
          "Corporate Bag",
          "Custom Bag",
        ],
      },

      {
        name:
          "Other Apparel",

        items: [
          "Custom Garment",
          "Customer Supplied Garment",
        ],
      },
    ],
  },

  /* =======================================================
     EMBROIDERED PRODUCT
  ======================================================= */

  {
    category:
      "Embroidered Product",

    itemTypes: [
      {
        name:
          "T-Shirt",

        items: [
          "T-Shirt + Left Chest Embroidery",
          "T-Shirt + Right Chest Embroidery",
          "T-Shirt + Center Chest Embroidery",
          "T-Shirt + Full Front Embroidery",
          "T-Shirt + Full Back Embroidery",
          "Custom Embroidered T-Shirt",
        ],
      },

      {
        name:
          "Polo T-Shirt",

        items: [
          "Polo + Left Chest Embroidery",
          "Polo + Right Chest Embroidery",
          "Polo + Sleeve Embroidery",
          "Polo + Back Embroidery",
          "Custom Embroidered Polo",
        ],
      },

      {
        name:
          "Shirt",

        items: [
          "Shirt + Chest Embroidery",
          "Shirt + Sleeve Embroidery",
          "Shirt + Name Embroidery",
          "Custom Embroidered Shirt",
        ],
      },

      {
        name:
          "Sweatshirt",

        items: [
          "Sweatshirt + Chest Embroidery",
          "Sweatshirt + Full Front Embroidery",
          "Sweatshirt + Back Embroidery",
          "Custom Embroidered Sweatshirt",
        ],
      },

      {
        name:
          "Hoodie",

        items: [
          "Hoodie + Chest Embroidery",
          "Hoodie + Full Front Embroidery",
          "Hoodie + Back Embroidery",
          "Hoodie + Sleeve Embroidery",
          "Custom Embroidered Hoodie",
        ],
      },

      {
        name:
          "Cap",

        items: [
          "Cap + Front Embroidery",
          "Cap + Side Embroidery",
          "Cap + Front & Side Embroidery",
          "Custom Embroidered Cap",
        ],
      },

      {
        name:
          "Jacket",

        items: [
          "Jacket + Chest Embroidery",
          "Jacket + Back Embroidery",
          "Jacket + Sleeve Embroidery",
          "Custom Embroidered Jacket",
        ],
      },

      {
        name:
          "Apron",

        items: [
          "Apron + Logo Embroidery",
          "Apron + Name Embroidery",
          "Custom Embroidered Apron",
        ],
      },

      {
        name:
          "Bag",

        items: [
          "Bag + Logo Embroidery",
          "Bag + Name Embroidery",
          "Custom Embroidered Bag",
        ],
      },
    ],
  },

  /* =======================================================
     PERSONALIZATION
  ======================================================= */

  {
    category:
      "Personalization",

    itemTypes: [
      {
        name:
          "Name",

        items: [
          "Single Name Embroidery",
          "First + Last Name Embroidery",
          "Employee Name Embroidery",
          "Custom Name Embroidery",
        ],
      },

      {
        name:
          "Initials",

        items: [
          "Single Initial",
          "Two Initials",
          "Three Initials",
          "Custom Initials",
        ],
      },

      {
        name:
          "Monogram",

        items: [
          "Standard Monogram",
          "Premium Monogram",
          "Custom Monogram",
        ],
      },

      {
        name:
          "Number",

        items: [
          "Single Number",
          "Player Number",
          "Custom Number Embroidery",
        ],
      },
    ],
  },

  /* =======================================================
     ADDITIONAL SERVICES
  ======================================================= */

  {
    category:
      "Additional Services",

    itemTypes: [
      {
        name:
          "Design",

        items: [
          "Basic Artwork Preparation",
          "Logo Cleanup",
          "Artwork Modification",
          "Custom Design Service",
        ],
      },

      {
        name:
          "Production",

        items: [
          "Sample Embroidery",
          "Urgent Production Charge",
          "Small Order Charge",
          "Special Thread Charge",
          "Thread Colour Change",
          "Applique Charge",
          "3D Puff Embroidery Charge",
        ],
      },

      {
        name:
          "Finishing",

        items: [
          "Thread Trimming",
          "Finishing Charge",
          "Ironing / Pressing",
          "Individual Packing",
          "Premium Packing",
        ],
      },

      {
        name:
          "Delivery",

        items: [
          "Local Delivery",
          "Courier Charge",
          "Express Delivery",
          "Bulk Delivery",
        ],
      },

      {
        name:
          "Other",

        items: [
          "Custom Service Charge",
          "Rush Order Charge",
          "Miscellaneous Service",
        ],
      },
    ],
  },
];

/* =========================================================
   UNIT OPTIONS
========================================================= */

const UNIT_OPTIONS = [
  "Per Piece",
  "Per Design",
  "Per Logo",
  "Per Garment",
  "Per Placement",
  "Per Name",
  "Per Patch",
  "Per Order",
  "Per Hour",
  "Flat Rate",
];

/* =========================================================
   EMPTY FORM
========================================================= */

function emptyForm():
  PriceForm {
  return {
    category:
      "",

    itemType:
      "",

    itemName:
      "",

    sellingPrice:
      0,

    unit:
      "Per Piece",

    gstPercent:
      18,

    status:
      "Active",

    notes:
      "",
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

  return `price-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function getNow() {
  return new Date()
    .toISOString();
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
        2,

      maximumFractionDigits:
        2,
    }
  )}`;
}

/* =========================================================
   NORMALIZER
========================================================= */

function normalizePrice(
  row: any
):
  PriceRecord {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    category:
      clean(
        row?.category
      ),

    itemType:
      clean(
        row?.itemType ??
          row?.type
      ),

    itemName:
      clean(
        row?.itemName ??
          row?.itemServiceName ??
          row?.name
      ),

    sellingPrice:
      numberValue(
        row?.sellingPrice ??
          row?.price
      ),

    unit:
      clean(
        row?.unit
      ) ||
      "Per Piece",

    gstPercent:
      numberValue(
        row?.gstPercent
      ),

    status:
      clean(
        row?.status
      ) ===
      "Inactive"
        ? "Inactive"
        : "Active",

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
   PAGE
========================================================= */

export default function PriceMasterPage() {
  const [
    records,
    setRecords,
  ] =
    useState<
      PriceRecord[]
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
    showForm,
    setShowForm,
  ] =
    useState(false);

  const [
    editing,
    setEditing,
  ] =
    useState<
      PriceRecord | null
    >(null);

  const [
    form,
    setForm,
  ] =
    useState<
      PriceForm
    >(
      emptyForm()
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState("All");

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
    },
    [
      showForm,
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
          "Unable to process Price Master request."
      );
    }

    return data;
  }

  /* =======================================================
     LOAD DATA
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
        rows,
        settings,
      ] =
        await Promise.all([
          loadSheet(
            "PriceMaster"
          ),

          loadAppSettings(),
        ]);

      const normalized =
        rows
          .map(
            normalizePrice
          )
          .filter(
            (
              record:
                PriceRecord
            ) =>
              Boolean(
                record.id ||
                  record.itemName
              )
          )
          .sort(
            (
              a,
              b
            ) => {
              const category =
                a.category.localeCompare(
                  b.category
                );

              if (
                category !==
                0
              ) {
                return category;
              }

              const type =
                a.itemType.localeCompare(
                  b.itemType
                );

              if (
                type !==
                0
              ) {
                return type;
              }

              return a.itemName.localeCompare(
                b.itemName
              );
            }
          );

      setRecords(
        normalized
      );

      setAppSettings(
        settings
      );
    } catch (
      error
    ) {
      console.error(
        "Price Master load error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to load Price Master."
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
     HIERARCHY
  ======================================================= */

  const selectedCategoryDefinition =
    useMemo(
      () =>
        PRICE_HIERARCHY.find(
          (
            row
          ) =>
            row.category ===
            form.category
        ),
      [
        form.category,
      ]
    );

  const itemTypeOptions =
    useMemo(
      () =>
        selectedCategoryDefinition
          ?.itemTypes ||
        [],
      [
        selectedCategoryDefinition,
      ]
    );

  const selectedItemTypeDefinition =
    useMemo(
      () =>
        itemTypeOptions.find(
          (
            row
          ) =>
            row.name ===
            form.itemType
        ),
      [
        itemTypeOptions,
        form.itemType,
      ]
    );

  const itemNameOptions =
    selectedItemTypeDefinition
      ?.items ||
    [];

  /* =======================================================
     CATEGORY CHANGE

     Changing Category clears the dependent fields.
  ======================================================= */

  function changeCategory(
    category: string
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,

        category,

        itemType:
          "",

        itemName:
          "",
      })
    );
  }

  /* =======================================================
     ITEM TYPE CHANGE

     Changing Item Type clears Item Name.
  ======================================================= */

  function changeItemType(
    itemType: string
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,

        itemType,

        itemName:
          "",
      })
    );
  }

  /* =======================================================
     OPEN CREATE
  ======================================================= */

  function openCreate() {
    setEditing(
      null
    );

    setForm(
      emptyForm()
    );

    setShowForm(
      true
    );
  }

  /* =======================================================
     OPEN EDIT
  ======================================================= */

  function openEdit(
    record:
      PriceRecord
  ) {
    setEditing(
      record
    );

    setForm({
      category:
        record.category,

      itemType:
        record.itemType,

      itemName:
        record.itemName,

      sellingPrice:
        record.sellingPrice,

      unit:
        record.unit,

      gstPercent:
        record.gstPercent,

      status:
        record.status as PriceStatus,

      notes:
        record.notes,
    });

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
  }

  /* =======================================================
     DUPLICATE CHECK
  ======================================================= */

  const duplicateRecord =
    useMemo(
      () =>
        records.find(
          (
            record
          ) =>
            record.id !==
              editing?.id &&
            normalizeText(
              record.category
            ) ===
              normalizeText(
                form.category
              ) &&
            normalizeText(
              record.itemType
            ) ===
              normalizeText(
                form.itemType
              ) &&
            normalizeText(
              record.itemName
            ) ===
              normalizeText(
                form.itemName
              )
        ),
      [
        records,
        editing,
        form.category,
        form.itemType,
        form.itemName,
      ]
    );

  /* =======================================================
     SAVE
  ======================================================= */

  async function savePrice() {
    if (
      !form.category
    ) {
      alert(
        "Category is required."
      );

      return;
    }

    if (
      !form.itemType
    ) {
      alert(
        "Item Type is required."
      );

      return;
    }

    if (
      !form.itemName
    ) {
      alert(
        "Item / Service Name is required."
      );

      return;
    }

    if (
      Number(
        form.sellingPrice
      ) <=
      0
    ) {
      alert(
        "Selling Price must be greater than zero."
      );

      return;
    }

    if (
      Number(
        form.gstPercent
      ) <
      0
    ) {
      alert(
        "GST cannot be negative."
      );

      return;
    }

    if (
      duplicateRecord
    ) {
      alert(
        `This Price Master entry already exists.\n\n${duplicateRecord.category} → ${duplicateRecord.itemType} → ${duplicateRecord.itemName}`
      );

      return;
    }

    try {
      setSaving(
        true
      );

      /*
       * Reload live master before save.
       */
      const liveRows =
        await loadSheet(
          "PriceMaster"
        );

      const liveRecords =
        liveRows.map(
          normalizePrice
        );

      const duplicateLive =
        liveRecords.find(
          (
            record
          ) =>
            record.id !==
              editing?.id &&
            normalizeText(
              record.category
            ) ===
              normalizeText(
                form.category
              ) &&
            normalizeText(
              record.itemType
            ) ===
              normalizeText(
                form.itemType
              ) &&
            normalizeText(
              record.itemName
            ) ===
              normalizeText(
                form.itemName
              )
        );

      if (
        duplicateLive
      ) {
        throw new Error(
          `A price already exists for ${form.category} → ${form.itemType} → ${form.itemName}.`
        );
      }

      const now =
        getNow();

      const record = {
        category:
          form.category,

        itemType:
          form.itemType,

        itemName:
          form.itemName,

        sellingPrice:
          Number(
            form.sellingPrice
          ),

        unit:
          form.unit,

        gstPercent:
          Number(
            form.gstPercent
          ),

        status:
          form.status,

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
          "PriceMaster",

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
        editing
          ? "Price updated successfully."
          : "Price Master entry created successfully."
      );
    } catch (
      error
    ) {
      console.error(
        "Price Master save error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to save Price Master."
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

  async function deletePrice(
    record:
      PriceRecord
  ) {
    if (
      !confirm(
        `Delete this Price Master entry?\n\n${record.category} → ${record.itemType} → ${record.itemName}`
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
          "PriceMaster",

        id:
          record.id,
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
          : "Unable to delete Price Master entry."
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

  const filteredRecords =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return records.filter(
          (
            record
          ) => {
            const categoryMatches =
              categoryFilter ===
                "All" ||
              record.category ===
                categoryFilter;

            const text =
              [
                record.category,
                record.itemType,
                record.itemName,
                record.unit,
                record.status,
                record.notes,
              ]
                .join(
                  " "
                )
                .toLowerCase();

            return (
              categoryMatches &&
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
        records,
        search,
        categoryFilter,
      ]
    );

  /* =======================================================
     STATS
  ======================================================= */

  const activePrices =
    records.filter(
      (
        row
      ) =>
        row.status ===
        "Active"
    ).length;

  const embroideryPrices =
    records.filter(
      (
        row
      ) =>
        row.category ===
        "Embroidery"
    ).length;

  const productPrices =
    records.filter(
      (
        row
      ) =>
        [
          "Garment / Apparel",
          "Embroidered Product",
        ].includes(
          row.category
        )
    ).length;

  const servicePrices =
    records.filter(
      (
        row
      ) =>
        [
          "Embroidery",
          "Digitizing",
          "Personalization",
          "Additional Services",
        ].includes(
          row.category
        )
    ).length;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="h-full min-h-0 overflow-y-auto">

      <div className="mx-auto w-full max-w-7xl space-y-6 pb-24">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>

            <div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
              Sales Master
            </div>

            <h1 className="text-3xl font-black">
              Price Master
            </h1>

            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
              Maintain standard selling prices for
              embroidery, digitizing, garments,
              finished embroidered products and
              additional services.
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
              className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800"
            >
              + Add Price
            </button>

          </div>

        </div>

        {/* =================================================
            EXPLANATION
        ================================================= */}

        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-5">

          <div className="font-black text-blue-900">
            🏷️ Category → Item Type → Item / Service
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Choices are linked. For example,
            selecting <strong>Embroidery</strong>{" "}
            displays placements such as Left Chest,
            Right Chest, Full Front, Full Back and
            Sleeve. Item / Service Name then shows
            only services applicable to that
            placement.
          </p>

        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <StatCard
            label="Price Records"
            value={String(
              records.length
            )}
            tone="blue"
          />

          <StatCard
            label="Active Prices"
            value={String(
              activePrices
            )}
            tone="green"
          />

          <StatCard
            label="Embroidery"
            value={String(
              embroideryPrices
            )}
            tone="purple"
          />

          <StatCard
            label="Products"
            value={String(
              productPrices
            )}
            tone="amber"
          />

          <StatCard
            label="Services"
            value={String(
              servicePrices
            )}
            tone="rose"
          />

        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[1fr_260px]">

          <input
            value={
              search
            }
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search category, item type or item/service..."
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

            {PRICE_HIERARCHY.map(
              (
                category
              ) => (

                <option
                  key={
                    category.category
                  }
                  value={
                    category.category
                  }
                >
                  {
                    category.category
                  }
                </option>

              )
            )}

          </select>

        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          {loading ? (

            <div className="p-10 text-center text-slate-500">
              Loading Price Master...
            </div>

          ) : filteredRecords.length ===
            0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl">
                🏷️
              </div>

              <h2 className="mt-4 text-xl font-black">
                No Price Records Found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Add your first standard selling price.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1050px] text-left text-sm">

                <thead>

                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                    <th className="px-5 py-4">
                      Category
                    </th>

                    <th className="px-5 py-4">
                      Item Type
                    </th>

                    <th className="px-5 py-4">
                      Item / Service Name
                    </th>

                    <th className="px-5 py-4">
                      Selling Price
                    </th>

                    <th className="px-5 py-4">
                      Unit
                    </th>

                    <th className="px-5 py-4">
                      GST
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredRecords.map(
                    (
                      record
                    ) => (

                      <tr
                        key={
                          record.id
                        }
                        className="border-b last:border-0 hover:bg-slate-50"
                      >

                        {/* CATEGORY FIRST */}

                        <td className="px-5 py-4">

                          <CategoryBadge
                            category={
                              record.category
                            }
                          />

                        </td>

                        {/* ITEM TYPE SECOND */}

                        <td className="px-5 py-4 font-bold text-slate-700">
                          {
                            record.itemType
                          }
                        </td>

                        {/* ITEM NAME THIRD */}

                        <td className="px-5 py-4">

                          <div className="font-black text-slate-900">
                            {
                              record.itemName
                            }
                          </div>

                          {record.notes && (

                            <div className="mt-1 max-w-[300px] truncate text-xs text-slate-400">
                              {
                                record.notes
                              }
                            </div>

                          )}

                        </td>

                        <td className="px-5 py-4">

                          <div className="text-lg font-black text-emerald-700">
                            {money(
                              record.sellingPrice,
                              appSettings.currencySymbol ||
                                "₹"
                            )}
                          </div>

                        </td>

                        <td className="px-5 py-4">
                          {
                            record.unit
                          }
                        </td>

                        <td className="px-5 py-4">
                          {
                            record.gstPercent
                          }%
                        </td>

                        <td className="px-5 py-4">

                          <StatusBadge
                            status={
                              record.status
                            }
                          />

                        </td>

                        <td className="px-5 py-4">

                          <div className="flex gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  record
                                )
                              }
                              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void deletePrice(
                                  record
                                )
                              }
                              disabled={
                                saving
                              }
                              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
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
          ADD / EDIT MODAL
      ================================================= */}

      {showForm && (

        <ModalOverlay>

          <div className="my-6 flex max-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

            <ModalHeader
              title={
                editing
                  ? "Edit Price"
                  : "Add Price"
              }
              caption="Price Master"
              onClose={
                closeForm
              }
            />

            <div className="min-h-0 flex-1 overflow-y-auto p-6">

              <div className="space-y-6">

                {/* =================================================
                    SELLING PRICE HIERARCHY
                ================================================= */}

                <Section
                  title="Item / Service Classification"
                  description="Select the fields in order. Item Type depends on Category, and Item / Service Name depends on Item Type."
                >

                  <div className="grid gap-5">

                    {/* =============================================
                        1. CATEGORY
                    ============================================= */}

                    <Field
                      label="1. Category *"
                      caption="Select the main business category first."
                    >

                      <select
                        value={
                          form.category
                        }
                        onChange={(e) =>
                          changeCategory(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                      >

                        <option value="">
                          Select Category
                        </option>

                        {PRICE_HIERARCHY.map(
                          (
                            category
                          ) => (

                            <option
                              key={
                                category.category
                              }
                              value={
                                category.category
                              }
                            >
                              {
                                category.category
                              }
                            </option>

                          )
                        )}

                      </select>

                    </Field>

                    {/* =============================================
                        2. ITEM TYPE
                    ============================================= */}

                    <Field
                      label="2. Item Type *"
                      caption={
                        form.category
                          ? `Showing Item Types related to ${form.category}.`
                          : "Select Category first."
                      }
                    >

                      <select
                        value={
                          form.itemType
                        }
                        onChange={(e) =>
                          changeItemType(
                            e.target.value
                          )
                        }
                        disabled={
                          !form.category
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      >

                        <option value="">
                          {form.category
                            ? "Select Item Type"
                            : "Select Category First"}
                        </option>

                        {itemTypeOptions.map(
                          (
                            type
                          ) => (

                            <option
                              key={
                                type.name
                              }
                              value={
                                type.name
                              }
                            >
                              {
                                type.name
                              }
                            </option>

                          )
                        )}

                      </select>

                    </Field>

                    {/* =============================================
                        3. ITEM / SERVICE NAME
                    ============================================= */}

                    <Field
                      label="3. Item / Service Name *"
                      caption={
                        form.itemType
                          ? `Showing options for ${form.itemType}.`
                          : "Select Item Type first."
                      }
                    >

                      <select
                        value={
                          form.itemName
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,

                            itemName:
                              e.target.value,
                          })
                        }
                        disabled={
                          !form.itemType
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      >

                        <option value="">
                          {form.itemType
                            ? "Select Item / Service"
                            : "Select Item Type First"}
                        </option>

                        {itemNameOptions.map(
                          (
                            item
                          ) => (

                            <option
                              key={
                                item
                              }
                              value={
                                item
                              }
                            >
                              {item}
                            </option>

                          )
                        )}

                      </select>

                    </Field>

                  </div>

                  {/* ===============================================
                      SELECTION PREVIEW
                  =============================================== */}

                  {form.category &&
                    form.itemType &&
                    form.itemName && (

                    <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">

                      <div className="text-[10px] font-black uppercase tracking-wide text-blue-500">
                        Price Master Classification
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-black text-blue-900">

                        <span>
                          {
                            form.category
                          }
                        </span>

                        <span className="text-blue-300">
                          →
                        </span>

                        <span>
                          {
                            form.itemType
                          }
                        </span>

                        <span className="text-blue-300">
                          →
                        </span>

                        <span>
                          {
                            form.itemName
                          }
                        </span>

                      </div>

                    </div>

                  )}

                </Section>

                {/* =================================================
                    PRICE
                ================================================= */}

                <Section
                  title="Selling Price"
                  description="This standard selling price can be fetched by quotations, orders and invoices."
                >

                  <div className="grid gap-5 md:grid-cols-2">

                    <Field
                      label="Selling Price *"
                      caption="Standard customer selling price before GST."
                    >

                      <div className="relative">

                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-500">
                          {appSettings.currencySymbol ||
                            "₹"}
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            form.sellingPrice
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              sellingPrice:
                                Number(
                                  e.target.value
                                ),
                            })
                          }
                          className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-lg font-black text-emerald-700"
                        />

                      </div>

                    </Field>

                    <Field
                      label="Price Unit *"
                      caption="How this selling price is applied."
                    >

                      <select
                        value={
                          form.unit
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,

                            unit:
                              e.target.value,
                          })
                        }
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      >

                        {UNIT_OPTIONS.map(
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

                    <Field
                      label="GST %"
                      caption="Default GST applied to this item/service."
                    >

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          form.gstPercent
                        }
                        onChange={(e) =>
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

                    <Field
                      label="Status"
                      caption="Only Active prices should be fetched into new sales documents."
                    >

                      <select
                        value={
                          form.status
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,

                            status:
                              e.target
                                .value as PriceStatus,
                          })
                        }
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      >

                        <option value="Active">
                          Active
                        </option>

                        <option value="Inactive">
                          Inactive
                        </option>

                      </select>

                    </Field>

                  </div>

                </Section>

                {/* =================================================
                    NOTES
                ================================================= */}

                <Section
                  title="Notes"
                  description="Internal pricing instructions or conditions."
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
                    placeholder="For example: price applicable up to 8,000 stitches; additional stitches charged separately..."
                    className="min-h-28 w-full rounded-xl border px-4 py-3"
                  />

                </Section>

                {/* DUPLICATE */}

                {duplicateRecord && (

                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">

                    <div className="font-black text-red-700">
                      Duplicate Price Master Entry
                    </div>

                    <p className="mt-1 text-sm text-red-600">
                      A price already exists for{" "}
                      <strong>
                        {
                          form.category
                        }{" "}
                        →{" "}
                        {
                          form.itemType
                        }{" "}
                        →{" "}
                        {
                          form.itemName
                        }
                      </strong>.
                    </p>

                  </div>

                )}

              </div>

            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-slate-50 px-6 py-4">

              <div className="hidden text-sm text-slate-500 sm:block">

                {form.itemName ? (

                  <>
                    <strong className="text-slate-800">
                      {
                        form.itemName
                      }
                    </strong>

                    {" · "}

                    <strong className="text-emerald-700">
                      {money(
                        form.sellingPrice,
                        appSettings.currencySymbol ||
                          "₹"
                      )}
                    </strong>
                  </>

                ) : (
                  "Select Category → Item Type → Item / Service"
                )}

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
                  className="rounded-xl border bg-white px-5 py-3 font-bold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void savePrice()
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl bg-blue-700 px-6 py-3 font-black text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update Price"
                    : "Save Price"}
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

      <h3 className="font-black text-slate-900">
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
  tone,
}: {
  label:
    string;

  value:
    string;

  tone:
    | "blue"
    | "green"
    | "purple"
    | "amber"
    | "rose";
}) {
  const styles = {
    blue:
      "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50",

    green:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50",

    purple:
      "border-purple-200 bg-gradient-to-br from-purple-50 via-white to-violet-50",

    amber:
      "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50",

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

      <div className="mt-2 text-3xl font-black text-slate-900">
        {value}
      </div>

    </div>
  );
}

function StatusBadge({
  status,
}: {
  status:
    PriceStatus;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${
        status ===
        "Active"
          ? "bg-green-100 text-green-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function CategoryBadge({
  category,
}: {
  category:
    string;
}) {
  let style =
    "bg-slate-100 text-slate-700";

  if (
    category ===
    "Embroidery"
  ) {
    style =
      "bg-purple-100 text-purple-700";
  } else if (
    category ===
    "Digitizing"
  ) {
    style =
      "bg-indigo-100 text-indigo-700";
  } else if (
    category ===
    "Garment / Apparel"
  ) {
    style =
      "bg-blue-100 text-blue-700";
  } else if (
    category ===
    "Embroidered Product"
  ) {
    style =
      "bg-emerald-100 text-emerald-700";
  } else if (
    category ===
    "Personalization"
  ) {
    style =
      "bg-amber-100 text-amber-700";
  } else if (
    category ===
    "Additional Services"
  ) {
    style =
      "bg-rose-100 text-rose-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${style}`}
    >
      {category}
    </span>
  );
}
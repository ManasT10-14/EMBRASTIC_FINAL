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

type SupplierStatus =
  | "Active"
  | "Inactive"
  | "Blocked";

type Supplier = {
  id: string;

  supplierCode: string;

  supplierName: string;

  contactPerson: string;

  phone: string;
  alternatePhone: string;

  email: string;

  gstin: string;
  pan: string;

  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;

  paymentTermsDays: number;
  leadTimeDays: number;

  categories: string;

  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  ifscCode: string;
  upiId: string;

  notes: string;

  status: SupplierStatus;

  createdAt: string;
  updatedAt: string;

  [key: string]: any;
};

type SupplierForm = {
  supplierCode: string;

  supplierName: string;

  contactPerson: string;

  phone: string;
  alternatePhone: string;

  email: string;

  gstin: string;
  pan: string;

  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;

  paymentTermsDays: number;
  leadTimeDays: number;

  categories: string;

  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  ifscCode: string;
  upiId: string;

  notes: string;

  status: SupplierStatus;
};

type PurchaseOrder = {
  id: string;

  purchaseOrderNumber: string;

  supplierId: string;
  supplierCode: string;
  supplierName: string;

  poDate: string;
  expectedDeliveryDate: string;

  totalAmount: number;

  receivedQuantity: number;
  pendingQuantity: number;

  status: string;

  createdAt: string;
  updatedAt: string;

  [key: string]: any;
};

/* =========================================================
   CONSTANTS
========================================================= */

const STATUSES:
  SupplierStatus[] = [
  "Active",
  "Inactive",
  "Blocked",
];

const SUPPLIER_CATEGORIES = [
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
  "Digitizing Service",
  "Machine Service",
  "Courier / Logistics",
  "Other",
];

/* =========================================================
   EMPTY FORM
========================================================= */

function emptyForm():
  SupplierForm {
  return {
    supplierCode: "",

    supplierName: "",

    contactPerson: "",

    phone: "",
    alternatePhone: "",

    email: "",

    gstin: "",
    pan: "",

    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",

    paymentTermsDays: 30,
    leadTimeDays: 7,

    categories: "",

    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    ifscCode: "",
    upiId: "",

    notes: "",

    status: "Active",
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
  a: unknown,
  b: unknown
) {
  const first =
    normalizeText(a);

  const second =
    normalizeText(b);

  return Boolean(
    first &&
      second &&
      first ===
        second
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

function generateId() {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `supplier-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function getNow() {
  return new Date()
    .toISOString();
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
   VALIDATION HELPERS
========================================================= */

function validEmail(
  value: string
) {
  if (
    !value.trim()
  ) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim()
  );
}

function validIndianPhone(
  value: string
) {
  if (
    !value.trim()
  ) {
    return true;
  }

  const digits =
    value.replace(
      /\D/g,
      ""
    );

  return (
    digits.length >=
      10 &&
    digits.length <=
      13
  );
}

function validGSTIN(
  value: string
) {
  if (
    !value.trim()
  ) {
    return true;
  }

  return /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[A-Z0-9]$/.test(
    value
      .trim()
      .toUpperCase()
  );
}

function validPAN(
  value: string
) {
  if (
    !value.trim()
  ) {
    return true;
  }

  return /^[A-Z]{5}\d{4}[A-Z]$/.test(
    value
      .trim()
      .toUpperCase()
  );
}

function validIFSC(
  value: string
) {
  if (
    !value.trim()
  ) {
    return true;
  }

  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(
    value
      .trim()
      .toUpperCase()
  );
}

/* =========================================================
   NORMALIZE SUPPLIER
========================================================= */

function normalizeSupplier(
  row: any
):
  Supplier {
  const rawStatus =
    clean(
      row?.status
    );

  const status:
    SupplierStatus =
    rawStatus ===
      "Inactive"
      ? "Inactive"
      : rawStatus ===
        "Blocked"
      ? "Blocked"
      : "Active";

  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    supplierCode:
      clean(
        row?.supplierCode ??
          row?.code
      ),

    supplierName:
      clean(
        row?.supplierName ??
          row?.name
      ),

    contactPerson:
      clean(
        row?.contactPerson
      ),

    phone:
      clean(
        row?.phone
      ),

    alternatePhone:
      clean(
        row?.alternatePhone
      ),

    email:
      clean(
        row?.email
      ),

    gstin:
      clean(
        row?.gstin ??
          row?.gstNumber
      ).toUpperCase(),

    pan:
      clean(
        row?.pan
      ).toUpperCase(),

    address:
      clean(
        row?.address
      ),

    city:
      clean(
        row?.city
      ),

    state:
      clean(
        row?.state
      ),

    postalCode:
      clean(
        row?.postalCode ??
          row?.pincode
      ),

    country:
      clean(
        row?.country
      ) ||
      "India",

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

    categories:
      clean(
        row?.categories
      ),

    bankName:
      clean(
        row?.bankName
      ),

    bankAccountName:
      clean(
        row?.bankAccountName ??
          row?.accountName
      ),

    bankAccountNumber:
      clean(
        row?.bankAccountNumber ??
          row?.accountNumber
      ),

    ifscCode:
      clean(
        row?.ifscCode ??
          row?.ifsc
      ).toUpperCase(),

    upiId:
      clean(
        row?.upiId
      ),

    notes:
      clean(
        row?.notes
      ),

    status,

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
   NORMALIZE PURCHASE ORDER
========================================================= */

function normalizePO(
  row: any
):
  PurchaseOrder {
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

    poDate:
      dateOnly(
        row?.poDate
      ),

    expectedDeliveryDate:
      dateOnly(
        row?.expectedDeliveryDate
      ),

    totalAmount:
      numberValue(
        row?.totalAmount
      ),

    receivedQuantity:
      numberValue(
        row?.receivedQuantity
      ),

    pendingQuantity:
      numberValue(
        row?.pendingQuantity
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

/* =========================================================
   PAGE
========================================================= */

export default function SuppliersPage() {
  const [
    suppliers,
    setSuppliers,
  ] =
    useState<
      Supplier[]
    >([]);

  const [
    purchaseOrders,
    setPurchaseOrders,
  ] =
    useState<
      PurchaseOrder[]
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
      Supplier | null
    >(
      null
    );

  const [
    viewing,
    setViewing,
  ] =
    useState<
      Supplier | null
    >(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<
      SupplierForm
    >(
      emptyForm()
    );

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
     BODY LOCK
  ======================================================= */

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
    sheet:
      string
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
    body:
      any
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
        data?.message ||
          data?.error ||
          "Unable to process Supplier request."
      );
    }

    return data;
  }

  /* =======================================================
     LOAD DATA
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
        poRows,
        settings,
      ] =
        await Promise.all([
          loadSheet(
            "Suppliers"
          ),

          loadSheet(
            "PurchaseOrders"
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
                supplier.id ||
                  supplier.supplierName
              )
          )
          .sort(
            (
              a,
              b
            ) =>
              a.supplierName.localeCompare(
                b.supplierName
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
      );

      setAppSettings(
        settings
      );
    } catch (
      error
    ) {
      console.error(
        "Supplier load error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to load Suppliers."
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
     SUPPLIER CODE
  ======================================================= */

  function calculateNextSupplierCode(
    source:
      Supplier[] =
      suppliers
  ) {
    let highest =
      0;

    source.forEach(
      (
        supplier
      ) => {
        const match =
          supplier.supplierCode.match(
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

    return `SUP-${String(
      highest +
        1
    ).padStart(
      4,
      "0"
    )}`;
  }

  /* =======================================================
     FORM
  ======================================================= */

  function openCreate() {
    setEditing(
      null
    );

    setForm({
      ...emptyForm(),

      supplierCode:
        calculateNextSupplierCode(),
    });

    setShowForm(
      true
    );
  }

  function openEdit(
    supplier:
      Supplier
  ) {
    setEditing(
      supplier
    );

    setForm({
      supplierCode:
        supplier.supplierCode,

      supplierName:
        supplier.supplierName,

      contactPerson:
        supplier.contactPerson,

      phone:
        supplier.phone,

      alternatePhone:
        supplier.alternatePhone,

      email:
        supplier.email,

      gstin:
        supplier.gstin,

      pan:
        supplier.pan,

      address:
        supplier.address,

      city:
        supplier.city,

      state:
        supplier.state,

      postalCode:
        supplier.postalCode,

      country:
        supplier.country,

      paymentTermsDays:
        supplier.paymentTermsDays,

      leadTimeDays:
        supplier.leadTimeDays,

      categories:
        supplier.categories,

      bankName:
        supplier.bankName,

      bankAccountName:
        supplier.bankAccountName,

      bankAccountNumber:
        supplier.bankAccountNumber,

      ifscCode:
        supplier.ifscCode,

      upiId:
        supplier.upiId,

      notes:
        supplier.notes,

      status:
        supplier.status,
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
     CATEGORY HELPERS
  ======================================================= */

  const selectedCategories =
    useMemo(
      () =>
        clean(
          form.categories
        )
          .split(",")
          .map(
            (
              value
            ) =>
              value.trim()
          )
          .filter(Boolean),
      [
        form.categories,
      ]
    );

  function toggleCategory(
    category:
      string
  ) {
    const current =
      selectedCategories;

    const exists =
      current.some(
        (
          item
        ) =>
          sameText(
            item,
            category
          )
      );

    const next =
      exists
        ? current.filter(
            (
              item
            ) =>
              !sameText(
                item,
                category
              )
          )
        : [
            ...current,
            category,
          ];

    setForm(
      (
        old
      ) => ({
        ...old,

        categories:
          next.join(
            ", "
          ),
      })
    );
  }

  /* =======================================================
     DUPLICATE PREVIEW
  ======================================================= */

  const possibleDuplicate =
    useMemo(
      () => {
        return suppliers.find(
          (
            supplier
          ) => {
            if (
              supplier.id ===
              editing?.id
            ) {
              return false;
            }

            if (
              form.gstin &&
              supplier.gstin &&
              sameText(
                supplier.gstin,
                form.gstin
              )
            ) {
              return true;
            }

            return (
              form.supplierName &&
              sameText(
                supplier.supplierName,
                form.supplierName
              )
            );
          }
        );
      },
      [
        suppliers,
        form.supplierName,
        form.gstin,
        editing,
      ]
    );

  /* =======================================================
     VALIDATE
  ======================================================= */

  function validateForm() {
    if (
      !form.supplierCode.trim()
    ) {
      alert(
        "Supplier Code is required."
      );

      return false;
    }

    if (
      !form.supplierName.trim()
    ) {
      alert(
        "Supplier Name is required."
      );

      return false;
    }

    if (
      !form.phone.trim() &&
      !form.email.trim()
    ) {
      alert(
        "Enter at least a Phone Number or Email."
      );

      return false;
    }

    if (
      !validIndianPhone(
        form.phone
      )
    ) {
      alert(
        "Please enter a valid Phone Number."
      );

      return false;
    }

    if (
      !validIndianPhone(
        form.alternatePhone
      )
    ) {
      alert(
        "Please enter a valid Alternate Phone Number."
      );

      return false;
    }

    if (
      !validEmail(
        form.email
      )
    ) {
      alert(
        "Please enter a valid Email Address."
      );

      return false;
    }

    if (
      !validGSTIN(
        form.gstin
      )
    ) {
      alert(
        "GSTIN format appears invalid."
      );

      return false;
    }

    if (
      !validPAN(
        form.pan
      )
    ) {
      alert(
        "PAN format appears invalid."
      );

      return false;
    }

    if (
      !validIFSC(
        form.ifscCode
      )
    ) {
      alert(
        "IFSC Code format appears invalid."
      );

      return false;
    }

    if (
      form.paymentTermsDays <
      0
    ) {
      alert(
        "Payment Terms cannot be negative."
      );

      return false;
    }

    if (
      form.leadTimeDays <
      0
    ) {
      alert(
        "Lead Time cannot be negative."
      );

      return false;
    }

    return true;
  }

  /* =======================================================
     SAVE
  ======================================================= */

  async function saveSupplier() {
    if (
      !validateForm()
    ) {
      return;
    }

    try {
      setSaving(
        true
      );

      /*
       * Reload the live supplier sheet immediately before
       * saving to reduce duplicate master creation.
       */
      const liveRows =
        await loadSheet(
          "Suppliers"
        );

      const liveSuppliers =
        liveRows
          .map(
            normalizeSupplier
          )
          .filter(
            (
              supplier:
                Supplier
            ) =>
              Boolean(
                supplier.id ||
                  supplier.supplierName
              )
          );

      /*
       * Existing supplier code becomes permanent.
       */
      const supplierCode =
        editing
          ? editing.supplierCode
          : form.supplierCode.trim() ||
            calculateNextSupplierCode(
              liveSuppliers
            );

      const duplicateCode =
        liveSuppliers.find(
          (
            supplier
          ) =>
            supplier.id !==
              editing?.id &&
            sameText(
              supplier.supplierCode,
              supplierCode
            )
        );

      if (
        duplicateCode
      ) {
        /*
         * If auto-generated code collided because another
         * user saved first, calculate again.
         */
        if (
          !editing
        ) {
          throw new Error(
            `Supplier Code ${supplierCode} already exists. Close and reopen Add Supplier to generate the next code.`
          );
        }

        throw new Error(
          "Supplier Code already exists."
        );
      }

      if (
        form.gstin.trim()
      ) {
        const duplicateGSTIN =
          liveSuppliers.find(
            (
              supplier
            ) =>
              supplier.id !==
                editing?.id &&
              supplier.gstin &&
              sameText(
                supplier.gstin,
                form.gstin
              )
          );

        if (
          duplicateGSTIN
        ) {
          throw new Error(
            `GSTIN ${form.gstin.toUpperCase()} is already used by ${duplicateGSTIN.supplierName} (${duplicateGSTIN.supplierCode}).`
          );
        }
      }

      const duplicateName =
        liveSuppliers.find(
          (
            supplier
          ) =>
            supplier.id !==
              editing?.id &&
            sameText(
              supplier.supplierName,
              form.supplierName
            )
        );

      if (
        duplicateName
      ) {
        const proceed =
          confirm(
            `A supplier named "${duplicateName.supplierName}" already exists as ${duplicateName.supplierCode}.\n\nAre you certain this is a different supplier?`
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

      const now =
        getNow();

      const record = {
        supplierCode:
          supplierCode.toUpperCase(),

        supplierName:
          form.supplierName.trim(),

        contactPerson:
          form.contactPerson.trim(),

        phone:
          form.phone.trim(),

        alternatePhone:
          form.alternatePhone.trim(),

        email:
          form.email
            .trim()
            .toLowerCase(),

        gstin:
          form.gstin
            .trim()
            .toUpperCase(),

        pan:
          form.pan
            .trim()
            .toUpperCase(),

        address:
          form.address.trim(),

        city:
          form.city.trim(),

        state:
          form.state.trim(),

        postalCode:
          form.postalCode.trim(),

        country:
          form.country.trim() ||
          "India",

        paymentTermsDays:
          Number(
            form.paymentTermsDays
          ),

        leadTimeDays:
          Number(
            form.leadTimeDays
          ),

        categories:
          form.categories.trim(),

        bankName:
          form.bankName.trim(),

        bankAccountName:
          form.bankAccountName.trim(),

        bankAccountNumber:
          form.bankAccountNumber.trim(),

        ifscCode:
          form.ifscCode
            .trim()
            .toUpperCase(),

        upiId:
          form.upiId.trim(),

        notes:
          form.notes.trim(),

        status:
          form.status,

        updatedAt:
          now,
      };

      await saveExcel({
        action:
          editing
            ? "update"
            : "add",

        sheet:
          "Suppliers",

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

                /*
                 * Force permanent code.
                 */
                supplierCode:
                  editing.supplierCode,
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
          ? `${supplierCode} updated successfully.`
          : `${supplierCode} created successfully.`
      );
    } catch (
      error
    ) {
      console.error(
        "Supplier save error:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to save Supplier."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     SUPPLIER PURCHASE ORDERS
  ======================================================= */

  function supplierPOs(
    supplier:
      Supplier
  ) {
    return purchaseOrders
      .filter(
        (
          po
        ) =>
          (
            po.supplierId &&
            sameText(
              po.supplierId,
              supplier.id
            )
          ) ||
          (
            po.supplierCode &&
            sameText(
              po.supplierCode,
              supplier.supplierCode
            )
          )
      )
      .sort(
        (
          a,
          b
        ) =>
          String(
            b.poDate ||
              b.createdAt
          ).localeCompare(
            String(
              a.poDate ||
                a.createdAt
            )
          )
      );
  }

  function supplierOpenPOs(
    supplier:
      Supplier
  ) {
    return supplierPOs(
      supplier
    ).filter(
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
  }

  function supplierOpenPOValue(
    supplier:
      Supplier
  ) {
    return supplierOpenPOs(
      supplier
    ).reduce(
      (
        total,
        po
      ) =>
        total +
        po.totalAmount,
      0
    );
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function deleteSupplier(
    supplier:
      Supplier
  ) {
    const linkedPOs =
      supplierPOs(
        supplier
      );

    if (
      linkedPOs.length >
      0
    ) {
      alert(
        `${supplier.supplierName} has ${linkedPOs.length} Purchase Order${linkedPOs.length === 1 ? "" : "s"}.\n\nDo not delete this Supplier Master. Set the Supplier Status to Inactive or Blocked instead so historical Purchase Orders remain traceable.`
      );

      return;
    }

    if (
      !confirm(
        `Delete ${supplier.supplierName} (${supplier.supplierCode})?`
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
          "Suppliers",

        id:
          supplier.id,
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
          : "Unable to delete Supplier."
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

        return suppliers.filter(
          (
            supplier
          ) => {
            const statusOK =
              statusFilter ===
                "All" ||
              supplier.status ===
                statusFilter;

            const text =
              [
                supplier.supplierCode,

                supplier.supplierName,

                supplier.contactPerson,

                supplier.phone,

                supplier.alternatePhone,

                supplier.email,

                supplier.gstin,

                supplier.pan,

                supplier.categories,

                supplier.city,

                supplier.state,

                supplier.bankName,

                supplier.upiId,
              ]
                .join(
                  " "
                )
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
        suppliers,
        search,
        statusFilter,
      ]
    );

  /* =======================================================
     STATS
  ======================================================= */

  const statistics =
    useMemo(
      () => {
        const active =
          suppliers.filter(
            (
              supplier
            ) =>
              supplier.status ===
              "Active"
          ).length;

        const inactive =
          suppliers.filter(
            (
              supplier
            ) =>
              supplier.status ===
              "Inactive"
          ).length;

        const blocked =
          suppliers.filter(
            (
              supplier
            ) =>
              supplier.status ===
              "Blocked"
          ).length;

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

        return {
          active,
          inactive,
          blocked,
          openPOValue,
        };
      },
      [
        suppliers,
        purchaseOrders,
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

            <div className="mb-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-indigo-700">
              Procurement Master
            </div>

            <h1 className="text-3xl font-black">
              Suppliers
            </h1>

            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
              Maintain permanent Supplier Masters,
              purchase terms, tax information,
              material categories and payment details.
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
              className="rounded-xl bg-indigo-700 px-5 py-3 font-black text-white hover:bg-indigo-800"
            >
              + Add Supplier
            </button>

          </div>

        </div>

        {/* MASTER RULE */}

        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-purple-50 p-5">

          <div className="font-black text-indigo-900">
            🏭 Supplier Master Rule
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Create each supplier once and reuse the
            same Supplier Code for every Purchase Order.
            If you stop buying from a supplier, mark
            them Inactive instead of creating or deleting
            historical records.
          </p>

        </div>

        {/* STATS */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <StatCard
            label="Total Suppliers"
            value={String(
              suppliers.length
            )}
            caption="Supplier masters"
            tone="blue"
          />

          <StatCard
            label="Active"
            value={String(
              statistics.active
            )}
            caption="Available for purchasing"
            tone="green"
          />

          <StatCard
            label="Inactive"
            value={String(
              statistics.inactive
            )}
            caption="Temporarily unavailable"
            tone="amber"
          />

          <StatCard
            label="Blocked"
            value={String(
              statistics.blocked
            )}
            caption="Not permitted for POs"
            tone="red"
          />

          <StatCard
            label="Open PO Value"
            value={money(
              statistics.openPOValue,
              appSettings.currencySymbol ||
                "₹"
            )}
            caption="Outstanding procurement"
            tone="violet"
          />

        </div>

        {/* SEARCH */}

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
            placeholder="Search supplier, code, GSTIN, PAN, category, city..."
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

            {STATUSES.map(
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
              Loading Suppliers...
            </div>

          ) : filtered.length ===
            0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl">
                🏭
              </div>

              <h2 className="mt-4 text-xl font-black">
                No Suppliers Found
              </h2>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1350px] text-left text-sm">

                <thead>

                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                    <th className="px-4 py-4">
                      Supplier
                    </th>

                    <th className="px-4 py-4">
                      Contact
                    </th>

                    <th className="px-4 py-4">
                      GSTIN
                    </th>

                    <th className="px-4 py-4">
                      Categories
                    </th>

                    <th className="px-4 py-4">
                      Terms
                    </th>

                    <th className="px-4 py-4">
                      Lead Time
                    </th>

                    <th className="px-4 py-4">
                      Open POs
                    </th>

                    <th className="px-4 py-4">
                      Open Value
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
                      supplier
                    ) => {
                      const openPOs =
                        supplierOpenPOs(
                          supplier
                        );

                      const openValue =
                        supplierOpenPOValue(
                          supplier
                        );

                      return (

                        <tr
                          key={
                            supplier.id
                          }
                          className="border-b last:border-0 hover:bg-slate-50"
                        >

                          <td className="px-4 py-4">

                            <div className="font-black text-indigo-700">
                              {
                                supplier.supplierName
                              }
                            </div>

                            <div className="mt-1 font-mono text-xs font-bold text-slate-400">
                              {
                                supplier.supplierCode
                              }
                            </div>

                          </td>

                          <td className="px-4 py-4">

                            <div className="font-semibold">
                              {
                                supplier.contactPerson ||
                                "—"
                              }
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {
                                supplier.phone ||
                                supplier.email ||
                                "—"
                              }
                            </div>

                          </td>

                          <td className="px-4 py-4 font-mono text-xs">
                            {
                              supplier.gstin ||
                              "—"
                            }
                          </td>

                          <td className="max-w-[220px] px-4 py-4">
                            {
                              supplier.categories ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-4">
                            {
                              supplier.paymentTermsDays
                            }{" "}
                            days
                          </td>

                          <td className="px-4 py-4">
                            {
                              supplier.leadTimeDays
                            }{" "}
                            days
                          </td>

                          <td className="px-4 py-4">

                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                              {
                                openPOs.length
                              }
                            </span>

                          </td>

                          <td className="px-4 py-4 font-black text-emerald-700">
                            {money(
                              openValue,
                              appSettings.currencySymbol ||
                                "₹"
                            )}
                          </td>

                          <td className="px-4 py-4">

                            <StatusBadge
                              status={
                                supplier.status
                              }
                            />

                          </td>

                          <td className="px-4 py-4">

                            <div className="flex gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  setViewing(
                                    supplier
                                  )
                                }
                                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold"
                              >
                                View
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    supplier
                                  )
                                }
                                className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void deleteSupplier(
                                    supplier
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

      {/* =================================================
          CREATE / EDIT MODAL
      ================================================= */}

      {showForm && (

        <ModalOverlay>

          <div className="my-5 flex max-h-[calc(100vh-2.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

            <ModalHeader
              title={
                editing
                  ? "Edit Supplier"
                  : "Add Supplier"
              }
              caption="Supplier Master"
              onClose={
                closeForm
              }
            />

            <div className="min-h-0 flex-1 overflow-y-auto p-6">

              <div className="space-y-6">

                {/* DUPLICATE WARNING */}

                {possibleDuplicate &&
                  !editing && (

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                    <div className="font-black text-amber-900">
                      Possible Existing Supplier
                    </div>

                    <p className="mt-1 text-sm text-amber-700">
                      {
                        possibleDuplicate.supplierName
                      }{" "}
                      already exists as{" "}
                      <strong>
                        {
                          possibleDuplicate.supplierCode
                        }
                      </strong>.
                      Check before creating another master.
                    </p>

                  </div>

                )}

                {/* IDENTITY */}

                <Section
                  title="Supplier Identity"
                  description="Core permanent supplier information."
                >

                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

                    <Field
                      label="Supplier Code *"
                      caption={
                        editing
                          ? "Permanent code. Locked after Supplier creation."
                          : "Automatically generated permanent Supplier Code."
                      }
                    >

                      <input
                        value={
                          editing
                            ? editing.supplierCode
                            : form.supplierCode
                        }
                        readOnly
                        className="w-full rounded-xl border bg-slate-100 px-4 py-3 font-mono font-black text-indigo-700"
                      />

                    </Field>

                    <Input
                      label="Supplier Name *"
                      caption="Registered or trading supplier name."
                      value={
                        form.supplierName
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          supplierName:
                            value,
                        })
                      }
                    />

                    <Input
                      label="Contact Person"
                      caption="Primary purchasing contact."
                      value={
                        form.contactPerson
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          contactPerson:
                            value,
                        })
                      }
                    />

                    <Input
                      label="Phone"
                      caption="Primary supplier phone number."
                      value={
                        form.phone
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          phone:
                            value,
                        })
                      }
                    />

                    <Input
                      label="Alternate Phone"
                      caption="Optional secondary contact."
                      value={
                        form.alternatePhone
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          alternatePhone:
                            value,
                        })
                      }
                    />

                    <Input
                      label="Email"
                      caption="Supplier purchasing / accounts email."
                      value={
                        form.email
                      }
                      type="email"
                      set={(value) =>
                        setForm({
                          ...form,

                          email:
                            value,
                        })
                      }
                    />

                  </div>

                </Section>

                {/* TAX */}

                <Section
                  title="Tax & Commercial Terms"
                  description="Supplier registration, credit terms and expected lead time."
                >

                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

                    <Input
                      label="GSTIN"
                      caption="Supplier GST registration number."
                      value={
                        form.gstin
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          gstin:
                            value.toUpperCase(),
                        })
                      }
                    />

                    <Input
                      label="PAN"
                      caption="Supplier PAN."
                      value={
                        form.pan
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          pan:
                            value.toUpperCase(),
                        })
                      }
                    />

                    <NumberInput
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

                    <NumberInput
                      label="Lead Time (Days)"
                      caption="Default expected purchase lead time."
                      value={
                        form.leadTimeDays
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          leadTimeDays:
                            value,
                        })
                      }
                    />

                  </div>

                </Section>

                {/* SUPPLY SCOPE */}

                <Section
                  title="Supply Scope"
                  description="Define what this supplier normally supplies. These categories help with purchasing and supplier selection."
                >

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">

                    {SUPPLIER_CATEGORIES.map(
                      (
                        category
                      ) => {
                        const checked =
                          selectedCategories.some(
                            (
                              item
                            ) =>
                              sameText(
                                item,
                                category
                              )
                          );

                        return (

                          <label
                            key={
                              category
                            }
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-semibold ${
                              checked
                                ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                                : "bg-white"
                            }`}
                          >

                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              onChange={() =>
                                toggleCategory(
                                  category
                                )
                              }
                            />

                            <span>
                              {
                                category
                              }
                            </span>

                          </label>

                        );
                      }
                    )}

                  </div>

                  <div className="mt-4">

                    <Field
                      label="Categories"
                      caption="Comma-separated categories. You may also type additional categories manually."
                    >

                      <input
                        value={
                          form.categories
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,

                            categories:
                              e.target.value,
                          })
                        }
                        placeholder="e.g. Embroidery Thread, Stabilizer, Garment / Blank"
                        className="w-full rounded-xl border px-4 py-3"
                      />

                    </Field>

                  </div>

                </Section>

                {/* ADDRESS */}

                <Section
                  title="Address"
                  description="Supplier registered, billing or dispatch address."
                >

                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

                    <div className="md:col-span-2 lg:col-span-4">

                      <Field
                        label="Address"
                        caption="Street / building / industrial area."
                      >

                        <textarea
                          value={
                            form.address
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              address:
                                e.target.value,
                            })
                          }
                          className="min-h-24 w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                    </div>

                    <Input
                      label="City"
                      caption="Supplier city."
                      value={
                        form.city
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          city:
                            value,
                        })
                      }
                    />

                    <Input
                      label="State"
                      caption="Supplier state."
                      value={
                        form.state
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          state:
                            value,
                        })
                      }
                    />

                    <Input
                      label="Postal Code"
                      caption="PIN / postal code."
                      value={
                        form.postalCode
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          postalCode:
                            value,
                        })
                      }
                    />

                    <Input
                      label="Country"
                      caption="Supplier country."
                      value={
                        form.country
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          country:
                            value,
                        })
                      }
                    />

                  </div>

                </Section>

                {/* BANK */}

                <Section
                  title="Supplier Payment Details"
                  description="Stored for future supplier payables and payment processing. These fields are not used to move money automatically."
                >

                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

                    <Input
                      label="Bank Name"
                      caption="Supplier's bank."
                      value={
                        form.bankName
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          bankName:
                            value,
                        })
                      }
                    />

                    <Input
                      label="Account Name"
                      caption="Beneficiary / account holder."
                      value={
                        form.bankAccountName
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          bankAccountName:
                            value,
                        })
                      }
                    />

                    <Input
                      label="Account Number"
                      caption="Supplier bank account number."
                      value={
                        form.bankAccountNumber
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          bankAccountNumber:
                            value,
                        })
                      }
                    />

                    <Input
                      label="IFSC Code"
                      caption="Indian bank IFSC where applicable."
                      value={
                        form.ifscCode
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          ifscCode:
                            value.toUpperCase(),
                        })
                      }
                    />

                    <Input
                      label="UPI ID"
                      caption="Optional supplier UPI ID."
                      value={
                        form.upiId
                      }
                      set={(value) =>
                        setForm({
                          ...form,

                          upiId:
                            value,
                        })
                      }
                    />

                  </div>

                </Section>

                {/* STATUS */}

                <Section
                  title="Status & Notes"
                  description="Control whether this Supplier can be selected for new Purchase Orders."
                >

                  <div className="grid gap-5 md:grid-cols-2">

                    <Field
                      label="Status"
                      caption="Only Active suppliers should be used for new Purchase Orders."
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
                                .value as SupplierStatus,
                          })
                        }
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      >

                        {STATUSES.map(
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

                    <Field
                      label="Notes"
                      caption="Quality notes, buying instructions or other internal comments."
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

            <div className="flex shrink-0 justify-end gap-3 border-t bg-white p-5">

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
                  void saveSupplier()
                }
                disabled={
                  saving
                }
                className="rounded-xl bg-indigo-700 px-6 py-3 font-black text-white hover:bg-indigo-800 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editing
                  ? "Update Supplier"
                  : "Save Supplier"}
              </button>

            </div>

          </div>

        </ModalOverlay>

      )}

      {/* =================================================
          VIEW SUPPLIER
      ================================================= */}

      {viewing && (

        <ModalOverlay>

          <div className="my-8 max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <ModalHeader
              title={
                viewing.supplierName
              }
              caption={`${viewing.supplierCode} · Supplier 360°`}
              onClose={() =>
                setViewing(
                  null
                )
              }
            />

            <div className="space-y-6 p-6">

              {/* SUMMARY */}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                <Info
                  label="Status"
                  value={
                    viewing.status
                  }
                />

                <Info
                  label="Payment Terms"
                  value={`${viewing.paymentTermsDays} days`}
                />

                <Info
                  label="Lead Time"
                  value={`${viewing.leadTimeDays} days`}
                />

                <Info
                  label="Open PO Value"
                  value={money(
                    supplierOpenPOValue(
                      viewing
                    ),
                    appSettings.currencySymbol ||
                      "₹"
                  )}
                />

              </div>

              {/* CONTACT */}

              <Section
                title="Supplier Details"
                description="Identity, contact and tax registration."
              >

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                  <Info
                    label="Supplier Code"
                    value={
                      viewing.supplierCode
                    }
                  />

                  <Info
                    label="Contact"
                    value={
                      viewing.contactPerson ||
                      "—"
                    }
                  />

                  <Info
                    label="Phone"
                    value={
                      viewing.phone ||
                      "—"
                    }
                  />

                  <Info
                    label="Alternate Phone"
                    value={
                      viewing.alternatePhone ||
                      "—"
                    }
                  />

                  <Info
                    label="Email"
                    value={
                      viewing.email ||
                      "—"
                    }
                  />

                  <Info
                    label="GSTIN"
                    value={
                      viewing.gstin ||
                      "—"
                    }
                  />

                  <Info
                    label="PAN"
                    value={
                      viewing.pan ||
                      "—"
                    }
                  />

                  <Info
                    label="Categories"
                    value={
                      viewing.categories ||
                      "—"
                    }
                  />

                  <Info
                    label="Location"
                    value={
                      [
                        viewing.city,
                        viewing.state,
                        viewing.country,
                      ]
                        .filter(Boolean)
                        .join(", ") ||
                      "—"
                    }
                  />

                </div>

              </Section>

              {/* PAYMENT DETAILS */}

              <Section
                title="Payment Details"
                description="Supplier beneficiary information."
              >

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                  <Info
                    label="Bank"
                    value={
                      viewing.bankName ||
                      "—"
                    }
                  />

                  <Info
                    label="Account Name"
                    value={
                      viewing.bankAccountName ||
                      "—"
                    }
                  />

                  <Info
                    label="Account Number"
                    value={
                      viewing.bankAccountNumber ||
                      "—"
                    }
                  />

                  <Info
                    label="IFSC"
                    value={
                      viewing.ifscCode ||
                      "—"
                    }
                  />

                  <Info
                    label="UPI ID"
                    value={
                      viewing.upiId ||
                      "—"
                    }
                  />

                </div>

              </Section>

              {/* PURCHASE ORDERS */}

              <Section
                title="Purchase Order History"
                description="Purchase Orders placed with this Supplier."
              >

                {supplierPOs(
                  viewing
                ).length ===
                  0 ? (

                  <div className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">
                    No Purchase Orders recorded for this Supplier.
                  </div>

                ) : (

                  <div className="overflow-x-auto rounded-xl border bg-white">

                    <table className="w-full min-w-[800px] text-left text-sm">

                      <thead>

                        <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                          <th className="px-4 py-3">
                            PO Number
                          </th>

                          <th className="px-4 py-3">
                            PO Date
                          </th>

                          <th className="px-4 py-3">
                            Expected
                          </th>

                          <th className="px-4 py-3">
                            Pending Qty
                          </th>

                          <th className="px-4 py-3">
                            Value
                          </th>

                          <th className="px-4 py-3">
                            Status
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {supplierPOs(
                          viewing
                        ).map(
                          (
                            po
                          ) => (

                            <tr
                              key={
                                po.id
                              }
                              className="border-b last:border-0"
                            >

                              <td className="px-4 py-3 font-black text-amber-700">
                                {
                                  po.purchaseOrderNumber
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  po.poDate ||
                                  "—"
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  po.expectedDeliveryDate ||
                                  "—"
                                }
                              </td>

                              <td className="px-4 py-3 font-bold">
                                {
                                  po.pendingQuantity
                                }
                              </td>

                              <td className="px-4 py-3 font-black">
                                {money(
                                  po.totalAmount,
                                  appSettings.currencySymbol ||
                                    "₹"
                                )}
                              </td>

                              <td className="px-4 py-3">

                                <POStatusBadge
                                  status={
                                    po.status
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

              </Section>

              {/* ADDRESS */}

              <Section
                title="Address & Notes"
                description="Supplier address and internal information."
              >

                <div className="grid gap-4 md:grid-cols-2">

                  <Info
                    label="Address"
                    value={
                      [
                        viewing.address,
                        viewing.city,
                        viewing.state,
                        viewing.postalCode,
                        viewing.country,
                      ]
                        .filter(Boolean)
                        .join(", ") ||
                      "—"
                    }
                  />

                  <Info
                    label="Notes"
                    value={
                      viewing.notes ||
                      "—"
                    }
                  />

                </div>

              </Section>

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

        <div className="text-xs font-black uppercase tracking-wide text-indigo-600">
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
  type = "text",
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

  type?:
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
        type={
          type
        }
        value={
          value
        }
        onChange={(e) =>
          set(
            e.target.value
          )
        }
        className="w-full rounded-xl border px-4 py-3"
      />

    </Field>
  );
}

function NumberInput({
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
        className="w-full rounded-xl border px-4 py-3"
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

      <div className="mt-1 break-words text-sm font-black text-slate-900">
        {value ||
          "—"}
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
    | "blue"
    | "green"
    | "amber"
    | "red"
    | "violet";
}) {
  const styles = {
    blue:
      "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-blue-900",

    green:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 text-emerald-900",

    amber:
      "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 text-amber-900",

    red:
      "border-red-200 bg-gradient-to-br from-red-50 via-white to-rose-50 text-red-900",

    violet:
      "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 text-violet-900",
  };

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        styles[
          tone
        ]
      }`}
    >

      <div className="text-xs font-bold uppercase text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-3xl font-black">
        {value}
      </div>

      <div className="mt-1 text-xs text-slate-500">
        {caption}
      </div>

    </div>
  );
}

function StatusBadge({
  status,
}: {
  status:
    SupplierStatus;
}) {
  const normalized =
    normalizeText(
      status
    );

  const style =
    normalized ===
    "active"
      ? "bg-green-100 text-green-700"
      : normalized ===
        "blocked"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${style}`}
    >
      {status ||
        "Active"}
    </span>
  );
}

function POStatusBadge({
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
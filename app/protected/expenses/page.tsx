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

type Expense = {
  id: string;

  date: string;

  category: string;

  description: string;

  amount: number;

  paymentMethod: string;

  reference: string;

  supplier: string;

  inventoryTransactionId: string;

  inventoryId: string;

  sku: string;

  itemName: string;

  quantity: number;

  unit: string;

  unitCost: number;

  notes: string;

  createdAt: string;

  updatedAt?: string;
};

type InventoryItem = {
  id: string;

  name: string;

  category: string;

  sku: string;

  brand: string;

  color: string;

  colorCode: string;

  size: string;

  variant: string;

  quantity: number;

  unit: string;

  minimumStock: number;

  price: number;

  supplier: string;

  notes: string;

  createdAt: string;

  updatedAt?: string;

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
};

type ExpenseForm = {
  date: string;

  category: string;

  description: string;

  amount: number;

  paymentMethod: string;

  reference: string;

  supplier: string;

  notes: string;

  /* INVENTORY PURCHASE */

  inventoryId: string;

  quantity: number;

  unitCost: number;
};

/* =========================================================
   OPTIONS
========================================================= */

const RECOMMENDED_CATEGORIES = [
  "Inventory Purchase",

  "Thread & Consumables",

  "Garments / Blanks",

  "Machine Maintenance",

  "Machine Repair",

  "Electricity",

  "Rent",

  "Salary / Wages",

  "Transport / Courier",

  "Packaging",

  "Software / Subscription",

  "Office Expense",

  "Marketing / Advertising",

  "Professional Fees",

  "Bank Charges",

  "Telephone / Internet",

  "Cleaning / Housekeeping",

  "Travel",

  "Fuel",

  "Printing / Stationery",

  "Repairs & Maintenance",

  "Training",

  "Taxes / Government Fees",

  "Miscellaneous",

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

/* =========================================================
   EMPTY FORM

   No Date() here because this is a Client Component
   and Next.js 16 Cache Components may prerender it.
========================================================= */

const EMPTY_FORM: ExpenseForm = {
  date: "",

  category: "",

  description: "",

  amount: 0,

  paymentMethod:
    "Bank Transfer",

  reference: "",

  supplier: "",

  notes: "",

  inventoryId: "",

  quantity: 0,

  unitCost: 0,
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
    .substring(2, 10)}`;
}

/*
 * Called only from event handlers.
 */
function today() {
  return new Date()
    .toISOString()
    .split("T")[0];
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

function formatDate(
  value: string
) {
  if (!value) {
    return "—";
  }

  return String(
    value
  ).split(
    "T"
  )[0];
}

function variantSummary(
  item: InventoryItem
) {
  const values = [
    item.brand,

    item.color,

    item.colorCode
      ? `Code ${item.colorCode}`
      : "",

    item.size
      ? `Size ${item.size}`
      : "",

    item.variant,
  ].filter(
    Boolean
  );

  return values.length
    ? values.join(
        " · "
      )
    : "Standard variant";
}

/* =========================================================
   NORMALIZERS
========================================================= */

function normalizeExpense(
  row: any
): Expense {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    date:
      clean(
        row?.date
      ),

    category:
      clean(
        row?.category
      ),

    description:
      clean(
        row?.description
      ),

    amount:
      numberValue(
        row?.amount
      ),

    paymentMethod:
      clean(
        row?.paymentMethod
      ),

    reference:
      clean(
        row?.reference
      ),

    supplier:
      clean(
        row?.supplier
      ),

    inventoryTransactionId:
      clean(
        row?.inventoryTransactionId
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

    quantity:
      numberValue(
        row?.quantity
      ),

    unit:
      clean(
        row?.unit
      ),

    unitCost:
      numberValue(
        row?.unitCost
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

function normalizeInventoryItem(
  row: any
): InventoryItem {
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
        row?.quantity ??
          row?.currentStock
      ),

    unit:
      clean(
        row?.unit
      ) ||
      "pcs",

    minimumStock:
      numberValue(
        row?.minimumStock ??
          row?.reorderLevel
      ),

    price:
      numberValue(
        row?.price ??
          row?.purchasePrice
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
): InventoryTransaction {
  return {
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

export default function ExpensesPage() {
  const [
    expenses,
    setExpenses,
  ] =
    useState<
      Expense[]
    >([]);

  const [
    inventory,
    setInventory,
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
    search,
    setSearch,
  ] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState(
      "All"
    );

  const [
    showForm,
    setShowForm,
  ] =
    useState(false);

  const [
    editingExpense,
    setEditingExpense,
  ] =
    useState<
      Expense | null
    >(null);

  const [
    form,
    setForm,
  ] =
    useState<ExpenseForm>({
      ...EMPTY_FORM,
    });

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void reload();
  }, []);

  /* =======================================================
     BODY SCROLL LOCK
  ======================================================= */

  useEffect(() => {
    if (
      !showForm
    ) {
      return;
    }

    const old =
      document.body
        .style.overflow;

    document.body
      .style.overflow =
      "hidden";

    return () => {
      document.body
        .style.overflow =
        old;
    };
  }, [
    showForm,
  ]);

  /* =======================================================
     API HELPERS
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
      console.error(
        "Expenses Excel request failed:",
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

  async function reload(
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
        expenseRows,
        inventoryRows,
        transactionRows,
      ] =
        await Promise.all([
          loadSheet(
            "Expenses"
          ),

          loadSheet(
            "Inventory"
          ),

          loadSheet(
            "InventoryTransactions"
          ),
        ]);

      setExpenses(
        expenseRows
          .map(
            normalizeExpense
          )
          .filter(
            (
              expense
            ) =>
              Boolean(
                expense.id
              )
          )
          .sort(
            (
              a,
              b
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
          )
      );

      setInventory(
        inventoryRows
          .map(
            normalizeInventoryItem
          )
          .filter(
            (
              item
            ) =>
              Boolean(
                item.id
              )
          )
          .sort(
            (
              a,
              b
            ) =>
              a.name.localeCompare(
                b.name
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
      );
    } catch (
      error
    ) {
      console.error(
        "Expenses load error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load Expenses."
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
     SELECTED INVENTORY
  ======================================================= */

  const selectedInventory =
    useMemo(
      () =>
        inventory.find(
          (
            item
          ) =>
            item.id ===
            form.inventoryId
        ),
      [
        inventory,
        form.inventoryId,
      ]
    );

  const isInventoryPurchase =
    form.category ===
    "Inventory Purchase";

  const calculatedPurchaseAmount =
    Number(
      form.quantity ||
        0
    ) *
    Number(
      form.unitCost ||
        0
    );

  const resultingStock =
    selectedInventory
      ? selectedInventory.quantity +
        Number(
          form.quantity ||
            0
        )
      : 0;

  /* =======================================================
     FORM
  ======================================================= */

  function openCreate() {
    setEditingExpense(
      null
    );

    setForm({
      ...EMPTY_FORM,

      date:
        today(),
    });

    setShowForm(
      true
    );
  }

  function openEdit(
    expense:
      Expense
  ) {
    /*
     * Inventory expenses are controlled by the
     * stock transaction and cannot be independently edited.
     */
    if (
      expense.inventoryTransactionId
    ) {
      alert(
        "This expense is linked to an Inventory Stock In transaction and cannot be edited independently."
      );

      return;
    }

    setEditingExpense(
      expense
    );

    setForm({
      date:
        formatDate(
          expense.date
        ),

      category:
        expense.category,

      description:
        expense.description,

      amount:
        expense.amount,

      paymentMethod:
        expense.paymentMethod ||
        "Bank Transfer",

      reference:
        expense.reference,

      supplier:
        expense.supplier,

      notes:
        expense.notes,

      inventoryId:
        "",

      quantity:
        0,

      unitCost:
        0,
    });

    setShowForm(
      true
    );
  }

  function closeForm() {
    setShowForm(
      false
    );

    setEditingExpense(
      null
    );

    setForm({
      ...EMPTY_FORM,
    });
  }

  /* =======================================================
     CATEGORY CHANGE
  ======================================================= */

  function changeCategory(
    category: string
  ) {
    if (
      category ===
      "Inventory Purchase"
    ) {
      setForm(
        (
          current
        ) => ({
          ...current,

          category,

          description:
            "",

          amount:
            0,

          inventoryId:
            "",

          quantity:
            0,

          unitCost:
            0,

          reference:
            "",

          supplier:
            "",
        })
      );

      return;
    }

    setForm(
      (
        current
      ) => ({
        ...current,

        category,

        inventoryId:
          "",

        quantity:
          0,

        unitCost:
          0,
      })
    );
  }

  /* =======================================================
     INVENTORY SELECTION
  ======================================================= */

  function selectInventoryItem(
    inventoryId: string
  ) {
    const item =
      inventory.find(
        (
          row
        ) =>
          row.id ===
          inventoryId
      );

    if (
      !item
    ) {
      setForm(
        (
          current
        ) => ({
          ...current,

          inventoryId,

          supplier:
            "",

          unitCost:
            0,

          description:
            "",

          amount:
            0,
        })
      );

      return;
    }

    setForm(
      (
        current
      ) => ({
        ...current,

        inventoryId,

        supplier:
          item.supplier ||
          current.supplier,

        unitCost:
          item.price ||
          0,

        description:
          `${item.name} (${item.sku})`,

        amount:
          Number(
            current.quantity ||
              0
          ) *
          Number(
            item.price ||
              0
          ),
      })
    );
  }

  /* =======================================================
     VALIDATE STANDARD EXPENSE
  ======================================================= */

  function validateManualExpense() {
    if (
      !form.date
    ) {
      return "Expense Date is required.";
    }

    if (
      !form.category.trim()
    ) {
      return "Please select an expense category.";
    }

    if (
      !form.description.trim()
    ) {
      return "Expense Description is required.";
    }

    if (
      Number(
        form.amount
      ) <= 0
    ) {
      return "Expense Amount must be greater than zero.";
    }

    return "";
  }

  /* =======================================================
     VALIDATE INVENTORY PURCHASE
  ======================================================= */

  function validateInventoryPurchase() {
    if (
      !form.date
    ) {
      return "Purchase Date is required.";
    }

    if (
      !form.inventoryId
    ) {
      return "Please select an Inventory Item / SKU.";
    }

    if (
      !selectedInventory
    ) {
      return "Selected Inventory SKU could not be found.";
    }

    if (
      Number(
        form.quantity
      ) <= 0
    ) {
      return "Purchase Quantity must be greater than zero.";
    }

    if (
      Number(
        form.unitCost
      ) <= 0
    ) {
      return "Unit Cost must be greater than zero.";
    }

    if (
      !form.supplier.trim()
    ) {
      return "Supplier is required for an Inventory Purchase.";
    }

    if (
      !form.reference.trim()
    ) {
      return "Supplier Invoice / Bill Number is required.";
    }

    return "";
  }

  /* =======================================================
     DUPLICATE SUPPLIER INVOICE

     Same supplier + same invoice/reference should not be
     recorded twice as an Inventory Purchase.
  ======================================================= */

  function findDuplicatePurchase() {
    const supplier =
      normalizeText(
        form.supplier
      );

    const reference =
      normalizeText(
        form.reference
      );

    if (
      !supplier ||
      !reference
    ) {
      return undefined;
    }

    return expenses.find(
      (
        expense
      ) =>
        expense.inventoryTransactionId &&
        normalizeText(
          expense.supplier
        ) ===
          supplier &&
        normalizeText(
          expense.reference
        ) ===
          reference
    );
  }

  /* =======================================================
     SAVE STANDARD EXPENSE
  ======================================================= */

  async function saveManualExpense() {
    const validation =
      validateManualExpense();

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

      const now =
        new Date()
          .toISOString();

      const commonRecord = {
        date:
          form.date,

        category:
          form.category.trim(),

        description:
          form.description.trim(),

        amount:
          Number(
            form.amount
          ),

        paymentMethod:
          form.paymentMethod,

        reference:
          form.reference.trim(),

        supplier:
          form.supplier.trim(),

        /*
         * Manual expense:
         * no inventory links.
         */
        inventoryTransactionId:
          "",

        inventoryId:
          "",

        sku:
          "",

        itemName:
          "",

        quantity:
          0,

        unit:
          "",

        unitCost:
          0,

        notes:
          form.notes.trim(),

        updatedAt:
          now,
      };

      await saveExcel({
        action:
          editingExpense
            ? "update"
            : "add",

        sheet:
          "Expenses",

        ...(editingExpense
          ? {
              id:
                editingExpense.id,
            }
          : {}),

        record:
          editingExpense
            ? {
                ...editingExpense,

                ...commonRecord,
              }
            : {
                id:
                  generateId(),

                ...commonRecord,

                createdAt:
                  now,
              },
      });

      closeForm();

      await reload(
        true
      );
    } catch (
      error
    ) {
      console.error(
        "Expense save error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to save Expense."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     SAVE INVENTORY PURCHASE

     1. Validate existing SKU
     2. Duplicate invoice protection
     3. Update Inventory stock
     4. Create InventoryTransactions record
     5. Create linked Expense
  ======================================================= */

  async function saveInventoryPurchase() {
    const validation =
      validateInventoryPurchase();

    if (
      validation
    ) {
      alert(
        validation
      );

      return;
    }

    if (
      !selectedInventory
    ) {
      return;
    }

    const duplicate =
      findDuplicatePurchase();

    if (
      duplicate
    ) {
      alert(
        `Supplier invoice "${form.reference}" from ${form.supplier} is already recorded as an Inventory Purchase.`
      );

      return;
    }

    try {
      setSaving(
        true
      );

      /*
       * Reload Inventory immediately before saving.
       * This avoids using stale stock quantity.
       */
      const liveInventoryRows =
        await loadSheet(
          "Inventory"
        );

      const liveInventory =
        liveInventoryRows
          .map(
            normalizeInventoryItem
          )
          .find(
            (
              item
            ) =>
              item.id ===
              form.inventoryId
          );

      if (
        !liveInventory
      ) {
        throw new Error(
          "Selected Inventory SKU no longer exists."
        );
      }

      /*
       * Repeat duplicate check against current Excel data.
       */
      const liveExpenseRows =
        await loadSheet(
          "Expenses"
        );

      const liveExpenses =
        liveExpenseRows
          .map(
            normalizeExpense
          );

      const liveDuplicate =
        liveExpenses.find(
          (
            expense
          ) =>
            expense.inventoryTransactionId &&
            normalizeText(
              expense.supplier
            ) ===
              normalizeText(
                form.supplier
              ) &&
            normalizeText(
              expense.reference
            ) ===
              normalizeText(
                form.reference
              )
        );

      if (
        liveDuplicate
      ) {
        throw new Error(
          `Supplier invoice "${form.reference}" has already been recorded.`
        );
      }

      const purchaseQuantity =
        Number(
          form.quantity
        );

      const unitCost =
        Number(
          form.unitCost
        );

      const purchaseAmount =
        purchaseQuantity *
        unitCost;

      const previousQuantity =
        Number(
          liveInventory.quantity ||
            0
        );

      const newQuantity =
        previousQuantity +
        purchaseQuantity;

      const now =
        new Date()
          .toISOString();

      const transactionId =
        generateId();

      const expenseId =
        generateId();

      /*
       * Track successful stages so we can attempt
       * a rollback if a later write fails.
       */
      let inventoryUpdated =
        false;

      let transactionCreated =
        false;

      try {
        /* =================================================
           STEP 1 — UPDATE INVENTORY MASTER
        ================================================= */

        await saveExcel({
          action:
            "update",

          sheet:
            "Inventory",

          id:
            liveInventory.id,

          record: {
            ...liveInventory,

            quantity:
              newQuantity,

            /*
             * Latest purchase price becomes current
             * item cost.
             */
            price:
              unitCost,

            purchasePrice:
              unitCost,

            supplier:
              form.supplier.trim(),

            updatedAt:
              now,
          },
        });

        inventoryUpdated =
          true;

        /* =================================================
           STEP 2 — STOCK IN TRANSACTION
        ================================================= */

        const transaction: InventoryTransaction = {
          id:
            transactionId,

          inventoryId:
            liveInventory.id,

          sku:
            liveInventory.sku,

          itemName:
            liveInventory.name,

          type:
            "IN",

          quantity:
            purchaseQuantity,

          previousQuantity,

          newQuantity,

          supplier:
            form.supplier.trim(),

          purchaseNumber:
            form.reference.trim(),

          unitCost,

          purchaseAmount,

          referenceType:
            "Purchase",

          referenceId:
            form.reference.trim(),

          notes:
            form.notes.trim(),

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

        transactionCreated =
          true;

        /* =================================================
           STEP 3 — LINKED EXPENSE
        ================================================= */

        const expense: Expense = {
          id:
            expenseId,

          date:
            form.date,

          category:
            "Inventory Purchase",

          description:
            `${liveInventory.name} (${liveInventory.sku}) - ${purchaseQuantity} ${liveInventory.unit}`,

          amount:
            purchaseAmount,

          paymentMethod:
            form.paymentMethod,

          reference:
            form.reference.trim(),

          supplier:
            form.supplier.trim(),

          inventoryTransactionId:
            transactionId,

          inventoryId:
            liveInventory.id,

          sku:
            liveInventory.sku,

          itemName:
            liveInventory.name,

          quantity:
            purchaseQuantity,

          unit:
            liveInventory.unit,

          unitCost,

          notes:
            form.notes.trim(),

          createdAt:
            now,

          updatedAt:
            now,
        };

        await saveExcel({
          action:
            "add",

          sheet:
            "Expenses",

          record:
            expense,
        });
      } catch (
        stageError
      ) {
        /*
         * Best-effort rollback.
         *
         * Excel writes are not transactional, so if
         * something fails after updating stock we try
         * to restore the earlier state.
         */

        console.error(
          "Inventory purchase stage failed:",
          stageError
        );

        if (
          transactionCreated
        ) {
          try {
            await saveExcel({
              action:
                "delete",

              sheet:
                "InventoryTransactions",

              id:
                transactionId,
            });
          } catch (
            rollbackError
          ) {
            console.error(
              "Unable to rollback InventoryTransaction:",
              rollbackError
            );
          }
        }

        if (
          inventoryUpdated
        ) {
          try {
            await saveExcel({
              action:
                "update",

              sheet:
                "Inventory",

              id:
                liveInventory.id,

              record: {
                ...liveInventory,

                quantity:
                  previousQuantity,

                updatedAt:
                  now,
              },
            });
          } catch (
            rollbackError
          ) {
            console.error(
              "Unable to rollback Inventory quantity:",
              rollbackError
            );
          }
        }

        throw stageError;
      }

      closeForm();

      await reload(
        true
      );

      alert(
        `Inventory Purchase saved successfully.\n\n${liveInventory.sku}\n${purchaseQuantity} ${liveInventory.unit} received.\nNew Stock: ${newQuantity} ${liveInventory.unit}\nExpense: ${money(
          purchaseAmount
        )}`
      );
    } catch (
      error
    ) {
      console.error(
        "Inventory Purchase save error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to record Inventory Purchase."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     SAVE ROUTER
  ======================================================= */

  async function saveExpense() {
    if (
      isInventoryPurchase
    ) {
      await saveInventoryPurchase();

      return;
    }

    await saveManualExpense();
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function deleteExpense(
    expense:
      Expense
  ) {
    /*
     * Linked Inventory purchases cannot be deleted
     * from Expenses alone because that would leave
     * stock quantity incorrect.
     */
    if (
      expense.inventoryTransactionId
    ) {
      alert(
        "This Expense is linked to an Inventory Stock In transaction. Reverse the related stock transaction instead of deleting the Expense independently."
      );

      return;
    }

    if (
      !confirm(
        `Delete expense "${expense.description}"?`
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
          "Expenses",

        id:
          expense.id,
      });

      await reload(
        true
      );
    } catch (
      error
    ) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete Expense."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     CATEGORIES
  ======================================================= */

  const categoriesInData =
    useMemo(() => {
      const values =
        new Set<string>();

      expenses.forEach(
        (
          expense
        ) => {
          if (
            expense.category
          ) {
            values.add(
              expense.category
            );
          }
        }
      );

      RECOMMENDED_CATEGORIES.forEach(
        (
          category
        ) =>
          values.add(
            category
          )
      );

      return Array.from(
        values
      ).sort();
    }, [
      expenses,
    ]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return expenses.filter(
        (
          expense
        ) => {
          const categoryOK =
            categoryFilter ===
              "All" ||
            expense.category ===
              categoryFilter;

          const searchOK =
            !query ||
            [
              expense.category,

              expense.description,

              expense.paymentMethod,

              expense.reference,

              expense.supplier,

              expense.itemName,

              expense.sku,

              expense.notes,
            ]
              .join(
                " "
              )
              .toLowerCase()
              .includes(
                query
              );

          return (
            categoryOK &&
            searchOK
          );
        }
      );
    }, [
      expenses,
      search,
      categoryFilter,
    ]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statistics =
    useMemo(() => {
      const total =
        expenses.reduce(
          (
            sum,
            expense
          ) =>
            sum +
            Number(
              expense.amount ||
                0
            ),
          0
        );

      const inventoryPurchases =
        expenses
          .filter(
            (
              expense
            ) =>
              expense.category ===
              "Inventory Purchase"
          )
          .reduce(
            (
              sum,
              expense
            ) =>
              sum +
              Number(
                expense.amount ||
                  0
              ),
            0
          );

      const otherExpenses =
        total -
        inventoryPurchases;

      const inventoryPurchaseCount =
        expenses.filter(
          (
            expense
          ) =>
            Boolean(
              expense.inventoryTransactionId
            )
        ).length;

      return {
        total,

        inventoryPurchases,

        otherExpenses,

        count:
          expenses.length,

        inventoryPurchaseCount,
      };
    }, [
      expenses,
    ]);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">

      <div className="mx-auto w-full max-w-7xl space-y-6 pb-24">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>

            <div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
              Business Spending
            </div>

            <h1 className="text-3xl font-black">
              Expenses
            </h1>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Record operating expenses and inventory purchases. Inventory purchases automatically update stock, create Stock In history and create the linked expense.
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
                openCreate
              }
              className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
            >
              + Add Expense
            </button>

          </div>

        </div>

        {/* =================================================
            GUIDANCE
        ================================================= */}

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">

          <div className="font-black text-blue-900">
            Inventory Purchase Integration
          </div>

          <p className="mt-1 text-sm leading-6 text-blue-700">
            Select
            <strong>
              {" "}Inventory Purchase
            </strong>
            {" "}as the category to buy stock against an existing SKU. The purchase will update Inventory, create a Stock In transaction and create the Expense automatically.
          </p>

        </div>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            label="Total Expenses"
            value={money(
              statistics.total
            )}
            caption="All recorded business expenses"
          />

          <StatCard
            label="Inventory Purchases"
            value={money(
              statistics.inventoryPurchases
            )}
            caption={`${statistics.inventoryPurchaseCount} linked Stock In purchases`}
          />

          <StatCard
            label="Other Expenses"
            value={money(
              statistics.otherExpenses
            )}
            caption="Operating costs excluding inventory"
          />

          <StatCard
            label="Expense Records"
            value={String(
              statistics.count
            )}
            caption="Total expense entries"
          />

        </div>

        {/* =================================================
            FILTER
        ================================================= */}

        <div className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[1fr_280px_auto]">

          <div>

            <input
              value={
                search
              }
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search category, supplier, item, SKU, bill number or description..."
              className="w-full rounded-xl border px-4 py-3"
            />

            <p className="mt-1 text-xs text-slate-400">
              Search manual and inventory-linked expenses.
            </p>

          </div>

          <div>

            <select
              value={
                categoryFilter
              }
              onChange={(e) =>
                setCategoryFilter(
                  e.target.value
                )
              }
              className="w-full rounded-xl border bg-white px-4 py-3"
            >

              <option value="All">
                All Categories
              </option>

              {categoriesInData.map(
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

            <p className="mt-1 text-xs text-slate-400">
              Filter expenses by category.
            </p>

          </div>

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
            className="h-[50px] rounded-xl border px-5 font-semibold disabled:opacity-50"
          >
            {refreshing
              ? "Loading..."
              : "Refresh"}
          </button>

        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          {loading ? (

            <div className="p-10 text-center text-slate-500">
              Loading Expenses...
            </div>

          ) : filtered.length ===
            0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl">
                💸
              </div>

              <h2 className="mt-4 text-xl font-bold">
                No expenses found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Add a normal business expense or record an Inventory Purchase.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1200px] text-left text-sm">

                <thead>

                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                    <th className="px-4 py-4">
                      Date
                    </th>

                    <th className="px-4 py-4">
                      Category
                    </th>

                    <th className="px-4 py-4">
                      Description
                    </th>

                    <th className="px-4 py-4">
                      SKU
                    </th>

                    <th className="px-4 py-4">
                      Supplier
                    </th>

                    <th className="px-4 py-4">
                      Qty
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
                      Source
                    </th>

                    <th className="px-4 py-4">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filtered.map(
                    (
                      expense
                    ) => {
                      const inventoryLinked =
                        Boolean(
                          expense.inventoryTransactionId
                        );

                      return (

                        <tr
                          key={
                            expense.id
                          }
                          className="border-b last:border-0 hover:bg-slate-50"
                        >

                          <td className="whitespace-nowrap px-4 py-4">
                            {formatDate(
                              expense.date
                            )}
                          </td>

                          <td className="px-4 py-4">

                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                              {expense.category ||
                                "Other"}
                            </span>

                          </td>

                          <td className="max-w-[280px] px-4 py-4">

                            <div className="font-semibold">
                              {expense.description}
                            </div>

                            {inventoryLinked &&
                              expense.itemName && (

                              <div className="mt-1 text-xs text-slate-400">
                                {expense.itemName}
                              </div>

                            )}

                          </td>

                          <td className="px-4 py-4">

                            {expense.sku ? (

                              <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-black">
                                {expense.sku}
                              </span>

                            ) : (
                              "—"
                            )}

                          </td>

                          <td className="px-4 py-4">
                            {expense.supplier ||
                              "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4">

                            {expense.quantity >
                            0 ? (
                              <>
                                <span className="font-black">
                                  {expense.quantity}
                                </span>
                                {" "}
                                {expense.unit}
                              </>
                            ) : (
                              "—"
                            )}

                          </td>

                          <td className="whitespace-nowrap px-4 py-4 font-black text-red-600">
                            {money(
                              expense.amount
                            )}
                          </td>

                          <td className="px-4 py-4">
                            {expense.paymentMethod ||
                              "—"}
                          </td>

                          <td className="px-4 py-4">
                            {expense.reference ||
                              "—"}
                          </td>

                          <td className="px-4 py-4">

                            {inventoryLinked ? (

                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                INVENTORY
                              </span>

                            ) : (

                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                MANUAL
                              </span>

                            )}

                          </td>

                          <td className="px-4 py-4">

                            <div className="flex gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    expense
                                  )
                                }
                                disabled={
                                  inventoryLinked
                                }
                                className={`rounded-lg px-3 py-2 text-xs font-bold ${
                                  inventoryLinked
                                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                    : "bg-blue-50 text-blue-700"
                                }`}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void deleteExpense(
                                    expense
                                  )
                                }
                                disabled={
                                  inventoryLinked ||
                                  saving
                                }
                                className={`rounded-lg px-3 py-2 text-xs font-bold ${
                                  inventoryLinked
                                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                    : "bg-red-50 text-red-600"
                                }`}
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
          ADD / EDIT MODAL
      =================================================== */}

      {showForm && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">

          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">

            <div className="my-6 flex max-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex shrink-0 items-start justify-between border-b px-6 py-5">

                <div>

                  <div className="text-xs font-black uppercase tracking-wide text-blue-600">
                    {isInventoryPurchase
                      ? "Purchase & Stock"
                      : "Business Expense"}
                  </div>

                  <h2 className="mt-1 text-2xl font-black">
                    {editingExpense
                      ? "Edit Expense"
                      : isInventoryPurchase
                      ? "Purchase Inventory"
                      : "Add Expense"}
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm text-slate-500">
                    {isInventoryPurchase
                      ? "Purchase stock against an existing Inventory SKU. Saving will increase stock and create the linked expense automatically."
                      : "Record a business operating expense."}
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

              <div className="min-h-0 flex-1 overflow-y-auto p-6">

                <div className="space-y-6">

                  {/* =======================================
                      BASIC
                  ======================================= */}

                  <Section
                    title="Expense Classification"
                    description="Select the expense type first. Inventory Purchase activates the SKU-linked purchase workflow."
                  >

                    <div className="grid gap-5 md:grid-cols-2">

                      <Field
                        label={
                          isInventoryPurchase
                            ? "Purchase Date *"
                            : "Expense Date *"
                        }
                        caption={
                          isInventoryPurchase
                            ? "Date the inventory was purchased or received."
                            : "Date the expense was incurred or paid."
                        }
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
                        label="Recommended Category *"
                        caption="Choose Inventory Purchase when buying an existing Inventory SKU."
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
                          disabled={
                            Boolean(
                              editingExpense
                            )
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3 disabled:bg-slate-100"
                        >

                          <option value="">
                            Select expense category
                          </option>

                          {RECOMMENDED_CATEGORIES.map(
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

                    </div>

                  </Section>

                  {/* =======================================
                      INVENTORY PURCHASE
                  ======================================= */}

                  {isInventoryPurchase &&
                    !editingExpense && (

                    <>

                      <Section
                        title="Inventory Item / SKU"
                        description="Select the existing SKU being purchased. Do not create another SKU for repeat purchases."
                      >

                        <Field
                          label="Inventory Item / SKU *"
                          caption={`${inventory.length} active Inventory SKU${inventory.length === 1 ? "" : "s"} available.`}
                        >

                          <select
                            value={
                              form.inventoryId
                            }
                            onChange={(e) =>
                              selectInventoryItem(
                                e.target.value
                              )
                            }
                            className="w-full rounded-xl border bg-white px-4 py-3"
                          >

                            <option value="">
                              Select Inventory Item / SKU
                            </option>

                            {inventory.map(
                              (
                                item
                              ) => (

                                <option
                                  key={
                                    item.id
                                  }
                                  value={
                                    item.id
                                  }
                                >
                                  {item.sku}
                                  {" — "}
                                  {item.name}
                                  {" — "}
                                  {variantSummary(
                                    item
                                  )}
                                </option>

                              )
                            )}

                          </select>

                        </Field>

                        {selectedInventory && (

                          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                            <InfoBox
                              label="SKU"
                              value={
                                selectedInventory.sku
                              }
                            />

                            <InfoBox
                              label="Item"
                              value={
                                selectedInventory.name
                              }
                            />

                            <InfoBox
                              label="Current Stock"
                              value={`${selectedInventory.quantity} ${selectedInventory.unit}`}
                            />

                            <InfoBox
                              label="Unit"
                              value={
                                selectedInventory.unit
                              }
                            />

                            <InfoBox
                              label="Variant"
                              value={
                                variantSummary(
                                  selectedInventory
                                )
                              }
                            />

                            <InfoBox
                              label="Default Supplier"
                              value={
                                selectedInventory.supplier ||
                                "—"
                              }
                            />

                            <InfoBox
                              label="Latest Unit Cost"
                              value={money(
                                selectedInventory.price
                              )}
                            />

                            <InfoBox
                              label="Minimum Stock"
                              value={`${selectedInventory.minimumStock} ${selectedInventory.unit}`}
                            />

                          </div>

                        )}

                      </Section>

                      <Section
                        title="Purchase Details"
                        description="Enter the quantity purchased and the supplier's actual unit cost."
                      >

                        <div className="grid gap-5 md:grid-cols-2">

                          <Field
                            label={`Purchase Quantity *${
                              selectedInventory
                                ? ` (${selectedInventory.unit})`
                                : ""
                            }`}
                            caption="Quantity received into stock."
                          >

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                form.quantity
                              }
                              onChange={(e) => {
                                const quantity =
                                  Number(
                                    e.target.value
                                  );

                                setForm({
                                  ...form,

                                  quantity,

                                  amount:
                                    quantity *
                                    Number(
                                      form.unitCost ||
                                        0
                                    ),
                                });
                              }}
                              className="w-full rounded-xl border px-4 py-3"
                            />

                          </Field>

                          <Field
                            label={`Unit Cost ₹ *${
                              selectedInventory
                                ? ` / ${selectedInventory.unit}`
                                : ""
                            }`}
                            caption="Actual purchase cost per inventory unit."
                          >

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                form.unitCost
                              }
                              onChange={(e) => {
                                const unitCost =
                                  Number(
                                    e.target.value
                                  );

                                setForm({
                                  ...form,

                                  unitCost,

                                  amount:
                                    Number(
                                      form.quantity ||
                                        0
                                    ) *
                                    unitCost,
                                });
                              }}
                              className="w-full rounded-xl border px-4 py-3"
                            />

                          </Field>

                          <Field
                            label="Supplier *"
                            caption="Supplier or vendor from whom this stock was purchased."
                          >

                            <input
                              value={
                                form.supplier
                              }
                              onChange={(e) =>
                                setForm({
                                  ...form,

                                  supplier:
                                    e.target.value,
                                })
                              }
                              placeholder="Supplier name"
                              className="w-full rounded-xl border px-4 py-3"
                            />

                          </Field>

                          <Field
                            label="Supplier Invoice / Bill No. *"
                            caption="Used to prevent duplicate inventory purchase entries."
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
                              placeholder="e.g. SUP-INV-458"
                              className="w-full rounded-xl border px-4 py-3"
                            />

                          </Field>

                          <Field
                            label="Payment Method"
                            caption="Use Credit if the supplier invoice has not yet been paid."
                          >

                            <select
                              value={
                                form.paymentMethod
                              }
                              onChange={(e) =>
                                setForm({
                                  ...form,

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

                            <div className="text-xs font-bold uppercase tracking-wide text-blue-600">
                              Purchase Value
                            </div>

                            <div className="mt-2 text-2xl font-black text-blue-900">
                              {money(
                                calculatedPurchaseAmount
                              )}
                            </div>

                            <p className="mt-1 text-xs text-blue-600">
                              Quantity × Unit Cost
                            </p>

                          </div>

                        </div>

                        {selectedInventory && (

                          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">

                            <div className="text-xs font-black uppercase tracking-wide text-green-700">
                              Stock After Purchase
                            </div>

                            <div className="mt-1 text-xl font-black text-green-900">
                              {resultingStock}{" "}
                              {selectedInventory.unit}
                            </div>

                            <p className="mt-1 text-xs text-green-700">
                              Current stock {selectedInventory.quantity} + purchase {Number(
                                form.quantity ||
                                  0
                              )}
                            </p>

                          </div>

                        )}

                      </Section>

                    </>

                  )}

                  {/* =======================================
                      NORMAL EXPENSE
                  ======================================= */}

                  {!isInventoryPurchase && (

                    <Section
                      title="Expense Details"
                      description="Describe the expense and record its amount."
                    >

                      <div className="grid gap-5 md:grid-cols-2">

                        <div className="md:col-span-2">

                          <Field
                            label="Description *"
                            caption="Clear explanation of what the business paid for."
                          >

                            <input
                              value={
                                form.description
                              }
                              onChange={(e) =>
                                setForm({
                                  ...form,

                                  description:
                                    e.target.value,
                                })
                              }
                              placeholder="Example: Monthly workshop electricity bill"
                              className="w-full rounded-xl border px-4 py-3"
                            />

                          </Field>

                        </div>

                        <Field
                          label="Amount ₹ *"
                          caption="Total expense amount."
                        >

                          <input
                            type="number"
                            min="0"
                            step="0.01"
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
                          caption="How this expense was paid."
                        >

                          <select
                            value={
                              form.paymentMethod
                            }
                            onChange={(e) =>
                              setForm({
                                ...form,

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

                        <Field
                          label="Supplier / Payee"
                          caption="Vendor, employee, landlord or other party receiving payment."
                        >

                          <input
                            value={
                              form.supplier
                            }
                            onChange={(e) =>
                              setForm({
                                ...form,

                                supplier:
                                  e.target.value,
                              })
                            }
                            placeholder="Supplier / payee name"
                            className="w-full rounded-xl border px-4 py-3"
                          />

                        </Field>

                        <Field
                          label="Reference"
                          caption="Bill number, transaction ID, cheque number or other reference."
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
                            placeholder="Bill / transaction reference"
                            className="w-full rounded-xl border px-4 py-3"
                          />

                        </Field>

                      </div>

                    </Section>

                  )}

                  {/* =======================================
                      NOTES
                  ======================================= */}

                  <Section
                    title="Notes"
                    description="Optional internal information about the expense or inventory purchase."
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
                      placeholder="Additional expense / purchase information..."
                      className="min-h-28 w-full rounded-xl border px-4 py-3"
                    />

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

                <button
                  type="button"
                  onClick={() =>
                    void saveExpense()
                  }
                  disabled={
                    saving
                  }
                  className={`rounded-xl px-6 py-3 font-black text-white disabled:opacity-50 ${
                    isInventoryPurchase
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-700 hover:bg-blue-800"
                  }`}
                >
                  {saving
                    ? "Saving..."
                    : editingExpense
                    ? "Update Expense"
                    : isInventoryPurchase
                    ? "Purchase & Receive Stock"
                    : "Save Expense"}
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

  description: string;

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
  label: string;

  caption: string;

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

function InfoBox({
  label,
  value,
}: {
  label: string;

  value: string;
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
}: {
  label: string;

  value: string;

  caption: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">

      <div className="text-sm text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-2xl font-black">
        {value}
      </div>

      <div className="mt-1 text-xs text-slate-400">
        {caption}
      </div>

    </div>
  );
}
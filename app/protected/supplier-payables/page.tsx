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

type BillStatus =
  | "UNPAID"
  | "PARTIAL"
  | "PAID";

type PaymentMethod =
  | "Cash"
  | "UPI"
  | "Bank Transfer"
  | "Card"
  | "Cheque"
  | "Other";

type Supplier = {
  id: string;

  supplierCode: string;
  supplierName: string;

  paymentTermsDays: number;

  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  ifscCode: string;
  upiId: string;

  status: string;

  [key: string]: any;
};

type PurchaseOrder = {
  id: string;

  purchaseOrderNumber: string;

  supplierId: string;
  supplierCode: string;
  supplierName: string;

  poDate: string;

  totalAmount: number;

  status: string;

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

type SupplierPayment = {
  id: string;

  supplierBillId: string;
  billNumber: string;

  supplierInvoiceNumber: string;

  supplierId: string;
  supplierCode: string;
  supplierName: string;

  purchaseOrderId: string;
  purchaseOrderNumber: string;

  paymentDate: string;

  amount: number;

  paymentMethod: PaymentMethod;

  reference: string;

  notes: string;

  createdAt: string;

  [key: string]: any;
};

type PaymentForm = {
  billId: string;

  paymentDate: string;

  amount: number;

  paymentMethod: PaymentMethod;

  reference: string;

  notes: string;
};

/* =========================================================
   OPTIONS
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

function sameText(
  value1: unknown,
  value2: unknown
) {
  const a =
    normalizeText(
      value1
    );

  const b =
    normalizeText(
      value2
    );

  return Boolean(
    a &&
    b &&
    a === b
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
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `supplier-payment-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
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

  const a =
    new Date(
      `${from.split("T")[0]}T00:00:00`
    );

  const b =
    new Date(
      `${to.split("T")[0]}T00:00:00`
    );

  if (
    Number.isNaN(
      a.getTime()
    ) ||
    Number.isNaN(
      b.getTime()
    )
  ) {
    return 0;
  }

  return Math.floor(
    (
      b.getTime() -
      a.getTime()
    ) /
      86400000
  );
}

/* =========================================================
   NORMALIZERS
========================================================= */

function normalizeSupplier(
  row: any
): Supplier {
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

    paymentTermsDays:
      numberValue(
        row?.paymentTermsDays
      ) ||
      30,

    bankName:
      clean(
        row?.bankName
      ),

    bankAccountName:
      clean(
        row?.bankAccountName
      ),

    bankAccountNumber:
      clean(
        row?.bankAccountNumber
      ),

    ifscCode:
      clean(
        row?.ifscCode
      ),

    upiId:
      clean(
        row?.upiId
      ),

    status:
      clean(
        row?.status
      ),
  };
}

function normalizePO(
  row: any
): PurchaseOrder {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    purchaseOrderNumber:
      clean(
        row?.purchaseOrderNumber
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

    totalAmount:
      numberValue(
        row?.totalAmount
      ),

    status:
      clean(
        row?.status
      ),
  };
}

function normalizeBill(
  row: any
): SupplierBill {
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

function normalizePayment(
  row: any
): SupplierPayment {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    supplierBillId:
      clean(
        row?.supplierBillId
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

    paymentDate:
      dateOnly(
        row?.paymentDate ??
          row?.date
      ),

    amount:
      numberValue(
        row?.amount
      ),

    paymentMethod:
      (
        PAYMENT_METHODS.includes(
          row?.paymentMethod
        )
          ? row.paymentMethod
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

/* =========================================================
   PAGE
========================================================= */

export default function SupplierPayablesPage() {
  const [
    bills,
    setBills,
  ] =
    useState<
      SupplierBill[]
    >([]);

  const [
    payments,
    setPayments,
  ] =
    useState<
      SupplierPayment[]
    >([]);

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
    showPaymentForm,
    setShowPaymentForm,
  ] =
    useState(
      false
    );

  const [
    viewingBill,
    setViewingBill,
  ] =
    useState<
      SupplierBill | null
    >(
      null
    );

  const [
    viewingPayment,
    setViewingPayment,
  ] =
    useState<
      SupplierPayment | null
    >(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<
      PaymentForm
    >({
      billId: "",
      paymentDate: "",
      amount: 0,
      paymentMethod:
        "Bank Transfer",
      reference: "",
      notes: "",
    });

  /* =======================================================
     INITIAL
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
        !showPaymentForm &&
        !viewingBill &&
        !viewingPayment
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
      showPaymentForm,
      viewingBill,
      viewingPayment,
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
      throw new Error(
        data?.message ||
          data?.error ||
          "Unable to process request."
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
        billRows,
        paymentRows,
        supplierRows,
        poRows,
        settings,
      ] =
        await Promise.all([
          loadSheet(
            "SupplierBills"
          ),

          loadSheet(
            "SupplierPayments"
          ),

          loadSheet(
            "Suppliers"
          ),

          loadSheet(
            "PurchaseOrders"
          ),

          loadAppSettings(),
        ]);

      setBills(
        billRows
          .map(
            normalizeBill
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
          .sort(
            (
              a,
              b
            ) =>
              `${b.billDate}${b.createdAt}`.localeCompare(
                `${a.billDate}${a.createdAt}`
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
              payment:
                SupplierPayment
            ) =>
              Boolean(
                payment.id
              )
          )
          .sort(
            (
              a,
              b
            ) =>
              `${b.paymentDate}${b.createdAt}`.localeCompare(
                `${a.paymentDate}${a.createdAt}`
              )
          )
      );

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
        "Supplier payables load error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load Supplier Payables."
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
     PAYMENTS FOR BILL
  ======================================================= */

  function billPayments(
    bill:
      SupplierBill
  ) {
    return payments.filter(
      (
        payment
      ) =>
        (
          payment.supplierBillId &&
          sameText(
            payment.supplierBillId,
            bill.id
          )
        ) ||
        (
          payment.billNumber &&
          sameText(
            payment.billNumber,
            bill.billNumber
          )
        )
    );
  }

  function paidAmount(
    bill:
      SupplierBill
  ) {
    return billPayments(
      bill
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

  function outstanding(
    bill:
      SupplierBill
  ) {
    return Math.max(
      bill.totalAmount -
        paidAmount(
          bill
        ),
      0
    );
  }

  function billStatus(
    bill:
      SupplierBill
  ):
    BillStatus {
    const total =
      bill.totalAmount;

    const paid =
      paidAmount(
        bill
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
    bill:
      SupplierBill
  ) {
    if (
      outstanding(
        bill
      ) <=
      0.009
    ) {
      return 0;
    }

    if (
      !bill.dueDate
    ) {
      return 0;
    }

    const today =
      getToday();

    if (
      bill.dueDate >=
      today
    ) {
      return 0;
    }

    return Math.max(
      daysBetween(
        bill.dueDate,
        today
      ),
      0
    );
  }

  function ageingBucket(
    bill:
      SupplierBill
  ) {
    const days =
      overdueDays(
        bill
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
     OUTSTANDING BILLS
  ======================================================= */

  const openBills =
    useMemo(
      () =>
        bills
          .filter(
            (
              bill
            ) =>
              outstanding(
                bill
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
                  a.billDate
              ).localeCompare(
                String(
                  b.dueDate ||
                    b.billDate
                )
              )
          ),
      [
        bills,
        payments,
      ]
    );

  /* =======================================================
     SELECTED BILL
  ======================================================= */

  const selectedBill =
    useMemo(
      () =>
        bills.find(
          (
            bill
          ) =>
            sameText(
              bill.id,
              form.billId
            )
        ),
      [
        bills,
        form.billId,
      ]
    );

  const selectedSupplier =
    useMemo(
      () => {
        if (
          !selectedBill
        ) {
          return undefined;
        }

        return suppliers.find(
          (
            supplier
          ) =>
            sameText(
              supplier.id,
              selectedBill.supplierId
            ) ||
            sameText(
              supplier.supplierCode,
              selectedBill.supplierCode
            )
        );
      },
      [
        suppliers,
        selectedBill,
      ]
    );

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statistics =
    useMemo(
      () => {
        const payable =
          bills.reduce(
            (
              total,
              bill
            ) =>
              total +
              outstanding(
                bill
              ),
            0
          );

        const overdue =
          bills.reduce(
            (
              total,
              bill
            ) =>
              overdueDays(
                bill
              ) >
              0
                ? total +
                  outstanding(
                    bill
                  )
                : total,
            0
          );

        const totalPaid =
          payments.reduce(
            (
              total,
              payment
            ) =>
              total +
              payment.amount,
            0
          );

        const fullyPaid =
          bills.filter(
            (
              bill
            ) =>
              billStatus(
                bill
              ) ===
              "PAID"
          ).length;

        return {
          payable,

          overdue,

          totalPaid,

          fullyPaid,

          openBills:
            openBills.length,
        };
      },
      [
        bills,
        payments,
        openBills,
      ]
    );

  /* =======================================================
     FILTER BILLS
  ======================================================= */

  const filteredBills =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return bills.filter(
          (
            bill
          ) => {
            const status =
              billStatus(
                bill
              );

            const statusOK =
              statusFilter ===
                "All" ||
              status ===
                statusFilter;

            const text =
              [
                bill.billNumber,

                bill.supplierInvoiceNumber,

                bill.supplierName,

                bill.supplierCode,

                bill.purchaseOrderNumber,

                bill.billDate,

                bill.dueDate,

                status,
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
        bills,
        payments,
        search,
        statusFilter,
      ]
    );

  /* =======================================================
     OPEN PAYMENT
  ======================================================= */

  function openPayment(
    bill?:
      SupplierBill
  ) {
    setForm({
      billId:
        bill?.id ||
        "",

      paymentDate:
        getToday(),

      amount:
        bill
          ? outstanding(
              bill
            )
          : 0,

      paymentMethod:
        "Bank Transfer",

      reference:
        "",

      notes:
        "",
    });

    setShowPaymentForm(
      true
    );
  }

  function closePayment() {
    setShowPaymentForm(
      false
    );

    setForm({
      billId: "",
      paymentDate: "",
      amount: 0,
      paymentMethod:
        "Bank Transfer",
      reference: "",
      notes: "",
    });
  }

  /* =======================================================
     UPDATE BILL STATUS
  ======================================================= */

  async function updateBillStatus(
    bill:
      SupplierBill,

    status:
      BillStatus,

    now:
      string
  ) {
    await saveExcel({
      action:
        "update",

      sheet:
        "SupplierBills",

      id:
        bill.id,

      record: {
        ...bill,

        status,

        updatedAt:
          now,
      },
    });
  }

  /* =======================================================
     SAVE SUPPLIER PAYMENT
  ======================================================= */

  async function savePayment() {
    const bill =
      selectedBill;

    if (
      !bill
    ) {
      alert(
        "Please select a Supplier Bill."
      );

      return;
    }

    if (
      !form.paymentDate
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

    const balance =
      outstanding(
        bill
      );

    if (
      amount >
      balance +
        0.01
    ) {
      alert(
        `Payment cannot exceed outstanding balance of ${money(
          balance,
          appSettings.currencySymbol ||
            "₹"
        )}.`
      );

      return;
    }

    if (
      form.paymentMethod ===
        "Cheque" &&
      !form.reference.trim()
    ) {
      alert(
        "Cheque Number is required."
      );

      return;
    }

    if (
      [
        "UPI",
        "Bank Transfer",
      ].includes(
        form.paymentMethod
      ) &&
      !form.reference.trim()
    ) {
      const proceed =
        confirm(
          "No bank / UPI transaction reference has been entered.\n\nSave payment anyway?"
        );

      if (
        !proceed
      ) {
        return;
      }
    }

    try {
      setSaving(
        true
      );

      const now =
        getNow();

      const payment:
        SupplierPayment = {
        id:
          generateId(),

        supplierBillId:
          bill.id,

        billNumber:
          bill.billNumber,

        supplierInvoiceNumber:
          bill.supplierInvoiceNumber,

        supplierId:
          bill.supplierId,

        supplierCode:
          bill.supplierCode,

        supplierName:
          bill.supplierName,

        purchaseOrderId:
          bill.purchaseOrderId,

        purchaseOrderNumber:
          bill.purchaseOrderNumber,

        paymentDate:
          form.paymentDate,

        amount,

        paymentMethod:
          form.paymentMethod,

        reference:
          form.reference.trim(),

        notes:
          form.notes.trim(),

        createdAt:
          now,
      };

      /* 1. SAVE PAYMENT */

      await saveExcel({
        action:
          "add",

        sheet:
          "SupplierPayments",

        record:
          payment,
      });

      /* 2. CALCULATE NEW BILL STATUS */

      const previousPaid =
        paidAmount(
          bill
        );

      const newPaid =
        previousPaid +
        amount;

      const balanceAfter =
        Math.max(
          bill.totalAmount -
            newPaid,
          0
        );

      const newStatus:
        BillStatus =
        balanceAfter <=
        0.01
          ? "PAID"
          : newPaid >
            0
          ? "PARTIAL"
          : "UNPAID";

      await updateBillStatus(
        bill,
        newStatus,
        now
      );

      /*
       * 3. RECORD CASH OUTFLOW
       *
       * Important:
       * This is not another purchase Expense.
       *
       * The purchase was already recognised
       * when goods were received.
       *
       * This records only settlement/payment.
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
            form.paymentDate,

          category:
            "Supplier Payment",

          recommendedCategory:
            "Supplier Payment",

          description:
            `Payment to ${bill.supplierName} against Supplier Bill ${bill.billNumber}`,

          amount,

          paymentMethod:
            form.paymentMethod,

          reference:
            form.reference.trim(),

          supplier:
            bill.supplierName,

          supplierId:
            bill.supplierId,

          supplierCode:
            bill.supplierCode,

          supplierBillId:
            bill.id,

          supplierBillNumber:
            bill.billNumber,

          supplierInvoiceNumber:
            bill.supplierInvoiceNumber,

          purchaseOrderId:
            bill.purchaseOrderId,

          purchaseOrderNumber:
            bill.purchaseOrderNumber,

          notes:
            form.notes.trim(),

          createdAt:
            now,
        },
      });

      closePayment();

      await loadData(
        true
      );

      alert(
        newStatus ===
          "PAID"
          ? `${bill.billNumber} has been fully paid.`
          : `Supplier payment saved.\n\nRemaining payable: ${money(
              balanceAfter,
              appSettings.currencySymbol ||
                "₹"
            )}`
      );
    } catch (
      error
    ) {
      console.error(
        "Supplier payment error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to save Supplier Payment."
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
      SupplierPayment
  ) {
    if (
      !confirm(
        `Delete supplier payment of ${money(
          payment.amount,
          appSettings.currencySymbol ||
            "₹"
        )}?`
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
          "SupplierPayments",

        id:
          payment.id,
      });

      const bill =
        bills.find(
          (
            row
          ) =>
            sameText(
              row.id,
              payment.supplierBillId
            )
        );

      if (
        bill
      ) {
        const remainingPayments =
          payments.filter(
            (
              row
            ) =>
              row.id !==
                payment.id &&
              sameText(
                row.supplierBillId,
                bill.id
              )
          );

        const paid =
          remainingPayments.reduce(
            (
              total,
              row
            ) =>
              total +
              row.amount,
            0
          );

        let status:
          BillStatus =
          "UNPAID";

        if (
          paid >=
          bill.totalAmount -
            0.01
        ) {
          status =
            "PAID";
        } else if (
          paid >
          0
        ) {
          status =
            "PARTIAL";
        }

        await updateBillStatus(
          bill,
          status,
          getNow()
        );
      }

      setViewingPayment(
        null
      );

      await loadData(
        true
      );
    } catch (
      error
    ) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete Supplier Payment."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     PRINT PAYMENT ADVICE
  ======================================================= */

  function printPaymentAdvice(
    payment:
      SupplierPayment
  ) {
    const bill =
      bills.find(
        (
          row
        ) =>
          sameText(
            row.id,
            payment.supplierBillId
          )
      );

    const popup =
      window.open(
        "",
        "_blank",
        "width=800,height=900"
      );

    if (
      !popup
    ) {
      alert(
        "Please allow pop-ups to print Payment Advice."
      );

      return;
    }

    const total =
      bill?.totalAmount ||
      0;

    const paid =
      bill
        ? paidAmount(
            bill
          )
        : payment.amount;

    const balance =
      Math.max(
        total -
          paid,
        0
      );

    popup.document.write(`
      <!doctype html>

      <html>

        <head>

          <title>
            Supplier Payment Advice
          </title>

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
              font-size: 32px;
              font-weight: 800;
              margin: 10px 0 20px;
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

          <h1>
            Supplier Payment Advice
          </h1>

          <div class="muted">
            Supplier payment confirmation
          </div>

          <div class="box">

            <div class="muted">
              Amount Paid
            </div>

            <div class="amount">
              ${money(
                payment.amount,
                appSettings.currencySymbol ||
                  "₹"
              )}
            </div>

            <table>

              <tr>
                <td>Supplier</td>
                <td>${payment.supplierName}</td>
              </tr>

              <tr>
                <td>Supplier Code</td>
                <td>${payment.supplierCode}</td>
              </tr>

              <tr>
                <td>Supplier Bill</td>
                <td>${payment.billNumber}</td>
              </tr>

              <tr>
                <td>Supplier Invoice</td>
                <td>${payment.supplierInvoiceNumber}</td>
              </tr>

              <tr>
                <td>Purchase Order</td>
                <td>${payment.purchaseOrderNumber || "—"}</td>
              </tr>

              <tr>
                <td>Payment Date</td>
                <td>${formatDate(payment.paymentDate)}</td>
              </tr>

              <tr>
                <td>Method</td>
                <td>${payment.paymentMethod}</td>
              </tr>

              <tr>
                <td>Reference</td>
                <td>${payment.reference || "—"}</td>
              </tr>

              ${
                bill
                  ? `
                    <tr>
                      <td>Bill Total</td>
                      <td>${money(
                        total,
                        appSettings.currencySymbol ||
                          "₹"
                      )}</td>
                    </tr>

                    <tr>
                      <td>Total Paid</td>
                      <td>${money(
                        paid,
                        appSettings.currencySymbol ||
                          "₹"
                      )}</td>
                    </tr>

                    <tr>
                      <td>Outstanding</td>
                      <td>${money(
                        balance,
                        appSettings.currencySymbol ||
                          "₹"
                      )}</td>
                    </tr>
                  `
                  : ""
              }

            </table>

          </div>

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

            <div className="mb-2 inline-flex rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-fuchsia-700">
              Accounts Payable
            </div>

            <h1 className="text-3xl font-black">
              Supplier Payables
            </h1>

            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
              Track supplier invoices,
              outstanding purchase liabilities,
              due dates and partial or full
              supplier payments.
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
              className="rounded-xl bg-fuchsia-700 px-5 py-3 font-black text-white hover:bg-fuchsia-800"
            >
              + Supplier Payment
            </button>

          </div>

        </div>

        {/* FLOW */}

        <div className="rounded-2xl border border-fuchsia-100 bg-gradient-to-r from-fuchsia-50 via-white to-violet-50 p-5">

          <div className="font-black text-fuchsia-900">
            🧾 Goods Receipt → Supplier Bill → Payment
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Credit purchases remain outstanding
            until an actual supplier payment is
            recorded. Partial payments are supported.
          </p>

        </div>

        {/* STATS */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <StatCard
            label="Accounts Payable"
            value={money(
              statistics.payable,
              appSettings.currencySymbol ||
                "₹"
            )}
            caption="Amount still owed"
            tone="amber"
          />

          <StatCard
            label="Overdue"
            value={money(
              statistics.overdue,
              appSettings.currencySymbol ||
                "₹"
            )}
            caption="Past supplier due date"
            tone="rose"
          />

          <StatCard
            label="Supplier Payments"
            value={money(
              statistics.totalPaid,
              appSettings.currencySymbol ||
                "₹"
            )}
            caption="Total paid to suppliers"
            tone="green"
          />

          <StatCard
            label="Open Bills"
            value={String(
              statistics.openBills
            )}
            caption="Bills with balance"
            tone="violet"
          />

          <StatCard
            label="Paid Bills"
            value={String(
              statistics.fullyPaid
            )}
            caption="Fully settled"
            tone="blue"
          />

        </div>

        {/* OPEN PAYABLES */}

        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          <div className="flex items-center justify-between border-b bg-slate-50 px-5 py-4">

            <div>

              <h2 className="font-black">
                Outstanding Supplier Bills
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Supplier invoices requiring
                payment or settlement.
              </p>

            </div>

            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
              {openBills.length}
            </span>

          </div>

          {loading ? (

            <div className="p-10 text-center text-slate-500">
              Loading Supplier Bills...
            </div>

          ) : openBills.length ===
            0 ? (

            <div className="p-10 text-center">

              <div className="text-4xl">
                ✅
              </div>

              <div className="mt-3 font-black">
                No Supplier Payables
              </div>

              <p className="mt-1 text-sm text-slate-500">
                There are currently no outstanding
                supplier bills.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1250px] text-left text-sm">

                <thead>

                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                    <th className="px-4 py-4">
                      Bill
                    </th>

                    <th className="px-4 py-4">
                      Supplier Invoice
                    </th>

                    <th className="px-4 py-4">
                      Supplier
                    </th>

                    <th className="px-4 py-4">
                      PO
                    </th>

                    <th className="px-4 py-4">
                      Total
                    </th>

                    <th className="px-4 py-4">
                      Paid
                    </th>

                    <th className="px-4 py-4">
                      Payable
                    </th>

                    <th className="px-4 py-4">
                      Due
                    </th>

                    <th className="px-4 py-4">
                      Ageing
                    </th>

                    <th className="px-4 py-4">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {openBills.map(
                    (
                      bill
                    ) => (

                      <tr
                        key={
                          bill.id
                        }
                        className="border-b last:border-0 hover:bg-slate-50"
                      >

                        <td className="px-4 py-4">

                          <div className="font-black text-fuchsia-700">
                            {
                              bill.billNumber
                            }
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {formatDate(
                              bill.billDate
                            )}
                          </div>

                        </td>

                        <td className="px-4 py-4 font-semibold">
                          {
                            bill.supplierInvoiceNumber
                          }
                        </td>

                        <td className="px-4 py-4">

                          <div className="font-bold">
                            {
                              bill.supplierName
                            }
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {
                              bill.supplierCode
                            }
                          </div>

                        </td>

                        <td className="px-4 py-4 font-bold text-amber-700">
                          {
                            bill.purchaseOrderNumber ||
                            "—"
                          }
                        </td>

                        <td className="px-4 py-4 font-bold">
                          {money(
                            bill.totalAmount,
                            appSettings.currencySymbol ||
                              "₹"
                          )}
                        </td>

                        <td className="px-4 py-4 font-bold text-green-700">
                          {money(
                            paidAmount(
                              bill
                            ),
                            appSettings.currencySymbol ||
                              "₹"
                          )}
                        </td>

                        <td className="px-4 py-4 font-black text-orange-600">
                          {money(
                            outstanding(
                              bill
                            ),
                            appSettings.currencySymbol ||
                              "₹"
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {formatDate(
                            bill.dueDate
                          )}
                        </td>

                        <td className="px-4 py-4">

                          <AgeingBadge
                            bucket={
                              ageingBucket(
                                bill
                              )
                            }
                            days={
                              overdueDays(
                                bill
                              )
                            }
                          />

                        </td>

                        <td className="px-4 py-4">

                          <button
                            type="button"
                            onClick={() =>
                              openPayment(
                                bill
                              )
                            }
                            className="rounded-lg bg-fuchsia-700 px-4 py-2 text-xs font-black text-white"
                          >
                            Pay Supplier
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* SEARCH */}

        <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1fr_220px]">

          <input
            value={
              search
            }
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search supplier, bill, supplier invoice or PO..."
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

        {/* ALL BILLS */}

        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          <div className="border-b px-5 py-4">

            <h2 className="font-black">
              Supplier Bill Register
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Complete supplier liability history.
            </p>

          </div>

          {filteredBills.length ===
            0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl">
                🧾
              </div>

              <div className="mt-4 font-black">
                No Supplier Bills
              </div>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1200px] text-left text-sm">

                <thead>

                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                    <th className="px-4 py-4">
                      Bill
                    </th>

                    <th className="px-4 py-4">
                      Supplier
                    </th>

                    <th className="px-4 py-4">
                      Supplier Invoice
                    </th>

                    <th className="px-4 py-4">
                      PO
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
                      Status
                    </th>

                    <th className="px-4 py-4">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredBills.map(
                    (
                      bill
                    ) => (

                      <tr
                        key={
                          bill.id
                        }
                        className="border-b last:border-0 hover:bg-slate-50"
                      >

                        <td className="px-4 py-4 font-black text-fuchsia-700">
                          {
                            bill.billNumber
                          }
                        </td>

                        <td className="px-4 py-4">
                          {
                            bill.supplierName
                          }
                        </td>

                        <td className="px-4 py-4">
                          {
                            bill.supplierInvoiceNumber
                          }
                        </td>

                        <td className="px-4 py-4 font-bold text-amber-700">
                          {
                            bill.purchaseOrderNumber ||
                            "—"
                          }
                        </td>

                        <td className="px-4 py-4 font-bold">
                          {money(
                            bill.totalAmount,
                            appSettings.currencySymbol ||
                              "₹"
                          )}
                        </td>

                        <td className="px-4 py-4 font-bold text-green-700">
                          {money(
                            paidAmount(
                              bill
                            ),
                            appSettings.currencySymbol ||
                              "₹"
                          )}
                        </td>

                        <td className="px-4 py-4 font-black text-orange-600">
                          {money(
                            outstanding(
                              bill
                            ),
                            appSettings.currencySymbol ||
                              "₹"
                          )}
                        </td>

                        <td className="px-4 py-4">

                          <BillStatusBadge
                            status={
                              billStatus(
                                bill
                              )
                            }
                          />

                        </td>

                        <td className="px-4 py-4">

                          <div className="flex gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setViewingBill(
                                  bill
                                )
                              }
                              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold"
                            >
                              View
                            </button>

                            {outstanding(
                              bill
                            ) >
                              0.009 && (

                              <button
                                type="button"
                                onClick={() =>
                                  openPayment(
                                    bill
                                  )
                                }
                                className="rounded-lg bg-fuchsia-50 px-3 py-2 text-xs font-black text-fuchsia-700"
                              >
                                Payment
                              </button>

                            )}

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

        {/* PAYMENT HISTORY */}

        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          <div className="border-b px-5 py-4">

            <h2 className="font-black">
              Supplier Payment History
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Actual payments made to suppliers.
            </p>

          </div>

          {payments.length ===
            0 ? (

            <div className="p-10 text-center text-slate-500">
              No Supplier Payments recorded.
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
                      Supplier
                    </th>

                    <th className="px-4 py-4">
                      Bill
                    </th>

                    <th className="px-4 py-4">
                      PO
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

                  {payments.map(
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
                            payment.paymentDate
                          )}
                        </td>

                        <td className="px-4 py-4 font-bold">
                          {
                            payment.supplierName
                          }
                        </td>

                        <td className="px-4 py-4 font-black text-fuchsia-700">
                          {
                            payment.billNumber
                          }
                        </td>

                        <td className="px-4 py-4">
                          {
                            payment.purchaseOrderNumber ||
                            "—"
                          }
                        </td>

                        <td className="px-4 py-4 font-black text-red-600">
                          {money(
                            payment.amount,
                            appSettings.currencySymbol ||
                              "₹"
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {
                            payment.paymentMethod
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
                                setViewingPayment(
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
                                printPaymentAdvice(
                                  payment
                                )
                              }
                              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                            >
                              Advice
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

      {showPaymentForm && (

        <ModalOverlay>

          <div className="my-8 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            <ModalHeader
              title="Supplier Payment"
              caption="Accounts Payable"
              onClose={
                closePayment
              }
            />

            <div className="space-y-6 p-6">

              <Section
                title="Supplier Bill"
                description="Select the supplier liability being settled."
              >

                <Field
                  label="Supplier Bill *"
                  caption="Only bills with an outstanding balance are shown."
                >

                  <select
                    value={
                      form.billId
                    }
                    onChange={(e) => {
                      const id =
                        e.target.value;

                      const bill =
                        bills.find(
                          (
                            row
                          ) =>
                            row.id ===
                            id
                        );

                      setForm(
                        (
                          old
                        ) => ({
                          ...old,

                          billId:
                            id,

                          amount:
                            bill
                              ? outstanding(
                                  bill
                                )
                              : 0,
                        })
                      );
                    }}
                    className="w-full rounded-xl border bg-white px-4 py-3"
                  >

                    <option value="">
                      Select Supplier Bill
                    </option>

                    {openBills.map(
                      (
                        bill
                      ) => (

                        <option
                          key={
                            bill.id
                          }
                          value={
                            bill.id
                          }
                        >
                          {bill.billNumber}

                          {" — "}

                          {bill.supplierName}

                          {" — "}

                          {money(
                            outstanding(
                              bill
                            ),
                            appSettings.currencySymbol ||
                              "₹"
                          )}
                        </option>

                      )
                    )}

                  </select>

                </Field>

              </Section>

              {selectedBill && (

                <>

                  <div className="grid gap-3 rounded-xl border border-fuchsia-100 bg-fuchsia-50 p-4 sm:grid-cols-2 lg:grid-cols-3">

                    <Info
                      label="Supplier"
                      value={
                        selectedBill.supplierName
                      }
                    />

                    <Info
                      label="Supplier Invoice"
                      value={
                        selectedBill.supplierInvoiceNumber
                      }
                    />

                    <Info
                      label="Purchase Order"
                      value={
                        selectedBill.purchaseOrderNumber ||
                        "—"
                      }
                    />

                    <Info
                      label="Bill Total"
                      value={money(
                        selectedBill.totalAmount,
                        appSettings.currencySymbol ||
                          "₹"
                      )}
                    />

                    <Info
                      label="Already Paid"
                      value={money(
                        paidAmount(
                          selectedBill
                        ),
                        appSettings.currencySymbol ||
                          "₹"
                      )}
                    />

                    <Info
                      label="Outstanding"
                      value={money(
                        outstanding(
                          selectedBill
                        ),
                        appSettings.currencySymbol ||
                          "₹"
                      )}
                    />

                  </div>

                  {selectedSupplier && (

                    <Section
                      title="Supplier Bank Details"
                      description="Payment details from Supplier Master."
                    >

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                        <Info
                          label="Bank"
                          value={
                            selectedSupplier.bankName ||
                            "—"
                          }
                        />

                        <Info
                          label="Account Name"
                          value={
                            selectedSupplier.bankAccountName ||
                            "—"
                          }
                        />

                        <Info
                          label="Account Number"
                          value={
                            selectedSupplier.bankAccountNumber ||
                            "—"
                          }
                        />

                        <Info
                          label="IFSC"
                          value={
                            selectedSupplier.ifscCode ||
                            "—"
                          }
                        />

                        <Info
                          label="UPI ID"
                          value={
                            selectedSupplier.upiId ||
                            "—"
                          }
                        />

                      </div>

                    </Section>

                  )}

                </>

              )}

              <Section
                title="Payment Details"
                description="Record the actual supplier payment."
              >

                <div className="grid gap-5 md:grid-cols-2">

                  <Field
                    label="Payment Date *"
                    caption="Date money was paid to the supplier."
                  >

                    <input
                      type="date"
                      value={
                        form.paymentDate
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,

                          paymentDate:
                            e.target.value,
                        })
                      }
                      className="w-full rounded-xl border px-4 py-3"
                    />

                  </Field>

                  <Field
                    label="Payment Amount *"
                    caption="Partial payments are allowed."
                  >

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      max={
                        selectedBill
                          ? outstanding(
                              selectedBill
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
                    caption="How the supplier was paid."
                  >

                    <select
                      value={
                        form.paymentMethod
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,

                          paymentMethod:
                            e.target.value as PaymentMethod,
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
                    label={
                      form.paymentMethod ===
                      "Cheque"
                        ? "Cheque Number *"
                        : "Bank / UPI Reference"
                    }
                    caption="Transaction reference, UTR, UPI reference or cheque number."
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
                    caption="Optional settlement or reconciliation notes."
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

              {selectedBill &&
                form.amount >
                  0 && (

                <div className="grid gap-4 sm:grid-cols-2">

                  <SummaryBox
                    label="Payable Before"
                    value={money(
                      outstanding(
                        selectedBill
                      ),
                      appSettings.currencySymbol ||
                        "₹"
                    )}
                  />

                  <SummaryBox
                    label="Payable After"
                    value={money(
                      Math.max(
                        outstanding(
                          selectedBill
                        ) -
                          Number(
                            form.amount ||
                              0
                          ),
                        0
                      ),
                      appSettings.currencySymbol ||
                        "₹"
                    )}
                    emphasis={
                      outstanding(
                        selectedBill
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

            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">

              <button
                type="button"
                onClick={
                  closePayment
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
                  void savePayment()
                }
                disabled={
                  saving ||
                  !selectedBill
                }
                className="rounded-xl bg-fuchsia-700 px-6 py-3 font-black text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Record Supplier Payment"}
              </button>

            </div>

          </div>

        </ModalOverlay>

      )}

      {/* =================================================
          BILL VIEW
      ================================================= */}

      {viewingBill && (

        <ModalOverlay>

          <div className="my-8 max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <ModalHeader
              title={
                viewingBill.billNumber
              }
              caption="Supplier Bill"
              onClose={() =>
                setViewingBill(
                  null
                )
              }
            />

            <div className="space-y-6 p-6">

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                <Info
                  label="Supplier"
                  value={
                    viewingBill.supplierName
                  }
                />

                <Info
                  label="Supplier Invoice"
                  value={
                    viewingBill.supplierInvoiceNumber
                  }
                />

                <Info
                  label="Purchase Order"
                  value={
                    viewingBill.purchaseOrderNumber ||
                    "—"
                  }
                />

                <Info
                  label="Status"
                  value={
                    billStatus(
                      viewingBill
                    )
                  }
                />

                <Info
                  label="Bill Date"
                  value={formatDate(
                    viewingBill.billDate
                  )}
                />

                <Info
                  label="Due Date"
                  value={formatDate(
                    viewingBill.dueDate
                  )}
                />

                <Info
                  label="Bill Total"
                  value={money(
                    viewingBill.totalAmount,
                    appSettings.currencySymbol ||
                      "₹"
                  )}
                />

                <Info
                  label="Outstanding"
                  value={money(
                    outstanding(
                      viewingBill
                    ),
                    appSettings.currencySymbol ||
                      "₹"
                  )}
                />

              </div>

              <Section
                title="Payment History"
                description="Payments posted against this supplier bill."
              >

                {billPayments(
                  viewingBill
                ).length ===
                  0 ? (

                  <div className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">
                    No payments recorded.
                  </div>

                ) : (

                  <div className="overflow-x-auto rounded-xl border bg-white">

                    <table className="w-full min-w-[700px] text-left text-sm">

                      <thead>

                        <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                          <th className="px-4 py-3">
                            Date
                          </th>

                          <th className="px-4 py-3">
                            Amount
                          </th>

                          <th className="px-4 py-3">
                            Method
                          </th>

                          <th className="px-4 py-3">
                            Reference
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {billPayments(
                          viewingBill
                        ).map(
                          (
                            payment
                          ) => (

                            <tr
                              key={
                                payment.id
                              }
                              className="border-b last:border-0"
                            >

                              <td className="px-4 py-3">
                                {formatDate(
                                  payment.paymentDate
                                )}
                              </td>

                              <td className="px-4 py-3 font-black text-green-700">
                                {money(
                                  payment.amount,
                                  appSettings.currencySymbol ||
                                    "₹"
                                )}
                              </td>

                              <td className="px-4 py-3">
                                {
                                  payment.paymentMethod
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  payment.reference ||
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

              </Section>

            </div>

          </div>

        </ModalOverlay>

      )}

      {/* =================================================
          PAYMENT VIEW
      ================================================= */}

      {viewingPayment && (

        <ModalOverlay>

          <div className="my-8 w-full max-w-xl rounded-2xl bg-white shadow-2xl">

            <ModalHeader
              title={money(
                viewingPayment.amount,
                appSettings.currencySymbol ||
                  "₹"
              )}
              caption="Supplier Payment"
              onClose={() =>
                setViewingPayment(
                  null
                )
              }
            />

            <div className="grid gap-3 p-6 sm:grid-cols-2">

              <Info
                label="Supplier"
                value={
                  viewingPayment.supplierName
                }
              />

              <Info
                label="Bill"
                value={
                  viewingPayment.billNumber
                }
              />

              <Info
                label="Supplier Invoice"
                value={
                  viewingPayment.supplierInvoiceNumber
                }
              />

              <Info
                label="Purchase Order"
                value={
                  viewingPayment.purchaseOrderNumber ||
                  "—"
                }
              />

              <Info
                label="Date"
                value={formatDate(
                  viewingPayment.paymentDate
                )}
              />

              <Info
                label="Method"
                value={
                  viewingPayment.paymentMethod
                }
              />

              <Info
                label="Reference"
                value={
                  viewingPayment.reference ||
                  "—"
                }
              />

            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">

              <button
                type="button"
                onClick={() =>
                  printPaymentAdvice(
                    viewingPayment
                  )
                }
                className="rounded-xl bg-blue-50 px-5 py-3 font-bold text-blue-700"
              >
                Print Advice
              </button>

              <button
                type="button"
                onClick={() =>
                  setViewingPayment(
                    null
                  )
                }
                className="rounded-xl border px-5 py-3 font-bold"
              >
                Close
              </button>

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

        <div className="text-xs font-black uppercase tracking-wide text-fuchsia-600">
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
        className="text-3xl text-slate-400"
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

      <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 break-words text-sm font-black">
        {value || "—"}
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
          ? "border-green-200 bg-green-50"
          : "bg-white"
      }`}
    >

      <div className="text-xs font-black uppercase text-slate-400">
        {label}
      </div>

      <div
        className={`mt-1 text-xl font-black ${
          emphasis
            ? "text-green-700"
            : ""
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
    | "amber"
    | "rose"
    | "green"
    | "violet"
    | "blue";
}) {
  const styles = {
    amber:
      "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50",

    rose:
      "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-50",

    green:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50",

    violet:
      "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50",

    blue:
      "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50",
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

      <div className="mt-1 text-xs text-slate-500">
        {caption}
      </div>

    </div>
  );
}

function BillStatusBadge({
  status,
}: {
  status:
    BillStatus;
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
      ? "bg-green-100 text-green-700"
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
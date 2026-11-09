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

type Production = {
  id: string;

  productionNumber: string;

  workOrderId: string;
  workOrderNumber: string;

  orderId: string;
  orderNumber: string;
  orderItemId: string;

  customerId: string;
  customerName: string;

  digitizingId: string;

  designName: string;
  itemDescription: string;

  garmentColor: string;
  garmentSize: string;

  status: string;

  machineName: string;
  operatorName: string;

  productionQuantity: number;
  completedQuantity: number;

  stitchCount: number;

  embroideryWidthMm: number;
  embroideryHeightMm: number;

  hoopSize: string;

  colourCount: number;
  threadColors: string;

  threadType: string;
  needleType: string;

  backingType: string;
  toppingRequired: string;

  machineSpeed: number;

  placement: string;

  sampleApproved: string;
  sampleApprovedBy: string;

  startDate: string;
  startTime: string;

  completedDate: string;
  completedTime: string;

  rejectedQuantity: number;
  reworkQuantity: number;

  downtimeMinutes: number;
  stoppageReason: string;

  productionInstructions: string;
  packingInstructions: string;

  notes: string;

  createdAt: string;
  updatedAt?: string;

  [key: string]: any;
};

type WorkOrder = {
  id: string;
  workOrderNumber: string;

  orderId: string;
  orderNumber: string;
  orderItemId: string;

  customerId: string;
  customerName: string;

  itemDescription: string;
  garmentColor: string;
  garmentSize: string;

  designName: string;
  placement: string;

  productionQuantity: number;
  unit: string;

  targetCompletionDate: string;

  status: string;

  [key: string]: any;
};

type Order = {
  id: string;

  orderNumber: string;

  customerId: string;
  customerName: string;

  status: string;

  [key: string]: any;
};

type Customer = {
  id: string;

  customerCode: string;

  name: string;
  businessName: string;

  phone: string;
  email: string;

  [key: string]: any;
};

type QualityControl = {
  id: string;

  qcNumber: string;

  productionId: string;
  productionNumber: string;

  workOrderId: string;
  workOrderNumber: string;

  orderId: string;
  orderNumber: string;
  orderItemId: string;

  customerId: string;
  customerName: string;

  digitizingId: string;

  designName: string;
  itemDescription: string;

  garmentColor: string;
  garmentSize: string;

  machineName: string;
  operatorName: string;

  productionQuantity: number;
  productionCompletedQuantity: number;
  productionRejectedQuantity: number;
  productionReworkQuantity: number;

  inspectedQuantity: number;
  passedQuantity: number;
  rejectedQuantity: number;
  reworkQuantity: number;

  qcStatus: string;

  stitchQuality: string;
  threadQuality: string;
  placementAccuracy: string;
  sizeAccuracy: string;
  colorAccuracy: string;
  finishingQuality: string;
  cleanliness: string;
  packagingReadiness: string;

  defectType: string;
  defectDetails: string;

  correctiveAction: string;

  inspectionDate: string;
  inspectorName: string;

  dispatchReady: string;

  notes: string;

  createdAt: string;
  updatedAt: string;

  [key: string]: any;
};

type QCForm = {
  productionId: string;

  inspectionDate: string;
  inspectorName: string;

  inspectedQuantity: number;
  passedQuantity: number;
  rejectedQuantity: number;
  reworkQuantity: number;

  stitchQuality: string;
  threadQuality: string;
  placementAccuracy: string;
  sizeAccuracy: string;
  colorAccuracy: string;
  finishingQuality: string;
  cleanliness: string;
  packagingReadiness: string;

  defectType: string;
  defectDetails: string;

  correctiveAction: string;

  qcStatus: string;

  notes: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const QUALITY_OPTIONS = [
  "Not Checked",
  "Pass",
  "Minor Issue",
  "Fail",
];

const QC_STATUSES = [
  "Pending",
  "In Inspection",
  "Pass",
  "Fail",
  "Rework Required",
];

const DEFECT_TYPES = [
  "None",
  "Stitch Defect",
  "Thread Break",
  "Loose Thread",
  "Skipped Stitch",
  "Incorrect Thread Color",
  "Incorrect Placement",
  "Incorrect Size",
  "Fabric Damage",
  "Puckering",
  "Registration Issue",
  "Finishing Issue",
  "Stain / Dirt",
  "Packaging Issue",
  "Other",
];

/* =========================================================
   EMPTY FORM

   No Date() here. Next.js 16 Cache Components can prerender
   Client Components, so date reads happen after mount/events.
========================================================= */

function emptyForm(): QCForm {
  return {
    productionId: "",

    inspectionDate: "",
    inspectorName: "",

    inspectedQuantity: 0,
    passedQuantity: 0,
    rejectedQuantity: 0,
    reworkQuantity: 0,

    stitchQuality: "Not Checked",
    threadQuality: "Not Checked",
    placementAccuracy: "Not Checked",
    sizeAccuracy: "Not Checked",
    colorAccuracy: "Not Checked",
    finishingQuality: "Not Checked",
    cleanliness: "Not Checked",
    packagingReadiness: "Not Checked",

    defectType: "None",
    defectDetails: "",

    correctiveAction: "",

    qcStatus: "Pending",

    notes: "",
  };
}

/* =========================================================
   HELPERS
========================================================= */

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

  return `qc-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

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

function toNumber(
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

function normalizeDate(
  value: unknown
) {
  const text =
    clean(value);

  return text
    ? text.split("T")[0]
    : "";
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

function allCriticalChecksCompleted(
  form: QCForm
) {
  return [
    form.stitchQuality,
    form.threadQuality,
    form.placementAccuracy,
    form.sizeAccuracy,
    form.colorAccuracy,
    form.finishingQuality,
    form.cleanliness,
    form.packagingReadiness,
  ].every(
    (value) =>
      value !==
      "Not Checked"
  );
}

function allCriticalChecksPass(
  form: QCForm
) {
  return [
    form.stitchQuality,
    form.threadQuality,
    form.placementAccuracy,
    form.sizeAccuracy,
    form.colorAccuracy,
    form.finishingQuality,
    form.cleanliness,
    form.packagingReadiness,
  ].every(
    (value) =>
      value ===
      "Pass"
  );
}

/* =========================================================
   NORMALIZERS
========================================================= */

function normalizeProduction(
  row: any
): Production {
  const productionQuantity =
    toNumber(
      row?.productionQuantity ??
        row?.quantity
    );

  /*
   * Legacy records may not have completedQuantity.
   * If they are Completed, the planned quantity is treated
   * as completed so existing jobs remain available for QC.
   */
  const status =
    clean(
      row?.status ??
        row?.productionStatus
    );

  const completedQuantity =
    toNumber(
      row?.completedQuantity
    ) ||
    (
      [
        "completed",
        "complete",
        "production completed",
        "completed production",
      ].includes(
        normalizeText(
          status
        )
      )
        ? productionQuantity
        : 0
    );

  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    productionNumber:
      clean(
        row?.productionNumber ??
          row?.productionNo ??
          row?.id
      ),

    workOrderId:
      clean(
        row?.workOrderId
      ),

    workOrderNumber:
      clean(
        row?.workOrderNumber
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

    digitizingId:
      clean(
        row?.digitizingId
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

    status,

    machineName:
      clean(
        row?.machineName
      ),

    operatorName:
      clean(
        row?.operatorName
      ),

    productionQuantity,

    completedQuantity,

    stitchCount:
      toNumber(
        row?.stitchCount ??
          row?.stitches
      ),

    embroideryWidthMm:
      toNumber(
        row?.embroideryWidthMm ??
          row?.embroideryWidth
      ),

    embroideryHeightMm:
      toNumber(
        row?.embroideryHeightMm ??
          row?.embroideryHeight
      ),

    hoopSize:
      clean(
        row?.hoopSize
      ),

    colourCount:
      toNumber(
        row?.colourCount ??
          row?.colorCount
      ),

    threadColors:
      clean(
        row?.threadColors ??
          row?.threadColours
      ),

    threadType:
      clean(
        row?.threadType
      ),

    needleType:
      clean(
        row?.needleType
      ),

    backingType:
      clean(
        row?.backingType
      ),

    toppingRequired:
      clean(
        row?.toppingRequired
      ),

    machineSpeed:
      toNumber(
        row?.machineSpeed
      ),

    placement:
      clean(
        row?.placement
      ),

    sampleApproved:
      clean(
        row?.sampleApproved
      ),

    sampleApprovedBy:
      clean(
        row?.sampleApprovedBy
      ),

    startDate:
      normalizeDate(
        row?.startDate
      ),

    startTime:
      clean(
        row?.startTime
      ),

    completedDate:
      normalizeDate(
        row?.completedDate ??
          row?.completionDate
      ),

    completedTime:
      clean(
        row?.completedTime
      ),

    rejectedQuantity:
      toNumber(
        row?.rejectedQuantity
      ),

    reworkQuantity:
      toNumber(
        row?.reworkQuantity
      ),

    downtimeMinutes:
      toNumber(
        row?.downtimeMinutes
      ),

    stoppageReason:
      clean(
        row?.stoppageReason
      ),

    productionInstructions:
      clean(
        row?.productionInstructions
      ),

    packingInstructions:
      clean(
        row?.packingInstructions
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

function normalizeWorkOrder(
  row: any
): WorkOrder {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    workOrderNumber:
      clean(
        row?.workOrderNumber
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
        row?.customerName
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

    designName:
      clean(
        row?.designName
      ),

    placement:
      clean(
        row?.placement
      ),

    productionQuantity:
      toNumber(
        row?.productionQuantity
      ),

    unit:
      clean(
        row?.unit
      ) ||
      "pcs",

    targetCompletionDate:
      normalizeDate(
        row?.targetCompletionDate
      ),

    status:
      clean(
        row?.status
      ),
  };
}

function normalizeOrder(
  row: any
): Order {
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
        row?.customerName ??
          row?.customer
      ),

    status:
      clean(
        row?.status
      ),
  };
}

function normalizeCustomer(
  row: any
): Customer {
  return {
    ...row,

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
        row?.businessName
      ),

    phone:
      clean(
        row?.phone
      ),

    email:
      clean(
        row?.email
      ),
  };
}

function normalizeQC(
  row: any
): QualityControl {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    qcNumber:
      clean(
        row?.qcNumber
      ),

    productionId:
      clean(
        row?.productionId
      ),

    productionNumber:
      clean(
        row?.productionNumber
      ),

    workOrderId:
      clean(
        row?.workOrderId
      ),

    workOrderNumber:
      clean(
        row?.workOrderNumber
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
        row?.customerName
      ),

    digitizingId:
      clean(
        row?.digitizingId
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

    machineName:
      clean(
        row?.machineName
      ),

    operatorName:
      clean(
        row?.operatorName
      ),

    productionQuantity:
      toNumber(
        row?.productionQuantity
      ),

    productionCompletedQuantity:
      toNumber(
        row?.productionCompletedQuantity
      ) ||
      toNumber(
        row?.productionQuantity
      ),

    productionRejectedQuantity:
      toNumber(
        row?.productionRejectedQuantity
      ),

    productionReworkQuantity:
      toNumber(
        row?.productionReworkQuantity
      ),

    inspectedQuantity:
      toNumber(
        row?.inspectedQuantity ??
          row?.checkedQuantity
      ),

    passedQuantity:
      toNumber(
        row?.passedQuantity
      ),

    rejectedQuantity:
      toNumber(
        row?.rejectedQuantity ??
          row?.failedQuantity
      ),

    reworkQuantity:
      toNumber(
        row?.reworkQuantity
      ),

    qcStatus:
      clean(
        row?.qcStatus ??
          row?.result ??
          row?.status ??
          "Pending"
      ),

    stitchQuality:
      clean(
        row?.stitchQuality ??
          "Not Checked"
      ),

    threadQuality:
      clean(
        row?.threadQuality ??
          "Not Checked"
      ),

    placementAccuracy:
      clean(
        row?.placementAccuracy ??
          "Not Checked"
      ),

    sizeAccuracy:
      clean(
        row?.sizeAccuracy ??
          "Not Checked"
      ),

    colorAccuracy:
      clean(
        row?.colorAccuracy ??
          row?.colourAccuracy ??
          "Not Checked"
      ),

    finishingQuality:
      clean(
        row?.finishingQuality ??
          row?.trimmingQuality ??
          "Not Checked"
      ),

    cleanliness:
      clean(
        row?.cleanliness ??
          "Not Checked"
      ),

    packagingReadiness:
      clean(
        row?.packagingReadiness ??
          "Not Checked"
      ),

    defectType:
      clean(
        row?.defectType ??
          "None"
      ),

    defectDetails:
      clean(
        row?.defectDetails
      ),

    correctiveAction:
      clean(
        row?.correctiveAction
      ),

    inspectionDate:
      normalizeDate(
        row?.inspectionDate ??
          row?.checkedDate
      ),

    inspectorName:
      clean(
        row?.inspectorName ??
          row?.checkedBy
      ),

    dispatchReady:
      clean(
        row?.dispatchReady
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
   MAIN
========================================================= */

export default function QualityControlPage() {
  const [
    form,
    setForm,
  ] =
    useState<QCForm>(
      emptyForm()
    );

  const [
    productions,
    setProductions,
  ] =
    useState<Production[]>(
      []
    );

  const [
    workOrders,
    setWorkOrders,
  ] =
    useState<WorkOrder[]>(
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
    customers,
    setCustomers,
  ] =
    useState<Customer[]>(
      []
    );

  const [
    qualityRows,
    setQualityRows,
  ] =
    useState<QualityControl[]>(
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
    useState<QualityControl | null>(
      null
    );

  const [
    viewing,
    setViewing,
  ] =
    useState<QualityControl | null>(
      null
    );

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

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    setForm(
      (current) => ({
        ...current,

        inspectionDate:
          getToday(),
      })
    );

    void loadData();
  }, []);

  /* =======================================================
     MODAL BODY LOCK
  ======================================================= */

  useEffect(() => {
    if (
      !showForm &&
      !viewing
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
    viewing,
  ]);

  /* =======================================================
     EXCEL
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
        "QC Excel request failed:",
        {
          request:
            body,

          response:
            data,
        }
      );

      throw new Error(
        data?.error ||
          data?.message ||
          "Failed to save Excel data."
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
        productionRows,
        workOrderRows,
        orderRows,
        customerRows,
        qcRows,
      ] =
        await Promise.all([
          loadSheet(
            "Production"
          ),

          loadSheet(
            "WorkOrders"
          ),

          loadSheet(
            "Orders"
          ),

          loadSheet(
            "Customers"
          ),

          loadSheet(
            "QualityControl"
          ),
        ]);

      setProductions(
        productionRows
          .map(
            normalizeProduction
          )
          .filter(
            (
              row:
                Production
            ) =>
              Boolean(
                row.id
              )
          )
      );

      setWorkOrders(
        workOrderRows
          .map(
            normalizeWorkOrder
          )
          .filter(
            (
              row:
                WorkOrder
            ) =>
              Boolean(
                row.id
              )
          )
      );

      setOrders(
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
                row.id
              )
          )
      );

      setCustomers(
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
      );

      setQualityRows(
        qcRows
          .map(
            normalizeQC
          )
          .filter(
            (
              row:
                QualityControl
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
                b.createdAt ||
                  b.inspectionDate
              ).localeCompare(
                String(
                  a.createdAt ||
                    a.inspectionDate
                )
              )
          )
      );
    } catch (
      error
    ) {
      console.error(
        "QC load error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load Quality Control."
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
     COMPLETED PRODUCTION
  ======================================================= */

  const completedProductions =
    useMemo(() => {
      return productions.filter(
        (
          production
        ) =>
          [
            "completed",
            "complete",
            "production completed",
            "completed production",
          ].includes(
            normalizeText(
              production.status
            )
          )
      );
    }, [
      productions,
    ]);

  /* =======================================================
     AVAILABLE PRODUCTION
  ======================================================= */

  const availableProductions =
    useMemo(() => {
      return completedProductions.filter(
        (
          production
        ) => {
          const existing =
            qualityRows.find(
              (
                qc
              ) =>
                qc.productionId ===
                production.id
            );

          if (
            !existing
          ) {
            return true;
          }

          return (
            editing?.productionId ===
            production.id
          );
        }
      );
    }, [
      completedProductions,
      qualityRows,
      editing,
    ]);

  /* =======================================================
     SELECTED RECORDS
  ======================================================= */

  const selectedProduction =
    useMemo(
      () =>
        productions.find(
          (
            production
          ) =>
            production.id ===
            form.productionId
        ),
      [
        productions,
        form.productionId,
      ]
    );

  const selectedWorkOrder =
    useMemo(() => {
      if (
        !selectedProduction
      ) {
        return undefined;
      }

      if (
        selectedProduction.workOrderId
      ) {
        const byId =
          workOrders.find(
            (
              row
            ) =>
              row.id ===
              selectedProduction.workOrderId
          );

        if (
          byId
        ) {
          return byId;
        }
      }

      if (
        selectedProduction.workOrderNumber
      ) {
        return workOrders.find(
          (
            row
          ) =>
            row.workOrderNumber ===
            selectedProduction.workOrderNumber
        );
      }

      return undefined;
    }, [
      selectedProduction,
      workOrders,
    ]);

  const selectedOrder =
    useMemo(() => {
      if (
        !selectedProduction
      ) {
        return undefined;
      }

      return orders.find(
        (
          order
        ) =>
          order.id ===
            selectedProduction.orderId ||
          order.orderNumber ===
            selectedProduction.orderNumber
      );
    }, [
      selectedProduction,
      orders,
    ]);

  const selectedCustomer =
    useMemo(() => {
      const customerId =
        selectedProduction
          ?.customerId ||
        selectedOrder
          ?.customerId;

      if (
        customerId
      ) {
        const found =
          customers.find(
            (
              customer
            ) =>
              customer.id ===
              customerId
          );

        if (
          found
        ) {
          return found;
        }
      }

      const name =
        selectedProduction
          ?.customerName ||
        selectedOrder
          ?.customerName;

      return customers.find(
        (
          customer
        ) =>
          customer.name ===
            name ||
          customer.businessName ===
            name
      );
    }, [
      selectedProduction,
      selectedOrder,
      customers,
    ]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredRows =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return qualityRows.filter(
        (
          qc
        ) => {
          const statusMatches =
            statusFilter ===
              "All" ||
            qc.qcStatus ===
              statusFilter;

          const text =
            [
              qc.qcNumber,
              qc.productionNumber,
              qc.workOrderNumber,
              qc.orderNumber,
              qc.customerName,
              qc.designName,
              qc.itemDescription,
              qc.machineName,
              qc.operatorName,
              qc.inspectorName,
              qc.qcStatus,
              qc.defectType,
            ]
              .join(" ")
              .toLowerCase();

          return (
            statusMatches &&
            (
              !query ||
              text.includes(
                query
              )
            )
          );
        }
      );
    }, [
      qualityRows,
      search,
      statusFilter,
    ]);

  /* =======================================================
     STATS
  ======================================================= */

  const stats =
    useMemo(() => {
      return {
        awaiting:
          completedProductions.filter(
            (
              production
            ) =>
              !qualityRows.some(
                (
                  qc
                ) =>
                  qc.productionId ===
                  production.id
              )
          ).length,

        inspection:
          qualityRows.filter(
            (
              qc
            ) =>
              [
                "Pending",
                "In Inspection",
              ].includes(
                qc.qcStatus
              )
          ).length,

        passed:
          qualityRows.filter(
            (
              qc
            ) =>
              qc.qcStatus ===
              "Pass"
          ).length,

        failed:
          qualityRows.filter(
            (
              qc
            ) =>
              [
                "Fail",
                "Rework Required",
              ].includes(
                qc.qcStatus
              )
          ).length,
      };
    }, [
      completedProductions,
      qualityRows,
    ]);

  /* =======================================================
     FORM
  ======================================================= */

  function updateForm<
    K extends keyof QCForm
  >(
    field: K,
    value: QCForm[K]
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

  function selectProduction(
    productionId: string
  ) {
    const production =
      productions.find(
        (
          row
        ) =>
          row.id ===
          productionId
      );

    if (
      !production
    ) {
      updateForm(
        "productionId",
        productionId
      );

      return;
    }

    /*
     * QC should inspect actual completed output, not merely
     * the original planned Production quantity.
     */
    const quantity =
      production.completedQuantity ||
      production.productionQuantity ||
      0;

    setForm(
      (
        current
      ) => ({
        ...current,

        productionId:
          production.id,

        inspectedQuantity:
          quantity,

        passedQuantity:
          quantity,

        rejectedQuantity:
          0,

        reworkQuantity:
          0,

        defectType:
          "None",

        defectDetails:
          "",

        correctiveAction:
          "",

        qcStatus:
          "Pending",
      })
    );
  }

  function openCreate() {
    setEditing(
      null
    );

    setForm({
      ...emptyForm(),

      inspectionDate:
        getToday(),
    });

    setShowForm(
      true
    );
  }

  function openEdit(
    qc: QualityControl
  ) {
    setEditing(
      qc
    );

    setForm({
      productionId:
        qc.productionId,

      inspectionDate:
        qc.inspectionDate ||
        getToday(),

      inspectorName:
        qc.inspectorName,

      inspectedQuantity:
        qc.inspectedQuantity,

      passedQuantity:
        qc.passedQuantity,

      rejectedQuantity:
        qc.rejectedQuantity,

      reworkQuantity:
        qc.reworkQuantity,

      stitchQuality:
        qc.stitchQuality,

      threadQuality:
        qc.threadQuality,

      placementAccuracy:
        qc.placementAccuracy,

      sizeAccuracy:
        qc.sizeAccuracy,

      colorAccuracy:
        qc.colorAccuracy,

      finishingQuality:
        qc.finishingQuality,

      cleanliness:
        qc.cleanliness,

      packagingReadiness:
        qc.packagingReadiness,

      defectType:
        qc.defectType,

      defectDetails:
        qc.defectDetails,

      correctiveAction:
        qc.correctiveAction,

      qcStatus:
        qc.qcStatus,

      notes:
        qc.notes,
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
     QC NUMBER
  ======================================================= */

  function nextQCNumber(
    year: number
  ) {
    const prefix =
      `QC-${year}-`;

    let highest = 0;

    qualityRows.forEach(
      (
        row
      ) => {
        if (
          !row.qcNumber.startsWith(
            prefix
          )
        ) {
          return;
        }

        const match =
          row.qcNumber.match(
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

    return `QC-${year}-${String(
      highest + 1
    ).padStart(
      4,
      "0"
    )}`;
  }

  /* =======================================================
     VALIDATE
  ======================================================= */

  function validateForm() {
    if (
      !selectedProduction
    ) {
      return "Select a completed Production job.";
    }

    if (
      !form.inspectionDate
    ) {
      return "Inspection Date is required.";
    }

    if (
      !form.inspectorName.trim()
    ) {
      return "Inspector Name is required.";
    }

    if (
      form.inspectedQuantity <=
      0
    ) {
      return "Inspected Qty must be greater than zero.";
    }

    const availableQty =
      selectedProduction.completedQuantity ||
      selectedProduction.productionQuantity;

    if (
      form.inspectedQuantity >
      availableQty
    ) {
      return `Inspected Qty cannot exceed completed Production quantity of ${availableQty}.`;
    }

    if (
      form.passedQuantity +
        form.rejectedQuantity +
        form.reworkQuantity !==
      form.inspectedQuantity
    ) {
      return "Passed + Rejected + Rework must exactly equal Inspected Qty.";
    }

    if (
      [
        "Pass",
        "Fail",
        "Rework Required",
      ].includes(
        form.qcStatus
      ) &&
      !allCriticalChecksCompleted(
        form
      )
    ) {
      return "Complete all eight embroidery quality checks before setting a final QC status.";
    }

    if (
      form.qcStatus ===
        "Pass" &&
      (
        form.rejectedQuantity >
          0 ||
        form.reworkQuantity >
          0
      )
    ) {
      return "QC cannot be Pass while rejected or rework quantity exists.";
    }

    if (
      form.qcStatus ===
        "Pass" &&
      form.passedQuantity !==
        form.inspectedQuantity
    ) {
      return "For QC Pass, Passed Qty must equal Inspected Qty.";
    }

    if (
      form.qcStatus ===
        "Pass" &&
      !allCriticalChecksPass(
        form
      )
    ) {
      return "All quality checks must be Pass before the final QC status can be Pass.";
    }

    if (
      [
        "Fail",
        "Rework Required",
      ].includes(
        form.qcStatus
      ) &&
      form.defectType ===
        "None"
    ) {
      return "Please select a defect type for failed or rework-required QC.";
    }

    if (
      [
        "Fail",
        "Rework Required",
      ].includes(
        form.qcStatus
      ) &&
      !form.defectDetails.trim()
    ) {
      return "Defect Details are required for failed or rework-required QC.";
    }

    if (
      form.qcStatus ===
        "Rework Required" &&
      !form.correctiveAction.trim()
    ) {
      return "Corrective Action is required when rework is required.";
    }

    return "";
  }

  /* =======================================================
     SAVE QC
  ======================================================= */

  async function saveQC() {
    const error =
      validateForm();

    if (
      error
    ) {
      alert(
        error
      );

      return;
    }

    if (
      !selectedProduction
    ) {
      return;
    }

    try {
      setSaving(
        true
      );

      /*
       * Re-read Production before saving to avoid a QC result
       * being created from stale shop-floor data.
       */
      const freshProductions =
        (
          await loadSheet(
            "Production"
          )
        ).map(
          normalizeProduction
        );

      const production =
        freshProductions.find(
          (
            row
          ) =>
            row.id ===
            selectedProduction.id
        );

      if (
        !production
      ) {
        throw new Error(
          "Selected Production job no longer exists."
        );
      }

      if (
        ![
          "completed",
          "complete",
          "production completed",
          "completed production",
        ].includes(
          normalizeText(
            production.status
          )
        )
      ) {
        throw new Error(
          "Only completed Production jobs can be inspected in Quality Control."
        );
      }

      const completedQty =
        production.completedQuantity ||
        production.productionQuantity;

      if (
        form.inspectedQuantity >
        completedQty
      ) {
        throw new Error(
          `Production completed quantity is now ${completedQty}. Refresh QC and inspect no more than that quantity.`
        );
      }

      const now =
        getNow();

      const year =
        Number(
          form.inspectionDate.slice(
            0,
            4
          )
        );

      const qcNumber =
        editing?.qcNumber ||
        nextQCNumber(
          year
        );

      const order =
        orders.find(
          (
            row
          ) =>
            row.id ===
              production.orderId ||
            row.orderNumber ===
              production.orderNumber
        );

      const workOrder =
        workOrders.find(
          (
            row
          ) =>
            (
              production.workOrderId &&
              row.id ===
                production.workOrderId
            ) ||
            (
              production.workOrderNumber &&
              row.workOrderNumber ===
                production.workOrderNumber
            )
        );

      const customerId =
        production.customerId ||
        order?.customerId ||
        "";

      const customer =
        customers.find(
          (
            row
          ) =>
            row.id ===
            customerId
        );

      const record = {
        qcNumber,

        productionId:
          production.id,

        productionNumber:
          production.productionNumber,

        workOrderId:
          production.workOrderId ||
          workOrder?.id ||
          "",

        workOrderNumber:
          production.workOrderNumber ||
          workOrder?.workOrderNumber ||
          "",

        orderId:
          production.orderId ||
          order?.id ||
          "",

        orderNumber:
          production.orderNumber ||
          order?.orderNumber ||
          "",

        orderItemId:
          production.orderItemId ||
          workOrder?.orderItemId ||
          "",

        customerId,

        customerName:
          production.customerName ||
          customer?.name ||
          customer?.businessName ||
          order?.customerName ||
          "",

        digitizingId:
          production.digitizingId,

        designName:
          production.designName,

        itemDescription:
          production.itemDescription ||
          workOrder?.itemDescription ||
          "",

        garmentColor:
          production.garmentColor ||
          workOrder?.garmentColor ||
          "",

        garmentSize:
          production.garmentSize ||
          workOrder?.garmentSize ||
          "",

        machineName:
          production.machineName,

        operatorName:
          production.operatorName,

        productionQuantity:
          production.productionQuantity,

        productionCompletedQuantity:
          completedQty,

        productionRejectedQuantity:
          production.rejectedQuantity,

        productionReworkQuantity:
          production.reworkQuantity,

        inspectedQuantity:
          form.inspectedQuantity,

        passedQuantity:
          form.passedQuantity,

        rejectedQuantity:
          form.rejectedQuantity,

        reworkQuantity:
          form.reworkQuantity,

        qcStatus:
          form.qcStatus,

        stitchQuality:
          form.stitchQuality,

        threadQuality:
          form.threadQuality,

        placementAccuracy:
          form.placementAccuracy,

        sizeAccuracy:
          form.sizeAccuracy,

        colorAccuracy:
          form.colorAccuracy,

        finishingQuality:
          form.finishingQuality,

        cleanliness:
          form.cleanliness,

        packagingReadiness:
          form.packagingReadiness,

        defectType:
          form.defectType,

        defectDetails:
          form.defectDetails.trim(),

        correctiveAction:
          form.correctiveAction.trim(),

        inspectionDate:
          form.inspectionDate,

        inspectorName:
          form.inspectorName.trim(),

        /*
         * Dispatch must depend on the actual final QC status,
         * never on a stale/manual Ready flag.
         */
        dispatchReady:
          form.qcStatus ===
          "Pass"
            ? "Yes"
            : "No",

        notes:
          form.notes.trim(),

        updatedAt:
          now,
      };

      if (
        editing
      ) {
        await saveExcel({
          action:
            "update",

          sheet:
            "QualityControl",

          id:
            editing.id,

          record: {
            ...editing,

            ...record,
          },
        });
      } else {
        await saveExcel({
          action:
            "add",

          sheet:
            "QualityControl",

          record: {
            id:
              generateId(),

            ...record,

            createdAt:
              now,
          },
        });
      }

      /* ===================================================
         UPDATE ORDER WORKFLOW
      =================================================== */

      if (
        order?.id
      ) {
        let nextStatus =
          "Quality Control";

        if (
          form.qcStatus ===
          "Pass"
        ) {
          nextStatus =
            "Ready for Dispatch";
        }

        if (
          form.qcStatus ===
          "Rework Required"
        ) {
          nextStatus =
            "Production";
        }

        await saveExcel({
          action:
            "update",

          sheet:
            "Orders",

          id:
            order.id,

          record: {
            ...order,

            status:
              nextStatus,

            updatedAt:
              now,
          },
        });
      }

      /* ===================================================
         UPDATE WORK ORDER ON REWORK

         A QC Pass leaves the completed Job Card as Completed.
         Rework reopens the same Job Card for shop-floor action.
      =================================================== */

      if (
        workOrder?.id &&
        form.qcStatus ===
          "Rework Required"
      ) {
        await saveExcel({
          action:
            "update",

          sheet:
            "WorkOrders",

          id:
            workOrder.id,

          record: {
            ...workOrder,

            status:
              "In Production",

            updatedAt:
              now,
          },
        });
      }

      closeForm();

      await loadData(
        true
      );

      alert(
        `${qcNumber} saved successfully.`
      );
    } catch (
      error
    ) {
      console.error(
        "QC save error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to save Quality Control."
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

  async function deleteQC(
    qc: QualityControl
  ) {
    if (
      qc.qcStatus ===
      "Pass"
    ) {
      const confirmed =
        confirm(
          `${qc.qcNumber} is a PASSED QC record and may already be used by Dispatch.\n\nDelete it only if the QC result was entered incorrectly.\n\nContinue?`
        );

      if (
        !confirmed
      ) {
        return;
      }
    } else if (
      !confirm(
        `Delete ${qc.qcNumber}?`
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
          "QualityControl",

        id:
          qc.id,
      });

      /*
       * Best effort: return Order to Quality Control if this
       * was the active QC record and no dispatch decision
       * should remain implied by the deleted record.
       */
      try {
        const order =
          orders.find(
            (
              row
            ) =>
              row.id ===
                qc.orderId ||
              row.orderNumber ===
                qc.orderNumber
          );

        if (
          order?.id
        ) {
          await saveExcel({
            action:
              "update",

            sheet:
              "Orders",

            id:
              order.id,

            record: {
              ...order,

              status:
                "Quality Control",

              updatedAt:
                getNow(),
            },
          });
        }
      } catch (
        workflowError
      ) {
        console.error(
          "Unable to restore Order workflow after QC deletion:",
          workflowError
        );
      }

      await loadData(
        true
      );
    } catch (
      error
    ) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete QC."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="h-full min-h-0 overflow-y-auto">

      <div className="mx-auto w-full max-w-7xl space-y-5 pb-24">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

          <div>

            <div className="mb-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
              Final Production Gate
            </div>

            <h1 className="text-3xl font-black">
              Quality Control
            </h1>

            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
              Inspect completed Production against its Work Order / Job Card. Passed jobs are released to Dispatch; rework is returned to Production.
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
              className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800"
            >
              + New QC Inspection
            </button>

          </div>

        </div>

        {/* WORKFLOW */}

        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 p-4">

          <div className="font-bold text-slate-900">
            🧰 Work Order
            {" → "}
            🪡 Production Completed
            {" → "}
            ✅ Quality Control
            {" → "}
            🚚 Dispatch
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-600">
            QC now keeps the Work Order, machine, operator and actual Production quantities attached to every inspection for full shop-floor traceability.
          </p>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            label="Awaiting QC"
            value={
              stats.awaiting
            }
            tone="blue"
          />

          <StatCard
            label="In Inspection"
            value={
              stats.inspection
            }
            tone="amber"
          />

          <StatCard
            label="QC Passed"
            value={
              stats.passed
            }
            tone="green"
          />

          <StatCard
            label="Failed / Rework"
            value={
              stats.failed
            }
            tone="red"
          />

        </div>

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
            placeholder="Search QC, Work Order, order, customer, machine, operator, design..."
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
              All
            </option>

            {QC_STATUSES.map(
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

            <div className="p-12 text-center text-slate-500">
              Loading Quality Control...
            </div>

          ) : filteredRows.length ===
            0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl">
                ✅
              </div>

              <h2 className="mt-4 text-xl font-black">
                No Quality Control records
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Completed Production jobs will appear for inspection.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1400px] text-left text-sm">

                <thead className="bg-slate-50 text-xs uppercase text-slate-500">

                  <tr>

                    <th className="px-4 py-4">
                      QC / Job Card
                    </th>

                    <th className="px-4 py-4">
                      Order
                    </th>

                    <th className="px-4 py-4">
                      Customer / Item
                    </th>

                    <th className="px-4 py-4">
                      Machine / Operator
                    </th>

                    <th className="px-4 py-4">
                      Production
                    </th>

                    <th className="px-4 py-4">
                      Inspected
                    </th>

                    <th className="px-4 py-4">
                      Passed
                    </th>

                    <th className="px-4 py-4">
                      Rejected
                    </th>

                    <th className="px-4 py-4">
                      Rework
                    </th>

                    <th className="px-4 py-4">
                      Date
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

                  {filteredRows.map(
                    (
                      qc
                    ) => (

                      <tr
                        key={
                          qc.id
                        }
                        className="border-t hover:bg-slate-50"
                      >

                        <td className="px-4 py-4">

                          <div className="font-black text-emerald-700">
                            {qc.qcNumber}
                          </div>

                          <div className="mt-1 text-xs font-semibold text-violet-600">
                            {qc.workOrderNumber ||
                              "Legacy Production"}
                          </div>

                        </td>

                        <td className="px-4 py-4">

                          <div className="font-bold">
                            {qc.orderNumber ||
                              "—"}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {qc.productionNumber}
                          </div>

                        </td>

                        <td className="max-w-[260px] px-4 py-4">

                          <div className="font-semibold">
                            {qc.customerName ||
                              "—"}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {qc.itemDescription ||
                              qc.designName ||
                              "—"}
                          </div>

                        </td>

                        <td className="px-4 py-4">

                          <div className="font-semibold">
                            {qc.machineName ||
                              "—"}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {qc.operatorName ||
                              "—"}
                          </div>

                        </td>

                        <td className="px-4 py-4 font-black">
                          {qc.productionCompletedQuantity ||
                            qc.productionQuantity}
                        </td>

                        <td className="px-4 py-4 font-bold">
                          {qc.inspectedQuantity}
                        </td>

                        <td className="px-4 py-4 font-bold text-green-700">
                          {qc.passedQuantity}
                        </td>

                        <td className="px-4 py-4 font-bold text-red-600">
                          {qc.rejectedQuantity}
                        </td>

                        <td className="px-4 py-4 font-bold text-orange-600">
                          {qc.reworkQuantity}
                        </td>

                        <td className="px-4 py-4">
                          {formatDate(
                            qc.inspectionDate
                          )}
                        </td>

                        <td className="px-4 py-4">

                          <StatusBadge
                            status={
                              qc.qcStatus
                            }
                          />

                        </td>

                        <td className="px-4 py-4">

                          <div className="flex gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setViewing(
                                  qc
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
                                  qc
                                )
                              }
                              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void deleteQC(
                                  qc
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

        </div>

      </div>

      {/* =================================================
          FORM MODAL
      ================================================= */}

      {showForm && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">

          <div className="flex min-h-full items-start justify-center p-4">

            <div className="my-5 flex max-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex shrink-0 justify-between border-b px-6 py-5">

                <div>

                  <div className="text-xs font-black uppercase tracking-wide text-emerald-600">
                    Work Order Quality Gate
                  </div>

                  <h2 className="mt-1 text-2xl font-black">
                    {editing
                      ? `Edit ${editing.qcNumber}`
                      : "New QC Inspection"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Inspect actual completed Production output before releasing the job to Dispatch.
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
                  className="text-3xl text-slate-400"
                >
                  ×
                </button>

              </div>

              {/* SCROLL BODY */}

              <div className="min-h-0 flex-1 overflow-y-auto p-6">

                <div className="space-y-6">

                  {/* PRODUCTION */}

                  <Section
                    title="Completed Production / Job Card"
                    description="Select the completed Production run. Work Order, machine, operator and production results are carried into QC automatically."
                  >

                    <Field
                      label="Completed Production *"
                      caption={`${availableProductions.length} completed Production job${availableProductions.length === 1 ? "" : "s"} currently awaiting QC.`}
                    >

                      <select
                        value={
                          form.productionId
                        }
                        disabled={
                          Boolean(
                            editing
                          )
                        }
                        onChange={(e) =>
                          selectProduction(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border bg-white px-4 py-3 disabled:bg-slate-100"
                      >

                        <option value="">
                          Select Completed Production
                        </option>

                        {availableProductions.map(
                          (
                            production
                          ) => (

                            <option
                              key={
                                production.id
                              }
                              value={
                                production.id
                              }
                            >
                              {production.workOrderNumber ||
                                production.productionNumber}
                              {" — "}
                              {production.orderNumber}
                              {" — "}
                              {production.customerName}
                              {" — "}
                              {production.itemDescription ||
                                production.designName}
                            </option>

                          )
                        )}

                      </select>

                    </Field>

                    {selectedProduction && (

                      <div className="mt-5 grid gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:grid-cols-2 lg:grid-cols-4">

                        <InfoBox
                          label="Work Order"
                          value={
                            selectedProduction.workOrderNumber ||
                            selectedWorkOrder?.workOrderNumber ||
                            "Legacy"
                          }
                        />

                        <InfoBox
                          label="Order"
                          value={
                            selectedProduction.orderNumber
                          }
                        />

                        <InfoBox
                          label="Customer"
                          value={
                            selectedProduction.customerName ||
                            selectedCustomer?.name ||
                            selectedCustomer?.businessName ||
                            ""
                          }
                        />

                        <InfoBox
                          label="Item"
                          value={
                            selectedProduction.itemDescription ||
                            selectedWorkOrder?.itemDescription ||
                            "—"
                          }
                        />

                        <InfoBox
                          label="Garment"
                          value={
                            [
                              selectedProduction.garmentColor ||
                                selectedWorkOrder?.garmentColor,
                              selectedProduction.garmentSize ||
                                selectedWorkOrder?.garmentSize,
                            ]
                              .filter(Boolean)
                              .join(" / ") ||
                            "—"
                          }
                        />

                        <InfoBox
                          label="Design"
                          value={
                            selectedProduction.designName ||
                            selectedWorkOrder?.designName ||
                            "—"
                          }
                        />

                        <InfoBox
                          label="Machine"
                          value={
                            selectedProduction.machineName ||
                            "—"
                          }
                        />

                        <InfoBox
                          label="Operator"
                          value={
                            selectedProduction.operatorName ||
                            "—"
                          }
                        />

                        <InfoBox
                          label="Planned Qty"
                          value={String(
                            selectedProduction.productionQuantity
                          )}
                        />

                        <InfoBox
                          label="Completed Qty"
                          value={String(
                            selectedProduction.completedQuantity ||
                            selectedProduction.productionQuantity
                          )}
                        />

                        <InfoBox
                          label="Production Reject"
                          value={String(
                            selectedProduction.rejectedQuantity
                          )}
                        />

                        <InfoBox
                          label="Production Rework"
                          value={String(
                            selectedProduction.reworkQuantity
                          )}
                        />

                      </div>

                    )}

                  </Section>

                  {/* INSPECTION DETAILS */}

                  <Section
                    title="Inspection Details"
                    description="Record who inspected the finished embroidery and when."
                  >

                    <div className="grid gap-5 md:grid-cols-2">

                      <Field
                        label="Inspection Date *"
                        caption="Date QC inspection was performed."
                      >

                        <input
                          type="date"
                          value={
                            form.inspectionDate
                          }
                          onChange={(e) =>
                            updateForm(
                              "inspectionDate",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Inspector Name *"
                        caption="Person responsible for the final QC decision."
                      >

                        <input
                          value={
                            form.inspectorName
                          }
                          onChange={(e) =>
                            updateForm(
                              "inspectorName",
                              e.target.value
                            )
                          }
                          placeholder="QC inspector"
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                    </div>

                  </Section>

                  {/* QUANTITIES */}

                  <Section
                    title="Inspection Quantity"
                    description="Passed + Rejected + Rework must exactly equal the inspected quantity."
                  >

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                      <NumberField
                        label="Inspected Qty"
                        caption={
                          selectedProduction
                            ? `Maximum: ${
                                selectedProduction.completedQuantity ||
                                selectedProduction.productionQuantity
                              } completed pieces.`
                            : "Actual quantity inspected."
                        }
                        value={
                          form.inspectedQuantity
                        }
                        onChange={(value) =>
                          updateForm(
                            "inspectedQuantity",
                            value
                          )
                        }
                      />

                      <NumberField
                        label="Passed Qty"
                        caption="Quantity accepted by QC."
                        value={
                          form.passedQuantity
                        }
                        onChange={(value) =>
                          updateForm(
                            "passedQuantity",
                            value
                          )
                        }
                      />

                      <NumberField
                        label="Rejected Qty"
                        caption="Quantity rejected / scrap."
                        value={
                          form.rejectedQuantity
                        }
                        onChange={(value) =>
                          updateForm(
                            "rejectedQuantity",
                            value
                          )
                        }
                      />

                      <NumberField
                        label="Rework Qty"
                        caption="Quantity returned for correction."
                        value={
                          form.reworkQuantity
                        }
                        onChange={(value) =>
                          updateForm(
                            "reworkQuantity",
                            value
                          )
                        }
                      />

                    </div>

                  </Section>

                  {/* QUALITY */}

                  <Section
                    title="Embroidery Quality Checks"
                    description="All eight checks must be completed before a final Pass, Fail or Rework Required decision is saved."
                  >

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

                      <QualityField
                        label="Stitch Quality"
                        value={
                          form.stitchQuality
                        }
                        onChange={(value) =>
                          updateForm(
                            "stitchQuality",
                            value
                          )
                        }
                      />

                      <QualityField
                        label="Thread Quality"
                        value={
                          form.threadQuality
                        }
                        onChange={(value) =>
                          updateForm(
                            "threadQuality",
                            value
                          )
                        }
                      />

                      <QualityField
                        label="Placement Accuracy"
                        value={
                          form.placementAccuracy
                        }
                        onChange={(value) =>
                          updateForm(
                            "placementAccuracy",
                            value
                          )
                        }
                      />

                      <QualityField
                        label="Size Accuracy"
                        value={
                          form.sizeAccuracy
                        }
                        onChange={(value) =>
                          updateForm(
                            "sizeAccuracy",
                            value
                          )
                        }
                      />

                      <QualityField
                        label="Color Accuracy"
                        value={
                          form.colorAccuracy
                        }
                        onChange={(value) =>
                          updateForm(
                            "colorAccuracy",
                            value
                          )
                        }
                      />

                      <QualityField
                        label="Finishing"
                        value={
                          form.finishingQuality
                        }
                        onChange={(value) =>
                          updateForm(
                            "finishingQuality",
                            value
                          )
                        }
                      />

                      <QualityField
                        label="Cleanliness"
                        value={
                          form.cleanliness
                        }
                        onChange={(value) =>
                          updateForm(
                            "cleanliness",
                            value
                          )
                        }
                      />

                      <QualityField
                        label="Packaging Readiness"
                        value={
                          form.packagingReadiness
                        }
                        onChange={(value) =>
                          updateForm(
                            "packagingReadiness",
                            value
                          )
                        }
                      />

                    </div>

                  </Section>

                  {/* RESULT */}

                  <Section
                    title="Final QC Decision"
                    description="Only an explicit QC Pass releases this Production job to Dispatch."
                  >

                    <div className="grid gap-5 md:grid-cols-2">

                      <Field
                        label="Final QC Status *"
                        caption="Pass, Fail or return the job to Production for rework."
                      >

                        <select
                          value={
                            form.qcStatus
                          }
                          onChange={(e) =>
                            updateForm(
                              "qcStatus",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3 font-bold"
                        >

                          {QC_STATUSES.map(
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
                        label="Defect Type"
                        caption="Required for Fail or Rework Required."
                      >

                        <select
                          value={
                            form.defectType
                          }
                          onChange={(e) =>
                            updateForm(
                              "defectType",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >

                          {DEFECT_TYPES.map(
                            (
                              defect
                            ) => (

                              <option
                                key={
                                  defect
                                }
                                value={
                                  defect
                                }
                              >
                                {defect}
                              </option>

                            )
                          )}

                        </select>

                      </Field>

                    </div>

                    <div className="mt-5 grid gap-5 md:grid-cols-2">

                      <Field
                        label="Defect Details"
                        caption="Describe defect location, quantity and observed issue."
                      >

                        <textarea
                          value={
                            form.defectDetails
                          }
                          onChange={(e) =>
                            updateForm(
                              "defectDetails",
                              e.target.value
                            )
                          }
                          className="min-h-24 w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Corrective Action"
                        caption="Required for Rework Required. Explain what Production must correct."
                      >

                        <textarea
                          value={
                            form.correctiveAction
                          }
                          onChange={(e) =>
                            updateForm(
                              "correctiveAction",
                              e.target.value
                            )
                          }
                          className="min-h-24 w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                    </div>

                  </Section>

                  {/* NOTES */}

                  <Section
                    title="QC Notes"
                    description="Additional inspection comments or traceability information."
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

                  </Section>

                  {/* DISPATCH */}

                  <div
                    className={`rounded-2xl border p-5 ${
                      form.qcStatus ===
                      "Pass"
                        ? "border-green-200 bg-green-50"
                        : form.qcStatus ===
                          "Rework Required"
                        ? "border-orange-200 bg-orange-50"
                        : "border-amber-200 bg-amber-50"
                    }`}
                  >

                    <div className="font-black">

                      {form.qcStatus ===
                      "Pass"
                        ? "✓ Ready for Dispatch"
                        : form.qcStatus ===
                          "Rework Required"
                        ? "↩ Return to Production"
                        : "Dispatch Not Released"}

                    </div>

                    <p className="mt-1 text-sm">

                      {form.qcStatus ===
                      "Pass"
                        ? "Saving this QC record will make the Order eligible for Dispatch."
                        : form.qcStatus ===
                          "Rework Required"
                        ? "Saving will return the Order and Work Order to Production for corrective action."
                        : "An explicit final QC Pass is required before Dispatch."}

                    </p>

                  </div>

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
                    void saveQC()
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl bg-emerald-700 px-6 py-3 font-black text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update QC"
                    : "Save QC"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* =================================================
          VIEW
      ================================================= */}

      {viewing && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">

          <div className="flex min-h-full items-start justify-center p-4">

            <div className="my-8 w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">

              <div className="flex items-start justify-between border-b px-6 py-5">

                <div>

                  <div className="text-xs font-bold uppercase text-emerald-600">
                    Quality Control
                  </div>

                  <h2 className="mt-1 text-2xl font-black">
                    {viewing.qcNumber}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {viewing.workOrderNumber ||
                      viewing.productionNumber}
                    {" · "}
                    {viewing.orderNumber}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setViewing(
                      null
                    )
                  }
                  className="text-3xl text-slate-400"
                >
                  ×
                </button>

              </div>

              <div className="space-y-6 p-6">

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                  <InfoBox
                    label="Work Order"
                    value={
                      viewing.workOrderNumber ||
                      "Legacy"
                    }
                  />

                  <InfoBox
                    label="Order"
                    value={
                      viewing.orderNumber
                    }
                  />

                  <InfoBox
                    label="Customer"
                    value={
                      viewing.customerName
                    }
                  />

                  <InfoBox
                    label="QC Status"
                    value={
                      viewing.qcStatus
                    }
                  />

                  <InfoBox
                    label="Item"
                    value={
                      viewing.itemDescription ||
                      viewing.designName
                    }
                  />

                  <InfoBox
                    label="Garment"
                    value={
                      [
                        viewing.garmentColor,
                        viewing.garmentSize,
                      ]
                        .filter(Boolean)
                        .join(" / ") ||
                      "—"
                    }
                  />

                  <InfoBox
                    label="Machine"
                    value={
                      viewing.machineName ||
                      "—"
                    }
                  />

                  <InfoBox
                    label="Operator"
                    value={
                      viewing.operatorName ||
                      "—"
                    }
                  />

                </div>

                <Section
                  title="Quantity Reconciliation"
                  description="Production result compared with actual QC result."
                >

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                    <InfoBox
                      label="Production Completed"
                      value={String(
                        viewing.productionCompletedQuantity ||
                        viewing.productionQuantity
                      )}
                    />

                    <InfoBox
                      label="Inspected"
                      value={String(
                        viewing.inspectedQuantity
                      )}
                    />

                    <InfoBox
                      label="Passed"
                      value={String(
                        viewing.passedQuantity
                      )}
                    />

                    <InfoBox
                      label="Rejected / Rework"
                      value={`${viewing.rejectedQuantity} / ${viewing.reworkQuantity}`}
                    />

                  </div>

                </Section>

                <Section
                  title="Quality Checks"
                  description="Saved inspection result for each critical embroidery attribute."
                >

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                    <InfoBox
                      label="Stitch"
                      value={
                        viewing.stitchQuality
                      }
                    />

                    <InfoBox
                      label="Thread"
                      value={
                        viewing.threadQuality
                      }
                    />

                    <InfoBox
                      label="Placement"
                      value={
                        viewing.placementAccuracy
                      }
                    />

                    <InfoBox
                      label="Size"
                      value={
                        viewing.sizeAccuracy
                      }
                    />

                    <InfoBox
                      label="Color"
                      value={
                        viewing.colorAccuracy
                      }
                    />

                    <InfoBox
                      label="Finishing"
                      value={
                        viewing.finishingQuality
                      }
                    />

                    <InfoBox
                      label="Cleanliness"
                      value={
                        viewing.cleanliness
                      }
                    />

                    <InfoBox
                      label="Packaging"
                      value={
                        viewing.packagingReadiness
                      }
                    />

                  </div>

                </Section>

                <div className="grid gap-4 md:grid-cols-2">

                  <TextPanel
                    label="Defect Details"
                    value={
                      viewing.defectDetails ||
                      "No defect details."
                    }
                  />

                  <TextPanel
                    label="Corrective Action"
                    value={
                      viewing.correctiveAction ||
                      "No corrective action."
                    }
                  />

                </div>

                <TextPanel
                  label="QC Notes"
                  value={
                    viewing.notes ||
                    "No additional QC notes."
                  }
                />

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
  children: ReactNode;
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
  label: string;
  caption: string;
  children: ReactNode;
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

function NumberField({
  label,
  caption,
  value,
  onChange,
}: {
  label: string;
  caption: string;
  value: number;
  onChange:
    (value: number) => void;
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
          onChange(
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
  );
}

function QualityField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange:
    (value: string) => void;
}) {
  return (
    <Field
      label={
        label
      }
      caption="Select the actual inspection result."
    >

      <select
        value={
          value
        }
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full rounded-xl border bg-white px-4 py-3"
      >

        {QUALITY_OPTIONS.map(
          (
            option
          ) => (

            <option
              key={
                option
              }
              value={
                option
              }
            >
              {option}
            </option>

          )
        )}

      </select>

    </Field>
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

function TextPanel({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-5">

      <div className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {value}
      </div>

    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone:
    | "blue"
    | "amber"
    | "green"
    | "red";
}) {
  const styles = {
    blue:
      "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-blue-900",

    amber:
      "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 text-amber-900",

    green:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 text-emerald-900",

    red:
      "border-red-200 bg-gradient-to-br from-red-50 via-white to-rose-50 text-red-900",
  };

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${styles[tone]}`}
    >

      <div className="text-xs font-bold uppercase text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-2xl font-black">
        {value}
      </div>

    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  let style =
    "bg-slate-100 text-slate-700";

  if (
    status ===
    "Pass"
  ) {
    style =
      "bg-green-100 text-green-700";
  }

  if (
    status ===
    "Fail"
  ) {
    style =
      "bg-red-100 text-red-700";
  }

  if (
    status ===
    "Rework Required"
  ) {
    style =
      "bg-orange-100 text-orange-700";
  }

  if (
    status ===
    "In Inspection"
  ) {
    style =
      "bg-blue-100 text-blue-700";
  }

  if (
    status ===
    "Pending"
  ) {
    style =
      "bg-yellow-100 text-yellow-700";
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}
    >
      {status ||
        "—"}
    </span>
  );
}

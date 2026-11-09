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

type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: string;
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
  productionQuantity: number;
  status: string;
  [key: string]: any;
};

type Production = {
  id: string;
  workOrderId: string;
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
  machineName: string;
  operatorName: string;
  productionQuantity: number;
  completedQuantity: number;
  status: string;
  [key: string]: any;
};

type QualityControl = {
  id: string;
  qcNumber: string;
  productionId: string;
  workOrderId: string;
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
  inspectedQuantity: number;
  passedQuantity: number;
  rejectedQuantity: number;
  reworkQuantity: number;
  defectType: string;
  defectDetails: string;
  correctiveAction: string;
  qcStatus: string;
  inspectionDate: string;
  inspectorName: string;
  [key: string]: any;
};

type Dispatch = {
  id: string;
  dispatchNumber: string;
  orderId: string;
  orderNumber: string;
  orderItemId: string;
  customerId: string;
  customerName: string;
  workOrderId: string;
  workOrderNumber: string;
  productionId: string;
  productionNumber: string;
  qualityControlId: string;
  qcNumber: string;
  itemDescription: string;
  garmentColor: string;
  garmentSize: string;
  designName: string;
  dispatchQuantity: number;
  dispatchDate: string;
  status: string;
  [key: string]: any;
};

type ReturnRework = {
  id: string;
  caseNumber: string;

  caseType: string;
  sourceStage: string;

  orderId: string;
  orderNumber: string;
  orderItemId: string;

  workOrderId: string;
  workOrderNumber: string;

  productionId: string;

  qualityControlId: string;
  qcNumber: string;

  dispatchId: string;
  dispatchNumber: string;

  customerId: string;
  customerName: string;

  itemDescription: string;
  garmentColor: string;
  garmentSize: string;
  designName: string;

  reportedDate: string;

  quantity: number;

  reasonCategory: string;
  defectType: string;
  issueDetails: string;

  responsibility: string;
  severity: string;

  actionRequired: string;

  reworkQuantity: number;
  replacementQuantity: number;
  scrapQuantity: number;
  refundQuantity: number;

  estimatedCost: number;
  actualCost: number;

  assignedTo: string;

  targetDate: string;
  completedDate: string;

  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;

  customerResolution: string;

  status: string;

  notes: string;

  createdAt: string;
  updatedAt: string;

  [key: string]: any;
};

type FormState = {
  caseType: string;
  sourceStage: string;
  sourceId: string;

  reportedDate: string;
  quantity: number;

  reasonCategory: string;
  defectType: string;
  issueDetails: string;

  responsibility: string;
  severity: string;

  actionRequired: string;

  reworkQuantity: number;
  replacementQuantity: number;
  scrapQuantity: number;
  refundQuantity: number;

  estimatedCost: number;
  actualCost: number;

  assignedTo: string;

  targetDate: string;
  completedDate: string;

  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;

  customerResolution: string;

  status: string;

  notes: string;
};

/* =========================================================
   OPTIONS
========================================================= */

const CASE_TYPES = [
  "Internal Rework",
  "QC Rework",
  "Customer Return",
  "Customer Complaint",
  "Replacement",
];

const SOURCE_STAGES = [
  "Quality Control",
  "Dispatch",
  "Order",
  "Production",
  "Manual",
];

const REASONS = [
  "Stitching Quality",
  "Wrong Thread Color",
  "Wrong Placement",
  "Wrong Size / Scale",
  "Skipped / Missing Stitches",
  "Loose Threads / Trimming",
  "Puckering",
  "Registration / Alignment",
  "Garment Damage",
  "Wrong Garment / Item",
  "Wrong Quantity",
  "Packaging Issue",
  "Transit Damage",
  "Customer Specification Change",
  "Customer Rejection",
  "Other",
];

const DEFECT_TYPES = [
  "None",
  "Thread Break",
  "Skipped Stitch",
  "Loose Thread",
  "Incorrect Thread Color",
  "Incorrect Placement",
  "Incorrect Size",
  "Fabric Damage",
  "Puckering",
  "Registration Issue",
  "Finishing Issue",
  "Stain / Dirt",
  "Packaging Issue",
  "Transit Damage",
  "Other",
];

const RESPONSIBILITY = [
  "Production",
  "Digitizing",
  "Artwork",
  "Quality Control",
  "Dispatch / Logistics",
  "Supplier",
  "Customer",
  "Shared",
  "Undetermined",
];

const SEVERITIES = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

const ACTIONS = [
  "Rework",
  "Replace",
  "Scrap",
  "Refund",
  "Credit Note",
  "No Action",
];

const STATUSES = [
  "Open",
  "Under Review",
  "Rework Planned",
  "In Rework",
  "Awaiting Customer",
  "Resolved",
  "Closed",
  "Cancelled",
];

/* =========================================================
   HELPERS
========================================================= */

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeText(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateOnly(value: unknown) {
  const text = clean(value);
  return text ? text.split("T")[0] : "";
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function addDays(date: string, days: number) {
  if (!date) return "";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  parsed.setDate(
    parsed.getDate() +
      Number(days || 0)
  );

  return parsed
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

  return `rr-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function money(value: number) {
  return `₹${Number(
    value || 0
  ).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  )}`;
}

function emptyForm(): FormState {
  return {
    caseType: "Internal Rework",
    sourceStage: "Quality Control",
    sourceId: "",

    reportedDate: "",
    quantity: 0,

    reasonCategory: "Stitching Quality",
    defectType: "None",
    issueDetails: "",

    responsibility: "Undetermined",
    severity: "Medium",

    actionRequired: "Rework",

    reworkQuantity: 0,
    replacementQuantity: 0,
    scrapQuantity: 0,
    refundQuantity: 0,

    estimatedCost: 0,
    actualCost: 0,

    assignedTo: "",

    targetDate: "",
    completedDate: "",

    rootCause: "",
    correctiveAction: "",
    preventiveAction: "",

    customerResolution: "",

    status: "Open",

    notes: "",
  };
}

/* =========================================================
   NORMALIZERS
========================================================= */

function normalizeOrder(row: any): Order {
  return {
    ...row,
    id: clean(row?.id),
    orderNumber: clean(row?.orderNumber),
    customerId: clean(row?.customerId),
    customerName: clean(row?.customerName ?? row?.customer),
    status: clean(row?.status),
  };
}

function normalizeWorkOrder(row: any): WorkOrder {
  return {
    ...row,
    id: clean(row?.id),
    workOrderNumber: clean(row?.workOrderNumber),
    orderId: clean(row?.orderId),
    orderNumber: clean(row?.orderNumber),
    orderItemId: clean(row?.orderItemId),
    customerId: clean(row?.customerId),
    customerName: clean(row?.customerName),
    itemDescription: clean(row?.itemDescription),
    garmentColor: clean(row?.garmentColor),
    garmentSize: clean(row?.garmentSize),
    designName: clean(row?.designName),
    productionQuantity: numberValue(row?.productionQuantity),
    status: clean(row?.status),
  };
}

function normalizeProduction(row: any): Production {
  return {
    ...row,
    id: clean(row?.id),
    workOrderId: clean(row?.workOrderId),
    workOrderNumber: clean(row?.workOrderNumber),
    orderId: clean(row?.orderId),
    orderNumber: clean(row?.orderNumber),
    orderItemId: clean(row?.orderItemId),
    customerId: clean(row?.customerId),
    customerName: clean(row?.customerName),
    itemDescription: clean(row?.itemDescription),
    garmentColor: clean(row?.garmentColor),
    garmentSize: clean(row?.garmentSize),
    designName: clean(row?.designName),
    machineName: clean(row?.machineName),
    operatorName: clean(row?.operatorName),
    productionQuantity: numberValue(row?.productionQuantity),
    completedQuantity: numberValue(row?.completedQuantity),
    status: clean(row?.status),
  };
}

function normalizeQC(row: any): QualityControl {
  return {
    ...row,
    id: clean(row?.id),
    qcNumber: clean(row?.qcNumber),
    productionId: clean(row?.productionId),
    workOrderId: clean(row?.workOrderId),
    workOrderNumber: clean(row?.workOrderNumber),
    orderId: clean(row?.orderId),
    orderNumber: clean(row?.orderNumber),
    orderItemId: clean(row?.orderItemId),
    customerId: clean(row?.customerId),
    customerName: clean(row?.customerName),
    itemDescription: clean(row?.itemDescription),
    garmentColor: clean(row?.garmentColor),
    garmentSize: clean(row?.garmentSize),
    designName: clean(row?.designName),
    inspectedQuantity: numberValue(row?.inspectedQuantity),
    passedQuantity: numberValue(row?.passedQuantity),
    rejectedQuantity: numberValue(row?.rejectedQuantity),
    reworkQuantity: numberValue(row?.reworkQuantity),
    defectType: clean(row?.defectType),
    defectDetails: clean(row?.defectDetails),
    correctiveAction: clean(row?.correctiveAction),
    qcStatus: clean(row?.qcStatus ?? row?.status),
    inspectionDate: dateOnly(row?.inspectionDate),
    inspectorName: clean(row?.inspectorName),
  };
}

function normalizeDispatch(row: any): Dispatch {
  return {
    ...row,
    id: clean(row?.id),
    dispatchNumber: clean(row?.dispatchNumber),
    orderId: clean(row?.orderId),
    orderNumber: clean(row?.orderNumber),
    orderItemId: clean(row?.orderItemId),
    customerId: clean(row?.customerId),
    customerName: clean(row?.customerName),
    workOrderId: clean(row?.workOrderId),
    workOrderNumber: clean(row?.workOrderNumber),
    productionId: clean(row?.productionId),
    productionNumber: clean(row?.productionNumber),
    qualityControlId: clean(row?.qualityControlId),
    qcNumber: clean(row?.qcNumber),
    itemDescription: clean(row?.itemDescription),
    garmentColor: clean(row?.garmentColor),
    garmentSize: clean(row?.garmentSize),
    designName: clean(row?.designName),
    dispatchQuantity: numberValue(row?.dispatchQuantity),
    dispatchDate: dateOnly(row?.dispatchDate),
    status: clean(row?.status),
  };
}

function normalizeCase(row: any): ReturnRework {
  return {
    ...row,
    id: clean(row?.id),
    caseNumber: clean(row?.caseNumber),
    caseType: clean(row?.caseType),
    sourceStage: clean(row?.sourceStage),
    orderId: clean(row?.orderId),
    orderNumber: clean(row?.orderNumber),
    orderItemId: clean(row?.orderItemId),
    workOrderId: clean(row?.workOrderId),
    workOrderNumber: clean(row?.workOrderNumber),
    productionId: clean(row?.productionId),
    qualityControlId: clean(row?.qualityControlId),
    qcNumber: clean(row?.qcNumber),
    dispatchId: clean(row?.dispatchId),
    dispatchNumber: clean(row?.dispatchNumber),
    customerId: clean(row?.customerId),
    customerName: clean(row?.customerName),
    itemDescription: clean(row?.itemDescription),
    garmentColor: clean(row?.garmentColor),
    garmentSize: clean(row?.garmentSize),
    designName: clean(row?.designName),
    reportedDate: dateOnly(row?.reportedDate),
    quantity: numberValue(row?.quantity),
    reasonCategory: clean(row?.reasonCategory),
    defectType: clean(row?.defectType),
    issueDetails: clean(row?.issueDetails),
    responsibility: clean(row?.responsibility),
    severity: clean(row?.severity),
    actionRequired: clean(row?.actionRequired),
    reworkQuantity: numberValue(row?.reworkQuantity),
    replacementQuantity: numberValue(row?.replacementQuantity),
    scrapQuantity: numberValue(row?.scrapQuantity),
    refundQuantity: numberValue(row?.refundQuantity),
    estimatedCost: numberValue(row?.estimatedCost),
    actualCost: numberValue(row?.actualCost),
    assignedTo: clean(row?.assignedTo),
    targetDate: dateOnly(row?.targetDate),
    completedDate: dateOnly(row?.completedDate),
    rootCause: clean(row?.rootCause),
    correctiveAction: clean(row?.correctiveAction),
    preventiveAction: clean(row?.preventiveAction),
    customerResolution: clean(row?.customerResolution),
    status: clean(row?.status) || "Open",
    notes: clean(row?.notes),
    createdAt: clean(row?.createdAt),
    updatedAt: clean(row?.updatedAt),
  };
}

/* =========================================================
   PAGE
========================================================= */

export default function ReturnsReworkPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [productions, setProductions] = useState<Production[]>([]);
  const [qcRows, setQcRows] = useState<QualityControl[]>([]);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [cases, setCases] = useState<ReturnRework[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ReturnRework | null>(null);
  const [viewing, setViewing] = useState<ReturnRework | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm());

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!showForm && !viewing) return;

    const old =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        old;
    };
  }, [
    showForm,
    viewing,
  ]);

  async function loadSheet(sheet: string) {
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

  async function saveExcel(body: any) {
    const response =
      await fetch(
        "/api/excel",
        {
          method: "POST",

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
        "Returns/Rework Excel request failed:",
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

  async function loadData(
    silent = false
  ) {
    try {
      silent
        ? setRefreshing(true)
        : setLoading(true);

      const [
        orderRows,
        workOrderRows,
        productionRows,
        qualityRows,
        dispatchRows,
        caseRows,
      ] =
        await Promise.all([
          loadSheet("Orders"),
          loadSheet("WorkOrders"),
          loadSheet("Production"),
          loadSheet("QualityControl"),
          loadSheet("Dispatch"),
          loadSheet("ReturnsRework"),
        ]);

      setOrders(
        orderRows
          .map(normalizeOrder)
          .filter(
            (row: Order) =>
              Boolean(row.id)
          )
      );

      setWorkOrders(
        workOrderRows
          .map(normalizeWorkOrder)
          .filter(
            (row: WorkOrder) =>
              Boolean(row.id)
          )
      );

      setProductions(
        productionRows
          .map(normalizeProduction)
          .filter(
            (row: Production) =>
              Boolean(row.id)
          )
      );

      setQcRows(
        qualityRows
          .map(normalizeQC)
          .filter(
            (row: QualityControl) =>
              Boolean(row.id)
          )
      );

      setDispatches(
        dispatchRows
          .map(normalizeDispatch)
          .filter(
            (row: Dispatch) =>
              Boolean(row.id)
          )
      );

      setCases(
        caseRows
          .map(normalizeCase)
          .filter(
            (row: ReturnRework) =>
              Boolean(row.id)
          )
          .sort(
            (
              a: ReturnRework,
              b: ReturnRework
            ) =>
              String(
                b.createdAt ||
                  b.reportedDate
              ).localeCompare(
                String(
                  a.createdAt ||
                    a.reportedDate
                )
              )
          )
      );
    } catch (error) {
      console.error(
        "Returns/Rework load error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load Returns / Rework."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /* =======================================================
     SOURCE OPTIONS
  ======================================================= */

  const sourceOptions =
    useMemo(() => {
      if (
        form.sourceStage ===
        "Quality Control"
      ) {
        return qcRows.map(
          (qc) => ({
            id: qc.id,
            label:
              `${qc.qcNumber} — ${qc.orderNumber} — ${qc.customerName} — ${
                qc.itemDescription ||
                qc.designName
              }`,
          })
        );
      }

      if (
        form.sourceStage ===
        "Dispatch"
      ) {
        return dispatches.map(
          (dispatch) => ({
            id: dispatch.id,
            label:
              `${dispatch.dispatchNumber} — ${dispatch.orderNumber} — ${dispatch.customerName} — ${
                dispatch.itemDescription ||
                dispatch.designName
              }`,
          })
        );
      }

      if (
        form.sourceStage ===
        "Production"
      ) {
        return productions.map(
          (production) => ({
            id: production.id,
            label:
              `${production.workOrderNumber || production.id} — ${production.orderNumber} — ${production.customerName} — ${
                production.itemDescription ||
                production.designName
              }`,
          })
        );
      }

      if (
        form.sourceStage ===
        "Order"
      ) {
        return orders.map(
          (order) => ({
            id: order.id,
            label:
              `${order.orderNumber} — ${order.customerName}`,
          })
        );
      }

      return [];
    }, [
      form.sourceStage,
      qcRows,
      dispatches,
      productions,
      orders,
    ]);

  const sourceContext =
    useMemo(() => {
      if (!form.sourceId) {
        return null;
      }

      if (
        form.sourceStage ===
        "Quality Control"
      ) {
        const qc =
          qcRows.find(
            (row) =>
              row.id ===
              form.sourceId
          );

        if (!qc) return null;

        return {
          orderId: qc.orderId,
          orderNumber: qc.orderNumber,
          orderItemId: qc.orderItemId,
          workOrderId: qc.workOrderId,
          workOrderNumber: qc.workOrderNumber,
          productionId: qc.productionId,
          qualityControlId: qc.id,
          qcNumber: qc.qcNumber,
          dispatchId: "",
          dispatchNumber: "",
          customerId: qc.customerId,
          customerName: qc.customerName,
          itemDescription: qc.itemDescription,
          garmentColor: qc.garmentColor,
          garmentSize: qc.garmentSize,
          designName: qc.designName,
          maxQuantity:
            Math.max(
              qc.reworkQuantity,
              qc.rejectedQuantity,
              qc.inspectedQuantity,
              0
            ),
          suggestedReason:
            qc.defectType ||
            "Stitching Quality",
          issueDetails:
            qc.defectDetails,
          correctiveAction:
            qc.correctiveAction,
        };
      }

      if (
        form.sourceStage ===
        "Dispatch"
      ) {
        const dispatch =
          dispatches.find(
            (row) =>
              row.id ===
              form.sourceId
          );

        if (!dispatch) return null;

        return {
          orderId: dispatch.orderId,
          orderNumber: dispatch.orderNumber,
          orderItemId: dispatch.orderItemId,
          workOrderId: dispatch.workOrderId,
          workOrderNumber: dispatch.workOrderNumber,
          productionId: dispatch.productionId,
          qualityControlId:
            dispatch.qualityControlId,
          qcNumber: dispatch.qcNumber,
          dispatchId: dispatch.id,
          dispatchNumber:
            dispatch.dispatchNumber,
          customerId:
            dispatch.customerId,
          customerName:
            dispatch.customerName,
          itemDescription:
            dispatch.itemDescription,
          garmentColor:
            dispatch.garmentColor,
          garmentSize:
            dispatch.garmentSize,
          designName:
            dispatch.designName,
          maxQuantity:
            dispatch.dispatchQuantity,
          suggestedReason:
            "Customer Return",
          issueDetails: "",
          correctiveAction: "",
        };
      }

      if (
        form.sourceStage ===
        "Production"
      ) {
        const production =
          productions.find(
            (row) =>
              row.id ===
              form.sourceId
          );

        if (!production) return null;

        return {
          orderId:
            production.orderId,
          orderNumber:
            production.orderNumber,
          orderItemId:
            production.orderItemId,
          workOrderId:
            production.workOrderId,
          workOrderNumber:
            production.workOrderNumber,
          productionId:
            production.id,
          qualityControlId: "",
          qcNumber: "",
          dispatchId: "",
          dispatchNumber: "",
          customerId:
            production.customerId,
          customerName:
            production.customerName,
          itemDescription:
            production.itemDescription,
          garmentColor:
            production.garmentColor,
          garmentSize:
            production.garmentSize,
          designName:
            production.designName,
          maxQuantity:
            production.completedQuantity ||
            production.productionQuantity,
          suggestedReason:
            "Stitching Quality",
          issueDetails: "",
          correctiveAction: "",
        };
      }

      if (
        form.sourceStage ===
        "Order"
      ) {
        const order =
          orders.find(
            (row) =>
              row.id ===
              form.sourceId
          );

        if (!order) return null;

        return {
          orderId: order.id,
          orderNumber:
            order.orderNumber,
          orderItemId: "",
          workOrderId: "",
          workOrderNumber: "",
          productionId: "",
          qualityControlId: "",
          qcNumber: "",
          dispatchId: "",
          dispatchNumber: "",
          customerId:
            order.customerId,
          customerName:
            order.customerName,
          itemDescription: "",
          garmentColor: "",
          garmentSize: "",
          designName: "",
          maxQuantity: 0,
          suggestedReason:
            "Customer Return",
          issueDetails: "",
          correctiveAction: "",
        };
      }

      return null;
    }, [
      form.sourceStage,
      form.sourceId,
      qcRows,
      dispatches,
      productions,
      orders,
    ]);

  /* =======================================================
     FORM
  ======================================================= */

  function openCreate() {
    const today =
      getToday();

    setEditing(null);

    setForm({
      ...emptyForm(),

      reportedDate:
        today,

      targetDate:
        addDays(
          today,
          3
        ),
    });

    setShowForm(true);
  }

  function openEdit(
    row: ReturnRework
  ) {
    setEditing(row);

    let sourceId = "";

    if (
      row.sourceStage ===
      "Quality Control"
    ) {
      sourceId =
        row.qualityControlId;
    } else if (
      row.sourceStage ===
      "Dispatch"
    ) {
      sourceId =
        row.dispatchId;
    } else if (
      row.sourceStage ===
      "Production"
    ) {
      sourceId =
        row.productionId;
    } else if (
      row.sourceStage ===
      "Order"
    ) {
      sourceId =
        row.orderId;
    }

    setForm({
      caseType:
        row.caseType,

      sourceStage:
        row.sourceStage,

      sourceId,

      reportedDate:
        row.reportedDate,

      quantity:
        row.quantity,

      reasonCategory:
        row.reasonCategory,

      defectType:
        row.defectType,

      issueDetails:
        row.issueDetails,

      responsibility:
        row.responsibility,

      severity:
        row.severity,

      actionRequired:
        row.actionRequired,

      reworkQuantity:
        row.reworkQuantity,

      replacementQuantity:
        row.replacementQuantity,

      scrapQuantity:
        row.scrapQuantity,

      refundQuantity:
        row.refundQuantity,

      estimatedCost:
        row.estimatedCost,

      actualCost:
        row.actualCost,

      assignedTo:
        row.assignedTo,

      targetDate:
        row.targetDate,

      completedDate:
        row.completedDate,

      rootCause:
        row.rootCause,

      correctiveAction:
        row.correctiveAction,

      preventiveAction:
        row.preventiveAction,

      customerResolution:
        row.customerResolution,

      status:
        row.status,

      notes:
        row.notes,
    });

    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm());
  }

  function handleSourceStage(
    value: string
  ) {
    setForm(
      (current) => ({
        ...current,
        sourceStage:
          value,
        sourceId:
          "",
        quantity:
          0,
      })
    );
  }

  function handleSource(
    sourceId: string
  ) {
    let maxQuantity = 0;
    let issueDetails = "";
    let correctiveAction = "";
    let reasonCategory =
      form.reasonCategory;

    if (
      form.sourceStage ===
      "Quality Control"
    ) {
      const qc =
        qcRows.find(
          (row) =>
            row.id ===
            sourceId
        );

      if (qc) {
        maxQuantity =
          qc.reworkQuantity ||
          qc.rejectedQuantity ||
          qc.inspectedQuantity;

        issueDetails =
          qc.defectDetails;

        correctiveAction =
          qc.correctiveAction;

        if (qc.defectType) {
          reasonCategory =
            qc.defectType;
        }
      }
    }

    if (
      form.sourceStage ===
      "Dispatch"
    ) {
      const dispatch =
        dispatches.find(
          (row) =>
            row.id ===
            sourceId
        );

      if (dispatch) {
        maxQuantity =
          dispatch.dispatchQuantity;
      }
    }

    if (
      form.sourceStage ===
      "Production"
    ) {
      const production =
        productions.find(
          (row) =>
            row.id ===
            sourceId
        );

      if (production) {
        maxQuantity =
          production.completedQuantity ||
          production.productionQuantity;
      }
    }

    setForm(
      (current) => ({
        ...current,

        sourceId,

        quantity:
          maxQuantity,

        reworkQuantity:
          current.actionRequired ===
          "Rework"
            ? maxQuantity
            : current.reworkQuantity,

        issueDetails:
          issueDetails ||
          current.issueDetails,

        correctiveAction:
          correctiveAction ||
          current.correctiveAction,

        reasonCategory,
      })
    );
  }

  function nextCaseNumber(
    year: number
  ) {
    const prefix =
      `RR-${year}-`;

    let highest = 0;

    cases.forEach(
      (row) => {
        if (
          !row.caseNumber.startsWith(
            prefix
          )
        ) {
          return;
        }

        const match =
          row.caseNumber.match(
            /(\d+)$/
          );

        if (match) {
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
      highest + 1
    ).padStart(
      4,
      "0"
    )}`;
  }

  function validate() {
    if (
      form.sourceStage !==
        "Manual" &&
      !form.sourceId
    ) {
      return "Select the source record for this return / rework case.";
    }

    if (
      !form.reportedDate
    ) {
      return "Reported Date is required.";
    }

    if (
      Number(
        form.quantity
      ) <= 0
    ) {
      return "Affected Quantity must be greater than zero.";
    }

    if (
      sourceContext?.maxQuantity &&
      form.quantity >
        sourceContext.maxQuantity
    ) {
      return `Affected Quantity cannot exceed source quantity of ${sourceContext.maxQuantity}.`;
    }

    const dispositionTotal =
      Number(
        form.reworkQuantity || 0
      ) +
      Number(
        form.replacementQuantity || 0
      ) +
      Number(
        form.scrapQuantity || 0
      ) +
      Number(
        form.refundQuantity || 0
      );

    if (
      dispositionTotal >
      form.quantity
    ) {
      return "Rework + Replacement + Scrap + Refund quantities cannot exceed the affected quantity.";
    }

    if (
      !form.issueDetails.trim()
    ) {
      return "Issue Details are required.";
    }

    if (
      form.status ===
        "Resolved" ||
      form.status ===
        "Closed"
    ) {
      if (
        !form.rootCause.trim()
      ) {
        return "Root Cause is required before resolving the case.";
      }

      if (
        !form.correctiveAction.trim()
      ) {
        return "Corrective Action is required before resolving the case.";
      }

      if (
        !form.completedDate
      ) {
        return "Completed Date is required before resolving the case.";
      }
    }

    return "";
  }

  async function saveCase() {
    const validation =
      validate();

    if (validation) {
      alert(validation);
      return;
    }

    try {
      setSaving(true);

      const now =
        new Date().toISOString();

      const year =
        Number(
          form.reportedDate.slice(
            0,
            4
          )
        );

      const context =
        sourceContext || {
          orderId: "",
          orderNumber: "",
          orderItemId: "",
          workOrderId: "",
          workOrderNumber: "",
          productionId: "",
          qualityControlId: "",
          qcNumber: "",
          dispatchId: "",
          dispatchNumber: "",
          customerId: "",
          customerName: "",
          itemDescription: "",
          garmentColor: "",
          garmentSize: "",
          designName: "",
        };

      const caseNumber =
        editing?.caseNumber ||
        nextCaseNumber(
          year
        );

      const record = {
        caseNumber,

        caseType:
          form.caseType,

        sourceStage:
          form.sourceStage,

        orderId:
          context.orderId,

        orderNumber:
          context.orderNumber,

        orderItemId:
          context.orderItemId,

        workOrderId:
          context.workOrderId,

        workOrderNumber:
          context.workOrderNumber,

        productionId:
          context.productionId,

        qualityControlId:
          context.qualityControlId,

        qcNumber:
          context.qcNumber,

        dispatchId:
          context.dispatchId,

        dispatchNumber:
          context.dispatchNumber,

        customerId:
          context.customerId,

        customerName:
          context.customerName,

        itemDescription:
          context.itemDescription,

        garmentColor:
          context.garmentColor,

        garmentSize:
          context.garmentSize,

        designName:
          context.designName,

        reportedDate:
          form.reportedDate,

        quantity:
          Number(
            form.quantity
          ),

        reasonCategory:
          form.reasonCategory,

        defectType:
          form.defectType,

        issueDetails:
          form.issueDetails.trim(),

        responsibility:
          form.responsibility,

        severity:
          form.severity,

        actionRequired:
          form.actionRequired,

        reworkQuantity:
          Number(
            form.reworkQuantity
          ),

        replacementQuantity:
          Number(
            form.replacementQuantity
          ),

        scrapQuantity:
          Number(
            form.scrapQuantity
          ),

        refundQuantity:
          Number(
            form.refundQuantity
          ),

        estimatedCost:
          Number(
            form.estimatedCost
          ),

        actualCost:
          Number(
            form.actualCost
          ),

        assignedTo:
          form.assignedTo.trim(),

        targetDate:
          form.targetDate,

        completedDate:
          form.completedDate,

        rootCause:
          form.rootCause.trim(),

        correctiveAction:
          form.correctiveAction.trim(),

        preventiveAction:
          form.preventiveAction.trim(),

        customerResolution:
          form.customerResolution.trim(),

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
          "ReturnsRework",

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

      /*
       * Operational rework:
       * reopen Work Order and Order so the case is visible
       * in the production workflow.
       */
      if (
        Number(
          form.reworkQuantity
        ) > 0 &&
        ![
          "Resolved",
          "Closed",
          "Cancelled",
        ].includes(
          form.status
        )
      ) {
        if (
          context.workOrderId
        ) {
          const workOrder =
            workOrders.find(
              (row) =>
                row.id ===
                context.workOrderId
            );

          if (workOrder) {
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
        }

        if (
          context.orderId
        ) {
          const order =
            orders.find(
              (row) =>
                row.id ===
                context.orderId
            );

          if (order) {
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
                  "Production",

                updatedAt:
                  now,
              },
            });
          }
        }
      }

      closeForm();

      await loadData(true);

      alert(
        `${caseNumber} saved successfully.`
      );
    } catch (error) {
      console.error(
        "Returns/Rework save error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to save Returns / Rework case."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCase(
    row: ReturnRework
  ) {
    if (
      !confirm(
        `Delete ${row.caseNumber}?`
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      await saveExcel({
        action:
          "delete",

        sheet:
          "ReturnsRework",

        id:
          row.id,
      });

      await loadData(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete case."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     FILTERS / KPI
  ======================================================= */

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return cases.filter(
        (row) => {
          const statusMatch =
            statusFilter ===
              "All" ||
            row.status ===
              statusFilter;

          const typeMatch =
            typeFilter ===
              "All" ||
            row.caseType ===
              typeFilter;

          const text =
            [
              row.caseNumber,
              row.caseType,
              row.sourceStage,
              row.orderNumber,
              row.workOrderNumber,
              row.qcNumber,
              row.dispatchNumber,
              row.customerName,
              row.itemDescription,
              row.designName,
              row.reasonCategory,
              row.defectType,
              row.responsibility,
              row.assignedTo,
              row.status,
            ]
              .join(" ")
              .toLowerCase();

          return (
            statusMatch &&
            typeMatch &&
            (
              !query ||
              text.includes(query)
            )
          );
        }
      );
    }, [
      cases,
      search,
      statusFilter,
      typeFilter,
    ]);

  const openCount =
    cases.filter(
      (row) =>
        ![
          "Resolved",
          "Closed",
          "Cancelled",
        ].includes(
          row.status
        )
    ).length;

  const reworkQty =
    cases
      .filter(
        (row) =>
          ![
            "Resolved",
            "Closed",
            "Cancelled",
          ].includes(
            row.status
          )
      )
      .reduce(
        (
          total,
          row
        ) =>
          total +
          row.reworkQuantity,
        0
      );

  const customerCases =
    cases.filter(
      (row) =>
        [
          "Customer Return",
          "Customer Complaint",
          "Replacement",
        ].includes(
          row.caseType
        )
    ).length;

  const actualCost =
    cases.reduce(
      (
        total,
        row
      ) =>
        total +
        Number(
          row.actualCost || 0
        ),
      0
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">

      <div className="mx-auto w-full max-w-7xl space-y-6 pb-24">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>

            <div className="mb-2 inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-rose-700">
              Quality Recovery
            </div>

            <h1 className="text-3xl font-black">
              Returns & Rework
            </h1>

            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
              Track internal rework, QC defects, customer returns, complaints, replacements, root cause and recovery cost.
            </p>

          </div>

          <div className="flex gap-2">

            <button
              type="button"
              onClick={() =>
                void loadData(true)
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
              className="rounded-xl bg-rose-700 px-5 py-3 font-black text-white hover:bg-rose-800"
            >
              + New Case
            </button>

          </div>

        </div>

        {/* KPI */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <Stat
            label="Open Cases"
            value={String(
              openCount
            )}
            tone="rose"
          />

          <Stat
            label="Open Rework Qty"
            value={String(
              reworkQty
            )}
            tone="amber"
          />

          <Stat
            label="Customer Cases"
            value={String(
              customerCases
            )}
            tone="violet"
          />

          <Stat
            label="Actual Recovery Cost"
            value={money(
              actualCost
            )}
            tone="blue"
          />

        </div>

        {/* WORKFLOW */}

        <div className="rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 to-orange-50 p-4">

          <div className="font-black text-slate-900">
            QC / Dispatch / Customer Issue
            {" → "}
            Root Cause
            {" → "}
            Rework / Replace / Refund
            {" → "}
            Corrective Action
            {" → "}
            Close
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-600">
            Rework cases can reopen the linked Work Order and Order back into Production, preserving traceability instead of creating an unrelated manual job.
          </p>

        </div>

        {/* FILTERS */}

        <div className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm lg:grid-cols-[1fr_220px_220px]">

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search case, order, job card, customer, defect, responsibility..."
            className="rounded-xl border px-4 py-3"
          />

          <select
            value={
              typeFilter
            }
            onChange={(e) =>
              setTypeFilter(
                e.target.value
              )
            }
            className="rounded-xl border bg-white px-4 py-3"
          >
            <option value="All">
              All Case Types
            </option>

            {CASE_TYPES.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>

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
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>

        </div>

        {/* TABLE */}

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          {loading ? (

            <div className="p-10 text-center text-slate-500">
              Loading Returns & Rework...
            </div>

          ) : filtered.length ===
            0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl">
                ↩️
              </div>

              <h2 className="mt-4 text-xl font-black">
                No Returns / Rework cases
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Create a case when QC, Dispatch or a customer reports an issue.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1450px] text-left text-sm">

                <thead>

                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                    <th className="px-4 py-4">Case</th>
                    <th className="px-4 py-4">Order / Job</th>
                    <th className="px-4 py-4">Customer / Item</th>
                    <th className="px-4 py-4">Reason</th>
                    <th className="px-4 py-4">Qty</th>
                    <th className="px-4 py-4">Disposition</th>
                    <th className="px-4 py-4">Responsibility</th>
                    <th className="px-4 py-4">Cost</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Actions</th>

                  </tr>

                </thead>

                <tbody>

                  {filtered.map(
                    (row) => (

                      <tr
                        key={row.id}
                        className="border-b last:border-0 hover:bg-slate-50"
                      >

                        <td className="px-4 py-4">

                          <div className="font-black text-rose-700">
                            {row.caseNumber}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {row.caseType}
                          </div>

                        </td>

                        <td className="px-4 py-4">

                          <div className="font-semibold">
                            {row.orderNumber ||
                              "—"}
                          </div>

                          <div className="mt-1 text-xs text-violet-600">
                            {row.workOrderNumber ||
                              row.qcNumber ||
                              row.dispatchNumber ||
                              row.sourceStage}
                          </div>

                        </td>

                        <td className="max-w-[260px] px-4 py-4">

                          <div className="font-semibold">
                            {row.customerName ||
                              "—"}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {row.itemDescription ||
                              row.designName ||
                              "—"}
                          </div>

                        </td>

                        <td className="max-w-[230px] px-4 py-4">

                          <div className="font-semibold">
                            {row.reasonCategory ||
                              "—"}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {row.defectType ||
                              "—"}
                          </div>

                        </td>

                        <td className="px-4 py-4 text-lg font-black">
                          {row.quantity}
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-semibold">
                            {row.actionRequired}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            RW {row.reworkQuantity}
                            {" · "}
                            RP {row.replacementQuantity}
                            {" · "}
                            SC {row.scrapQuantity}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {row.responsibility ||
                            "—"}
                        </td>

                        <td className="px-4 py-4 font-bold">
                          {money(
                            row.actualCost ||
                            row.estimatedCost
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={row.status}
                          />
                        </td>

                        <td className="px-4 py-4">

                          <div className="flex gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setViewing(row)
                              }
                              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEdit(row)
                              }
                              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void deleteCase(row)
                              }
                              disabled={saving}
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

      {/* ===================================================
          CREATE / EDIT
      =================================================== */}

      {showForm && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">

          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">

            <div className="my-5 flex max-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

              <div className="flex shrink-0 items-start justify-between border-b px-6 py-5">

                <div>

                  <div className="text-xs font-black uppercase tracking-wide text-rose-600">
                    Quality Recovery Case
                  </div>

                  <h2 className="mt-1 text-2xl font-black">
                    {editing
                      ? `Edit ${editing.caseNumber}`
                      : "New Return / Rework Case"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Link the case to the exact QC, Dispatch, Production or Order record whenever possible.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  className="text-3xl text-slate-400"
                >
                  ×
                </button>

              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-6">

                <div className="space-y-6">

                  <Section
                    title="Case Source"
                    description="Choose where the issue originated so EMBRASTIC can preserve the full order / job-card history."
                  >

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

                      <Field label="Case Type *">
                        <select
                          value={form.caseType}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              caseType:
                                e.target.value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >
                          {CASE_TYPES.map(
                            (item) => (
                              <option
                                key={item}
                                value={item}
                              >
                                {item}
                              </option>
                            )
                          )}
                        </select>
                      </Field>

                      <Field label="Source Stage *">
                        <select
                          value={form.sourceStage}
                          onChange={(e) =>
                            handleSourceStage(
                              e.target.value
                            )
                          }
                          disabled={Boolean(editing)}
                          className="w-full rounded-xl border bg-white px-4 py-3 disabled:bg-slate-100"
                        >
                          {SOURCE_STAGES.map(
                            (item) => (
                              <option
                                key={item}
                                value={item}
                              >
                                {item}
                              </option>
                            )
                          )}
                        </select>
                      </Field>

                      <div className="md:col-span-2">
                        <Field label={form.sourceStage === "Manual" ? "Source Record" : `${form.sourceStage} Record *`}>
                          {form.sourceStage === "Manual" ? (
                            <div className="rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-500">
                              Manual case — no linked operational source.
                            </div>
                          ) : (
                            <select
                              value={form.sourceId}
                              onChange={(e) =>
                                handleSource(
                                  e.target.value
                                )
                              }
                              disabled={Boolean(editing)}
                              className="w-full rounded-xl border bg-white px-4 py-3 disabled:bg-slate-100"
                            >
                              <option value="">
                                Select Source Record
                              </option>

                              {sourceOptions.map(
                                (item) => (
                                  <option
                                    key={item.id}
                                    value={item.id}
                                  >
                                    {item.label}
                                  </option>
                                )
                              )}
                            </select>
                          )}
                        </Field>
                      </div>

                    </div>

                    {sourceContext && (

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                        <Info label="Order" value={sourceContext.orderNumber || "—"} />
                        <Info label="Work Order" value={sourceContext.workOrderNumber || "—"} />
                        <Info label="Customer" value={sourceContext.customerName || "—"} />
                        <Info label="Item" value={sourceContext.itemDescription || sourceContext.designName || "—"} />
                        <Info label="Garment" value={[sourceContext.garmentColor, sourceContext.garmentSize].filter(Boolean).join(" / ") || "—"} />
                        <Info label="QC" value={sourceContext.qcNumber || "—"} />
                        <Info label="Dispatch" value={sourceContext.dispatchNumber || "—"} />
                        <Info label="Source Qty" value={sourceContext.maxQuantity ? String(sourceContext.maxQuantity) : "—"} />

                      </div>

                    )}

                  </Section>

                  <Section
                    title="Issue & Quantity"
                    description="Capture the quantity affected and the nature of the defect / complaint."
                  >

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

                      <DateField
                        label="Reported Date *"
                        value={form.reportedDate}
                        set={(value) =>
                          setForm({
                            ...form,
                            reportedDate:
                              value,
                          })
                        }
                      />

                      <NumberField
                        label="Affected Quantity *"
                        value={form.quantity}
                        set={(value) =>
                          setForm({
                            ...form,
                            quantity:
                              value,
                          })
                        }
                      />

                      <Field label="Reason Category">
                        <select
                          value={form.reasonCategory}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              reasonCategory:
                                e.target.value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >
                          {REASONS.map(
                            (item) => (
                              <option
                                key={item}
                                value={item}
                              >
                                {item}
                              </option>
                            )
                          )}
                        </select>
                      </Field>

                      <Field label="Defect Type">
                        <select
                          value={form.defectType}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              defectType:
                                e.target.value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >
                          {DEFECT_TYPES.map(
                            (item) => (
                              <option
                                key={item}
                                value={item}
                              >
                                {item}
                              </option>
                            )
                          )}
                        </select>
                      </Field>

                    </div>

                    <div className="mt-5">

                      <Field label="Issue Details *">

                        <textarea
                          value={form.issueDetails}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              issueDetails:
                                e.target.value,
                            })
                          }
                          placeholder="Describe what went wrong, where it was found, quantities affected, customer comments, photos/reference if any..."
                          className="min-h-28 w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                    </div>

                  </Section>

                  <Section
                    title="Responsibility & Severity"
                    description="Used later for root-cause trends, supplier quality and operator/process reporting."
                  >

                    <div className="grid gap-5 md:grid-cols-3">

                      <Field label="Responsibility">
                        <select
                          value={form.responsibility}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              responsibility:
                                e.target.value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >
                          {RESPONSIBILITY.map(
                            (item) => (
                              <option
                                key={item}
                                value={item}
                              >
                                {item}
                              </option>
                            )
                          )}
                        </select>
                      </Field>

                      <Field label="Severity">
                        <select
                          value={form.severity}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              severity:
                                e.target.value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >
                          {SEVERITIES.map(
                            (item) => (
                              <option
                                key={item}
                                value={item}
                              >
                                {item}
                              </option>
                            )
                          )}
                        </select>
                      </Field>

                      <Input
                        label="Assigned To"
                        value={form.assignedTo}
                        set={(value) =>
                          setForm({
                            ...form,
                            assignedTo:
                              value,
                          })
                        }
                      />

                    </div>

                  </Section>

                  <Section
                    title="Disposition"
                    description="How the affected quantity will be recovered."
                  >

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">

                      <Field label="Primary Action">
                        <select
                          value={form.actionRequired}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              actionRequired:
                                e.target.value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >
                          {ACTIONS.map(
                            (item) => (
                              <option
                                key={item}
                                value={item}
                              >
                                {item}
                              </option>
                            )
                          )}
                        </select>
                      </Field>

                      <NumberField
                        label="Rework Qty"
                        value={form.reworkQuantity}
                        set={(value) =>
                          setForm({
                            ...form,
                            reworkQuantity:
                              value,
                          })
                        }
                      />

                      <NumberField
                        label="Replacement Qty"
                        value={form.replacementQuantity}
                        set={(value) =>
                          setForm({
                            ...form,
                            replacementQuantity:
                              value,
                          })
                        }
                      />

                      <NumberField
                        label="Scrap Qty"
                        value={form.scrapQuantity}
                        set={(value) =>
                          setForm({
                            ...form,
                            scrapQuantity:
                              value,
                          })
                        }
                      />

                      <NumberField
                        label="Refund Qty"
                        value={form.refundQuantity}
                        set={(value) =>
                          setForm({
                            ...form,
                            refundQuantity:
                              value,
                          })
                        }
                      />

                    </div>

                  </Section>

                  <Section
                    title="Cost & Dates"
                    description="Capture the commercial impact of defects and returns."
                  >

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

                      <NumberField
                        label="Estimated Cost ₹"
                        value={form.estimatedCost}
                        set={(value) =>
                          setForm({
                            ...form,
                            estimatedCost:
                              value,
                          })
                        }
                      />

                      <NumberField
                        label="Actual Cost ₹"
                        value={form.actualCost}
                        set={(value) =>
                          setForm({
                            ...form,
                            actualCost:
                              value,
                          })
                        }
                      />

                      <DateField
                        label="Target Resolution"
                        value={form.targetDate}
                        set={(value) =>
                          setForm({
                            ...form,
                            targetDate:
                              value,
                          })
                        }
                      />

                      <DateField
                        label="Completed Date"
                        value={form.completedDate}
                        set={(value) =>
                          setForm({
                            ...form,
                            completedDate:
                              value,
                          })
                        }
                      />

                    </div>

                  </Section>

                  <Section
                    title="Root Cause & Corrective Action"
                    description="Required before a case is resolved or closed."
                  >

                    <div className="grid gap-5 md:grid-cols-3">

                      <Field label="Root Cause">
                        <textarea
                          value={form.rootCause}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              rootCause:
                                e.target.value,
                            })
                          }
                          className="min-h-28 w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field label="Corrective Action">
                        <textarea
                          value={form.correctiveAction}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              correctiveAction:
                                e.target.value,
                            })
                          }
                          className="min-h-28 w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field label="Preventive Action">
                        <textarea
                          value={form.preventiveAction}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              preventiveAction:
                                e.target.value,
                            })
                          }
                          className="min-h-28 w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                    </div>

                  </Section>

                  <Section
                    title="Customer Resolution & Case Status"
                    description="Record the final customer outcome and lifecycle status."
                  >

                    <div className="grid gap-5 md:grid-cols-2">

                      <Field label="Customer Resolution">
                        <textarea
                          value={form.customerResolution}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              customerResolution:
                                e.target.value,
                            })
                          }
                          placeholder="Replacement accepted, credit issued, refund agreed, customer approved rework..."
                          className="min-h-24 w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <div className="space-y-5">

                        <Field label="Status">
                          <select
                            value={form.status}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                status:
                                  e.target.value,

                                completedDate:
                                  [
                                    "Resolved",
                                    "Closed",
                                  ].includes(
                                    e.target.value
                                  )
                                    ? form.completedDate ||
                                      getToday()
                                    : form.completedDate,
                              })
                            }
                            className="w-full rounded-xl border bg-white px-4 py-3"
                          >
                            {STATUSES.map(
                              (item) => (
                                <option
                                  key={item}
                                  value={item}
                                >
                                  {item}
                                </option>
                              )
                            )}
                          </select>
                        </Field>

                        <Field label="Internal Notes">
                          <textarea
                            value={form.notes}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                notes:
                                  e.target.value,
                              })
                            }
                            className="min-h-20 w-full rounded-xl border px-4 py-3"
                          />
                        </Field>

                      </div>

                    </div>

                  </Section>

                </div>

              </div>

              <div className="flex shrink-0 flex-col gap-3 border-t bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="text-sm text-slate-500">

                  Affected:
                  {" "}
                  <b className="text-slate-900">
                    {form.quantity}
                  </b>
                  {" · "}
                  Rework:
                  {" "}
                  <b className="text-slate-900">
                    {form.reworkQuantity}
                  </b>

                </div>

                <div className="flex gap-3">

                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-xl border px-5 py-3 font-bold disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void saveCase()
                    }
                    disabled={saving}
                    className="rounded-xl bg-rose-700 px-6 py-3 font-black text-white hover:bg-rose-800 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editing
                      ? "Update Case"
                      : "Create Case"}
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* ===================================================
          VIEW
      =================================================== */}

      {viewing && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">

          <div className="flex min-h-full items-start justify-center p-4">

            <div className="my-8 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-2xl">

              <div className="flex items-start justify-between">

                <div>

                  <div className="text-xs font-black uppercase text-rose-600">
                    Return / Rework Case
                  </div>

                  <h2 className="mt-1 text-2xl font-black">
                    {viewing.caseNumber}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {viewing.caseType}
                    {" · "}
                    {viewing.status}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setViewing(null)
                  }
                  className="text-3xl text-slate-400"
                >
                  ×
                </button>

              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                <Info label="Order" value={viewing.orderNumber || "—"} />
                <Info label="Work Order" value={viewing.workOrderNumber || "—"} />
                <Info label="Customer" value={viewing.customerName || "—"} />
                <Info label="Item" value={viewing.itemDescription || viewing.designName || "—"} />
                <Info label="Affected Qty" value={String(viewing.quantity)} />
                <Info label="Rework Qty" value={String(viewing.reworkQuantity)} />
                <Info label="Responsibility" value={viewing.responsibility || "—"} />
                <Info label="Actual Cost" value={money(viewing.actualCost)} />

              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">

                <TextPanel
                  label="Issue Details"
                  value={viewing.issueDetails}
                />

                <TextPanel
                  label="Root Cause"
                  value={viewing.rootCause || "Not completed."}
                />

                <TextPanel
                  label="Corrective Action"
                  value={viewing.correctiveAction || "Not completed."}
                />

                <TextPanel
                  label="Preventive Action"
                  value={viewing.preventiveAction || "Not completed."}
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
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-bold">
        {label}
      </label>

      {children}

    </div>
  );
}

function Input({
  label,
  value,
  set,
}: {
  label: string;
  value: string;
  set:
    (value: string) => void;
}) {
  return (
    <Field label={label}>

      <input
        value={value}
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

function NumberField({
  label,
  value,
  set,
}: {
  label: string;
  value: number;
  set:
    (value: number) => void;
}) {
  return (
    <Field label={label}>

      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) =>
          set(
            Math.max(
              0,
              Number(
                e.target.value
              ) || 0
            )
          )
        }
        className="w-full rounded-xl border px-4 py-3"
      />

    </Field>
  );
}

function DateField({
  label,
  value,
  set,
}: {
  label: string;
  value: string;
  set:
    (value: string) => void;
}) {
  return (
    <Field label={label}>

      <input
        type="date"
        value={value}
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

function Info({
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
        {value || "—"}
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
    <div className="rounded-xl border bg-slate-50 p-4">

      <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {value}
      </div>

    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone:
    | "rose"
    | "amber"
    | "violet"
    | "blue";
}) {
  const styles = {
    rose:
      "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-50 text-rose-900",

    amber:
      "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 text-amber-900",

    violet:
      "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 text-violet-900",

    blue:
      "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-blue-900",
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
  status: string;
}) {
  const normalized =
    normalizeText(status);

  const style =
    ["resolved", "closed"].includes(
      normalized
    )
      ? "bg-green-100 text-green-700"
      : normalized ===
        "in rework"
      ? "bg-blue-100 text-blue-700"
      : normalized ===
        "cancelled"
      ? "bg-slate-100 text-slate-500"
      : normalized ===
        "awaiting customer"
      ? "bg-violet-100 text-violet-700"
      : "bg-amber-100 text-amber-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${style}`}
    >
      {status || "Open"}
    </span>
  );
}

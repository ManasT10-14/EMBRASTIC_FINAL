"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  type AppSettings,
} from "@/lib/app-settings";

type WorkOrder = {
  id: string;
  workOrderNumber: string;
  orderId: string;
  orderNumber: string;
  orderItemId: string;
  customerId: string;
  customerName: string;
  customerPoNumber: string;
  digitizingId: string;
  digitizingNumber: string;
  itemType: string;
  itemDescription: string;
  designName: string;
  embroideryService: string;
  placement: string;
  garmentColor: string;
  garmentSize: string;
  orderedQuantity: number;
  productionQuantity: number;
  unit: string;
  stitchCount: number;
  embroideryWidthMm: number;
  embroideryHeightMm: number;
  colourCount: number;
  threadColors: string;
  fileFormat: string;
  machineName: string;
  operatorName: string;
  hoopSize: string;
  threadType: string;
  needleType: string;
  backingType: string;
  toppingRequired: string;
  machineSpeed: number;
  sampleRequired: string;
  sampleApproved: string;
  sampleApprovedBy: string;
  plannedStartDate: string;
  targetCompletionDate: string;
  priority: string;
  status: string;
  packingInstructions: string;
  productionInstructions: string;
  notes: string;
  createdAt: string;
  updatedAt?: string;
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
};

type ProductionForm = {
  workOrderId: string;
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
};

const PRODUCTION_STATUSES = [
  "Pending",
  "Scheduled",
  "Sample Run",
  "In Production",
  "On Hold",
  "Completed",
];

const MACHINE_NAMES = [
  "Machine 1", "Machine 2", "Machine 3", "Machine 4",
  "Single Head Machine", "2 Head Machine", "4 Head Machine",
  "6 Head Machine", "8 Head Machine", "12 Head Machine",
  "15 Head Machine", "20 Head Machine", "Cap Embroidery Machine",
  "Flat Embroidery Machine", "Other",
];

const HOOP_SIZES = [
  "60 × 40 mm", "90 × 90 mm", "100 × 100 mm", "120 × 120 mm",
  "150 × 150 mm", "180 × 130 mm", "200 × 200 mm", "240 × 150 mm",
  "300 × 200 mm", "360 × 200 mm", "Cap Frame", "Jacket Back Frame",
  "Custom Hoop",
];

const THREAD_TYPES = [
  "Polyester", "Standard Polyester", "Rayon", "Metallic", "Cotton",
  "Glow Thread", "Reflective Thread", "Fire Resistant Thread", "Other",
];

const NEEDLE_TYPES = [
  "65/9", "70/10", "75/11", "80/12", "90/14", "100/16",
  "Ball Point", "Sharp Point", "Titanium", "Other",
];

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeText(value: unknown) {
  return clean(value).toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDate(value: unknown) {
  const text = clean(value);
  return text ? text.split("T")[0] : "";
}

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function uniqueOptions(base: string[], extra: string) {
  const value = clean(extra);
  if (!value || base.some((x) => normalizeText(x) === normalizeText(value))) return base;
  return [value, ...base];
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
    customerName: clean(row?.customerName ?? row?.customer),
    customerPoNumber: clean(row?.customerPoNumber),
    digitizingId: clean(row?.digitizingId),
    digitizingNumber: clean(row?.digitizingNumber),
    itemType: clean(row?.itemType),
    itemDescription: clean(row?.itemDescription),
    designName: clean(row?.designName),
    embroideryService: clean(row?.embroideryService),
    placement: clean(row?.placement),
    garmentColor: clean(row?.garmentColor),
    garmentSize: clean(row?.garmentSize),
    orderedQuantity: numberValue(row?.orderedQuantity),
    productionQuantity: numberValue(row?.productionQuantity),
    unit: clean(row?.unit),
    stitchCount: numberValue(row?.stitchCount),
    embroideryWidthMm: numberValue(row?.embroideryWidthMm),
    embroideryHeightMm: numberValue(row?.embroideryHeightMm),
    colourCount: numberValue(row?.colourCount ?? row?.colorCount),
    threadColors: clean(row?.threadColors),
    fileFormat: clean(row?.fileFormat),
    machineName: clean(row?.machineName),
    operatorName: clean(row?.operatorName),
    hoopSize: clean(row?.hoopSize),
    threadType: clean(row?.threadType),
    needleType: clean(row?.needleType),
    backingType: clean(row?.backingType),
    toppingRequired: clean(row?.toppingRequired),
    machineSpeed: numberValue(row?.machineSpeed),
    sampleRequired: clean(row?.sampleRequired),
    sampleApproved: clean(row?.sampleApproved),
    sampleApprovedBy: clean(row?.sampleApprovedBy),
    plannedStartDate: normalizeDate(row?.plannedStartDate),
    targetCompletionDate: normalizeDate(row?.targetCompletionDate),
    priority: clean(row?.priority),
    status: clean(row?.status),
    packingInstructions: clean(row?.packingInstructions),
    productionInstructions: clean(row?.productionInstructions),
    notes: clean(row?.notes),
    createdAt: clean(row?.createdAt),
    updatedAt: clean(row?.updatedAt),
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
    customerName: clean(row?.customerName ?? row?.customer),
    digitizingId: clean(row?.digitizingId),
    designName: clean(row?.designName),
    itemDescription: clean(row?.itemDescription),
    garmentColor: clean(row?.garmentColor),
    garmentSize: clean(row?.garmentSize),
    status: clean(row?.status) || "Pending",
    machineName: clean(row?.machineName),
    operatorName: clean(row?.operatorName),
    productionQuantity: numberValue(row?.productionQuantity),
    completedQuantity: numberValue(row?.completedQuantity),
    stitchCount: numberValue(row?.stitchCount),
    embroideryWidthMm: numberValue(row?.embroideryWidthMm),
    embroideryHeightMm: numberValue(row?.embroideryHeightMm),
    hoopSize: clean(row?.hoopSize),
    colourCount: numberValue(row?.colourCount ?? row?.colorCount),
    threadColors: clean(row?.threadColors),
    threadType: clean(row?.threadType),
    needleType: clean(row?.needleType),
    backingType: clean(row?.backingType),
    toppingRequired: clean(row?.toppingRequired),
    machineSpeed: numberValue(row?.machineSpeed),
    placement: clean(row?.placement),
    sampleApproved: clean(row?.sampleApproved) || "No",
    sampleApprovedBy: clean(row?.sampleApprovedBy),
    startDate: normalizeDate(row?.startDate),
    startTime: clean(row?.startTime),
    completedDate: normalizeDate(row?.completedDate),
    completedTime: clean(row?.completedTime),
    rejectedQuantity: numberValue(row?.rejectedQuantity),
    reworkQuantity: numberValue(row?.reworkQuantity),
    downtimeMinutes: numberValue(row?.downtimeMinutes),
    stoppageReason: clean(row?.stoppageReason),
    productionInstructions: clean(row?.productionInstructions),
    packingInstructions: clean(row?.packingInstructions),
    notes: clean(row?.notes),
    createdAt: clean(row?.createdAt),
    updatedAt: clean(row?.updatedAt),
  };
}

function emptyForm(): ProductionForm {
  return {
    workOrderId: "",
    status: "Pending",
    machineName: "",
    operatorName: "",
    productionQuantity: 0,
    completedQuantity: 0,
    stitchCount: 0,
    embroideryWidthMm: 0,
    embroideryHeightMm: 0,
    hoopSize: "",
    colourCount: 0,
    threadColors: "",
    threadType: "Polyester",
    needleType: "75/11",
    backingType: "",
    toppingRequired: "",
    machineSpeed: 700,
    placement: "",
    sampleApproved: "No",
    sampleApprovedBy: "",
    startDate: "",
    startTime: "",
    completedDate: "",
    completedTime: "",
    rejectedQuantity: 0,
    reworkQuantity: 0,
    downtimeMinutes: 0,
    stoppageReason: "",
    productionInstructions: "",
    packingInstructions: "",
    notes: "",
  };
}

export default function ProductionPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [productionJobs, setProductionJobs] = useState<Production[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Production | null>(null);
  const [form, setForm] = useState<ProductionForm>(emptyForm());

  useEffect(() => { void reload(); }, []);

  useEffect(() => {
    if (!showForm) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [showForm]);

  async function loadSheet(sheet: string) {
    const response = await fetch(`/api/excel?sheet=${encodeURIComponent(sheet)}`, { cache: "no-store" });
    let data: any = {};
    try { data = await response.json(); } catch {}
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || data?.error || `Unable to load ${sheet}.`);
    }
    return Array.isArray(data.rows) ? data.rows : [];
  }

  async function saveExcel(body: any) {
    const response = await fetch("/api/excel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    let data: any = {};
    try { data = await response.json(); } catch {}
    if (!response.ok || !data?.success) {
      console.error("Production Excel request failed:", { request: body, response: data });
      throw new Error(data?.message || data?.error || "Unable to process Excel request.");
    }
    return data;
  }

  async function refreshSettings() {
    const settings = await loadAppSettings();
    setAppSettings(settings);
    return settings;
  }

  async function loadWorkOrders() {
    try {
      setLoadingWorkOrders(true);
      const rows = await loadSheet("WorkOrders");
      const normalized = rows.map(normalizeWorkOrder).filter((x: WorkOrder) => x.id);
      normalized.sort((a: WorkOrder, b: WorkOrder) =>
        String(b.createdAt).localeCompare(String(a.createdAt))
      );
      setWorkOrders(normalized);
      return normalized;
    } finally {
      setLoadingWorkOrders(false);
    }
  }

  async function loadProduction() {
    const rows = await loadSheet("Production");
    const normalized = rows.map(normalizeProduction).filter((x: Production) => x.id);
    normalized.sort((a: Production, b: Production) =>
      String(b.createdAt).localeCompare(String(a.createdAt))
    );
    setProductionJobs(normalized);
    return normalized;
  }

  async function reload() {
    try {
      setLoading(true);
      await Promise.all([loadWorkOrders(), loadProduction(), refreshSettings()]);
    } catch (error) {
      console.error("Production load error:", error);
      alert(error instanceof Error ? error.message : "Unable to load Production.");
    } finally {
      setLoading(false);
    }
  }

  const machineOptions = useMemo(
    () => uniqueOptions(MACHINE_NAMES, appSettings.defaultMachineName),
    [appSettings.defaultMachineName]
  );
  const threadOptions = useMemo(
    () => uniqueOptions(THREAD_TYPES, appSettings.defaultThreadType),
    [appSettings.defaultThreadType]
  );
  const needleOptions = useMemo(
    () => uniqueOptions(NEEDLE_TYPES, appSettings.defaultNeedleType),
    [appSettings.defaultNeedleType]
  );
  const statusOptions = useMemo(
    () => uniqueOptions(PRODUCTION_STATUSES, appSettings.defaultProductionStatus),
    [appSettings.defaultProductionStatus]
  );

  const availableWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      if (editing && wo.id === editing.workOrderId) return true;
      const allowed = ["released", "ready for production"].includes(normalizeText(wo.status));
      if (!allowed) return false;
      return !productionJobs.some((p) =>
        p.workOrderId
          ? p.workOrderId === wo.id
          : p.orderId === wo.orderId && p.digitizingId === wo.digitizingId
      );
    });
  }, [workOrders, productionJobs, editing]);

  const selectedWorkOrder = useMemo(
    () => workOrders.find((wo) => wo.id === form.workOrderId),
    [workOrders, form.workOrderId]
  );

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm());
  }

  async function openCreate() {
    try {
      const [rows, settings] = await Promise.all([loadWorkOrders(), refreshSettings()]);
      setEditing(null);
      setForm({
        ...emptyForm(),
        machineName: settings.defaultMachineName,
        threadType: settings.defaultThreadType || "Polyester",
        needleType: settings.defaultNeedleType || "75/11",
        status: settings.defaultProductionStatus || "Pending",
        startDate: getToday(),
      });
      setShowForm(true);
      if (!rows.some((x: WorkOrder) =>
        ["released", "ready for production"].includes(normalizeText(x.status))
      )) {
        console.log("No released Work Orders are currently ready for Production.");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to prepare Production.");
    }
  }

  async function openEdit(job: Production) {
    try {
      const rows = await loadWorkOrders();
      await refreshSettings();
      if (job.workOrderId && !rows.some((wo) => wo.id === job.workOrderId)) {
        console.warn("Linked Work Order is no longer available:", job.workOrderId);
      }
      setEditing(job);
      setForm({
        workOrderId: job.workOrderId,
        status: job.status || "Pending",
        machineName: job.machineName,
        operatorName: job.operatorName,
        productionQuantity: job.productionQuantity,
        completedQuantity: job.completedQuantity,
        stitchCount: job.stitchCount,
        embroideryWidthMm: job.embroideryWidthMm,
        embroideryHeightMm: job.embroideryHeightMm,
        hoopSize: job.hoopSize,
        colourCount: job.colourCount,
        threadColors: job.threadColors,
        threadType: job.threadType || "Polyester",
        needleType: job.needleType || "75/11",
        backingType: job.backingType,
        toppingRequired: job.toppingRequired,
        machineSpeed: job.machineSpeed || 700,
        placement: job.placement,
        sampleApproved: job.sampleApproved || "No",
        sampleApprovedBy: job.sampleApprovedBy,
        startDate: job.startDate,
        startTime: job.startTime,
        completedDate: job.completedDate,
        completedTime: job.completedTime,
        rejectedQuantity: job.rejectedQuantity,
        reworkQuantity: job.reworkQuantity,
        downtimeMinutes: job.downtimeMinutes,
        stoppageReason: job.stoppageReason,
        productionInstructions: job.productionInstructions,
        packingInstructions: job.packingInstructions,
        notes: job.notes,
      });
      setShowForm(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to open Production job.");
    }
  }

  function handleWorkOrderChange(workOrderId: string) {
    const wo = workOrders.find((x) => x.id === workOrderId);
    if (!wo) {
      setForm((current) => ({ ...current, workOrderId }));
      return;
    }

    setForm((current) => ({
      ...current,
      workOrderId,
      machineName: wo.machineName || current.machineName,
      operatorName: wo.operatorName || current.operatorName,
      productionQuantity: wo.productionQuantity || wo.orderedQuantity || current.productionQuantity,
      stitchCount: wo.stitchCount || current.stitchCount,
      embroideryWidthMm: wo.embroideryWidthMm || current.embroideryWidthMm,
      embroideryHeightMm: wo.embroideryHeightMm || current.embroideryHeightMm,
      hoopSize: wo.hoopSize || current.hoopSize,
      colourCount: wo.colourCount || current.colourCount,
      threadColors: wo.threadColors || current.threadColors,
      threadType: wo.threadType || current.threadType,
      needleType: wo.needleType || current.needleType,
      backingType: wo.backingType || current.backingType,
      toppingRequired: wo.toppingRequired || current.toppingRequired,
      machineSpeed: wo.machineSpeed || current.machineSpeed,
      placement: wo.placement || current.placement,
      sampleApproved: wo.sampleApproved || current.sampleApproved,
      sampleApprovedBy: wo.sampleApprovedBy || current.sampleApprovedBy,
      startDate: wo.plannedStartDate || current.startDate || getToday(),
      productionInstructions: wo.productionInstructions || current.productionInstructions,
      packingInstructions: wo.packingInstructions || current.packingInstructions,
      notes: wo.notes || current.notes,
    }));
  }

  function validateForm() {
    if (!form.workOrderId) return "Please select a released Work Order / Job Card.";
    if (!form.machineName) return "Please select the embroidery machine.";
    if (!form.operatorName.trim()) return "Please enter the machine operator.";
    if (form.productionQuantity <= 0) return "Production quantity must be greater than zero.";
    if (form.completedQuantity < 0 || form.completedQuantity > form.productionQuantity)
      return "Completed quantity must be between 0 and the production quantity.";
    if (form.stitchCount <= 0) return "Stitch count must be greater than zero.";
    if (form.embroideryWidthMm <= 0 || form.embroideryHeightMm <= 0)
      return "Embroidery width and height are required.";
    if (!form.hoopSize) return "Please select the hoop size.";
    if (form.colourCount <= 0) return "Number of colours must be greater than zero.";
    if (!form.placement) return "Please select embroidery placement.";
    if (form.status === "In Production" && form.sampleApproved !== "Yes")
      return "Sample must be approved before bulk production starts.";
    if (form.sampleApproved === "Yes" && !form.sampleApprovedBy.trim())
      return "Please enter who approved the embroidery sample.";
    if (form.status === "Completed" && !form.completedDate)
      return "Completed Date is required.";
    if (form.status === "Completed" && form.completedQuantity <= 0)
      return "Enter the completed quantity before completing Production.";
    if (form.rejectedQuantity < 0 || form.reworkQuantity < 0)
      return "Rejected and rework quantities cannot be negative.";
    if (form.rejectedQuantity > form.productionQuantity)
      return "Rejected quantity cannot exceed production quantity.";
    if (form.downtimeMinutes < 0) return "Downtime cannot be negative.";
    return "";
  }

  async function saveProduction() {
    const validation = validateForm();
    if (validation) { alert(validation); return; }

    let freshWorkOrders: WorkOrder[] = [];
    try {
      freshWorkOrders = (await loadSheet("WorkOrders")).map(normalizeWorkOrder);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to validate Work Order.");
      return;
    }

    const wo = freshWorkOrders.find((x) => x.id === form.workOrderId);
    if (!wo) { alert("Selected Work Order no longer exists."); return; }

    if (!editing && !["released", "ready for production"].includes(normalizeText(wo.status))) {
      alert("Only Released or Ready for Production Work Orders can move to Production.");
      await loadWorkOrders();
      return;
    }

    try {
      setSaving(true);
      const now = new Date().toISOString();

      const record = {
        workOrderId: wo.id,
        workOrderNumber: wo.workOrderNumber,
        orderId: wo.orderId,
        orderNumber: wo.orderNumber,
        orderItemId: wo.orderItemId,
        customerId: wo.customerId,
        customerName: wo.customerName,
        digitizingId: wo.digitizingId,
        designName: wo.designName,
        itemDescription: wo.itemDescription,
        garmentColor: wo.garmentColor,
        garmentSize: wo.garmentSize,
        status: form.status,
        machineName: form.machineName,
        operatorName: form.operatorName.trim(),
        productionQuantity: Number(form.productionQuantity),
        completedQuantity: Number(form.completedQuantity),
        stitchCount: Number(form.stitchCount),
        embroideryWidthMm: Number(form.embroideryWidthMm),
        embroideryHeightMm: Number(form.embroideryHeightMm),
        hoopSize: form.hoopSize,
        colourCount: Number(form.colourCount),
        threadColors: form.threadColors.trim(),
        threadType: form.threadType,
        needleType: form.needleType,
        backingType: form.backingType,
        toppingRequired: form.toppingRequired,
        machineSpeed: Number(form.machineSpeed),
        placement: form.placement,
        sampleApproved: form.sampleApproved,
        sampleApprovedBy: form.sampleApprovedBy.trim(),
        startDate: form.startDate,
        startTime: form.startTime,
        completedDate: form.status === "Completed" ? form.completedDate : "",
        completedTime: form.status === "Completed" ? form.completedTime : "",
        rejectedQuantity: Number(form.rejectedQuantity),
        reworkQuantity: Number(form.reworkQuantity),
        downtimeMinutes: Number(form.downtimeMinutes),
        stoppageReason: form.stoppageReason.trim(),
        productionInstructions: form.productionInstructions.trim(),
        packingInstructions: form.packingInstructions.trim(),
        notes: form.notes.trim(),
        updatedAt: now,
      };

      await saveExcel({
        action: editing ? "update" : "add",
        sheet: "Production",
        ...(editing ? { id: editing.id } : {}),
        record: editing
          ? { ...editing, ...record }
          : { id: generateId(), ...record, createdAt: now },
      });

      // Work Order becomes In Production while running, Completed when Production completes.
      await saveExcel({
        action: "update",
        sheet: "WorkOrders",
        id: wo.id,
        record: {
          ...wo,
          status: form.status === "Completed" ? "Completed" : "In Production",
          updatedAt: now,
        },
      });

      // Keep the main Order workflow synchronized.
      try {
        const orderRows = await loadSheet("Orders");
        const order = orderRows.find((row: any) =>
          clean(row?.id) === wo.orderId || clean(row?.orderNumber) === wo.orderNumber
        );
        if (order?.id) {
          await saveExcel({
            action: "update",
            sheet: "Orders",
            id: order.id,
            record: {
              ...order,
              status: form.status === "Completed" ? "Quality Control" : "Production",
              updatedAt: now,
            },
          });
        }
      } catch (orderError) {
        console.error("Order workflow update error:", orderError);
      }

      closeForm();
      await reload();
    } catch (error) {
      console.error("Production save error:", error);
      alert(error instanceof Error ? error.message : "Unable to save Production.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduction(job: Production) {
    if (!confirm(`Delete Production job for ${job.orderNumber} - ${job.designName}?`)) return;
    try {
      setSaving(true);
      await saveExcel({ action: "delete", sheet: "Production", id: job.id });

      // If the linked Work Order still exists, return it to Ready for Production.
      if (job.workOrderId) {
        try {
          const rows = (await loadSheet("WorkOrders")).map(normalizeWorkOrder);
          const wo = rows.find((x: WorkOrder) => x.id === job.workOrderId);
          if (wo && normalizeText(wo.status) !== "completed") {
            await saveExcel({
              action: "update",
              sheet: "WorkOrders",
              id: wo.id,
              record: { ...wo, status: "Ready for Production", updatedAt: new Date().toISOString() },
            });
          }
        } catch (error) {
          console.error("Unable to restore Work Order status:", error);
        }
      }
      await reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to delete Production.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return productionJobs;
    return productionJobs.filter((job) =>
      [
        job.workOrderNumber, job.orderNumber, job.customerName, job.designName,
        job.itemDescription, job.machineName, job.operatorName, job.status, job.placement,
      ].join(" ").toLowerCase().includes(q)
    );
  }, [productionJobs, search]);

  const activeCount = productionJobs.filter((x) => normalizeText(x.status) === "in production").length;
  const completedCount = productionJobs.filter((x) => normalizeText(x.status) === "completed").length;
  const pendingCount = productionJobs.filter((x) =>
    ["pending", "scheduled", "sample run"].includes(normalizeText(x.status))
  ).length;
  const totalProductionQuantity = productionJobs.reduce((sum, x) => sum + x.productionQuantity, 0);

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-1 pb-24 pr-2">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
              Shop Floor Operations
            </div>
            <h1 className="text-3xl font-black">Production</h1>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
              Start machine production from released Work Orders / Job Cards. Technical setup,
              quantity, machine instructions and order details are carried forward automatically.
            </p>
          </div>
          <button type="button" onClick={() => void openCreate()}
            className="shrink-0 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800">
            + Start Production
          </button>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <div className="text-sm font-black text-slate-900">Work Order Controlled Production</div>
              <div className="mt-1 text-xs leading-5 text-slate-600">
                Only Work Orders marked Released or Ready for Production can create a new Production job.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <SettingBadge label="Machine" value={appSettings.defaultMachineName || "Not set"} />
              <SettingBadge label="Thread" value={appSettings.defaultThreadType} />
              <SettingBadge label="Needle" value={appSettings.defaultNeedleType} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Ready Work Orders" value={String(availableWorkOrders.length)} caption="Released jobs awaiting Production" />
          <StatCard label="Pending / Scheduled" value={String(pendingCount)} caption="Jobs waiting to start" />
          <StatCard label="In Production" value={String(activeCount)} caption="Jobs currently running" />
          <StatCard label="Completed" value={String(completedCount)} caption="Jobs sent to Quality Control" />
          <StatCard label="Planned Quantity" value={String(totalProductionQuantity)} caption="Total Production quantity" />
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search work order, order, customer, design, machine, operator or status..."
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500" />
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {loading ? (
            <div className="p-10 text-center text-slate-500">Loading Production...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl">🪡</div>
              <h2 className="mt-4 text-xl font-black">No Production jobs</h2>
              <p className="mt-2 text-sm text-slate-500">
                Release a Work Order / Job Card and it will become available here.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1300px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                    <th className="px-4 py-4">Work Order</th>
                    <th className="px-4 py-4">Order</th>
                    <th className="px-4 py-4">Customer / Item</th>
                    <th className="px-4 py-4">Machine</th>
                    <th className="px-4 py-4">Operator</th>
                    <th className="px-4 py-4">Qty</th>
                    <th className="px-4 py-4">Completed</th>
                    <th className="px-4 py-4">Stitches</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((job) => (
                    <tr key={job.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-4 font-black text-blue-700">{job.workOrderNumber || "Legacy"}</td>
                      <td className="px-4 py-4 font-black">{job.orderNumber}</td>
                      <td className="px-4 py-4">
                        <div className="font-semibold">{job.customerName || "—"}</div>
                        <div className="mt-1 text-xs text-slate-500">{job.itemDescription || job.designName || "—"}</div>
                      </td>
                      <td className="px-4 py-4 font-semibold">{job.machineName || "—"}</td>
                      <td className="px-4 py-4">{job.operatorName || "—"}</td>
                      <td className="px-4 py-4 font-black">{job.productionQuantity}</td>
                      <td className="px-4 py-4 font-black">{job.completedQuantity}</td>
                      <td className="px-4 py-4">{job.stitchCount}</td>
                      <td className="px-4 py-4"><ProductionStatusBadge status={job.status} /></td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => void openEdit(job)}
                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">Edit</button>
                          <button type="button" onClick={() => void deleteProduction(job)} disabled={saving}
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-50">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">
            <div className="my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex shrink-0 items-start justify-between border-b px-5 py-5 sm:px-6">
                <div>
                  <div className="text-xs font-black uppercase tracking-wide text-blue-600">
                    {editing ? "Existing Production" : "Work Order → Production"}
                  </div>
                  <h2 className="mt-1 text-2xl font-black">{editing ? "Edit Production Job" : "Start Production Job"}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Job-card specifications are prefilled. Record actual shop-floor execution below.
                  </p>
                </div>
                <button type="button" onClick={closeForm} disabled={saving}
                  className="ml-4 rounded-lg px-2 text-3xl leading-none text-slate-400 hover:bg-slate-100">×</button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
                <div className="space-y-7">
                  <Section title="Production Source" description="Select a released Work Order / Job Card.">
                    <Field label="Work Order / Job Card *" caption="Only Released and Ready for Production Work Orders are available.">
                      <select value={form.workOrderId} onChange={(e) => handleWorkOrderChange(e.target.value)}
                        disabled={Boolean(editing) || loadingWorkOrders}
                        className="w-full rounded-xl border bg-white px-4 py-3 disabled:bg-slate-100">
                        <option value="">{loadingWorkOrders ? "Loading Work Orders..." : "Select Work Order"}</option>
                        {availableWorkOrders.map((wo) => (
                          <option key={wo.id} value={wo.id}>
                            {wo.workOrderNumber} — {wo.orderNumber} — {wo.customerName} — {wo.itemDescription || wo.designName}
                          </option>
                        ))}
                      </select>
                    </Field>

                    {selectedWorkOrder && (
                      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                        <div className="text-xs font-black uppercase text-blue-600">Selected Job Card</div>
                        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <Info label="Work Order" value={selectedWorkOrder.workOrderNumber} />
                          <Info label="Order" value={selectedWorkOrder.orderNumber} />
                          <Info label="Customer" value={selectedWorkOrder.customerName} />
                          <Info label="Priority" value={selectedWorkOrder.priority || "Normal"} />
                          <Info label="Item" value={selectedWorkOrder.itemDescription || selectedWorkOrder.itemType} />
                          <Info label="Design" value={selectedWorkOrder.designName} />
                          <Info label="Garment" value={[selectedWorkOrder.garmentColor, selectedWorkOrder.garmentSize].filter(Boolean).join(" / ")} />
                          <Info label="Target" value={selectedWorkOrder.targetCompletionDate || "—"} />
                        </div>
                      </div>
                    )}
                  </Section>

                  <Section title="Machine & Operator" description="Assignment prepared on the Job Card can be adjusted for actual production.">
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="Embroidery Machine *" caption="Machine actually used for this run.">
                        <select value={form.machineName} onChange={(e) => setForm({ ...form, machineName: e.target.value })}
                          className="w-full rounded-xl border bg-white px-4 py-3">
                          <option value="">Select Machine</option>
                          {machineOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                        </select>
                      </Field>
                      <Field label="Operator Name *" caption="Person responsible for this production run.">
                        <input value={form.operatorName} onChange={(e) => setForm({ ...form, operatorName: e.target.value })}
                          className="w-full rounded-xl border px-4 py-3" placeholder="Machine operator" />
                      </Field>
                    </div>
                  </Section>

                  <Section title="Production Status & Quantity" description="Track planned quantity against actual completed output.">
                    <div className="grid gap-5 md:grid-cols-3">
                      <Field label="Status *" caption="Current shop-floor stage.">
                        <select value={form.status} onChange={(e) => {
                          const status = e.target.value;
                          setForm({
                            ...form, status,
                            completedDate: status === "Completed" ? form.completedDate || getToday() : form.completedDate,
                            completedQuantity: status === "Completed" && form.completedQuantity === 0
                              ? form.productionQuantity : form.completedQuantity,
                          });
                        }} className="w-full rounded-xl border bg-white px-4 py-3">
                          {statusOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                        </select>
                      </Field>
                      <Field label="Production Quantity *" caption="Planned quantity from Job Card.">
                        <input type="number" min="1" value={form.productionQuantity}
                          onChange={(e) => setForm({ ...form, productionQuantity: Number(e.target.value) })}
                          className="w-full rounded-xl border px-4 py-3" />
                      </Field>
                      <Field label="Completed Quantity" caption="Actual good pieces completed so far.">
                        <input type="number" min="0" max={form.productionQuantity} value={form.completedQuantity}
                          onChange={(e) => setForm({ ...form, completedQuantity: Number(e.target.value) })}
                          className="w-full rounded-xl border px-4 py-3" />
                      </Field>
                    </div>
                  </Section>

                  <Section title="Embroidery Specification" description="Technical values carried forward from the Work Order.">
                    <div className="grid gap-5 md:grid-cols-3">
                      <NumField label="Stitch Count *" value={form.stitchCount} set={(v) => setForm({ ...form, stitchCount: v })} />
                      <NumField label="Width (mm) *" value={form.embroideryWidthMm} set={(v) => setForm({ ...form, embroideryWidthMm: v })} />
                      <NumField label="Height (mm) *" value={form.embroideryHeightMm} set={(v) => setForm({ ...form, embroideryHeightMm: v })} />
                      <NumField label="Colour Count *" value={form.colourCount} set={(v) => setForm({ ...form, colourCount: v })} />
                      <Field label="Placement *" caption="Embroidery location.">
                        <input value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}
                          className="w-full rounded-xl border px-4 py-3" />
                      </Field>
                      <Field label="Hoop / Frame *" caption="Hoop used for production.">
                        <select value={form.hoopSize} onChange={(e) => setForm({ ...form, hoopSize: e.target.value })}
                          className="w-full rounded-xl border bg-white px-4 py-3">
                          <option value="">Select Hoop</option>
                          {uniqueOptions(HOOP_SIZES, form.hoopSize).map((x) => <option key={x} value={x}>{x}</option>)}
                        </select>
                      </Field>
                    </div>
                  </Section>

                  <Section title="Thread, Needle & Stabilizer" description="Machine consumable and support-material setup.">
                    <div className="grid gap-5 md:grid-cols-3">
                      <Field label="Thread Type" caption="Thread specification.">
                        <select value={form.threadType} onChange={(e) => setForm({ ...form, threadType: e.target.value })}
                          className="w-full rounded-xl border bg-white px-4 py-3">
                          {threadOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                        </select>
                      </Field>
                      <Field label="Needle Type" caption="Needle specification.">
                        <select value={form.needleType} onChange={(e) => setForm({ ...form, needleType: e.target.value })}
                          className="w-full rounded-xl border bg-white px-4 py-3">
                          {needleOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                        </select>
                      </Field>
                      <NumField label="Machine Speed (SPM)" value={form.machineSpeed} set={(v) => setForm({ ...form, machineSpeed: v })} />
                      <Field label="Thread Colours" caption="Colour sequence / thread references.">
                        <input value={form.threadColors} onChange={(e) => setForm({ ...form, threadColors: e.target.value })}
                          className="w-full rounded-xl border px-4 py-3" />
                      </Field>
                      <Field label="Backing / Stabilizer" caption="Backing specified on Job Card.">
                        <input value={form.backingType} onChange={(e) => setForm({ ...form, backingType: e.target.value })}
                          className="w-full rounded-xl border px-4 py-3" />
                      </Field>
                      <Field label="Topping" caption="Water-soluble topping or other topping requirement.">
                        <input value={form.toppingRequired} onChange={(e) => setForm({ ...form, toppingRequired: e.target.value })}
                          className="w-full rounded-xl border px-4 py-3" />
                      </Field>
                    </div>
                  </Section>

                  <Section title="Sample Approval" description="Bulk production should not start before required sample approval.">
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="Sample Approved" caption="Required before In Production status.">
                        <select value={form.sampleApproved} onChange={(e) => setForm({ ...form, sampleApproved: e.target.value })}
                          className="w-full rounded-xl border bg-white px-4 py-3">
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                          <option value="Not Required">Not Required</option>
                        </select>
                      </Field>
                      <Field label="Approved By" caption="Name of approver when sample is approved.">
                        <input value={form.sampleApprovedBy} onChange={(e) => setForm({ ...form, sampleApprovedBy: e.target.value })}
                          className="w-full rounded-xl border px-4 py-3" />
                      </Field>
                    </div>
                  </Section>

                  <Section title="Timing" description="Actual production start and completion timing.">
                    <div className="grid gap-5 md:grid-cols-4">
                      <Field label="Start Date" caption="Actual start date.">
                        <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                          className="w-full rounded-xl border px-4 py-3" />
                      </Field>
                      <Field label="Start Time" caption="Actual start time.">
                        <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                          className="w-full rounded-xl border px-4 py-3" />
                      </Field>
                      <Field label="Completed Date" caption="Required when status is Completed.">
                        <input type="date" value={form.completedDate} onChange={(e) => setForm({ ...form, completedDate: e.target.value })}
                          className="w-full rounded-xl border px-4 py-3" />
                      </Field>
                      <Field label="Completed Time" caption="Actual completion time.">
                        <input type="time" value={form.completedTime} onChange={(e) => setForm({ ...form, completedTime: e.target.value })}
                          className="w-full rounded-xl border px-4 py-3" />
                      </Field>
                    </div>
                  </Section>

                  <Section title="Exceptions & Downtime" description="Capture losses that affect quality, capacity and production efficiency.">
                    <div className="grid gap-5 md:grid-cols-4">
                      <NumField label="Rejected Qty" value={form.rejectedQuantity} set={(v) => setForm({ ...form, rejectedQuantity: v })} />
                      <NumField label="Rework Qty" value={form.reworkQuantity} set={(v) => setForm({ ...form, reworkQuantity: v })} />
                      <NumField label="Downtime (minutes)" value={form.downtimeMinutes} set={(v) => setForm({ ...form, downtimeMinutes: v })} />
                      <Field label="Stoppage Reason" caption="Reason for material, machine or operator stoppage.">
                        <input value={form.stoppageReason} onChange={(e) => setForm({ ...form, stoppageReason: e.target.value })}
                          className="w-full rounded-xl border px-4 py-3" />
                      </Field>
                    </div>
                  </Section>

                  <Section title="Job Card Instructions" description="Instructions inherited from Work Order remain visible to the operator.">
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="Production Instructions" caption="Machine / embroidery instructions.">
                        <textarea value={form.productionInstructions}
                          onChange={(e) => setForm({ ...form, productionInstructions: e.target.value })}
                          className="min-h-28 w-full rounded-xl border px-4 py-3" />
                      </Field>
                      <Field label="Packing Instructions" caption="Packing requirements to preserve for downstream operations.">
                        <textarea value={form.packingInstructions}
                          onChange={(e) => setForm({ ...form, packingInstructions: e.target.value })}
                          className="min-h-28 w-full rounded-xl border px-4 py-3" />
                      </Field>
                    </div>
                  </Section>

                  <Section title="Production Notes" description="Actual observations, machine issues or internal comments.">
                    <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Production notes..." className="min-h-28 w-full rounded-xl border px-4 py-3" />
                  </Section>
                </div>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button type="button" onClick={closeForm} disabled={saving}
                  className="rounded-xl border px-5 py-3 font-semibold hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                <button type="button" onClick={() => void saveProduction()} disabled={saving}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-black text-white hover:bg-blue-800 disabled:opacity-50">
                  {saving ? "Saving..." : editing ? "Update Production" : "Start Production"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-slate-50/50 p-4 sm:p-5">
      <div className="mb-5">
        <h3 className="text-base font-black text-slate-900">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Field({ label, caption, children }: { label: string; caption: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-800">{label}</label>
      {children}
      <p className="mt-1.5 text-xs leading-5 text-slate-400">{caption}</p>
    </div>
  );
}

function NumField({ label, value, set }: { label: string; value: number; set: (value: number) => void }) {
  return (
    <Field label={label} caption="Job Card value; adjust only if actual production differs.">
      <input type="number" min="0" value={value} onChange={(e) => set(Number(e.target.value))}
        className="w-full rounded-xl border px-4 py-3" />
    </Field>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-blue-600">{label}</div>
      <div className="mt-1 break-words font-black text-slate-900">{value || "—"}</div>
    </div>
  );
}

function StatCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black text-slate-950">{value}</div>
      <div className="mt-1 text-xs leading-5 text-slate-400">{caption}</div>
    </div>
  );
}

function SettingBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-blue-200 bg-white px-3 py-2">
      <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 max-w-[180px] truncate text-xs font-black text-slate-800">{value || "—"}</div>
    </div>
  );
}

function ProductionStatusBadge({ status }: { status: string }) {
  const normalized = normalizeText(status);
  const style =
    normalized === "completed" ? "bg-green-100 text-green-700" :
    normalized === "in production" ? "bg-blue-100 text-blue-700" :
    normalized === "on hold" ? "bg-red-100 text-red-700" :
    normalized === "sample run" ? "bg-purple-100 text-purple-700" :
    "bg-yellow-100 text-yellow-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${style}`}>{status || "Pending"}</span>;
}

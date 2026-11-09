"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Digitizing = {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  artworkId: string;
  designName: string;
  status: string;
  notes: string;
  createdAt: string;
};

type Production = {
  id: string;

  orderId: string;
  orderNumber: string;

  customerId: string;
  customerName: string;

  digitizingId: string;
  designName: string;

  status: string;

  machineName: string;
  operatorName: string;

  productionQuantity: number;
  stitchCount: number;

  embroideryWidthMm: number;
  embroideryHeightMm: number;

  hoopSize: string;

  colourCount: number;
  threadType: string;
  needleType: string;

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

  notes: string;

  createdAt: string;
};

type ProductionForm = {
  digitizingId: string;

  status: string;

  machineName: string;
  operatorName: string;

  productionQuantity: number;

  stitchCount: number;

  embroideryWidthMm: number;
  embroideryHeightMm: number;

  hoopSize: string;

  colourCount: number;

  threadType: string;
  needleType: string;

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
  "Machine 1",
  "Machine 2",
  "Machine 3",
  "Machine 4",
  "Single Head Machine",
  "2 Head Machine",
  "4 Head Machine",
  "6 Head Machine",
  "8 Head Machine",
  "12 Head Machine",
  "15 Head Machine",
  "20 Head Machine",
  "Cap Embroidery Machine",
  "Flat Embroidery Machine",
  "Other",
];

const HOOP_SIZES = [
  "60 × 40 mm",
  "90 × 90 mm",
  "100 × 100 mm",
  "120 × 120 mm",
  "150 × 150 mm",
  "180 × 130 mm",
  "200 × 200 mm",
  "240 × 150 mm",
  "300 × 200 mm",
  "360 × 200 mm",
  "Cap Frame",
  "Jacket Back Frame",
  "Custom Hoop",
];

const THREAD_TYPES = [
  "Polyester",
  "Rayon",
  "Metallic",
  "Cotton",
  "Glow Thread",
  "Reflective Thread",
  "Fire Resistant Thread",
  "Other",
];

const NEEDLE_TYPES = [
  "65/9",
  "70/10",
  "75/11",
  "80/12",
  "90/14",
  "100/16",
  "Ball Point",
  "Sharp Point",
  "Titanium",
  "Other",
];

const PLACEMENTS = [
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

function generateId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 10)}`;
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function normalizeDate(value: unknown) {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  return text.split("T")[0];
}

function normalizeDigitizing(row: any): Digitizing {
  return {
    id: String(row?.id ?? "").trim(),

    orderId: String(row?.orderId ?? "").trim(),

    orderNumber: String(
      row?.orderNumber ?? ""
    ).trim(),

    customerId: String(
      row?.customerId ?? ""
    ).trim(),

    customerName: String(
      row?.customerName ??
        row?.customer ??
        ""
    ).trim(),

    artworkId: String(
      row?.artworkId ?? ""
    ).trim(),

    designName: String(
      row?.designName ?? ""
    ).trim(),

    status: String(
      row?.status ?? ""
    ).trim(),

    notes: String(row?.notes ?? ""),

    createdAt: String(
      row?.createdAt ?? ""
    ),
  };
}

function normalizeProduction(row: any): Production {
  return {
    id: String(row?.id ?? "").trim(),

    orderId: String(
      row?.orderId ?? ""
    ).trim(),

    orderNumber: String(
      row?.orderNumber ?? ""
    ).trim(),

    customerId: String(
      row?.customerId ?? ""
    ).trim(),

    customerName: String(
      row?.customerName ??
        row?.customer ??
        ""
    ).trim(),

    digitizingId: String(
      row?.digitizingId ?? ""
    ).trim(),

    designName: String(
      row?.designName ?? ""
    ).trim(),

    status: String(
      row?.status ?? "Pending"
    ).trim(),

    machineName: String(
      row?.machineName ?? ""
    ),

    operatorName: String(
      row?.operatorName ?? ""
    ),

    productionQuantity: Number(
      row?.productionQuantity ?? 0
    ),

    stitchCount: Number(
      row?.stitchCount ?? 0
    ),

    embroideryWidthMm: Number(
      row?.embroideryWidthMm ?? 0
    ),

    embroideryHeightMm: Number(
      row?.embroideryHeightMm ?? 0
    ),

    hoopSize: String(
      row?.hoopSize ?? ""
    ),

    colourCount: Number(
      row?.colourCount ?? 0
    ),

    threadType: String(
      row?.threadType ?? ""
    ),

    needleType: String(
      row?.needleType ?? ""
    ),

    machineSpeed: Number(
      row?.machineSpeed ?? 0
    ),

    placement: String(
      row?.placement ?? ""
    ),

    sampleApproved: String(
      row?.sampleApproved ?? "No"
    ),

    sampleApprovedBy: String(
      row?.sampleApprovedBy ?? ""
    ),

    startDate: normalizeDate(
      row?.startDate
    ),

    startTime: String(
      row?.startTime ?? ""
    ),

    completedDate: normalizeDate(
      row?.completedDate
    ),

    completedTime: String(
      row?.completedTime ?? ""
    ),

    rejectedQuantity: Number(
      row?.rejectedQuantity ?? 0
    ),

    reworkQuantity: Number(
      row?.reworkQuantity ?? 0
    ),

    notes: String(
      row?.notes ?? ""
    ),

    createdAt: String(
      row?.createdAt ?? ""
    ),
  };
}

function emptyForm(): ProductionForm {
  return {
    digitizingId: "",

    status: "Scheduled",

    machineName: "",
    operatorName: "",

    productionQuantity: 0,

    stitchCount: 0,

    embroideryWidthMm: 0,
    embroideryHeightMm: 0,

    hoopSize: "",

    colourCount: 0,

    threadType: "Polyester",

    needleType: "75/11",

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

    notes: "",
  };
}

export default function ProductionPage() {
  const [
    completedDigitizing,
    setCompletedDigitizing,
  ] = useState<Digitizing[]>([]);

  const [
    productionJobs,
    setProductionJobs,
  ] = useState<Production[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    loadingDigitizing,
    setLoadingDigitizing,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editing, setEditing] =
    useState<Production | null>(null);

  const [form, setForm] =
    useState<ProductionForm>(
      emptyForm()
    );

  useEffect(() => {
    reload();
  }, []);

  /*
   * Prevent the page behind the modal from
   * scrolling while the Production form is open.
   *
   * The modal itself has its own scrollbar.
   */
  useEffect(() => {
    if (!showForm) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [showForm]);

  async function loadCompletedDigitizing() {
    try {
      setLoadingDigitizing(true);

      const response = await fetch(
        "/api/excel?sheet=Digitizing",
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to load Digitizing."
        );
      }

      const rows: Digitizing[] =
        Array.isArray(data.rows)
          ? data.rows
              .map(
                normalizeDigitizing
              )
              .filter(
                (
                  job: Digitizing
                ) =>
                  Boolean(
                    job.id &&
                      job.orderId &&
                      job.status ===
                        "Completed"
                  )
              )
          : [];

      rows.sort((a, b) =>
        String(
          b.createdAt
        ).localeCompare(
          String(a.createdAt)
        )
      );

      setCompletedDigitizing(
        rows
      );

      return rows;
    } finally {
      setLoadingDigitizing(false);
    }
  }

  async function loadProduction() {
    const response = await fetch(
      "/api/excel?sheet=Production",
      {
        cache: "no-store",
      }
    );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
          "Unable to load Production."
      );
    }

    const rows: Production[] =
      Array.isArray(data.rows)
        ? data.rows
            .map(
              normalizeProduction
            )
            .filter(
              (
                job: Production
              ) => Boolean(job.id)
            )
        : [];

    rows.sort((a, b) =>
      String(
        b.createdAt
      ).localeCompare(
        String(a.createdAt)
      )
    );

    setProductionJobs(rows);

    return rows;
  }

  async function reload() {
    try {
      setLoading(true);

      await Promise.all([
        loadCompletedDigitizing(),
        loadProduction(),
      ]);
    } catch (error) {
      console.error(
        "Production load error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load Production."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditing(null);

    setForm(emptyForm());
  }

  function closeForm() {
    setShowForm(false);

    resetForm();
  }

  async function openCreate() {
    try {
      const rows =
        await loadCompletedDigitizing();

      setEditing(null);

      setForm({
        ...emptyForm(),

        startDate: getToday(),

        status: "Scheduled",
      });

      setShowForm(true);

      if (rows.length === 0) {
        console.log(
          "No completed Digitizing jobs available."
        );
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to refresh completed Digitizing jobs."
      );
    }
  }

  async function openEdit(
    job: Production
  ) {
    try {
      const completed =
        await loadCompletedDigitizing();

      const exists =
        completed.some(
          (digitizing) =>
            digitizing.id ===
            job.digitizingId
        );

      /*
       * An old Production record may reference a
       * Digitizing record which is no longer
       * "Completed". We still load it so the
       * existing Production job can be edited.
       */
      if (
        job.digitizingId &&
        !exists
      ) {
        const response =
          await fetch(
            "/api/excel?sheet=Digitizing",
            {
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (
          response.ok &&
          data.success &&
          Array.isArray(
            data.rows
          )
        ) {
          const linked =
            data.rows
              .map(
                normalizeDigitizing
              )
              .find(
                (
                  row: Digitizing
                ) =>
                  row.id ===
                  job.digitizingId
              );

          if (linked) {
            setCompletedDigitizing(
              (old) => [
                linked,
                ...old.filter(
                  (row) =>
                    row.id !==
                    linked.id
                ),
              ]
            );
          }
        }
      }

      setEditing(job);

      setForm({
        digitizingId:
          job.digitizingId,

        status:
          job.status ||
          "Pending",

        machineName:
          job.machineName,

        operatorName:
          job.operatorName,

        productionQuantity:
          job.productionQuantity,

        stitchCount:
          job.stitchCount,

        embroideryWidthMm:
          job.embroideryWidthMm,

        embroideryHeightMm:
          job.embroideryHeightMm,

        hoopSize:
          job.hoopSize,

        colourCount:
          job.colourCount,

        threadType:
          job.threadType ||
          "Polyester",

        needleType:
          job.needleType ||
          "75/11",

        machineSpeed:
          job.machineSpeed ||
          700,

        placement:
          job.placement,

        sampleApproved:
          job.sampleApproved ||
          "No",

        sampleApprovedBy:
          job.sampleApprovedBy,

        startDate:
          job.startDate,

        startTime:
          job.startTime,

        completedDate:
          job.completedDate,

        completedTime:
          job.completedTime,

        rejectedQuantity:
          job.rejectedQuantity,

        reworkQuantity:
          job.reworkQuantity,

        notes:
          job.notes,
      });

      setShowForm(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to open Production job."
      );
    }
  }

  const selectedDigitizing =
    useMemo(() => {
      return completedDigitizing.find(
        (job) =>
          job.id ===
          form.digitizingId
      );
    }, [
      completedDigitizing,
      form.digitizingId,
    ]);

  const availableDigitizing =
    useMemo(() => {
      return completedDigitizing.filter(
        (digitizing) => {
          if (
            editing &&
            digitizing.id ===
              editing.digitizingId
          ) {
            return true;
          }

          return !productionJobs.some(
            (production) =>
              production.digitizingId ===
              digitizing.id
          );
        }
      );
    }, [
      completedDigitizing,
      productionJobs,
      editing,
    ]);

  async function saveProduction() {
    if (!form.digitizingId) {
      alert(
        "Please select a completed Digitizing job."
      );

      return;
    }

    if (!form.machineName) {
      alert(
        "Please select the embroidery machine."
      );

      return;
    }

    if (
      !form.operatorName.trim()
    ) {
      alert(
        "Please enter the machine operator."
      );

      return;
    }

    if (
      Number(
        form.productionQuantity
      ) <= 0
    ) {
      alert(
        "Production quantity must be greater than zero."
      );

      return;
    }

    if (
      Number(
        form.stitchCount
      ) <= 0
    ) {
      alert(
        "Stitch count must be greater than zero."
      );

      return;
    }

    if (
      Number(
        form.embroideryWidthMm
      ) <= 0 ||
      Number(
        form.embroideryHeightMm
      ) <= 0
    ) {
      alert(
        "Embroidery width and height are required."
      );

      return;
    }

    if (!form.hoopSize) {
      alert(
        "Please select the hoop size."
      );

      return;
    }

    if (
      Number(
        form.colourCount
      ) <= 0
    ) {
      alert(
        "Number of colours must be greater than zero."
      );

      return;
    }

    if (!form.placement) {
      alert(
        "Please select embroidery placement."
      );

      return;
    }

    if (
      form.status ===
        "In Production" &&
      form.sampleApproved !==
        "Yes"
    ) {
      alert(
        "Sample must be approved before bulk production starts."
      );

      return;
    }

    if (
      form.sampleApproved ===
        "Yes" &&
      !form.sampleApprovedBy.trim()
    ) {
      alert(
        "Please enter who approved the embroidery sample."
      );

      return;
    }

    if (
      form.status ===
        "Completed" &&
      !form.completedDate
    ) {
      alert(
        "Completed Date is required."
      );

      return;
    }

    if (
      Number(
        form.rejectedQuantity
      ) < 0 ||
      Number(
        form.reworkQuantity
      ) < 0
    ) {
      alert(
        "Rejected and rework quantities cannot be negative."
      );

      return;
    }

    if (
      Number(
        form.rejectedQuantity
      ) >
      Number(
        form.productionQuantity
      )
    ) {
      alert(
        "Rejected quantity cannot exceed production quantity."
      );

      return;
    }

    /*
     * Validate the selected Digitizing record
     * directly from Excel before saving.
     */
    let freshDigitizing:
      Digitizing[] = [];

    try {
      const response =
        await fetch(
          "/api/excel?sheet=Digitizing",
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to validate Digitizing."
        );
      }

      freshDigitizing =
        Array.isArray(data.rows)
          ? data.rows.map(
              normalizeDigitizing
            )
          : [];
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to validate Digitizing."
      );

      return;
    }

    const digitizing =
      freshDigitizing.find(
        (item) =>
          item.id ===
          form.digitizingId
      );

    if (!digitizing) {
      alert(
        "Selected Digitizing record does not exist."
      );

      return;
    }

    if (
      !editing &&
      digitizing.status !==
        "Completed"
    ) {
      alert(
        "Only completed Digitizing jobs can move to Production."
      );

      await loadCompletedDigitizing();

      return;
    }

    try {
      setSaving(true);

      const record = {
        orderId:
          digitizing.orderId,

        orderNumber:
          digitizing.orderNumber,

        customerId:
          digitizing.customerId,

        customerName:
          digitizing.customerName,

        digitizingId:
          digitizing.id,

        designName:
          digitizing.designName,

        status:
          form.status,

        machineName:
          form.machineName,

        operatorName:
          form.operatorName.trim(),

        productionQuantity:
          Number(
            form.productionQuantity
          ),

        stitchCount:
          Number(
            form.stitchCount
          ),

        embroideryWidthMm:
          Number(
            form.embroideryWidthMm
          ),

        embroideryHeightMm:
          Number(
            form.embroideryHeightMm
          ),

        hoopSize:
          form.hoopSize,

        colourCount:
          Number(
            form.colourCount
          ),

        threadType:
          form.threadType,

        needleType:
          form.needleType,

        machineSpeed:
          Number(
            form.machineSpeed
          ),

        placement:
          form.placement,

        sampleApproved:
          form.sampleApproved,

        sampleApprovedBy:
          form.sampleApprovedBy.trim(),

        startDate:
          form.startDate,

        startTime:
          form.startTime,

        completedDate:
          form.status ===
          "Completed"
            ? form.completedDate
            : "",

        completedTime:
          form.status ===
          "Completed"
            ? form.completedTime
            : "",

        rejectedQuantity:
          Number(
            form.rejectedQuantity
          ),

        reworkQuantity:
          Number(
            form.reworkQuantity
          ),

        notes:
          form.notes.trim(),
      };

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
              JSON.stringify({
                action: editing
                  ? "update"
                  : "add",

                sheet:
                  "Production",

                ...(editing
                  ? {
                      id:
                        editing.id,
                    }
                  : {}),

                record: editing
                  ? {
                      ...editing,
                      ...record,
                    }
                  : {
                      id:
                        generateId(),

                      ...record,

                      createdAt:
                        new Date().toISOString(),
                    },
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to save Production."
        );
      }

      /*
       * Update the linked Order status.
       *
       * Production in progress:
       * Order -> Production
       *
       * Production completed:
       * Order -> Quality Control
       */
      try {
        const orderResponse =
          await fetch(
            "/api/excel?sheet=Orders",
            {
              cache: "no-store",
            }
          );

        const orderData =
          await orderResponse.json();

        if (
          orderResponse.ok &&
          orderData.success &&
          Array.isArray(
            orderData.rows
          )
        ) {
          const order =
            orderData.rows.find(
              (row: any) =>
                String(
                  row?.id ?? ""
                ).trim() ===
                digitizing.orderId
            );

          if (order) {
            const orderStatus =
              form.status ===
              "Completed"
                ? "Quality Control"
                : "Production";

            const updateResponse =
              await fetch(
                "/api/excel",
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body:
                    JSON.stringify({
                      action:
                        "update",

                      sheet:
                        "Orders",

                      id:
                        order.id,

                      record: {
                        ...order,

                        status:
                          orderStatus,
                      },
                    }),
                }
              );

            const updateData =
              await updateResponse.json();

            if (
              !updateResponse.ok ||
              !updateData.success
            ) {
              console.error(
                "Order workflow update failed:",
                updateData
              );
            }
          }
        }
      } catch (orderError) {
        console.error(
          "Order status update error:",
          orderError
        );
      }

      closeForm();

      await reload();
    } catch (error) {
      console.error(
        "Production save error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to save Production."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduction(
    job: Production
  ) {
    if (
      !confirm(
        `Delete Production job for ${job.orderNumber} - ${job.designName}?`
      )
    ) {
      return;
    }

    try {
      setSaving(true);

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
              JSON.stringify({
                action:
                  "delete",

                sheet:
                  "Production",

                id:
                  job.id,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to delete Production."
        );
      }

      await reload();
    } catch (error) {
      console.error(
        "Production delete error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete Production."
      );
    } finally {
      setSaving(false);
    }
  }

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return productionJobs;
      }

      return productionJobs.filter(
        (job) =>
          [
            job.orderNumber,
            job.customerName,
            job.designName,
            job.machineName,
            job.operatorName,
            job.status,
            job.placement,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)
      );
    }, [
      productionJobs,
      search,
    ]);

  const activeCount =
    productionJobs.filter(
      (job) =>
        job.status ===
        "In Production"
    ).length;

  const completedCount =
    productionJobs.filter(
      (job) =>
        job.status ===
        "Completed"
    ).length;

  const totalProductionQuantity =
    productionJobs.reduce(
      (sum, job) =>
        sum +
        Number(
          job.productionQuantity ||
            0
        ),
      0
    );

  return (
    /*
     * PAGE SCROLLBAR
     *
     * overflow-y-auto gives the Production page
     * its own vertical scrollbar when content is
     * taller than the screen.
     */
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-1 pb-24 pr-2">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-black">
              Production
            </h1>

            <p className="mt-1 max-w-4xl text-sm text-slate-500">
              Record machine, operator,
              stitches, embroidery size,
              hoop, thread, production
              quantity and sample approval
              before Quality Control.
            </p>
          </div>

          <button
            onClick={
              openCreate
            }
            className="shrink-0 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
          >
            + New Production Job
          </button>
        </div>

        {/* SUMMARY */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Ready Digitizing"
            value={String(
              availableDigitizing.length
            )}
            caption="Completed Digitizing waiting for Production"
          />

          <StatCard
            label="In Production"
            value={String(
              activeCount
            )}
            caption="Jobs currently running"
          />

          <StatCard
            label="Completed"
            value={String(
              completedCount
            )}
            caption="Jobs ready for Quality Control"
          />

          <StatCard
            label="Production Quantity"
            value={String(
              totalProductionQuantity
            )}
            caption="Total quantity across Production jobs"
          />
        </div>

        {/* SEARCH */}

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search order, customer, design, machine, operator or status..."
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        {/* TABLE */}

        <div className="rounded-2xl border bg-white shadow-sm">
          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading Production...
            </div>
          ) : filtered.length ===
            0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl">
                🧵
              </div>

              <h2 className="mt-3 text-lg font-bold">
                No Production jobs
                found
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Completed Digitizing
                jobs can be moved into
                Production.
              </p>
            </div>
          ) : (
            /*
             * HORIZONTAL TABLE SCROLLBAR
             *
             * The Production table has many columns.
             * This allows left/right scrolling without
             * breaking the whole page layout.
             */
            <div className="w-full overflow-x-auto">
              <table className="min-w-[1250px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                    <th className="whitespace-nowrap px-4 py-4">
                      Order
                    </th>

                    <th className="whitespace-nowrap px-4 py-4">
                      Customer
                    </th>

                    <th className="whitespace-nowrap px-4 py-4">
                      Design
                    </th>

                    <th className="whitespace-nowrap px-4 py-4">
                      Machine
                    </th>

                    <th className="whitespace-nowrap px-4 py-4">
                      Operator
                    </th>

                    <th className="whitespace-nowrap px-4 py-4">
                      Qty
                    </th>

                    <th className="whitespace-nowrap px-4 py-4">
                      Stitches
                    </th>

                    <th className="whitespace-nowrap px-4 py-4">
                      Size
                    </th>

                    <th className="whitespace-nowrap px-4 py-4">
                      Status
                    </th>

                    <th className="whitespace-nowrap px-4 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map(
                    (job) => (
                      <tr
                        key={
                          job.id
                        }
                        className="border-b last:border-0 hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-4 py-4 font-bold">
                          {
                            job.orderNumber
                          }
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {
                            job.customerName ||
                            "—"
                          }
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {
                            job.designName ||
                            "—"
                          }
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {
                            job.machineName ||
                            "—"
                          }
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {
                            job.operatorName ||
                            "—"
                          }
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-bold">
                          {
                            job.productionQuantity
                          }
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {
                            job.stitchCount
                          }
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {
                            job.embroideryWidthMm
                          }
                          ×
                          {
                            job.embroideryHeightMm
                          }{" "}
                          mm
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              job.status ===
                              "Completed"
                                ? "bg-green-100 text-green-700"
                                : job.status ===
                                  "In Production"
                                ? "bg-blue-100 text-blue-700"
                                : job.status ===
                                  "On Hold"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {
                              job.status
                            }
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                openEdit(
                                  job
                                )
                              }
                              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                deleteProduction(
                                  job
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

      {/* CREATE / EDIT PRODUCTION MODAL */}

      {showForm && (
        /*
         * MODAL OUTER SCROLL
         *
         * overflow-y-auto here ensures the modal
         * remains usable even on short screens.
         */
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">

            {/*
             * MODAL CONTAINER
             *
             * max-h gives the modal a fixed maximum
             * height relative to the screen.
             *
             * flex-col + overflow-hidden lets only
             * the form body scroll while header and
             * Save/Cancel remain visible.
             */}
            <div className="my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:my-6 sm:max-h-[calc(100vh-3rem)]">

              {/* STICKY MODAL HEADER */}

              <div className="flex shrink-0 items-start justify-between border-b bg-white px-5 py-5 sm:px-6">
                <div>
                  <h2 className="text-2xl font-black">
                    {editing
                      ? "Edit Production Job"
                      : "New Production Job"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Capture technical
                    embroidery production
                    information.
                  </p>
                </div>

                <button
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  className="ml-4 rounded-lg px-2 text-3xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              {/*
               * SCROLLABLE FORM BODY
               *
               * THIS is the main scrollbar requested.
               * Header and bottom buttons remain visible.
               */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 pr-3 sm:px-6 sm:pr-4">

                <div className="space-y-7 pr-1">

                  {/* DIGITIZING LINK */}

                  <Field
                    label="Completed Digitizing *"
                    caption="Only Digitizing jobs with status Completed are available for new Production jobs."
                  >
                    <select
                      value={
                        form.digitizingId
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,

                          digitizingId:
                            e.target
                              .value,
                        })
                      }
                      disabled={
                        Boolean(
                          editing
                        ) ||
                        loadingDigitizing
                      }
                      className="w-full rounded-xl border bg-white px-4 py-3 disabled:bg-slate-100"
                    >
                      <option value="">
                        {loadingDigitizing
                          ? "Loading completed Digitizing..."
                          : "Select Completed Digitizing"}
                      </option>

                      {availableDigitizing.map(
                        (job) => (
                          <option
                            key={
                              job.id
                            }
                            value={
                              job.id
                            }
                          >
                            {
                              job.orderNumber
                            }
                            {" — "}
                            {
                              job.customerName
                            }
                            {" — "}
                            {
                              job.designName
                            }
                          </option>
                        )
                      )}
                    </select>
                  </Field>

                  {/* SELECTED LINK DETAILS */}

                  {selectedDigitizing && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <div className="text-xs font-bold uppercase text-blue-600">
                        Selected
                        Digitizing Job
                      </div>

                      <div className="mt-3 grid gap-4 sm:grid-cols-3">
                        <Info
                          label="Order"
                          value={
                            selectedDigitizing.orderNumber
                          }
                        />

                        <Info
                          label="Customer"
                          value={
                            selectedDigitizing.customerName
                          }
                        />

                        <Info
                          label="Design"
                          value={
                            selectedDigitizing.designName
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* MACHINE */}

                  <Section
                    title="Machine & Operator"
                    description="Machine assignment and person responsible for the embroidery run."
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field
                        label="Embroidery Machine *"
                        caption="Machine or head group assigned to this production run."
                      >
                        <select
                          value={
                            form.machineName
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              machineName:
                                e.target
                                  .value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >
                          <option value="">
                            Select
                            Machine
                          </option>

                          {MACHINE_NAMES.map(
                            (
                              machine
                            ) => (
                              <option
                                key={
                                  machine
                                }
                                value={
                                  machine
                                }
                              >
                                {
                                  machine
                                }
                              </option>
                            )
                          )}
                        </select>
                      </Field>

                      <Field
                        label="Operator Name *"
                        caption="Person responsible for running this embroidery production."
                      >
                        <input
                          value={
                            form.operatorName
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              operatorName:
                                e.target
                                  .value,
                            })
                          }
                          placeholder="Machine operator"
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>
                    </div>
                  </Section>

                  {/* PRODUCTION QUANTITY */}

                  <Section
                    title="Production Details"
                    description="Quantity, stitch count and machine running speed."
                  >
                    <div className="grid gap-5 md:grid-cols-3">
                      <Field
                        label="Production Quantity *"
                        caption="Total pieces planned for this production run."
                      >
                        <input
                          type="number"
                          min="1"
                          value={
                            form.productionQuantity
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              productionQuantity:
                                Number(
                                  e.target
                                    .value
                                ),
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field
                        label="Stitch Count *"
                        caption="Number of embroidery stitches per piece from the digitized file."
                      >
                        <input
                          type="number"
                          min="1"
                          value={
                            form.stitchCount
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              stitchCount:
                                Number(
                                  e.target
                                    .value
                                ),
                            })
                          }
                          placeholder="e.g. 8500"
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field
                        label="Machine Speed (SPM)"
                        caption="Planned running speed in stitches per minute."
                      >
                        <input
                          type="number"
                          min="100"
                          max="1500"
                          value={
                            form.machineSpeed
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              machineSpeed:
                                Number(
                                  e.target
                                    .value
                                ),
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>
                    </div>
                  </Section>

                  {/* SIZE */}

                  <Section
                    title="Embroidery Size & Hoop"
                    description="Finished design dimensions and frame used on the machine."
                  >
                    <div className="grid gap-5 md:grid-cols-3">
                      <Field
                        label="Embroidery Width (mm) *"
                        caption="Finished width of the embroidery design."
                      >
                        <input
                          type="number"
                          min="1"
                          step="0.1"
                          value={
                            form.embroideryWidthMm
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              embroideryWidthMm:
                                Number(
                                  e.target
                                    .value
                                ),
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field
                        label="Embroidery Height (mm) *"
                        caption="Finished height of the embroidery design."
                      >
                        <input
                          type="number"
                          min="1"
                          step="0.1"
                          value={
                            form.embroideryHeightMm
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              embroideryHeightMm:
                                Number(
                                  e.target
                                    .value
                                ),
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field
                        label="Hoop / Frame Size *"
                        caption="Hoop or frame used to hold the garment during embroidery."
                      >
                        <select
                          value={
                            form.hoopSize
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              hoopSize:
                                e.target
                                  .value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >
                          <option value="">
                            Select Hoop
                          </option>

                          {HOOP_SIZES.map(
                            (
                              hoop
                            ) => (
                              <option
                                key={
                                  hoop
                                }
                                value={
                                  hoop
                                }
                              >
                                {
                                  hoop
                                }
                              </option>
                            )
                          )}
                        </select>
                      </Field>
                    </div>
                  </Section>

                  {/* THREAD / NEEDLE */}

                  <Section
                    title="Thread, Needle & Placement"
                    description="Embroidery materials and garment position."
                  >
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      <Field
                        label="No. of Colours *"
                        caption="Number of thread colours used in the design."
                      >
                        <input
                          type="number"
                          min="1"
                          value={
                            form.colourCount
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              colourCount:
                                Number(
                                  e.target
                                    .value
                                ),
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field
                        label="Thread Type"
                        caption="Primary embroidery thread used for the job."
                      >
                        <select
                          value={
                            form.threadType
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              threadType:
                                e.target
                                  .value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >
                          {THREAD_TYPES.map(
                            (
                              thread
                            ) => (
                              <option
                                key={
                                  thread
                                }
                                value={
                                  thread
                                }
                              >
                                {
                                  thread
                                }
                              </option>
                            )
                          )}
                        </select>
                      </Field>

                      <Field
                        label="Needle Type"
                        caption="Needle size/type selected for the fabric and thread."
                      >
                        <select
                          value={
                            form.needleType
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              needleType:
                                e.target
                                  .value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >
                          {NEEDLE_TYPES.map(
                            (
                              needle
                            ) => (
                              <option
                                key={
                                  needle
                                }
                                value={
                                  needle
                                }
                              >
                                {
                                  needle
                                }
                              </option>
                            )
                          )}
                        </select>
                      </Field>

                      <Field
                        label="Placement *"
                        caption="Position where the embroidery is applied."
                      >
                        <select
                          value={
                            form.placement
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              placement:
                                e.target
                                  .value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >
                          <option value="">
                            Select
                            Placement
                          </option>

                          {PLACEMENTS.map(
                            (
                              placement
                            ) => (
                              <option
                                key={
                                  placement
                                }
                                value={
                                  placement
                                }
                              >
                                {
                                  placement
                                }
                              </option>
                            )
                          )}
                        </select>
                      </Field>
                    </div>
                  </Section>

                  {/* SAMPLE APPROVAL */}

                  <Section
                    title="Sample Approval"
                    description="Approval should be recorded before starting bulk embroidery production."
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field
                        label="Sample Approved?"
                        caption="Bulk Production should normally start only after the embroidery sample is approved."
                      >
                        <select
                          value={
                            form.sampleApproved
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              sampleApproved:
                                e.target
                                  .value,

                              sampleApprovedBy:
                                e.target
                                  .value ===
                                "No"
                                  ? ""
                                  : form.sampleApprovedBy,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >
                          <option value="No">
                            No
                          </option>

                          <option value="Yes">
                            Yes
                          </option>
                        </select>
                      </Field>

                      <Field
                        label="Sample Approved By"
                        caption="Customer, supervisor or authorised person who approved the embroidery sample."
                      >
                        <input
                          value={
                            form.sampleApprovedBy
                          }
                          disabled={
                            form.sampleApproved !==
                            "Yes"
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              sampleApprovedBy:
                                e.target
                                  .value,
                            })
                          }
                          placeholder="Approved by"
                          className="w-full rounded-xl border px-4 py-3 disabled:bg-slate-100"
                        />
                      </Field>
                    </div>
                  </Section>

                  {/* DATES */}

                  <Section
                    title="Production Timing"
                    description="Actual production start and completion date/time."
                  >
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      <Field
                        label="Start Date"
                        caption="Date embroidery production started."
                      >
                        <input
                          type="date"
                          value={
                            form.startDate
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              startDate:
                                e.target
                                  .value,
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field
                        label="Start Time"
                        caption="Time the production run started."
                      >
                        <input
                          type="time"
                          value={
                            form.startTime
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              startTime:
                                e.target
                                  .value,
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field
                        label="Completed Date"
                        caption="Required when Production Status is Completed."
                      >
                        <input
                          type="date"
                          value={
                            form.completedDate
                          }
                          min={
                            form.startDate ||
                            undefined
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              completedDate:
                                e.target
                                  .value,
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field
                        label="Completed Time"
                        caption="Time the production run was completed."
                      >
                        <input
                          type="time"
                          value={
                            form.completedTime
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              completedTime:
                                e.target
                                  .value,
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>
                    </div>
                  </Section>

                  {/* QUALITY COUNTS */}

                  <Section
                    title="Production Exceptions"
                    description="Track pieces rejected or requiring rework before Quality Control."
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field
                        label="Rejected Quantity"
                        caption="Pieces rejected during Production before QC."
                      >
                        <input
                          type="number"
                          min="0"
                          value={
                            form.rejectedQuantity
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              rejectedQuantity:
                                Number(
                                  e.target
                                    .value
                                ),
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field
                        label="Rework Quantity"
                        caption="Pieces requiring correction or re-embroidery."
                      >
                        <input
                          type="number"
                          min="0"
                          value={
                            form.reworkQuantity
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              reworkQuantity:
                                Number(
                                  e.target
                                    .value
                                ),
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>
                    </div>
                  </Section>

                  {/* STATUS */}

                  <Section
                    title="Workflow Status"
                    description="Completed Production moves the linked Order toward Quality Control."
                  >
                    <Field
                      label="Production Status"
                      caption="Set Completed only when the embroidery production run has finished."
                    >
                      <select
                        value={
                          form.status
                        }
                        onChange={(e) => {
                          const newStatus =
                            e.target
                              .value;

                          setForm(
                            (
                              old
                            ) => ({
                              ...old,

                              status:
                                newStatus,

                              completedDate:
                                newStatus ===
                                  "Completed"
                                  ? old.completedDate ||
                                    getToday()
                                  : "",

                              completedTime:
                                newStatus ===
                                  "Completed"
                                  ? old.completedTime
                                  : "",
                            })
                          );
                        }}
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      >
                        {PRODUCTION_STATUSES.map(
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
                              {
                                status
                              }
                            </option>
                          )
                        )}
                      </select>
                    </Field>
                  </Section>

                  {/* NOTES */}

                  <Section
                    title="Production Notes"
                    description="Record machine or embroidery-specific observations for future reference."
                  >
                    <Field
                      label="Notes"
                      caption="Thread breaks, registration issues, backing, topping, tension, machine stoppage or special embroidery instructions."
                    >
                      <textarea
                        value={
                          form.notes
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,

                            notes:
                              e.target
                                .value,
                          })
                        }
                        placeholder="Example: Use 2 layers cut-away backing, reduce speed to 650 SPM for small lettering..."
                        className="min-h-32 w-full resize-y rounded-xl border px-4 py-3"
                      />
                    </Field>
                  </Section>

                  {/*
                   * Extra space at bottom means the last
                   * field is never hidden behind the
                   * sticky action bar.
                   */}
                  <div className="h-4" />
                </div>
              </div>

              {/* STICKY MODAL FOOTER */}

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border px-5 py-3 font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    saveProduction
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update Production"
                    : "Create Production"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
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
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-slate-50/50 p-4 sm:p-5">
      <div className="mb-5">
        <h3 className="text-base font-black text-slate-900">
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
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-xs text-slate-500">
        {label}
      </div>

      <div className="mt-1 break-words font-bold">
        {value || "—"}
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

      <div className="mt-1 text-xs leading-5 text-slate-400">
        {caption}
      </div>
    </div>
  );
}
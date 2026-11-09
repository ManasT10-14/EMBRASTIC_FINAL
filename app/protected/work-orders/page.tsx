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

type Customer = {
  id: string;
  name: string;
  businessName: string;
};

type OrderItem = {
  id: string;
  itemType: string;
  description: string;
  designName: string;
  embroideryService: string;
  placement: string;
  color: string;
  size: string;
  quantity: number;
  unit: string;
  customerSku: string;
  unitPrice: number;
};

type Order = {
  id: string;
  orderNumber: string;

  customerId: string;
  customerName: string;

  customerPoNumber: string;

  orderDate: string;
  deliveryDate: string;

  priority: string;
  orderSource: string;

  status: string;

  items: string;
  orderItems: string;

  totalQuantity: number;

  notes: string;

  createdAt: string;

  [key: string]: any;
};

type Digitizing = {
  id: string;
  digitizingNumber: string;

  orderId: string;
  orderNumber: string;

  customerId: string;
  customerName: string;

  designName: string;

  stitchCount: number;

  designWidth: number;
  designHeight: number;

  width: number;
  height: number;

  placement: string;

  colorCount: number;
  colourCount: number;

  threadColors: string;
  threadColours: string;

  fileFormat: string;
  machineFormat: string;

  status: string;

  createdAt: string;

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

  [key: string]: any;
};

type WorkOrderForm = {
  orderId: string;
  orderItemId: string;

  digitizingId: string;

  productionQuantity: number;

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
};

/* =========================================================
   OPTIONS
========================================================= */

const WORK_ORDER_STATUSES = [
  "Draft",
  "Released",
  "Ready for Production",
  "In Production",
  "On Hold",
  "Completed",
  "Cancelled",
];

const PRIORITIES = [
  "Normal",
  "High",
  "Urgent",
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

const BACKING_TYPES = [
  "None",
  "Cut-Away",
  "Tear-Away",
  "No-Show Mesh",
  "Water-Soluble",
  "Heat-Away",
  "Fusible Backing",
  "Cap Backing",
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
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 10)}`;
}

/*
 * Only called after mount or in user actions.
 */
function getToday() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

function addDays(
  date: string,
  days: number
) {
  if (!date) {
    return "";
  }

  const parsed =
    new Date(
      `${date}T00:00:00`
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
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

function emptyForm(): WorkOrderForm {
  return {
    orderId: "",
    orderItemId: "",

    digitizingId: "",

    productionQuantity: 0,

    machineName: "",
    operatorName: "",

    hoopSize: "",
    threadType: "Polyester",
    needleType: "75/11",

    backingType: "Cut-Away",
    toppingRequired: "No",

    machineSpeed: 700,

    sampleRequired: "Yes",
    sampleApproved: "No",
    sampleApprovedBy: "",

    plannedStartDate: "",
    targetCompletionDate: "",

    priority: "Normal",
    status: "Draft",

    packingInstructions: "",
    productionInstructions: "",
    notes: "",
  };
}

function parseOrderItems(
  value: unknown
): OrderItem[] {
  if (
    Array.isArray(value)
  ) {
    return value.map(
      normalizeOrderItem
    );
  }

  const text =
    clean(value);

  if (!text) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(text);

    if (
      Array.isArray(parsed)
    ) {
      return parsed.map(
        normalizeOrderItem
      );
    }
  } catch {
    //
  }

  return [
    {
      id:
        generateId(),

      itemType:
        "Other",

      description:
        text,

      designName:
        "",

      embroideryService:
        "Logo Embroidery",

      placement:
        "Left Chest",

      color:
        "",

      size:
        "",

      quantity:
        1,

      unit:
        "pcs",

      customerSku:
        "",

      unitPrice:
        0,
    },
  ];
}

function normalizeOrderItem(
  row: any
): OrderItem {
  return {
    id:
      clean(
        row?.id
      ) ||
      generateId(),

    itemType:
      clean(
        row?.itemType ??
          row?.type
      ) ||
      "Other",

    description:
      clean(
        row?.description ??
          row?.item ??
          row?.name
      ),

    designName:
      clean(
        row?.designName
      ),

    embroideryService:
      clean(
        row?.embroideryService ??
          row?.service
      ) ||
      "Logo Embroidery",

    placement:
      clean(
        row?.placement
      ) ||
      "Left Chest",

    color:
      clean(
        row?.color ??
          row?.colour
      ),

    size:
      clean(
        row?.size
      ),

    quantity:
      numberValue(
        row?.quantity
      ) ||
      1,

    unit:
      clean(
        row?.unit
      ) ||
      "pcs",

    customerSku:
      clean(
        row?.customerSku ??
          row?.customerSKU
      ),

    unitPrice:
      numberValue(
        row?.unitPrice ??
          row?.rate ??
          row?.price
      ),
  };
}

function normalizeOrder(
  row: any
): Order {
  const orderItems =
    clean(
      row?.orderItems ??
        row?.items
    );

  const parsedItems =
    parseOrderItems(
      orderItems
    );

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

    customerPoNumber:
      clean(
        row?.customerPoNumber ??
          row?.customerPO ??
          row?.poNumber
      ),

    orderDate:
      clean(
        row?.orderDate
      ).split("T")[0],

    deliveryDate:
      clean(
        row?.deliveryDate
      ).split("T")[0],

    priority:
      clean(
        row?.priority
      ) ||
      "Normal",

    orderSource:
      clean(
        row?.orderSource
      ) ||
      "Direct",

    status:
      clean(
        row?.status
      ) ||
      "Pending",

    items:
      clean(
        row?.items
      ),

    orderItems:
      orderItems,

    totalQuantity:
      numberValue(
        row?.totalQuantity
      ) ||
      parsedItems.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.quantity || 0
          ),
        0
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

function normalizeDigitizing(
  row: any
): Digitizing {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    digitizingNumber:
      clean(
        row?.digitizingNumber ??
          row?.digitisingNumber
      ),

    orderId:
      clean(
        row?.orderId
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

    designName:
      clean(
        row?.designName
      ),

    stitchCount:
      numberValue(
        row?.stitchCount ??
          row?.stitches
      ),

    designWidth:
      numberValue(
        row?.designWidth ??
          row?.width
      ),

    designHeight:
      numberValue(
        row?.designHeight ??
          row?.height
      ),

    width:
      numberValue(
        row?.width ??
          row?.designWidth
      ),

    height:
      numberValue(
        row?.height ??
          row?.designHeight
      ),

    placement:
      clean(
        row?.placement
      ),

    colorCount:
      numberValue(
        row?.colorCount ??
          row?.colourCount
      ),

    colourCount:
      numberValue(
        row?.colourCount ??
          row?.colorCount
      ),

    threadColors:
      clean(
        row?.threadColors ??
          row?.threadColours
      ),

    threadColours:
      clean(
        row?.threadColours ??
          row?.threadColors
      ),

    fileFormat:
      clean(
        row?.fileFormat ??
          row?.machineFormat
      ),

    machineFormat:
      clean(
        row?.machineFormat ??
          row?.fileFormat
      ),

    status:
      clean(
        row?.status
      ),

    createdAt:
      clean(
        row?.createdAt
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
        row?.workOrderNumber ??
          row?.jobCardNumber
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

    customerPoNumber:
      clean(
        row?.customerPoNumber
      ),

    digitizingId:
      clean(
        row?.digitizingId
      ),

    digitizingNumber:
      clean(
        row?.digitizingNumber
      ),

    itemType:
      clean(
        row?.itemType
      ),

    itemDescription:
      clean(
        row?.itemDescription
      ),

    designName:
      clean(
        row?.designName
      ),

    embroideryService:
      clean(
        row?.embroideryService
      ),

    placement:
      clean(
        row?.placement
      ),

    garmentColor:
      clean(
        row?.garmentColor
      ),

    garmentSize:
      clean(
        row?.garmentSize
      ),

    orderedQuantity:
      numberValue(
        row?.orderedQuantity
      ),

    productionQuantity:
      numberValue(
        row?.productionQuantity
      ),

    unit:
      clean(
        row?.unit
      ) ||
      "pcs",

    stitchCount:
      numberValue(
        row?.stitchCount
      ),

    embroideryWidthMm:
      numberValue(
        row?.embroideryWidthMm
      ),

    embroideryHeightMm:
      numberValue(
        row?.embroideryHeightMm
      ),

    colourCount:
      numberValue(
        row?.colourCount
      ),

    threadColors:
      clean(
        row?.threadColors
      ),

    fileFormat:
      clean(
        row?.fileFormat
      ),

    machineName:
      clean(
        row?.machineName
      ),

    operatorName:
      clean(
        row?.operatorName
      ),

    hoopSize:
      clean(
        row?.hoopSize
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
      ) ||
      "No",

    machineSpeed:
      numberValue(
        row?.machineSpeed
      ),

    sampleRequired:
      clean(
        row?.sampleRequired
      ) ||
      "Yes",

    sampleApproved:
      clean(
        row?.sampleApproved
      ) ||
      "No",

    sampleApprovedBy:
      clean(
        row?.sampleApprovedBy
      ),

    plannedStartDate:
      clean(
        row?.plannedStartDate
      ).split("T")[0],

    targetCompletionDate:
      clean(
        row?.targetCompletionDate
      ).split("T")[0],

    priority:
      clean(
        row?.priority
      ) ||
      "Normal",

    status:
      clean(
        row?.status
      ) ||
      "Draft",

    packingInstructions:
      clean(
        row?.packingInstructions
      ),

    productionInstructions:
      clean(
        row?.productionInstructions
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
   PAGE
========================================================= */

export default function WorkOrdersPage() {
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
    digitizingRows,
    setDigitizingRows,
  ] =
    useState<Digitizing[]>(
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
    search,
    setSearch,
  ] =
    useState("");

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
    useState(false);

  const [
    editing,
    setEditing,
  ] =
    useState<WorkOrder | null>(
      null
    );

  const [
    viewing,
    setViewing,
  ] =
    useState<WorkOrder | null>(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<WorkOrderForm>(
      emptyForm()
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadData();
  }, []);

  /* =======================================================
     BODY LOCK
  ======================================================= */

  useEffect(() => {
    if (
      !showForm &&
      !viewing
    ) {
      return;
    }

    const previous =
      document.body
        .style.overflow;

    document.body
      .style.overflow =
      "hidden";

    return () => {
      document.body
        .style.overflow =
        previous;
    };
  }, [
    showForm,
    viewing,
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
        "Work Order Excel request failed:",
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

  async function loadData(
    silent = false
  ) {
    try {
      if (silent) {
        setRefreshing(
          true
        );
      } else {
        setLoading(
          true
        );
      }

      const [
        orderRows,
        customerRows,
        digitizingData,
        workOrderRows,
        settings,
      ] =
        await Promise.all([
          loadSheet(
            "Orders"
          ),

          loadSheet(
            "Customers"
          ),

          loadSheet(
            "Digitizing"
          ),

          loadSheet(
            "WorkOrders"
          ),

          loadAppSettings(),
        ]);

      setOrders(
        orderRows
          .map(
            normalizeOrder
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
              a.orderNumber.localeCompare(
                b.orderNumber
              )
          )
      );

      setCustomers(
        customerRows
          .map(
            (
              row: any
            ): Customer => ({
              id:
                clean(
                  row?.id
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
            })
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

      setDigitizingRows(
        digitizingData
          .map(
            normalizeDigitizing
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

      setWorkOrders(
        workOrderRows
          .map(
            normalizeWorkOrder
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
        "Work Orders load error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load Work Orders."
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
     SELECTED REFERENCES
  ======================================================= */

  const selectedOrder =
    useMemo(
      () =>
        orders.find(
          (
            row
          ) =>
            row.id ===
            form.orderId
        ),
      [
        orders,
        form.orderId,
      ]
    );

  const selectedOrderItems =
    useMemo(
      () =>
        selectedOrder
          ? parseOrderItems(
              selectedOrder.orderItems ||
                selectedOrder.items
            )
          : [],
      [
        selectedOrder,
      ]
    );

  const selectedOrderItem =
    useMemo(
      () =>
        selectedOrderItems.find(
          (
            row
          ) =>
            row.id ===
            form.orderItemId
        ),
      [
        selectedOrderItems,
        form.orderItemId,
      ]
    );

  const eligibleDigitizing =
    useMemo(() => {
      if (
        !selectedOrder
      ) {
        return [];
      }

      return digitizingRows
        .filter(
          (
            row
          ) =>
            (
              row.orderId &&
              row.orderId ===
                selectedOrder.id
            ) ||
            (
              row.orderNumber &&
              row.orderNumber ===
                selectedOrder.orderNumber
            )
        )
        .filter(
          (
            row
          ) => {
            const status =
              normalizeText(
                row.status
              );

            return ![
              "cancelled",
              "rejected",
            ].includes(
              status
            );
          }
        )
        .sort(
          (
            a,
            b
          ) =>
            a.designName.localeCompare(
              b.designName
            )
        );
    }, [
      selectedOrder,
      digitizingRows,
    ]);

  const selectedDigitizing =
    useMemo(
      () =>
        digitizingRows.find(
          (
            row
          ) =>
            row.id ===
            form.digitizingId
        ),
      [
        digitizingRows,
        form.digitizingId,
      ]
    );

  const selectedCustomer =
    useMemo(
      () =>
        customers.find(
          (
            row
          ) =>
            row.id ===
            selectedOrder?.customerId
        ),
      [
        customers,
        selectedOrder,
      ]
    );

  /* =======================================================
     ELIGIBLE ORDERS
  ======================================================= */

  const eligibleOrders =
    useMemo(
      () =>
        orders.filter(
          (
            order
          ) =>
            ![
              "cancelled",
              "completed",
              "delivered",
              "closed",
              "paid",
            ].includes(
              normalizeText(
                order.status
              )
            )
        ),
      [
        orders,
      ]
    );

  /* =======================================================
     NUMBER
  ======================================================= */

  function nextWorkOrderNumber(
    year: number
  ) {
    const prefix =
      `WO-${year}-`;

    let max = 0;

    workOrders.forEach(
      (
        row
      ) => {
        if (
          !row.workOrderNumber.startsWith(
            prefix
          )
        ) {
          return;
        }

        const match =
          row.workOrderNumber.match(
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

    return `${prefix}${String(
      max + 1
    ).padStart(
      4,
      "0"
    )}`;
  }

  /* =======================================================
     FORM
  ======================================================= */

  async function openCreateForm() {
    const settings =
      await loadAppSettings();

    setAppSettings(
      settings
    );

    const today =
      getToday();

    const settingBag =
      settings as any;

    setEditing(
      null
    );

    setForm({
      ...emptyForm(),

      machineName:
        clean(
          settingBag.defaultMachine ??
            settingBag.defaultEmbroideryMachine
        ),

      machineSpeed:
        Number(
          settingBag.defaultMachineSpeed ??
            700
        ),

      threadType:
        clean(
          settingBag.defaultThreadType
        ) ||
        "Polyester",

      needleType:
        clean(
          settingBag.defaultNeedleType
        ) ||
        "75/11",

      plannedStartDate:
        today,

      targetCompletionDate:
        addDays(
          today,
          2
        ),
    });

    setShowForm(
      true
    );
  }

  function openEditForm(
    row: WorkOrder
  ) {
    setEditing(
      row
    );

    setForm({
      orderId:
        row.orderId,

      orderItemId:
        row.orderItemId,

      digitizingId:
        row.digitizingId,

      productionQuantity:
        row.productionQuantity,

      machineName:
        row.machineName,

      operatorName:
        row.operatorName,

      hoopSize:
        row.hoopSize,

      threadType:
        row.threadType ||
        "Polyester",

      needleType:
        row.needleType ||
        "75/11",

      backingType:
        row.backingType ||
        "Cut-Away",

      toppingRequired:
        row.toppingRequired ||
        "No",

      machineSpeed:
        row.machineSpeed ||
        700,

      sampleRequired:
        row.sampleRequired ||
        "Yes",

      sampleApproved:
        row.sampleApproved ||
        "No",

      sampleApprovedBy:
        row.sampleApprovedBy,

      plannedStartDate:
        row.plannedStartDate,

      targetCompletionDate:
        row.targetCompletionDate,

      priority:
        row.priority ||
        "Normal",

      status:
        row.status ||
        "Draft",

      packingInstructions:
        row.packingInstructions,

      productionInstructions:
        row.productionInstructions,

      notes:
        row.notes,
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

  function selectOrder(
    orderId: string
  ) {
    const order =
      orders.find(
        (
          row
        ) =>
          row.id ===
          orderId
      );

    setForm(
      (
        current
      ) => ({
        ...current,

        orderId,

        orderItemId:
          "",

        digitizingId:
          "",

        productionQuantity:
          0,

        priority:
          order?.priority ||
          current.priority,

        targetCompletionDate:
          order?.deliveryDate ||
          current.targetCompletionDate,
      })
    );
  }

  function selectOrderItem(
    orderItemId: string
  ) {
    const item =
      selectedOrderItems.find(
        (
          row
        ) =>
          row.id ===
          orderItemId
      );

    setForm(
      (
        current
      ) => ({
        ...current,

        orderItemId,

        productionQuantity:
          Number(
            item?.quantity ||
              0
          ),
      })
    );
  }

  function selectDigitizing(
    digitizingId: string
  ) {
    const digitizing =
      digitizingRows.find(
        (
          row
        ) =>
          row.id ===
          digitizingId
      );

    setForm(
      (
        current
      ) => ({
        ...current,

        digitizingId,

        /*
         * Keep work-order technical choices editable.
         * The digitizing row is used as the authoritative
         * source for stitch count, size, colour count etc.
         */
        hoopSize:
          current.hoopSize,
      })
    );

    if (
      digitizing &&
      selectedOrderItem &&
      !selectedOrderItem.designName
    ) {
      /*
       * No direct mutation of Order item here.
       * The WorkOrder will still carry digitizing designName.
       */
    }
  }

  /* =======================================================
     SAVE
  ======================================================= */

  function validate() {
    if (
      !selectedOrder
    ) {
      return "Please select an Order.";
    }

    if (
      !selectedOrderItem
    ) {
      return "Please select an Order line item.";
    }

    if (
      Number(
        form.productionQuantity
      ) <= 0
    ) {
      return "Production Quantity must be greater than zero.";
    }

    if (
      Number(
        form.productionQuantity
      ) >
      Number(
        selectedOrderItem.quantity
      )
    ) {
      return `Production Quantity cannot exceed ordered quantity of ${selectedOrderItem.quantity}.`;
    }

    if (
      !form.plannedStartDate
    ) {
      return "Planned Start Date is required.";
    }

    if (
      !form.targetCompletionDate
    ) {
      return "Target Completion Date is required.";
    }

    if (
      form.targetCompletionDate <
      form.plannedStartDate
    ) {
      return "Target Completion Date cannot be before Planned Start Date.";
    }

    if (
      [
        "released",
        "ready for production",
        "in production",
      ].includes(
        normalizeText(
          form.status
        )
      ) &&
      !form.machineName
    ) {
      return "Machine is required before the Work Order is released to Production.";
    }

    return "";
  }

  async function saveWorkOrder() {
    const validation =
      validate();

    if (
      validation
    ) {
      alert(
        validation
      );

      return;
    }

    if (
      !selectedOrder ||
      !selectedOrderItem
    ) {
      return;
    }

    try {
      setSaving(
        true
      );

      const duplicate =
        workOrders.find(
          (
            row
          ) =>
            row.id !==
              editing?.id &&
            row.orderId ===
              selectedOrder.id &&
            row.orderItemId ===
              selectedOrderItem.id &&
            ![
              "cancelled",
            ].includes(
              normalizeText(
                row.status
              )
            )
        );

      if (
        duplicate
      ) {
        throw new Error(
          `A Work Order already exists for this Order item: ${duplicate.workOrderNumber}.`
        );
      }

      const now =
        new Date()
          .toISOString();

      const year =
        Number(
          form.plannedStartDate.slice(
            0,
            4
          )
        );

      const digitizing =
        selectedDigitizing;

      const record = {
        workOrderNumber:
          editing
            ? editing.workOrderNumber
            : nextWorkOrderNumber(
                year
              ),

        orderId:
          selectedOrder.id,

        orderNumber:
          selectedOrder.orderNumber,

        orderItemId:
          selectedOrderItem.id,

        customerId:
          selectedOrder.customerId,

        customerName:
          selectedOrder.customerName ||
          selectedCustomer?.name ||
          selectedCustomer?.businessName ||
          "",

        customerPoNumber:
          selectedOrder.customerPoNumber,

        digitizingId:
          digitizing?.id ||
          "",

        digitizingNumber:
          digitizing?.digitizingNumber ||
          "",

        itemType:
          selectedOrderItem.itemType,

        itemDescription:
          selectedOrderItem.description,

        designName:
          digitizing?.designName ||
          selectedOrderItem.designName,

        embroideryService:
          selectedOrderItem.embroideryService,

        placement:
          digitizing?.placement ||
          selectedOrderItem.placement,

        garmentColor:
          selectedOrderItem.color,

        garmentSize:
          selectedOrderItem.size,

        orderedQuantity:
          Number(
            selectedOrderItem.quantity
          ),

        productionQuantity:
          Number(
            form.productionQuantity
          ),

        unit:
          selectedOrderItem.unit,

        stitchCount:
          Number(
            digitizing?.stitchCount ||
              0
          ),

        embroideryWidthMm:
          Number(
            digitizing?.designWidth ||
              digitizing?.width ||
              0
          ),

        embroideryHeightMm:
          Number(
            digitizing?.designHeight ||
              digitizing?.height ||
              0
          ),

        colourCount:
          Number(
            digitizing?.colourCount ||
              digitizing?.colorCount ||
              0
          ),

        threadColors:
          digitizing?.threadColors ||
          digitizing?.threadColours ||
          "",

        fileFormat:
          digitizing?.machineFormat ||
          digitizing?.fileFormat ||
          "",

        machineName:
          form.machineName,

        operatorName:
          form.operatorName.trim(),

        hoopSize:
          form.hoopSize,

        threadType:
          form.threadType,

        needleType:
          form.needleType,

        backingType:
          form.backingType,

        toppingRequired:
          form.toppingRequired,

        machineSpeed:
          Number(
            form.machineSpeed ||
              0
          ),

        sampleRequired:
          form.sampleRequired,

        sampleApproved:
          form.sampleApproved,

        sampleApprovedBy:
          form.sampleApprovedBy.trim(),

        plannedStartDate:
          form.plannedStartDate,

        targetCompletionDate:
          form.targetCompletionDate,

        priority:
          form.priority,

        status:
          form.status,

        packingInstructions:
          form.packingInstructions.trim(),

        productionInstructions:
          form.productionInstructions.trim(),

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
          "WorkOrders",

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

                createdAt:
                  editing.createdAt ||
                  now,
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
    } catch (
      error
    ) {
      console.error(
        "Work Order save error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to save Work Order."
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

  async function deleteWorkOrder(
    row: WorkOrder
  ) {
    if (
      [
        "in production",
        "completed",
      ].includes(
        normalizeText(
          row.status
        )
      )
    ) {
      alert(
        "A Work Order that is already In Production or Completed should not be deleted. Cancel it or correct the related Production record instead."
      );

      return;
    }

    if (
      !confirm(
        `Delete ${row.workOrderNumber}?`
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
          "WorkOrders",

        id:
          row.id,
      });

      await loadData(
        true
      );
    } catch (
      error
    ) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete Work Order."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     PRINT
  ======================================================= */

  function escapeHtml(
    value: unknown
  ) {
    return String(
      value ?? ""
    )
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );
  }

  function printWorkOrder(
    row: WorkOrder
  ) {
    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1000,height=800"
      );

    if (
      !printWindow
    ) {
      alert(
        "Popup was blocked. Allow popups to print the Job Card."
      );

      return;
    }

    const brand =
      escapeHtml(
        (appSettings as any).brandName ||
          "EMBRASTIC"
      );

    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(
    row.workOrderNumber
  )}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      color: #0f172a;
      background: #ffffff;
    }
    .page {
      width: 100%;
      padding: 28px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 18px;
    }
    .brand {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: .05em;
    }
    .sub {
      color: #64748b;
      font-size: 12px;
      margin-top: 4px;
    }
    .number {
      text-align: right;
    }
    .number strong {
      font-size: 20px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .box {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px;
      min-height: 62px;
    }
    .label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 5px;
    }
    .value {
      font-size: 13px;
      font-weight: 700;
      word-break: break-word;
    }
    h2 {
      font-size: 14px;
      text-transform: uppercase;
      margin: 18px 0 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #cbd5e1;
    }
    .instructions {
      white-space: pre-wrap;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      min-height: 60px;
      font-size: 12px;
    }
    .signatures {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 30px;
      margin-top: 48px;
    }
    .signature {
      border-top: 1px solid #0f172a;
      padding-top: 6px;
      font-size: 11px;
      text-align: center;
    }
    @media print {
      .page { padding: 12mm; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="brand">${brand}</div>
        <div class="sub">Production Work Order / Job Card</div>
      </div>
      <div class="number">
        <strong>${escapeHtml(
          row.workOrderNumber
        )}</strong>
        <div class="sub">${escapeHtml(
          row.status
        )}</div>
      </div>
    </div>

    <div class="grid">
      <div class="box"><div class="label">Order</div><div class="value">${escapeHtml(
        row.orderNumber
      )}</div></div>
      <div class="box"><div class="label">Customer</div><div class="value">${escapeHtml(
        row.customerName
      )}</div></div>
      <div class="box"><div class="label">Customer PO</div><div class="value">${escapeHtml(
        row.customerPoNumber || "—"
      )}</div></div>
      <div class="box"><div class="label">Priority</div><div class="value">${escapeHtml(
        row.priority
      )}</div></div>

      <div class="box"><div class="label">Item</div><div class="value">${escapeHtml(
        row.itemDescription
      )}</div></div>
      <div class="box"><div class="label">Colour / Size</div><div class="value">${escapeHtml(
        [row.garmentColor, row.garmentSize]
          .filter(Boolean)
          .join(" / ") ||
          "—"
      )}</div></div>
      <div class="box"><div class="label">Production Qty</div><div class="value">${escapeHtml(
        `${row.productionQuantity} ${row.unit}`
      )}</div></div>
      <div class="box"><div class="label">Delivery Target</div><div class="value">${escapeHtml(
        row.targetCompletionDate
      )}</div></div>
    </div>

    <h2>Embroidery Specification</h2>
    <div class="grid">
      <div class="box"><div class="label">Design</div><div class="value">${escapeHtml(
        row.designName || "—"
      )}</div></div>
      <div class="box"><div class="label">Service</div><div class="value">${escapeHtml(
        row.embroideryService
      )}</div></div>
      <div class="box"><div class="label">Placement</div><div class="value">${escapeHtml(
        row.placement
      )}</div></div>
      <div class="box"><div class="label">Digitizing</div><div class="value">${escapeHtml(
        row.digitizingNumber || "—"
      )}</div></div>

      <div class="box"><div class="label">Stitches</div><div class="value">${escapeHtml(
        row.stitchCount || "—"
      )}</div></div>
      <div class="box"><div class="label">Design Size</div><div class="value">${escapeHtml(
        row.embroideryWidthMm &&
          row.embroideryHeightMm
          ? `${row.embroideryWidthMm} × ${row.embroideryHeightMm} mm`
          : "—"
      )}</div></div>
      <div class="box"><div class="label">Colours</div><div class="value">${escapeHtml(
        row.colourCount || "—"
      )}</div></div>
      <div class="box"><div class="label">File Format</div><div class="value">${escapeHtml(
        row.fileFormat || "—"
      )}</div></div>
    </div>

    <h2>Machine Setup</h2>
    <div class="grid">
      <div class="box"><div class="label">Machine</div><div class="value">${escapeHtml(
        row.machineName || "—"
      )}</div></div>
      <div class="box"><div class="label">Operator</div><div class="value">${escapeHtml(
        row.operatorName || "—"
      )}</div></div>
      <div class="box"><div class="label">Hoop</div><div class="value">${escapeHtml(
        row.hoopSize || "—"
      )}</div></div>
      <div class="box"><div class="label">Speed</div><div class="value">${escapeHtml(
        row.machineSpeed
          ? `${row.machineSpeed} spm`
          : "—"
      )}</div></div>

      <div class="box"><div class="label">Thread</div><div class="value">${escapeHtml(
        row.threadType || "—"
      )}</div></div>
      <div class="box"><div class="label">Needle</div><div class="value">${escapeHtml(
        row.needleType || "—"
      )}</div></div>
      <div class="box"><div class="label">Backing</div><div class="value">${escapeHtml(
        row.backingType || "—"
      )}</div></div>
      <div class="box"><div class="label">Topping</div><div class="value">${escapeHtml(
        row.toppingRequired || "No"
      )}</div></div>
    </div>

    <h2>Thread Colours</h2>
    <div class="instructions">${escapeHtml(
      row.threadColors || "—"
    )}</div>

    <h2>Production Instructions</h2>
    <div class="instructions">${escapeHtml(
      row.productionInstructions || "—"
    )}</div>

    <h2>Packing Instructions</h2>
    <div class="instructions">${escapeHtml(
      row.packingInstructions || "—"
    )}</div>

    <div class="signatures">
      <div class="signature">Prepared By</div>
      <div class="signature">Machine Operator</div>
      <div class="signature">Production Supervisor</div>
    </div>
  </div>

  <script>
    window.onload = function () {
      window.print();
    };
  </script>
</body>
</html>
    `);

    printWindow.document.close();
  }

  /* =======================================================
     FILTERS / STATS
  ======================================================= */

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return workOrders.filter(
        (
          row
        ) => {
          const statusMatch =
            statusFilter ===
              "All" ||
            normalizeText(
              row.status
            ) ===
              normalizeText(
                statusFilter
              );

          const searchMatch =
            !query ||
            [
              row.workOrderNumber,
              row.orderNumber,
              row.customerName,
              row.itemDescription,
              row.designName,
              row.machineName,
              row.operatorName,
              row.status,
              row.garmentColor,
              row.garmentSize,
            ]
              .join(" ")
              .toLowerCase()
              .includes(
                query
              );

          return (
            statusMatch &&
            searchMatch
          );
        }
      );
    }, [
      workOrders,
      search,
      statusFilter,
    ]);

  const readyCount =
    workOrders.filter(
      (
        row
      ) =>
        [
          "released",
          "ready for production",
        ].includes(
          normalizeText(
            row.status
          )
        )
    ).length;

  const inProductionCount =
    workOrders.filter(
      (
        row
      ) =>
        normalizeText(
          row.status
        ) ===
        "in production"
    ).length;

  const urgentCount =
    workOrders.filter(
      (
        row
      ) =>
        normalizeText(
          row.priority
        ) ===
          "urgent" &&
        ![
          "completed",
          "cancelled",
        ].includes(
          normalizeText(
            row.status
          )
        )
    ).length;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">

      <div className="mx-auto w-full max-w-7xl space-y-6 pb-24">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>

            <div className="mb-2 inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-violet-700">
              Shop Floor Control
            </div>

            <h1 className="text-3xl font-black">
              Work Orders / Job Cards
            </h1>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Convert customer order lines into production-ready job cards with embroidery specification, machine setup, operator instructions and production quantity.
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
                void openCreateForm()
              }
              className="rounded-xl bg-violet-700 px-5 py-3 font-black text-white hover:bg-violet-800"
            >
              + New Work Order
            </button>

          </div>

        </div>

        {/* SUMMARY */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            label="Total Job Cards"
            value={String(
              workOrders.length
            )}
            caption="All Work Orders"
            tone="blue"
          />

          <StatCard
            label="Ready for Production"
            value={String(
              readyCount
            )}
            caption="Released to shop floor"
            tone="emerald"
          />

          <StatCard
            label="In Production"
            value={String(
              inProductionCount
            )}
            caption="Active embroidery jobs"
            tone="violet"
          />

          <StatCard
            label="Urgent"
            value={String(
              urgentCount
            )}
            caption="Open urgent job cards"
            tone="rose"
          />

        </div>

        {/* FILTERS */}

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
            placeholder="Search work order, order, customer, design, item, machine or operator..."
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

            {WORK_ORDER_STATUSES.map(
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
              Loading Work Orders...
            </div>

          ) : filtered.length ===
            0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl">
                🧰
              </div>

              <h2 className="mt-4 text-xl font-black">
                No Work Orders found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Create a Job Card from an existing customer Order line.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1400px] text-left text-sm">

                <thead>

                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                    <th className="px-4 py-4">
                      Work Order
                    </th>

                    <th className="px-4 py-4">
                      Order / Customer
                    </th>

                    <th className="px-4 py-4">
                      Item
                    </th>

                    <th className="px-4 py-4">
                      Design / Placement
                    </th>

                    <th className="px-4 py-4">
                      Qty
                    </th>

                    <th className="px-4 py-4">
                      Machine
                    </th>

                    <th className="px-4 py-4">
                      Target
                    </th>

                    <th className="px-4 py-4">
                      Priority
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
                      row
                    ) => (

                      <tr
                        key={
                          row.id
                        }
                        className="border-b last:border-0 hover:bg-slate-50"
                      >

                        <td className="px-4 py-4">

                          <div className="font-black text-violet-700">
                            {row.workOrderNumber}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {row.plannedStartDate ||
                              "—"}
                          </div>

                        </td>

                        <td className="px-4 py-4">

                          <div className="font-bold">
                            {row.orderNumber}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {row.customerName}
                          </div>

                        </td>

                        <td className="max-w-[240px] px-4 py-4">

                          <div className="font-semibold">
                            {row.itemDescription}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {[row.garmentColor, row.garmentSize]
                              .filter(Boolean)
                              .join(" / ") ||
                              row.itemType ||
                              "—"}
                          </div>

                        </td>

                        <td className="max-w-[240px] px-4 py-4">

                          <div className="font-semibold">
                            {row.designName ||
                              "—"}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {row.placement ||
                              "—"}
                          </div>

                        </td>

                        <td className="px-4 py-4">

                          <div className="text-lg font-black">
                            {row.productionQuantity}
                          </div>

                          <div className="text-xs text-slate-400">
                            of {row.orderedQuantity}{" "}
                            {row.unit}
                          </div>

                        </td>

                        <td className="px-4 py-4">

                          <div className="font-semibold">
                            {row.machineName ||
                              "Unassigned"}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {row.operatorName ||
                              "No operator"}
                          </div>

                        </td>

                        <td className="px-4 py-4">
                          {row.targetCompletionDate ||
                            "—"}
                        </td>

                        <td className="px-4 py-4">
                          <PriorityBadge
                            priority={
                              row.priority
                            }
                          />
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={
                              row.status
                            }
                          />
                        </td>

                        <td className="px-4 py-4">

                          <div className="flex flex-wrap gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setViewing(
                                  row
                                )
                              }
                              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                printWorkOrder(
                                  row
                                )
                              }
                              className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                            >
                              Print
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(
                                  row
                                )
                              }
                              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void deleteWorkOrder(
                                  row
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

      {/* ===================================================
          CREATE / EDIT
      =================================================== */}

      {showForm && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">

          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">

            <div className="my-5 flex max-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex shrink-0 items-start justify-between border-b px-6 py-5">

                <div>

                  <div className="text-xs font-black uppercase tracking-wide text-violet-600">
                    Production Job Card
                  </div>

                  <h2 className="mt-1 text-2xl font-black">
                    {editing
                      ? `Edit ${editing.workOrderNumber}`
                      : "New Work Order"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Select an Order line and define the exact shop-floor production setup.
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

              {/* BODY */}

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">

                <div className="space-y-6">

                  {/* ORDER */}

                  <Section
                    title="Customer Order"
                    description="A Work Order is created against one specific Order line item."
                  >

                    <div className="grid gap-5 md:grid-cols-2">

                      <Field
                        label="Order *"
                        caption={`${eligibleOrders.length} active order${eligibleOrders.length === 1 ? "" : "s"} available.`}
                      >

                        <select
                          value={
                            form.orderId
                          }
                          onChange={(e) =>
                            selectOrder(
                              e.target.value
                            )
                          }
                          disabled={
                            Boolean(
                              editing
                            )
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3 disabled:bg-slate-100"
                        >

                          <option value="">
                            Select Order
                          </option>

                          {eligibleOrders.map(
                            (
                              order
                            ) => (

                              <option
                                key={
                                  order.id
                                }
                                value={
                                  order.id
                                }
                              >
                                {order.orderNumber}
                                {" — "}
                                {order.customerName}
                                {" — "}
                                {order.totalQuantity} units
                              </option>

                            )
                          )}

                        </select>

                      </Field>

                      <Field
                        label="Order Line Item *"
                        caption="Choose the exact garment / colour / size / design line being produced."
                      >

                        <select
                          value={
                            form.orderItemId
                          }
                          onChange={(e) =>
                            selectOrderItem(
                              e.target.value
                            )
                          }
                          disabled={
                            !selectedOrder ||
                            Boolean(
                              editing
                            )
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3 disabled:bg-slate-100"
                        >

                          <option value="">
                            Select Order Item
                          </option>

                          {selectedOrderItems.map(
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
                                {item.description ||
                                  item.itemType}
                                {" — "}
                                {item.quantity}{" "}
                                {item.unit}
                                {item.color
                                  ? ` — ${item.color}`
                                  : ""}
                                {item.size
                                  ? ` / ${item.size}`
                                  : ""}
                              </option>

                            )
                          )}

                        </select>

                      </Field>

                    </div>

                    {selectedOrder &&
                      selectedOrderItem && (

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                        <InfoBox
                          label="Customer"
                          value={
                            selectedOrder.customerName
                          }
                        />

                        <InfoBox
                          label="Customer PO"
                          value={
                            selectedOrder.customerPoNumber ||
                            "—"
                          }
                        />

                        <InfoBox
                          label="Ordered Qty"
                          value={`${selectedOrderItem.quantity} ${selectedOrderItem.unit}`}
                        />

                        <InfoBox
                          label="Delivery Date"
                          value={
                            selectedOrder.deliveryDate ||
                            "—"
                          }
                        />

                        <InfoBox
                          label="Item"
                          value={
                            selectedOrderItem.description ||
                            selectedOrderItem.itemType
                          }
                        />

                        <InfoBox
                          label="Colour / Size"
                          value={
                            [
                              selectedOrderItem.color,
                              selectedOrderItem.size,
                            ]
                              .filter(Boolean)
                              .join(" / ") ||
                            "—"
                          }
                        />

                        <InfoBox
                          label="Embroidery"
                          value={
                            selectedOrderItem.embroideryService
                          }
                        />

                        <InfoBox
                          label="Placement"
                          value={
                            selectedOrderItem.placement
                          }
                        />

                      </div>

                    )}

                  </Section>

                  {/* DIGITIZING */}

                  <Section
                    title="Digitizing / Embroidery File"
                    description="Link the production-ready digitized design so stitches, design dimensions and thread information carry into the Job Card."
                  >

                    <Field
                      label="Digitizing Job"
                      caption={`${eligibleDigitizing.length} digitizing record${eligibleDigitizing.length === 1 ? "" : "s"} linked to this Order.`}
                    >

                      <select
                        value={
                          form.digitizingId
                        }
                        onChange={(e) =>
                          selectDigitizing(
                            e.target.value
                          )
                        }
                        disabled={
                          !selectedOrder
                        }
                        className="w-full rounded-xl border bg-white px-4 py-3 disabled:bg-slate-100"
                      >

                        <option value="">
                          No Digitizing record selected
                        </option>

                        {eligibleDigitizing.map(
                          (
                            row
                          ) => (

                            <option
                              key={
                                row.id
                              }
                              value={
                                row.id
                              }
                            >
                              {row.digitizingNumber ||
                                "Digitizing"}
                              {" — "}
                              {row.designName ||
                                "Design"}
                              {" — "}
                              {row.status ||
                                "Status not set"}
                            </option>

                          )
                        )}

                      </select>

                    </Field>

                    {selectedDigitizing && (

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                        <InfoBox
                          label="Design"
                          value={
                            selectedDigitizing.designName ||
                            "—"
                          }
                        />

                        <InfoBox
                          label="Stitch Count"
                          value={
                            selectedDigitizing.stitchCount
                              ? String(
                                  selectedDigitizing.stitchCount
                                )
                              : "—"
                          }
                        />

                        <InfoBox
                          label="Design Size"
                          value={
                            (
                              selectedDigitizing.designWidth ||
                              selectedDigitizing.width
                            ) &&
                            (
                              selectedDigitizing.designHeight ||
                              selectedDigitizing.height
                            )
                              ? `${
                                  selectedDigitizing.designWidth ||
                                  selectedDigitizing.width
                                } × ${
                                  selectedDigitizing.designHeight ||
                                  selectedDigitizing.height
                                } mm`
                              : "—"
                          }
                        />

                        <InfoBox
                          label="Thread Colours"
                          value={
                            selectedDigitizing.threadColors ||
                            selectedDigitizing.threadColours ||
                            "—"
                          }
                        />

                      </div>

                    )}

                  </Section>

                  {/* QUANTITY / SCHEDULE */}

                  <Section
                    title="Production Quantity & Schedule"
                    description="Define the quantity to run and the internal completion target."
                  >

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

                      <Field
                        label="Production Quantity *"
                        caption={
                          selectedOrderItem
                            ? `Maximum ordered quantity: ${selectedOrderItem.quantity} ${selectedOrderItem.unit}.`
                            : "Quantity assigned to this Work Order."
                        }
                      >

                        <input
                          type="number"
                          min="1"
                          max={
                            selectedOrderItem?.quantity
                          }
                          value={
                            form.productionQuantity
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              productionQuantity:
                                Number(
                                  e.target.value
                                ),
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Planned Start Date *"
                        caption="Target date for machine setup / start."
                      >

                        <input
                          type="date"
                          value={
                            form.plannedStartDate
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              plannedStartDate:
                                e.target.value,
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Target Completion Date *"
                        caption="Internal production target; ideally before customer delivery date."
                      >

                        <input
                          type="date"
                          min={
                            form.plannedStartDate ||
                            undefined
                          }
                          value={
                            form.targetCompletionDate
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              targetCompletionDate:
                                e.target.value,
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Priority"
                        caption="Shop-floor priority."
                      >

                        <select
                          value={
                            form.priority
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              priority:
                                e.target.value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >

                          {PRIORITIES.map(
                            (
                              priority
                            ) => (

                              <option
                                key={
                                  priority
                                }
                                value={
                                  priority
                                }
                              >
                                {priority}
                              </option>

                            )
                          )}

                        </select>

                      </Field>

                    </div>

                  </Section>

                  {/* MACHINE */}

                  <Section
                    title="Machine & Operator Setup"
                    description="This becomes the machine setup instruction used by Production."
                  >

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

                      <Field
                        label="Embroidery Machine"
                        caption="Required before release to Production."
                      >

                        <select
                          value={
                            form.machineName
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              machineName:
                                e.target.value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >

                          <option value="">
                            Select Machine
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
                                {machine}
                              </option>

                            )
                          )}

                        </select>

                      </Field>

                      <Field
                        label="Operator"
                        caption="Machine operator assigned to this job."
                      >

                        <input
                          value={
                            form.operatorName
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              operatorName:
                                e.target.value,
                            })
                          }
                          placeholder="Operator name"
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Hoop / Frame"
                        caption="Frame used for this placement."
                      >

                        <select
                          value={
                            form.hoopSize
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              hoopSize:
                                e.target.value,
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
                                {hoop}
                              </option>

                            )
                          )}

                        </select>

                      </Field>

                      <Field
                        label="Machine Speed (SPM)"
                        caption="Planned stitches per minute."
                      >

                        <input
                          type="number"
                          min="0"
                          value={
                            form.machineSpeed
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              machineSpeed:
                                Number(
                                  e.target.value
                                ),
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                    </div>

                  </Section>

                  {/* MATERIAL SETUP */}

                  <Section
                    title="Embroidery Material Setup"
                    description="Needle, thread, backing and topping instructions for repeatable production quality."
                  >

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

                      <Field
                        label="Thread Type"
                        caption="Primary embroidery thread."
                      >

                        <select
                          value={
                            form.threadType
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              threadType:
                                e.target.value,
                            })
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
                        label="Needle Type"
                        caption="Needle size / point appropriate to fabric."
                      >

                        <select
                          value={
                            form.needleType
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              needleType:
                                e.target.value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >

                          {NEEDLE_TYPES.map(
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
                        label="Backing / Stabilizer"
                        caption="Backing material used behind the embroidery."
                      >

                        <select
                          value={
                            form.backingType
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              backingType:
                                e.target.value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >

                          {BACKING_TYPES.map(
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
                        label="Water-Soluble Topping"
                        caption="Typically used on towels, fleece and high-pile garments."
                      >

                        <select
                          value={
                            form.toppingRequired
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              toppingRequired:
                                e.target.value,
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

                    </div>

                  </Section>

                  {/* SAMPLE */}

                  <Section
                    title="Sample / First-Piece Approval"
                    description="Use sample approval to reduce the risk of running an incorrect bulk production batch."
                  >

                    <div className="grid gap-5 md:grid-cols-3">

                      <Field
                        label="Sample Required"
                        caption="Whether a first-piece / sample stitch-out is required."
                      >

                        <select
                          value={
                            form.sampleRequired
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              sampleRequired:
                                e.target.value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >

                          <option value="Yes">
                            Yes
                          </option>

                          <option value="No">
                            No
                          </option>

                        </select>

                      </Field>

                      <Field
                        label="Sample Approved"
                        caption="Set Yes only after the physical sample is accepted."
                      >

                        <select
                          value={
                            form.sampleApproved
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              sampleApproved:
                                e.target.value,
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
                        label="Approved By"
                        caption="Customer, owner or production supervisor."
                      >

                        <input
                          value={
                            form.sampleApprovedBy
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              sampleApprovedBy:
                                e.target.value,
                            })
                          }
                          disabled={
                            form.sampleApproved !==
                            "Yes"
                          }
                          className="w-full rounded-xl border px-4 py-3 disabled:bg-slate-100"
                        />

                      </Field>

                    </div>

                  </Section>

                  {/* INSTRUCTIONS */}

                  <Section
                    title="Production Instructions"
                    description="Critical shop-floor notes that the operator should follow."
                  >

                    <textarea
                      value={
                        form.productionInstructions
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,

                          productionInstructions:
                            e.target.value,
                        })
                      }
                      placeholder="Thread sequence, alignment, garment handling, logo orientation, trim requirements, special stitch instructions..."
                      className="min-h-28 w-full rounded-xl border px-4 py-3"
                    />

                  </Section>

                  <Section
                    title="Packing Instructions"
                    description="Packing or segregation instructions to follow after Production / QC."
                  >

                    <textarea
                      value={
                        form.packingInstructions
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,

                          packingInstructions:
                            e.target.value,
                        })
                      }
                      placeholder="Fold individually, segregate by size, polybag, label, carton grouping..."
                      className="min-h-24 w-full rounded-xl border px-4 py-3"
                    />

                  </Section>

                  {/* STATUS */}

                  <Section
                    title="Workflow Status"
                    description="Draft is planning only. Ready for Production means the shop floor can execute this Job Card."
                  >

                    <div className="grid gap-5 md:grid-cols-2">

                      <Field
                        label="Work Order Status"
                        caption="Release only after quantity and production setup are confirmed."
                      >

                        <select
                          value={
                            form.status
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              status:
                                e.target.value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >

                          {WORK_ORDER_STATUSES.map(
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
                        label="Internal Notes"
                        caption="Planning or supervisor notes not necessarily needed on the shop-floor instruction."
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
                          className="min-h-20 w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                    </div>

                  </Section>

                </div>

              </div>

              {/* FOOTER */}

              <div className="flex shrink-0 flex-col gap-3 border-t bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="text-sm text-slate-500">
                  {selectedOrderItem
                    ? `${form.productionQuantity || 0} of ${selectedOrderItem.quantity} ${selectedOrderItem.unit} assigned`
                    : "Select an Order line to build the Job Card"}
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row">

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
                      void saveWorkOrder()
                    }
                    disabled={
                      saving
                    }
                    className="rounded-xl bg-violet-700 px-6 py-3 font-black text-white hover:bg-violet-800 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editing
                      ? "Update Work Order"
                      : "Create Work Order"}
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

          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">

            <div className="my-6 w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">

              <div className="flex items-start justify-between border-b px-6 py-5">

                <div>

                  <div className="text-xs font-black uppercase tracking-wide text-violet-600">
                    Production Job Card
                  </div>

                  <h2 className="mt-1 text-2xl font-black">
                    {viewing.workOrderNumber}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {viewing.orderNumber}
                    {" · "}
                    {viewing.customerName}
                  </p>

                </div>

                <div className="flex gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      printWorkOrder(
                        viewing
                      )
                    }
                    className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700"
                  >
                    Print Job Card
                  </button>

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

              </div>

              <div className="space-y-6 p-6">

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                  <InfoBox
                    label="Order"
                    value={
                      viewing.orderNumber
                    }
                  />

                  <InfoBox
                    label="Customer PO"
                    value={
                      viewing.customerPoNumber ||
                      "—"
                    }
                  />

                  <InfoBox
                    label="Production Qty"
                    value={`${viewing.productionQuantity} ${viewing.unit}`}
                  />

                  <InfoBox
                    label="Target"
                    value={
                      viewing.targetCompletionDate ||
                      "—"
                    }
                  />

                </div>

                <Section
                  title="Embroidery Specification"
                  description="Production specification carried from Order and Digitizing."
                >

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                    <InfoBox
                      label="Item"
                      value={
                        viewing.itemDescription
                      }
                    />

                    <InfoBox
                      label="Colour / Size"
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
                      label="Design"
                      value={
                        viewing.designName ||
                        "—"
                      }
                    />

                    <InfoBox
                      label="Placement"
                      value={
                        viewing.placement ||
                        "—"
                      }
                    />

                    <InfoBox
                      label="Stitches"
                      value={
                        viewing.stitchCount
                          ? String(
                              viewing.stitchCount
                            )
                          : "—"
                      }
                    />

                    <InfoBox
                      label="Size"
                      value={
                        viewing.embroideryWidthMm &&
                        viewing.embroideryHeightMm
                          ? `${viewing.embroideryWidthMm} × ${viewing.embroideryHeightMm} mm`
                          : "—"
                      }
                    />

                    <InfoBox
                      label="Colours"
                      value={
                        viewing.colourCount
                          ? String(
                              viewing.colourCount
                            )
                          : "—"
                      }
                    />

                    <InfoBox
                      label="File"
                      value={
                        viewing.fileFormat ||
                        "—"
                      }
                    />

                  </div>

                </Section>

                <Section
                  title="Machine Setup"
                  description="Shop-floor setup for the embroidery run."
                >

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

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

                    <InfoBox
                      label="Hoop"
                      value={
                        viewing.hoopSize ||
                        "—"
                      }
                    />

                    <InfoBox
                      label="Speed"
                      value={
                        viewing.machineSpeed
                          ? `${viewing.machineSpeed} SPM`
                          : "—"
                      }
                    />

                    <InfoBox
                      label="Thread"
                      value={
                        viewing.threadType ||
                        "—"
                      }
                    />

                    <InfoBox
                      label="Needle"
                      value={
                        viewing.needleType ||
                        "—"
                      }
                    />

                    <InfoBox
                      label="Backing"
                      value={
                        viewing.backingType ||
                        "—"
                      }
                    />

                    <InfoBox
                      label="Topping"
                      value={
                        viewing.toppingRequired ||
                        "No"
                      }
                    />

                  </div>

                </Section>

                {viewing.threadColors && (

                  <TextPanel
                    label="Thread Colours"
                    value={
                      viewing.threadColors
                    }
                  />

                )}

                <TextPanel
                  label="Production Instructions"
                  value={
                    viewing.productionInstructions ||
                    "No special production instructions."
                  }
                />

                <TextPanel
                  label="Packing Instructions"
                  value={
                    viewing.packingInstructions ||
                    "No special packing instructions."
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
  caption,
  tone,
}: {
  label: string;
  value: string;
  caption: string;
  tone:
    | "blue"
    | "emerald"
    | "violet"
    | "rose";
}) {
  const styles = {
    blue:
      "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-blue-900",

    emerald:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 text-emerald-900",

    violet:
      "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 text-violet-900",

    rose:
      "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-50 text-rose-900",
  };

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${styles[tone]}`}
    >

      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
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

function PriorityBadge({
  priority,
}: {
  priority: string;
}) {
  const normalized =
    normalizeText(
      priority
    );

  const style =
    normalized ===
    "urgent"
      ? "bg-red-100 text-red-700"
      : normalized ===
        "high"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${style}`}
    >
      {priority ||
        "Normal"}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    normalizeText(
      status
    );

  const style =
    normalized ===
    "completed"
      ? "bg-green-100 text-green-700"
      : normalized ===
        "in production"
      ? "bg-blue-100 text-blue-700"
      : [
          "ready for production",
          "released",
        ].includes(
          normalized
        )
      ? "bg-emerald-100 text-emerald-700"
      : normalized ===
        "on hold"
      ? "bg-amber-100 text-amber-700"
      : normalized ===
        "cancelled"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${style}`}
    >
      {status ||
        "Draft"}
    </span>
  );
}

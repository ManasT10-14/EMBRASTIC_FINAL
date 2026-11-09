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

type Customer = {
  id: string;
  customerCode: string;

  name: string;
  businessName: string;

  contactPerson: string;
  phone: string;
  email: string;

  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;

  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  billingCountry: string;
};

type Order = {
  id: string;
  orderNumber: string;

  customerId: string;
  customerName: string;

  orderDate: string;
  deliveryDate: string;

  status: string;

  items: string;
  orderItems: string;

  quotationId: string;
  quotationNumber: string;

  notes: string;

  createdAt: string;

  [key: string]: any;
};

type QualityRecord = {
  id: string;

  qcNumber: string;

  productionId: string;
  productionNumber: string;

  orderId: string;
  orderNumber: string;

  customerId: string;
  customerName: string;

  inspectionDate: string;
  qcDate: string;

  inspectorName: string;

  inspectedQuantity: number;
  passedQuantity: number;
  rejectedQuantity: number;
  reworkQuantity: number;

  qcStatus: string;

  result: string;
  status: string;

  dispatchReady: string;

  colorAccuracy: string;
  finishingQuality: string;
  cleanliness: string;
  packagingReadiness: string;

  remarks: string;
  notes: string;

  createdAt: string;

  [key: string]: any;
};

type DispatchRecord = {
  id: string;

  dispatchNumber: string;

  orderId: string;
  orderNumber: string;

  customerId: string;
  customerName: string;

  qualityControlId: string;

  qcNumber: string;
  qcResult: string;
  qcDate: string;
  qcInspector: string;

  dispatchDate: string;

  courierName: string;
  trackingNumber: string;

  shippingMode: string;

  packageCount: number;
  totalWeight: number;

  vehicleNumber: string;
  driverName: string;
  driverPhone: string;

  deliveryAddress: string;

  status: string;

  notes: string;

  createdAt: string;
  updatedAt: string;

  [key: string]: any;
};

type DispatchForm = {
  orderId: string;

  dispatchDate: string;

  courierName: string;
  trackingNumber: string;

  shippingMode: string;

  packageCount: number;
  totalWeight: number;

  vehicleNumber: string;
  driverName: string;
  driverPhone: string;

  status: string;

  notes: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const SHIPPING_MODES = [
  "Courier",
  "Transport",
  "Local Delivery",
  "Company Vehicle",
  "Customer Pickup",
  "Hand Delivery",
  "Air Cargo",
  "Surface Transport",
  "Other",
];

const DISPATCH_STATUSES = [
  "Preparing",
  "Dispatched",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Delivery Failed",
  "Returned",
  "Cancelled",
];

/* =========================================================
   STATIC EMPTY FORM

   IMPORTANT FOR NEXT.JS 16:
   no new Date() here.
========================================================= */

function emptyForm(): DispatchForm {
  return {
    orderId: "",

    dispatchDate: "",

    courierName: "",
    trackingNumber: "",

    shippingMode: "Courier",

    packageCount: 1,
    totalWeight: 0,

    vehicleNumber: "",
    driverName: "",
    driverPhone: "",

    status: "Preparing",

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

  return `id-${Math.random()
    .toString(36)
    .slice(2)}-${Math.random()
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

function sameText(
  a: unknown,
  b: unknown
) {
  const left =
    normalizeText(a);

  const right =
    normalizeText(b);

  return Boolean(
    left &&
      right &&
      left === right
  );
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

function formatDate(
  value: string
) {
  if (!value) {
    return "—";
  }

  const raw =
    String(value)
      .split("T")[0];

  const parts =
    raw.split("-");

  if (
    parts.length !== 3
  ) {
    return raw;
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function fullAddress(
  customer?: Customer | null
) {
  if (!customer) {
    return "";
  }

  return [
    customer.shippingAddress ||
      customer.billingAddress,

    customer.shippingCity ||
      customer.billingCity,

    customer.shippingState ||
      customer.billingState,

    customer.shippingPostalCode ||
      customer.billingPostalCode,

    customer.shippingCountry ||
      customer.billingCountry,
  ]
    .filter(Boolean)
    .join(", ");
}

/* =========================================================
   QC PASS LOGIC

   Supports the latest QC schema as well as older rows.
========================================================= */

function isQualityPassed(
  quality: QualityRecord
) {
  /*
   * Strongest/most recent field first.
   */
  const statusValues = [
    quality.qcStatus,
    quality.result,
    quality.status,
  ]
    .map(
      normalizeText
    )
    .filter(Boolean);

  const passed =
    statusValues.some(
      (value) =>
        [
          "pass",
          "passed",
          "qc pass",
          "qc passed",
          "quality passed",
          "quality check passed",
          "approved",
          "accepted",
          "completed pass",
        ].includes(
          value
        )
    );

  /*
   * Your new QC page also writes
   * dispatchReady = Yes.
   */
  const explicitlyReady =
    [
      "yes",
      "true",
      "ready",
      "ready for dispatch",
    ].includes(
      normalizeText(
        quality.dispatchReady
      )
    );

  return (
    passed ||
    explicitlyReady
  );
}

/* =========================================================
   ORDER ↔ QC MATCH

   Robust against spaces, case and ID/number differences.
========================================================= */

function qualityBelongsToOrder(
  quality: QualityRecord,
  order: Order
) {
  const byId =
    sameText(
      quality.orderId,
      order.id
    );

  const byNumber =
    sameText(
      quality.orderNumber,
      order.orderNumber
    );

  return (
    byId ||
    byNumber
  );
}

/* =========================================================
   NORMALIZERS
========================================================= */

function normalizeCustomer(
  row: any
): Customer {
  return {
    id:
      clean(row?.id),

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
        row?.businessName ??
          row?.companyName
      ),

    contactPerson:
      clean(
        row?.contactPerson
      ),

    phone:
      clean(row?.phone),

    email:
      clean(row?.email),

    shippingAddress:
      clean(
        row?.shippingAddress ??
          row?.billingAddress ??
          row?.address
      ),

    shippingCity:
      clean(
        row?.shippingCity ??
          row?.billingCity
      ),

    shippingState:
      clean(
        row?.shippingState ??
          row?.billingState
      ),

    shippingPostalCode:
      clean(
        row?.shippingPostalCode ??
          row?.billingPostalCode
      ),

    shippingCountry:
      clean(
        row?.shippingCountry ??
          row?.billingCountry ??
          "India"
      ),

    billingAddress:
      clean(
        row?.billingAddress ??
          row?.address
      ),

    billingCity:
      clean(
        row?.billingCity
      ),

    billingState:
      clean(
        row?.billingState
      ),

    billingPostalCode:
      clean(
        row?.billingPostalCode
      ),

    billingCountry:
      clean(
        row?.billingCountry ??
          "India"
      ),
  };
}

function normalizeOrder(
  row: any
): Order {
  return {
    ...row,

    id:
      clean(row?.id),

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

    orderDate:
      clean(
        row?.orderDate
      ).split("T")[0],

    deliveryDate:
      clean(
        row?.deliveryDate
      ).split("T")[0],

    status:
      clean(
        row?.status
      ) || "Pending",

    items:
      clean(row?.items),

    orderItems:
      clean(
        row?.orderItems
      ),

    quotationId:
      clean(
        row?.quotationId
      ),

    quotationNumber:
      clean(
        row?.quotationNumber
      ),

    notes:
      clean(row?.notes),

    createdAt:
      clean(
        row?.createdAt
      ),
  };
}

function normalizeQuality(
  row: any
): QualityRecord {
  return {
    ...row,

    id:
      clean(row?.id),

    qcNumber:
      clean(
        row?.qcNumber ??
          row?.qualityNumber
      ),

    productionId:
      clean(
        row?.productionId
      ),

    productionNumber:
      clean(
        row?.productionNumber
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

    inspectionDate:
      clean(
        row?.inspectionDate ??
          row?.checkedDate ??
          row?.qcDate ??
          row?.date
      ).split("T")[0],

    qcDate:
      clean(
        row?.qcDate ??
          row?.inspectionDate ??
          row?.checkedDate ??
          row?.date
      ).split("T")[0],

    inspectorName:
      clean(
        row?.inspectorName ??
          row?.checkedBy
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

    /*
     * Latest schema first.
     */
    qcStatus:
      clean(
        row?.qcStatus ??
          row?.qualityStatus
      ),

    result:
      clean(
        row?.result ??
          row?.qcResult ??
          row?.qualityResult
      ),

    status:
      clean(
        row?.status
      ),

    dispatchReady:
      clean(
        row?.dispatchReady
      ),

    colorAccuracy:
      clean(
        row?.colorAccuracy ??
          row?.colourAccuracy
      ),

    finishingQuality:
      clean(
        row?.finishingQuality ??
          row?.trimmingQuality
      ),

    cleanliness:
      clean(
        row?.cleanliness
      ),

    packagingReadiness:
      clean(
        row?.packagingReadiness
      ),

    remarks:
      clean(
        row?.remarks
      ),

    notes:
      clean(row?.notes),

    createdAt:
      clean(
        row?.createdAt
      ),
  };
}

function normalizeDispatch(
  row: any
): DispatchRecord {
  return {
    ...row,

    id:
      clean(row?.id),

    dispatchNumber:
      clean(
        row?.dispatchNumber
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

    qualityControlId:
      clean(
        row?.qualityControlId
      ),

    qcNumber:
      clean(
        row?.qcNumber
      ),

    qcResult:
      clean(
        row?.qcResult
      ),

    qcDate:
      clean(
        row?.qcDate
      ).split("T")[0],

    qcInspector:
      clean(
        row?.qcInspector
      ),

    dispatchDate:
      clean(
        row?.dispatchDate
      ).split("T")[0],

    courierName:
      clean(
        row?.courierName
      ),

    trackingNumber:
      clean(
        row?.trackingNumber
      ),

    shippingMode:
      clean(
        row?.shippingMode ??
          row?.dispatchMethod
      ) || "Courier",

    packageCount:
      toNumber(
        row?.packageCount ||
          1
      ),

    totalWeight:
      toNumber(
        row?.totalWeight
      ),

    vehicleNumber:
      clean(
        row?.vehicleNumber
      ),

    driverName:
      clean(
        row?.driverName
      ),

    driverPhone:
      clean(
        row?.driverPhone
      ),

    deliveryAddress:
      clean(
        row?.deliveryAddress
      ),

    status:
      clean(
        row?.status
      ) || "Preparing",

    notes:
      clean(row?.notes),

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

export default function DispatchPage() {
  const [
    customers,
    setCustomers,
  ] =
    useState<Customer[]>(
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
    qualityRecords,
    setQualityRecords,
  ] =
    useState<
      QualityRecord[]
    >([]);

  const [
    dispatches,
    setDispatches,
  ] =
    useState<
      DispatchRecord[]
    >([]);

  const [
    form,
    setForm,
  ] =
    useState<DispatchForm>(
      emptyForm()
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
    editing,
    setEditing,
  ] =
    useState<
      DispatchRecord | null
    >(null);

  const [
    viewing,
    setViewing,
  ] =
    useState<
      DispatchRecord | null
    >(null);

  const [
    showForm,
    setShowForm,
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
    useState("All");

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    setForm(
      (
        current
      ) => ({
        ...current,

        dispatchDate:
          getToday(),
      })
    );

    void loadData();
  }, []);

  /* =======================================================
     MODAL SCROLL LOCK
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
        "Dispatch Excel request failed:",
        {
          request:
            body,

          response:
            data,
        }
      );

      throw new Error(
        data?.message ||
          data?.error ||
          "Unable to save Dispatch."
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
        customerRows,
        orderRows,
        qualityRows,
        dispatchRows,
      ] =
        await Promise.all([
          loadSheet(
            "Customers"
          ),

          loadSheet(
            "Orders"
          ),

          /*
           * Correct sheet name.
           */
          loadSheet(
            "QualityControl"
          ),

          loadSheet(
            "Dispatch"
          ),
        ]);

      const loadedCustomers =
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
          );

      const loadedOrders =
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
                row.id ||
                  row.orderNumber
              )
          );

      const loadedQuality =
        qualityRows
          .map(
            normalizeQuality
          )
          .filter(
            (
              row:
                QualityRecord
            ) =>
              Boolean(
                row.id
              )
          );

      const loadedDispatches =
        dispatchRows
          .map(
            normalizeDispatch
          )
          .filter(
            (
              row:
                DispatchRecord
            ) =>
              Boolean(
                row.id
              )
          )
          .sort(
            (
              a:
                DispatchRecord,
              b:
                DispatchRecord
            ) =>
              String(
                b.createdAt
              ).localeCompare(
                String(
                  a.createdAt
                )
              )
          );

      console.log(
        "DISPATCH DEBUG",
        {
          orders:
            loadedOrders.length,

          quality:
            loadedQuality.length,

          passedQuality:
            loadedQuality.filter(
              isQualityPassed
            ).map(
              (qc) => ({
                id:
                  qc.id,

                qcNumber:
                  qc.qcNumber,

                orderId:
                  qc.orderId,

                orderNumber:
                  qc.orderNumber,

                qcStatus:
                  qc.qcStatus,

                result:
                  qc.result,

                status:
                  qc.status,

                dispatchReady:
                  qc.dispatchReady,
              })
            ),

          dispatches:
            loadedDispatches.length,
        }
      );

      setCustomers(
        loadedCustomers
      );

      setOrders(
        loadedOrders
      );

      setQualityRecords(
        loadedQuality
      );

      setDispatches(
        loadedDispatches
      );
    } catch (error) {
      console.error(
        "Dispatch load error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load Dispatch page."
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
     FIND PASSED QC
  ======================================================= */

  function findPassedQuality(
    order: Order
  ) {
    /*
     * If several QC inspections exist,
     * use the most recently created passing one.
     */
    return qualityRecords
      .filter(
        (
          quality
        ) =>
          qualityBelongsToOrder(
            quality,
            order
          ) &&
          isQualityPassed(
            quality
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
      )[0];
  }

  /* =======================================================
     EXISTING DISPATCH CHECK
  ======================================================= */

  function findExistingDispatch(
    order: Order
  ) {
    return dispatches.find(
      (
        dispatch
      ) =>
        (
          dispatch.orderId &&
          sameText(
            dispatch.orderId,
            order.id
          )
        ) ||
        (
          dispatch.orderNumber &&
          sameText(
            dispatch.orderNumber,
            order.orderNumber
          )
        )
    );
  }

  /* =======================================================
     READY FOR DISPATCH ORDERS

     MAIN FIX:
     QC PASS drives this list directly.
  ======================================================= */

  const readyOrders =
    useMemo(() => {
      return orders
        .filter(
          (
            order
          ) => {
            const passedQC =
              qualityRecords.some(
                (
                  quality
                ) =>
                  qualityBelongsToOrder(
                    quality,
                    order
                  ) &&
                  isQualityPassed(
                    quality
                  )
              );

            if (
              !passedQC
            ) {
              return false;
            }

            const existingDispatch =
              dispatches.find(
                (
                  dispatch
                ) =>
                  (
                    dispatch.orderId &&
                    sameText(
                      dispatch.orderId,
                      order.id
                    )
                  ) ||
                  (
                    dispatch.orderNumber &&
                    sameText(
                      dispatch.orderNumber,
                      order.orderNumber
                    )
                  )
              );

            /*
             * No dispatch yet = ready.
             */
            if (
              !existingDispatch
            ) {
              return true;
            }

            /*
             * Cancelled dispatch may be recreated.
             */
            if (
              normalizeText(
                existingDispatch.status
              ) ===
              "cancelled"
            ) {
              return true;
            }

            /*
             * Keep current order available while
             * editing its dispatch.
             */
            return (
              editing?.id ===
              existingDispatch.id
            );
          }
        )
        .sort(
          (
            a,
            b
          ) =>
            a.orderNumber.localeCompare(
              b.orderNumber
            )
        );
    }, [
      orders,
      qualityRecords,
      dispatches,
      editing,
    ]);

  /* =======================================================
     SELECTED ORDER / QC / CUSTOMER
  ======================================================= */

  const selectedOrder =
    useMemo(
      () =>
        orders.find(
          (
            order
          ) =>
            sameText(
              order.id,
              form.orderId
            )
        ),
      [
        orders,
        form.orderId,
      ]
    );

  const selectedQuality =
    useMemo(() => {
      if (
        !selectedOrder
      ) {
        return undefined;
      }

      return qualityRecords
        .filter(
          (
            quality
          ) =>
            qualityBelongsToOrder(
              quality,
              selectedOrder
            ) &&
            isQualityPassed(
              quality
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
        )[0];
    }, [
      selectedOrder,
      qualityRecords,
    ]);

  const selectedCustomer =
    useMemo(() => {
      if (
        !selectedOrder
      ) {
        return undefined;
      }

      const byId =
        customers.find(
          (
            customer
          ) =>
            sameText(
              customer.id,
              selectedOrder.customerId
            )
        );

      if (
        byId
      ) {
        return byId;
      }

      return customers.find(
        (
          customer
        ) =>
          sameText(
            customer.name,
            selectedOrder.customerName
          )
      );
    }, [
      customers,
      selectedOrder,
    ]);

  /* =======================================================
     STATS
  ======================================================= */

  const readyCount =
    readyOrders.length;

  const dispatchedCount =
    useMemo(
      () =>
        dispatches.filter(
          (
            row
          ) =>
            normalizeText(
              row.status
            ) ===
            "dispatched"
        ).length,
      [dispatches]
    );

  const inTransitCount =
    useMemo(
      () =>
        dispatches.filter(
          (
            row
          ) =>
            normalizeText(
              row.status
            ) ===
            "in transit"
        ).length,
      [dispatches]
    );

  const deliveredCount =
    useMemo(
      () =>
        dispatches.filter(
          (
            row
          ) =>
            normalizeText(
              row.status
            ) ===
            "delivered"
        ).length,
      [dispatches]
    );

  /* =======================================================
     FILTER EXISTING DISPATCH RECORDS
  ======================================================= */

  const filteredDispatches =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return dispatches.filter(
        (
          dispatch
        ) => {
          const customer =
            customers.find(
              (
                row
              ) =>
                sameText(
                  row.id,
                  dispatch.customerId
                )
            );

          const statusMatches =
            statusFilter ===
              "All" ||
            normalizeText(
              dispatch.status
            ) ===
              normalizeText(
                statusFilter
              );

          const searchMatches =
            !query ||
            [
              dispatch.dispatchNumber,
              dispatch.orderNumber,
              dispatch.customerName,
              customer?.name,
              customer?.businessName,
              dispatch.courierName,
              dispatch.trackingNumber,
              dispatch.status,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(
                query
              );

          return (
            statusMatches &&
            searchMatches
          );
        }
      );
    }, [
      dispatches,
      customers,
      search,
      statusFilter,
    ]);

  /* =======================================================
     FORM
  ======================================================= */

  function updateForm<
    K extends keyof DispatchForm
  >(
    field: K,
    value:
      DispatchForm[K]
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

  async function openCreate(
    initialOrderId = ""
  ) {
    await loadData(
      true
    );

    setEditing(
      null
    );

    setForm({
      ...emptyForm(),

      orderId:
        initialOrderId,

      dispatchDate:
        getToday(),
    });

    setShowForm(
      true
    );
  }

  function openEdit(
    dispatch:
      DispatchRecord
  ) {
    setEditing(
      dispatch
    );

    setForm({
      orderId:
        dispatch.orderId,

      dispatchDate:
        dispatch.dispatchDate ||
        getToday(),

      courierName:
        dispatch.courierName,

      trackingNumber:
        dispatch.trackingNumber,

      shippingMode:
        dispatch.shippingMode ||
        "Courier",

      packageCount:
        dispatch.packageCount ||
        1,

      totalWeight:
        dispatch.totalWeight ||
        0,

      vehicleNumber:
        dispatch.vehicleNumber,

      driverName:
        dispatch.driverName,

      driverPhone:
        dispatch.driverPhone,

      status:
        dispatch.status ||
        "Preparing",

      notes:
        dispatch.notes,
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
     DISPATCH NUMBER
  ======================================================= */

  function nextDispatchNumber(
    year: number
  ) {
    let max = 0;

    const prefix =
      `DSP-${year}-`;

    dispatches.forEach(
      (
        dispatch
      ) => {
        if (
          !dispatch
            .dispatchNumber
            .startsWith(
              prefix
            )
        ) {
          return;
        }

        const match =
          dispatch
            .dispatchNumber
            .match(
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

    return `DSP-${year}-${String(
      max + 1
    ).padStart(
      4,
      "0"
    )}`;
  }

  /* =======================================================
     SAVE DISPATCH
  ======================================================= */

  async function saveDispatch() {
    const order =
      orders.find(
        (
          row
        ) =>
          sameText(
            row.id,
            form.orderId
          )
      );

    if (
      !order
    ) {
      alert(
        "Please select a QC-passed Order."
      );

      return;
    }

    /*
     * Always re-check QC at save time.
     */
    const quality =
      findPassedQuality(
        order
      );

    if (
      !quality
    ) {
      alert(
        `${order.orderNumber} does not currently have a passed Quality Control record.`
      );

      return;
    }

    const customer =
      customers.find(
        (
          row
        ) =>
          sameText(
            row.id,
            order.customerId
          )
      ) ||
      customers.find(
        (
          row
        ) =>
          sameText(
            row.name,
            order.customerName
          )
      );

    if (
      !customer
    ) {
      alert(
        "Customer linked to this Order could not be found."
      );

      return;
    }

    if (
      !form.dispatchDate
    ) {
      alert(
        "Dispatch Date is required."
      );

      return;
    }

    const existing =
      dispatches.find(
        (
          dispatch
        ) =>
          (
            (
              sameText(
                dispatch.orderId,
                order.id
              ) ||
              sameText(
                dispatch.orderNumber,
                order.orderNumber
              )
            ) &&
            dispatch.id !==
              editing?.id &&
            normalizeText(
              dispatch.status
            ) !==
              "cancelled"
          )
      );

    if (
      existing
    ) {
      alert(
        `${order.orderNumber} already has Dispatch ${existing.dispatchNumber}.`
      );

      return;
    }

    try {
      setSaving(
        true
      );

      const year =
        Number(
          form.dispatchDate.slice(
            0,
            4
          )
        );

      if (
        !year
      ) {
        throw new Error(
          "Invalid Dispatch Date."
        );
      }

      const dispatchNumber =
        editing
          ? editing.dispatchNumber
          : nextDispatchNumber(
              year
            );

      const now =
        getNow();

      const deliveryAddress =
        fullAddress(
          customer
        );

      const qcResult =
        quality.qcStatus ||
        quality.result ||
        quality.status ||
        "Pass";

      const record = {
        dispatchNumber,

        orderId:
          order.id,

        orderNumber:
          order.orderNumber,

        customerId:
          customer.id,

        customerName:
          customer.name,

        /*
         * Exact QC relationship.
         */
        qualityControlId:
          quality.id,

        qcNumber:
          quality.qcNumber,

        qcResult,

        qcDate:
          quality.inspectionDate ||
          quality.qcDate,

        qcInspector:
          quality.inspectorName,

        dispatchDate:
          form.dispatchDate,

        courierName:
          form.courierName.trim(),

        trackingNumber:
          form.trackingNumber.trim(),

        shippingMode:
          form.shippingMode,

        /*
         * Backward-compatible backend field.
         */
        dispatchMethod:
          form.shippingMode,

        packageCount:
          Number(
            form.packageCount ||
              0
          ),

        totalWeight:
          Number(
            form.totalWeight ||
              0
          ),

        vehicleNumber:
          form.vehicleNumber.trim(),

        driverName:
          form.driverName.trim(),

        driverPhone:
          form.driverPhone.trim(),

        deliveryAddress,

        status:
          form.status,

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
            "Dispatch",

          id:
            editing.id,

          record,
        });
      } else {
        await saveExcel({
          action:
            "add",

          sheet:
            "Dispatch",

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
         SYNC ORDER
      =================================================== */

      let nextOrderStatus =
        "Ready for Dispatch";

      if (
        [
          "Dispatched",
          "In Transit",
          "Out for Delivery",
          "Delivery Failed",
          "Returned",
        ].includes(
          form.status
        )
      ) {
        nextOrderStatus =
          "Dispatched";
      }

      if (
        form.status ===
        "Delivered"
      ) {
        nextOrderStatus =
          "Completed";
      }

      if (
        form.status ===
        "Cancelled"
      ) {
        nextOrderStatus =
          "Ready for Dispatch";
      }

      await saveExcel({
        action:
          "update",

        sheet:
          "Orders",

        id:
          order.id,

        record: {
          status:
            nextOrderStatus,

          updatedAt:
            now,
        },
      });

      setShowForm(
        false
      );

      setEditing(
        null
      );

      setForm(
        emptyForm()
      );

      await loadData(
        true
      );

      alert(
        `${dispatchNumber} saved successfully.`
      );
    } catch (error) {
      console.error(
        "Dispatch save error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to save Dispatch."
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

  async function deleteDispatch(
    dispatch:
      DispatchRecord
  ) {
    if (
      !confirm(
        `Delete ${dispatch.dispatchNumber}?`
      )
    ) {
      return;
    }

    try {
      await saveExcel({
        action:
          "delete",

        sheet:
          "Dispatch",

        id:
          dispatch.id,
      });

      await loadData(
        true
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete Dispatch."
      );
    }
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

            <h1 className="text-3xl font-black">
              Dispatch
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              QC-passed orders appear here automatically and can then be prepared for customer delivery.
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
                void openCreate()
              }
              className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
            >
              + New Dispatch
            </button>

          </div>

        </div>

        {/* WORKFLOW */}

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">

          <div className="flex items-start gap-3">

            <div className="text-2xl">
              ✅
            </div>

            <div>

              <div className="font-black text-emerald-900">
                {readyCount} Order
                {readyCount === 1
                  ? ""
                  : "s"}{" "}
                Ready for Dispatch
              </div>

              <p className="mt-1 text-sm leading-6 text-emerald-700">
                Quality Control Pass is the release point for Dispatch. Passed QC orders are shown below automatically.
              </p>

            </div>

          </div>

        </div>

        {/* SUMMARY */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            label="Ready"
            value={
              readyCount
            }
            caption="QC passed"
          />

          <StatCard
            label="Dispatched"
            value={
              dispatchedCount
            }
            caption="Sent"
          />

          <StatCard
            label="In Transit"
            value={
              inTransitCount
            }
            caption="With carrier"
          />

          <StatCard
            label="Delivered"
            value={
              deliveredCount
            }
            caption="Completed"
          />

        </div>

        {/* =================================================
            READY FOR DISPATCH

            THIS WAS MISSING FROM YOUR OLD PAGE.
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-green-100 bg-green-50 px-5 py-4">

            <div>

              <h2 className="font-black text-green-900">
                Ready for Dispatch
              </h2>

              <p className="mt-1 text-xs text-green-700">
                Orders whose latest linked Quality Control has passed.
              </p>

            </div>

            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
              {readyOrders.length}
            </span>

          </div>

          {loading ? (

            <div className="p-10 text-center text-sm text-slate-500">
              Loading QC-passed orders...
            </div>

          ) : readyOrders.length ===
            0 ? (

            <div className="p-10 text-center">

              <div className="text-4xl">
                ✅
              </div>

              <div className="mt-3 font-black">
                No orders currently waiting for Dispatch
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Once Quality Control is saved as Pass, the order will appear here.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px] text-left text-sm">

                <thead>

                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                    <th className="px-4 py-4">
                      Order
                    </th>

                    <th className="px-4 py-4">
                      Customer
                    </th>

                    <th className="px-4 py-4">
                      QC
                    </th>

                    <th className="px-4 py-4">
                      Inspected
                    </th>

                    <th className="px-4 py-4">
                      Passed
                    </th>

                    <th className="px-4 py-4">
                      QC Date
                    </th>

                    <th className="px-4 py-4">
                      Result
                    </th>

                    <th className="px-4 py-4">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {readyOrders.map(
                    (
                      order
                    ) => {
                      const qc =
                        qualityRecords
                          .filter(
                            (
                              quality
                            ) =>
                              qualityBelongsToOrder(
                                quality,
                                order
                              ) &&
                              isQualityPassed(
                                quality
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
                          )[0];

                      const customer =
                        customers.find(
                          (
                            row
                          ) =>
                            sameText(
                              row.id,
                              order.customerId
                            )
                        );

                      return (

                        <tr
                          key={
                            order.id ||
                            order.orderNumber
                          }
                          className="border-b last:border-0 hover:bg-green-50/40"
                        >

                          <td className="px-4 py-4">

                            <div className="font-black text-blue-700">
                              {
                                order.orderNumber
                              }
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                              {
                                order.status ||
                                "—"
                              }
                            </div>

                          </td>

                          <td className="px-4 py-4">

                            <div className="font-bold">
                              {customer?.name ||
                                order.customerName ||
                                qc?.customerName ||
                                "—"}
                            </div>

                            {customer?.businessName && (

                              <div className="mt-1 text-xs text-slate-500">
                                {
                                  customer.businessName
                                }
                              </div>

                            )}

                          </td>

                          <td className="px-4 py-4">

                            <div className="font-bold">
                              {
                                qc?.qcNumber ||
                                qc?.id ||
                                "QC Passed"
                              }
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {
                                qc?.inspectorName ||
                                "—"
                              }
                            </div>

                          </td>

                          <td className="px-4 py-4 font-bold">
                            {
                              qc?.inspectedQuantity ||
                              0
                            }
                          </td>

                          <td className="px-4 py-4 font-black text-green-700">
                            {
                              qc?.passedQuantity ||
                              0
                            }
                          </td>

                          <td className="px-4 py-4">
                            {formatDate(
                              qc?.inspectionDate ||
                              qc?.qcDate ||
                              ""
                            )}
                          </td>

                          <td className="px-4 py-4">

                            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                              {qc?.qcStatus ||
                                qc?.result ||
                                qc?.status ||
                                "Pass"}
                            </span>

                          </td>

                          <td className="px-4 py-4">

                            <button
                              type="button"
                              onClick={() =>
                                void openCreate(
                                  order.id
                                )
                              }
                              className="rounded-xl bg-green-700 px-4 py-2 text-xs font-black text-white hover:bg-green-800"
                            >
                              Create Dispatch
                            </button>

                          </td>

                        </tr>

                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* =================================================
            EXISTING DISPATCHES
        ================================================= */}

        <div>

          <div className="mb-3">

            <h2 className="text-xl font-black">
              Dispatch Tracking
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Dispatches already created and currently being tracked.
            </p>

          </div>

          {/* FILTER */}

          <div className="mb-4 grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">

            <input
              value={
                search
              }
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search dispatch, order, customer or tracking..."
              className="rounded-xl border px-4 py-3 text-sm"
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
              className="rounded-xl border bg-white px-4 py-3 text-sm"
            >

              <option value="All">
                All Statuses
              </option>

              {DISPATCH_STATUSES.map(
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

          </div>

          {/* TABLE */}

          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

            {loading ? (

              <div className="p-12 text-center text-sm text-slate-500">
                Loading Dispatch records...
              </div>

            ) : filteredDispatches.length ===
              0 ? (

              <div className="p-12 text-center">

                <div className="text-5xl">
                  🚚
                </div>

                <div className="mt-4 text-lg font-black">
                  No Dispatch records yet
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Use Create Dispatch above for a QC-passed order.
                </p>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1050px] text-left text-sm">

                  <thead>

                    <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                      <th className="px-4 py-4">
                        Dispatch
                      </th>

                      <th className="px-4 py-4">
                        Order
                      </th>

                      <th className="px-4 py-4">
                        Customer
                      </th>

                      <th className="px-4 py-4">
                        Date
                      </th>

                      <th className="px-4 py-4">
                        Mode
                      </th>

                      <th className="px-4 py-4">
                        Tracking
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

                    {filteredDispatches.map(
                      (
                        dispatch
                      ) => {

                        const customer =
                          customers.find(
                            (
                              row
                            ) =>
                              sameText(
                                row.id,
                                dispatch.customerId
                              )
                          );

                        return (

                          <tr
                            key={
                              dispatch.id
                            }
                            className="border-b last:border-0 hover:bg-slate-50"
                          >

                            <td className="px-4 py-4 font-black text-blue-700">
                              {
                                dispatch.dispatchNumber
                              }
                            </td>

                            <td className="px-4 py-4 font-bold">
                              {
                                dispatch.orderNumber ||
                                "—"
                              }
                            </td>

                            <td className="px-4 py-4">

                              <div className="font-bold">
                                {customer?.name ||
                                  dispatch.customerName ||
                                  "—"}
                              </div>

                              {customer?.businessName && (

                                <div className="mt-1 text-xs text-slate-500">
                                  {
                                    customer.businessName
                                  }
                                </div>

                              )}

                            </td>

                            <td className="px-4 py-4">
                              {formatDate(
                                dispatch.dispatchDate
                              )}
                            </td>

                            <td className="px-4 py-4">
                              {
                                dispatch.shippingMode ||
                                "—"
                              }
                            </td>

                            <td className="px-4 py-4">

                              <div className="font-semibold">
                                {
                                  dispatch.trackingNumber ||
                                  "—"
                                }
                              </div>

                              {dispatch.courierName && (

                                <div className="mt-1 text-xs text-slate-500">
                                  {
                                    dispatch.courierName
                                  }
                                </div>

                              )}

                            </td>

                            <td className="px-4 py-4">

                              <StatusBadge
                                status={
                                  dispatch.status
                                }
                              />

                            </td>

                            <td className="px-4 py-4">

                              <div className="flex gap-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    setViewing(
                                      dispatch
                                    )
                                  }
                                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                                >
                                  View
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openEdit(
                                      dispatch
                                    )
                                  }
                                  className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void deleteDispatch(
                                      dispatch
                                    )
                                  }
                                  className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600"
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

      </div>

      {/* =================================================
          NEW / EDIT DISPATCH
      ================================================= */}

      {showForm && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">

          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">

            <div className="my-6 flex max-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex shrink-0 items-start justify-between border-b px-6 py-5">

                <div>

                  <h2 className="text-2xl font-black">
                    {editing
                      ? `Edit ${editing.dispatchNumber}`
                      : "New Dispatch"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Only orders with a passed Quality Control inspection can be dispatched.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closeForm
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
                    title="QC Passed Order"
                    description="Select an order released by Quality Control."
                  >

                    <Field
                      label="Order *"
                      caption={`${readyOrders.length} QC-passed order${readyOrders.length === 1 ? "" : "s"} available.`}
                    >

                      <select
                        value={
                          form.orderId
                        }
                        onChange={(e) =>
                          updateForm(
                            "orderId",
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
                          Select QC Passed Order
                        </option>

                        {readyOrders.map(
                          (
                            order
                          ) => {

                            const customer =
                              customers.find(
                                (
                                  row
                                ) =>
                                  sameText(
                                    row.id,
                                    order.customerId
                                  )
                              );

                            return (

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
                                {customer?.name ||
                                  order.customerName ||
                                  "Customer"}
                                {" — QC Passed"}
                              </option>

                            );
                          }
                        )}

                      </select>

                    </Field>

                  </Section>

                  {/* QC */}

                  {selectedQuality && (

                    <Section
                      title="Quality Control"
                      description="Passed inspection linked to the selected Order."
                    >

                      <div className="grid gap-4 rounded-xl border border-green-100 bg-green-50 p-4 sm:grid-cols-2 lg:grid-cols-4">

                        <Info
                          label="QC Number"
                          value={
                            selectedQuality.qcNumber ||
                            selectedQuality.id
                          }
                        />

                        <Info
                          label="QC Result"
                          value={
                            selectedQuality.qcStatus ||
                            selectedQuality.result ||
                            selectedQuality.status ||
                            "Pass"
                          }
                        />

                        <Info
                          label="Inspected"
                          value={String(
                            selectedQuality.inspectedQuantity ||
                            0
                          )}
                        />

                        <Info
                          label="Passed"
                          value={String(
                            selectedQuality.passedQuantity ||
                            0
                          )}
                        />

                        <Info
                          label="QC Date"
                          value={
                            formatDate(
                              selectedQuality.inspectionDate ||
                              selectedQuality.qcDate
                            )
                          }
                        />

                        <Info
                          label="Inspector"
                          value={
                            selectedQuality.inspectorName
                          }
                        />

                        <Info
                          label="Rejected"
                          value={String(
                            selectedQuality.rejectedQuantity ||
                            0
                          )}
                        />

                        <Info
                          label="QC Record ID"
                          value={
                            selectedQuality.id
                          }
                        />

                      </div>

                    </Section>

                  )}

                  {/* ORDER */}

                  {selectedOrder && (

                    <Section
                      title="Order"
                      description="Order information linked to this dispatch."
                    >

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                        <Info
                          label="Order"
                          value={
                            selectedOrder.orderNumber
                          }
                        />

                        <Info
                          label="Order Status"
                          value={
                            selectedOrder.status
                          }
                        />

                        <Info
                          label="Required Delivery"
                          value={
                            formatDate(
                              selectedOrder.deliveryDate
                            )
                          }
                        />

                        <Info
                          label="Quotation"
                          value={
                            selectedOrder.quotationNumber
                          }
                        />

                      </div>

                    </Section>

                  )}

                  {/* CUSTOMER */}

                  {selectedCustomer && (

                    <Section
                      title="Customer & Delivery"
                      description="Customer details are fetched from Customers."
                    >

                      <div className="grid gap-4 sm:grid-cols-2">

                        <Info
                          label="Customer"
                          value={
                            selectedCustomer.name
                          }
                        />

                        <Info
                          label="Business"
                          value={
                            selectedCustomer.businessName
                          }
                        />

                        <Info
                          label="Contact Person"
                          value={
                            selectedCustomer.contactPerson
                          }
                        />

                        <Info
                          label="Phone"
                          value={
                            selectedCustomer.phone
                          }
                        />

                        <div className="sm:col-span-2">

                          <Info
                            label="Delivery Address"
                            value={
                              fullAddress(
                                selectedCustomer
                              )
                            }
                          />

                        </div>

                      </div>

                    </Section>

                  )}

                  {/* SHIPPING */}

                  <Section
                    title="Shipping Details"
                    description="Record shipment and logistics information."
                  >

                    <div className="grid gap-5 sm:grid-cols-2">

                      <Field
                        label="Dispatch Date *"
                        caption="Date the completed order leaves your business."
                      >

                        <input
                          type="date"
                          value={
                            form.dispatchDate
                          }
                          onChange={(e) =>
                            updateForm(
                              "dispatchDate",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Shipping Mode"
                        caption="Method used to send the order."
                      >

                        <select
                          value={
                            form.shippingMode
                          }
                          onChange={(e) =>
                            updateForm(
                              "shippingMode",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >

                          {SHIPPING_MODES.map(
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
                        label="Courier / Transporter"
                        caption="Courier, transporter or logistics company."
                      >

                        <input
                          value={
                            form.courierName
                          }
                          onChange={(e) =>
                            updateForm(
                              "courierName",
                              e.target.value
                            )
                          }
                          placeholder="Example: Blue Dart"
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Tracking / LR Number"
                        caption="Courier tracking or transport LR number."
                      >

                        <input
                          value={
                            form.trackingNumber
                          }
                          onChange={(e) =>
                            updateForm(
                              "trackingNumber",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Packages"
                        caption="Number of cartons/packages."
                      >

                        <input
                          type="number"
                          min="1"
                          value={
                            form.packageCount
                          }
                          onChange={(e) =>
                            updateForm(
                              "packageCount",
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Weight (kg)"
                        caption="Approximate shipment weight."
                      >

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            form.totalWeight
                          }
                          onChange={(e) =>
                            updateForm(
                              "totalWeight",
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                    </div>

                  </Section>

                  {/* DRIVER */}

                  <Section
                    title="Vehicle / Driver"
                    description="Optional for local delivery or company vehicle."
                  >

                    <div className="grid gap-5 sm:grid-cols-3">

                      <Field
                        label="Vehicle Number"
                        caption="Vehicle registration number."
                      >

                        <input
                          value={
                            form.vehicleNumber
                          }
                          onChange={(e) =>
                            updateForm(
                              "vehicleNumber",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Driver Name"
                        caption="Driver or delivery person."
                      >

                        <input
                          value={
                            form.driverName
                          }
                          onChange={(e) =>
                            updateForm(
                              "driverName",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Driver Phone"
                        caption="Driver contact number."
                      >

                        <input
                          value={
                            form.driverPhone
                          }
                          onChange={(e) =>
                            updateForm(
                              "driverPhone",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                    </div>

                  </Section>

                  {/* STATUS */}

                  <Section
                    title="Dispatch Status"
                    description="Order workflow is synchronized automatically."
                  >

                    <Field
                      label="Status"
                      caption="Delivered automatically marks the linked Order as Completed."
                    >

                      <select
                        value={
                          form.status
                        }
                        onChange={(e) =>
                          updateForm(
                            "status",
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      >

                        {DISPATCH_STATUSES.map(
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

                  </Section>

                  {/* NOTES */}

                  <Section
                    title="Notes"
                    description="Optional dispatch or delivery instructions."
                  >

                    <Field
                      label="Dispatch Notes"
                      caption="Example: Call customer before delivery."
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

                  </Section>

                </div>

              </div>

              {/* FOOTER */}

              <div className="flex shrink-0 justify-end gap-3 border-t bg-white px-6 py-4">

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border px-5 py-3 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void saveDispatch()
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update Dispatch"
                    : "Create Dispatch"}
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

          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">

            <div className="my-6 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">

              <div className="flex items-start justify-between border-b px-6 py-5">

                <div>

                  <div className="text-xs font-bold uppercase text-blue-600">
                    Dispatch
                  </div>

                  <h2 className="mt-1 text-2xl font-black">
                    {
                      viewing.dispatchNumber
                    }
                  </h2>

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

              <div className="space-y-5 p-6">

                <div className="grid gap-4 rounded-xl bg-slate-50 p-5 sm:grid-cols-3">

                  <Info
                    label="Order"
                    value={
                      viewing.orderNumber
                    }
                  />

                  <Info
                    label="Dispatch Date"
                    value={
                      formatDate(
                        viewing.dispatchDate
                      )
                    }
                  />

                  <Info
                    label="Status"
                    value={
                      viewing.status
                    }
                  />

                </div>

                <Section
                  title="Quality Control"
                  description="QC inspection that released this order for dispatch."
                >

                  <div className="grid gap-4 sm:grid-cols-2">

                    <Info
                      label="QC Number"
                      value={
                        viewing.qcNumber
                      }
                    />

                    <Info
                      label="QC Result"
                      value={
                        viewing.qcResult
                      }
                    />

                    <Info
                      label="QC Date"
                      value={
                        formatDate(
                          viewing.qcDate
                        )
                      }
                    />

                    <Info
                      label="Inspector"
                      value={
                        viewing.qcInspector
                      }
                    />

                  </div>

                </Section>

                <Section
                  title="Shipment"
                  description="Transport and tracking information."
                >

                  <div className="grid gap-4 sm:grid-cols-2">

                    <Info
                      label="Shipping Mode"
                      value={
                        viewing.shippingMode
                      }
                    />

                    <Info
                      label="Courier"
                      value={
                        viewing.courierName
                      }
                    />

                    <Info
                      label="Tracking"
                      value={
                        viewing.trackingNumber
                      }
                    />

                    <Info
                      label="Packages"
                      value={String(
                        viewing.packageCount ||
                        0
                      )}
                    />

                    <Info
                      label="Weight"
                      value={`${viewing.totalWeight || 0} kg`}
                    />

                    <Info
                      label="Vehicle"
                      value={
                        viewing.vehicleNumber
                      }
                    />

                  </div>

                </Section>

              </div>

              <div className="flex justify-end border-t px-6 py-4">

                <button
                  type="button"
                  onClick={() =>
                    setViewing(
                      null
                    )
                  }
                  className="rounded-xl border px-5 py-3 font-semibold"
                >
                  Close
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
    <div className="rounded-2xl border bg-slate-50/50 p-5">

      <div className="mb-5">

        <h3 className="font-black">
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

      <div className="mt-1 break-words font-bold text-slate-900">
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
  value: number;
  caption: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">

      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-2xl font-black">
        {value}
      </div>

      <div className="mt-1 text-xs text-slate-400">
        {caption}
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
    "Delivered"
  ) {
    style =
      "bg-green-100 text-green-700";
  } else if (
    status ===
      "Dispatched" ||
    status ===
      "In Transit"
  ) {
    style =
      "bg-blue-100 text-blue-700";
  } else if (
    status ===
    "Out for Delivery"
  ) {
    style =
      "bg-purple-100 text-purple-700";
  } else if (
    status ===
    "Preparing"
  ) {
    style =
      "bg-yellow-100 text-yellow-700";
  } else if (
    status ===
      "Delivery Failed" ||
    status ===
      "Returned" ||
    status ===
      "Cancelled"
  ) {
    style =
      "bg-red-100 text-red-700";
  }

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${style}`}
    >
      {status ||
        "—"}
    </span>
  );
}
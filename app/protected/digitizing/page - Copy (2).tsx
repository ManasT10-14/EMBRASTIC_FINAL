"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* =========================================================
   SHEET NAMES

   IMPORTANT:
   If your Excel artwork sheet uses another exact name,
   change ARTWORK_SHEET only.
========================================================= */

const ARTWORK_SHEET = "Artwork";
const DIGITIZING_SHEET = "Digitizing";

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

type ArtworkRecord = {
  id: string;

  artworkNumber: string;

  orderId: string;
  orderNumber: string;

  customerId: string;
  customerName: string;

  designName: string;

  artworkFile: string;
  artworkFileName: string;
  artworkFileUrl: string;

  status: string;
  artworkStatus: string;
  designStatus: string;

  width: number;
  height: number;

  placement: string;

  colors: string;
  threadColors: string;

  notes: string;

  createdAt: string;

  [key: string]: any;
};

type DigitizingRecord = {
  id: string;

  digitizingNumber: string;

  artworkId: string;
  artworkNumber: string;

  orderId: string;
  orderNumber: string;

  customerId: string;
  customerName: string;

  designName: string;

  digitizerName: string;

  digitizingDate: string;

  stitchCount: number;

  width: number;
  height: number;

  machineFormat: string;
  embroideryType: string;

  needleCount: number;
  colorCount: number;

  density: number;
  underlayType: string;
  pullCompensation: string;

  fileName: string;
  digitizedFile: string;
  digitizedFileUrl: string;

  status: string;

  notes: string;

  createdAt: string;

  [key: string]: any;
};

type DigitizingForm = {
  artworkId: string;

  digitizingDate: string;

  digitizerName: string;

  stitchCount: number;

  width: number;
  height: number;

  machineFormat: string;

  embroideryType: string;

  needleCount: number;
  colorCount: number;

  density: number;

  underlayType: string;

  pullCompensation: string;

  fileName: string;
  digitizedFileUrl: string;

  status: string;

  notes: string;
};

/* =========================================================
   OPTIONS
========================================================= */

const DIGITIZING_STATUSES = [
  "Pending",
  "In Progress",
  "Revision Required",
  "On Hold",
  "Completed",
  "Cancelled",
];

const MACHINE_FORMATS = [
  "DST",
  "PES",
  "EXP",
  "JEF",
  "VP3",
  "XXX",
  "HUS",
  "SEW",
  "PCS",
  "Other",
];

const EMBROIDERY_TYPES = [
  "Flat Embroidery",
  "3D Puff Embroidery",
  "Applique Embroidery",
  "Chenille Embroidery",
  "Patch / Badge",
  "Monogram",
  "Name Embroidery",
  "Cap Embroidery",
  "Other",
];

const UNDERLAY_TYPES = [
  "Edge Run",
  "Center Run",
  "Zigzag",
  "Double Zigzag",
  "Tatami Underlay",
  "Combination",
  "None",
];

const PULL_COMPENSATION_OPTIONS = [
  "0.1 mm",
  "0.2 mm",
  "0.3 mm",
  "0.4 mm",
  "0.5 mm",
  "0.6 mm",
  "Custom",
];

/* =========================================================
   STATIC EMPTY FORM

   IMPORTANT:
   Do not call new Date(), Date.now(), Math.random(),
   or crypto.randomUUID() from this function.
========================================================= */

function emptyForm(): DigitizingForm {
  return {
    artworkId: "",

    digitizingDate: "",

    digitizerName: "",

    stitchCount: 0,

    width: 0,
    height: 0,

    machineFormat: "DST",

    embroideryType:
      "Flat Embroidery",

    needleCount: 1,
    colorCount: 1,

    density: 0.4,

    underlayType:
      "Edge Run",

    pullCompensation:
      "0.2 mm",

    fileName: "",
    digitizedFileUrl: "",

    status: "Pending",

    notes: "",
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
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getToday() {
  return new Date()
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

  return `id-${Math.random()
    .toString(36)
    .substring(2, 10)}-${Math.random()
    .toString(36)
    .substring(2, 10)}`;
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

/* =========================================================
   ARTWORK READY CHECK

   Main fix:
   Do not depend on one exact case-sensitive string.
========================================================= */

function isArtworkReadyForDigitizing(
  artwork: ArtworkRecord
) {
  const statuses = [
    artwork.status,
    artwork.artworkStatus,
    artwork.designStatus,
  ]
    .map(normalizeText)
    .filter(Boolean);

  const accepted = [
    "ready for digitizing",
    "ready for digitising",
    "ready to digitize",
    "ready to digitise",
    "ready for digitize",
    "ready for digitise",
  ];

  return statuses.some(
    (status) =>
      accepted.includes(
        status
      )
  );
}

function isDigitizingCompleted(
  value: unknown
) {
  return [
    "completed",
    "complete",
    "digitizing completed",
    "digitising completed",
  ].includes(
    normalizeText(value)
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
        row?.businessName ??
          row?.companyName
      ),

    contactPerson:
      clean(
        row?.contactPerson
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
      ),

    items:
      clean(
        row?.items
      ),

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
      clean(
        row?.notes
      ),

    createdAt:
      clean(
        row?.createdAt
      ),
  };
}

function normalizeArtwork(
  row: any
): ArtworkRecord {
  return {
    ...row,

    id:
      clean(
        row?.id
      ),

    artworkNumber:
      clean(
        row?.artworkNumber ??
          row?.designNumber
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
        row?.customerName ??
          row?.customer
      ),

    designName:
      clean(
        row?.designName ??
          row?.artworkName ??
          row?.name
      ),

    artworkFile:
      clean(
        row?.artworkFile ??
          row?.file
      ),

    artworkFileName:
      clean(
        row?.artworkFileName ??
          row?.fileName
      ),

    artworkFileUrl:
      clean(
        row?.artworkFileUrl ??
          row?.fileUrl ??
          row?.artworkUrl
      ),

    /*
     * Read every likely status field.
     */
    status:
      clean(
        row?.status
      ),

    artworkStatus:
      clean(
        row?.artworkStatus
      ),

    designStatus:
      clean(
        row?.designStatus
      ),

    width:
      Number(
        row?.width ??
          row?.designWidth ??
          0
      ),

    height:
      Number(
        row?.height ??
          row?.designHeight ??
          0
      ),

    placement:
      clean(
        row?.placement
      ),

    colors:
      clean(
        row?.colors ??
          row?.colourCount
      ),

    threadColors:
      clean(
        row?.threadColors ??
          row?.threadColours
      ),

    notes:
      clean(
        row?.notes ??
          row?.remarks
      ),

    createdAt:
      clean(
        row?.createdAt
      ),
  };
}

function normalizeDigitizing(
  row: any
): DigitizingRecord {
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

    artworkId:
      clean(
        row?.artworkId ??
          row?.designId
      ),

    artworkNumber:
      clean(
        row?.artworkNumber ??
          row?.designNumber
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
        row?.designName ??
          row?.artworkName
      ),

    digitizerName:
      clean(
        row?.digitizerName ??
          row?.digitiserName ??
          row?.assignedTo
      ),

    digitizingDate:
      clean(
        row?.digitizingDate ??
          row?.digitisingDate ??
          row?.date
      ).split("T")[0],

    stitchCount:
      Number(
        row?.stitchCount ??
          row?.stitches ??
          0
      ),

    width:
      Number(
        row?.width ??
          row?.designWidth ??
          0
      ),

    height:
      Number(
        row?.height ??
          row?.designHeight ??
          0
      ),

    machineFormat:
      clean(
        row?.machineFormat ??
          row?.fileFormat
      ) || "DST",

    embroideryType:
      clean(
        row?.embroideryType
      ) ||
      "Flat Embroidery",

    needleCount:
      Number(
        row?.needleCount ??
          1
      ),

    colorCount:
      Number(
        row?.colorCount ??
          row?.colourCount ??
          1
      ),

    density:
      Number(
        row?.density ??
          0.4
      ),

    underlayType:
      clean(
        row?.underlayType
      ) || "Edge Run",

    pullCompensation:
      clean(
        row?.pullCompensation
      ) || "0.2 mm",

    fileName:
      clean(
        row?.fileName ??
          row?.digitizedFileName
      ),

    digitizedFile:
      clean(
        row?.digitizedFile ??
          row?.digitisedFile
      ),

    digitizedFileUrl:
      clean(
        row?.digitizedFileUrl ??
          row?.digitisedFileUrl ??
          row?.fileUrl
      ),

    status:
      clean(
        row?.status ??
          row?.digitizingStatus ??
          row?.digitisingStatus
      ) || "Pending",

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

export default function DigitizingPage() {
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
    artworks,
    setArtworks,
  ] =
    useState<
      ArtworkRecord[]
    >([]);

  const [
    digitizingRecords,
    setDigitizingRecords,
  ] =
    useState<
      DigitizingRecord[]
    >([]);

  const [
    form,
    setForm,
  ] =
    useState<DigitizingForm>(
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
    showForm,
    setShowForm,
  ] =
    useState(false);

  const [
    editing,
    setEditing,
  ] =
    useState<
      DigitizingRecord | null
    >(null);

  const [
    viewing,
    setViewing,
  ] =
    useState<
      DigitizingRecord | null
    >(null);

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

     Current date is set only after mount.
  ======================================================= */

  useEffect(() => {
    const today =
      getToday();

    setForm(
      (current) => ({
        ...current,

        digitizingDate:
          today,
      })
    );

    void loadData();
  }, []);

  /* =======================================================
     BODY SCROLL LOCK
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

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
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
      !data.success
    ) {
      console.error(
        "Excel request failed:",
        {
          status:
            response.status,

          request:
            body,

          response:
            data,
        }
      );

      throw new Error(
        data?.message ||
          data?.error ||
          "Failed to process Excel request."
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
        artworkRows,
        digitizingRows,
      ] =
        await Promise.all([
          loadSheet(
            "Customers"
          ),

          loadSheet(
            "Orders"
          ),

          loadSheet(
            ARTWORK_SHEET
          ),

          loadSheet(
            DIGITIZING_SHEET
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
                row.id &&
                  row.orderNumber
              )
          );

      const loadedArtworks =
        artworkRows
          .map(
            normalizeArtwork
          )
          .filter(
            (
              row:
                ArtworkRecord
            ) =>
              Boolean(
                row.id
              )
          );

      const loadedDigitizing =
        digitizingRows
          .map(
            normalizeDigitizing
          )
          .filter(
            (
              row:
                DigitizingRecord
            ) =>
              Boolean(
                row.id
              )
          )
          .sort(
            (
              a:
                DigitizingRecord,
              b:
                DigitizingRecord
            ) =>
              String(
                b.createdAt
              ).localeCompare(
                String(
                  a.createdAt
                )
              )
          );

      setCustomers(
        loadedCustomers
      );

      setOrders(
        loadedOrders
      );

      setArtworks(
        loadedArtworks
      );

      setDigitizingRecords(
        loadedDigitizing
      );
    } catch (error) {
      console.error(
        "Digitizing load error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load Digitizing page."
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
     ELIGIBLE ARTWORK

     MAIN FIX:
     Only Artwork records whose ARTWORK status says
     Ready for Digitizing are shown.
  ======================================================= */

  const eligibleArtworks =
    useMemo(() => {
      return artworks
        .filter(
          (
            artwork
          ) =>
            isArtworkReadyForDigitizing(
              artwork
            )
        )
        .filter(
          (
            artwork
          ) => {
            /*
             * Prevent duplicate Digitizing jobs
             * for the same artwork.
             */
            const existing =
              digitizingRecords.find(
                (
                  digitizing
                ) =>
                  (
                    digitizing.artworkId &&
                    digitizing.artworkId ===
                      artwork.id
                  ) ||
                  (
                    !digitizing.artworkId &&
                    digitizing.orderId &&
                    artwork.orderId &&
                    digitizing.orderId ===
                      artwork.orderId
                  )
              );

            if (!existing) {
              return true;
            }

            /*
             * Keep available while editing the
             * existing Digitizing record.
             */
            return (
              editing?.id ===
              existing.id
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
      artworks,
      digitizingRecords,
      editing,
    ]);

  /* =======================================================
     SELECTED RECORDS
  ======================================================= */

  const selectedArtwork =
    useMemo(
      () =>
        artworks.find(
          (
            artwork
          ) =>
            artwork.id ===
            form.artworkId
        ),
      [
        artworks,
        form.artworkId,
      ]
    );

  const selectedOrder =
    useMemo(() => {
      if (
        !selectedArtwork
      ) {
        return undefined;
      }

      return orders.find(
        (
          order
        ) =>
          (
            selectedArtwork.orderId &&
            order.id ===
              selectedArtwork.orderId
          ) ||
          (
            selectedArtwork.orderNumber &&
            order.orderNumber ===
              selectedArtwork.orderNumber
          )
      );
    }, [
      selectedArtwork,
      orders,
    ]);

  const selectedCustomer =
    useMemo(() => {
      const customerId =
        selectedArtwork
          ?.customerId ||
        selectedOrder
          ?.customerId;

      if (!customerId) {
        return undefined;
      }

      return customers.find(
        (
          customer
        ) =>
          customer.id ===
          customerId
      );
    }, [
      customers,
      selectedArtwork,
      selectedOrder,
    ]);

  /* =======================================================
     FILTER DIGITIZING RECORDS
  ======================================================= */

  const filteredRecords =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return digitizingRecords.filter(
        (
          digitizing
        ) => {
          const customer =
            customers.find(
              (
                row
              ) =>
                row.id ===
                digitizing.customerId
            );

          const statusMatches =
            statusFilter ===
              "All" ||
            normalizeText(
              digitizing.status
            ) ===
              normalizeText(
                statusFilter
              );

          const searchMatches =
            !query ||
            [
              digitizing.digitizingNumber,
              digitizing.orderNumber,
              digitizing.customerName,
              customer?.name,
              customer?.businessName,
              digitizing.designName,
              digitizing.digitizerName,
              digitizing.status,
              digitizing.machineFormat,
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
      digitizingRecords,
      customers,
      search,
      statusFilter,
    ]);

  /* =======================================================
     STATS
  ======================================================= */

  const stats =
    useMemo(() => {
      return {
        ready:
          eligibleArtworks.length,

        pending:
          digitizingRecords.filter(
            (
              row
            ) =>
              normalizeText(
                row.status
              ) ===
              "pending"
          ).length,

        inProgress:
          digitizingRecords.filter(
            (
              row
            ) =>
              normalizeText(
                row.status
              ) ===
              "in progress"
          ).length,

        completed:
          digitizingRecords.filter(
            (
              row
            ) =>
              isDigitizingCompleted(
                row.status
              )
          ).length,
      };
    }, [
      eligibleArtworks,
      digitizingRecords,
    ]);

  /* =======================================================
     FORM HELPERS
  ======================================================= */

  function updateForm<
    K extends keyof DigitizingForm
  >(
    field: K,
    value:
      DigitizingForm[K]
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

  function selectArtwork(
    artworkId: string
  ) {
    const artwork =
      artworks.find(
        (
          row
        ) =>
          row.id ===
          artworkId
      );

    setForm(
      (
        current
      ) => ({
        ...current,

        artworkId,

        width:
          artwork?.width ||
          current.width,

        height:
          artwork?.height ||
          current.height,

        colorCount:
          Number(
            artwork?.colors
          ) ||
          current.colorCount,
      })
    );
  }

  async function openCreate() {
    await loadData(
      true
    );

    setEditing(
      null
    );

    setForm({
      ...emptyForm(),

      digitizingDate:
        getToday(),
    });

    setShowForm(
      true
    );
  }

  function openEdit(
    record:
      DigitizingRecord
  ) {
    setEditing(
      record
    );

    setForm({
      artworkId:
        record.artworkId,

      digitizingDate:
        record.digitizingDate ||
        getToday(),

      digitizerName:
        record.digitizerName,

      stitchCount:
        record.stitchCount,

      width:
        record.width,

      height:
        record.height,

      machineFormat:
        record.machineFormat ||
        "DST",

      embroideryType:
        record.embroideryType ||
        "Flat Embroidery",

      needleCount:
        record.needleCount ||
        1,

      colorCount:
        record.colorCount ||
        1,

      density:
        record.density ||
        0.4,

      underlayType:
        record.underlayType ||
        "Edge Run",

      pullCompensation:
        record.pullCompensation ||
        "0.2 mm",

      fileName:
        record.fileName,

      digitizedFileUrl:
        record.digitizedFileUrl,

      status:
        record.status ||
        "Pending",

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
     DIGITIZING NUMBER
  ======================================================= */

  function nextDigitizingNumber(
    year: number
  ) {
    let max = 0;

    const prefix =
      `DIG-${year}-`;

    digitizingRecords.forEach(
      (
        digitizing
      ) => {
        if (
          !digitizing
            .digitizingNumber
            .startsWith(
              prefix
            )
        ) {
          return;
        }

        const match =
          digitizing
            .digitizingNumber
            .match(
              /(\d+)$/
            );

        if (match) {
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

    return `DIG-${year}-${String(
      max + 1
    ).padStart(
      4,
      "0"
    )}`;
  }

  /* =======================================================
     SAVE
  ======================================================= */

  async function saveDigitizing() {
    const artwork =
      artworks.find(
        (
          row
        ) =>
          row.id ===
          form.artworkId
      );

    if (!artwork) {
      alert(
        "Please select an Artwork that is Ready for Digitizing."
      );

      return;
    }

    /*
     * Re-check artwork status during save.
     */
    if (
      !editing &&
      !isArtworkReadyForDigitizing(
        artwork
      )
    ) {
      alert(
        `${artwork.designName || artwork.orderNumber} is not currently marked Ready for Digitizing.`
      );

      return;
    }

    const order =
      orders.find(
        (
          row
        ) =>
          (
            artwork.orderId &&
            row.id ===
              artwork.orderId
          ) ||
          (
            artwork.orderNumber &&
            row.orderNumber ===
              artwork.orderNumber
          )
      );

    if (!order) {
      alert(
        "The Order linked to this Artwork could not be found."
      );

      return;
    }

    const customer =
      customers.find(
        (
          row
        ) =>
          row.id ===
          (
            artwork.customerId ||
            order.customerId
          )
      );

    if (!customer) {
      alert(
        "The Customer linked to this Artwork could not be found."
      );

      return;
    }

    if (
      !form.digitizingDate
    ) {
      alert(
        "Digitizing Date is required."
      );

      return;
    }

    if (
      !form.digitizerName.trim()
    ) {
      alert(
        "Digitizer Name is required."
      );

      return;
    }

    if (
      form.stitchCount <
      0
    ) {
      alert(
        "Stitch Count cannot be negative."
      );

      return;
    }

    /*
     * Duplicate protection.
     */
    const duplicate =
      digitizingRecords.find(
        (
          digitizing
        ) =>
          digitizing.artworkId ===
            artwork.id &&
          digitizing.id !==
            editing?.id
      );

    if (duplicate) {
      alert(
        `This Artwork is already linked to ${duplicate.digitizingNumber}.`
      );

      return;
    }

    try {
      setSaving(
        true
      );

      const year =
        Number(
          form.digitizingDate.slice(
            0,
            4
          )
        );

      if (!year) {
        throw new Error(
          "Invalid Digitizing Date."
        );
      }

      const digitizingNumber =
        editing
          ? editing.digitizingNumber
          : nextDigitizingNumber(
              year
            );

      const record = {
        digitizingNumber,

        /*
         * Exact upstream linkage.
         */
        artworkId:
          artwork.id,

        artworkNumber:
          artwork.artworkNumber,

        orderId:
          order.id,

        orderNumber:
          order.orderNumber,

        customerId:
          customer.id,

        customerName:
          customer.name,

        designName:
          artwork.designName,

        digitizingDate:
          form.digitizingDate,

        digitizerName:
          form.digitizerName.trim(),

        stitchCount:
          Number(
            form.stitchCount ||
              0
          ),

        width:
          Number(
            form.width ||
              0
          ),

        height:
          Number(
            form.height ||
              0
          ),

        machineFormat:
          form.machineFormat,

        embroideryType:
          form.embroideryType,

        needleCount:
          Number(
            form.needleCount ||
              0
          ),

        colorCount:
          Number(
            form.colorCount ||
              0
          ),

        density:
          Number(
            form.density ||
              0
          ),

        underlayType:
          form.underlayType,

        pullCompensation:
          form.pullCompensation,

        fileName:
          form.fileName.trim(),

        digitizedFileUrl:
          form.digitizedFileUrl.trim(),

        status:
          form.status,

        notes:
          form.notes.trim(),
      };

      if (editing) {
        await saveExcel({
          action:
            "update",

          sheet:
            DIGITIZING_SHEET,

          id:
            editing.id,

          /*
           * Keep update payload flat.
           */
          record,
        });
      } else {
        await saveExcel({
          action:
            "add",

          sheet:
            DIGITIZING_SHEET,

          record: {
            id:
              generateId(),

            ...record,

            createdAt:
              new Date()
                .toISOString(),
          },
        });
      }

      /* ===================================================
         UPDATE ORDER WORKFLOW
      =================================================== */

      let nextOrderStatus =
        order.status;

      if (
        form.status ===
        "Pending" ||
        form.status ===
        "In Progress"
      ) {
        nextOrderStatus =
          "Digitizing";
      }

      if (
        form.status ===
        "Revision Required"
      ) {
        nextOrderStatus =
          "Artwork";
      }

      if (
        form.status ===
        "Completed"
      ) {
        nextOrderStatus =
          "Production";
      }

      if (
        nextOrderStatus !==
        order.status
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
              nextOrderStatus,
          },
        });
      }

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

      if (
        form.status ===
        "Completed"
      ) {
        alert(
          `${digitizingNumber} saved successfully. Digitizing is Completed and Order ${order.orderNumber} can now move to Production.`
        );
      } else {
        alert(
          `${digitizingNumber} saved successfully.`
        );
      }
    } catch (error) {
      console.error(
        "Digitizing save error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to save Digitizing."
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

  async function deleteDigitizing(
    digitizing:
      DigitizingRecord
  ) {
    if (
      !confirm(
        `Delete ${digitizing.digitizingNumber}?`
      )
    ) {
      return;
    }

    try {
      await saveExcel({
        action:
          "delete",

        sheet:
          DIGITIZING_SHEET,

        id:
          digitizing.id,
      });

      await loadData(
        true
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete Digitizing record."
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

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>

            <h1 className="text-3xl font-black">
              Digitizing
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Digitize only artwork that has been approved and marked Ready for Digitizing.
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
              + New Digitizing
            </button>

          </div>

        </div>

        {/* WORKFLOW */}

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">

          <div className="flex items-start gap-3">

            <div className="text-2xl">
              🧵
            </div>

            <div>

              <div className="font-black text-blue-900">
                Artwork → Digitizing → Production
              </div>

              <p className="mt-1 text-sm leading-6 text-blue-700">
                Artwork appears here only after its Artwork & Designs status is
                <strong>
                  {" "}Ready for Digitizing
                </strong>
                . Digitizing marked
                <strong>
                  {" "}Completed{" "}
                </strong>
                can then move to Production.
              </p>

            </div>

          </div>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            label="Ready"
            value={
              stats.ready
            }
            caption="Artwork awaiting digitizing"
          />

          <StatCard
            label="Pending"
            value={
              stats.pending
            }
            caption="Digitizing pending"
          />

          <StatCard
            label="In Progress"
            value={
              stats.inProgress
            }
            caption="Currently digitizing"
          />

          <StatCard
            label="Completed"
            value={
              stats.completed
            }
            caption="Ready for production"
          />

        </div>

        {/* FILTER */}

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
            placeholder="Search digitizing, order, customer, design or digitizer..."
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

            {DIGITIZING_STATUSES.map(
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
              Loading Digitizing records...
            </div>

          ) : filteredRecords.length ===
            0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl">
                🧵
              </div>

              <div className="mt-4 text-lg font-black">
                No Digitizing records
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Artwork marked Ready for Digitizing will become available through New Digitizing.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1100px] text-left text-sm">

                <thead>

                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                    <th className="px-4 py-4">
                      Digitizing
                    </th>

                    <th className="px-4 py-4">
                      Order
                    </th>

                    <th className="px-4 py-4">
                      Customer
                    </th>

                    <th className="px-4 py-4">
                      Design
                    </th>

                    <th className="px-4 py-4">
                      Stitches
                    </th>

                    <th className="px-4 py-4">
                      Format
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

                  {filteredRecords.map(
                    (
                      record
                    ) => {

                      const customer =
                        customers.find(
                          (
                            row
                          ) =>
                            row.id ===
                            record.customerId
                        );

                      return (

                        <tr
                          key={
                            record.id
                          }
                          className="border-b last:border-0 hover:bg-slate-50"
                        >

                          <td className="px-4 py-4">

                            <div className="font-black text-blue-700">
                              {
                                record.digitizingNumber ||
                                "Digitizing"
                              }
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                              {
                                formatDate(
                                  record.digitizingDate
                                )
                              }
                            </div>

                          </td>

                          <td className="px-4 py-4 font-bold">
                            {
                              record.orderNumber ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-4">

                            <div className="font-bold">
                              {customer?.name ||
                                record.customerName ||
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

                          <td className="max-w-[220px] px-4 py-4">

                            <div className="truncate font-semibold">
                              {
                                record.designName ||
                                "—"
                              }
                            </div>

                          </td>

                          <td className="px-4 py-4 font-bold">
                            {
                              record.stitchCount ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-4">
                            {
                              record.machineFormat ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-4">

                            <StatusBadge
                              status={
                                record.status
                              }
                            />

                          </td>

                          <td className="px-4 py-4">

                            <div className="flex gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  setViewing(
                                    record
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
                                    record
                                  )
                                }
                                className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void deleteDigitizing(
                                    record
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

      {/* =================================================
          CREATE / EDIT MODAL
      ================================================= */}

      {showForm && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">

          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">

            <div className="my-6 flex max-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex shrink-0 items-start justify-between border-b px-6 py-5">

                <div>

                  <h2 className="text-2xl font-black">
                    {editing
                      ? `Edit ${editing.digitizingNumber}`
                      : "New Digitizing Job"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Only Artwork marked Ready for Digitizing can be selected.
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

                  {/* ARTWORK */}

                  <Section
                    title="Artwork Ready for Digitizing"
                    description="This list comes directly from the Artwork & Designs page."
                  >

                    <Field
                      label="Artwork / Order *"
                      caption={`${eligibleArtworks.length} artwork case${eligibleArtworks.length === 1 ? "" : "s"} currently Ready for Digitizing.`}
                    >

                      <select
                        value={
                          form.artworkId
                        }
                        onChange={(e) =>
                          selectArtwork(
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
                          Select Ready for Digitizing Artwork
                        </option>

                        {eligibleArtworks.map(
                          (
                            artwork
                          ) => {

                            const order =
                              orders.find(
                                (
                                  row
                                ) =>
                                  (
                                    artwork.orderId &&
                                    row.id ===
                                      artwork.orderId
                                  ) ||
                                  (
                                    artwork.orderNumber &&
                                    row.orderNumber ===
                                      artwork.orderNumber
                                  )
                              );

                            const customer =
                              customers.find(
                                (
                                  row
                                ) =>
                                  row.id ===
                                  (
                                    artwork.customerId ||
                                    order?.customerId
                                  )
                              );

                            return (

                              <option
                                key={
                                  artwork.id
                                }
                                value={
                                  artwork.id
                                }
                              >
                                {artwork.orderNumber ||
                                  order?.orderNumber ||
                                  "Order"}
                                {" — "}
                                {artwork.designName ||
                                  "Artwork"}
                                {" — "}
                                {customer?.name ||
                                  artwork.customerName ||
                                  "Customer"}
                                {" — Ready for Digitizing"}
                              </option>

                            );
                          }
                        )}

                      </select>

                    </Field>

                    {eligibleArtworks.length ===
                      0 &&
                      !editing && (

                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">

                        <div className="font-black text-amber-900">
                          No Artwork is currently Ready for Digitizing
                        </div>

                        <p className="mt-1 text-sm leading-6 text-amber-700">
                          Open Artwork & Designs and change the required artwork status to
                          <strong>
                            {" "}Ready for Digitizing
                          </strong>
                          , then return here and click Refresh.
                        </p>

                      </div>

                    )}

                  </Section>

                  {/* ARTWORK INFO */}

                  {selectedArtwork && (

                    <Section
                      title="Artwork Information"
                      description="Artwork details are read directly from the linked Artwork & Designs record."
                    >

                      <div className="grid gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:grid-cols-2 lg:grid-cols-4">

                        <Info
                          label="Order"
                          value={
                            selectedArtwork.orderNumber ||
                            selectedOrder?.orderNumber ||
                            ""
                          }
                        />

                        <Info
                          label="Design"
                          value={
                            selectedArtwork.designName
                          }
                        />

                        <Info
                          label="Artwork Status"
                          value={
                            selectedArtwork.artworkStatus ||
                            selectedArtwork.designStatus ||
                            selectedArtwork.status
                          }
                        />

                        <Info
                          label="Placement"
                          value={
                            selectedArtwork.placement
                          }
                        />

                        <Info
                          label="Width"
                          value={
                            selectedArtwork.width
                              ? `${selectedArtwork.width}`
                              : ""
                          }
                        />

                        <Info
                          label="Height"
                          value={
                            selectedArtwork.height
                              ? `${selectedArtwork.height}`
                              : ""
                          }
                        />

                        <Info
                          label="Colors"
                          value={
                            selectedArtwork.colors ||
                            selectedArtwork.threadColors
                          }
                        />

                        <Info
                          label="Artwork ID"
                          value={
                            selectedArtwork.id
                          }
                        />

                      </div>

                    </Section>

                  )}

                  {/* CUSTOMER */}

                  {selectedCustomer && (

                    <Section
                      title="Customer"
                      description="Customer information is fetched from the Customers master."
                    >

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

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
                          label="Contact"
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

                      </div>

                    </Section>

                  )}

                  {/* BASIC DIGITIZING */}

                  <Section
                    title="Digitizing Details"
                    description="Capture the operational information required to prepare the embroidery machine file."
                  >

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                      <Field
                        label="Digitizing Date *"
                        caption="Date the artwork enters the digitizing process."
                      >

                        <input
                          type="date"
                          value={
                            form.digitizingDate
                          }
                          onChange={(e) =>
                            updateForm(
                              "digitizingDate",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Digitizer Name *"
                        caption="Person responsible for creating the embroidery machine file."
                      >

                        <input
                          value={
                            form.digitizerName
                          }
                          onChange={(e) =>
                            updateForm(
                              "digitizerName",
                              e.target.value
                            )
                          }
                          placeholder="Digitizer name"
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Machine File Format"
                        caption="Output format required by the embroidery machine."
                      >

                        <select
                          value={
                            form.machineFormat
                          }
                          onChange={(e) =>
                            updateForm(
                              "machineFormat",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >

                          {MACHINE_FORMATS.map(
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
                        label="Embroidery Type"
                        caption="Digitizing technique required for the design."
                      >

                        <select
                          value={
                            form.embroideryType
                          }
                          onChange={(e) =>
                            updateForm(
                              "embroideryType",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >

                          {EMBROIDERY_TYPES.map(
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
                        label="Stitch Count"
                        caption="Final estimated or actual stitch count."
                      >

                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={
                            form.stitchCount
                          }
                          onChange={(e) =>
                            updateForm(
                              "stitchCount",
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Color Count"
                        caption="Number of thread colours used."
                      >

                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={
                            form.colorCount
                          }
                          onChange={(e) =>
                            updateForm(
                              "colorCount",
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

                  {/* TECHNICAL */}

                  <Section
                    title="Technical Settings"
                    description="Key digitizing specifications used for production."
                  >

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                      <Field
                        label="Design Width"
                        caption="Final embroidery width."
                      >

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            form.width
                          }
                          onChange={(e) =>
                            updateForm(
                              "width",
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Design Height"
                        caption="Final embroidery height."
                      >

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            form.height
                          }
                          onChange={(e) =>
                            updateForm(
                              "height",
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Needle Count"
                        caption="Number of needles/thread changes required."
                      >

                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={
                            form.needleCount
                          }
                          onChange={(e) =>
                            updateForm(
                              "needleCount",
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Density"
                        caption="Approximate embroidery stitch density."
                      >

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            form.density
                          }
                          onChange={(e) =>
                            updateForm(
                              "density",
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Underlay Type"
                        caption="Underlay method used to stabilize the embroidery."
                      >

                        <select
                          value={
                            form.underlayType
                          }
                          onChange={(e) =>
                            updateForm(
                              "underlayType",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >

                          {UNDERLAY_TYPES.map(
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
                        label="Pull Compensation"
                        caption="Compensation applied for fabric pull during embroidery."
                      >

                        <select
                          value={
                            form.pullCompensation
                          }
                          onChange={(e) =>
                            updateForm(
                              "pullCompensation",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >

                          {PULL_COMPENSATION_OPTIONS.map(
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

                    </div>

                  </Section>

                  {/* OUTPUT FILE */}

                  <Section
                    title="Digitized File"
                    description="Record the embroidery machine file created from the approved artwork."
                  >

                    <div className="grid gap-5 sm:grid-cols-2">

                      <Field
                        label="File Name"
                        caption="Example: EMBRASTIC-LOGO-FINAL.DST"
                      >

                        <input
                          value={
                            form.fileName
                          }
                          onChange={(e) =>
                            updateForm(
                              "fileName",
                              e.target.value
                            )
                          }
                          placeholder="Design file name"
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Digitized File URL / Path"
                        caption="Saved file location, upload link or machine-file path."
                      >

                        <input
                          value={
                            form.digitizedFileUrl
                          }
                          onChange={(e) =>
                            updateForm(
                              "digitizedFileUrl",
                              e.target.value
                            )
                          }
                          placeholder="File URL or path"
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                    </div>

                  </Section>

                  {/* STATUS */}

                  <Section
                    title="Digitizing Status"
                    description="Completed cases become eligible for Production."
                  >

                    <Field
                      label="Status"
                      caption="Set Completed only after the machine file is finalized and ready for embroidery production."
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

                        {DIGITIZING_STATUSES.map(
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

                    {form.status ===
                      "Completed" && (

                      <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">

                        <div className="font-black text-green-900">
                          🪡 Ready for Production
                        </div>

                        <p className="mt-1 text-sm text-green-700">
                          Saving this record as Completed will make the digitized job available to the Production workflow.
                        </p>

                      </div>

                    )}

                  </Section>

                  {/* NOTES */}

                  <Section
                    title="Notes"
                    description="Digitizing instructions, revisions or technical comments."
                  >

                    <Field
                      label="Digitizing Notes"
                      caption="Record any special stitch, fabric, thread or production instructions."
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
                    void saveDigitizing()
                  }
                  disabled={
                    saving
                  }
                  className={`rounded-xl px-6 py-3 font-bold text-white disabled:opacity-50 ${
                    form.status ===
                    "Completed"
                      ? "bg-green-700 hover:bg-green-800"
                      : "bg-blue-700 hover:bg-blue-800"
                  }`}
                >
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update Digitizing"
                    : "Save Digitizing"}
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
                    Digitizing
                  </div>

                  <h2 className="mt-1 text-2xl font-black">
                    {
                      viewing.digitizingNumber
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
                    label="Date"
                    value={
                      formatDate(
                        viewing.digitizingDate
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
                  title="Design"
                  description="Linked Artwork & Designs information."
                >

                  <div className="grid gap-4 sm:grid-cols-2">

                    <Info
                      label="Design Name"
                      value={
                        viewing.designName
                      }
                    />

                    <Info
                      label="Artwork ID"
                      value={
                        viewing.artworkId
                      }
                    />

                    <Info
                      label="Customer"
                      value={
                        viewing.customerName
                      }
                    />

                    <Info
                      label="Digitizer"
                      value={
                        viewing.digitizerName
                      }
                    />

                  </div>

                </Section>

                <Section
                  title="Technical Details"
                  description="Machine-file specifications."
                >

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                    <Info
                      label="Stitches"
                      value={
                        String(
                          viewing.stitchCount ||
                            0
                        )
                      }
                    />

                    <Info
                      label="Format"
                      value={
                        viewing.machineFormat
                      }
                    />

                    <Info
                      label="Embroidery Type"
                      value={
                        viewing.embroideryType
                      }
                    />

                    <Info
                      label="Width"
                      value={
                        String(
                          viewing.width ||
                            0
                        )
                      }
                    />

                    <Info
                      label="Height"
                      value={
                        String(
                          viewing.height ||
                            0
                        )
                      }
                    />

                    <Info
                      label="Colors"
                      value={
                        String(
                          viewing.colorCount ||
                            0
                        )
                      }
                    />

                  </div>

                </Section>

                {viewing.notes && (

                  <Section
                    title="Notes"
                    description="Digitizing instructions and comments."
                  >

                    <div className="whitespace-pre-wrap text-sm leading-6">
                      {
                        viewing.notes
                      }
                    </div>

                  </Section>

                )}

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

  const normalized =
    normalizeText(
      status
    );

  if (
    normalized ===
    "completed"
  ) {
    style =
      "bg-green-100 text-green-700";
  } else if (
    normalized ===
    "in progress"
  ) {
    style =
      "bg-blue-100 text-blue-700";
  } else if (
    normalized ===
    "revision required"
  ) {
    style =
      "bg-orange-100 text-orange-700";
  } else if (
    normalized ===
    "on hold"
  ) {
    style =
      "bg-yellow-100 text-yellow-700";
  } else if (
    normalized ===
    "cancelled"
  ) {
    style =
      "bg-red-100 text-red-700";
  } else if (
    normalized ===
    "pending"
  ) {
    style =
      "bg-purple-100 text-purple-700";
  }

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${style}`}
    >
      {status || "—"}
    </span>
  );
}
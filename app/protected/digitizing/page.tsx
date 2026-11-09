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
   SHEETS
========================================================= */

const ARTWORK_SHEET =
  "Artwork";

const DIGITIZING_SHEET =
  "Digitizing";

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
  digitizedFileUrl: string;

  status: string;

  notes: string;

  createdAt: string;
  updatedAt?: string;

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
  "Sequin Embroidery",
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
   EMPTY FORM

   IMPORTANT:
   No Date / random values here because Next.js 16
   can prerender Client Components.
========================================================= */

function emptyForm(): DigitizingForm {
  return {
    artworkId: "",

    digitizingDate:
      "",

    digitizerName:
      "",

    stitchCount:
      0,

    width:
      0,

    height:
      0,

    machineFormat:
      "DST",

    embroideryType:
      "Flat Embroidery",

    needleCount:
      1,

    colorCount:
      1,

    density:
      0.4,

    underlayType:
      "Edge Run",

    pullCompensation:
      "0.2 mm",

    fileName:
      "",

    digitizedFileUrl:
      "",

    status:
      "Pending",

    notes:
      "",
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

/*
 * Only called from useEffect / user actions.
 */
function getToday() {
  return new Date()
    .toISOString()
    .split("T")[0];
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

  return `id-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function formatDate(
  value: string
) {
  if (!value) {
    return "—";
  }

  const raw =
    value.split(
      "T"
    )[0];

  const parts =
    raw.split(
      "-"
    );

  if (
    parts.length !==
    3
  ) {
    return raw;
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function uniqueOptions(
  base: string[],
  extra: string
) {
  const value =
    clean(extra);

  if (!value) {
    return base;
  }

  const exists =
    base.some(
      (
        option
      ) =>
        normalizeText(
          option
        ) ===
        normalizeText(
          value
        )
    );

  return exists
    ? base
    : [
        value,
        ...base,
      ];
}

/* =========================================================
   STATUS HELPERS
========================================================= */

function isArtworkReadyForDigitizing(
  artwork: ArtworkRecord
) {
  const statuses = [
    artwork.status,
    artwork.artworkStatus,
    artwork.designStatus,
  ]
    .map(
      normalizeText
    )
    .filter(
      Boolean
    );

  const accepted = [
    "ready for digitizing",
    "ready for digitising",
    "ready to digitize",
    "ready to digitise",
    "ready for digitize",
    "ready for digitise",
  ];

  return statuses.some(
    (
      status
    ) =>
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
    normalizeText(
      value
    )
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
      ).split(
        "T"
      )[0],

    deliveryDate:
      clean(
        row?.deliveryDate
      ).split(
        "T"
      )[0],

    status:
      clean(
        row?.status
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
      ).split(
        "T"
      )[0],

    stitchCount:
      numberValue(
        row?.stitchCount ??
          row?.stitches
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

    machineFormat:
      clean(
        row?.machineFormat ??
          row?.fileFormat
      ) ||
      "DST",

    embroideryType:
      clean(
        row?.embroideryType
      ) ||
      "Flat Embroidery",

    needleCount:
      numberValue(
        row?.needleCount
      ) ||
      1,

    colorCount:
      numberValue(
        row?.colorCount ??
          row?.colourCount
      ) ||
      1,

    density:
      numberValue(
        row?.density
      ) ||
      0.4,

    underlayType:
      clean(
        row?.underlayType
      ) ||
      "Edge Run",

    pullCompensation:
      clean(
        row?.pullCompensation
      ) ||
      "0.2 mm",

    fileName:
      clean(
        row?.fileName ??
          row?.digitizedFileName
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
      ) ||
      "Pending",

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
    appSettings,
    setAppSettings,
  ] =
    useState<AppSettings>(
      DEFAULT_APP_SETTINGS
    );

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
    useState(
      "All"
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
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
  const response = await fetch("/api/excel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let data: any = {};

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `The server returned an invalid response (HTTP ${response.status}).`
    );
  }

  if (!response.ok || !data?.success) {
    console.error("Digitizing PostgreSQL request failed:", {
      request: body,
      response: data,
      status: response.status,
    });

    // Display the underlying database error instead of
    // hiding it behind "Failed to process PostgreSQL request."
    const detail =
      data?.error ||
      data?.message ||
      `HTTP ${response.status}: Request failed.`;

    throw new Error(String(detail));
  }

  return data;
}


  /* =======================================================
     LOAD SETTINGS
  ======================================================= */

  async function refreshSettings() {
    const settings =
      await loadAppSettings();

    setAppSettings(
      settings
    );

    return settings;
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
        settings,
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

          loadAppSettings(),
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

      setAppSettings(
        settings
      );
    } catch (
      error
    ) {
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
     SETTINGS-AWARE OPTIONS
  ======================================================= */

  const machineFormatOptions =
    useMemo(
      () =>
        uniqueOptions(
          MACHINE_FORMATS,
          appSettings
            .defaultMachineFormat
        ),
      [
        appSettings
          .defaultMachineFormat,
      ]
    );

  const embroideryTypeOptions =
    useMemo(
      () =>
        uniqueOptions(
          EMBROIDERY_TYPES,
          appSettings
            .defaultEmbroideryType
        ),
      [
        appSettings
          .defaultEmbroideryType,
      ]
    );

  const underlayOptions =
    useMemo(
      () =>
        uniqueOptions(
          UNDERLAY_TYPES,
          appSettings
            .defaultUnderlayType
        ),
      [
        appSettings
          .defaultUnderlayType,
      ]
    );

  const pullCompensationOptions =
    useMemo(
      () =>
        uniqueOptions(
          PULL_COMPENSATION_OPTIONS,
          appSettings
            .defaultPullCompensation
        ),
      [
        appSettings
          .defaultPullCompensation,
      ]
    );

  /* =======================================================
     ELIGIBLE ARTWORK
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

            if (
              !existing
            ) {
              return true;
            }

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

      if (
        !customerId
      ) {
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
     FILTER
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
              digitizing
                .digitizingNumber,

              digitizing
                .orderNumber,

              digitizing
                .customerName,

              customer?.name,

              customer
                ?.businessName,

              digitizing
                .designName,

              digitizing
                .digitizerName,

              digitizing.status,

              digitizing
                .machineFormat,

              digitizing
                .embroideryType,
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              )
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
          numberValue(
            artwork?.colors
          ) ||
          current.colorCount,
      })
    );
  }

  /* =======================================================
     NEW DIGITIZING

     IMPORTANT:
     Settings are reloaded every time New Digitizing opens.

     Therefore:
     Settings -> Save -> Digitizing -> New Digitizing

     immediately uses the new defaults.
  ======================================================= */

  async function openCreate() {
    try {
      await loadData(
        true
      );

      const settings =
        await refreshSettings();

      setEditing(
        null
      );

      setForm({
        ...emptyForm(),

        digitizingDate:
          getToday(),

        machineFormat:
          settings
            .defaultMachineFormat ||
          "DST",

        embroideryType:
          settings
            .defaultEmbroideryType ||
          "Flat Embroidery",

        density:
          Number(
            settings
              .defaultDensity
          ) ||
          0.4,

        underlayType:
          settings
            .defaultUnderlayType ||
          "Edge Run",

        pullCompensation:
          settings
            .defaultPullCompensation ||
          "0.2 mm",
      });

      setShowForm(
        true
      );
    } catch (
      error
    ) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to prepare Digitizing."
      );
    }
  }

  /* =======================================================
     EDIT

     Existing saved values are preserved.

     Settings defaults must NOT overwrite old jobs.
  ======================================================= */

  async function openEdit(
    record:
      DigitizingRecord
  ) {
    await refreshSettings();

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

     Uses Settings digitizingPrefix.
  ======================================================= */

  function nextDigitizingNumber(
    year: number
  ) {
    let max = 0;

    const prefix =
      `${
        appSettings
          .digitizingPrefix ||
        "DIG"
      }-${year}-`;

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
     VALIDATE
  ======================================================= */

  function validateForm() {
    if (
      !form.artworkId
    ) {
      return "Please select Artwork that is Ready for Digitizing.";
    }

    if (
      !form.digitizingDate
    ) {
      return "Digitizing Date is required.";
    }

    if (
      !form.digitizerName.trim()
    ) {
      return "Digitizer Name is required.";
    }

    if (
      form.stitchCount <
      0
    ) {
      return "Stitch Count cannot be negative.";
    }

    if (
      form.width <
        0 ||
      form.height <
        0
    ) {
      return "Design width and height cannot be negative.";
    }

    if (
      form.colorCount <
      1
    ) {
      return "Color Count must be at least 1.";
    }

    if (
      form.needleCount <
      1
    ) {
      return "Needle Count must be at least 1.";
    }

    if (
      form.density <
      0
    ) {
      return "Density cannot be negative.";
    }

    return "";
  }

  /* =======================================================
     SAVE
  ======================================================= */

  async function saveDigitizing() {
    const validation =
      validateForm();

    if (
      validation
    ) {
      alert(
        validation
      );

      return;
    }

    const artwork =
      artworks.find(
        (
          row
        ) =>
          row.id ===
          form.artworkId
      );

    if (
      !artwork
    ) {
      alert(
        "Selected Artwork could not be found."
      );

      return;
    }

    if (
      !editing &&
      !isArtworkReadyForDigitizing(
        artwork
      )
    ) {
      alert(
        `${artwork.designName || artwork.orderNumber} is no longer Ready for Digitizing.`
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

    if (
      !order
    ) {
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

    if (
      !customer
    ) {
      alert(
        "The Customer linked to this Artwork could not be found."
      );

      return;
    }

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

    if (
      duplicate
    ) {
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
          form
            .digitizingDate
            .slice(
              0,
              4
            )
        );

      if (
        !year
      ) {
        throw new Error(
          "Invalid Digitizing Date."
        );
      }

      const now =
        new Date()
          .toISOString();

      const digitizingNumber =
        editing
          ? editing
              .digitizingNumber
          : nextDigitizingNumber(
              year
            );

      const record = {
        digitizingNumber,

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
          form
            .digitizerName
            .trim(),

        stitchCount:
          Number(
            form.stitchCount ||
              0
          ),

        /*
         * Width / height are deliberately saved.
         * Production can later read them automatically.
         */
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

        /*
         * Also write aliases to make downstream
         * compatibility safer.
         */
        designWidth:
          Number(
            form.width ||
              0
          ),

        designHeight:
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
              1
          ),

        colorCount:
          Number(
            form.colorCount ||
              1
          ),

        colourCount:
          Number(
            form.colorCount ||
              1
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
          form
            .fileName
            .trim(),

        digitizedFileUrl:
          form
            .digitizedFileUrl
            .trim(),

        status:
          form.status,

        notes:
          form
            .notes
            .trim(),

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
            DIGITIZING_SHEET,

          id:
            editing.id,

          record: {
            ...editing,

            ...record,

            createdAt:
              editing.createdAt ||
              now,
          },
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
              now,
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
          "In Progress" ||
        form.status ===
          "On Hold"
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

            updatedAt:
              now,
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
          `${digitizingNumber} saved successfully. Order ${order.orderNumber} is now ready for Production.`
        );
      } else {
        alert(
          `${digitizingNumber} saved successfully.`
        );
      }
    } catch (
      error
    ) {
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
    record:
      DigitizingRecord
  ) {
    if (
      !confirm(
        `Delete ${record.digitizingNumber}?`
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
          DIGITIZING_SHEET,

        id:
          record.id,
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
          : "Unable to delete Digitizing record."
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
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">

      <div className="mx-auto w-full max-w-7xl space-y-5 pb-24">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>

            <div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
              Embroidery Preparation
            </div>

            <h1 className="text-3xl font-black">
              Digitizing
            </h1>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Convert approved artwork into production-ready embroidery files and maintain stitch, size, colour and machine specifications.
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
              className="rounded-xl border bg-white px-4 py-3 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
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
              className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800"
            >
              + New Digitizing
            </button>

          </div>

        </div>

        {/* SETTINGS */}

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">

          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

            <div>

              <div className="font-black text-blue-900">
                Digitizing Defaults
              </div>

              <p className="mt-1 text-xs leading-5 text-blue-700">
                New Digitizing jobs automatically use the values saved under Company Settings.
              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              <SettingBadge
                label="Format"
                value={
                  appSettings
                    .defaultMachineFormat
                }
              />

              <SettingBadge
                label="Embroidery"
                value={
                  appSettings
                    .defaultEmbroideryType
                }
              />

              <SettingBadge
                label="Density"
                value={String(
                  appSettings
                    .defaultDensity
                )}
              />

              <SettingBadge
                label="Underlay"
                value={
                  appSettings
                    .defaultUnderlayType
                }
              />

              <SettingBadge
                label="Pull Comp."
                value={
                  appSettings
                    .defaultPullCompensation
                }
              />

            </div>

          </div>

        </div>

        {/* WORKFLOW */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
              🧵
            </div>

            <div>

              <div className="font-black text-slate-900">
                Artwork → Digitizing → Production
              </div>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Artwork appears here only when marked
                <strong>
                  {" "}Ready for Digitizing
                </strong>
                . Completing Digitizing moves the Order to
                <strong>
                  {" "}Production
                </strong>
                .
              </p>

            </div>

          </div>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            label="Ready Artwork"
            value={
              stats.ready
            }
            caption="Awaiting digitizing"
          />

          <StatCard
            label="Pending"
            value={
              stats.pending
            }
            caption="Waiting to start"
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
            caption="Ready for Production"
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
            placeholder="Search digitizing number, order, customer, design, digitizer or format..."
            className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
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
                Artwork marked Ready for Digitizing will become available here.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1150px] text-left text-sm">

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
                      Digitizer
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
                              {record.digitizingNumber ||
                                "Digitizing"}
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                              {formatDate(
                                record.digitizingDate
                              )}
                            </div>

                          </td>

                          <td className="px-4 py-4 font-bold">
                            {record.orderNumber ||
                              "—"}
                          </td>

                          <td className="px-4 py-4">

                            <div className="font-bold">
                              {customer?.name ||
                                record.customerName ||
                                "—"}
                            </div>

                            {customer?.businessName && (

                              <div className="mt-1 text-xs text-slate-500">
                                {customer.businessName}
                              </div>

                            )}

                          </td>

                          <td className="max-w-[220px] px-4 py-4">

                            <div className="truncate font-semibold">
                              {record.designName ||
                                "—"}
                            </div>

                          </td>

                          <td className="px-4 py-4">
                            {record.digitizerName ||
                              "—"}
                          </td>

                          <td className="px-4 py-4 font-bold">
                            {record.stitchCount ||
                              "—"}
                          </td>

                          <td className="px-4 py-4">
                            {record.machineFormat ||
                              "—"}
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
                                  void openEdit(
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
          CREATE / EDIT
      ================================================= */}

      {showForm && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">

          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">

            <div className="my-6 flex max-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex shrink-0 items-start justify-between border-b px-6 py-5">

                <div>

                  <div className="text-xs font-black uppercase tracking-wide text-blue-600">
                    {editing
                      ? "Edit Digitizing"
                      : "New Digitizing"}
                  </div>

                  <h2 className="mt-1 text-2xl font-black">
                    {editing
                      ? editing.digitizingNumber
                      : "Create Digitizing Job"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Create the machine-ready embroidery file from approved artwork.
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
                  className="text-3xl text-slate-400 disabled:opacity-50"
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
                    description="Only approved Artwork records marked Ready for Digitizing can be selected."
                  >

                    <Field
                      label="Artwork / Order *"
                      caption={`${eligibleArtworks.length} artwork case${eligibleArtworks.length === 1 ? "" : "s"} currently available.`}
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
                          Open Artwork & Designs, mark the required artwork
                          <strong>
                            {" "}Ready for Digitizing
                          </strong>
                          , then return here and click Refresh.
                        </p>

                      </div>

                    )}

                  </Section>

                  {/* SELECTED ARTWORK */}

                  {selectedArtwork && (

                    <Section
                      title="Linked Job Information"
                      description="Artwork, Order and Customer information are fetched automatically."
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
                          label="Customer"
                          value={
                            selectedCustomer?.name ||
                            selectedArtwork.customerName
                          }
                        />

                        <Info
                          label="Design"
                          value={
                            selectedArtwork.designName
                          }
                        />

                        <Info
                          label="Placement"
                          value={
                            selectedArtwork.placement
                          }
                        />

                        <Info
                          label="Artwork Width"
                          value={
                            selectedArtwork.width
                              ? String(
                                  selectedArtwork.width
                                )
                              : ""
                          }
                        />

                        <Info
                          label="Artwork Height"
                          value={
                            selectedArtwork.height
                              ? String(
                                  selectedArtwork.height
                                )
                              : ""
                          }
                        />

                        <Info
                          label="Colours"
                          value={
                            selectedArtwork.colors ||
                            selectedArtwork.threadColors
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

                      </div>

                    </Section>

                  )}

                  {/* GENERAL */}

                  <Section
                    title="Digitizing Details"
                    description="Operational information for the digitizing job."
                  >

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                      <Field
                        label="Digitizing Date *"
                        caption="Date the design enters Digitizing."
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
                        caption="Person responsible for preparing the embroidery machine file."
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
                        label="Status"
                        caption="Current status of this digitizing job."
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

                    </div>

                  </Section>

                  {/* DEFAULTS */}

                  <Section
                    title="Embroidery File Settings"
                    description="New jobs use the defaults configured in Company Settings."
                  >

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                      <Field
                        label="Machine File Format"
                        caption={
                          editing
                            ? "Machine format saved on this job."
                            : `Default from Settings: ${appSettings.defaultMachineFormat}`
                        }
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

                          {machineFormatOptions.map(
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
                        caption={
                          editing
                            ? "Technique saved on this job."
                            : `Default from Settings: ${appSettings.defaultEmbroideryType}`
                        }
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

                          {embroideryTypeOptions.map(
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
                        label="Density"
                        caption={
                          editing
                            ? "Density saved on this job."
                            : `Default from Settings: ${appSettings.defaultDensity}`
                        }
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
                        caption={
                          editing
                            ? "Underlay saved on this job."
                            : `Default from Settings: ${appSettings.defaultUnderlayType}`
                        }
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

                          {underlayOptions.map(
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
                        caption={
                          editing
                            ? "Compensation saved on this job."
                            : `Default from Settings: ${appSettings.defaultPullCompensation}`
                        }
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

                          {pullCompensationOptions.map(
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

                  {/* TECHNICAL */}

                  <Section
                    title="Technical Specifications"
                    description="These values are saved for Production and machine setup."
                  >

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                      <Field
                        label="Stitch Count"
                        caption="Final stitch count for the design."
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
                        label="Design Width"
                        caption="Finished embroidery width."
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
                        caption="Finished embroidery height."
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
                        caption="Number of needles / thread changes required."
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
                        label="Color Count"
                        caption="Number of thread colours."
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

                  {/* FILE */}

                  <Section
                    title="Digitized File"
                    description="Reference to the final embroidery machine file."
                  >

                    <div className="grid gap-5 sm:grid-cols-2">

                      <Field
                        label="File Name"
                        caption="Example: CUSTOMER-LOGO-FINAL.DST"
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
                          placeholder="Digitized file name"
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                      <Field
                        label="Digitized File URL / Path"
                        caption="Saved file location or shared link."
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
                          placeholder="File path or URL"
                          className="w-full rounded-xl border px-4 py-3"
                        />

                      </Field>

                    </div>

                  </Section>

                  {/* NOTES */}

                  <Section
                    title="Notes"
                    description="Technical instructions, revision details or internal comments."
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
                      placeholder="Digitizing notes..."
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
                  className="rounded-xl border px-5 py-3 font-semibold hover:bg-slate-50 disabled:opacity-50"
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
                  className="rounded-xl bg-blue-700 px-6 py-3 font-black text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update Digitizing"
                    : "Create Digitizing"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* =================================================
          VIEW MODAL
      ================================================= */}

      {viewing && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">

          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">

            <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">

              <div className="flex items-start justify-between border-b px-6 py-5">

                <div>

                  <div className="text-xs font-black uppercase tracking-wide text-blue-600">
                    Digitizing Record
                  </div>

                  <h2 className="mt-1 text-2xl font-black">
                    {viewing.digitizingNumber}
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

              <div className="space-y-6 p-6">

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                  <ViewField
                    label="Order"
                    value={
                      viewing.orderNumber
                    }
                  />

                  <ViewField
                    label="Customer"
                    value={
                      viewing.customerName
                    }
                  />

                  <ViewField
                    label="Design"
                    value={
                      viewing.designName
                    }
                  />

                  <ViewField
                    label="Digitizer"
                    value={
                      viewing.digitizerName
                    }
                  />

                  <ViewField
                    label="Date"
                    value={
                      formatDate(
                        viewing.digitizingDate
                      )
                    }
                  />

                  <ViewField
                    label="Status"
                    value={
                      viewing.status
                    }
                  />

                  <ViewField
                    label="Stitches"
                    value={String(
                      viewing.stitchCount
                    )}
                  />

                  <ViewField
                    label="Size"
                    value={`${viewing.width} × ${viewing.height}`}
                  />

                  <ViewField
                    label="Colours"
                    value={String(
                      viewing.colorCount
                    )}
                  />

                  <ViewField
                    label="Machine Format"
                    value={
                      viewing.machineFormat
                    }
                  />

                  <ViewField
                    label="Embroidery Type"
                    value={
                      viewing.embroideryType
                    }
                  />

                  <ViewField
                    label="Density"
                    value={String(
                      viewing.density
                    )}
                  />

                  <ViewField
                    label="Underlay"
                    value={
                      viewing.underlayType
                    }
                  />

                  <ViewField
                    label="Pull Compensation"
                    value={
                      viewing.pullCompensation
                    }
                  />

                  <ViewField
                    label="Needle Count"
                    value={String(
                      viewing.needleCount
                    )}
                  />

                </div>

                {viewing.fileName && (

                  <div className="rounded-xl border bg-slate-50 p-4">

                    <div className="text-xs font-bold text-slate-500">
                      Digitized File
                    </div>

                    <div className="mt-1 font-black">
                      {viewing.fileName}
                    </div>

                    {viewing.digitizedFileUrl && (

                      <div className="mt-1 break-all text-xs text-blue-700">
                        {viewing.digitizedFileUrl}
                      </div>

                    )}

                  </div>

                )}

                {viewing.notes && (

                  <div>

                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Notes
                    </div>

                    <div className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6">
                      {viewing.notes}
                    </div>

                  </div>

                )}

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
    <section className="rounded-2xl border bg-slate-50/50 p-4 sm:p-5">

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

function Info({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div>

      <div className="text-xs font-bold text-blue-600">
        {label}
      </div>

      <div className="mt-1 break-words font-black text-slate-900">
        {value ||
          "—"}
      </div>

    </div>
  );
}

function ViewField({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="rounded-xl border bg-slate-50 p-4">

      <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 font-black text-slate-900">
        {value ||
          "—"}
      </div>

    </div>
  );
}

function SettingBadge({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="rounded-xl border border-blue-200 bg-white px-3 py-2">

      <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-0.5 max-w-[180px] truncate text-xs font-black text-slate-800">
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
    <div className="rounded-2xl border bg-white p-5 shadow-sm">

      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-3xl font-black text-slate-950">
        {value}
      </div>

      <div className="mt-1 text-xs leading-5 text-slate-400">
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
  const normalized =
    normalizeText(
      status
    );

  const style =
    normalized ===
    "completed"
      ? "bg-green-100 text-green-700"
      : normalized ===
        "in progress"
      ? "bg-blue-100 text-blue-700"
      : normalized ===
        "revision required"
      ? "bg-orange-100 text-orange-700"
      : normalized ===
        "cancelled"
      ? "bg-red-100 text-red-700"
      : normalized ===
        "on hold"
      ? "bg-purple-100 text-purple-700"
      : "bg-amber-100 text-amber-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${style}`}
    >
      {status ||
        "Pending"}
    </span>
  );
}
"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  deliveryDate: string;
  status: string;
  items: string;
  notes: string;
  createdAt: string;
};

type Artwork = {
  id: string;

  orderId: string;
  orderNumber: string;

  customerId: string;
  customerName: string;

  designName: string;

  fileName: string;

  status: string;

  notes: string;

  createdAt: string;
};

const DESIGN_NAMES = [
  "Left Chest Logo",
  "Right Chest Logo",
  "Center Chest Logo",
  "Full Front Design",
  "Upper Front Design",
  "Pocket Logo",
  "Back Logo",
  "Full Back Design",
  "Upper Back Design",
  "Neck Branding",
  "Sleeve Logo - Left",
  "Sleeve Logo - Right",
  "Both Sleeves",
  "Cap Front Logo",
  "Cap Side Logo",
  "Cap Back Logo",
  "Name Embroidery",
  "Employee Name",
  "Company Logo",
  "School Logo",
  "Sports Team Logo",
  "Monogram",
  "Initials",
  "Badge / Patch",
  "Uniform Branding",
  "Jacket Chest Logo",
  "Jacket Back Design",
  "T-Shirt Front Design",
  "T-Shirt Back Design",
  "Hoodie Front Design",
  "Hoodie Back Design",
  "Custom Artwork",
  "Other",
];

const ARTWORK_STATUSES = [
  "Pending",
  "Artwork Received",
  "Under Review",
  "Approved",
  "Changes Required",
  "Ready for Digitizing",
  "Rejected",
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

function normalizeOrder(
  row: any
): Order {
  return {
    id: String(
      row?.id ?? ""
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

    orderDate: String(
      row?.orderDate ?? ""
    ),

    deliveryDate: String(
      row?.deliveryDate ?? ""
    ),

    status: String(
      row?.status ?? ""
    ),

    items:
      typeof row?.items === "string"
        ? row.items
        : JSON.stringify(
            row?.items ?? []
          ),

    notes: String(
      row?.notes ?? ""
    ),

    createdAt: String(
      row?.createdAt ?? ""
    ),
  };
}

function normalizeArtwork(
  row: any
): Artwork {
  return {
    id: String(
      row?.id ?? ""
    ).trim(),

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

    designName: String(
      row?.designName ?? ""
    ).trim(),

    fileName: String(
      row?.fileName ?? ""
    ).trim(),

    status: String(
      row?.status ??
        "Pending"
    ),

    notes: String(
      row?.notes ?? ""
    ),

    createdAt: String(
      row?.createdAt ?? ""
    ),
  };
}

function displayDate(
  value: string
) {
  if (!value) {
    return "—";
  }

  return String(value).split(
    "T"
  )[0];
}

export default function ArtworkPage() {
  const [
    orders,
    setOrders,
  ] =
    useState<Order[]>([]);

  const [
    artworks,
    setArtworks,
  ] =
    useState<Artwork[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    loadingOrders,
    setLoadingOrders,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    uploading,
    setUploading,
  ] =
    useState(false);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    showForm,
    setShowForm,
  ] =
    useState(false);

  const [
    editing,
    setEditing,
  ] =
    useState<Artwork | null>(
      null
    );

  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState({
      orderId: "",
      designName: "",
      customDesignName: "",
      fileName: "",
      status: "Pending",
      notes: "",
    });

  useEffect(() => {
    reload();
  }, []);

  async function loadOrders() {
    try {
      setLoadingOrders(true);

      const response =
        await fetch(
          "/api/excel?sheet=Orders",
          {
            cache: "no-store",
            headers: {
              "Cache-Control":
                "no-cache",
            },
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
            "Unable to load orders."
        );
      }

      const freshOrders =
        Array.isArray(data.rows)
          ? data.rows
              .map(
                normalizeOrder
              )
              .filter(
                (
                  order: Order
                ) =>
                  Boolean(
                    order.id
                  ) &&
                  Boolean(
                    order.orderNumber
                  )
              )
          : [];

      freshOrders.sort(
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
      );

      setOrders(
        freshOrders
      );

      return freshOrders;
    } finally {
      setLoadingOrders(
        false
      );
    }
  }

  async function loadArtwork() {
    const response =
      await fetch(
        "/api/excel?sheet=Artwork",
        {
          cache: "no-store",
          headers: {
            "Cache-Control":
              "no-cache",
          },
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
          "Unable to load artwork."
      );
    }

    const rows =
      Array.isArray(data.rows)
        ? data.rows
            .map(
              normalizeArtwork
            )
            .filter(
              (
                artwork: Artwork
              ) =>
                Boolean(
                  artwork.id
                )
            )
        : [];

    rows.sort(
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
    );

    setArtworks(
      rows
    );

    return rows;
  }

  async function reload() {
    try {
      setLoading(true);

      await Promise.all([
        loadOrders(),
        loadArtwork(),
      ]);
    } catch (error) {
      console.error(
        "Artwork load error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load Artwork & Design."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditing(null);

    setSelectedFile(null);

    setForm({
      orderId: "",
      designName: "",
      customDesignName: "",
      fileName: "",
      status: "Pending",
      notes: "",
    });
  }

  async function openCreate() {
    resetForm();

    try {
      await loadOrders();

      setShowForm(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to refresh orders."
      );
    }
  }

  async function openEdit(
    artwork: Artwork
  ) {
    try {
      await loadOrders();

      setEditing(
        artwork
      );

      const recommended =
        DESIGN_NAMES.includes(
          artwork.designName
        );

      setForm({
        orderId:
          artwork.orderId,

        designName:
          recommended
            ? artwork.designName
            : "Other",

        customDesignName:
          recommended
            ? ""
            : artwork.designName,

        fileName:
          artwork.fileName,

        status:
          artwork.status ||
          "Pending",

        notes:
          artwork.notes || "",
      });

      setSelectedFile(
        null
      );

      setShowForm(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to open artwork."
      );
    }
  }

  const selectedOrder =
    useMemo(
      () =>
        orders.find(
          (
            order
          ) =>
            order.id ===
            form.orderId
        ),
      [
        orders,
        form.orderId,
      ]
    );

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const maxSize =
      20 * 1024 * 1024;

    if (
      file.size >
      maxSize
    ) {
      alert(
        "Artwork file must be 20 MB or smaller."
      );

      event.target.value =
        "";

      return;
    }

    setSelectedFile(
      file
    );
  }

  async function uploadArtworkFile() {
    if (!selectedFile) {
      alert(
        "Please choose an artwork file first."
      );

      return "";
    }

    try {
      setUploading(true);

      const uploadData =
        new FormData();

      uploadData.append(
        "file",
        selectedFile
      );

      if (
        selectedOrder?.orderNumber
      ) {
        uploadData.append(
          "orderNumber",
          selectedOrder.orderNumber
        );
      }

      const response =
        await fetch(
          "/api/upload/artwork",
          {
            method: "POST",
            body: uploadData,
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
            "Artwork upload failed."
        );
      }

      const uploadedPath =
        String(
          data.filePath ||
            ""
        );

      setForm(
        (
          old
        ) => ({
          ...old,
          fileName:
            uploadedPath,
        })
      );

      setSelectedFile(
        null
      );

      return uploadedPath;
    } catch (error) {
      console.error(
        "Artwork upload error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Artwork upload failed."
      );

      return "";
    } finally {
      setUploading(false);
    }
  }

  async function saveArtwork() {
    const order =
      orders.find(
        (
          item
        ) =>
          item.id ===
          form.orderId
      );

    if (!order) {
      alert(
        "Please select a valid Order."
      );

      return;
    }

    const finalDesignName =
      form.designName ===
      "Other"
        ? form.customDesignName.trim()
        : form.designName.trim();

    if (
      !finalDesignName
    ) {
      alert(
        "Please select or enter a Design Name."
      );

      return;
    }

    let finalFileName =
      form.fileName;

    /*
     * If user chose a new file but
     * did not press Upload first,
     * upload automatically on Save.
     */
    if (selectedFile) {
      const uploaded =
        await uploadArtworkFile();

      if (!uploaded) {
        return;
      }

      finalFileName =
        uploaded;
    }

    if (!finalFileName) {
      alert(
        "Please upload the artwork file."
      );

      return;
    }

    try {
      setSaving(true);

      const record = {
        orderId:
          order.id,

        orderNumber:
          order.orderNumber,

        customerId:
          order.customerId,

        customerName:
          order.customerName,

        designName:
          finalDesignName,

        fileName:
          finalFileName,

        status:
          form.status,

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
                action:
                  editing
                    ? "update"
                    : "add",

                sheet:
                  "Artwork",

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
                          new Date()
                            .toISOString(),
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
            "Unable to save Artwork."
        );
      }

      /*
       * Keep order status in sync.
       */
      let orderStatus =
        "Artwork";

      if (
        form.status ===
        "Ready for Digitizing"
      ) {
        orderStatus =
          "Digitizing";
      }

      const orderResponse =
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

      const orderData =
        await orderResponse.json();

      if (
        !orderResponse.ok ||
        !orderData.success
      ) {
        console.warn(
          "Artwork saved but Order status could not be updated."
        );
      }

      setShowForm(false);

      resetForm();

      await reload();
    } catch (error) {
      console.error(
        "Artwork save error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to save Artwork."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteArtwork(
    artwork: Artwork
  ) {
    if (
      !confirm(
        `Delete artwork "${artwork.designName}" for ${artwork.orderNumber}?`
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
                  "Artwork",

                id:
                  artwork.id,
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
            "Unable to delete Artwork."
        );
      }

      await reload();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete Artwork."
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
        return artworks;
      }

      return artworks.filter(
        (
          artwork
        ) =>
          [
            artwork.orderNumber,
            artwork.customerName,
            artwork.designName,
            artwork.status,
            artwork.fileName,
            artwork.notes,
          ]
            .join(" ")
            .toLowerCase()
            .includes(
              query
            )
      );
    }, [
      artworks,
      search,
    ]);

  const pendingCount =
    artworks.filter(
      (
        artwork
      ) =>
        artwork.status ===
        "Pending"
    ).length;

  const approvedCount =
    artworks.filter(
      (
        artwork
      ) =>
        artwork.status ===
          "Approved" ||
        artwork.status ===
          "Ready for Digitizing"
    ).length;

  const digitizingReadyCount =
    artworks.filter(
      (
        artwork
      ) =>
        artwork.status ===
        "Ready for Digitizing"
    ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

        <div>

          <h1 className="text-3xl font-black">
            Artwork & Design
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Link artwork to live Orders,
            upload customer design files
            and prepare approved artwork
            for Digitizing.
          </p>

        </div>

        <button
          onClick={
            openCreate
          }
          disabled={
            loadingOrders
          }
          className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {loadingOrders
            ? "Refreshing..."
            : "+ Add Artwork"}
        </button>

      </div>

      {/* SUMMARY */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
          label="Artwork Records"
          value={String(
            artworks.length
          )}
          caption="Total linked artwork designs"
        />

        <StatCard
          label="Pending"
          value={String(
            pendingCount
          )}
          caption="Artwork awaiting action"
        />

        <StatCard
          label="Approved"
          value={String(
            approvedCount
          )}
          caption="Approved or ready designs"
        />

        <StatCard
          label="Ready for Digitizing"
          value={String(
            digitizingReadyCount
          )}
          caption="Designs ready for embroidery digitizing"
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
          placeholder="Search Order, customer, design, status or file..."
          className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
        />

      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

        {loading ? (

          <div className="p-10 text-center text-slate-500">
            Loading Artwork & Design from Excel...
          </div>

        ) : filtered.length === 0 ? (

          <div className="p-12 text-center">

            <div className="text-5xl">
              🎨
            </div>

            <h2 className="mt-4 text-xl font-bold">
              No artwork records
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Select an Order and upload
              the artwork supplied for it.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead>

                <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">

                  <th className="px-5 py-4">
                    Order
                  </th>

                  <th className="px-5 py-4">
                    Customer
                  </th>

                  <th className="px-5 py-4">
                    Design
                  </th>

                  <th className="px-5 py-4">
                    Artwork File
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Created
                  </th>

                  <th className="px-5 py-4">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filtered.map(
                  (
                    artwork
                  ) => (

                    <tr
                      key={
                        artwork.id
                      }
                      className="border-b last:border-0 hover:bg-slate-50"
                    >

                      <td className="px-5 py-4 font-bold">
                        {
                          artwork.orderNumber ||
                          "—"
                        }
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {
                          artwork.customerName ||
                          "—"
                        }
                      </td>

                      <td className="px-5 py-4">
                        {
                          artwork.designName ||
                          "—"
                        }
                      </td>

                      <td className="px-5 py-4">

                        {artwork.fileName ? (

                          <a
                            href={
                              artwork.fileName
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-blue-700 hover:underline"
                          >
                            Open File
                          </a>

                        ) : (
                          "—"
                        )}

                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            artwork.status ===
                            "Ready for Digitizing"
                              ? "bg-green-100 text-green-700"
                              : artwork.status ===
                                "Approved"
                              ? "bg-blue-100 text-blue-700"
                              : artwork.status ===
                                "Changes Required"
                              ? "bg-orange-100 text-orange-700"
                              : artwork.status ===
                                "Rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {
                            artwork.status
                          }
                        </span>

                      </td>

                      <td className="px-5 py-4">
                        {
                          displayDate(
                            artwork.createdAt
                          )
                        }
                      </td>

                      <td className="px-5 py-4">

                        <div className="flex gap-2">

                          <button
                            onClick={() =>
                              openEdit(
                                artwork
                              )
                            }
                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              deleteArtwork(
                                artwork
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

      {/* FORM */}

      {showForm && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

            <div className="mb-6 flex items-start justify-between">

              <div>

                <h2 className="text-2xl font-black">
                  {editing
                    ? "Edit Artwork"
                    : "Add Artwork & Design"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select the Order, choose a recommended
                  design position and upload the artwork file.
                </p>

              </div>

              <button
                onClick={() => {
                  setShowForm(
                    false
                  );

                  resetForm();
                }}
                className="text-2xl text-slate-400"
              >
                ×
              </button>

            </div>

            <div className="space-y-5">

              {/* ORDER */}

              <Field
                label="Link to Order *"
                caption="Select the Order this artwork belongs to. Order ID and Customer ID are carried automatically."
              >

                <div className="flex gap-2">

                  <select
                    value={
                      form.orderId
                    }
                    onChange={(e) =>
                      setForm(
                        (
                          old
                        ) => ({
                          ...old,

                          orderId:
                            e.target.value,
                        })
                      )
                    }
                    className="min-w-0 flex-1 rounded-xl border bg-white px-4 py-3"
                  >

                    <option value="">
                      Select Order
                    </option>

                    {orders.map(
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
                          {
                            order.orderNumber
                          }
                          {" — "}
                          {
                            order.customerName ||
                            "No Customer"
                          }
                        </option>

                      )
                    )}

                  </select>

                  <button
                    type="button"
                    onClick={
                      loadOrders
                    }
                    disabled={
                      loadingOrders
                    }
                    className="rounded-xl border px-4 text-sm font-bold text-blue-700 disabled:opacity-50"
                  >
                    {loadingOrders
                      ? "..."
                      : "↻ Refresh"}
                  </button>

                </div>

              </Field>

              {/* ORDER SUMMARY */}

              {selectedOrder && (

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                  <div className="text-xs font-bold uppercase tracking-wide text-blue-600">
                    Selected Order
                  </div>

                  <div className="mt-2 text-xl font-black">
                    {
                      selectedOrder.orderNumber
                    }
                  </div>

                  <div className="mt-3 grid gap-4 sm:grid-cols-3">

                    <Info
                      label="Customer"
                      value={
                        selectedOrder.customerName
                      }
                    />

                    <Info
                      label="Order Status"
                      value={
                        selectedOrder.status
                      }
                    />

                    <Info
                      label="Delivery Date"
                      value={
                        displayDate(
                          selectedOrder.deliveryDate
                        )
                      }
                    />

                  </div>

                </div>

              )}

              {/* DESIGN NAME */}

              <Field
                label="Recommended Design Name *"
                caption="Choose the embroidery position or design type. Select Other when you need a custom design name."
              >

                <select
                  value={
                    form.designName
                  }
                  onChange={(e) =>
                    setForm(
                      (
                        old
                      ) => ({
                        ...old,

                        designName:
                          e.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border bg-white px-4 py-3"
                >

                  <option value="">
                    Select Design Name
                  </option>

                  {DESIGN_NAMES.map(
                    (
                      design
                    ) => (

                      <option
                        key={
                          design
                        }
                        value={
                          design
                        }
                      >
                        {
                          design
                        }
                      </option>

                    )
                  )}

                </select>

              </Field>

              {form.designName ===
                "Other" && (

                <Field
                  label="Custom Design Name *"
                  caption="Enter the specific design name when it is not available in the recommended list."
                >

                  <input
                    value={
                      form.customDesignName
                    }
                    onChange={(e) =>
                      setForm(
                        (
                          old
                        ) => ({
                          ...old,

                          customDesignName:
                            e.target.value,
                        })
                      )
                    }
                    placeholder="Example: Dealer Logo - Lower Right Back"
                    className="w-full rounded-xl border px-4 py-3"
                  />

                </Field>

              )}

              {/* ARTWORK UPLOAD */}

              <Field
                label="Artwork File *"
                caption="Upload the source artwork received from the customer. Recommended formats: PDF, PNG, JPG, SVG, AI, EPS, PSD or CDR. Maximum file size: 20 MB."
              >

                <div className="rounded-xl border bg-slate-50 p-4">

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">

                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.svg,.ai,.eps,.psd,.cdr,.webp"
                      onChange={
                        handleFileChange
                      }
                      className="w-full rounded-lg border bg-white px-3 py-2"
                    />

                    <button
                      type="button"
                      onClick={
                        uploadArtworkFile
                      }
                      disabled={
                        uploading ||
                        !selectedFile ||
                        !form.orderId
                      }
                      className="rounded-lg bg-blue-700 px-5 py-2 font-bold text-white disabled:opacity-50"
                    >
                      {uploading
                        ? "Uploading..."
                        : "Upload Artwork"}
                    </button>

                  </div>

                  {selectedFile && (

                    <div className="mt-3 rounded-lg bg-white p-3 text-sm">

                      <span className="text-slate-500">
                        Selected:
                      </span>{" "}

                      <strong>
                        {
                          selectedFile.name
                        }
                      </strong>

                    </div>

                  )}

                  {form.fileName && (

                    <div className="mt-3 flex flex-col justify-between gap-2 rounded-lg border border-green-200 bg-green-50 p-3 sm:flex-row sm:items-center">

                      <div>

                        <div className="text-xs font-bold uppercase text-green-700">
                          Uploaded Artwork
                        </div>

                        <div className="mt-1 break-all text-sm font-semibold">
                          {
                            form.fileName
                          }
                        </div>

                      </div>

                      <a
                        href={
                          form.fileName
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-white px-4 py-2 text-center text-sm font-bold text-green-700 shadow-sm"
                      >
                        Open File
                      </a>

                    </div>

                  )}

                </div>

              </Field>

              {/* STATUS */}

              <Field
                label="Artwork Status"
                caption="Use Ready for Digitizing only after the artwork is approved and ready to move to the Digitizing stage."
              >

                <select
                  value={
                    form.status
                  }
                  onChange={(e) =>
                    setForm(
                      (
                        old
                      ) => ({
                        ...old,

                        status:
                          e.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border bg-white px-4 py-3"
                >

                  {ARTWORK_STATUSES.map(
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

              {/* NOTES */}

              <Field
                label="Artwork Notes"
                caption="Add colour requirements, placement instructions, customer changes or other information for the digitizing team."
              >

                <textarea
                  value={
                    form.notes
                  }
                  onChange={(e) =>
                    setForm(
                      (
                        old
                      ) => ({
                        ...old,

                        notes:
                          e.target.value,
                      })
                    )
                  }
                  placeholder="Example: Logo width 90 mm, use black and gold colours, customer approved by email..."
                  className="min-h-28 w-full rounded-xl border px-4 py-3"
                />

              </Field>

            </div>

            <div className="mt-7 flex justify-end gap-3 border-t pt-5">

              <button
                onClick={() => {
                  setShowForm(
                    false
                  );

                  resetForm();
                }}
                disabled={
                  saving ||
                  uploading
                }
                className="rounded-xl border px-5 py-3 font-semibold disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={
                  saveArtwork
                }
                disabled={
                  saving ||
                  uploading ||
                  !form.orderId
                }
                className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editing
                  ? "Update Artwork"
                  : "Save Artwork"}
              </button>

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
  children:
    React.ReactNode;
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

      <div className="mt-1 font-bold">
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

      <div className="mt-1 text-xs text-slate-400">
        {caption}
      </div>

    </div>
  );
}
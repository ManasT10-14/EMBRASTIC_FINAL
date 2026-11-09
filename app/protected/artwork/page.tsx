"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addRecord,
  deleteRecord,
  generateId,
  loadSheet,
  updateRecord,
} from "@/lib/excel-client";

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

const STATUSES = [
  "Pending",
  "In Progress",
  "Approved",
  "Rejected",
];

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
      typeof row?.items ===
      "string"
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
    useState<
      Artwork[]
    >([]);

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
    useState<
      Artwork | null
    >(null);

  const [
    form,
    setForm,
  ] =
    useState({
      orderId: "",
      designName: "",
      fileName: "",
      status: "Pending",
      notes: "",
    });

  useEffect(() => {
    reload();
  }, []);

  /*
   * Fetch Orders DIRECTLY.
   *
   * This intentionally does not use
   * cached page state.
   */
  async function loadOrders() {
    try {
      setLoadingOrders(
        true
      );

      const response =
        await fetch(
          "/api/excel?sheet=Orders",
          {
            cache:
              "no-store",

            headers: {
              "Cache-Control":
                "no-cache",
            },
          }
        );

      const text =
        await response.text();

      let data: any;

      try {
        data =
          JSON.parse(
            text
          );
      } catch {
        throw new Error(
          "Orders API returned invalid JSON."
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to load orders."
        );
      }

      const freshOrders:
        Order[] =
        Array.isArray(
          data.rows
        )
          ? data.rows
              .map(
                (
                  row: any
                ) =>
                  normalizeOrder(
                    row
                  )
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

      /*
       * Newest records first.
       *
       * ISO createdAt values sort
       * correctly as strings.
       */
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

      console.log(
        "Artwork fresh orders:",
        freshOrders
      );

      setOrders(
        freshOrders
      );

      return freshOrders;
    } catch (error) {
      console.error(
        "Artwork order loading error:",
        error
      );

      throw error;
    } finally {
      setLoadingOrders(
        false
      );
    }
  }

  /*
   * Load both Orders and Artwork.
   */
  async function reload() {
    try {
      setLoading(true);

      const [
        freshOrders,
        artworkRows,
      ] =
        await Promise.all([
          loadOrders(),

          loadSheet<Artwork>(
            "Artwork"
          ),
        ]);

      setOrders(
        freshOrders
      );

      const freshArtwork =
        artworkRows
          .map(
            (
              row
            ) =>
              normalizeArtwork(
                row
              )
          )
          .filter(
            (
              artwork
            ) =>
              Boolean(
                artwork.id
              )
          )
          .reverse();

      setArtworks(
        freshArtwork
      );
    } catch (error) {
      console.error(
        "Artwork reload error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load artwork."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditing(null);

    setForm({
      orderId: "",
      designName: "",
      fileName: "",
      status: "Pending",
      notes: "",
    });
  }

  /*
   * Always refresh Orders
   * before opening Add Artwork.
   */
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

  /*
   * Also refresh Orders
   * before Edit.
   */
  async function openEdit(
    artwork: Artwork
  ) {
    try {
      await loadOrders();

      setEditing(
        artwork
      );

      setForm({
        orderId:
          artwork.orderId,

        designName:
          artwork.designName,

        fileName:
          artwork.fileName,

        status:
          artwork.status ||
          "Pending",

        notes:
          artwork.notes,
      });

      setShowForm(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to refresh orders."
      );
    }
  }

  async function refreshOrders() {
    try {
      await loadOrders();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to refresh orders."
      );
    }
  }

  /*
   * Selected Order details.
   */
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

  /*
   * Save Artwork.
   */
  async function saveArtwork() {
    /*
     * Refresh Orders immediately
     * before saving too.
     */
    let currentOrders =
      orders;

    try {
      currentOrders =
        await loadOrders();
    } catch {
      /*
       * If refresh temporarily fails,
       * use the already loaded list.
       */
    }

    const order =
      currentOrders.find(
        (
          item
        ) =>
          String(
            item.id
          ).trim() ===
          String(
            form.orderId
          ).trim()
      );

    if (!order) {
      alert(
        "Please select a valid order."
      );

      return;
    }

    if (
      !form.designName.trim()
    ) {
      alert(
        "Design name is required."
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
          form.designName.trim(),

        fileName:
          form.fileName.trim(),

        status:
          form.status,

        notes:
          form.notes.trim(),
      };

      if (editing) {
        await updateRecord(
          "Artwork",
          editing.id,
          {
            ...editing,
            ...record,
          }
        );
      } else {
        await addRecord(
          "Artwork",
          {
            id:
              generateId(),

            ...record,

            createdAt:
              new Date()
                .toISOString(),
          }
        );
      }

      /*
       * Keep Order workflow
       * synchronized.
       */
      await updateRecord(
        "Orders",
        order.id,
        {
          ...order,

          status:
            "Artwork",
        }
      );

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
          : "Unable to save artwork."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Delete Artwork.
   */
  async function removeArtwork(
    artwork: Artwork
  ) {
    if (
      !confirm(
        `Delete design "${artwork.designName}"?`
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      await deleteRecord(
        "Artwork",
        artwork.id
      );

      await reload();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete artwork."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Search.
   */
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
            artwork.fileName,
            artwork.status,
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

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

        <div>

          <h1 className="text-3xl font-black">
            Artwork & Designs
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Link embroidery designs directly to
            saved customer orders.
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
            ? "Refreshing Orders..."
            : "+ Add Artwork"}
        </button>

      </div>

      {/* STATS */}

      <div className="grid gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border bg-white p-5 shadow-sm">

          <div className="text-sm text-slate-500">
            Artwork Records
          </div>

          <div className="mt-2 text-2xl font-black text-blue-700">
            {artworks.length}
          </div>

        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">

          <div className="text-sm text-slate-500">
            Available Orders
          </div>

          <div className="mt-2 text-2xl font-black text-slate-900">
            {orders.length}
          </div>

        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">

          <div className="text-sm text-slate-500">
            Approved Artwork
          </div>

          <div className="mt-2 text-2xl font-black text-green-600">
            {
              artworks.filter(
                (
                  artwork
                ) =>
                  artwork.status ===
                  "Approved"
              ).length
            }
          </div>

        </div>

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
          placeholder="Search order, customer, design or status..."
          className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
        />

      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

        {loading ? (

          <div className="p-10 text-center text-slate-500">
            Loading artwork from Excel...
          </div>

        ) : filtered.length ===
          0 ? (

          <div className="p-12 text-center">

            <div className="text-5xl">
              🎨
            </div>

            <h2 className="mt-4 text-xl font-bold">
              No artwork found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Add artwork and link it to an existing order.
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
                    File
                  </th>

                  <th className="px-5 py-4">
                    Status
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

                      <td className="px-5 py-4">

                        <div className="font-bold">
                          {
                            artwork.orderNumber ||
                            "—"
                          }
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {artwork.orderId
                            ? `ID: ${artwork.orderId}`
                            : ""}
                        </div>

                      </td>

                      <td className="px-5 py-4">

                        <div className="font-semibold">
                          {
                            artwork.customerName ||
                            "—"
                          }
                        </div>

                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {
                          artwork.designName
                        }
                      </td>

                      <td className="px-5 py-4">
                        {
                          artwork.fileName ||
                          "—"
                        }
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            artwork.status ===
                            "Approved"
                              ? "bg-green-100 text-green-700"
                              : artwork.status ===
                                "Rejected"
                              ? "bg-red-100 text-red-700"
                              : artwork.status ===
                                "In Progress"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {
                            artwork.status
                          }
                        </span>

                      </td>

                      <td className="px-5 py-4">

                        <div className="flex gap-2">

                          <button
                            onClick={() =>
                              openEdit(
                                artwork
                              )
                            }
                            disabled={
                              saving
                            }
                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              removeArtwork(
                                artwork
                              )
                            }
                            disabled={
                              saving
                            }
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
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

      {/* MODAL */}

      {showForm && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

            {/* HEADER */}

            <div className="mb-6 flex items-start justify-between">

              <div>

                <h2 className="text-2xl font-black">
                  {editing
                    ? "Edit Artwork"
                    : "Add Artwork"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Choose a current order from Excel.
                </p>

              </div>

              <button
                onClick={() =>
                  setShowForm(
                    false
                  )
                }
                className="text-2xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>

            </div>

            <div className="space-y-4">

              {/* ORDER */}

              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label className="text-sm font-semibold">
                    Link to Order *
                  </label>

                  <button
                    type="button"
                    onClick={
                      refreshOrders
                    }
                    disabled={
                      loadingOrders
                    }
                    className="text-xs font-bold text-blue-700 disabled:opacity-50"
                  >
                    {loadingOrders
                      ? "Refreshing..."
                      : "↻ Refresh Orders"}
                  </button>

                </div>

                <select
                  value={
                    form.orderId
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      orderId:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-blue-500"
                >

                  <option value="">
                    Select order
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
                          "No customer"
                        }
                      </option>

                    )
                  )}

                </select>

                {/* DEBUG / CONFIRMATION */}

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">

                  <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
                    Orders loaded:{" "}
                    <strong>
                      {orders.length}
                    </strong>
                  </span>

                  {loadingOrders && (
                    <span className="text-blue-600">
                      Refreshing from Excel...
                    </span>
                  )}

                </div>

                {orders.length ===
                  0 &&
                  !loadingOrders && (

                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    No orders were returned from the Orders sheet.
                  </div>

                )}

              </div>

              {/* SELECTED ORDER */}

              {selectedOrder && (

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                  <div className="text-xs font-bold uppercase tracking-wide text-blue-600">
                    Selected Order
                  </div>

                  <div className="mt-2 text-lg font-black">
                    {
                      selectedOrder.orderNumber
                    }
                  </div>

                  <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">

                    <div>

                      <span className="text-slate-500">
                        Customer:
                      </span>{" "}

                      <strong>
                        {
                          selectedOrder.customerName ||
                          "—"
                        }
                      </strong>

                    </div>

                    <div>

                      <span className="text-slate-500">
                        Status:
                      </span>{" "}

                      <strong>
                        {
                          selectedOrder.status ||
                          "—"
                        }
                      </strong>

                    </div>

                  </div>

                  <div className="mt-2 break-all text-xs text-slate-500">
                    Order ID:{" "}
                    {
                      selectedOrder.id
                    }
                  </div>

                  <div className="mt-1 break-all text-xs text-slate-500">
                    Customer ID:{" "}
                    {
                      selectedOrder.customerId ||
                      "—"
                    }
                  </div>

                </div>

              )}

              {/* DESIGN */}

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Design Name *
                </label>

                <input
                  value={
                    form.designName
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      designName:
                        e.target.value,
                    })
                  }
                  placeholder="Example: Left Chest Logo"
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

              {/* FILE */}

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  File Name
                </label>

                <input
                  value={
                    form.fileName
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fileName:
                        e.target.value,
                    })
                  }
                  placeholder="Example: logo-final.png"
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

              {/* STATUS */}

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Artwork Status
                </label>

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
                  className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-blue-500"
                >

                  {STATUSES.map(
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

              {/* NOTES */}

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Notes
                </label>

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
                  placeholder="Artwork notes / revision instructions"
                  className="min-h-28 w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

            </div>

            {/* ACTIONS */}

            <div className="mt-6 flex justify-end gap-3">

              <button
                onClick={() => {
                  setShowForm(
                    false
                  );

                  resetForm();
                }}
                disabled={
                  saving
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
                  loadingOrders
                }
                className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-50"
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
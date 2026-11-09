"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

const DIGITIZING_STATUSES = [
  "Pending",
  "In Progress",
  "Completed",
  "Changes Required",
  "On Hold",
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
      row?.status ?? ""
    ).trim(),

    notes: String(
      row?.notes ?? ""
    ),

    createdAt: String(
      row?.createdAt ?? ""
    ),
  };
}

function normalizeDigitizing(
  row: any
): Digitizing {
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

    artworkId: String(
      row?.artworkId ?? ""
    ).trim(),

    designName: String(
      row?.designName ?? ""
    ).trim(),

    status: String(
      row?.status ??
        "Pending"
    ).trim(),

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

  return String(value)
    .replace("T", " ")
    .slice(0, 16);
}

export default function DigitizingPage() {
  const [
    artworkRecords,
    setArtworkRecords,
  ] =
    useState<Artwork[]>([]);

  const [
    digitizingJobs,
    setDigitizingJobs,
  ] =
    useState<Digitizing[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    loadingArtwork,
    setLoadingArtwork,
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
    useState<Digitizing | null>(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState({
      artworkId: "",
      status: "Pending",
      notes: "",
    });

  useEffect(() => {
    reload();
  }, []);

  async function loadReadyArtwork() {
    try {
      setLoadingArtwork(true);

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
            "Unable to load Artwork."
        );
      }

      const rows: Artwork[] =
        Array.isArray(data.rows)
          ? data.rows
              .map(
                normalizeArtwork
              )
              .filter(
                (
                  artwork: Artwork
                ) =>
                  artwork.id &&
                  artwork.orderId &&
                  artwork.status ===
                    "Ready for Digitizing"
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

      setArtworkRecords(
        rows
      );

      return rows;
    } finally {
      setLoadingArtwork(
        false
      );
    }
  }

  async function loadDigitizing() {
    const response =
      await fetch(
        "/api/excel?sheet=Digitizing",
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
          "Unable to load Digitizing jobs."
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
                  job.id
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

    setDigitizingJobs(
      rows
    );

    return rows;
  }

  async function reload() {
    try {
      setLoading(true);

      await Promise.all([
        loadReadyArtwork(),
        loadDigitizing(),
      ]);
    } catch (error) {
      console.error(
        "Digitizing load error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load Digitizing."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditing(null);

    setForm({
      artworkId: "",
      status: "Pending",
      notes: "",
    });
  }

  async function openCreate() {
    resetForm();

    try {
      await loadReadyArtwork();

      setShowForm(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to refresh ready artwork."
      );
    }
  }

  async function openEdit(
    job: Digitizing
  ) {
    try {
      const readyArtwork =
        await loadReadyArtwork();

      /*
       * Editing an existing Digitizing job:
       * its Artwork may already have moved
       * out of "Ready for Digitizing".
       *
       * Add it temporarily so the selected
       * relationship does not disappear.
       */
      const exists =
        readyArtwork.some(
          (
            artwork
          ) =>
            artwork.id ===
            job.artworkId
        );

      if (!exists) {
        const response =
          await fetch(
            "/api/excel?sheet=Artwork",
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
          const linkedArtwork =
            data.rows
              .map(
                normalizeArtwork
              )
              .find(
                (
                  artwork: Artwork
                ) =>
                  artwork.id ===
                  job.artworkId
              );

          if (linkedArtwork) {
            setArtworkRecords(
              (
                old
              ) => [
                linkedArtwork,
                ...old.filter(
                  (
                    artwork
                  ) =>
                    artwork.id !==
                    linkedArtwork.id
                ),
              ]
            );
          }
        }
      }

      setEditing(job);

      setForm({
        artworkId:
          job.artworkId,

        status:
          job.status ||
          "Pending",

        notes:
          job.notes ||
          "",
      });

      setShowForm(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to open Digitizing job."
      );
    }
  }

  const selectedArtwork =
    useMemo(
      () =>
        artworkRecords.find(
          (
            artwork
          ) =>
            artwork.id ===
            form.artworkId
        ),
      [
        artworkRecords,
        form.artworkId,
      ]
    );

  /*
   * Prevent the same Artwork record
   * from appearing as a new Digitizing
   * option more than once.
   */
  const availableArtwork =
    useMemo(() => {
      return artworkRecords.filter(
        (
          artwork
        ) => {
          if (
            editing &&
            artwork.id ===
              editing.artworkId
          ) {
            return true;
          }

          return !digitizingJobs.some(
            (
              job
            ) =>
              job.artworkId ===
              artwork.id
          );
        }
      );
    }, [
      artworkRecords,
      digitizingJobs,
      editing,
    ]);

  async function saveDigitizing() {
    /*
     * Re-fetch Artwork before saving,
     * so a stale browser cannot create
     * Digitizing from Artwork which is
     * no longer ready.
     */
    let freshArtwork:
      Artwork[] = [];

    try {
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
            "Unable to validate Artwork."
        );
      }

      freshArtwork =
        Array.isArray(data.rows)
          ? data.rows.map(
              normalizeArtwork
            )
          : [];
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to validate Artwork."
      );

      return;
    }

    const artwork =
      freshArtwork.find(
        (
          item
        ) =>
          item.id ===
          form.artworkId
      );

    if (!artwork) {
      alert(
        "Please select a valid Artwork record."
      );

      return;
    }

    /*
     * New Digitizing jobs can only
     * originate from Artwork whose
     * status is Ready for Digitizing.
     */
    if (
      !editing &&
      artwork.status !==
        "Ready for Digitizing"
    ) {
      alert(
        "This Artwork is no longer marked Ready for Digitizing. Refresh the page and select another record."
      );

      await loadReadyArtwork();

      return;
    }

    if (
      !editing &&
      digitizingJobs.some(
        (
          job
        ) =>
          job.artworkId ===
          artwork.id
      )
    ) {
      alert(
        "A Digitizing job already exists for this Artwork."
      );

      return;
    }

    try {
      setSaving(true);

      const record = {
        orderId:
          artwork.orderId,

        orderNumber:
          artwork.orderNumber,

        customerId:
          artwork.customerId,

        customerName:
          artwork.customerName,

        artworkId:
          artwork.id,

        designName:
          artwork.designName,

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
                  "Digitizing",

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
            "Unable to save Digitizing job."
        );
      }

      /*
       * Update Order workflow status.
       */
      let orderStatus =
        "Digitizing";

      if (
        form.status ===
        "Completed"
      ) {
        orderStatus =
          "Production";
      }

      if (
        form.status ===
        "Changes Required"
      ) {
        orderStatus =
          "Artwork";
      }

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
            (
              row: any
            ) =>
              String(
                row?.id ?? ""
              ).trim() ===
              artwork.orderId
          );

        if (order) {
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
                    artwork.orderId,

                  record: {
                    ...order,
                    status:
                      orderStatus,
                  },
                }),
            }
          );
        }
      }

      /*
       * When digitizing starts, Artwork
       * should no longer remain available
       * in the Ready for Digitizing list.
       *
       * Keep Approved as its historical
       * Artwork status.
       */
      if (
        !editing &&
        artwork.status ===
          "Ready for Digitizing"
      ) {
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
                  "Artwork",

                id:
                  artwork.id,

                record: {
                  ...artwork,
                  status:
                    "Approved",
                },
              }),
          }
        );
      }

      setShowForm(false);

      resetForm();

      await reload();
    } catch (error) {
      console.error(
        "Digitizing save error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to save Digitizing job."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteDigitizing(
    job: Digitizing
  ) {
    if (
      !confirm(
        `Delete Digitizing job "${job.designName}" for ${job.orderNumber}?`
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
                  "Digitizing",

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
            "Unable to delete Digitizing job."
        );
      }

      /*
       * Restore linked Artwork to
       * Ready for Digitizing so it can
       * be selected again.
       */
      const artworkResponse =
        await fetch(
          "/api/excel?sheet=Artwork",
          {
            cache: "no-store",
          }
        );

      const artworkData =
        await artworkResponse.json();

      if (
        artworkResponse.ok &&
        artworkData.success &&
        Array.isArray(
          artworkData.rows
        )
      ) {
        const artwork =
          artworkData.rows
            .map(
              normalizeArtwork
            )
            .find(
              (
                item: Artwork
              ) =>
                item.id ===
                job.artworkId
            );

        if (artwork) {
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
                    "Artwork",

                  id:
                    artwork.id,

                  record: {
                    ...artwork,
                    status:
                      "Ready for Digitizing",
                  },
                }),
            }
          );
        }
      }

      await reload();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete Digitizing job."
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
        return digitizingJobs;
      }

      return digitizingJobs.filter(
        (
          job
        ) =>
          [
            job.orderNumber,
            job.customerName,
            job.designName,
            job.status,
            job.notes,
          ]
            .join(" ")
            .toLowerCase()
            .includes(
              query
            )
      );
    }, [
      digitizingJobs,
      search,
    ]);

  const pendingCount =
    digitizingJobs.filter(
      (
        job
      ) =>
        job.status ===
        "Pending"
    ).length;

  const activeCount =
    digitizingJobs.filter(
      (
        job
      ) =>
        job.status ===
        "In Progress"
    ).length;

  const completedCount =
    digitizingJobs.filter(
      (
        job
      ) =>
        job.status ===
        "Completed"
    ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

        <div>

          <h1 className="text-3xl font-black">
            Digitizing
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Only Artwork marked Ready for Digitizing
            is available for new Digitizing jobs.
          </p>

        </div>

        <button
          onClick={
            openCreate
          }
          disabled={
            loadingArtwork
          }
          className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {loadingArtwork
            ? "Refreshing..."
            : "+ New Digitizing Job"}
        </button>

      </div>

      {/* SUMMARY */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
          label="Ready Artwork"
          value={String(
            availableArtwork.length
          )}
          caption="Artwork currently eligible for Digitizing"
        />

        <StatCard
          label="Pending"
          value={String(
            pendingCount
          )}
          caption="Digitizing jobs waiting to start"
        />

        <StatCard
          label="In Progress"
          value={String(
            activeCount
          )}
          caption="Digitizing currently being worked on"
        />

        <StatCard
          label="Completed"
          value={String(
            completedCount
          )}
          caption="Digitizing ready for Production"
        />

      </div>

      {/* SEARCH */}

      <div className="rounded-2xl border bg-white p-4 shadow-sm">

        <input
          value={
            search
          }
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
            Loading Digitizing jobs...
          </div>

        ) : filtered.length ===
          0 ? (

          <div className="p-12 text-center">

            <div className="text-5xl">
              🪡
            </div>

            <h2 className="mt-4 text-xl font-bold">
              No Digitizing jobs
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Mark Artwork as Ready for Digitizing
              before creating a Digitizing job.
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
                    job
                  ) => (

                    <tr
                      key={
                        job.id
                      }
                      className="border-b last:border-0 hover:bg-slate-50"
                    >

                      <td className="px-5 py-4 font-bold">
                        {
                          job.orderNumber ||
                          "—"
                        }
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {
                          job.customerName ||
                          "—"
                        }
                      </td>

                      <td className="px-5 py-4">
                        {
                          job.designName ||
                          "—"
                        }
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            job.status ===
                            "Completed"
                              ? "bg-green-100 text-green-700"
                              : job.status ===
                                "In Progress"
                              ? "bg-yellow-100 text-yellow-700"
                              : job.status ===
                                "Changes Required"
                              ? "bg-orange-100 text-orange-700"
                              : job.status ===
                                "On Hold"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {
                            job.status
                          }
                        </span>

                      </td>

                      <td className="px-5 py-4">
                        {
                          displayDate(
                            job.createdAt
                          )
                        }
                      </td>

                      <td className="px-5 py-4">

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
                              deleteDigitizing(
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

      {/* FORM */}

      {showForm && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

            <div className="mb-6 flex justify-between">

              <div>

                <h2 className="text-2xl font-black">
                  {editing
                    ? "Edit Digitizing Job"
                    : "New Digitizing Job"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select from Artwork marked Ready for Digitizing.
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

              <Field
                label="Ready Artwork *"
                caption="Only Artwork & Design records whose status is Ready for Digitizing appear here."
              >

                <div className="flex gap-2">

                  <select
                    value={
                      form.artworkId
                    }
                    onChange={(e) =>
                      setForm(
                        (
                          old
                        ) => ({
                          ...old,

                          artworkId:
                            e.target.value,
                        })
                      )
                    }
                    disabled={
                      Boolean(
                        editing
                      )
                    }
                    className="min-w-0 flex-1 rounded-xl border bg-white px-4 py-3 disabled:bg-slate-100"
                  >

                    <option value="">
                      Select Ready Artwork
                    </option>

                    {availableArtwork.map(
                      (
                        artwork
                      ) => (

                        <option
                          key={
                            artwork.id
                          }
                          value={
                            artwork.id
                          }
                        >
                          {
                            artwork.orderNumber
                          }
                          {" — "}
                          {
                            artwork.customerName ||
                            "No Customer"
                          }
                          {" — "}
                          {
                            artwork.designName
                          }
                        </option>

                      )
                    )}

                  </select>

                  {!editing && (

                    <button
                      type="button"
                      onClick={
                        loadReadyArtwork
                      }
                      disabled={
                        loadingArtwork
                      }
                      className="rounded-xl border px-4 text-sm font-bold text-blue-700 disabled:opacity-50"
                    >
                      {loadingArtwork
                        ? "..."
                        : "↻ Refresh"}
                    </button>

                  )}

                </div>

                {!editing &&
                  availableArtwork.length ===
                    0 && (

                  <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                    No Artwork is currently marked Ready for Digitizing.
                    Go to Artwork & Design, approve the artwork and change its status to Ready for Digitizing.
                  </div>

                )}

              </Field>

              {selectedArtwork && (

                <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">

                  <div className="text-xs font-bold uppercase text-purple-600">
                    Selected Artwork
                  </div>

                  <div className="mt-2 text-xl font-black">
                    {
                      selectedArtwork.designName
                    }
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">

                    <Info
                      label="Order"
                      value={
                        selectedArtwork.orderNumber
                      }
                    />

                    <Info
                      label="Customer"
                      value={
                        selectedArtwork.customerName
                      }
                    />

                    <Info
                      label="Artwork Status"
                      value={
                        selectedArtwork.status
                      }
                    />

                    <Info
                      label="Artwork File"
                      value={
                        selectedArtwork.fileName
                          ? "Available"
                          : "No File"
                      }
                    />

                  </div>

                  {selectedArtwork.fileName && (

                    <a
                      href={
                        selectedArtwork.fileName
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-bold text-purple-700 shadow-sm"
                    >
                      Open Artwork File
                    </a>

                  )}

                </div>

              )}

              <Field
                label="Digitizing Status"
                caption="Mark Completed when the embroidery file is ready to move to Production."
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

                  {DIGITIZING_STATUSES.map(
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

              <Field
                label="Digitizing Notes"
                caption="Stitch instructions, size, density, thread changes, machine notes or revision information."
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
                  placeholder="Example: 90 mm wide, 7 colours, reduce density around fine lettering..."
                  className="min-h-28 w-full rounded-xl border px-4 py-3"
                />

              </Field>

            </div>

            <div className="mt-6 flex justify-end gap-3 border-t pt-5">

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
                  saveDigitizing
                }
                disabled={
                  saving ||
                  !form.artworkId
                }
                className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white disabled:opacity-50"
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
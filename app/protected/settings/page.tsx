"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* =========================================================
   CONSTANTS
========================================================= */

const SETTINGS_SHEET =
  "Settings";

/* =========================================================
   TYPES
========================================================= */

type SettingsMap = {
  /* COMPANY */
  legalName: string;
  brandName: string;
  tagline: string;

  gstNumber: string;
  panNumber: string;
  msmeNumber: string;

  /* CONTACT */
  contactPerson: string;
  phone: string;
  alternatePhone: string;
  email: string;
  accountsEmail: string;
  website: string;

  /* ADDRESS */
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;

  /* COMMERCIAL */
  currency: string;
  currencySymbol: string;
  timezone: string;
  financialYearStartMonth: string;

  defaultGstPercent: number;
  defaultPaymentTermsDays: number;

  /* BANK */
  bankName: string;
  bankBranch: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;

  /* PREFIXES */
  customerPrefix: string;
  quotationPrefix: string;
  orderPrefix: string;
  artworkPrefix: string;
  digitizingPrefix: string;
  productionPrefix: string;
  qcPrefix: string;
  dispatchPrefix: string;
  invoicePrefix: string;
  paymentPrefix: string;
  expensePrefix: string;

  /* QUOTATION */
  quotationValidityDays: number;
  quotationTerms: string;
  quotationFooter: string;

  /* ORDER */
  defaultOrderLeadDays: number;

  /* ARTWORK */
  defaultArtworkStatus: string;

  /* DIGITIZING */
  defaultMachineFormat: string;
  defaultEmbroideryType: string;
  defaultDensity: number;
  defaultUnderlayType: string;
  defaultPullCompensation: string;

  /* PRODUCTION */
  defaultMachineName: string;
  defaultThreadType: string;
  defaultNeedleType: string;
  defaultProductionStatus: string;

  /* QC */
  defaultInspectorName: string;
  qcRequired: boolean;
  defaultQcStatus: string;

  /* DISPATCH */
  defaultShippingMode: string;
  defaultCourierName: string;

  /* INVOICE */
  invoiceDueDays: number;
  invoiceTerms: string;
  invoiceFooter: string;
  authorizedSignatory: string;

  /* INVENTORY */
  lowStockThreshold: number;
  inventoryDefaultUnit: string;

  /* EXPENSE */
  defaultExpenseTaxPercent: number;

  /* BRANDING */
  logoPath: string;
  primaryColor: string;

  businessOwnerName: string;
  administratorTitle: string;
};

type SettingRow = {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
};

/* =========================================================
   DEFAULT SETTINGS

   IMPORTANT:
   No new Date(), Date.now(), Math.random(), etc. here.
========================================================= */

function defaultSettings(): SettingsMap {
  return {
    /* COMPANY */

    legalName: "",

    brandName:
      "EMBRASTIC",

    tagline:
      "STITCHED TO STAND OUT",

    gstNumber: "",
    panNumber: "",
    msmeNumber: "",

    /* CONTACT */

    contactPerson: "",
    phone: "",
    alternatePhone: "",

    email: "",
    accountsEmail: "",
    website: "",

    /* ADDRESS */

    addressLine1: "",
    addressLine2: "",

    city: "",
    state: "",
    postalCode: "",

    country:
      "India",

    /* COMMERCIAL */

    currency:
      "INR",

    currencySymbol:
      "₹",

    timezone:
      "Asia/Kolkata",

    financialYearStartMonth:
      "April",

    defaultGstPercent:
      18,

    defaultPaymentTermsDays:
      30,

    /* BANK */

    bankName: "",
    bankBranch: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",

    /* PREFIXES */

    customerPrefix:
      "CUS",

    quotationPrefix:
      "QUO",

    orderPrefix:
      "ORD",

    artworkPrefix:
      "ART",

    digitizingPrefix:
      "DIG",

    productionPrefix:
      "PRD",

    qcPrefix:
      "QC",

    dispatchPrefix:
      "DSP",

    invoicePrefix:
      "INV",

    paymentPrefix:
      "PAY",

    expensePrefix:
      "EXP",

    /* QUOTATION */

    quotationValidityDays:
      15,

    quotationTerms:
      "Prices are valid for the stated quotation validity period. Production will begin after artwork approval and commercial confirmation.",

    quotationFooter:
      "Thank you for choosing EMBRASTIC.",

    /* ORDER */

    defaultOrderLeadDays:
      7,

    /* ARTWORK */

    defaultArtworkStatus:
      "Draft",

    /* DIGITIZING */

    defaultMachineFormat:
      "DST",

    defaultEmbroideryType:
      "Flat Embroidery",

    defaultDensity:
      0.4,

    defaultUnderlayType:
      "Edge Run",

    defaultPullCompensation:
      "0.2 mm",

    /* PRODUCTION */

    defaultMachineName:
      "",

    defaultThreadType:
      "Standard Polyester",

    defaultNeedleType:
      "75/11",

    defaultProductionStatus:
      "Pending",

    /* QC */

    defaultInspectorName:
      "",

    qcRequired:
      true,

    defaultQcStatus:
      "Hold",

    /* DISPATCH */

    defaultShippingMode:
      "Courier",

    defaultCourierName:
      "",

    /* INVOICE */

    invoiceDueDays:
      30,

    invoiceTerms:
      "Payment is due within the agreed payment terms.",

    invoiceFooter:
      "This is a computer-generated invoice.",

    authorizedSignatory:
      "",

    /* INVENTORY */

    lowStockThreshold:
      10,

    inventoryDefaultUnit:
      "Pieces",

    /* EXPENSE */

    defaultExpenseTaxPercent:
      18,

    /* BRANDING */

    logoPath:
      "/EMBRASTICLogo.jpeg",

    primaryColor:
      "#1D4ED8",

    businessOwnerName:
      "Business Owner",

    administratorTitle:
      "Administrator",
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

function settingId(
  key: keyof SettingsMap
) {
  return `setting-${String(
    key
  )}`;
}

function toStoredValue(
  value:
    SettingsMap[keyof SettingsMap]
) {
  if (
    typeof value ===
    "boolean"
  ) {
    return value
      ? "true"
      : "false";
  }

  return String(
    value
  );
}

function parseSettingValue<
  K extends keyof SettingsMap
>(
  key: K,
  value: string,
  defaults: SettingsMap
): SettingsMap[K] {
  const defaultValue =
    defaults[key];

  if (
    typeof defaultValue ===
    "number"
  ) {
    const parsed =
      Number(value);

    return (
      Number.isFinite(
        parsed
      )
        ? parsed
        : defaultValue
    ) as SettingsMap[K];
  }

  if (
    typeof defaultValue ===
    "boolean"
  ) {
    const normalized =
      clean(value)
        .toLowerCase();

    return (
      [
        "true",
        "yes",
        "1",
        "on",
      ].includes(
        normalized
      )
    ) as SettingsMap[K];
  }

  return String(
    value ?? ""
  ) as SettingsMap[K];
}

/* =========================================================
   PAGE
========================================================= */

export default function SettingsPage() {
  const [
    settings,
    setSettings,
  ] =
    useState<SettingsMap>(
      defaultSettings()
    );

  const [
    savedSettings,
    setSavedSettings,
  ] =
    useState<SettingsMap>(
      defaultSettings()
    );

  const [
    rows,
    setRows,
  ] =
    useState<SettingRow[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    messageType,
    setMessageType,
  ] =
    useState<
      "success" |
      "error" |
      "info"
    >("info");

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadSettings();
  }, []);

  /* =======================================================
     API - LOAD SHEET
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
          method:
            "GET",

          cache:
            "no-store",
        }
      );

    let data: any = {};

    try {
      data =
        await response.json();
    } catch {
      throw new Error(
        `Unable to read response while loading ${sheet}.`
      );
    }

    if (
      !response.ok ||
      !data?.success
    ) {
      throw new Error(
        data?.error ||
          data?.message ||
          `Unable to load ${sheet}.`
      );
    }

    return Array.isArray(
      data.rows
    )
      ? data.rows
      : [];
  }

  /* =======================================================
     API - SAVE
  ======================================================= */

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
      throw new Error(
        "Excel API returned an invalid response."
      );
    }

    if (
      !response.ok ||
      !data?.success
    ) {
      console.error(
        "Settings save request failed:",
        {
          request:
            body,

          response:
            data,

          status:
            response.status,
        }
      );

      throw new Error(
        data?.error ||
          data?.message ||
          "Failed to save Settings."
      );
    }

    return data;
  }

  /* =======================================================
     NORMALIZE SETTINGS ROWS
  ======================================================= */

  function normalizeRows(
    loadedRows: any[]
  ) {
    return loadedRows
      .map(
        (
          row: any
        ): SettingRow => ({
          id:
            clean(
              row?.id
            ),

          key:
            clean(
              row?.key
            ),

          value:
            String(
              row?.value ??
                ""
            ),

          updatedAt:
            clean(
              row?.updatedAt
            ),
        })
      )
      .filter(
        (
          row
        ) =>
          Boolean(
            row.key
          )
      );
  }

  /* =======================================================
     CONVERT ROWS -> SETTINGS
  ======================================================= */

  function rowsToSettings(
    normalizedRows:
      SettingRow[]
  ) {
    const defaults =
      defaultSettings();

    const merged: SettingsMap = {
      ...defaults,
    };

    normalizedRows.forEach(
      (
        row
      ) => {
        const key =
          row.key as
            keyof SettingsMap;

        if (
          key in defaults
        ) {
          (
            merged as any
          )[key] =
            parseSettingValue(
              key,
              row.value,
              defaults
            );
        }
      }
    );

    return merged;
  }

  /* =======================================================
     LOAD SETTINGS
  ======================================================= */

  async function loadSettings() {
    try {
      setLoading(
        true
      );

      setMessage("");

      const loadedRows =
        await loadSheet(
          SETTINGS_SHEET
        );

      const normalizedRows =
        normalizeRows(
          loadedRows
        );

      const merged =
        rowsToSettings(
          normalizedRows
        );

      setRows(
        normalizedRows
      );

      setSettings(
        merged
      );

      setSavedSettings(
        merged
      );
    } catch (error) {
      console.error(
        "Settings load error:",
        error
      );

      setMessageType(
        "error"
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load Settings."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  /* =======================================================
     HAS CHANGES
  ======================================================= */

  const changedKeys =
    useMemo(() => {
      const keys =
        Object.keys(
          settings
        ) as Array<
          keyof SettingsMap
        >;

      return keys.filter(
        (
          key
        ) =>
          settings[key] !==
          savedSettings[key]
      );
    }, [
      settings,
      savedSettings,
    ]);

  const hasChanges =
    changedKeys.length >
    0;

  /* =======================================================
     UPDATE FIELD
  ======================================================= */

  function updateField<
    K extends keyof SettingsMap
  >(
    key: K,
    value:
      SettingsMap[K]
  ) {
    setSettings(
      (
        current
      ) => ({
        ...current,

        [key]:
          value,
      })
    );

    setMessage("");
  }

  /* =======================================================
     SAVE SETTINGS

     Settings sheet structure:

     id | key | value | updatedAt

     IMPORTANT:
     Current Excel API expects row arrays.
  ======================================================= */

  async function saveSettings() {
    if (
      !settings.brandName.trim()
    ) {
      setMessageType(
        "error"
      );

      setMessage(
        "Brand Name is required."
      );

      return;
    }

    if (
      changedKeys.length ===
      0
    ) {
      setMessageType(
        "info"
      );

      setMessage(
        "No changes to save."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      setMessage("");

      /*
       * Current time is evaluated only after
       * the user presses Save.
       */
      const updatedAt =
        new Date()
          .toISOString();

      /*
       * Work from the most recent sheet data
       * rather than relying only on old browser state.
       */
      const latestRawRows =
        await loadSheet(
          SETTINGS_SHEET
        );

      const latestRows =
        normalizeRows(
          latestRawRows
        );

      /*
       * Save changed settings one at a time.
       *
       * Excel row layout:
       *
       * [
       *   id,
       *   key,
       *   value,
       *   updatedAt
       * ]
       */
      for (
        const key of
        changedKeys
      ) {
        const existing =
          latestRows.find(
            (
              row
            ) =>
              row.key ===
              String(key)
          );

        const value =
          toStoredValue(
            settings[key]
          );

        if (
          existing?.id
        ) {
          /* ============================================
             UPDATE
          ============================================ */

          await saveExcel({
            action:
              "update",

            sheet:
              SETTINGS_SHEET,

            id:
              existing.id,

            row: [
              existing.id,
              String(key),
              value,
              updatedAt,
            ],
          });
        } else {
          /* ============================================
             ADD
          ============================================ */

          const id =
            settingId(
              key
            );

          await saveExcel({
            action:
              "add",

            sheet:
              SETTINGS_SHEET,

            row: [
              id,
              String(key),
              value,
              updatedAt,
            ],
          });
        }
      }

      /*
       * Read everything back from Excel.
       *
       * This verifies that the save actually
       * persisted to the workbook.
       */
      const verifyRawRows =
        await loadSheet(
          SETTINGS_SHEET
        );

      const verifyRows =
        normalizeRows(
          verifyRawRows
        );

      const verifiedSettings =
        rowsToSettings(
          verifyRows
        );

      /*
       * Verify every changed field.
       */
      const failedKeys =
        changedKeys.filter(
          (
            key
          ) =>
            String(
              verifiedSettings[
                key
              ]
            ) !==
            String(
              settings[key]
            )
        );

      if (
        failedKeys.length >
        0
      ) {
        throw new Error(
          `Settings were sent to Excel but these values could not be verified: ${failedKeys.join(
            ", "
          )}`
        );
      }

      setRows(
        verifyRows
      );

      setSettings(
        verifiedSettings
      );

      setSavedSettings(
        verifiedSettings
      );

      setMessageType(
        "success"
      );

      setMessage(
        `${changedKeys.length} setting${
          changedKeys.length ===
          1
            ? ""
            : "s"
        } saved successfully.`
      );
    } catch (error) {
      console.error(
        "Settings save error:",
        error
      );

      setMessageType(
        "error"
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save Settings."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =======================================================
     UNDO
  ======================================================= */

  function undoChanges() {
    setSettings(
      savedSettings
    );

    setMessageType(
      "info"
    );

    setMessage(
      "Unsaved changes discarded."
    );
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">

        <div className="text-center">

          <div className="text-4xl">
            ⚙️
          </div>

          <div className="mt-4 text-lg font-black">
            Loading Company Settings...
          </div>

          <div className="mt-1 text-sm text-slate-500">
            Reading configuration from Excel
          </div>

        </div>

      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-28">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">

        <div>

          <div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
            System Configuration
          </div>

          <h1 className="text-3xl font-black">
            Company Settings
          </h1>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Manage company identity, tax information, document numbering, embroidery defaults, banking, invoicing, inventory and application branding.
          </p>

        </div>

        <div className="flex flex-wrap gap-2">

          {hasChanges && (

            <div className="flex items-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
              {changedKeys.length} unsaved change
              {changedKeys.length ===
              1
                ? ""
                : "s"}
            </div>

          )}

          <button
            type="button"
            onClick={() =>
              void loadSettings()
            }
            disabled={
              saving
            }
            className="rounded-xl border bg-white px-4 py-3 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={
              undoChanges
            }
            disabled={
              !hasChanges ||
              saving
            }
            className="rounded-xl border bg-white px-4 py-3 text-sm font-bold hover:bg-slate-50 disabled:opacity-40"
          >
            Undo
          </button>

          <button
            type="button"
            onClick={() =>
              void saveSettings()
            }
            disabled={
              !hasChanges ||
              saving
            }
            className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Settings"}
          </button>

        </div>

      </div>

      {/* =================================================
          MESSAGE
      ================================================= */}

      {message && (

        <div
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            messageType ===
            "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : messageType ===
                "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-blue-200 bg-blue-50 text-blue-700"
          }`}
        >
          {message}
        </div>

      )}

      {/* =================================================
          COMPANY
      ================================================= */}

      <SettingsSection
        icon="🏢"
        title="Company Identity"
        description="Business information used across quotations, invoices and reports."
      >

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

          <TextField
            label="Legal Company Name"
            caption="Registered legal name."
            value={
              settings.legalName
            }
            onChange={(value) =>
              updateField(
                "legalName",
                value
              )
            }
          />

          <TextField
            label="Brand Name *"
            caption="Customer-facing trading name."
            value={
              settings.brandName
            }
            onChange={(value) =>
              updateField(
                "brandName",
                value
              )
            }
          />

          <TextField
            label="Tagline"
            caption="Brand tagline."
            value={
              settings.tagline
            }
            onChange={(value) =>
              updateField(
                "tagline",
                value
              )
            }
          />

          <TextField
            label="GST Number"
            caption="GST registration number."
            value={
              settings.gstNumber
            }
            uppercase
            onChange={(value) =>
              updateField(
                "gstNumber",
                value
              )
            }
          />

          <TextField
            label="PAN Number"
            caption="PAN number."
            value={
              settings.panNumber
            }
            uppercase
            onChange={(value) =>
              updateField(
                "panNumber",
                value
              )
            }
          />

          <TextField
            label="MSME / Udyam Number"
            caption="Optional MSME registration."
            value={
              settings.msmeNumber
            }
            onChange={(value) =>
              updateField(
                "msmeNumber",
                value
              )
            }
          />

        </div>

      </SettingsSection>

      {/* =================================================
          CONTACT
      ================================================= */}

      <SettingsSection
        icon="☎️"
        title="Contact Information"
        description="Primary company communication information."
      >

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

          <TextField
            label="Contact Person"
            caption="Primary business contact."
            value={
              settings.contactPerson
            }
            onChange={(value) =>
              updateField(
                "contactPerson",
                value
              )
            }
          />

          <TextField
            label="Primary Phone"
            caption="Main business phone."
            value={
              settings.phone
            }
            onChange={(value) =>
              updateField(
                "phone",
                value
              )
            }
          />

          <TextField
            label="Alternate Phone"
            caption="Optional alternate contact."
            value={
              settings.alternatePhone
            }
            onChange={(value) =>
              updateField(
                "alternatePhone",
                value
              )
            }
          />

          <TextField
            label="Business Email"
            caption="General communication email."
            value={
              settings.email
            }
            type="email"
            onChange={(value) =>
              updateField(
                "email",
                value
              )
            }
          />

          <TextField
            label="Accounts Email"
            caption="Email used for billing."
            value={
              settings.accountsEmail
            }
            type="email"
            onChange={(value) =>
              updateField(
                "accountsEmail",
                value
              )
            }
          />

          <TextField
            label="Website"
            caption="Company website."
            value={
              settings.website
            }
            onChange={(value) =>
              updateField(
                "website",
                value
              )
            }
          />

        </div>

      </SettingsSection>

      {/* =================================================
          ADDRESS
      ================================================= */}

      <SettingsSection
        icon="📍"
        title="Business Address"
        description="Default address printed on commercial documents."
      >

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

          <div className="lg:col-span-2">

            <TextField
              label="Address Line 1"
              caption="Street / building address."
              value={
                settings.addressLine1
              }
              onChange={(value) =>
                updateField(
                  "addressLine1",
                  value
                )
              }
            />

          </div>

          <TextField
            label="Address Line 2"
            caption="Additional address information."
            value={
              settings.addressLine2
            }
            onChange={(value) =>
              updateField(
                "addressLine2",
                value
              )
            }
          />

          <TextField
            label="City"
            caption="City."
            value={
              settings.city
            }
            onChange={(value) =>
              updateField(
                "city",
                value
              )
            }
          />

          <TextField
            label="State"
            caption="State."
            value={
              settings.state
            }
            onChange={(value) =>
              updateField(
                "state",
                value
              )
            }
          />

          <TextField
            label="Postal Code"
            caption="PIN / postal code."
            value={
              settings.postalCode
            }
            onChange={(value) =>
              updateField(
                "postalCode",
                value
              )
            }
          />

          <TextField
            label="Country"
            caption="Country."
            value={
              settings.country
            }
            onChange={(value) =>
              updateField(
                "country",
                value
              )
            }
          />

        </div>

      </SettingsSection>

      {/* =================================================
          COMMERCIAL
      ================================================= */}

      <SettingsSection
        icon="💼"
        title="Commercial & Tax Defaults"
        description="Default values used when creating quotations, orders and invoices."
      >

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

          <SelectField
            label="Currency"
            value={
              settings.currency
            }
            options={[
              "INR",
              "USD",
              "EUR",
              "GBP",
              "AED",
            ]}
            onChange={(value) =>
              updateField(
                "currency",
                value
              )
            }
          />

          <TextField
            label="Currency Symbol"
            caption="Displayed beside financial amounts."
            value={
              settings.currencySymbol
            }
            onChange={(value) =>
              updateField(
                "currencySymbol",
                value
              )
            }
          />

          <NumberField
            label="Default GST %"
            caption="Default GST rate."
            value={
              settings.defaultGstPercent
            }
            step="0.01"
            onChange={(value) =>
              updateField(
                "defaultGstPercent",
                value
              )
            }
          />

          <NumberField
            label="Payment Terms Days"
            caption="Default customer payment period."
            value={
              settings.defaultPaymentTermsDays
            }
            onChange={(value) =>
              updateField(
                "defaultPaymentTermsDays",
                value
              )
            }
          />

          <SelectField
            label="Financial Year Starts"
            value={
              settings.financialYearStartMonth
            }
            options={[
              "January",
              "April",
              "July",
              "October",
            ]}
            onChange={(value) =>
              updateField(
                "financialYearStartMonth",
                value
              )
            }
          />

          <SelectField
            label="Timezone"
            value={
              settings.timezone
            }
            options={[
              "Asia/Kolkata",
              "Asia/Dubai",
              "Europe/London",
              "America/New_York",
            ]}
            onChange={(value) =>
              updateField(
                "timezone",
                value
              )
            }
          />

        </div>

      </SettingsSection>

      {/* =================================================
          NUMBERING
      ================================================= */}

      <SettingsSection
        icon="🔢"
        title="Document Number Prefixes"
        description="Prefixes used when business documents are numbered."
      >

        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">

          <PrefixField
            label="Customer"
            value={
              settings.customerPrefix
            }
            onChange={(value) =>
              updateField(
                "customerPrefix",
                value
              )
            }
          />

          <PrefixField
            label="Quotation"
            value={
              settings.quotationPrefix
            }
            onChange={(value) =>
              updateField(
                "quotationPrefix",
                value
              )
            }
          />

          <PrefixField
            label="Order"
            value={
              settings.orderPrefix
            }
            onChange={(value) =>
              updateField(
                "orderPrefix",
                value
              )
            }
          />

          <PrefixField
            label="Artwork"
            value={
              settings.artworkPrefix
            }
            onChange={(value) =>
              updateField(
                "artworkPrefix",
                value
              )
            }
          />

          <PrefixField
            label="Digitizing"
            value={
              settings.digitizingPrefix
            }
            onChange={(value) =>
              updateField(
                "digitizingPrefix",
                value
              )
            }
          />

          <PrefixField
            label="Production"
            value={
              settings.productionPrefix
            }
            onChange={(value) =>
              updateField(
                "productionPrefix",
                value
              )
            }
          />

          <PrefixField
            label="Quality Control"
            value={
              settings.qcPrefix
            }
            onChange={(value) =>
              updateField(
                "qcPrefix",
                value
              )
            }
          />

          <PrefixField
            label="Dispatch"
            value={
              settings.dispatchPrefix
            }
            onChange={(value) =>
              updateField(
                "dispatchPrefix",
                value
              )
            }
          />

          <PrefixField
            label="Invoice"
            value={
              settings.invoicePrefix
            }
            onChange={(value) =>
              updateField(
                "invoicePrefix",
                value
              )
            }
          />

          <PrefixField
            label="Payment"
            value={
              settings.paymentPrefix
            }
            onChange={(value) =>
              updateField(
                "paymentPrefix",
                value
              )
            }
          />

          <PrefixField
            label="Expense"
            value={
              settings.expensePrefix
            }
            onChange={(value) =>
              updateField(
                "expensePrefix",
                value
              )
            }
          />

        </div>

        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">

          <div className="text-xs font-bold uppercase tracking-wide text-blue-600">
            Example Order Number
          </div>

          <div className="mt-1 text-lg font-black text-blue-900">
            {settings.orderPrefix ||
              "ORD"}
            -2026-0001
          </div>

        </div>

      </SettingsSection>

      {/* =================================================
          QUOTATION
      ================================================= */}

      <SettingsSection
        icon="📝"
        title="Quotation Defaults"
        description="Default commercial settings for new quotations."
      >

        <div className="grid gap-5 md:grid-cols-2">

          <NumberField
            label="Quotation Validity Days"
            caption="Default quotation validity period."
            value={
              settings.quotationValidityDays
            }
            onChange={(value) =>
              updateField(
                "quotationValidityDays",
                value
              )
            }
          />

          <NumberField
            label="Order Lead Time Days"
            caption="Default production lead time."
            value={
              settings.defaultOrderLeadDays
            }
            onChange={(value) =>
              updateField(
                "defaultOrderLeadDays",
                value
              )
            }
          />

          <div className="md:col-span-2">

            <TextareaField
              label="Quotation Terms"
              caption="Default terms printed on quotations."
              value={
                settings.quotationTerms
              }
              onChange={(value) =>
                updateField(
                  "quotationTerms",
                  value
                )
              }
            />

          </div>

          <div className="md:col-span-2">

            <TextareaField
              label="Quotation Footer"
              caption="Default footer message."
              value={
                settings.quotationFooter
              }
              onChange={(value) =>
                updateField(
                  "quotationFooter",
                  value
                )
              }
            />

          </div>

        </div>

      </SettingsSection>

      {/* =================================================
          ARTWORK
      ================================================= */}

      <SettingsSection
        icon="🎨"
        title="Artwork Defaults"
        description="Default status for newly-created artwork records."
      >

        <div className="grid gap-5 md:grid-cols-2">

          <SelectField
            label="Default Artwork Status"
            value={
              settings.defaultArtworkStatus
            }
            options={[
              "Draft",
              "Awaiting Customer Approval",
              "Revision Required",
              "Approved",
              "Ready for Digitizing",
            ]}
            onChange={(value) =>
              updateField(
                "defaultArtworkStatus",
                value
              )
            }
          />

        </div>

      </SettingsSection>

      {/* =================================================
          DIGITIZING
      ================================================= */}

      <SettingsSection
        icon="🧵"
        title="Digitizing Defaults"
        description="Technical defaults used for embroidery digitizing."
      >

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

          <SelectField
            label="Machine Format"
            value={
              settings.defaultMachineFormat
            }
            options={[
              "DST",
              "PES",
              "EXP",
              "JEF",
              "VP3",
              "XXX",
              "HUS",
            ]}
            onChange={(value) =>
              updateField(
                "defaultMachineFormat",
                value
              )
            }
          />

          <SelectField
            label="Embroidery Type"
            value={
              settings.defaultEmbroideryType
            }
            options={[
              "Flat Embroidery",
              "3D Puff Embroidery",
              "Applique Embroidery",
              "Chenille Embroidery",
              "Patch / Badge",
              "Sequin Embroidery",
            ]}
            onChange={(value) =>
              updateField(
                "defaultEmbroideryType",
                value
              )
            }
          />

          <NumberField
            label="Default Density"
            caption="Default stitch density."
            value={
              settings.defaultDensity
            }
            step="0.01"
            onChange={(value) =>
              updateField(
                "defaultDensity",
                value
              )
            }
          />

          <SelectField
            label="Underlay Type"
            value={
              settings.defaultUnderlayType
            }
            options={[
              "Edge Run",
              "Center Run",
              "Zigzag",
              "Double Zigzag",
              "Tatami Underlay",
              "Combination",
              "None",
            ]}
            onChange={(value) =>
              updateField(
                "defaultUnderlayType",
                value
              )
            }
          />

          <SelectField
            label="Pull Compensation"
            value={
              settings.defaultPullCompensation
            }
            options={[
              "0.1 mm",
              "0.2 mm",
              "0.3 mm",
              "0.4 mm",
              "0.5 mm",
              "0.6 mm",
            ]}
            onChange={(value) =>
              updateField(
                "defaultPullCompensation",
                value
              )
            }
          />

        </div>

      </SettingsSection>

      {/* =================================================
          PRODUCTION
      ================================================= */}

      <SettingsSection
        icon="🪡"
        title="Production Defaults"
        description="Machine, thread and needle defaults for embroidery production."
      >

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

          <TextField
            label="Default Machine Name"
            caption="Preferred embroidery machine."
            value={
              settings.defaultMachineName
            }
            onChange={(value) =>
              updateField(
                "defaultMachineName",
                value
              )
            }
          />

          <SelectField
            label="Thread Type"
            value={
              settings.defaultThreadType
            }
            options={[
              "Standard Polyester",
              "Rayon",
              "Metallic",
              "Cotton",
              "Reflective",
              "Specialty Thread",
            ]}
            onChange={(value) =>
              updateField(
                "defaultThreadType",
                value
              )
            }
          />

          <SelectField
            label="Needle Type"
            value={
              settings.defaultNeedleType
            }
            options={[
              "65/9",
              "70/10",
              "75/11",
              "80/12",
              "90/14",
            ]}
            onChange={(value) =>
              updateField(
                "defaultNeedleType",
                value
              )
            }
          />

          <SelectField
            label="Initial Production Status"
            value={
              settings.defaultProductionStatus
            }
            options={[
              "Pending",
              "Scheduled",
              "In Progress",
              "Completed",
            ]}
            onChange={(value) =>
              updateField(
                "defaultProductionStatus",
                value
              )
            }
          />

        </div>

      </SettingsSection>

      {/* =================================================
          QC
      ================================================= */}

      <SettingsSection
        icon="✅"
        title="Quality Control Defaults"
        description="Default inspection values and workflow requirements."
      >

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

          <TextField
            label="Default Inspector"
            caption="Default QC inspector."
            value={
              settings.defaultInspectorName
            }
            onChange={(value) =>
              updateField(
                "defaultInspectorName",
                value
              )
            }
          />

          <SelectField
            label="Default QC Status"
            value={
              settings.defaultQcStatus
            }
            options={[
              "Hold",
              "Pending",
              "In Inspection",
              "Pass",
              "Fail",
              "Rework Required",
            ]}
            onChange={(value) =>
              updateField(
                "defaultQcStatus",
                value
              )
            }
          />

          <Field
            label="QC Required Before Dispatch"
            caption="Enable to enforce Production → QC → Dispatch."
          >

            <button
              type="button"
              onClick={() =>
                updateField(
                  "qcRequired",
                  !settings.qcRequired
                )
              }
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 font-bold ${
                settings.qcRequired
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >

              <span>
                {settings.qcRequired
                  ? "Required"
                  : "Not Required"}
              </span>

              <span className="text-lg">
                {settings.qcRequired
                  ? "✓"
                  : "○"}
              </span>

            </button>

          </Field>

        </div>

      </SettingsSection>

      {/* =================================================
          DISPATCH
      ================================================= */}

      <SettingsSection
        icon="🚚"
        title="Dispatch Defaults"
        description="Default logistics options used for customer dispatch."
      >

        <div className="grid gap-5 md:grid-cols-2">

          <SelectField
            label="Default Shipping Mode"
            value={
              settings.defaultShippingMode
            }
            options={[
              "Courier",
              "Transport",
              "Local Delivery",
              "Company Vehicle",
              "Customer Pickup",
              "Hand Delivery",
              "Air Cargo",
              "Surface Transport",
              "Other",
            ]}
            onChange={(value) =>
              updateField(
                "defaultShippingMode",
                value
              )
            }
          />

          <TextField
            label="Default Courier / Transporter"
            caption="Preferred logistics company."
            value={
              settings.defaultCourierName
            }
            onChange={(value) =>
              updateField(
                "defaultCourierName",
                value
              )
            }
          />

        </div>

      </SettingsSection>

      {/* =================================================
          INVOICE
      ================================================= */}

      <SettingsSection
        icon="🧾"
        title="Invoice Defaults"
        description="Default invoice terms and document information."
      >

        <div className="grid gap-5 md:grid-cols-2">

          <NumberField
            label="Invoice Due Days"
            caption="Default invoice payment period."
            value={
              settings.invoiceDueDays
            }
            onChange={(value) =>
              updateField(
                "invoiceDueDays",
                value
              )
            }
          />

          <TextField
            label="Authorized Signatory"
            caption="Name displayed as authorized signatory."
            value={
              settings.authorizedSignatory
            }
            onChange={(value) =>
              updateField(
                "authorizedSignatory",
                value
              )
            }
          />

          <div className="md:col-span-2">

            <TextareaField
              label="Invoice Terms"
              caption="Default invoice payment terms."
              value={
                settings.invoiceTerms
              }
              onChange={(value) =>
                updateField(
                  "invoiceTerms",
                  value
                )
              }
            />

          </div>

          <div className="md:col-span-2">

            <TextareaField
              label="Invoice Footer"
              caption="Default invoice footer."
              value={
                settings.invoiceFooter
              }
              onChange={(value) =>
                updateField(
                  "invoiceFooter",
                  value
                )
              }
            />

          </div>

        </div>

      </SettingsSection>

      {/* =================================================
          BANK
      ================================================= */}

      <SettingsSection
        icon="🏦"
        title="Bank & Payment Details"
        description="Bank information that can be printed on invoices and quotations."
      >

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

          <TextField
            label="Bank Name"
            caption="Company bank."
            value={
              settings.bankName
            }
            onChange={(value) =>
              updateField(
                "bankName",
                value
              )
            }
          />

          <TextField
            label="Branch"
            caption="Bank branch."
            value={
              settings.bankBranch
            }
            onChange={(value) =>
              updateField(
                "bankBranch",
                value
              )
            }
          />

          <TextField
            label="Account Name"
            caption="Account holder name."
            value={
              settings.accountName
            }
            onChange={(value) =>
              updateField(
                "accountName",
                value
              )
            }
          />

          <TextField
            label="Account Number"
            caption="Bank account number."
            value={
              settings.accountNumber
            }
            onChange={(value) =>
              updateField(
                "accountNumber",
                value
              )
            }
          />

          <TextField
            label="IFSC Code"
            caption="Bank IFSC."
            value={
              settings.ifscCode
            }
            uppercase
            onChange={(value) =>
              updateField(
                "ifscCode",
                value
              )
            }
          />

          <TextField
            label="UPI ID"
            caption="Business UPI ID."
            value={
              settings.upiId
            }
            onChange={(value) =>
              updateField(
                "upiId",
                value
              )
            }
          />

        </div>

      </SettingsSection>

      {/* =================================================
          INVENTORY
      ================================================= */}

      <SettingsSection
        icon="📋"
        title="Inventory & Expense Defaults"
        description="Stock thresholds, measurement units and expense tax defaults."
      >

        <div className="grid gap-5 md:grid-cols-3">

          <NumberField
            label="Low Stock Threshold"
            caption="Default reorder warning level."
            value={
              settings.lowStockThreshold
            }
            onChange={(value) =>
              updateField(
                "lowStockThreshold",
                value
              )
            }
          />

          <SelectField
            label="Default Inventory Unit"
            value={
              settings.inventoryDefaultUnit
            }
            options={[
              "Pieces",
              "Cones",
              "Rolls",
              "Meters",
              "Kilograms",
              "Boxes",
              "Packs",
              "Sets",
            ]}
            onChange={(value) =>
              updateField(
                "inventoryDefaultUnit",
                value
              )
            }
          />

          <NumberField
            label="Default Expense Tax %"
            caption="Default tax rate used for expenses."
            value={
              settings.defaultExpenseTaxPercent
            }
            step="0.01"
            onChange={(value) =>
              updateField(
                "defaultExpenseTaxPercent",
                value
              )
            }
          />

        </div>

      </SettingsSection>

      {/* =================================================
          BRANDING
      ================================================= */}

      <SettingsSection
        icon="🎨"
        title="Application Branding"
        description="Company branding used throughout EMBRASTIC Business OS."
      >

        <div className="grid gap-5 md:grid-cols-2">

          <TextField
            label="Logo Path"
            caption="Example: /EMBRASTICLogo.jpeg"
            value={
              settings.logoPath
            }
            onChange={(value) =>
              updateField(
                "logoPath",
                value
              )
            }
          />

          <Field
            label="Primary Brand Color"
            caption="Primary interface accent color."
          >

            <div className="flex gap-3">

              <input
                type="color"
                value={
                  settings.primaryColor
                }
                onChange={(e) =>
                  updateField(
                    "primaryColor",
                    e.target.value
                  )
                }
                className="h-12 w-16 cursor-pointer rounded-xl border bg-white p-1"
              />

              <input
                value={
                  settings.primaryColor
                }
                onChange={(e) =>
                  updateField(
                    "primaryColor",
                    e.target.value
                  )
                }
                className={`${inputClass} flex-1 font-mono`}
              />

            </div>

          </Field>

          <TextField
            label="Business Owner Display Name"
            caption="Displayed in the application header."
            value={
              settings.businessOwnerName
            }
            onChange={(value) =>
              updateField(
                "businessOwnerName",
                value
              )
            }
          />

          <TextField
            label="Administrator Title"
            caption="Displayed below the user name."
            value={
              settings.administratorTitle
            }
            onChange={(value) =>
              updateField(
                "administratorTitle",
                value
              )
            }
          />

        </div>

      </SettingsSection>

      {/* =================================================
          STORAGE INFORMATION
      ================================================= */}

      <SettingsSection
        icon="💾"
        title="Settings Storage"
        description="Information about the current Settings data."
      >

        <div className="grid gap-4 sm:grid-cols-3">

          <InfoCard
            label="Stored Settings"
            value={String(
              rows.length
            )}
          />

          <InfoCard
            label="Unsaved Changes"
            value={String(
              changedKeys.length
            )}
          />

          <InfoCard
            label="Storage Sheet"
            value={
              SETTINGS_SHEET
            }
          />

        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">

          Settings are stored as individual rows using:

          <div className="mt-2 rounded-lg border bg-white px-3 py-2 font-mono text-slate-700">
            id | key | value | updatedAt
          </div>

        </div>

      </SettingsSection>

      {/* =================================================
          STICKY SAVE BAR
      ================================================= */}

      <div className="sticky bottom-4 z-20">

        <div className="flex flex-col gap-3 rounded-2xl border bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">

          <div>

            <div className="font-black">
              Company Configuration
            </div>

            <div
              className={`mt-1 text-xs ${
                hasChanges
                  ? "font-semibold text-amber-600"
                  : "text-slate-500"
              }`}
            >
              {hasChanges
                ? `${changedKeys.length} change${
                    changedKeys.length ===
                    1
                      ? ""
                      : "s"
                  } waiting to be saved.`
                : "All settings match the values loaded from Excel."}
            </div>

          </div>

          <div className="flex gap-2">

            <button
              type="button"
              onClick={
                undoChanges
              }
              disabled={
                !hasChanges ||
                saving
              }
              className="rounded-xl border bg-white px-4 py-3 text-sm font-bold hover:bg-slate-50 disabled:opacity-40"
            >
              Undo
            </button>

            <button
              type="button"
              onClick={() =>
                void saveSettings()
              }
              disabled={
                !hasChanges ||
                saving
              }
              className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {saving
                ? "Saving to Excel..."
                : "Save Company Settings"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   COMMON STYLE
========================================================= */

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

/* =========================================================
   SECTION COMPONENT
========================================================= */

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: string;

  title: string;

  description: string;

  children:
    ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="border-b bg-slate-50 px-5 py-4">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white text-xl shadow-sm">
            {icon}
          </div>

          <div>

            <h2 className="font-black text-slate-900">
              {title}
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>

          </div>

        </div>

      </div>

      <div className="p-5">
        {children}
      </div>

    </section>
  );
}

/* =========================================================
   FIELD WRAPPER
========================================================= */

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

/* =========================================================
   TEXT FIELD
========================================================= */

function TextField({
  label,
  caption,
  value,
  onChange,
  type = "text",
  uppercase = false,
}: {
  label: string;

  caption: string;

  value: string;

  onChange:
    (
      value: string
    ) => void;

  type?:
    "text" |
    "email" |
    "tel";

  uppercase?:
    boolean;
}) {
  return (
    <Field
      label={
        label
      }
      caption={
        caption
      }
    >

      <input
        type={
          type
        }
        value={
          value
        }
        onChange={(e) => {
          const next =
            uppercase
              ? e.target.value
                  .toUpperCase()
              : e.target.value;

          onChange(
            next
          );
        }}
        className={`${inputClass} ${
          uppercase
            ? "uppercase"
            : ""
        }`}
      />

    </Field>
  );
}

/* =========================================================
   NUMBER FIELD
========================================================= */

function NumberField({
  label,
  caption,
  value,
  onChange,
  step = "1",
}: {
  label: string;

  caption: string;

  value: number;

  onChange:
    (
      value: number
    ) => void;

  step?:
    string;
}) {
  return (
    <Field
      label={
        label
      }
      caption={
        caption
      }
    >

      <input
        type="number"
        min="0"
        step={
          step
        }
        value={
          value
        }
        onChange={(e) => {
          const parsed =
            Number(
              e.target.value
            );

          onChange(
            Number.isFinite(
              parsed
            )
              ? parsed
              : 0
          );
        }}
        className={
          inputClass
        }
      />

    </Field>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;

  value: string;

  options:
    string[];

  onChange:
    (
      value: string
    ) => void;
}) {
  return (
    <Field
      label={
        label
      }
      caption={`Configure the default ${label.toLowerCase()}.`}
    >

      <select
        value={
          value
        }
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className={
          inputClass
        }
      >

        {options.map(
          (
            option
          ) => (

            <option
              key={
                option
              }
              value={
                option
              }
            >
              {option}
            </option>

          )
        )}

      </select>

    </Field>
  );
}

/* =========================================================
   TEXTAREA
========================================================= */

function TextareaField({
  label,
  caption,
  value,
  onChange,
}: {
  label: string;

  caption: string;

  value: string;

  onChange:
    (
      value: string
    ) => void;
}) {
  return (
    <Field
      label={
        label
      }
      caption={
        caption
      }
    >

      <textarea
        value={
          value
        }
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className={`${inputClass} min-h-28 resize-y`}
      />

    </Field>
  );
}

/* =========================================================
   PREFIX FIELD
========================================================= */

function PrefixField({
  label,
  value,
  onChange,
}: {
  label: string;

  value: string;

  onChange:
    (
      value: string
    ) => void;
}) {
  return (
    <Field
      label={`${label} Prefix`}
      caption={`Prefix used for new ${label.toLowerCase()} numbers.`}
    >

      <input
        value={
          value
        }
        maxLength={
          8
        }
        onChange={(e) =>
          onChange(
            e.target.value
              .toUpperCase()
              .replace(
                /[^A-Z0-9]/g,
                ""
              )
          )
        }
        className={`${inputClass} font-black uppercase tracking-wide`}
      />

    </Field>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
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

      <div className="mt-1 text-lg font-black text-slate-900">
        {value}
      </div>

    </div>
  );
}
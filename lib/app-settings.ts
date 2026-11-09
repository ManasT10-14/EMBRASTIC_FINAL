/* =========================================================
   EMBRASTIC SHARED APPLICATION SETTINGS

   All operational pages should read defaults through
   this file instead of hardcoding values.
========================================================= */

export type AppSettings = {
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

  /* NUMBERING */

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

  /* QUALITY CONTROL */

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

/* =========================================================
   DEFAULT VALUES

   These are fallbacks only.

   If Settings contains a saved value, the saved
   Excel value takes priority.
========================================================= */

export const DEFAULT_APP_SETTINGS: AppSettings = {
  legalName: "",

  brandName:
    "EMBRASTIC",

  tagline:
    "STITCHED TO STAND OUT",

  gstNumber: "",
  panNumber: "",
  msmeNumber: "",

  contactPerson: "",

  phone: "",
  alternatePhone: "",

  email: "",
  accountsEmail: "",
  website: "",

  addressLine1: "",
  addressLine2: "",

  city: "",
  state: "",

  postalCode: "",

  country:
    "India",

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

  bankName: "",
  bankBranch: "",

  accountName: "",
  accountNumber: "",

  ifscCode: "",
  upiId: "",

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

  quotationValidityDays:
    15,

  quotationTerms:
    "Prices are valid for the stated quotation validity period. Production will begin after artwork approval and commercial confirmation.",

  quotationFooter:
    "Thank you for choosing EMBRASTIC.",

  defaultOrderLeadDays:
    7,

  defaultArtworkStatus:
    "Draft",

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

  defaultMachineName:
    "",

  defaultThreadType:
    "Standard Polyester",

  defaultNeedleType:
    "75/11",

  defaultProductionStatus:
    "Pending",

  defaultInspectorName:
    "",

  qcRequired:
    true,

  defaultQcStatus:
    "Pending",

  defaultShippingMode:
    "Courier",

  defaultCourierName:
    "",

  invoiceDueDays:
    30,

  invoiceTerms:
    "Payment is due within the agreed payment terms.",

  invoiceFooter:
    "This is a computer-generated invoice.",

  authorizedSignatory:
    "",

  lowStockThreshold:
    10,

  inventoryDefaultUnit:
    "Pieces",

  defaultExpenseTaxPercent:
    18,

  logoPath:
    "/EMBRASTICLogo.jpeg",

  primaryColor:
    "#1D4ED8",

  businessOwnerName:
    "Business Owner",

  administratorTitle:
    "Administrator",
};

/* =========================================================
   VALUE PARSER
========================================================= */

function parseSettingValue<
  K extends keyof AppSettings
>(
  key: K,
  value: unknown
): AppSettings[K] {
  const fallback =
    DEFAULT_APP_SETTINGS[key];

  if (
    typeof fallback ===
    "number"
  ) {
    const number =
      Number(value);

    return (
      Number.isFinite(
        number
      )
        ? number
        : fallback
    ) as AppSettings[K];
  }

  if (
    typeof fallback ===
    "boolean"
  ) {
    const normalized =
      String(
        value ?? ""
      )
        .trim()
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
    ) as AppSettings[K];
  }

  return String(
    value ?? ""
  ) as AppSettings[K];
}

/* =========================================================
   LOAD SETTINGS

   Reads Settings sheet:

   id | key | value | updatedAt
========================================================= */

export async function loadAppSettings(): Promise<AppSettings> {
  const response =
    await fetch(
      "/api/excel?sheet=Settings",
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
    console.error(
      "Unable to parse Settings response."
    );

    return {
      ...DEFAULT_APP_SETTINGS,
    };
  }

  if (
    !response.ok ||
    !data?.success
  ) {
    console.error(
      "Unable to load Settings:",
      data
    );

    return {
      ...DEFAULT_APP_SETTINGS,
    };
  }

  const result: AppSettings = {
    ...DEFAULT_APP_SETTINGS,
  };

  const rows =
    Array.isArray(
      data.rows
    )
      ? data.rows
      : [];

  rows.forEach(
    (
      row: any
    ) => {
      const key =
        String(
          row?.key ?? ""
        ).trim() as
          keyof AppSettings;

      if (
        !key ||
        !(
          key in
          DEFAULT_APP_SETTINGS
        )
      ) {
        return;
      }

      (
        result as any
      )[key] =
        parseSettingValue(
          key,
          row?.value
        );
    }
  );

  return result;
}

/* =========================================================
   DATE HELPER

   Only call this from event handlers or useEffect.
========================================================= */

export function addDaysToDate(
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
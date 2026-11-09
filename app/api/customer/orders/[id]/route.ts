import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getWorkbook,
  getOrCreateSheet,
} from "@/lib/excel";

/* =========================================================
   CONSTANTS
========================================================= */

const CUSTOMER_COOKIE =
  "embrastic_customer_session";

const CUSTOMER_ACCOUNT_HEADERS = [
  "id",
  "customerId",
  "email",
  "passwordHash",
  "status",
  "emailVerified",
  "lastLoginAt",
  "createdAt",
  "updatedAt",
];

const CUSTOMER_HEADERS = [
  "id",
  "customerCode",
  "name",
  "businessName",
  "customerType",
  "status",
  "phone",
  "alternatePhone",
  "email",
  "contactPerson",
  "designation",
  "billingAddress",
  "billingCity",
  "billingState",
  "billingPostalCode",
  "billingCountry",
  "shippingSameAsBilling",
  "shippingAddress",
  "shippingCity",
  "shippingState",
  "shippingPostalCode",
  "shippingCountry",
  "gstNumber",
  "panNumber",
  "preferredContactMethod",
  "creditLimit",
  "paymentTermsDays",
  "priceCategory",
  "tags",
  "notes",
  "createdAt",
  "updatedAt",
];

const ORDER_HEADERS = [
  "id",
  "orderNumber",

  "quotationId",
  "quotationNumber",

  "customerId",
  "customerName",

  "customerPoNumber",

  "orderDate",
  "deliveryDate",

  "priority",
  "orderSource",

  "contactPerson",
  "contactPhone",
  "contactEmail",

  "shippingAddress",

  "paymentTermsDays",

  "status",

  "items",
  "orderItems",

  "totalQuantity",
  "subtotal",
  "gstAmount",
  "totalAmount",

  "notes",

  "createdAt",
  "updatedAt",
];

/* =========================================================
   TYPES
========================================================= */

type ExcelRow =
  Record<string, string>;

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

function normalize(
  value: unknown
) {
  return clean(
    value
  ).toLowerCase();
}

function numberValue(
  value: unknown
) {
  const parsed = Number(
    clean(value)
      .replace(/,/g, "")
      .replace(/[₹%]/g, "")
  );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function active(
  value: unknown
) {
  const status =
    normalize(value);

  return (
    !status ||
    status === "active"
  );
}

/* =========================================================
   EXCEL CELL TO STRING
========================================================= */

function cellToString(
  value: any
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  if (
    typeof value === "object"
  ) {
    if (
      typeof value.text ===
      "string"
    ) {
      return value.text;
    }

    if (
      value.result !==
      undefined
    ) {
      return String(
        value.result
      );
    }

    if (
      Array.isArray(
        value.richText
      )
    ) {
      return value.richText
        .map(
          (part: any) =>
            part?.text || ""
        )
        .join("");
    }
  }

  return String(value);
}

/* =========================================================
   READ WORKSHEET
========================================================= */

function readRows(
  sheet: any,
  headers: readonly string[]
): ExcelRow[] {
  const rows:
    ExcelRow[] = [];

  sheet.eachRow(
    (
      row: any,
      rowNumber: number
    ) => {
      if (
        rowNumber === 1
      ) {
        return;
      }

      const record:
        ExcelRow = {};

      headers.forEach(
        (
          header,
          index
        ) => {
          record[header] =
            cellToString(
              row.getCell(
                index + 1
              ).value
            );
        }
      );

      const hasData =
        Object.values(
          record
        ).some(
          (value) =>
            clean(value) !==
            ""
        );

      if (hasData) {
        rows.push(
          record
        );
      }
    }
  );

  return rows;
}

/* =========================================================
   PARSE JSON SAFELY
========================================================= */

function parseJsonArray(
  value: unknown
): any[] {
  if (
    Array.isArray(value)
  ) {
    return value;
  }

  const text =
    clean(value);

  if (!text) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(text);

    return Array.isArray(
      parsed
    )
      ? parsed
      : [];
  } catch {
    return [];
  }
}

/* =========================================================
   FIND CUSTOMER ACCOUNT FROM SESSION
========================================================= */

function findCustomerAccount(
  sessionValue: string,
  accounts: ExcelRow[]
) {
  const session =
    normalize(
      sessionValue
    );

  if (!session) {
    return null;
  }

  return (
    accounts.find(
      (account) =>
        active(
          account.status
        ) &&
        [
          account.id,
          account.customerId,
          account.email,
        ].some(
          (value) =>
            normalize(
              value
            ) ===
            session
        )
    ) || null
  );
}

/* =========================================================
   GET CUSTOMER ORDER
========================================================= */

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    /* =====================================================
       ROUTE PARAMETER
    ===================================================== */

    const { id } =
      await context.params;

    const requestedId =
      clean(id);

    if (!requestedId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       SESSION
    ===================================================== */

    const sessionValue =
      clean(
        request.cookies.get(
          CUSTOMER_COOKIE
        )?.value
      );

    if (!sessionValue) {
      return NextResponse.json(
        {
          success: false,
          requiresLogin: true,
          message:
            "Please sign in to view this order.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       LOAD WORKBOOK
    ===================================================== */

    const workbook =
      await getWorkbook();

    const accountResult =
      await getOrCreateSheet(
        workbook,
        "CustomerAccounts",
        CUSTOMER_ACCOUNT_HEADERS
      );

    const customerResult =
      await getOrCreateSheet(
        workbook,
        "Customers",
        CUSTOMER_HEADERS
      );

    const orderResult =
      await getOrCreateSheet(
        workbook,
        "Orders",
        ORDER_HEADERS
      );

    /* =====================================================
       READ DATA
    ===================================================== */

    const accounts =
      readRows(
        accountResult.sheet,
        CUSTOMER_ACCOUNT_HEADERS
      );

    const customers =
      readRows(
        customerResult.sheet,
        CUSTOMER_HEADERS
      );

    const orders =
      readRows(
        orderResult.sheet,
        ORDER_HEADERS
      );

    /* =====================================================
       VERIFY CUSTOMER SESSION
    ===================================================== */

    const account =
      findCustomerAccount(
        sessionValue,
        accounts
      );

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          requiresLogin: true,
          message:
            "Your customer session is invalid or has expired. Please sign in again.",
        },
        {
          status: 401,
        }
      );
    }

    const customerId =
      clean(
        account.customerId
      );

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This customer account is not linked to a customer record.",
        },
        {
          status: 403,
        }
      );
    }

    const customer =
      customers.find(
        (row) =>
          clean(row.id) ===
          customerId
      );

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The customer record linked to this account could not be found.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      !active(
        customer.status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This customer account is not currently active.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       FIND ORDER

       IMPORTANT:
       We require BOTH:
       - matching order ID
       - matching logged-in customer ID

       This prevents Customer A from viewing Customer B's
       order merely by knowing its URL.
    ===================================================== */

    const order =
      orders.find(
        (row) =>
          clean(row.id) ===
            requestedId &&
          clean(
            row.customerId
          ) === customerId
      );

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       ORDER ITEMS
    ===================================================== */

    const items =
      parseJsonArray(
        order.orderItems ||
          order.items
      );

    /* =====================================================
       SAFE RESPONSE

       Only customer-facing information is returned.
    ===================================================== */

    return NextResponse.json({
      success: true,

      order: {
        id:
          clean(order.id),

        orderNumber:
          clean(
            order.orderNumber
          ),

        customerName:
          clean(
            order.customerName
          ),

        customerPoNumber:
          clean(
            order.customerPoNumber
          ),

        orderDate:
          clean(
            order.orderDate
          ),

        deliveryDate:
          clean(
            order.deliveryDate
          ),

        priority:
          clean(
            order.priority
          ),

        contactPerson:
          clean(
            order.contactPerson
          ),

        contactPhone:
          clean(
            order.contactPhone
          ),

        contactEmail:
          clean(
            order.contactEmail
          ),

        shippingAddress:
          clean(
            order.shippingAddress
          ),

        status:
          clean(
            order.status
          ) ||
          "Pending Review",

        totalQuantity:
          numberValue(
            order.totalQuantity
          ),

        subtotal:
          numberValue(
            order.subtotal
          ),

        gstAmount:
          numberValue(
            order.gstAmount
          ),

        totalAmount:
          numberValue(
            order.totalAmount
          ),

        items,

        createdAt:
          clean(
            order.createdAt
          ),

        updatedAt:
          clean(
            order.updatedAt
          ),
      },
    });
  } catch (error) {
    console.error(
      "Customer order detail error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load this order.",

        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}
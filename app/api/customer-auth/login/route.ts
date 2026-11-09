import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

type ExcelRow = Record<string, any>;

const CUSTOMER_COOKIE = "embrastic_customer_session";

/* =========================================================
   HELPERS
========================================================= */

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown) {
  return clean(value).toLowerCase();
}

/* =========================================================
   READ EXCEL SHEET
========================================================= */

async function readSheet(
  request: NextRequest,
  sheet: string
): Promise<ExcelRow[]> {
  const url = new URL("/api/excel", request.url);

  url.searchParams.set("sheet", sheet);

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `Unable to read ${sheet}. The Excel service returned an invalid response.`
    );
  }

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message ||
        `Unable to read ${sheet}.`
    );
  }

  return Array.isArray(data.rows)
    ? data.rows
    : [];
}

/* =========================================================
   UPDATE EXCEL RECORD
========================================================= */

async function updateRecord(
  request: NextRequest,
  sheet: string,
  id: string,
  record: ExcelRow
) {
  const url = new URL("/api/excel", request.url);

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      action: "update",
      sheet,
      id,
      record,
    }),
  });

  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `Unable to update ${sheet}. The Excel service returned an invalid response.`
    );
  }

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message ||
        `Unable to update ${sheet}.`
    );
  }

  return data;
}

/* =========================================================
   POST - CUSTOMER LOGIN
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    /* =====================================================
       REQUEST BODY
    ===================================================== */

    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid login request.",
        },
        {
          status: 400,
        }
      );
    }

    const email = normalizeEmail(
      body?.email
    );

    const password = String(
      body?.password ?? ""
    );

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter your email address.",
        },
        {
          status: 400,
        }
      );
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter your password.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       LOAD CUSTOMER ACCOUNTS
    ===================================================== */

    const accounts = await readSheet(
      request,
      "CustomerAccounts"
    );

    /* =====================================================
       FIND ACCOUNT

       Registration stores email in lowercase, but we still
       normalize both sides for older Excel rows.
    ===================================================== */

    const account =
      accounts.find(
        (row) =>
          normalizeEmail(row.email) ===
          email
      ) || null;

    /*
     * Keep the response intentionally generic here.
     *
     * We don't want to reveal whether a particular email
     * address exists in CustomerAccounts.
     */

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid email address or password.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       ACCOUNT STATUS
    ===================================================== */

    const accountStatus =
      clean(account.status)
        .toLowerCase();

    if (
      accountStatus &&
      accountStatus !== "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This customer account is currently inactive. Please contact EMBRASTIC.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       VERIFY PASSWORD

       Registration uses:

       bcrypt.hash(password, 12)

       so login must use bcrypt.compare().
    ===================================================== */

    const passwordHash =
      clean(account.passwordHash);

    if (!passwordHash) {
      console.error(
        "Customer account is missing passwordHash:",
        clean(account.id)
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to sign in to this account. Please contact EMBRASTIC.",
        },
        {
          status: 500,
        }
      );
    }

    let passwordMatches = false;

    try {
      passwordMatches =
        await bcrypt.compare(
          password,
          passwordHash
        );
    } catch (error) {
      console.error(
        "bcrypt password comparison failed:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to verify your password.",
        },
        {
          status: 500,
        }
      );
    }

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid email address or password.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       CUSTOMER LINK
    ===================================================== */

    const customerId =
      clean(account.customerId);

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This portal account is not linked to a customer record. Please contact EMBRASTIC.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       LOAD CUSTOMER

       This also verifies that CustomerAccounts.customerId
       actually points to a real Business OS customer.
    ===================================================== */

    const customers = await readSheet(
      request,
      "Customers"
    );

    const customer =
      customers.find(
        (row) =>
          clean(row.id) ===
          customerId
      ) || null;

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The customer record linked to this account could not be found. Please contact EMBRASTIC.",
        },
        {
          status: 403,
        }
      );
    }

    const customerStatus =
      clean(customer.status)
        .toLowerCase();

    if (
      customerStatus &&
      customerStatus !== "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This customer account is currently inactive. Please contact EMBRASTIC.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       LAST LOGIN

       Registration creates lastLoginAt as blank.

       Update only the fields we need because your generic
       Excel update endpoint behaves like PATCH for object
       records.
    ===================================================== */

    const now =
      new Date().toISOString();

    const accountId =
      clean(account.id);

    if (accountId) {
      try {
        await updateRecord(
          request,
          "CustomerAccounts",
          accountId,
          {
            lastLoginAt: now,
            updatedAt: now,
          }
        );
      } catch (error) {
        /*
         * Login should not fail merely because the
         * last-login timestamp could not be updated.
         */

        console.error(
          "Unable to update customer lastLoginAt:",
          error
        );
      }
    }

    /* =====================================================
       SUCCESS RESPONSE
    ===================================================== */

    const response =
      NextResponse.json(
        {
          success: true,

          message:
            "Signed in successfully.",

          customer: {
            id: customerId,

            customerCode:
              clean(
                customer.customerCode
              ),

            name:
              clean(customer.name),

            businessName:
              clean(
                customer.businessName
              ),

            email:
              normalizeEmail(
                customer.email
              ) || email,

            phone:
              clean(customer.phone),

            contactPerson:
              clean(
                customer.contactPerson
              ),

            billingAddress:
              clean(
                customer.billingAddress
              ),

            billingCity:
              clean(
                customer.billingCity
              ),

            billingState:
              clean(
                customer.billingState
              ),

            billingPostalCode:
              clean(
                customer.billingPostalCode
              ),

            billingCountry:
              clean(
                customer.billingCountry
              ),

            shippingAddress:
              clean(
                customer.shippingAddress
              ),

            shippingCity:
              clean(
                customer.shippingCity
              ),

            shippingState:
              clean(
                customer.shippingState
              ),

            shippingPostalCode:
              clean(
                customer.shippingPostalCode
              ),

            shippingCountry:
              clean(
                customer.shippingCountry
              ),
          },
        },
        {
          status: 200,
        }
      );

    /* =====================================================
       SESSION COOKIE

       IMPORTANT:

       We store CustomerAccounts.id.

       Your order API already knows how to resolve the
       session using:
         - account.id
         - account.customerId
         - account.email

       Therefore account.id is a clean fit with the current
       order API.
    ===================================================== */

    response.cookies.set(
      CUSTOMER_COOKIE,
      accountId,
      {
        httpOnly: true,

        /*
         * Local development uses HTTP, so secure must
         * remain false in development.
         */
        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite: "lax",

        path: "/",

        /*
         * 7 days
         */
        maxAge:
          60 * 60 * 24 * 7,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Customer login error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to sign in.",
      },
      {
        status: 500,
      }
    );
  }
}
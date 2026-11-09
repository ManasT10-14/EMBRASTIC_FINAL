import {
  NextRequest,
  NextResponse,
} from "next/server";

type ExcelRow = Record<
  string,
  any
>;

const CUSTOMER_COOKIE =
  "embrastic_customer_session";

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

function normalizeEmail(
  value: unknown
) {
  return clean(
    value
  ).toLowerCase();
}

/* =========================================================
   READ EXCEL SHEET
========================================================= */

async function readSheet(
  request: NextRequest,
  sheet: string
): Promise<ExcelRow[]> {
  const url = new URL(
    "/api/excel",
    request.url
  );

  url.searchParams.set(
    "sheet",
    sheet
  );

  const response =
    await fetch(
      url,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  const text =
    await response.text();

  let data: any = null;

  try {
    data = text
      ? JSON.parse(text)
      : null;
  } catch {
    throw new Error(
      `Unable to read ${sheet}. The Excel service returned an invalid response.`
    );
  }

  if (
    !response.ok ||
    !data?.success
  ) {
    throw new Error(
      data?.message ||
        `Unable to read ${sheet}.`
    );
  }

  return Array.isArray(
    data.rows
  )
    ? data.rows
    : [];
}

/* =========================================================
   GET CURRENT CUSTOMER
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    /* =====================================================
       SESSION
    ===================================================== */

    const sessionId =
      request.cookies.get(
        CUSTOMER_COOKIE
      )?.value || "";

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not signed in.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       CUSTOMER ACCOUNT
    ===================================================== */

    const accounts =
      await readSheet(
        request,
        "CustomerAccounts"
      );

    const account =
      accounts.find(
        (row) =>
          clean(row.id) ===
          clean(sessionId)
      ) || null;

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your customer session is no longer valid.",
        },
        {
          status: 401,
        }
      );
    }

    const accountStatus =
      clean(
        account.status
      ).toLowerCase();

    if (
      accountStatus &&
      accountStatus !==
        "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your customer account is currently inactive.",
        },
        {
          status: 403,
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
            "This portal account is not linked to a customer.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       CUSTOMER MASTER
    ===================================================== */

    const customers =
      await readSheet(
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
            "Your customer record could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    const customerStatus =
      clean(
        customer.status
      ).toLowerCase();

    if (
      customerStatus &&
      customerStatus !==
        "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your customer account is currently inactive.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       ADDRESS FALLBACK

       Prefer Shipping Address.
       If shipping fields are blank, use Billing Address.
    ===================================================== */

    const shippingAddress =
      clean(
        customer.shippingAddress
      ) ||
      clean(
        customer.billingAddress
      );

    const shippingCity =
      clean(
        customer.shippingCity
      ) ||
      clean(
        customer.billingCity
      );

    const shippingState =
      clean(
        customer.shippingState
      ) ||
      clean(
        customer.billingState
      );

    const shippingPostalCode =
      clean(
        customer.shippingPostalCode
      ) ||
      clean(
        customer.billingPostalCode
      );

    const shippingCountry =
      clean(
        customer.shippingCountry
      ) ||
      clean(
        customer.billingCountry
      ) ||
      "India";

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,

      customer: {
        id:
          customerId,

        customerCode:
          clean(
            customer.customerCode
          ),

        name:
          clean(
            customer.name
          ),

        businessName:
          clean(
            customer.businessName
          ),

        contactPerson:
          clean(
            customer.contactPerson
          ) ||
          clean(
            customer.name
          ),

        phone:
          clean(
            customer.phone
          ),

        email:
          normalizeEmail(
            customer.email
          ) ||
          normalizeEmail(
            account.email
          ),

        gstNumber:
          clean(
            customer.gstNumber
          ),

        /* ===============================================
           BILLING
        =============================================== */

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
          ) ||
          "India",

        /* ===============================================
           SHIPPING / DEFAULT DELIVERY
        =============================================== */

        shippingAddress,

        shippingCity,

        shippingState,

        shippingPostalCode,

        shippingCountry,

        shippingSameAsBilling:
          clean(
            customer.shippingSameAsBilling
          ),

        /* ===============================================
           COMMERCIAL
        =============================================== */

        priceCategory:
          clean(
            customer.priceCategory
          ) ||
          "Standard",

        paymentTermsDays:
          clean(
            customer.paymentTermsDays
          ),
      },
    });
  } catch (error) {
    console.error(
      "GET /api/customer-auth/me failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to load your customer profile.",
      },
      {
        status: 500,
      }
    );
  }
}
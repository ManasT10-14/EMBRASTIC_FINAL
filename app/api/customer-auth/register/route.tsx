import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

type ExcelRow = Record<string, any>;

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown) {
  return clean(value).toLowerCase();
}

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

  const data = await response.json();

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

async function addRecord(
  request: NextRequest,
  sheet: string,
  record: ExcelRow
) {
  const url = new URL("/api/excel", request.url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type":
        "application/json",
    },
    body: JSON.stringify({
      action: "add",
      sheet,
      record,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message ||
        `Unable to write to ${sheet}.`
    );
  }

  return data;
}

function generateId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const name = clean(body?.name);
    const businessName = clean(
      body?.businessName
    );
    const contactPerson = clean(
      body?.contactPerson
    );
    const phone = clean(body?.phone);
    const email = normalizeEmail(
      body?.email
    );
    const password = String(
      body?.password ?? ""
    );
    const confirmPassword = String(
      body?.confirmPassword ?? ""
    );

    const gstNumber = clean(
      body?.gstNumber
    );

    const billingAddress = clean(
      body?.billingAddress
    );
    const billingCity = clean(
      body?.billingCity
    );
    const billingState = clean(
      body?.billingState
    );
    const billingPostalCode = clean(
      body?.billingPostalCode
    );
    const billingCountry =
      clean(body?.billingCountry) ||
      "India";

    /*
     * Basic validation
     */

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Mobile number is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email address is required.",
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

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must contain at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      password !== confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Passwords do not match.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Check existing portal accounts.
     */

    const accounts = await readSheet(
      request,
      "CustomerAccounts"
    );

    const existingAccount =
      accounts.find(
        account =>
          normalizeEmail(
            account.email
          ) === email
      );

    if (existingAccount) {
      return NextResponse.json(
        {
          success: false,
          code: "ACCOUNT_EXISTS",
          message:
            "An account already exists for this email address. Please sign in instead.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Check whether this email already exists
     * in the Business OS Customers sheet.
     *
     * If it does, link the new portal account
     * to that customer rather than creating
     * a duplicate customer.
     */

    const customers = await readSheet(
      request,
      "Customers"
    );

    let customer =
      customers.find(
        row =>
          normalizeEmail(
            row.email
          ) === email
      );

    const now =
      new Date().toISOString();

    let customerId = clean(
      customer?.id
    );

    /*
     * New customer:
     * create the Business OS customer first.
     */

    if (!customer) {
      customerId =
        generateId("CUS");

      const customerCode =
        `CUS-${Date.now()}`;

      const customerRecord = {
        id: customerId,
        customerCode,

        name,

        businessName:
          businessName || name,

        customerType:
          businessName
            ? "Business"
            : "Individual",

        status: "Active",

        phone,
        alternatePhone: "",

        email,

        contactPerson:
          contactPerson || name,

        designation: "",

        billingAddress,
        billingCity,
        billingState,
        billingPostalCode,
        billingCountry,

        shippingSameAsBilling:
          "Yes",

        shippingAddress:
          billingAddress,
        shippingCity:
          billingCity,
        shippingState:
          billingState,
        shippingPostalCode:
          billingPostalCode,
        shippingCountry:
          billingCountry,

        gstNumber,
        panNumber: "",

        preferredContactMethod:
          "Email",

        creditLimit: "0",
        paymentTermsDays: "0",

        priceCategory:
          "Standard",

        tags:
          "Customer Portal",

        notes:
          "Registered through customer portal.",

        createdAt: now,
        updatedAt: now,
      };

      await addRecord(
        request,
        "Customers",
        customerRecord
      );

      customer =
        customerRecord;
    }

    /*
     * Existing customer records should have
     * an ID, but guard against old/incomplete
     * Excel rows.
     */

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An existing customer was found, but it does not have a valid customer ID. Please contact EMBRASTIC.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Hash password.
     *
     * Never save the actual password.
     */

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    const accountId =
      generateId("ACC");

    const accountRecord = {
      id: accountId,
      customerId,
      email,
      passwordHash,

      status: "Active",

      emailVerified: "No",

      lastLoginAt: "",

      createdAt: now,
      updatedAt: now,
    };

    await addRecord(
      request,
      "CustomerAccounts",
      accountRecord
    );

    return NextResponse.json(
      {
        success: true,

        message:
          "Your EMBRASTIC account has been created successfully.",

        customer: {
          id: customerId,
          name:
            clean(customer?.name) ||
            name,
          businessName:
            clean(
              customer?.businessName
            ),
          email,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Customer registration error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to create customer account.",
      },
      {
        status: 500,
      }
    );
  }
}
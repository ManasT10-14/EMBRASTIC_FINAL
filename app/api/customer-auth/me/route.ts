import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const accountId = request.cookies.get(
      "embrastic_customer_session"
    )?.value;

    if (!accountId) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    // The login route stores the CustomerAccount ID in the session cookie.
    const accounts = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT *
      FROM "customer_accounts"
      WHERE "id" = $1
      LIMIT 1
      `,
      accountId
    );

    if (!accounts.length) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "Customer account not found",
        },
        { status: 401 }
      );
    }

    const account = accounts[0];

    if (
      account.status &&
      String(account.status).toLowerCase() !== "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "Customer account is inactive",
        },
        { status: 403 }
      );
    }

    const customers = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT *
      FROM "customers"
      WHERE "id" = $1
      LIMIT 1
      `,
      account.customerId
    );

    if (!customers.length) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "Customer profile not found",
        },
        { status: 404 }
      );
    }

    const customer = customers[0];

    return NextResponse.json({
      success: true,
      authenticated: true,

      customer: {
        id: customer.id ?? "",
        customerCode: customer.customerCode ?? "",

        name: customer.name ?? "",
        businessName: customer.businessName ?? "",
        customerType: customer.customerType ?? "",
        status: customer.status ?? "",

        email: customer.email ?? account.email ?? "",
        phone: customer.phone ?? "",
        alternatePhone: customer.alternatePhone ?? "",

        contactPerson: customer.contactPerson ?? "",
        designation: customer.designation ?? "",

        billingAddress: customer.billingAddress ?? "",
        billingCity: customer.billingCity ?? "",
        billingState: customer.billingState ?? "",
        billingPostalCode: customer.billingPostalCode ?? "",
        billingCountry: customer.billingCountry ?? "",

        shippingSameAsBilling:
          customer.shippingSameAsBilling ?? "",

        shippingAddress: customer.shippingAddress ?? "",
        shippingCity: customer.shippingCity ?? "",
        shippingState: customer.shippingState ?? "",
        shippingPostalCode:
          customer.shippingPostalCode ?? "",
        shippingCountry: customer.shippingCountry ?? "",

        gstNumber: customer.gstNumber ?? "",
        panNumber: customer.panNumber ?? "",

        preferredContactMethod:
          customer.preferredContactMethod ?? "",

        paymentTermsDays:
          customer.paymentTermsDays ?? null,

        priceCategory: customer.priceCategory ?? "",
      },

      account: {
        id: account.id ?? "",
        customerId: account.customerId ?? "",
        email: account.email ?? "",
        status: account.status ?? "",
        lastLoginAt: account.lastLoginAt ?? null,
      },
    });
  } catch (error) {
    console.error("Customer /me error:", error);

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        message: "Unable to load customer account",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
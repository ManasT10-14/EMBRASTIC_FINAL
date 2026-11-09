import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function serializeValue(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const result: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
      result[key] = serializeValue(item);
    }

    return result;
  }

  return value;
}

export async function GET(request: NextRequest) {
  try {
    /* =====================================================
       1. READ CUSTOMER SESSION
    ===================================================== */

    const accountId = request.cookies.get(
      "embrastic_customer_session"
    )?.value;

    if (!accountId) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    /* =====================================================
       2. FIND CUSTOMER ACCOUNT
    ===================================================== */

    const accounts =
      await prisma.$queryRawUnsafe<any[]>(
        `
        SELECT
          "id",
          "customerId",
          "email",
          "status"
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
          message: "Customer account not found",
        },
        { status: 401 }
      );
    }

    const account = accounts[0];

    if (!account.customerId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer account is not linked to a customer",
        },
        { status: 400 }
      );
    }

    if (
      account.status &&
      String(account.status).toLowerCase() !==
        "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer account is inactive",
        },
        { status: 403 }
      );
    }

    /* =====================================================
       3. VERIFY CUSTOMER
    ===================================================== */

    const customers =
      await prisma.$queryRawUnsafe<any[]>(
        `
        SELECT
          "id",
          "customerCode",
          "name",
          "businessName",
          "email"
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
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    const customer = customers[0];

    /* =====================================================
       4. LOAD ONLY THIS CUSTOMER'S INVOICES
    ===================================================== */

    const invoices =
      await prisma.$queryRawUnsafe<any[]>(
        `
        SELECT
          "id",
          "invoiceNumber",
          "customer",
          "customerId",
          "orderNumber",
          "orderId",
          "dispatchId",
          "dispatchNumber",
          "workOrderId",
          "workOrderNumber",
          "productionId",
          "productionNumber",
          "qualityControlId",
          "qcNumber",
          "dispatchStatus",
          "dispatchDate",
          "courierName",
          "trackingNumber",
          "invoiceDate",
          "dueDate",
          "items",
          "discount",
          "gstPercent",
          "subtotal",
          "taxableAmount",
          "taxAmount",
          "totalAmount",
          "paidAmount",
          "outstandingAmount",
          "notes",
          "status",
          "createdAt",
          "updatedAt"
        FROM "invoices"
        WHERE "customerId" = $1
        ORDER BY
          "invoiceDate" DESC NULLS LAST,
          "createdAt" DESC NULLS LAST
        `,
        account.customerId
      );

    /* =====================================================
       5. SUMMARY
    ===================================================== */

    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;

    for (const invoice of invoices) {
      totalInvoiced += Number(
        invoice.totalAmount ?? 0
      );

      totalPaid += Number(
        invoice.paidAmount ?? 0
      );

      totalOutstanding += Number(
        invoice.outstandingAmount ?? 0
      );
    }

    return NextResponse.json(
      serializeValue({
        success: true,

        customer: {
          id: customer.id,
          customerCode:
            customer.customerCode ?? "",
          name: customer.name ?? "",
          businessName:
            customer.businessName ?? "",
          email: customer.email ?? "",
        },

        summary: {
          count: invoices.length,
          totalInvoiced,
          totalPaid,
          totalOutstanding,
        },

        invoices,
      })
    );
  } catch (error) {
    console.error(
      "Customer invoices API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load invoices",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
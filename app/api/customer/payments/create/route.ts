import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

import {
  getWorkbook,
  withExcelLock,
} from "@/lib/excel";

type CreatePaymentBody = {
  orderId?: string;
  orderNumber?: string;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function numberValue(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function getHeaderMap(
  sheet: any
): Map<string, number> {
  const map =
    new Map<string, number>();

  const headerRow =
    sheet.getRow(1);

  headerRow.eachCell(
    (
      cell: any,
      columnNumber: number
    ) => {
      const name =
        clean(cell.value);

      if (name) {
        map.set(
          name,
          columnNumber
        );
      }
    }
  );

  return map;
}

export async function POST(
  request: NextRequest
) {
  try {
    const keyId =
      process.env.RAZORPAY_KEY_ID;

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay is not configured on the server.",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      (await request.json()) as CreatePaymentBody;

    const orderId =
      clean(body.orderId);

    const orderNumber =
      clean(body.orderNumber);

    if (!orderId || !orderNumber) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order information is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * IMPORTANT:
     *
     * Never trust an amount sent from
     * the customer's browser.
     *
     * Find the order that EMBRASTIC
     * already calculated and saved.
     */

    const order =
      await withExcelLock(
        async () => {
          const workbook =
            await getWorkbook();

          const sheet =
            workbook.getWorksheet(
              "Orders"
            );

          if (!sheet) {
            return null;
          }

          const headers =
            getHeaderMap(sheet);

          const idColumn =
            headers.get("id");

          const numberColumn =
            headers.get(
              "orderNumber"
            );

          const totalColumn =
            headers.get(
              "totalAmount"
            );

          if (
            !idColumn ||
            !numberColumn ||
            !totalColumn
          ) {
            throw new Error(
              "Orders sheet is missing required payment columns."
            );
          }

          for (
            let rowNumber = 2;
            rowNumber <= sheet.rowCount;
            rowNumber += 1
          ) {
            const row =
              sheet.getRow(
                rowNumber
              );

            const storedId =
              clean(
                row.getCell(
                  idColumn
                ).value
              );

            const storedNumber =
              clean(
                row.getCell(
                  numberColumn
                ).value
              );

            if (
              storedId === orderId &&
              storedNumber ===
                orderNumber
            ) {
              return {
                id: storedId,
                orderNumber:
                  storedNumber,

                totalAmount:
                  numberValue(
                    row.getCell(
                      totalColumn
                    ).value
                  ),
              };
            }
          }

          return null;
        }
      );

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    if (order.totalAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This order does not have a valid payable amount.",
        },
        {
          status: 400,
        }
      );
    }

    const amountInPaise =
      Math.round(
        order.totalAmount * 100
      );

    const razorpay =
      new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

    const razorpayOrder =
      await razorpay.orders.create({
        amount: amountInPaise,

        currency: "INR",

        receipt:
          order.orderNumber.slice(
            0,
            40
          ),

        notes: {
          embrasticOrderId:
            order.id,

          embrasticOrderNumber:
            order.orderNumber,
        },
      });

    return NextResponse.json(
      {
        success: true,

        keyId,

        razorpayOrderId:
          razorpayOrder.id,

        amount:
          razorpayOrder.amount,

        currency:
          razorpayOrder.currency,

        orderId:
          order.id,

        orderNumber:
          order.orderNumber,

        totalAmount:
          order.totalAmount,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/customer/payments/create failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to initialise payment.",
      },
      {
        status: 500,
      }
    );
  }
}
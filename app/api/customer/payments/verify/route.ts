import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import {
  getWorkbook,
  getOrCreateSheet,
  saveWorkbook,
  withExcelLock,
} from "@/lib/excel";

type VerifyPaymentBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;

  orderId?: string;
  orderNumber?: string;
};

const PAYMENT_HEADERS = [
  "id",
  "orderId",
  "orderNumber",
  "razorpayOrderId",
  "razorpayPaymentId",
  "razorpaySignature",
  "amount",
  "currency",
  "status",
  "paymentMethod",
  "paidAt",
  "createdAt",
  "updatedAt",
];

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function numberValue(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function createPaymentId(): string {
  if (
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `PAY-${Date.now()}-${crypto
    .randomBytes(6)
    .toString("hex")}`;
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
    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message:
            "Razorpay is not configured on the server.",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      (await request.json()) as VerifyPaymentBody;

    const razorpayOrderId =
      clean(body.razorpay_order_id);

    const razorpayPaymentId =
      clean(body.razorpay_payment_id);

    const razorpaySignature =
      clean(body.razorpay_signature);

    const orderId =
      clean(body.orderId);

    const orderNumber =
      clean(body.orderNumber);

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature ||
      !orderId ||
      !orderNumber
    ) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message:
            "Incomplete payment information.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =========================================
     * VERIFY RAZORPAY SIGNATURE
     * =========================================
     */

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          keySecret
        )
        .update(
          `${razorpayOrderId}|${razorpayPaymentId}`
        )
        .digest("hex");

    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        "utf8"
      );

    const receivedBuffer =
      Buffer.from(
        razorpaySignature,
        "utf8"
      );

    const signatureValid =
      expectedBuffer.length ===
        receivedBuffer.length &&
      crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      );

    if (!signatureValid) {
      console.error(
        "Razorpay signature verification failed",
        {
          orderId,
          orderNumber,
          razorpayOrderId,
          razorpayPaymentId,
        }
      );

      return NextResponse.json(
        {
          success: false,
          verified: false,
          message:
            "Payment verification failed.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =========================================
     * RECORD VERIFIED PAYMENT
     * =========================================
     */

    const result =
      await withExcelLock(
        async () => {
          const workbook =
            await getWorkbook();

          /*
           * Find authoritative EMBRASTIC order.
           */
          const ordersSheet =
            workbook.getWorksheet(
              "Orders"
            );

          if (!ordersSheet) {
            throw new Error(
              "Orders sheet could not be found."
            );
          }

          const orderHeaders =
            getHeaderMap(
              ordersSheet
            );

          const orderIdColumn =
            orderHeaders.get("id");

          const orderNumberColumn =
            orderHeaders.get(
              "orderNumber"
            );

          const totalAmountColumn =
            orderHeaders.get(
              "totalAmount"
            );

          if (
            !orderIdColumn ||
            !orderNumberColumn ||
            !totalAmountColumn
          ) {
            throw new Error(
              "Orders sheet is missing required payment columns."
            );
          }

          let orderRow:
            | any
            | null = null;

          for (
            let rowNumber = 2;
            rowNumber <=
            ordersSheet.rowCount;
            rowNumber += 1
          ) {
            const row =
              ordersSheet.getRow(
                rowNumber
              );

            const storedOrderId =
              clean(
                row.getCell(
                  orderIdColumn
                ).value
              );

            const storedOrderNumber =
              clean(
                row.getCell(
                  orderNumberColumn
                ).value
              );

            if (
              storedOrderId ===
                orderId &&
              storedOrderNumber ===
                orderNumber
            ) {
              orderRow = row;
              break;
            }
          }

          if (!orderRow) {
            throw new Error(
              "The EMBRASTIC order could not be found."
            );
          }

          const totalAmount =
            numberValue(
              orderRow.getCell(
                totalAmountColumn
              ).value
            );

          if (totalAmount <= 0) {
            throw new Error(
              "The order does not have a valid payment amount."
            );
          }

          /*
           * Get/create Payments sheet.
           */
          const {
            sheet: paymentsSheet,
          } =
            await getOrCreateSheet(
              workbook,
              "Payments",
              PAYMENT_HEADERS
            );

          const paymentHeaders =
            getHeaderMap(
              paymentsSheet
            );

          const paymentIdColumn =
            paymentHeaders.get(
              "razorpayPaymentId"
            );

          /*
           * Idempotency:
           *
           * If this Razorpay payment has
           * already been recorded, don't
           * create another payment row.
           */
          if (paymentIdColumn) {
            for (
              let rowNumber = 2;
              rowNumber <=
              paymentsSheet.rowCount;
              rowNumber += 1
            ) {
              const row =
                paymentsSheet.getRow(
                  rowNumber
                );

              const existingPaymentId =
                clean(
                  row.getCell(
                    paymentIdColumn
                  ).value
                );

              if (
                existingPaymentId ===
                razorpayPaymentId
              ) {
                return {
                  duplicate: true,
                  totalAmount,
                };
              }
            }
          }

          const now =
            new Date().toISOString();

          const paymentId =
            createPaymentId();

          paymentsSheet.addRow({
            id: paymentId,

            orderId,

            orderNumber,

            razorpayOrderId,

            razorpayPaymentId,

            razorpaySignature,

            amount:
              totalAmount,

            currency:
              "INR",

            status:
              "Paid",

            paymentMethod:
              "Razorpay",

            paidAt:
              now,

            createdAt:
              now,

            updatedAt:
              now,
          });

          await saveWorkbook(
            workbook
          );

          return {
            duplicate: false,
            paymentId,
            totalAmount,
          };
        }
      );

    return NextResponse.json(
      {
        success: true,
        verified: true,

        message:
          result.duplicate
            ? "Payment was already verified."
            : "Payment verified successfully.",

        orderId,
        orderNumber,

        razorpayOrderId,
        razorpayPaymentId,

        paymentId:
          "paymentId" in result
            ? result.paymentId
            : undefined,

        amount:
          result.totalAmount,

        currency:
          "INR",

        status:
          "Paid",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/customer/payments/verify failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        verified: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to verify payment.",
      },
      {
        status: 500,
      }
    );
  }
}
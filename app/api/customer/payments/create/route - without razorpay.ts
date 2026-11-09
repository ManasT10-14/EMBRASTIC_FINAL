import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

type CreatePaymentBody = {
  orderId?: string;
  orderNumber?: string;
  amount?: number;
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

    const amount =
      numberValue(body.amount);

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Internal order ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!orderNumber) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order number is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A valid payment amount is required.",
        },
        {
          status: 400,
        }
      );
    }

    const razorpay =
      new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

    /*
     * Razorpay expects INR amounts in paise.
     *
     * ₹1.00 = 100 paise
     */
    const amountInPaise =
      Math.round(amount * 100);

    const razorpayOrder =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",

        /*
         * Keep receipt reasonably short.
         */
        receipt: orderNumber.slice(
          0,
          40
        ),

        notes: {
          embrasticOrderId:
            orderId,

          embrasticOrderNumber:
            orderNumber,
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

        orderId,
        orderNumber,
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
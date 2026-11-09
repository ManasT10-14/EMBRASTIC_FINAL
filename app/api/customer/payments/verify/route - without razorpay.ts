import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

type VerifyPaymentBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;

  orderId?: string;
  orderNumber?: string;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
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
      !razorpaySignature
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Incomplete Razorpay payment response.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Razorpay signature verification:
     *
     * HMAC-SHA256(
     *   razorpay_order_id + "|" + razorpay_payment_id,
     *   key_secret
     * )
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

    const valid =
      expectedBuffer.length ===
        receivedBuffer.length &&
      crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      );

    if (!valid) {
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
     * Signature is valid.
     *
     * NEXT STEP:
     * We will record this payment in the existing
     * Excel Payments sheet and update the order.
     */

    return NextResponse.json(
      {
        success: true,
        verified: true,

        message:
          "Payment verified successfully.",

        orderId,
        orderNumber,

        razorpayOrderId,
        razorpayPaymentId,
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
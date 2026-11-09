"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Loader2,
  LockKeyhole,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

declare global {
  interface Window {
    Razorpay?: new (
      options: RazorpayCheckoutOptions
    ) => RazorpayInstance;
  }
}

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;

  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };

  notes?: Record<string, string>;

  theme?: {
    color?: string;
  };

  handler: (
    response: RazorpayResponse
  ) => void | Promise<void>;

  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
};

/* =========================================================
   TYPES
========================================================= */

type CartSize = {
  size: string;
  quantity: number;
};

type CartArtwork = {
  uploadId?: string;
  name: string;
  storedName?: string;
  size: number;
  type: string;
};

type CartItem = {
  id: string;

  orderType?: "READY_EMBROIDERED" | "CUSTOM_EMBROIDERY";

  productId: string;
  productCode: string;
  sku: string;

  name: string;

  categoryId: string;
  categoryName: string;

  primaryImage: string;

  colour: string;

  sizes: CartSize[];

  totalQuantity: number;

  allowCustomisation: boolean;

  embroideryPlacement: string;
  embroiderySize?: string;

  artwork: CartArtwork | null;

  instructions: string;

  unitPrice: number;
  gstPercent: number;

  estimatedTotal: number;

  priceMasterSku: string;
};

type CheckoutForm = {
  contactPerson: string;
  phone: string;
  email: string;

  customerPoNumber: string;

  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;

  deliveryDate: string;

  notes: string;

  termsAccepted: boolean;
};

type OrderSuccess = {
  orderId: string;
  orderNumber: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  orderId?: string;
  orderNumber?: string;
  requiresLogin?: boolean;
};


type CustomerProfile = {
  id: string;
  customerCode: string;
  name: string;
  businessName: string;

  contactPerson: string;
  phone: string;
  email: string;
  gstNumber: string;

  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  billingCountry: string;

  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;

  shippingSameAsBilling: string;

  priceCategory: string;
  paymentTermsDays: string;
};

type ProfileResponse = {
  success?: boolean;
  message?: string;
  customer?: CustomerProfile;
};

/* =========================================================
   CONSTANTS
========================================================= */

const CART_KEY = "embrastic_cart";

const PLACEMENT_LABELS: Record<
  string,
  string
> = {
  "left-chest": "Left Chest",
  "right-chest": "Right Chest",
  "left-sleeve": "Left Sleeve",
  "right-sleeve": "Right Sleeve",
  back: "Back",
  "front-centre": "Front Centre",
};

const EMBROIDERY_SIZE_LABELS: Record<string, string> = {
  small: 'Small — up to 3"',
  medium: 'Medium — up to 5"',
  large: 'Large — up to 8"',
  "extra-large": 'Extra Large — above 8"',
};

const EMPTY_FORM: CheckoutForm = {
  contactPerson: "",
  phone: "",
  email: "",

  customerPoNumber: "",

  shippingAddress: "",
  shippingCity: "",
  shippingState: "",
  shippingPostalCode: "",
  shippingCountry: "India",

  deliveryDate: "",

  notes: "",

  termsAccepted: false,
};

/* =========================================================
   HELPERS
========================================================= */

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function numberValue(value: unknown) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function formatMoney(value: unknown) {
  const amount = numberValue(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function safeImageUrl(value: unknown) {
  const url = clean(value);

  if (!url) {
    return "";
  }

  if (
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("/")
  ) {
    return url;
  }

  return "";
}

function calculateQuantity(
  sizes: CartSize[]
) {
  return (sizes || []).reduce(
    (total, item) =>
      total +
      Math.max(
        0,
        numberValue(item.quantity)
      ),
    0
  );
}

function getPlacementLabel(
  value: string
) {
  return (
    PLACEMENT_LABELS[
      clean(value)
    ] || clean(value)
  );
}

function isCustomEmbroidery(item: CartItem) {
  if (item.orderType) return item.orderType === "CUSTOM_EMBROIDERY";
  return !!item.allowCustomisation;
}

function getEmbroiderySizeLabel(value: string) {
  return EMBROIDERY_SIZE_LABELS[clean(value)] || clean(value);
}

/* =========================================================
   RAZORPAY SCRIPT
========================================================= */

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (
      typeof window !== "undefined" &&
      window.Razorpay
    ) {
      resolve(true);
      return;
    }

    const existing =
      document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

    if (existing) {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      existing.addEventListener(
        "load",
        () => resolve(true),
        { once: true }
      );

      existing.addEventListener(
        "error",
        () => resolve(false),
        { once: true }
      );

      return;
    }

    const script =
      document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

/* =========================================================
   PAGE
========================================================= */


/* =========================================================
   PAGE
========================================================= */

export default function CustomerCheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<
    CartItem[]
  >([]);
const [
  paymentMethod,
  setPaymentMethod,
] = useState<
  "online" | "payLater"
>("online");

  const [form, setForm] =
    useState<CheckoutForm>(
      EMPTY_FORM
    );

  const [customer, setCustomer] =
    useState<CustomerProfile | null>(
      null
    );

  const [profileLoading, setProfileLoading] =
    useState(true);

  const [
    useDifferentAddress,
    setUseDifferentAddress,
  ] = useState(false);

  const [loaded, setLoaded] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState<OrderSuccess | null>(
      null
    );

  /* =====================================================
     LOAD CUSTOMER PROFILE
  ====================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadCustomerProfile() {
      try {
        setProfileLoading(true);

        const response = await fetch(
          "/api/customer-auth/me",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const text =
          await response.text();

        let data: ProfileResponse | null =
          null;

        try {
          data = text
            ? JSON.parse(text)
            : null;
        } catch {
          throw new Error(
            "Customer profile service returned an invalid response."
          );
        }

        if (
          response.status === 401
        ) {
          const next =
            encodeURIComponent(
              "/customer/checkout"
            );

          router.push(
            `/customer/login?next=${next}`
          );

          return;
        }

        if (
          !response.ok ||
          !data?.success ||
          !data.customer
        ) {
          throw new Error(
            data?.message ||
              "Unable to load your customer profile."
          );
        }

        if (cancelled) {
          return;
        }

        const profile =
          data.customer;

        setCustomer(profile);

        setForm((current) => ({
          ...current,

          contactPerson:
            clean(
              profile.contactPerson
            ) ||
            clean(profile.name),

          phone:
            clean(profile.phone),

          email:
            clean(profile.email),

          shippingAddress:
            clean(
              profile.shippingAddress
            ) ||
            clean(
              profile.billingAddress
            ),

          shippingCity:
            clean(
              profile.shippingCity
            ) ||
            clean(
              profile.billingCity
            ),

          shippingState:
            clean(
              profile.shippingState
            ) ||
            clean(
              profile.billingState
            ),

          shippingPostalCode:
            clean(
              profile.shippingPostalCode
            ) ||
            clean(
              profile.billingPostalCode
            ),

          shippingCountry:
            clean(
              profile.shippingCountry
            ) ||
            clean(
              profile.billingCountry
            ) ||
            "India",
        }));
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Customer profile error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your customer profile."
        );
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    }

    loadCustomerProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /* =====================================================
     LOAD CART
  ====================================================== */

  useEffect(() => {
    try {
      const raw =
        window.localStorage.getItem(
          CART_KEY
        );

      if (!raw) {
        setCart([]);
        return;
      }

      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        setCart([]);
        return;
      }

      const validItems =
        parsed.filter(
          (
            item
          ): item is CartItem =>
            !!item &&
            typeof item ===
              "object" &&
            !!clean(item.productId)
        );

      setCart(validItems);
    } catch {
      setCart([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  /* =====================================================
     CALCULATIONS

     DISPLAY ONLY.

     The server MUST calculate the authoritative
     price again from Products + Price Master.
  ====================================================== */

  const totalQuantity = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        calculateQuantity(
          item.sizes || []
        ),
      0
    );
  }, [cart]);

  const displayedSubtotal =
    useMemo(() => {
      return cart.reduce(
        (total, item) => {
          const quantity =
            calculateQuantity(
              item.sizes || []
            );

          return (
            total +
            numberValue(
              item.unitPrice
            ) *
              quantity
          );
        },
        0
      );
    }, [cart]);

  /* =====================================================
     FORM
  ====================================================== */

  function updateField<
    K extends keyof CheckoutForm,
  >(
    key: K,
    value: CheckoutForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  /* =====================================================
     VALIDATION
  ====================================================== */

  function validate() {
    if (cart.length === 0) {
      return "Your order is empty.";
    }

    if (
      totalQuantity <= 0
    ) {
      return "Please add at least one item to your order.";
    }

    for (const item of cart) {
      if (!isCustomEmbroidery(item)) continue;
      if (!clean(item.embroideryPlacement)) {
        return `Please select an embroidery placement for ${item.name}.`;
      }
      if (!clean(item.embroiderySize)) {
        return `Please select an embroidery size for ${item.name}.`;
      }
      if (!clean(item.artwork?.uploadId)) {
        return `Please upload artwork for ${item.name}.`;
      }
    }

    if (
      !clean(
        form.contactPerson
      )
    ) {
      return "Please enter the contact person's name.";
    }

    if (!clean(form.phone)) {
      return "Please enter a phone number.";
    }

    if (!clean(form.email)) {
      return "Please enter an email address.";
    }

    if (
      !clean(
        form.shippingAddress
      )
    ) {
      return "Please enter the delivery address.";
    }

    if (
      !clean(
        form.shippingCity
      )
    ) {
      return "Please enter the city.";
    }

    if (
      !clean(
        form.shippingState
      )
    ) {
      return "Please enter the state.";
    }

    if (
      !clean(
        form.shippingPostalCode
      )
    ) {
      return "Please enter the postal code.";
    }

    if (
      !form.termsAccepted
    ) {
      return "Please confirm the order and artwork approval terms.";
    }

    return "";
  }


/* =====================================================
   RAZORPAY PAYMENT
====================================================== */

async function startRazorpayPayment(
  orderId: string,
  orderNumber: string
): Promise<void> {
  const loaded =
    await loadRazorpayScript();

  if (!loaded) {
    throw new Error(
      "Unable to load Razorpay. Please check your internet connection and try again."
    );
  }

  /*
   * Create Razorpay order.
   *
   * IMPORTANT:
   * We no longer send an amount from the browser.
   * The server reads the authoritative totalAmount
   * from the EMBRASTIC Orders sheet.
   */
  const createResponse =
    await fetch(
      "/api/customer/payments/create",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          orderId,
          orderNumber,
        }),
      }
    );

  const createData =
    await createResponse.json();

  if (
    !createResponse.ok ||
    !createData.success
  ) {
    throw new Error(
      createData.message ||
        "Unable to initialise payment."
    );
  }

  if (!window.Razorpay) {
    throw new Error(
      "Razorpay checkout is unavailable."
    );
  }

  return new Promise<void>(
    (resolve, reject) => {
      let completed = false;

      const razorpay =
        new window.Razorpay!({
          key:
            createData.keyId,

          amount:
            createData.amount,

          currency:
            createData.currency,

          name:
            "EMBRASTIC",

          description:
            `Payment for ${orderNumber}`,

          order_id:
            createData.razorpayOrderId,

          prefill: {
            name:
              customer?.name || "",

            email:
              customer?.email || "",

            contact:
              customer?.phone || "",
          },

          notes: {
            orderId,
            orderNumber,
          },

          handler: async (
            response
          ) => {
            try {
              const verifyResponse =
                await fetch(
                  "/api/customer/payments/verify",
                  {
                    method:
                      "POST",

                    headers: {
                      "Content-Type":
                        "application/json",
                    },

                    body:
                      JSON.stringify({
                        ...response,
                        orderId,
                        orderNumber,
                      }),
                  }
                );

              const verifyData =
                await verifyResponse.json();

              if (
                !verifyResponse.ok ||
                !verifyData.success ||
                !verifyData.verified
              ) {
                throw new Error(
                  verifyData.message ||
                    "Payment verification failed."
                );
              }

              completed = true;
              resolve();
            } catch (error) {
              reject(
                error instanceof Error
                  ? error
                  : new Error(
                      "Payment verification failed."
                    )
              );
            }
          },

          modal: {
            ondismiss: () => {
              if (!completed) {
                reject(
                  new Error(
                    "Payment was cancelled."
                  )
                );
              }
            },
          },
        });

      razorpay.open();
    }
  );
}
	

  /* =====================================================
     PLACE ORDER
  ====================================================== */

  async function placeOrder(
    event: FormEvent
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const validationError =
      validate();

    if (validationError) {
      setError(
        validationError
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    try {
      setSubmitting(true);
      setError("");

      /*
       * IMPORTANT SECURITY DESIGN:
       *
       * We send product IDs, quantities and
       * configuration.
       *
       * unitPrice / estimatedTotal from localStorage
       * are NOT sent as authoritative prices.
       *
       * /api/customer/orders will look up the actual
       * Product + Price Master values server-side.
       */

      const items = cart.map(
        (item) => ({
          productId:
            item.productId,

          colour:
            clean(item.colour),

          sizes: (
            item.sizes || []
          )
            .map((size) => ({
              size: clean(
                size.size
              ),

              quantity: Math.max(
                0,
                Math.floor(
                  numberValue(
                    size.quantity
                  )
                )
              ),
            }))
            .filter(
              (size) =>
                size.quantity > 0
            ),

          orderType:
            item.orderType ||
            (isCustomEmbroidery(item)
              ? "CUSTOM_EMBROIDERY"
              : "READY_EMBROIDERED"),

          embroideryPlacement:
            isCustomEmbroidery(item)
              ? clean(item.embroideryPlacement)
              : "",

          embroiderySize:
            isCustomEmbroidery(item)
              ? clean(item.embroiderySize)
              : "",

          artwork:
            isCustomEmbroidery(item) && item.artwork
              ? {
                  uploadId: clean(item.artwork.uploadId),
                  name: clean(item.artwork.name),
                  storedName: clean(item.artwork.storedName),
                  size: numberValue(item.artwork.size),
                  type: clean(item.artwork.type),
                }
              : null,

          instructions:
            isCustomEmbroidery(item)
              ? clean(item.instructions)
              : "",
        })
      );

      const response =
        await fetch(
          "/api/customer/orders",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              contactPerson:
                clean(
                  form.contactPerson
                ),

              contactPhone:
                clean(form.phone),

              contactEmail:
                clean(form.email),

              customerPoNumber:
                clean(
                  form.customerPoNumber
                ),

              shippingAddress: {
                address: clean(
                  form.shippingAddress
                ),

                city: clean(
                  form.shippingCity
                ),

                state: clean(
                  form.shippingState
                ),

                postalCode: clean(
                  form.shippingPostalCode
                ),

                country:
                  clean(
                    form.shippingCountry
                  ) || "India",
              },

              requestedDeliveryDate:
                clean(
                  form.deliveryDate
                ),

              notes: clean(
                form.notes
              ),

              items,
            }),
          }
        );

      const text =
        await response.text();

      let data: ApiResponse | null =
        null;

      try {
        data = text
          ? JSON.parse(text)
          : null;
      } catch {
        throw new Error(
          "The order service returned an invalid response."
        );
      }

      /*
       * Our secure order API can tell the UI
       * that login is required.
       */

      if (
        response.status === 401 ||
        data?.requiresLogin
      ) {
        const next =
          encodeURIComponent(
            "/customer/checkout"
          );

        router.push(
          `/customer/login?next=${next}`
        );

        return;
      }

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to place your order."
        );
      }

      const orderNumber =
        clean(
          data.orderNumber
        );

      const orderId =
        clean(data.orderId);

      if (
        !orderNumber &&
        !orderId
      ) {
        throw new Error(
          "The order was created but no order reference was returned."
        );
      }

      /*
       * Only clear the cart AFTER the server
       * confirms that the order was created.
       */

      /*
 * If the customer selected online payment,
 * complete Razorpay payment before clearing
 * the cart and showing order success.
 */

if (paymentMethod === "online") {
  await startRazorpayPayment(
    orderId,
    orderNumber
  );
}

/*
 * Payment completed successfully,
 * or customer selected Pay Later.
 */

window.localStorage.removeItem(
  CART_KEY
);

window.dispatchEvent(
  new Event(
    "embrastic-cart-updated"
  )
);

setCart([]);

setSuccess({
  orderId,
  orderNumber,
});

window.scrollTo({
  top: 0,
  behavior: "smooth",
});





    } finally {
      setSubmitting(false);
    }
  }

  /* =====================================================
     LOADING
  ====================================================== */

  if (!loaded) {
    return <CheckoutLoading />;
  }

  /* =====================================================
     SUCCESS
  ====================================================== */

  if (success) {
    return (
      <CheckoutSuccess
        order={success}
      />
    );
  }

  /* =====================================================
     EMPTY
  ====================================================== */

  if (cart.length === 0) {
    return <EmptyCheckout />;
  }

  /* =====================================================
     PAGE
  ====================================================== */

  return (
    <main className="min-h-screen bg-[#f6f8fc] pb-24 text-slate-950 lg:pb-0">
      {/* =================================================
          HEADER
      ================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1280px] px-5 py-5 sm:px-7 lg:px-8 lg:py-6">
          <Link
            href="/customer/cart"
            className="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Your Order
          </Link>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                Secure Checkout
              </div>

              <h1 className="mt-1.5 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-[34px]">
                Complete your order
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-500">
                Tell us where the
                order should go and
                confirm your
                requirements. We'll
                keep you updated
                through artwork
                approval, production
                and dispatch.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-emerald-700">
              <LockKeyhole className="h-3.5 w-3.5" />
              Customer Checkout
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          STEPS
      ================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1280px] overflow-x-auto px-5 py-3 sm:px-7 lg:px-8">
          <div className="flex min-w-max items-center gap-2">
            <CheckoutStep
              number="1"
              label="Products"
              complete
            />

            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />

            <CheckoutStep
              number="2"
              label="Review"
              complete
            />

            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />

            <CheckoutStep
              number="3"
              label="Checkout"
              active
            />

            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />

            <CheckoutStep
              number="4"
              label="Confirmation"
            />
          </div>
        </div>
      </section>

      {/* =================================================
          FORM
      ================================================== */}

      <form
        onSubmit={placeOrder}
      >
        <div className="mx-auto max-w-[1280px] px-5 py-6 sm:px-7 lg:px-8 lg:py-7">
          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
              <div className="text-sm font-black text-red-700">
                Please check your
                order
              </div>

              <div className="mt-1 text-xs leading-5 text-red-600">
                {error}
              </div>
            </div>
          )}

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px]">
            {/* =============================================
                LEFT
            ============================================== */}

            <div className="space-y-4">
              {/* CONTACT */}

              <CheckoutSection
  icon={
    <UserRound className="h-5 w-5" />
  }
  eyebrow="Contact"
  title="Your contact details"
  description="These details come from your EMBRASTIC customer account."
>
  {profileLoading ? (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-5">
      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />

      <span className="text-sm font-semibold text-slate-500">
        Loading your customer details...
      </span>
    </div>
  ) : (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4">
        <div className="text-sm font-black text-slate-900">
          {form.contactPerson}
        </div>

        {customer?.businessName && (
          <div className="mt-1 text-xs font-semibold text-slate-500">
            {customer.businessName}
          </div>
        )}

        <div className="mt-3 space-y-1 text-xs leading-5 text-slate-600">
          <div>{form.email}</div>
          <div>{form.phone}</div>
        </div>
      </div>

      <Field
        label="PO / Reference Number"
        hint="Optional"
      >
        <input
          value={
            form.customerPoNumber
          }
          onChange={(event) =>
            updateField(
              "customerPoNumber",
              event.target.value
            )
          }
          placeholder="Your purchase order or internal reference"
          className={inputClass}
        />
      </Field>
    </div>
  )}
</CheckoutSection>

              {/* DELIVERY */}

              <CheckoutSection
  icon={
    <MapPin className="h-5 w-5" />
  }
  eyebrow="Delivery"
  title="Delivery address"
  description="We'll use the delivery address saved in your customer account."
>
  {profileLoading ? (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-5">
      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />

      <span className="text-sm font-semibold text-slate-500">
        Loading your delivery address...
      </span>
    </div>
  ) : (
    <div className="space-y-4">
      {!useDifferentAddress && (
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <MapPin className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                Default delivery address
              </div>

              <div className="mt-2 text-sm font-bold leading-6 text-slate-800">
                {form.shippingAddress}
              </div>

              <div className="text-sm leading-6 text-slate-600">
                {[
                  form.shippingCity,
                  form.shippingState,
                ]
                  .filter(Boolean)
                  .join(", ")}

                {form.shippingPostalCode
                  ? ` – ${form.shippingPostalCode}`
                  : ""}
              </div>

              <div className="text-sm leading-6 text-slate-600">
                {form.shippingCountry}
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
onClick={() => {
  if (useDifferentAddress && customer) {
    setForm((current) => ({
      ...current,

      shippingAddress:
        clean(
          customer.shippingAddress
        ) ||
        clean(
          customer.billingAddress
        ),

      shippingCity:
        clean(
          customer.shippingCity
        ) ||
        clean(
          customer.billingCity
        ),

      shippingState:
        clean(
          customer.shippingState
        ) ||
        clean(
          customer.billingState
        ),

      shippingPostalCode:
        clean(
          customer.shippingPostalCode
        ) ||
        clean(
          customer.billingPostalCode
        ),

      shippingCountry:
        clean(
          customer.shippingCountry
        ) ||
        clean(
          customer.billingCountry
        ) ||
        "India",
    }));
  }

  setUseDifferentAddress(
    !useDifferentAddress
  );
}}
        className="text-xs font-black text-blue-600 transition hover:text-blue-700"
      >
        {useDifferentAddress
          ? "Use my saved delivery address"
          : "Use a different delivery address"}
      </button>

      {useDifferentAddress && (
        <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <Field
            label="Address"
            required
            className="sm:col-span-2"
          >
            <textarea
              rows={3}
              value={
                form.shippingAddress
              }
              onChange={(event) =>
                updateField(
                  "shippingAddress",
                  event.target.value
                )
              }
              placeholder="Building, street, area..."
              className={`${inputClass} min-h-[92px] resize-none py-3`}
            />
          </Field>

          <Field
            label="City"
            required
          >
            <input
              value={
                form.shippingCity
              }
              onChange={(event) =>
                updateField(
                  "shippingCity",
                  event.target.value
                )
              }
              placeholder="City"
              className={inputClass}
            />
          </Field>

          <Field
            label="State"
            required
          >
            <input
              value={
                form.shippingState
              }
              onChange={(event) =>
                updateField(
                  "shippingState",
                  event.target.value
                )
              }
              placeholder="State"
              className={inputClass}
            />
          </Field>

          <Field
            label="Postal Code"
            required
          >
            <input
              value={
                form.shippingPostalCode
              }
              onChange={(event) =>
                updateField(
                  "shippingPostalCode",
                  event.target.value
                )
              }
              placeholder="PIN code"
              className={inputClass}
            />
          </Field>

          <Field
            label="Country"
            required
          >
            <input
              value={
                form.shippingCountry
              }
              onChange={(event) =>
                updateField(
                  "shippingCountry",
                  event.target.value
                )
              }
              className={inputClass}
            />
          </Field>
        </div>
      )}
    </div>
  )}
</CheckoutSection>

              {/* REQUIREMENTS */}

              <CheckoutSection
                icon={
                  <PackageCheck className="h-5 w-5" />
                }
                eyebrow="Requirements"
                title="Anything else we should know?"
                description="A requested delivery date is a request until confirmed by EMBRASTIC."
              >
                <div className="grid gap-4">
                  <Field
                    label="Requested Delivery Date"
                    hint="Optional"
                  >
                    <input
                      type="date"
                      value={
                        form.deliveryDate
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "deliveryDate",
                          event.target
                            .value
                        )
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Order Notes"
                    hint="Optional"
                  >
                    <textarea
                      rows={4}
                      value={
                        form.notes
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "notes",
                          event.target
                            .value
                        )
                      }
                      placeholder="Special delivery instructions, branding requirements, packaging notes..."
                      className={`${inputClass} min-h-[110px] resize-none py-3`}
                    />
                  </Field>
                </div>
              </CheckoutSection>

              {/* CONFIRMATION */}

              <div className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:p-5">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={
                      form.termsAccepted
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "termsAccepted",
                        event.target
                          .checked
                      )
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 accent-blue-600"
                  />

                  <span>
                    <span className="block text-sm font-black text-slate-800">
                      Confirm order
                      requirements
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      I confirm the
                      quantities and
                      requirements entered
                      for this order. Where
                      artwork approval is
                      required, production
                      will proceed after
                      approval.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* =============================================
                RIGHT SUMMARY
            ============================================== */}

            <aside>
              <div className="lg:sticky lg:top-6">
                <div className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                  <div className="border-b border-slate-100 px-5 py-4 sm:px-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                          Order Summary
                        </div>

                        <h2 className="mt-1 text-lg font-black text-slate-950">
                          {totalQuantity}{" "}
                          {totalQuantity ===
                          1
                            ? "item"
                            : "items"}
                        </h2>
                      </div>

                      <Link
                        href="/customer/cart"
                        className="text-[10px] font-black text-blue-600"
                      >
                        Edit order
                      </Link>
                    </div>
                  </div>

                  {/* ITEMS */}

                  <div className="max-h-[430px] overflow-y-auto">
                    {cart.map(
                      (item) => (
                        <CheckoutItem
                          key={
                            item.id
                          }
                          item={
                            item
                          }
                        />
                      )
                    )}
                  </div>

                  {/* TOTALS */}

                  <div className="border-t border-slate-100 px-5 py-5 sm:px-5">
                    <div className="space-y-3">
                      <SummaryRow
                        label="Product subtotal"
                        value={formatMoney(
                          displayedSubtotal
                        )}
                      />

                      <SummaryRow
                        label="Embroidery / digitizing"
                        value="Calculated from Price Master"
                        muted
                      />
                    </div>

                    <div className="my-5 border-t border-slate-200" />

                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Current estimate
                        </div>

                        <div className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                          {formatMoney(
                            displayedSubtotal
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-[10px] leading-5 text-amber-800">
                      The amount shown
                      here is a browser
                      estimate. The secure
                      order service will
                      verify current
                      product pricing from
                      Price Master before
                      creating the order.
                    </div>

                    <button
                      type="submit"
                      disabled={
                        submitting
                      }
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <LockKeyhole className="h-4 w-4" />
                          Place Order
                        </>
                      )}
                    </button>

                    <p className="mt-3 text-center text-[10px] leading-4 text-slate-400">
                      Your order is
                      submitted to
                      EMBRASTIC for
                      processing and
                      artwork approval
                      where applicable.
                    </p>
                  </div>
                </div>

                {/* TRUST */}

                <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <TrustItem
                    icon={
                      <ShieldCheck className="h-4 w-4" />
                    }
                    title="Secure"
                    text="Customer order"
                  />

                  <TrustItem
                    icon={
                      <Sparkles className="h-4 w-4" />
                    }
                    title="Approval"
                    text="Before stitching"
                  />

                  <TrustItem
                    icon={
                      <PackageCheck className="h-4 w-4" />
                    }
                    title="Tracked"
                    text="Through production"
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* MOBILE SUBMIT */}

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Current estimate
              </div>

              <div className="text-lg font-black text-slate-950">
                {formatMoney(
                  displayedSubtotal
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={
  submitting ||
  profileLoading ||
  !customer
}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white disabled:bg-slate-300"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LockKeyhole className="h-4 w-4" />
              )}

              Place Order
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

/* =========================================================
   CHECKOUT ITEM
========================================================= */

function CheckoutItem({
  item,
}: {
  item: CartItem;
}) {
  const quantity =
    calculateQuantity(
      item.sizes || []
    );

  const total =
    numberValue(item.unitPrice) *
    quantity;

  const image =
    safeImageUrl(
      item.primaryImage
    );

  const customEmbroidery = isCustomEmbroidery(item);
  const embroiderySize = getEmbroiderySizeLabel(item.embroiderySize || "");

  const sizes = (
    item.sizes || []
  )
    .filter(
      (size) =>
        numberValue(
          size.quantity
        ) > 0
    )
    .map((size) =>
      size.size
        ? `${size.size} × ${size.quantity}`
        : `${size.quantity}`
    )
    .join(", ");

  return (
    <div className="border-b border-slate-100 px-5 py-4 last:border-b-0">
      <div className="flex gap-3">
        <div className="h-[72px] w-[60px] shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/70">
          {image ? (
            <img
              src={image}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Shirt className="h-5 w-5 text-slate-300" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-xs font-black leading-5 text-slate-800">
            {item.name}
          </div>

          <div className="mt-1 text-[10px] leading-4 text-slate-400">
            {item.colour &&
              `${item.colour} • `}

            {quantity}{" "}
            {quantity === 1
              ? "item"
              : "items"}
          </div>

          {sizes && (
            <div className="mt-1 line-clamp-2 text-[9px] leading-4 text-slate-400">
              {sizes}
            </div>
          )}

          <div className="mt-1 text-[9px] font-bold text-slate-500">
            {customEmbroidery ? "Custom Embroidery" : "Ready Embroidered"}
          </div>

          {customEmbroidery && item.embroideryPlacement && (
            <div className="mt-1 text-[9px] font-bold text-blue-600">
              Placement: {getPlacementLabel(item.embroideryPlacement)}
            </div>
          )}

          {customEmbroidery && embroiderySize && (
            <div className="mt-1 text-[9px] font-bold text-blue-600">
              Embroidery size: {embroiderySize}
            </div>
          )}

          {customEmbroidery && item.artwork?.name && (
            <div className="mt-1 line-clamp-1 text-[9px] text-slate-400">
              Artwork: {item.artwork.name}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[9px] text-slate-400">
              {formatMoney(
                item.unitPrice
              )}{" "}
              each
            </span>

            <span className="text-xs font-black text-slate-800">
              {formatMoney(
                total
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SECTION
========================================================= */

function CheckoutSection({
  icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
          {icon}
        </div>

        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">
            {eyebrow}
          </div>

          <h2 className="mt-1 text-lg font-black text-slate-950">
            {title}
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  required = false,
  hint,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`block ${className}`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[11px] font-black text-slate-700">
          {label}

          {required && (
            <span className="ml-1 text-red-500">
              *
            </span>
          )}
        </span>

        {hint && (
          <span className="text-[9px] font-semibold text-slate-400">
            {hint}
          </span>
        )}
      </div>

      {children}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 hover:bg-white focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-5 text-xs">
      <span className="text-slate-500">
        {label}
      </span>

      <span
        className={`max-w-[60%] text-right font-black ${
          muted
            ? "text-slate-400"
            : "text-slate-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   CHECKOUT STEP
========================================================= */

function CheckoutStep({
  number,
  label,
  active = false,
  complete = false,
}: {
  number: string;
  label: string;
  active?: boolean;
  complete?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-2 ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-400"
      }`}
    >
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-black ${
          complete
            ? "bg-emerald-500 text-white"
            : active
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-400"
        }`}
      >
        {complete ? (
          <Check className="h-3 w-3" />
        ) : (
          number
        )}
      </div>

      <span className="text-[10px] font-black uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

/* =========================================================
   TRUST
========================================================= */

function TrustItem({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="px-2 py-4 text-center">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </div>

      <div className="mt-2 text-[10px] font-black text-slate-700">
        {title}
      </div>

      <div className="mt-0.5 hidden text-[9px] text-slate-400 sm:block">
        {text}
      </div>
    </div>
  );
}

/* =========================================================
   SUCCESS
========================================================= */

function CheckoutSuccess({
  order,
}: {
  order: OrderSuccess;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-[78vh] max-w-4xl items-center justify-center px-5 py-12">
        <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <div className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
            Order Received
          </div>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-slate-950">
            Thank you for your order.
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
            Your order has been
            submitted to EMBRASTIC.
            We'll keep you updated as
            it moves through artwork
            approval, production,
            quality check and dispatch.
          </p>

          {order.orderNumber && (
            <div className="mt-5 rounded-2xl bg-slate-50 px-5 py-4">
              <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Order Number
              </div>

              <div className="mt-1 text-xl font-black text-slate-950">
                {order.orderNumber}
              </div>
            </div>
          )}

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              href={
                order.orderId
                  ? `/customer/orders/${encodeURIComponent(
                      order.orderId
                    )}`
                  : "/customer/orders"
              }
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white"
            >
              Track My Order
              <ChevronRight className="h-4 w-4" />
            </Link>

            <Link
              href="/customer/products"
              className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyCheckout() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-[75vh] max-w-4xl items-center justify-center px-5">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
            <ShoppingBag className="h-8 w-8" />
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
            Nothing to checkout yet
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            Add a product to your
            order before continuing to
            checkout.
          </p>

          <Link
            href="/customer/products"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white"
          >
            Browse Products
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   LOADING
========================================================= */

function CheckoutLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-7 lg:px-10">
        <div className="h-10 w-72 animate-pulse rounded-xl bg-slate-200" />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-4">
            <div className="h-64 animate-pulse rounded-[22px] bg-white" />

            <div className="h-80 animate-pulse rounded-[22px] bg-white" />
          </div>

          <div className="h-[520px] animate-pulse rounded-[24px] bg-white" />
        </div>
      </div>
    </main>
  );
}
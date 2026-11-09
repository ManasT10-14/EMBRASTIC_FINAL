import { NextRequest, NextResponse } from "next/server";
import {
  getWorkbook,
  getOrCreateSheet,
  saveWorkbook,
  withExcelLock,
} from "@/lib/excel";

/* =========================================================
   HEADERS
========================================================= */

const CUSTOMER_ACCOUNT_HEADERS = [
  "id",
  "customerId",
  "email",
  "passwordHash",
  "status",
  "emailVerified",
  "lastLoginAt",
  "createdAt",
  "updatedAt",
];

const CUSTOMER_HEADERS = [
  "id",
  "customerCode",
  "name",
  "businessName",
  "customerType",
  "status",
  "phone",
  "alternatePhone",
  "email",
  "contactPerson",
  "designation",
  "billingAddress",
  "billingCity",
  "billingState",
  "billingPostalCode",
  "billingCountry",
  "shippingSameAsBilling",
  "shippingAddress",
  "shippingCity",
  "shippingState",
  "shippingPostalCode",
  "shippingCountry",
  "gstNumber",
  "panNumber",
  "preferredContactMethod",
  "creditLimit",
  "paymentTermsDays",
  "priceCategory",
  "tags",
  "notes",
  "createdAt",
  "updatedAt",
];

const PRODUCT_HEADERS = [
  "id",
  "productCode",
  "sku",
  "name",
  "slug",
  "categoryId",
  "categoryName",
  "productType",
  "garmentType",
  "shortDescription",
  "description",
  "primaryImage",
  "additionalImages",
  "priceMasterId",
  "priceMasterSku",
  "originalPrice",
  "badge",
  "featured",
  "newArrival",
  "allowCustomisation",
  "availableColours",
  "availableSizes",
  "displayOrder",
  "status",
  "createdAt",
  "updatedAt",
];

const PRICE_HEADERS = [
  "id",
  "sku",
  "itemName",
  "itemType",
  "category",
  "description",
  "unit",
  "sellingPrice",
  "gstPercent",
  "minimumSellingPrice",
  "costPrice",
  "customerPriceCategory",
  "effectiveFrom",
  "effectiveTo",
  "status",
  "notes",
  "createdAt",
  "updatedAt",
];

const ORDER_HEADERS = [
  "id",
  "orderNumber",
  "quotationId",
  "quotationNumber",
  "customerId",
  "customerName",
  "customerPoNumber",
  "orderDate",
  "deliveryDate",
  "priority",
  "orderSource",
  "contactPerson",
  "contactPhone",
  "contactEmail",
  "shippingAddress",
  "paymentTermsDays",
  "status",
  "items",
  "orderItems",
  "totalQuantity",
  "subtotal",
  "gstAmount",
  "totalAmount",
  "notes",
  "createdAt",
  "updatedAt",
];

/* =========================================================
   HELPERS
========================================================= */

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalize(value: unknown) {
  return clean(value).toLowerCase();
}

function numberValue(value: unknown) {
  const valueString = clean(value)
    .replace(/,/g, "")
    .replace(/[₹%]/g, "");

  const parsed = Number(valueString);

  return Number.isFinite(parsed) ? parsed : 0;
}

function isActive(value: unknown) {
  const status = normalize(value);

  return !status || status === "active";
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `ID-${Date.now()}`;
}

function cellToString(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    const objectValue = value as {
      text?: string;
      result?: unknown;
      richText?: Array<{ text?: string }>;
    };

    if (typeof objectValue.text === "string") {
      return objectValue.text;
    }

    if (objectValue.result !== undefined) {
      return String(objectValue.result);
    }

    if (Array.isArray(objectValue.richText)) {
      return objectValue.richText
        .map((part) => part.text || "")
        .join("");
    }
  }

  return String(value);
}

function readRows(
  sheet: any,
  headers: string[]
): Record<string, string>[] {
  const rows: Record<string, string>[] = [];

  sheet.eachRow((row: any, rowNumber: number) => {
    if (rowNumber === 1) {
      return;
    }

    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header] = cellToString(
        row.getCell(index + 1).value
      );
    });

    const hasContent = Object.values(record).some(
      (value) => clean(value) !== ""
    );

    if (hasContent) {
      rows.push(record);
    }
  });

  return rows;
}

function addRecord(
  sheet: any,
  headers: string[],
  record: Record<string, unknown>
) {
  const row = headers.map((header) => {
    const value = record[header];

    if (value === undefined || value === null) {
      return "";
    }

    return value;
  });

  sheet.addRow(row);
}

function buildShippingAddress(value: unknown) {
  if (!value || typeof value !== "object") {
    return "";
  }

  const address = value as Record<string, unknown>;

  return [
    clean(address.address),
    clean(address.city),
    clean(address.state),
    clean(address.postalCode),
    clean(address.country),
  ]
    .filter(Boolean)
    .join(", ");
}

/* =========================================================
   ORDER NUMBER
========================================================= */

function nextOrderNumber(
  orders: Record<string, string>[]
) {
  let highest = 0;

  for (const order of orders) {
    const orderNumber = clean(order.orderNumber);

    const match = orderNumber.match(/(\d+)$/);

    if (!match) {
      continue;
    }

    const number = Number(match[1]);

    if (Number.isFinite(number) && number > highest) {
      highest = number;
    }
  }

  return `ORD-${String(highest + 1).padStart(4, "0")}`;
}

/* =========================================================
   FIND PRICE
========================================================= */

function findPrice(
  product: Record<string, string>,
  prices: Record<string, string>[]
) {
  const activePrices = prices.filter((price) =>
    isActive(price.status)
  );

  const priceMasterId = clean(product.priceMasterId);

  if (priceMasterId) {
    const byId = activePrices.find(
      (price) => clean(price.id) === priceMasterId
    );

    if (byId) {
      return byId;
    }
  }

  const priceSku = normalize(product.priceMasterSku);

  if (!priceSku) {
    return null;
  }

  return (
    activePrices.find(
      (price) => normalize(price.sku) === priceSku
    ) || null
  );
}

/* =========================================================
   CUSTOMER ORDER ITEM HELPERS
========================================================= */

type CustomerOrderType =
  | "READY_EMBROIDERED"
  | "CUSTOM_EMBROIDERY";

function resolveOrderType(
  submittedItem: any,
  product: Record<string, string>
): CustomerOrderType {
  const submitted = clean(
    submittedItem?.orderType
  ).toUpperCase();

  if (
    submitted === "CUSTOM_EMBROIDERY"
  ) {
    return "CUSTOM_EMBROIDERY";
  }

  if (
    submitted === "READY_EMBROIDERED"
  ) {
    return "READY_EMBROIDERED";
  }

  const productAllowsCustomisation =
    ["true", "1", "yes"].includes(
      normalize(
        product.allowCustomisation
      )
    );

  return productAllowsCustomisation
    ? "CUSTOM_EMBROIDERY"
    : "READY_EMBROIDERED";
}

function buildArtwork(
  value: unknown
) {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const artwork =
    value as Record<string, unknown>;

  const uploadId = clean(
    artwork.uploadId
  );
  const name = clean(artwork.name);
  const storedName = clean(
    artwork.storedName
  );
  const size = Math.max(
    0,
    numberValue(artwork.size)
  );
  const type = clean(artwork.type);

  if (
    !uploadId &&
    !name &&
    !storedName
  ) {
    return null;
  }

  return {
    uploadId,
    name,
    storedName,
    size,
    type,
  };
}

/* =========================================================
   POST
========================================================= */

export async function POST(request: NextRequest) {
  try {
    /* =====================================================
       LOGIN COOKIE
    ===================================================== */

    const sessionValue = clean(
      request.cookies.get("embrastic_customer_session")?.value
    );

    if (!sessionValue) {
      return NextResponse.json(
        {
          success: false,
          requiresLogin: true,
          message: "Please sign in before placing your order.",
        },
        {
          status: 401,
        }
      );
    }

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
          message: "The order request is invalid.",
        },
        {
          status: 400,
        }
      );
    }

    const contactPerson = clean(body?.contactPerson);
    const contactPhone = clean(body?.contactPhone);
    const contactEmail = clean(body?.contactEmail);

    const customerPoNumber = clean(body?.customerPoNumber);

    const requestedDeliveryDate = clean(
      body?.requestedDeliveryDate
    );

    const notes = clean(body?.notes);

    const shippingAddress = buildShippingAddress(
      body?.shippingAddress
    );

    const submittedItems = Array.isArray(body?.items)
      ? body.items
      : [];

    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    if (!contactPerson) {
      return NextResponse.json(
        {
          success: false,
          message: "Contact person is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!contactPhone) {
      return NextResponse.json(
        {
          success: false,
          message: "Contact phone is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!contactEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Contact email is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        {
          success: false,
          message: "Shipping address is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (submittedItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Your order is empty.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       EXCEL TRANSACTION
    ===================================================== */

    return await withExcelLock(async () => {
      const workbook = await getWorkbook();

      const customerAccountsSheet =
        await getOrCreateSheet(
          workbook,
          "CustomerAccounts",
          CUSTOMER_ACCOUNT_HEADERS
        );

      const customersSheet =
        await getOrCreateSheet(
          workbook,
          "Customers",
          CUSTOMER_HEADERS
        );

      const productsSheet =
        await getOrCreateSheet(
          workbook,
          "Products",
          PRODUCT_HEADERS
        );

      const pricesSheet =
        await getOrCreateSheet(
          workbook,
          "PriceMaster",
          PRICE_HEADERS
        );

      const ordersSheet =
        await getOrCreateSheet(
          workbook,
          "Orders",
          ORDER_HEADERS
        );

      /* ===================================================
         READ DATA
      =================================================== */

      const accounts = readRows(
        customerAccountsSheet.sheet,
        CUSTOMER_ACCOUNT_HEADERS
      );

      const customers = readRows(
        customersSheet.sheet,
        CUSTOMER_HEADERS
      );

      const products = readRows(
        productsSheet.sheet,
        PRODUCT_HEADERS
      );

      const prices = readRows(
        pricesSheet.sheet,
        PRICE_HEADERS
      );

      const existingOrders = readRows(
        ordersSheet.sheet,
        ORDER_HEADERS
      );

      /* ===================================================
         RESOLVE CUSTOMER SESSION

         We only accept the cookie when it corresponds to
         an actual ACTIVE CustomerAccounts record.
      =================================================== */

      const sessionNormalized = normalize(sessionValue);

      const account =
        accounts.find((row) => {
          if (!isActive(row.status)) {
            return false;
          }

          return (
            normalize(row.id) === sessionNormalized ||
            normalize(row.customerId) === sessionNormalized ||
            normalize(row.email) === sessionNormalized
          );
        }) || null;

      if (!account) {
        return NextResponse.json(
          {
            success: false,
            requiresLogin: true,
            message:
              "Your customer session could not be verified. Please sign in again.",
          },
          {
            status: 401,
          }
        );
      }

      const customerId = clean(account.customerId);

      if (!customerId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Your customer account is not linked to a customer record.",
          },
          {
            status: 403,
          }
        );
      }

      const customer =
        customers.find(
          (row) => clean(row.id) === customerId
        ) || null;

      if (!customer) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The customer record linked to this account could not be found.",
          },
          {
            status: 403,
          }
        );
      }

      if (!isActive(customer.status)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This customer account is currently inactive.",
          },
          {
            status: 403,
          }
        );
      }

      const customerName =
        clean(customer.businessName) ||
        clean(customer.name) ||
        contactPerson;

      /* ===================================================
         BUILD SECURE ORDER ITEMS

         Browser prices are deliberately ignored.
      =================================================== */

      const orderItems: Array<Record<string, unknown>> = [];

      let totalQuantity = 0;
      let subtotal = 0;
      let gstAmount = 0;

      for (const submittedItem of submittedItems) {
        const productId = clean(submittedItem?.productId);

        if (!productId) {
          return NextResponse.json(
            {
              success: false,
              message:
                "One of the products in your order is invalid.",
            },
            {
              status: 400,
            }
          );
        }

        const product =
          products.find(
            (row) => clean(row.id) === productId
          ) || null;

        if (!product || !isActive(product.status)) {
          return NextResponse.json(
            {
              success: false,
              message:
                "One of the products in your order is no longer available.",
            },
            {
              status: 400,
            }
          );
        }

        const price = findPrice(product, prices);

        if (!price) {
          return NextResponse.json(
            {
              success: false,
              message: `${clean(
                product.name
              )} does not currently have an active selling price.`,
            },
            {
              status: 400,
            }
          );
        }

        const unitPrice = numberValue(price.sellingPrice);

        if (unitPrice <= 0) {
          return NextResponse.json(
            {
              success: false,
              message: `${clean(
                product.name
              )} does not currently have a valid selling price.`,
            },
            {
              status: 400,
            }
          );
        }

        const submittedSizes = Array.isArray(
          submittedItem?.sizes
        )
          ? submittedItem.sizes
          : [];

        const sizes = submittedSizes
          .map((size: any) => ({
            size: clean(size?.size),
            quantity: Math.max(
              0,
              Math.floor(numberValue(size?.quantity))
            ),
          }))
          .filter(
            (size: { size: string; quantity: number }) =>
              size.quantity > 0
          );

        const quantity = sizes.reduce(
          (
            total: number,
            size: { size: string; quantity: number }
          ) => total + size.quantity,
          0
        );

        if (quantity <= 0) {
          return NextResponse.json(
            {
              success: false,
              message: `Please enter a quantity for ${clean(
                product.name
              )}.`,
            },
            {
              status: 400,
            }
          );
        }

        const lineSubtotal = unitPrice * quantity;

        /*
         * For now we keep the GST percentage on the item
         * but do not add GST a second time.
         *
         * Your current Price Master does not yet have an
         * explicit GST-inclusive / GST-exclusive field.
         */

        const gstPercent = numberValue(price.gstPercent);

        totalQuantity += quantity;
        subtotal += lineSubtotal;

        const orderType =
          resolveOrderType(
            submittedItem,
            product
          );

        const customEmbroidery =
          orderType ===
          "CUSTOM_EMBROIDERY";

        const embroideryPlacement =
          customEmbroidery
            ? clean(
                submittedItem
                  ?.embroideryPlacement
              )
            : "";

        const embroiderySize =
          customEmbroidery
            ? clean(
                submittedItem
                  ?.embroiderySize
              )
            : "";

        const artwork =
          customEmbroidery
            ? buildArtwork(
                submittedItem?.artwork
              )
            : null;

        const instructions =
          customEmbroidery
            ? clean(
                submittedItem
                  ?.instructions
              )
            : "";

        if (
          customEmbroidery &&
          !embroideryPlacement
        ) {
          return NextResponse.json(
            {
              success: false,
              message: `Please select an embroidery placement for ${clean(
                product.name
              )}.`,
            },
            {
              status: 400,
            }
          );
        }

        if (
          customEmbroidery &&
          !embroiderySize
        ) {
          return NextResponse.json(
            {
              success: false,
              message: `Please select an embroidery size for ${clean(
                product.name
              )}.`,
            },
            {
              status: 400,
            }
          );
        }

        if (
          customEmbroidery &&
          !artwork?.uploadId
        ) {
          return NextResponse.json(
            {
              success: false,
              message: `Artwork is required for ${clean(
                product.name
              )}.`,
            },
            {
              status: 400,
            }
          );
        }

                orderItems.push({
          id: createId(),

          /* ===============================================
             ORDER / PRODUCT
          =============================================== */

          orderType,

          productId: clean(product.id),
          productCode: clean(product.productCode),

          sku:
            clean(product.sku) ||
            clean(price.sku),

          productName: clean(product.name),

          categoryId: clean(product.categoryId),

          categoryName:
            clean(product.categoryName) ||
            clean(price.category),

          productType: clean(product.productType),
          garmentType: clean(product.garmentType),

          /* ===============================================
             BUSINESS OS COMPATIBILITY
          =============================================== */

          priceMasterId: clean(price.id),
          priceMasterSku: clean(price.sku),

          masterItemName:
            clean(price.itemName) ||
            clean(product.name),

          masterItemType:
            clean(price.itemType) ||
            clean(product.productType),

          itemType:
            clean(price.itemType) ||
            clean(product.productType) ||
            clean(product.garmentType),

          description:
            clean(product.description) ||
            clean(product.shortDescription) ||
            clean(price.description) ||
            clean(product.name),

          category:
            clean(price.category) ||
            clean(product.categoryName),

          /* ===============================================
             CUSTOMER CONFIGURATION
          =============================================== */

          colour: clean(
            submittedItem?.colour
          ),

          color: clean(
            submittedItem?.colour
          ),

          sizes,

          size:
            sizes.length === 1
              ? clean(sizes[0].size)
              : "",

          quantity,

          /* ===============================================
             EMBROIDERY / CUSTOMISATION
          =============================================== */

          designName:
            clean(product.name),

          embroideryService:
            customEmbroidery
              ? "Embroidery"
              : "Not Applicable",

          embroideryPlacement,

          placement:
            embroideryPlacement ||
            "Not Applicable",

          embroiderySize,

          artwork,

          instructions,

          /* ===============================================
             COMMERCIAL
          =============================================== */

          unit:
            clean(price.unit) ||
            "Piece",

          unitPrice,

          gstPercent,

          minimumSellingPrice:
            numberValue(
              price.minimumSellingPrice
            ),

          lineSubtotal,

          /* ===============================================
             REFERENCES
          =============================================== */

          customerSku: "",

          notes: "",
        });
      }

      /* ===================================================
         TOTALS
      =================================================== */

      subtotal = Number(subtotal.toFixed(2));

      /*
       * Temporary until we explicitly define whether
       * PriceMaster.sellingPrice includes GST.
       */

      gstAmount = 0;

      const totalAmount = Number(
        (subtotal + gstAmount).toFixed(2)
      );

      /* ===================================================
         CREATE ORDER
      =================================================== */

      const now = new Date();

      const timestamp = now.toISOString();

      const orderDate = timestamp.slice(0, 10);

      const orderId = createId();

      const orderNumber = nextOrderNumber(
        existingOrders
      );

      const paymentTermsDays = Math.max(
        0,
        Math.floor(
          numberValue(customer.paymentTermsDays)
        )
      );

      const orderRecord: Record<string, unknown> = {
        id: orderId,

        orderNumber,

        quotationId: "",
        quotationNumber: "",

        customerId,
        customerName,

        customerPoNumber,

        orderDate,

        deliveryDate: requestedDeliveryDate,

        priority: "Normal",

        orderSource: "Customer Portal",

        contactPerson,
        contactPhone,
        contactEmail,

        shippingAddress,

        paymentTermsDays,

        status: "Pending Review",

        items: JSON.stringify(orderItems),
        orderItems: JSON.stringify(orderItems),

        totalQuantity,

        subtotal,
        gstAmount,
        totalAmount,

        notes: [
          notes,
          "Order submitted through EMBRASTIC customer portal.",
        ]
          .filter(Boolean)
          .join("\n"),

        createdAt: timestamp,
        updatedAt: timestamp,
      };

      addRecord(
        ordersSheet.sheet,
        ORDER_HEADERS,
        orderRecord
      );

      await saveWorkbook(workbook);

      /* ===================================================
         SUCCESS
      =================================================== */

      return NextResponse.json(
        {
          success: true,

          message: "Order placed successfully.",

          orderId,
          orderNumber,

          totalQuantity,

          subtotal,
          gstAmount,
          totalAmount,

          status: "Pending Review",
        },
        {
          status: 201,
        }
      );
    });
  } catch (error) {
    console.error(
      "POST /api/customer/orders failed:",
      error
    );

    /*
     * Even unexpected server errors return JSON.
     * This is important because checkout expects JSON.
     */

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to place your order.",
      },
      {
        status: 500,
      }
    );
  }
}
/* =========================================================
   GET - CUSTOMER'S ORDERS
========================================================= */

export async function GET(request: NextRequest) {
  try {
    /* =====================================================
       CUSTOMER SESSION
    ===================================================== */

    const sessionValue = clean(
      request.cookies.get(
        "embrastic_customer_session"
      )?.value
    );

    if (!sessionValue) {
      return NextResponse.json(
        {
          success: false,
          requiresLogin: true,
          message:
            "Please sign in to view your orders.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       LOAD WORKBOOK
    ===================================================== */

    const workbook = await getWorkbook();

    const customerAccountsSheet =
      await getOrCreateSheet(
        workbook,
        "CustomerAccounts",
        CUSTOMER_ACCOUNT_HEADERS
      );

    const customersSheet =
      await getOrCreateSheet(
        workbook,
        "Customers",
        CUSTOMER_HEADERS
      );

    const ordersSheet =
      await getOrCreateSheet(
        workbook,
        "Orders",
        ORDER_HEADERS
      );

    /* =====================================================
       READ DATA
    ===================================================== */

    const accounts = readRows(
      customerAccountsSheet.sheet,
      CUSTOMER_ACCOUNT_HEADERS
    );

    const customers = readRows(
      customersSheet.sheet,
      CUSTOMER_HEADERS
    );

    const orders = readRows(
      ordersSheet.sheet,
      ORDER_HEADERS
    );

    /* =====================================================
       VERIFY SESSION
    ===================================================== */

    const sessionNormalized =
      normalize(sessionValue);

    const account =
      accounts.find((row) => {
        if (!isActive(row.status)) {
          return false;
        }

        return (
          normalize(row.id) ===
            sessionNormalized ||
          normalize(row.customerId) ===
            sessionNormalized ||
          normalize(row.email) ===
            sessionNormalized
        );
      }) || null;

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          requiresLogin: true,
          message:
            "Your customer session could not be verified. Please sign in again.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       CUSTOMER
    ===================================================== */

    const customerId = clean(
      account.customerId
    );

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your customer account is not linked to a customer record.",
        },
        {
          status: 403,
        }
      );
    }

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
            "The customer record linked to this account could not be found.",
        },
        {
          status: 403,
        }
      );
    }

    if (!isActive(customer.status)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This customer account is currently inactive.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       ONLY THIS CUSTOMER'S ORDERS

       SECURITY:
       Never return orders belonging to another customer.
    ===================================================== */

    const customerOrders = orders
      .filter(
        (order) =>
          clean(order.customerId) ===
          customerId
      )
      .map((order) => ({
        id: clean(order.id),

        orderNumber: clean(
          order.orderNumber
        ),

        customerName: clean(
          order.customerName
        ),

        customerPoNumber: clean(
          order.customerPoNumber
        ),

        orderDate: clean(
          order.orderDate
        ),

        deliveryDate: clean(
          order.deliveryDate
        ),

        priority:
          clean(order.priority) ||
          "Normal",

        status:
          clean(order.status) ||
          "Pending Review",

        totalQuantity: numberValue(
          order.totalQuantity
        ),

        subtotal: numberValue(
          order.subtotal
        ),

        gstAmount: numberValue(
          order.gstAmount
        ),

        totalAmount: numberValue(
          order.totalAmount
        ),

        createdAt: clean(
          order.createdAt
        ),

        updatedAt: clean(
          order.updatedAt
        ),
      }));

    /* =====================================================
       NEWEST FIRST
    ===================================================== */

    customerOrders.sort((a, b) => {
      const aTime = new Date(
        a.createdAt ||
          a.orderDate ||
          0
      ).getTime();

      const bTime = new Date(
        b.createdAt ||
          b.orderDate ||
          0
      ).getTime();

      if (
        Number.isFinite(aTime) &&
        Number.isFinite(bTime)
      ) {
        return bTime - aTime;
      }

      return b.orderNumber.localeCompare(
        a.orderNumber,
        undefined,
        {
          numeric: true,
        }
      );
    });

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        customer: {
          id: clean(customer.id),

          customerCode: clean(
            customer.customerCode
          ),

          name:
            clean(customer.businessName) ||
            clean(customer.name),

          email: clean(
            customer.email
          ),
        },

        count: customerOrders.length,

        orders: customerOrders,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET /api/customer/orders failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to load your orders.",
      },
      {
        status: 500,
      }
    );
  }
}
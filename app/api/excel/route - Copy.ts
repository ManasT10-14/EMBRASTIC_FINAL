import { NextResponse } from "next/server";

import {
  getWorkbook,
  saveWorkbook,
  getOrCreateSheet,
  withExcelLock,
} from "@/lib/excel";

/* =========================================================
   SHEET DEFINITIONS
========================================================= */

const SHEETS = {

  /* =======================================================
     PRODUCT CATEGORIES

     Customer-facing storefront categories / collections.

     Examples:
     - Coffee Lovers
     - Anime Lovers
     - Plain T-Shirts
     - Cotton Polo T-Shirts
     - Hoodies
     - Sweatshirts
     - Custom Embroidery
     - Patches
  ======================================================= */

  ProductCategories: [
    "id",

    "categoryCode",
    "name",
    "slug",

    "description",

    "imageUrl",

    "displayOrder",

    "featured",

    "status",

    "createdAt",
    "updatedAt",
  ],

  /* =======================================================
     PRODUCTS

     Customer-facing catalogue products.

     IMPORTANT:
     Product pricing is linked to PriceMaster rather than
     being independently hard-coded in the customer website.
  ======================================================= */

  Products: [
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
  ],


 
CustomerAccounts: [
  "id",
  "customerId",
  "email",
  "passwordHash",
  "status",
  "emailVerified",
  "lastLoginAt",
  "createdAt",
  "updatedAt",
],


 Customers: [
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
  ],



  Quotations: [
    "id",
    "quotationNumber",
    "customerId",
    "customerName",
    "date",
    "validUntil",
    "items",
    "discount",
    "gstPercent",
    "notes",
    "status",
    "createdAt",
  ],

 Orders: [
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
],

  InventoryTransactions: [
  "id",

  "inventoryId",

  "sku",
  "itemName",

  "type",

  "quantity",

  "previousQuantity",
  "newQuantity",

  "supplier",

  "purchaseNumber",

  "unitCost",
  "purchaseAmount",

  "referenceType",
  "referenceId",

  "notes",

  "createdAt",
],

  Artwork: [
    "id",
    "orderId",
    "orderNumber",
    "customerId",
    "customerName",
    "designName",
    "fileName",
    "status",
    "notes",
    "createdAt",
  ],

 Digitizing: [
  "id",

  "digitizingNumber",

  "artworkId",
  "artworkNumber",

  "orderId",
  "orderNumber",

  "customerId",
  "customerName",

  "designName",

  "digitizingDate",
  "digitizerName",

  "stitchCount",

  "width",
  "height",

  "machineFormat",
  "embroideryType",

  "needleCount",
  "colorCount",

  "density",

  "underlayType",
  "pullCompensation",

  "fileName",
  "digitizedFileUrl",

  "status",

  "notes",

  "createdAt",
  "updatedAt",
],

WorkOrders: [
  "id",

  "workOrderNumber",

  "orderId",
  "orderNumber",

  "orderItemId",

  "customerId",
  "customerName",

  "customerPoNumber",

  "digitizingId",
  "digitizingNumber",

  "itemType",
  "itemDescription",

  "designName",
  "embroideryService",
  "placement",

  "garmentColor",
  "garmentSize",

  "orderedQuantity",
  "productionQuantity",
  "unit",

  "stitchCount",

  "embroideryWidthMm",
  "embroideryHeightMm",

  "colourCount",
  "threadColors",

  "fileFormat",

  "machineName",
  "operatorName",

  "hoopSize",
  "threadType",
  "needleType",

  "backingType",
  "toppingRequired",

  "machineSpeed",

  "sampleRequired",
  "sampleApproved",
  "sampleApprovedBy",

  "plannedStartDate",
  "targetCompletionDate",

  "priority",
  "status",

  "packingInstructions",
  "productionInstructions",
  "notes",

  "createdAt",
  "updatedAt",
],

PriceMaster: [
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
],
  Production: [
  "id",

  "workOrderId",
  "workOrderNumber",

  "orderId",
  "orderNumber",
  "orderItemId",

  "customerId",
  "customerName",

  "digitizingId",

  "designName",
  "itemDescription",

  "garmentColor",
  "garmentSize",

  "status",

  "machineName",
  "operatorName",

  "productionQuantity",
  "completedQuantity",

  "stitchCount",

  "embroideryWidthMm",
  "embroideryHeightMm",

  "hoopSize",

  "colourCount",
  "threadColors",

  "threadType",
  "needleType",

  "backingType",
  "toppingRequired",

  "machineSpeed",

  "placement",

  "sampleApproved",
  "sampleApprovedBy",

  "startDate",
  "startTime",

  "completedDate",
  "completedTime",

  "rejectedQuantity",
  "reworkQuantity",

  "downtimeMinutes",
  "stoppageReason",

  "productionInstructions",
  "packingInstructions",

  "notes",

  "createdAt",
  "updatedAt",
],

  /* =======================================================
     QUALITY CONTROL

     These names are now shared by:
     Quality Control page
     Excel
     Dispatch page
  ======================================================= */

 QualityControl: [
  "id",

  "qcNumber",

  "productionId",
  "productionNumber",

  "workOrderId",
  "workOrderNumber",

  "orderId",
  "orderNumber",
  "orderItemId",

  "customerId",
  "customerName",

  "digitizingId",

  "designName",
  "itemDescription",

  "garmentColor",
  "garmentSize",

  "machineName",
  "operatorName",

  "productionQuantity",
  "productionCompletedQuantity",
  "productionRejectedQuantity",
  "productionReworkQuantity",

  "inspectedQuantity",
  "passedQuantity",
  "rejectedQuantity",
  "reworkQuantity",

  "qcStatus",

  "stitchQuality",
  "threadQuality",
  "placementAccuracy",
  "sizeAccuracy",
  "colorAccuracy",
  "finishingQuality",
  "cleanliness",
  "packagingReadiness",

  "defectType",
  "defectDetails",

  "correctiveAction",

  "inspectionDate",
  "inspectorName",

  "dispatchReady",

  "notes",

  "createdAt",
  "updatedAt",
],

 Inventory: [
  "id",

  "name",
  "category",

  "sku",

  "brand",

  "color",
  "colour",

  "colorCode",
  "colourCode",

  "size",
  "variant",

  "quantity",

  "unit",
  "minimumStock",

  "price",

  "supplier",

  "notes",

  "createdAt",
  "updatedAt",
],



 Invoices: [
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
  "updatedAt",
],

  Payments: [
  "id",

  "invoiceId",
  "invoiceNumber",

  "customer",
  "customerId",

  "orderId",
  "orderNumber",

  "dispatchId",
  "dispatchNumber",

  "date",
  "amount",

  "method",
  "reference",

  "notes",

  "createdAt",
],

  /* =======================================================
     DISPATCH
  ======================================================= */

  Dispatch: [
  "id",

  "dispatchNumber",

  "orderId",
  "orderNumber",
  "orderItemId",

  "customerId",
  "customerName",

  "qualityControlId",
  "qcNumber",
  "qcResult",
  "qcDate",
  "qcInspector",

  "productionId",
  "productionNumber",

  "workOrderId",
  "workOrderNumber",

  "designName",
  "itemDescription",
  "garmentColor",
  "garmentSize",

  "qcPassedQuantity",
  "dispatchQuantity",

  "dispatchDate",

  "courierName",
  "trackingNumber",

  "shippingMode",
  "dispatchMethod",

  "packageCount",
  "totalWeight",

  "vehicleNumber",
  "driverName",
  "driverPhone",

  "deliveryAddress",
  "packingInstructions",

  "expectedDeliveryDate",
  "actualDeliveryDate",

  "status",

  "notes",

  "createdAt",
  "updatedAt",
],

Suppliers: [
  "id",

  "supplierCode",
  "supplierName",

  "contactPerson",

  "phone",
  "alternatePhone",

  "email",

  "gstin",
  "pan",

  "address",
  "city",
  "state",
  "postalCode",
  "country",

  "paymentTermsDays",
  "leadTimeDays",

  "categories",

  "bankName",
  "bankAccountName",
  "bankAccountNumber",
  "ifscCode",
  "upiId",

  "notes",

  "status",

  "createdAt",
  "updatedAt",
],

SupplierBills: [
  "id",

  "billNumber",

  "supplierInvoiceNumber",

  "supplierId",
  "supplierCode",
  "supplierName",

  "purchaseOrderId",
  "purchaseOrderNumber",

  "billDate",
  "dueDate",

  "subtotal",
  "taxAmount",
  "totalAmount",

  "notes",

  "status",

  "createdAt",
  "updatedAt",
],
SupplierPayments: [
  "id",

  "supplierBillId",
  "billNumber",

  "supplierInvoiceNumber",

  "supplierId",
  "supplierCode",
  "supplierName",

  "purchaseOrderId",
  "purchaseOrderNumber",

  "paymentDate",

  "amount",

  "paymentMethod",

  "reference",

  "notes",

  "createdAt",
],


PurchaseOrders: [
  "id",

  "purchaseOrderNumber",

  "supplierId",
  "supplierCode",
  "supplierName",
  "supplierGstin",

  "poDate",
  "expectedDeliveryDate",

  "paymentTermsDays",

  "reference",

  "items",

  "subtotal",
  "taxAmount",
  "totalAmount",

  "receivedQuantity",
  "pendingQuantity",

  "status",

  "deliveryAddress",

  "notes",

  "createdAt",
  "updatedAt",
],
ReturnsRework: [
  "id",
  "caseNumber",

  "caseType",
  "sourceStage",

  "orderId",
  "orderNumber",
  "orderItemId",

  "workOrderId",
  "workOrderNumber",

  "productionId",

  "qualityControlId",
  "qcNumber",

  "dispatchId",
  "dispatchNumber",

  "customerId",
  "customerName",

  "itemDescription",
  "garmentColor",
  "garmentSize",
  "designName",

  "reportedDate",

  "quantity",

  "reasonCategory",
  "defectType",
  "issueDetails",

  "responsibility",
  "severity",

  "actionRequired",

  "reworkQuantity",
  "replacementQuantity",
  "scrapQuantity",
  "refundQuantity",

  "estimatedCost",
  "actualCost",

  "assignedTo",

  "targetDate",
  "completedDate",

  "rootCause",
  "correctiveAction",
  "preventiveAction",

  "customerResolution",

  "status",

  "notes",

  "createdAt",
  "updatedAt",
],



  Expenses: [
    "id",
    "date",
    "category",
    "description",
    "amount",
    "paymentMethod",
    "reference",
    "supplier",
    "inventoryTransactionId",
    "inventoryId",
    "sku",
    "itemName",
    "quantity",
    "unit",
    "unitCost",
"supplierId",
"supplierCode",

"supplierBillId",
"supplierBillNumber",

"supplierInvoiceNumber",

"purchaseOrderId",
"purchaseOrderNumber",
    "notes",
    "createdAt",
  ],

  Settings: [
    "id",
    "key",
    "value",
    "updatedAt",
  ],
};

/* =========================================================
   VALUE HELPERS
========================================================= */

function cellToString(value: any) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    if (
      typeof value.text ===
      "string"
    ) {
      return value.text;
    }

    if (
      value.result !==
      undefined
    ) {
      return String(
        value.result
      );
    }

    if (
      Array.isArray(
        value.richText
      )
    ) {
      return value.richText
        .map(
          (item: any) =>
            item.text || ""
        )
        .join("");
    }
  }

  return String(value);
}

function normalizeValue(
  value: any
) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "object"
  ) {
    try {
      return JSON.stringify(
        value
      );
    } catch {
      return String(value);
    }
  }

  return value;
}

function getRecordValue(
  record: Record<string, any>,
  header: string
) {
  if (
    Object.prototype.hasOwnProperty.call(
      record,
      header
    )
  ) {
    return normalizeValue(
      record[header]
    );
  }

  if (
    header === "customerName" &&
    Object.prototype.hasOwnProperty.call(
      record,
      "customer"
    )
  ) {
    return normalizeValue(
      record.customer
    );
  }

  if (
    header === "customer" &&
    Object.prototype.hasOwnProperty.call(
      record,
      "customerName"
    )
  ) {
    return normalizeValue(
      record.customerName
    );
  }

  return "";
}

function recordToValues(
  record: Record<string, any>,
  headers: string[]
) {
  return headers.map(
    (header) =>
      getRecordValue(
        record,
        header
      )
  );
}

function rowToObject(
  row: any,
  headers: string[]
) {
  const item: Record<
    string,
    string
  > = {};

  headers.forEach(
    (header, index) => {
      item[header] =
        cellToString(
          row.getCell(
            index + 1
          ).value
        );
    }
  );

  if (
    "customer" in item &&
    "customerName" in item
  ) {
    if (
      !item.customerName &&
      item.customer
    ) {
      item.customerName =
        item.customer;
    }

    if (
      !item.customer &&
      item.customerName
    ) {
      item.customer =
        item.customerName;
    }
  }

  return item;
}

/* =========================================================
   NEXT NUMBER
========================================================= */

function generateNextNumber(
  sheet: any,
  headers: string[],
  field: string,
  prefix: string
) {
  const index =
    headers.indexOf(field);

  if (index === -1) {
    throw new Error(
      `Unknown number field: ${field}`
    );
  }

  const year =
    new Date().getFullYear();

  let highest = 0;

  sheet.eachRow(
    (
      row: any,
      rowNumber: number
    ) => {
      if (rowNumber === 1) {
        return;
      }

      const value =
        cellToString(
          row.getCell(
            index + 1
          ).value
        ).trim();

      if (!value) {
        return;
      }

      const parts =
        value.split("-");

      const last =
        parts[
          parts.length - 1
        ];

      const number =
        Number.parseInt(
          last,
          10
        );

      if (
        Number.isFinite(
          number
        ) &&
        number > highest
      ) {
        highest = number;
      }
    }
  );

  return `${prefix}-${year}-${String(
    highest + 1
  ).padStart(4, "0")}`;
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  request: any
) {
  return withExcelLock(
    async () => {
      try {
        const sheetName =
          request.nextUrl
            .searchParams
            .get("sheet");

        if (!sheetName) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Sheet name is required.",
            },
            {
              status: 400,
            }
          );
        }

        const headers =
          SHEETS[
            sheetName as keyof typeof SHEETS
          ];

        if (!headers) {
          return NextResponse.json(
            {
              success: false,
              message:
                `Unknown sheet: ${sheetName}`,
            },
            {
              status: 400,
            }
          );
        }

        const workbook =
          await getWorkbook();

        const {
          sheet,
          created,
        } =
          await getOrCreateSheet(
            workbook,
            sheetName,
            headers
          );

        const rows: Record<
          string,
          string
        >[] = [];

        sheet.eachRow(
          (
            row,
            rowNumber
          ) => {
            if (
              rowNumber === 1
            ) {
              return;
            }

            const item =
              rowToObject(
                row,
                headers
              );

            const hasData =
              Object.values(
                item
              ).some(
                (value) =>
                  String(
                    value
                  ).trim() !== ""
              );

            if (hasData) {
              rows.push(item);
            }
          }
        );

        if (created) {
          await saveWorkbook(
            workbook
          );
        }

        return NextResponse.json(
          {
            success: true,
            sheet: sheetName,
            rows,
          }
        );
      } catch (error) {
        console.error(
          "Excel GET error:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Failed to access Excel backend.",
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
          {
            status: 500,
          }
        );
      }
    }
  );
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request: any
) {
  return withExcelLock(
    async () => {
      try {
        const body =
          await request.json();

        const action =
          String(
            body.action || "add"
          );

        /* NEXT NUMBER */

        if (
          action === "nextNumber"
        ) {
          const sheetName =
            String(
              body.sheet || ""
            );

          const field =
            String(
              body.field || ""
            );

          const prefix =
            String(
              body.prefix || ""
            );

          const headers =
            SHEETS[
              sheetName as keyof typeof SHEETS
            ];

          if (!headers) {
            return NextResponse.json(
              {
                success: false,
                message:
                  `Unknown sheet: ${sheetName}`,
              },
              {
                status: 400,
              }
            );
          }

          const workbook =
            await getWorkbook();

          const {
            sheet,
            created,
          } =
            await getOrCreateSheet(
              workbook,
              sheetName,
              headers
            );

          const value =
            generateNextNumber(
              sheet,
              headers,
              field,
              prefix
            );

          if (created) {
            await saveWorkbook(
              workbook
            );
          }

          return NextResponse.json(
            {
              success: true,
              value,
              number: value,
            }
          );
        }

        /* OLD INVOICE SUPPORT */

        if (
          action ===
          "nextInvoiceNumber"
        ) {
          const headers =
            SHEETS.Invoices;

          const workbook =
            await getWorkbook();

          const {
            sheet,
            created,
          } =
            await getOrCreateSheet(
              workbook,
              "Invoices",
              headers
            );

          const invoiceNumber =
            generateNextNumber(
              sheet,
              headers,
              "invoiceNumber",
              "INV"
            );

          if (created) {
            await saveWorkbook(
              workbook
            );
          }

          return NextResponse.json(
            {
              success: true,
              invoiceNumber,
              value:
                invoiceNumber,
            }
          );
        }

        const sheetName =
          String(
            body.sheet || ""
          );

        if (!sheetName) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Sheet name is required.",
            },
            {
              status: 400,
            }
          );
        }

        const headers =
          SHEETS[
            sheetName as keyof typeof SHEETS
          ];

        if (!headers) {
          return NextResponse.json(
            {
              success: false,
              message:
                `Unknown sheet: ${sheetName}`,
            },
            {
              status: 400,
            }
          );
        }

        const workbook =
          await getWorkbook();

        const { sheet } =
          await getOrCreateSheet(
            workbook,
            sheetName,
            headers
          );

        /* ADD */

        if (action === "add") {
          let values: any[];

          if (
            body.record &&
            typeof body.record ===
              "object" &&
            !Array.isArray(
              body.record
            )
          ) {
            values =
              recordToValues(
                body.record,
                headers
              );
          } else if (
            body.row &&
            typeof body.row ===
              "object" &&
            !Array.isArray(
              body.row
            )
          ) {
            values =
              recordToValues(
                body.row,
                headers
              );
          } else if (
            Array.isArray(
              body.row
            )
          ) {
            values =
              headers.map(
                (_, index) =>
                  normalizeValue(
                    body.row[index]
                  )
              );
          } else {
            return NextResponse.json(
              {
                success: false,
                message:
                  "Record or row is required.",
              },
              {
                status: 400,
              }
            );
          }

          sheet.addRow(values);

          await saveWorkbook(
            workbook
          );

          return NextResponse.json(
            {
              success: true,
              message:
                "Record added successfully.",
            }
          );
        }

        /* UPDATE */

        if (
          action === "update"
        ) {
          const id =
            String(
              body.id || ""
            ).trim();

          if (!id) {
            return NextResponse.json(
              {
                success: false,
                message:
                  "ID is required.",
              },
              {
                status: 400,
              }
            );
          }

          const incoming =
            body.record &&
            typeof body.record ===
              "object" &&
            !Array.isArray(
              body.record
            )
              ? body.record
              : body.row &&
                  typeof body.row ===
                    "object" &&
                  !Array.isArray(
                    body.row
                  )
                ? body.row
                : null;

          let found = false;

          sheet.eachRow(
            (
              row,
              rowNumber
            ) => {
              if (
                rowNumber === 1 ||
                found
              ) {
                return;
              }

              const rowId =
                cellToString(
                  row.getCell(
                    1
                  ).value
                ).trim();

              if (
                rowId !== id
              ) {
                return;
              }

              /*
               * IMPORTANT:
               * Object updates are PATCHED.
               *
               * We update only fields that
               * actually arrived from the page.
               *
               * This prevents unrelated columns
               * from being accidentally erased.
               */

              if (incoming) {
                headers.forEach(
                  (
                    header,
                    index
                  ) => {
                    if (
                      Object.prototype
                        .hasOwnProperty
                        .call(
                          incoming,
                          header
                        )
                    ) {
                      row.getCell(
                        index + 1
                      ).value =
                        normalizeValue(
                          incoming[
                            header
                          ]
                        );
                    }
                  }
                );
              } else if (
                Array.isArray(
                  body.row
                )
              ) {
                headers.forEach(
                  (
                    _,
                    index
                  ) => {
                    row.getCell(
                      index + 1
                    ).value =
                      normalizeValue(
                        body.row[
                          index
                        ]
                      );
                  }
                );
              } else {
                throw new Error(
                  "Updated record is required."
                );
              }

              found = true;
            }
          );

          if (!found) {
            return NextResponse.json(
              {
                success: false,
                message:
                  "Record not found.",
              },
              {
                status: 404,
              }
            );
          }

          await saveWorkbook(
            workbook
          );

          return NextResponse.json(
            {
              success: true,
              message:
                "Record updated successfully.",
            }
          );
        }

        /* DELETE */

        if (
          action === "delete"
        ) {
          const id =
            String(
              body.id || ""
            ).trim();

          if (!id) {
            return NextResponse.json(
              {
                success: false,
                message:
                  "ID is required.",
              },
              {
                status: 400,
              }
            );
          }

          let rowNumberToDelete =
            -1;

          sheet.eachRow(
            (
              row,
              rowNumber
            ) => {
              if (
                rowNumber === 1
              ) {
                return;
              }

              const rowId =
                cellToString(
                  row.getCell(
                    1
                  ).value
                ).trim();

              if (rowId === id) {
                rowNumberToDelete =
                  rowNumber;
              }
            }
          );

          if (
            rowNumberToDelete ===
            -1
          ) {
            return NextResponse.json(
              {
                success: false,
                message:
                  "Record not found.",
              },
              {
                status: 404,
              }
            );
          }

          sheet.spliceRows(
            rowNumberToDelete,
            1
          );

          await saveWorkbook(
            workbook
          );

          return NextResponse.json(
            {
              success: true,
              message:
                "Record deleted successfully.",
            }
          );
        }

        return NextResponse.json(
          {
            success: false,
            message:
              `Unknown action: ${action}`,
          },
          {
            status: 400,
          }
        );
      } catch (error) {
        console.error(
          "Excel POST error:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Failed to process Excel request.",
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
          {
            status: 500,
          }
        );
      }
    }
  );
}
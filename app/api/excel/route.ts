import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";

/*
=========================================================
 EMBRASTIC BUSINESS OS
 PostgreSQL compatibility data layer

 IMPORTANT:
 The URL remains /api/excel temporarily so that the
 existing Business OS pages do not need to be rewritten.

 This file DOES NOT read or write Excel.
 PostgreSQL is now the database.
=========================================================
*/



/* =========================================================
   SHEET -> POSTGRESQL TABLE MAPPING
========================================================= */

const TABLE_MAP = {
  Customers: "customers",
  Digitizing: "digitizing",
  Orders: "orders",
  Payments: "payments",
  Quotations: "quotations",
  Artwork: "artwork",
  Production: "production",
  QualityControl: "quality_control",
  Inventory: "inventory",
  Expenses: "expenses",
  Settings: "settings",
  Invoices: "invoices",
  InventoryTransactions: "inventory_transactions",
  Dispatch: "dispatch",
  WorkOrders: "work_orders",
  Suppliers: "suppliers",
  PurchaseOrders: "purchase_orders",
  ReturnsRework: "returns_rework",
  PriceMaster: "price_master",
  SupplierBills: "supplier_bills",
  SupplierPayments: "supplier_payments",
  CustomerAccounts: "customer_accounts",
  ProductCategories: "product_categories",
  Products: "products",
} as const;

type SheetName = keyof typeof TABLE_MAP;

/* =========================================================
   TYPES
========================================================= */

type ColumnInfo = {
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: string;
  column_default: string | null;
  ordinal_position: number;
};

type DbRow = Record<string, any>;

/* =========================================================
   BASIC HELPERS
========================================================= */

function quoteIdentifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function getTableName(sheetName: string): string | null {
  if (
    !Object.prototype.hasOwnProperty.call(
      TABLE_MAP,
      sheetName
    )
  ) {
    return null;
  }

  return TABLE_MAP[sheetName as SheetName];
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : String(error);
}

function hasOwn(
  object: Record<string, any>,
  key: string
) {
  return Object.prototype.hasOwnProperty.call(
    object,
    key
  );
}

/* =========================================================
   COLUMN METADATA
========================================================= */

async function getColumns(
  tableName: string
): Promise<ColumnInfo[]> {
  const rows = await prisma.$queryRawUnsafe<
    ColumnInfo[]
  >(
    `
      SELECT
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `,
    tableName
  );

  return rows;
}

/* =========================================================
   OUTPUT COMPATIBILITY

   The old Excel endpoint returned cell values primarily as
   strings. We retain that behaviour so existing Business OS
   pages do not suddenly receive Prisma Decimal, Date, BigInt,
   etc.
========================================================= */

function outputValue(value: any): any {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "number") {
    return String(value);
  }

  /*
   * Prisma Decimal and similar values generally provide a
   * useful toString().
   */
  if (
    typeof value === "object" &&
    typeof value.toJSON === "function"
  ) {
    const jsonValue = value.toJSON();

    if (
      typeof jsonValue === "string" ||
      typeof jsonValue === "number" ||
      typeof jsonValue === "boolean"
    ) {
      return String(jsonValue);
    }

    try {
      return JSON.stringify(jsonValue);
    } catch {
      return String(value);
    }
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function serializeRow(row: DbRow): DbRow {
  const result: DbRow = {};

  for (const [key, value] of Object.entries(row)) {
    result[key] = outputValue(value);
  }

  /*
   * Preserve old compatibility between customer and
   * customerName where applicable.
   */
  if (
    hasOwn(result, "customer") &&
    hasOwn(result, "customerName")
  ) {
    if (!result.customerName && result.customer) {
      result.customerName = result.customer;
    }

    if (!result.customer && result.customerName) {
      result.customer = result.customerName;
    }
  }

  return result;
}

/* =========================================================
   INPUT CONVERSION
========================================================= */

function isNumericType(column: ColumnInfo) {
  return [
    "smallint",
    "integer",
    "bigint",
    "decimal",
    "numeric",
    "real",
    "double precision",
  ].includes(column.data_type);
}

function isIntegerType(column: ColumnInfo) {
  return [
    "smallint",
    "integer",
    "bigint",
  ].includes(column.data_type);
}

function isBooleanType(column: ColumnInfo) {
  return column.data_type === "boolean";
}

function isJsonType(column: ColumnInfo) {
  return (
    column.data_type === "json" ||
    column.data_type === "jsonb"
  );
}

function isDateType(column: ColumnInfo) {
  return (
    column.data_type === "date" ||
    column.data_type.includes("timestamp")
  );
}

function convertInputValue(
  value: any,
  column: ColumnInfo
): any {
  /*
   * PostgreSQL should use NULL for an empty numeric/date/etc.
   * rather than trying to insert "" into typed columns.
   */
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  if (
    typeof value === "string" &&
    value.trim() === ""
  ) {
    if (
      isNumericType(column) ||
      isBooleanType(column) ||
      isDateType(column) ||
      isJsonType(column)
    ) {
      return null;
    }

    return "";
  }

  /* ---------------- BOOLEAN ---------------- */

  if (isBooleanType(column)) {
    if (typeof value === "boolean") {
      return value;
    }

    const text = String(value)
      .trim()
      .toLowerCase();

    if (
      ["true", "1", "yes", "y", "on"].includes(text)
    ) {
      return true;
    }

    if (
      ["false", "0", "no", "n", "off"].includes(text)
    ) {
      return false;
    }

    return null;
  }

  /* ---------------- INTEGER ---------------- */

  if (isIntegerType(column)) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      throw new Error(
        `Invalid integer value for "${column.column_name}": ${String(
          value
        )}`
      );
    }

    return Math.trunc(number);
  }

  /* ---------------- DECIMAL ---------------- */

  if (isNumericType(column)) {
    let rawValue = value;

    // Pull compensation may arrive as "0.5 mm".
    // PostgreSQL numeric columns must receive 0.5.
    if (
      column.column_name === "pullCompensation" &&
      typeof rawValue === "string"
    ) {
      rawValue = rawValue
        .trim()
        .replace(/\s*mm\s*$/i, "");
    }

    const number = Number(rawValue);

    if (!Number.isFinite(number)) {
      throw new Error(
        `Invalid numeric value for "${column.column_name}": ${String(value)}`
      );
    }

    return number;
  }
  /* ---------------- JSON ---------------- */

  if (isJsonType(column)) {
    if (
      typeof value === "object" &&
      value !== null
    ) {
      return JSON.stringify(value);
    }

    const text = String(value).trim();

    if (!text) {
      return null;
    }

    try {
      JSON.parse(text);
      return text;
    } catch {
      /*
       * Existing pages occasionally store ordinary text in
       * fields that later became JSON. Store it as a valid
       * JSON string rather than failing the entire request.
       */
      return JSON.stringify(value);
    }
  }

  /* ---------------- DATE / TIMESTAMP ---------------- */

  if (isDateType(column)) {
    if (value instanceof Date) {
      return value;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error(
        `Invalid date value for "${column.column_name}": ${String(
          value
        )}`
      );
    }

    if (column.data_type === "date") {
      return date.toISOString().slice(0, 10);
    }

    return date;
  }

  /* ---------------- TEXT / OTHER ---------------- */

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

/* =========================================================
   RECORD NORMALISATION
========================================================= */

function getIncomingRecord(body: any) {
  if (
    body?.record &&
    typeof body.record === "object" &&
    !Array.isArray(body.record)
  ) {
    return body.record as Record<string, any>;
  }

  if (
    body?.row &&
    typeof body.row === "object" &&
    !Array.isArray(body.row)
  ) {
    return body.row as Record<string, any>;
  }

  return null;
}

function applyCustomerAlias(
  record: Record<string, any>,
  columns: ColumnInfo[]
) {
  const columnNames = new Set(
    columns.map((column) => column.column_name)
  );

  const result = {
    ...record,
  };

  /*
   * Some older pages use customer while newer modules use
   * customerName.
   */
  if (
    columnNames.has("customerName") &&
    !hasOwn(result, "customerName") &&
    hasOwn(result, "customer")
  ) {
    result.customerName = result.customer;
  }

  if (
    columnNames.has("customer") &&
    !hasOwn(result, "customer") &&
    hasOwn(result, "customerName")
  ) {
    result.customer = result.customerName;
  }

  return result;
}

function buildRecordFromArray(
  row: any[],
  columns: ColumnInfo[]
) {
  const record: Record<string, any> = {};

  columns.forEach((column, index) => {
    if (index < row.length) {
      record[column.column_name] =
        row[index];
    }
  });

  return record;
}

function filterRecordToColumns(
  record: Record<string, any>,
  columns: ColumnInfo[],
  mode: "add" | "update"
) {
  const result: Record<string, any> = {};

  const aliased = applyCustomerAlias(
    record,
    columns
  );

  for (const column of columns) {
    const key = column.column_name;

    /*
     * UPDATE must behave like PATCH:
     * only supplied properties are changed.
     */
    if (
      mode === "update" &&
      !hasOwn(aliased, key)
    ) {
      continue;
    }

    /*
     * ADD ignores properties not present in the database.
     */
    if (
      mode === "add" &&
      !hasOwn(aliased, key)
    ) {
      continue;
    }

    result[key] = convertInputValue(
      aliased[key],
      column
    );
  }

  return result;
}

/* =========================================================
   NEXT NUMBER
========================================================= */

async function generateNextNumber(
  tableName: string,
  field: string,
  prefix: string,
  columns: ColumnInfo[]
) {
  const validColumn = columns.find(
    (column) => column.column_name === field
  );

  if (!validColumn) {
    throw new Error(
      `Unknown number field: ${field}`
    );
  }

  const quotedTable =
    quoteIdentifier(tableName);

  const quotedField =
    quoteIdentifier(field);

  const rows =
    await prisma.$queryRawUnsafe<
      Record<string, any>[]
    >(
      `
        SELECT ${quotedField} AS value
        FROM ${quotedTable}
        WHERE ${quotedField} IS NOT NULL
      `
    );

  let highest = 0;

  for (const row of rows) {
    const value = String(
      row.value ?? ""
    ).trim();

    if (!value) {
      continue;
    }

    const parts = value.split("-");

    const last =
      parts[parts.length - 1];

    const number =
      Number.parseInt(last, 10);

    if (
      Number.isFinite(number) &&
      number > highest
    ) {
      highest = number;
    }
  }

  const year =
    new Date().getFullYear();

  return `${prefix}-${year}-${String(
    highest + 1
  ).padStart(4, "0")}`;
}

/* =========================================================
   GET
========================================================= */

export async function GET(request: any) {
  try {
    const sheetName =
      request.nextUrl.searchParams.get(
        "sheet"
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

    const tableName =
      getTableName(sheetName);

    if (!tableName) {
      return NextResponse.json(
        {
          success: false,
          message: `Unknown sheet: ${sheetName}`,
        },
        {
          status: 400,
        }
      );
    }

    const columns =
      await getColumns(tableName);

    if (!columns.length) {
      return NextResponse.json(
        {
          success: false,
          message:
            `PostgreSQL table "${tableName}" does not exist or has no columns.`,
        },
        {
          status: 500,
        }
      );
    }

    const quotedTable =
      quoteIdentifier(tableName);

    /*
     * Keep reads predictable.
     *
     * We do not assume every table has createdAt.
     * PostgreSQL naturally returns the table records.
     */
    const dbRows =
      await prisma.$queryRawUnsafe<
        DbRow[]
      >(
        `SELECT * FROM ${quotedTable}`
      );

    const rows =
      dbRows.map(serializeRow);

    return NextResponse.json({
      success: true,
      sheet: sheetName,
      rows,
    });
  } catch (error) {
    console.error(
      "PostgreSQL GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to access PostgreSQL backend.",
        error: errorMessage(error),
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(request: any) {
  try {
    const body =
      await request.json();

    const action = String(
      body?.action || "add"
    );

    /* =====================================================
       NEXT NUMBER
    ===================================================== */

    if (action === "nextNumber") {
      const sheetName = String(
        body?.sheet || ""
      );

      const field = String(
        body?.field || ""
      );

      const prefix = String(
        body?.prefix || ""
      );

      const tableName =
        getTableName(sheetName);

      if (!tableName) {
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

      if (!field) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Number field is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!prefix) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Number prefix is required.",
          },
          {
            status: 400,
          }
        );
      }

      const columns =
        await getColumns(tableName);

      const value =
        await generateNextNumber(
          tableName,
          field,
          prefix,
          columns
        );

      return NextResponse.json({
        success: true,
        value,
        number: value,
      });
    }

    /* =====================================================
       OLD INVOICE NUMBER SUPPORT
    ===================================================== */

    if (
      action === "nextInvoiceNumber"
    ) {
      const tableName =
        TABLE_MAP.Invoices;

      const columns =
        await getColumns(tableName);

      const invoiceNumber =
        await generateNextNumber(
          tableName,
          "invoiceNumber",
          "INV",
          columns
        );

      return NextResponse.json({
        success: true,
        invoiceNumber,
        value: invoiceNumber,
      });
    }

    /* =====================================================
       VALIDATE SHEET
    ===================================================== */

    const sheetName = String(
      body?.sheet || ""
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

    const tableName =
      getTableName(sheetName);

    if (!tableName) {
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

    const columns =
      await getColumns(tableName);

    if (!columns.length) {
      return NextResponse.json(
        {
          success: false,
          message:
            `PostgreSQL table "${tableName}" does not exist or has no columns.`,
        },
        {
          status: 500,
        }
      );
    }

    const quotedTable =
      quoteIdentifier(tableName);

    /* =====================================================
       ADD
    ===================================================== */

    if (action === "add") {
      let incoming =
        getIncomingRecord(body);

      if (
        !incoming &&
        Array.isArray(body?.row)
      ) {
        incoming =
          buildRecordFromArray(
            body.row,
            columns
          );
      }

      if (!incoming) {
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

      /*
       * All current EMBRASTIC business tables use an id.
       * The old UI normally supplies it. If it doesn't,
       * PostgreSQL gets a UUID rather than an empty ID.
       */
      const idColumn =
        columns.find(
          (column) =>
            column.column_name === "id"
        );

      if (
        idColumn &&
        (
          !hasOwn(incoming, "id") ||
          incoming.id === null ||
          incoming.id === undefined ||
          String(incoming.id).trim() === ""
        )
      ) {
        incoming = {
          ...incoming,
          id: randomUUID(),
        };
      }

      const record =
        filterRecordToColumns(
          incoming,
          columns,
          "add"
        );

      const keys =
        Object.keys(record);

      if (!keys.length) {
        return NextResponse.json(
          {
            success: false,
            message:
              "No valid database fields were supplied.",
          },
          {
            status: 400,
          }
        );
      }

      const columnSql =
        keys
          .map(quoteIdentifier)
          .join(", ");

      const placeholders =
        keys
          .map(
            (_, index) =>
              `$${index + 1}`
          )
          .join(", ");

      const values =
        keys.map(
          (key) => record[key]
        );

      const sql = `
        INSERT INTO ${quotedTable}
        (${columnSql})
        VALUES (${placeholders})
        RETURNING *
      `;

      const inserted =
        await prisma.$queryRawUnsafe<
          DbRow[]
        >(
          sql,
          ...values
        );

      return NextResponse.json({
        success: true,
        message:
          "Record added successfully.",
        record:
          inserted[0]
            ? serializeRow(inserted[0])
            : null,
      });
    }

    /* =====================================================
       UPDATE
       PATCH semantics are intentionally preserved.
    ===================================================== */

    if (action === "update") {
      const id = String(
        body?.id || ""
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

      let incoming =
        getIncomingRecord(body);

      if (
        !incoming &&
        Array.isArray(body?.row)
      ) {
        incoming =
          buildRecordFromArray(
            body.row,
            columns
          );
      }

      if (!incoming) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Updated record is required.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * ID identifies the row.
       * Don't accidentally change the primary key during
       * an ordinary PATCH operation.
       */
      const incomingWithoutId = {
        ...incoming,
      };

      delete incomingWithoutId.id;

      const record =
        filterRecordToColumns(
          incomingWithoutId,
          columns,
          "update"
        );

      const keys =
        Object.keys(record);

      /*
       * An empty PATCH is harmless.
       */
      if (!keys.length) {
        const existing =
          await prisma.$queryRawUnsafe<
            DbRow[]
          >(
            `
              SELECT *
              FROM ${quotedTable}
              WHERE "id" = $1
              LIMIT 1
            `,
            id
          );

        if (!existing.length) {
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

        return NextResponse.json({
          success: true,
          message:
            "Record updated successfully.",
          record:
            serializeRow(existing[0]),
        });
      }

      const setSql =
        keys
          .map(
            (key, index) =>
              `${quoteIdentifier(
                key
              )} = $${index + 1}`
          )
          .join(", ");

      const values =
        keys.map(
          (key) => record[key]
        );

      /*
       * id is the final parameter.
       */
      values.push(id);

      const idParameter =
        `$${values.length}`;

      const sql = `
        UPDATE ${quotedTable}
        SET ${setSql}
        WHERE "id" = ${idParameter}
        RETURNING *
      `;

      const updated =
        await prisma.$queryRawUnsafe<
          DbRow[]
        >(
          sql,
          ...values
        );

      if (!updated.length) {
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

      return NextResponse.json({
        success: true,
        message:
          "Record updated successfully.",
        record:
          serializeRow(updated[0]),
      });
    }

    /* =====================================================
       DELETE
    ===================================================== */

    if (action === "delete") {
      const id = String(
        body?.id || ""
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

      const deleted =
        await prisma.$queryRawUnsafe<
          DbRow[]
        >(
          `
            DELETE FROM ${quotedTable}
            WHERE "id" = $1
            RETURNING *
          `,
          id
        );

      if (!deleted.length) {
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

      return NextResponse.json({
        success: true,
        message:
          "Record deleted successfully.",
        record:
          serializeRow(deleted[0]),
      });
    }

    /* =====================================================
       UNKNOWN ACTION
    ===================================================== */

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
      "PostgreSQL POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to process PostgreSQL request.",
        error: errorMessage(error),
      },
      {
        status: 500,
      }
    );
  }
}
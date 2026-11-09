/**
 * EMBRASTIC
 * Excel -> PostgreSQL migration
 *
 * Source:
 *   data/embrastic.xlsx
 *
 * Destination:
 *   PostgreSQL database from DATABASE_URL
 *
 * IMPORTANT:
 *   - Does NOT touch app_state
 *   - Runs inside one PostgreSQL transaction
 *   - Preserves existing IDs
 *   - Converts values based on actual PostgreSQL column types
 *   - Rolls back everything if any import fails
 *   - Verifies Excel row counts against PostgreSQL row counts
 */

const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const { Client } = require("pg");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const EXCEL_FILE = path.join(
  __dirname,
  "..",
  "data",
  "embrastic.xlsx"
);

// Excel sheet -> PostgreSQL table
const SHEET_TABLE_MAP = {
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
};

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function isBlank(value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
}

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .replace(/[\s_-]+/g, "")
    .toLowerCase();
}

function excelSerialToDate(serial) {
  const parsed = XLSX.SSF.parse_date_code(serial);

  if (!parsed) {
    return null;
  }

  return new Date(
    Date.UTC(
      parsed.y,
      parsed.m - 1,
      parsed.d,
      parsed.H || 0,
      parsed.M || 0,
      Math.floor(parsed.S || 0)
    )
  );
}

function convertDate(value) {
  if (isBlank(value)) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    const result = excelSerialToDate(value);

    if (result) {
      return result;
    }
  }

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  throw new Error(`Invalid date value: ${value}`);
}

function convertNumber(value, integer = false) {
  if (isBlank(value)) {
    return null;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }

    return integer ? Math.trunc(value) : value;
  }

  let cleaned = String(value).trim();

  if (!cleaned) {
    return null;
  }

  // Handle Indian/normal thousands separators and currency formatting.
  cleaned = cleaned
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .replace(/\s+/g, "");

  const number = Number(cleaned);

  if (Number.isNaN(number)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }

  return integer ? Math.trunc(number) : number;
}

function convertJson(value) {
  if (isBlank(value)) {
    return null;
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  try {
    // Validate existing JSON.
    JSON.parse(text);
    return text;
  } catch {
    /*
     * Some legacy Excel cells may contain plain text instead of JSON.
     * Preserve that information as a JSON string rather than throwing it
     * away.
     */
    return JSON.stringify(text);
  }
}

function convertText(value) {
  if (isBlank(value)) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value).trim();
}

function convertValue(value, column) {
  if (isBlank(value)) {
    return null;
  }

  const type = column.data_type;

  switch (type) {
    case "integer":
    case "smallint":
    case "bigint":
      return convertNumber(value, true);

    case "numeric":
    case "decimal":
    case "real":
    case "double precision":
      return convertNumber(value, false);

    case "date":
      return convertDate(value);

    case "timestamp without time zone":
    case "timestamp with time zone":
      return convertDate(value);

    case "json":
    case "jsonb":
      return convertJson(value);

    case "boolean": {
      if (typeof value === "boolean") {
        return value;
      }

      const normalized = String(value).trim().toLowerCase();

      if (
        ["true", "1", "yes", "y", "on"].includes(normalized)
      ) {
        return true;
      }

      if (
        ["false", "0", "no", "n", "off"].includes(normalized)
      ) {
        return false;
      }

      throw new Error(`Invalid boolean value: ${value}`);
    }

    default:
      return convertText(value);
  }
}

async function getDatabaseSchema(client) {
  const result = await client.query(`
    SELECT
      table_name,
      column_name,
      data_type,
      udt_name,
      is_nullable,
      ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name <> 'app_state'
    ORDER BY table_name, ordinal_position
  `);

  const tables = {};

  for (const row of result.rows) {
    if (!tables[row.table_name]) {
      tables[row.table_name] = [];
    }

    tables[row.table_name].push(row);
  }

  return tables;
}

function getExcelRows(workbook, sheetName) {
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json(worksheet, {
    defval: null,
    raw: true,
  });
}

function createHeaderMap(row) {
  const map = new Map();

  for (const header of Object.keys(row || {})) {
    map.set(normalizeHeader(header), header);
  }

  return map;
}

function getExcelValue(row, columnName, headerMap) {
  // Exact match first.
  if (Object.prototype.hasOwnProperty.call(row, columnName)) {
    return row[columnName];
  }

  // Then tolerate harmless differences in spaces/underscores/casing.
  const excelHeader = headerMap.get(normalizeHeader(columnName));

  if (excelHeader !== undefined) {
    return row[excelHeader];
  }

  return undefined;
}

async function tableCount(client, tableName) {
  const result = await client.query(
    `SELECT COUNT(*)::int AS count FROM ${quoteIdentifier(tableName)}`
  );

  return result.rows[0].count;
}

async function importSheet(
  client,
  workbook,
  sheetName,
  tableName,
  dbColumns
) {
  const rows = getExcelRows(workbook, sheetName);

  console.log("");
  console.log(`--------------------------------------------------`);
  console.log(`${sheetName} -> ${tableName}`);
  console.log(`Excel rows: ${rows.length}`);

  if (!dbColumns || dbColumns.length === 0) {
    throw new Error(
      `PostgreSQL table "${tableName}" does not exist or has no columns.`
    );
  }

  if (rows.length === 0) {
    console.log("No Excel rows. Skipping.");
    return {
      sheetName,
      tableName,
      excelRows: 0,
      insertedRows: 0,
    };
  }

  const headerMap = createHeaderMap(rows[0]);

  const usableColumns = dbColumns.filter((column) =>
    headerMap.has(normalizeHeader(column.column_name))
  );

  if (usableColumns.length === 0) {
    throw new Error(
      `No matching columns found between sheet "${sheetName}" and table "${tableName}".`
    );
  }

  const idColumn = dbColumns.find(
    (column) => column.column_name === "id"
  );

  if (
    idColumn &&
    !headerMap.has(normalizeHeader("id"))
  ) {
    throw new Error(
      `Sheet "${sheetName}" does not contain an id column. Import stopped to prevent generating different IDs.`
    );
  }

  const columnNames = usableColumns.map(
    (column) => column.column_name
  );

  const quotedColumns = columnNames
    .map(quoteIdentifier)
    .join(", ");

  let inserted = 0;

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const rowHeaderMap = createHeaderMap(row);

    const values = usableColumns.map((column) => {
      const rawValue = getExcelValue(
        row,
        column.column_name,
        rowHeaderMap
      );

      try {
        return convertValue(rawValue, column);
      } catch (error) {
        throw new Error(
          `${sheetName} row ${index + 2}, column "${column.column_name}": ${error.message}`
        );
      }
    });

    // Completely empty rows should not be inserted.
    if (values.every((value) => value === null)) {
      continue;
    }

    const idIndex = columnNames.indexOf("id");

    if (
      idIndex >= 0 &&
      (values[idIndex] === null ||
        String(values[idIndex]).trim() === "")
    ) {
      throw new Error(
        `${sheetName} row ${index + 2}: missing required id`
      );
    }

    const placeholders = values
      .map((_, i) => `$${i + 1}`)
      .join(", ");

    /*
     * ON CONFLICT ("id") DO UPDATE makes the importer rerunnable.
     * Existing rows with the same ID are refreshed from Excel rather
     * than duplicated.
     */
    let conflictSql = "";

    if (columnNames.includes("id")) {
      const updateColumns = columnNames.filter(
        (name) => name !== "id"
      );

      if (updateColumns.length > 0) {
        conflictSql = `
          ON CONFLICT ("id") DO UPDATE SET
          ${updateColumns
            .map(
              (name) =>
                `${quoteIdentifier(name)} = EXCLUDED.${quoteIdentifier(name)}`
            )
            .join(", ")}
        `;
      } else {
        conflictSql = `ON CONFLICT ("id") DO NOTHING`;
      }
    }

    const sql = `
      INSERT INTO ${quoteIdentifier(tableName)}
      (${quotedColumns})
      VALUES (${placeholders})
      ${conflictSql}
    `;

    try {
      await client.query(sql, values);
      inserted++;
    } catch (error) {
      const rowId =
        idIndex >= 0 ? values[idIndex] : "(no id)";

      throw new Error(
        `${sheetName} row ${index + 2}, id=${rowId}: ${error.message}`
      );
    }

    if (
      inserted % 250 === 0 ||
      inserted === rows.length
    ) {
      process.stdout.write(
        `\rProcessed ${inserted}/${rows.length}`
      );
    }
  }

  console.log("");

  return {
    sheetName,
    tableName,
    excelRows: rows.length,
    insertedRows: inserted,
  };
}

async function main() {
  console.log("");
  console.log("==============================================");
  console.log(" EMBRASTIC Excel -> PostgreSQL Migration");
  console.log("==============================================");
  console.log("");

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is missing from .env"
    );
  }

  if (!fs.existsSync(EXCEL_FILE)) {
    throw new Error(
      `Excel database not found:\n${EXCEL_FILE}`
    );
  }

  console.log(`Excel source: ${EXCEL_FILE}`);
  console.log("PostgreSQL: DATABASE_URL from .env");
  console.log("");
  console.log("app_state will NOT be touched.");

  const workbook = XLSX.readFile(EXCEL_FILE, {
    cellDates: true,
  });

  console.log("");
  console.log(
    `Workbook sheets (${workbook.SheetNames.length}):`
  );
  console.log(workbook.SheetNames.join(", "));

  const expectedSheets = Object.keys(SHEET_TABLE_MAP);

  const missingSheets = expectedSheets.filter(
    (sheet) => !workbook.SheetNames.includes(sheet)
  );

  if (missingSheets.length > 0) {
    console.log("");
    console.log(
      `WARNING: Missing sheets: ${missingSheets.join(", ")}`
    );
    console.log(
      "Those tables will remain unchanged/empty."
    );
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    const dbName = await client.query(
      "SELECT current_database() AS db, current_user AS usr"
    );

    console.log("");
    console.log(
      `Connected to database: ${dbName.rows[0].db}`
    );
    console.log(
      `Connected as user: ${dbName.rows[0].usr}`
    );

    if (dbName.rows[0].db !== "embrastic") {
      throw new Error(
        `Safety stop: DATABASE_URL points to "${dbName.rows[0].db}", not "embrastic".`
      );
    }

    const dbSchema = await getDatabaseSchema(client);

    console.log("");
    console.log("Beginning transaction...");
    await client.query("BEGIN");

    const results = [];

    /*
     * Import order puts the master/reference tables first.
     * There are currently no hard FK constraints requiring this,
     * but this ordering is safer for future schema evolution.
     */
    const importOrder = [
      "Customers",
      "CustomerAccounts",
      "ProductCategories",
      "PriceMaster",
      "Products",
      "Suppliers",
      "Inventory",
      "Quotations",
      "Orders",
      "Artwork",
      "Digitizing",
      "WorkOrders",
      "Production",
      "QualityControl",
      "Dispatch",
      "Invoices",
      "Payments",
      "PurchaseOrders",
      "SupplierBills",
      "SupplierPayments",
      "InventoryTransactions",
      "Expenses",
      "ReturnsRework",
      "Settings",
    ];

    for (const sheetName of importOrder) {
      const tableName = SHEET_TABLE_MAP[sheetName];

      if (!workbook.Sheets[sheetName]) {
        continue;
      }

      const result = await importSheet(
        client,
        workbook,
        sheetName,
        tableName,
        dbSchema[tableName]
      );

      results.push(result);
    }

    console.log("");
    console.log("==============================================");
    console.log(" Verification");
    console.log("==============================================");

    let verificationFailed = false;

    for (const result of results) {
      const pgRows = await tableCount(
        client,
        result.tableName
      );

      const matches =
        result.excelRows === pgRows;

      if (!matches) {
        verificationFailed = true;
      }

      console.log(
        `${result.tableName.padEnd(24)} Excel: ${String(
          result.excelRows
        ).padStart(6)} | PostgreSQL: ${String(
          pgRows
        ).padStart(6)} | ${matches ? "OK" : "MISMATCH"}`
      );
    }

    if (verificationFailed) {
      throw new Error(
        "Row-count verification failed. Transaction will be rolled back."
      );
    }

    // Explicitly prove app_state still exists.
    const appStateCheck = await client.query(`
      SELECT COUNT(*)::int AS count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'app_state'
    `);

    if (appStateCheck.rows[0].count !== 1) {
      throw new Error(
        "Safety check failed: app_state table is missing."
      );
    }

    console.log("");
    console.log("All row counts match.");
    console.log("app_state is still present.");
    console.log("");
    console.log("Committing transaction...");

    await client.query("COMMIT");

    console.log("");
    console.log("==============================================");
    console.log(" MIGRATION SUCCESSFUL");
    console.log("==============================================");
    console.log("");
    console.log(
      "Excel data has been copied to PostgreSQL."
    );
    console.log(
      "The Excel workbook has NOT been modified."
    );
    console.log(
      "Do not delete embrastic.xlsx yet."
    );
    console.log("");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback error.
    }

    console.error("");
    console.error("==============================================");
    console.error(" MIGRATION FAILED - ROLLED BACK");
    console.error("==============================================");
    console.error("");
    console.error(error.message);
    console.error("");

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("");
  console.error("Fatal migration error:");
  console.error(error);
  process.exit(1);
});
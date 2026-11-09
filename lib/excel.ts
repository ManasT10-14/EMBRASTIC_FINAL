import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";

const DATA_DIR = path.join(
  process.cwd(),
  "data"
);

const EXCEL_FILE = path.join(
  DATA_DIR,
  "embrastic.xlsx"
);

const TEMP_FILE = path.join(
  DATA_DIR,
  "embrastic.tmp.xlsx"
);

/*
 * ============================================================
 * IN-MEMORY CACHE
 * ============================================================
 */

let cachedWorkbook:
  ExcelJS.Workbook | null =
  null;

let cachedMtimeMs = 0;

/*
 * ============================================================
 * SERIALIZED EXCEL QUEUE
 * ============================================================
 *
 * Prevents concurrent writes/read-modify-writes from
 * corrupting the XLSX file.
 */

let excelQueue:
  Promise<unknown> =
  Promise.resolve();

export async function withExcelLock<T>(
  task: () => Promise<T>
): Promise<T> {
  const next =
    excelQueue.then(
      task,
      task
    );

  excelQueue =
    next.then(
      () => undefined,
      () => undefined
    );

  return next;
}

/*
 * ============================================================
 * FILE STATE
 * ============================================================
 */

async function getFileMtime() {
  try {
    const stat =
      await fs.promises.stat(
        EXCEL_FILE
      );

    return stat.mtimeMs;
  } catch {
    return 0;
  }
}

/*
 * ============================================================
 * LOAD WORKBOOK
 * ============================================================
 *
 * Main optimization:
 *
 * - first request reads the XLSX file
 * - later requests reuse the cached workbook
 * - if the file changes outside the app, cache reloads
 */

export async function getWorkbook() {
  await fs.promises.mkdir(
    DATA_DIR,
    {
      recursive: true,
    }
  );

  const currentMtime =
    await getFileMtime();

  /*
   * Reuse cache when file has
   * not changed externally.
   */
  if (
    cachedWorkbook &&
    cachedMtimeMs ===
      currentMtime
  ) {
    return cachedWorkbook;
  }

  const workbook =
    new ExcelJS.Workbook();

  if (
    fs.existsSync(
      EXCEL_FILE
    )
  ) {
    const stat =
      await fs.promises.stat(
        EXCEL_FILE
      );

    if (
      stat.size > 0
    ) {
      await workbook.xlsx.readFile(
        EXCEL_FILE
      );
    }
  }

  cachedWorkbook =
    workbook;

  cachedMtimeMs =
    currentMtime;

  return workbook;
}

/*
 * ============================================================
 * SAVE WORKBOOK
 * ============================================================
 */

export async function saveWorkbook(
  workbook: ExcelJS.Workbook
) {
  await fs.promises.mkdir(
    DATA_DIR,
    {
      recursive: true,
    }
  );

  /*
   * Remove stale temp file if needed.
   */
  if (
    fs.existsSync(
      TEMP_FILE
    )
  ) {
    try {
      await fs.promises.unlink(
        TEMP_FILE
      );
    } catch {
      // continue
    }
  }

  /*
   * Write temp first.
   */
  await workbook.xlsx.writeFile(
    TEMP_FILE
  );

  /*
   * Replace main workbook.
   */
  if (
    fs.existsSync(
      EXCEL_FILE
    )
  ) {
    await fs.promises.unlink(
      EXCEL_FILE
    );
  }

  await fs.promises.rename(
    TEMP_FILE,
    EXCEL_FILE
  );

  /*
   * Update cache immediately.
   */
  cachedWorkbook =
    workbook;

  cachedMtimeMs =
    await getFileMtime();
}

/*
 * ============================================================
 * INVALIDATE CACHE
 * ============================================================
 *
 * Useful if you manually edit the workbook externally.
 */

export function invalidateWorkbookCache() {
  cachedWorkbook = null;
  cachedMtimeMs = 0;
}

/*
 * ============================================================
 * SHEET HELPERS
 * ============================================================
 */

export async function getOrCreateSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  headers: string[]
) {
  let sheet =
    workbook.getWorksheet(
      sheetName
    );

  let created = false;

  if (!sheet) {
    sheet =
      workbook.addWorksheet(
        sheetName
      );

    sheet.addRow(
      headers
    );

    sheet.getRow(
      1
    ).font = {
      bold: true,
    };

    sheet.views = [
      {
        state: "frozen",
        ySplit: 1,
      },
    ];

    created = true;
  }

  return {
    sheet,
    created,
  };
}
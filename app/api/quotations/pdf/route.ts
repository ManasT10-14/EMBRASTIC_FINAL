import { NextRequest, NextResponse } from "next/server";
import {
  PDFDocument,
  PDFPage,
  PDFFont,
  StandardFonts,
  rgb,
} from "pdf-lib";
import fs from "node:fs/promises";
import path from "node:path";

/* =========================================================
   TYPES
========================================================= */

type PdfCustomer = {
  id?: string;
  customerCode?: string;

  name?: string;
  businessName?: string;
  contactPerson?: string;

  phone?: string;
  email?: string;
  gstNumber?: string;

  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;

  paymentTermsDays?: number;
  priceCategory?: string;
};

type PdfQuotationItem = {
  id?: string;

  service?: string;
  description?: string;

  quantity?: number;
  unit?: string;
  rate?: number;

  placement?: string;
  size?: string;
  threadType?: string;

  notes?: string;
};

type PdfQuotation = {
  id?: string;

  quotationNumber?: string;

  customer?: string;
  customerId?: string;

  date?: string;
  validUntil?: string;

  items?: PdfQuotationItem[] | string;

  discount?: number;
  gstPercent?: number;

  notes?: string;

  status?: string;
  createdAt?: string;
};

type RequestBody = {
  quotation?: PdfQuotation;
  customer?: PdfCustomer;
};

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN_LEFT = 42;
const MARGIN_RIGHT = 42;

const CONTENT_WIDTH =
  PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

const DARK = rgb(0.08, 0.12, 0.2);
const BLUE = rgb(0.08, 0.3, 0.65);
const LIGHT_BLUE = rgb(0.93, 0.96, 1);
const GRAY = rgb(0.42, 0.46, 0.52);
const LIGHT_GRAY = rgb(0.94, 0.95, 0.97);
const BORDER = rgb(0.84, 0.86, 0.9);
const WHITE = rgb(1, 1, 1);
const GREEN = rgb(0.08, 0.48, 0.25);

/* =========================================================
   HELPERS
========================================================= */

function text(value: unknown): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

function numberValue(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function money(value: unknown): string {
  const amount =
    numberValue(value);

  return `INR ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function safeFilename(
  value: string
): string {
  return (
    value
      .replace(
        /[<>:"/\\|?*\x00-\x1F]/g,
        "-"
      )
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") ||
    "quotation"
  );
}

function parseItems(
  value: PdfQuotation["items"]
): PdfQuotationItem[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    try {
      const parsed =
        JSON.parse(value);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

function formatDate(
  value?: string
): string {
  if (!value) {
    return "—";
  }

  const raw =
    value.split("T")[0];

  const parts =
    raw.split("-");

  if (parts.length !== 3) {
    return value;
  }

  const [
    year,
    month,
    day,
  ] = parts;

  return `${day}-${month}-${year}`;
}

function sanitizePdfText(
  value: unknown
): string {
  return text(value)
    .replace(/₹/g, "INR ")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, "-")
    .replace(/\u00a0/g, " ");
}

function wrapText(
  value: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const clean =
    sanitizePdfText(value);

  if (!clean) {
    return [""];
  }

  const paragraphs =
    clean.split(/\r?\n/);

  const output: string[] =
    [];

  for (
    const paragraph of
    paragraphs
  ) {
    const words =
      paragraph.split(/\s+/);

    let line = "";

    for (
      const word of
      words
    ) {
      const candidate =
        line
          ? `${line} ${word}`
          : word;

      if (
        font.widthOfTextAtSize(
          candidate,
          size
        ) <= maxWidth
      ) {
        line = candidate;
        continue;
      }

      if (line) {
        output.push(line);
      }

      if (
        font.widthOfTextAtSize(
          word,
          size
        ) > maxWidth
      ) {
        let chunk = "";

        for (
          const char of
          word
        ) {
          const candidateChunk =
            chunk + char;

          if (
            font.widthOfTextAtSize(
              candidateChunk,
              size
            ) <= maxWidth
          ) {
            chunk =
              candidateChunk;
          } else {
            if (chunk) {
              output.push(
                chunk
              );
            }

            chunk = char;
          }
        }

        line = chunk;
      } else {
        line = word;
      }
    }

    if (line) {
      output.push(line);
    }

    if (
      paragraph === "" &&
      output.length
    ) {
      output.push("");
    }
  }

  return output.length
    ? output
    : [""];
}

function drawText(
  page: PDFPage,
  value: unknown,
  x: number,
  y: number,
  options: {
    font: PDFFont;
    size?: number;
    color?: ReturnType<typeof rgb>;
    maxWidth?: number;
  }
) {
  const {
    font,
    size = 9,
    color = DARK,
    maxWidth,
  } = options;

  let valueText =
    sanitizePdfText(value);

  if (
    maxWidth &&
    font.widthOfTextAtSize(
      valueText,
      size
    ) > maxWidth
  ) {
    while (
      valueText.length > 1 &&
      font.widthOfTextAtSize(
        `${valueText}...`,
        size
      ) > maxWidth
    ) {
      valueText =
        valueText.slice(
          0,
          -1
        );
    }

    valueText += "...";
  }

  page.drawText(
    valueText,
    {
      x,
      y,
      size,
      font,
      color,
    }
  );
}

function drawRightText(
  page: PDFPage,
  value: unknown,
  rightX: number,
  y: number,
  options: {
    font: PDFFont;
    size?: number;
    color?: ReturnType<typeof rgb>;
  }
) {
  const {
    font,
    size = 9,
    color = DARK,
  } = options;

  const valueText =
    sanitizePdfText(value);

  const width =
    font.widthOfTextAtSize(
      valueText,
      size
    );

  page.drawText(
    valueText,
    {
      x:
        rightX -
        width,

      y,

      size,
      font,
      color,
    }
  );
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      (await request.json()) as RequestBody;

    const quotation =
      body?.quotation;

    const customer =
      body?.customer;

    if (!quotation) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Quotation data is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!customer) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Customer data is required.",
        },
        {
          status: 400,
        }
      );
    }

    const quotationNumber =
      text(
        quotation.quotationNumber
      ) || "QUOTATION";

    const items =
      parseItems(
        quotation.items
      );

    if (
      items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "This quotation has no service lines to print.",
        },
        {
          status: 400,
        }
      );
    }

    const subtotal =
      items.reduce(
        (
          total,
          item
        ) =>
          total +
          numberValue(
            item.quantity
          ) *
            numberValue(
              item.rate
            ),
        0
      );

    const discount =
      numberValue(
        quotation.discount
      );

    const taxableAmount =
      Math.max(
        subtotal -
          discount,
        0
      );

    const gstPercent =
      numberValue(
        quotation.gstPercent
      );

    const gstAmount =
      taxableAmount *
      gstPercent /
      100;

    const grandTotal =
      taxableAmount +
      gstAmount;

    /* =====================================================
       CREATE PDF
    ===================================================== */

    const pdf =
      await PDFDocument.create();

    const regular =
      await pdf.embedFont(
        StandardFonts.Helvetica
      );

    const bold =
      await pdf.embedFont(
        StandardFonts.HelveticaBold
      );

    let page =
      pdf.addPage([
        PAGE_WIDTH,
        PAGE_HEIGHT,
      ]);

    let y =
      PAGE_HEIGHT - 42;

    /* =====================================================
       OPTIONAL LOGO
    ===================================================== */

    let logoImage:
      Awaited<
        ReturnType<
          typeof pdf.embedJpg
        >
      > | null = null;

    try {
      const logoPath =
        path.join(
          process.cwd(),
          "public",
          "EMBRASTICLogo.jpeg"
        );

      const logoBytes =
        await fs.readFile(
          logoPath
        );

      logoImage =
        await pdf.embedJpg(
          logoBytes
        );
    } catch (error) {
      console.warn(
        "PDF logo skipped:",
        error
      );
    }

    /* =====================================================
       PAGE HELPERS
    ===================================================== */

    function drawSmallHeader() {
      drawText(
        page,
        "EMBRASTIC",
        MARGIN_LEFT,
        PAGE_HEIGHT - 42,
        {
          font: bold,
          size: 14,
          color: BLUE,
        }
      );

      drawRightText(
        page,
        quotationNumber,
        PAGE_WIDTH -
          MARGIN_RIGHT,
        PAGE_HEIGHT - 42,
        {
          font: bold,
          size: 9,
          color: GRAY,
        }
      );

      page.drawLine({
        start: {
          x: MARGIN_LEFT,
          y:
            PAGE_HEIGHT -
            53,
        },

        end: {
          x:
            PAGE_WIDTH -
            MARGIN_RIGHT,

          y:
            PAGE_HEIGHT -
            53,
        },

        thickness: 0.6,
        color: BORDER,
      });
    }

    function addPage() {
      page =
        pdf.addPage([
          PAGE_WIDTH,
          PAGE_HEIGHT,
        ]);

      drawSmallHeader();

      y =
        PAGE_HEIGHT - 77;
    }

    function ensureSpace(
      height: number
    ) {
      if (
        y - height <
        55
      ) {
        addPage();
      }
    }

    /* =====================================================
       MAIN HEADER
    ===================================================== */

    page.drawRectangle({
      x: 0,

      y:
        PAGE_HEIGHT -
        126,

      width:
        PAGE_WIDTH,

      height: 126,

      color: DARK,
    });

    if (logoImage) {
      page.drawImage(
        logoImage,
        {
          x:
            MARGIN_LEFT,

          y:
            PAGE_HEIGHT -
            100,

          width: 68,
          height: 68,
        }
      );
    }

    const brandX =
      logoImage
        ? MARGIN_LEFT + 84
        : MARGIN_LEFT;

    drawText(
      page,
      "EMBRASTIC",
      brandX,
      PAGE_HEIGHT - 57,
      {
        font: bold,
        size: 24,
        color: WHITE,
      }
    );

    drawText(
      page,
      "STITCHED TO STAND OUT",
      brandX,
      PAGE_HEIGHT - 77,
      {
        font: bold,
        size: 8,
        color:
          rgb(
            0.95,
            0.7,
            0.18
          ),
      }
    );

    drawText(
      page,
      "Custom Embroidery & Apparel",
      brandX,
      PAGE_HEIGHT - 94,
      {
        font: regular,
        size: 8,
        color:
          rgb(
            0.75,
            0.8,
            0.87
          ),
      }
    );

    drawRightText(
      page,
      "QUOTATION",
      PAGE_WIDTH -
        MARGIN_RIGHT,
      PAGE_HEIGHT - 57,
      {
        font: bold,
        size: 22,
        color: WHITE,
      }
    );

    drawRightText(
      page,
      quotationNumber,
      PAGE_WIDTH -
        MARGIN_RIGHT,
      PAGE_HEIGHT - 79,
      {
        font: regular,
        size: 10,
        color: WHITE,
      }
    );

    y =
      PAGE_HEIGHT - 157;

    /* =====================================================
       META INFORMATION
    ===================================================== */

    page.drawRectangle({
      x: MARGIN_LEFT,

      y:
        y - 60,

      width:
        CONTENT_WIDTH,

      height: 60,

      color:
        LIGHT_BLUE,

      borderColor:
        BORDER,

      borderWidth:
        0.7,
    });

    drawText(
      page,
      "QUOTATION DATE",
      MARGIN_LEFT + 14,
      y - 18,
      {
        font: bold,
        size: 7,
        color: GRAY,
      }
    );

    drawText(
      page,
      formatDate(
        quotation.date
      ),
      MARGIN_LEFT + 14,
      y - 38,
      {
        font: bold,
        size: 10,
      }
    );

    drawText(
      page,
      "VALID UNTIL",
      MARGIN_LEFT + 180,
      y - 18,
      {
        font: bold,
        size: 7,
        color: GRAY,
      }
    );

    drawText(
      page,
      formatDate(
        quotation.validUntil
      ),
      MARGIN_LEFT + 180,
      y - 38,
      {
        font: bold,
        size: 10,
      }
    );

    drawText(
      page,
      "STATUS",
      MARGIN_LEFT + 350,
      y - 18,
      {
        font: bold,
        size: 7,
        color: GRAY,
      }
    );

    drawText(
      page,
      quotation.status ||
        "Draft",
      MARGIN_LEFT + 350,
      y - 38,
      {
        font: bold,
        size: 10,

        color:
          quotation.status ===
          "Accepted"
            ? GREEN
            : BLUE,
      }
    );

    y -= 85;

    /* =====================================================
       CUSTOMER
    ===================================================== */

    drawText(
      page,
      "QUOTATION FOR",
      MARGIN_LEFT,
      y,
      {
        font: bold,
        size: 9,
        color: BLUE,
      }
    );

    y -= 22;

    drawText(
      page,
      customer.businessName ||
        customer.name ||
        quotation.customer ||
        "Customer",
      MARGIN_LEFT,
      y,
      {
        font: bold,
        size: 14,
      }
    );

    y -= 19;

    if (
      customer.businessName &&
      customer.name
    ) {
      drawText(
        page,
        customer.name,
        MARGIN_LEFT,
        y,
        {
          font: regular,
          size: 9,
          color: GRAY,
        }
      );

      y -= 14;
    }

    if (
      customer.contactPerson
    ) {
      drawText(
        page,
        `Contact: ${customer.contactPerson}`,
        MARGIN_LEFT,
        y,
        {
          font: regular,
          size: 9,
          color: GRAY,
        }
      );

      y -= 14;
    }

    const contactParts =
      [
        customer.phone,
        customer.email,
      ]
        .filter(Boolean)
        .join(" | ");

    if (
      contactParts
    ) {
      drawText(
        page,
        contactParts,
        MARGIN_LEFT,
        y,
        {
          font: regular,
          size: 9,
          color: GRAY,
        }
      );

      y -= 14;
    }

    if (
      customer.gstNumber
    ) {
      drawText(
        page,
        `GSTIN: ${customer.gstNumber}`,
        MARGIN_LEFT,
        y,
        {
          font: regular,
          size: 9,
          color: GRAY,
        }
      );

      y -= 14;
    }

    const address =
      [
        customer.billingAddress,
        customer.billingCity,
        customer.billingState,
        customer.billingPostalCode,
        customer.billingCountry,
      ]
        .filter(Boolean)
        .join(", ");

    if (address) {
      const addressLines =
        wrapText(
          address,
          regular,
          9,
          CONTENT_WIDTH
        );

      for (
        const line of
        addressLines
      ) {
        drawText(
          page,
          line,
          MARGIN_LEFT,
          y,
          {
            font: regular,
            size: 9,
            color: GRAY,
          }
        );

        y -= 13;
      }
    }

    y -= 20;

    /* =====================================================
       SERVICES TABLE
    ===================================================== */

    ensureSpace(85);

    drawText(
      page,
      "SERVICES & PRICING",
      MARGIN_LEFT,
      y,
      {
        font: bold,
        size: 9,
        color: BLUE,
      }
    );

    y -= 18;

    const columns = {
      service: {
        x: MARGIN_LEFT,
        width: 183,
      },

      qty: {
        x:
          MARGIN_LEFT +
          183,

        width: 48,
      },

      unit: {
        x:
          MARGIN_LEFT +
          231,

        width: 66,
      },

      rate: {
        x:
          MARGIN_LEFT +
          297,

        width: 94,
      },

      amount: {
        x:
          MARGIN_LEFT +
          391,

        width:
          CONTENT_WIDTH -
          391,
      },
    };

    function drawTableHeader() {
      page.drawRectangle({
        x: MARGIN_LEFT,

        y:
          y - 27,

        width:
          CONTENT_WIDTH,

        height: 27,

        color: DARK,
      });

      drawText(
        page,
        "SERVICE",
        columns.service.x +
          8,
        y - 17,
        {
          font: bold,
          size: 7,
          color: WHITE,
        }
      );

      drawText(
        page,
        "QTY",
        columns.qty.x +
          8,
        y - 17,
        {
          font: bold,
          size: 7,
          color: WHITE,
        }
      );

      drawText(
        page,
        "UNIT",
        columns.unit.x +
          8,
        y - 17,
        {
          font: bold,
          size: 7,
          color: WHITE,
        }
      );

      drawRightText(
        page,
        "RATE",
        columns.rate.x +
          columns.rate.width -
          8,
        y - 17,
        {
          font: bold,
          size: 7,
          color: WHITE,
        }
      );

      drawRightText(
        page,
        "AMOUNT",
        columns.amount.x +
          columns.amount.width -
          8,
        y - 17,
        {
          font: bold,
          size: 7,
          color: WHITE,
        }
      );

      y -= 27;
    }

    drawTableHeader();

    for (
      let index = 0;
      index <
      items.length;
      index++
    ) {
      const item =
        items[index];

      const service =
        item.service ||
        "Embroidery Service";

      const description =
        item.description ||
        "";

      const details =
        [
          item.placement &&
          item.placement !==
            "Not Applicable"
            ? `Placement: ${item.placement}`
            : "",

          item.size &&
          item.size !==
            "Not Applicable"
            ? `Size: ${item.size}`
            : "",

          item.threadType &&
          item.threadType !==
            "Not Applicable"
            ? `Thread: ${item.threadType}`
            : "",

          item.notes
            ? `Note: ${item.notes}`
            : "",
        ].filter(Boolean);

      const serviceLines =
        wrapText(
          service,
          bold,
          8.5,
          columns.service.width -
            16
        );

      const descriptionLines =
        description
          ? wrapText(
              description,
              regular,
              7.5,
              columns.service.width -
                16
            )
          : [];

      const detailLines =
        details.flatMap(
          (
            detail
          ) =>
            wrapText(
              detail,
              regular,
              7,
              columns.service.width -
                16
            )
        );

      const lineCount =
        Math.max(
          1,
          serviceLines.length +
            descriptionLines.length +
            detailLines.length
        );

      const rowHeight =
        Math.max(
          42,

          14 +
            lineCount *
              10
        );

      if (
        y - rowHeight <
        55
      ) {
        addPage();

        drawTableHeader();
      }

      page.drawRectangle({
        x:
          MARGIN_LEFT,

        y:
          y -
          rowHeight,

        width:
          CONTENT_WIDTH,

        height:
          rowHeight,

        color:
          index % 2 ===
          0
            ? WHITE
            : LIGHT_GRAY,

        borderColor:
          BORDER,

        borderWidth:
          0.45,
      });

      let textY =
        y - 15;

      for (
        const line of
        serviceLines
      ) {
        drawText(
          page,
          line,
          columns.service.x +
            8,
          textY,
          {
            font: bold,
            size: 8.5,
          }
        );

        textY -= 10;
      }

      for (
        const line of
        descriptionLines
      ) {
        drawText(
          page,
          line,
          columns.service.x +
            8,
          textY,
          {
            font: regular,
            size: 7.5,
            color: GRAY,
          }
        );

        textY -= 9;
      }

      for (
        const line of
        detailLines
      ) {
        drawText(
          page,
          line,
          columns.service.x +
            8,
          textY,
          {
            font: regular,
            size: 7,
            color: GRAY,
          }
        );

        textY -= 9;
      }

      const qty =
        numberValue(
          item.quantity
        );

      const rate =
        numberValue(
          item.rate
        );

      const amount =
        qty * rate;

      drawText(
        page,
        qty,
        columns.qty.x +
          8,
        y - 20,
        {
          font: regular,
          size: 8,
        }
      );

      drawText(
        page,
        item.unit ||
          "Pieces",
        columns.unit.x +
          8,
        y - 20,
        {
          font: regular,
          size: 8,
          maxWidth:
            columns.unit.width -
            14,
        }
      );

      drawRightText(
        page,
        money(rate),
        columns.rate.x +
          columns.rate.width -
          8,
        y - 20,
        {
          font: regular,
          size: 8,
        }
      );

      drawRightText(
        page,
        money(amount),
        columns.amount.x +
          columns.amount.width -
          8,
        y - 20,
        {
          font: bold,
          size: 8,
        }
      );

      y -= rowHeight;
    }

    y -= 22;

    /* =====================================================
       TOTALS
    ===================================================== */

    ensureSpace(155);

    const totalsWidth =
      245;

    const totalsX =
      PAGE_WIDTH -
      MARGIN_RIGHT -
      totalsWidth;

    function totalRow(
      label: string,
      value: string,
      strong = false,
      background?:
        ReturnType<
          typeof rgb
        >
    ) {
      const height =
        strong
          ? 34
          : 27;

      if (background) {
        page.drawRectangle({
          x: totalsX,

          y:
            y -
            height,

          width:
            totalsWidth,

          height,

          color:
            background,
        });
      }

      drawText(
        page,
        label,
        totalsX + 10,
        y -
          (
            strong
              ? 22
              : 18
          ),
        {
          font:
            strong
              ? bold
              : regular,

          size:
            strong
              ? 10
              : 8.5,

          color:
            strong
              ? WHITE
              : DARK,
        }
      );

      drawRightText(
        page,
        value,
        totalsX +
          totalsWidth -
          10,
        y -
          (
            strong
              ? 22
              : 18
          ),
        {
          font: bold,

          size:
            strong
              ? 11
              : 8.5,

          color:
            strong
              ? WHITE
              : DARK,
        }
      );

      if (!background) {
        page.drawLine({
          start: {
            x:
              totalsX,

            y:
              y -
              height,
          },

          end: {
            x:
              totalsX +
              totalsWidth,

            y:
              y -
              height,
          },

          thickness:
            0.5,

          color:
            BORDER,
        });
      }

      y -= height;
    }

    totalRow(
      "Subtotal",
      money(
        subtotal
      )
    );

    if (
      discount >
      0
    ) {
      totalRow(
        "Discount",
        `- ${money(
          discount
        )}`
      );
    }

    totalRow(
      "Taxable Amount",
      money(
        taxableAmount
      )
    );

    totalRow(
      `GST (${gstPercent}%)`,
      money(
        gstAmount
      )
    );

    totalRow(
      "TOTAL",
      money(
        grandTotal
      ),
      true,
      BLUE
    );

    y -= 30;

    /* =====================================================
       PAYMENT TERMS
    ===================================================== */

    const paymentTermsDays =
      numberValue(
        customer.paymentTermsDays
      );

    if (
      paymentTermsDays >
      0
    ) {
      ensureSpace(55);

      drawText(
        page,
        "PAYMENT TERMS",
        MARGIN_LEFT,
        y,
        {
          font: bold,
          size: 9,
          color: BLUE,
        }
      );

      y -= 17;

      drawText(
        page,
        `${paymentTermsDays} days`,
        MARGIN_LEFT,
        y,
        {
          font: regular,
          size: 9,
        }
      );

      y -= 25;
    }

    /* =====================================================
       NOTES
    ===================================================== */

    if (
      text(
        quotation.notes
      )
    ) {
      const noteLines =
        wrapText(
          quotation.notes ||
            "",
          regular,
          8.5,
          CONTENT_WIDTH -
            20
        );

      const noteHeight =
        42 +
        noteLines.length *
          11;

      ensureSpace(
        noteHeight
      );

      drawText(
        page,
        "TERMS & NOTES",
        MARGIN_LEFT,
        y,
        {
          font: bold,
          size: 9,
          color: BLUE,
        }
      );

      y -= 17;

      page.drawRectangle({
        x: MARGIN_LEFT,

        y:
          y -
          (
            noteHeight -
            20
          ),

        width:
          CONTENT_WIDTH,

        height:
          noteHeight -
          20,

        color:
          LIGHT_GRAY,

        borderColor:
          BORDER,

        borderWidth:
          0.5,
      });

      let noteY =
        y - 17;

      for (
        const line of
        noteLines
      ) {
        drawText(
          page,
          line,
          MARGIN_LEFT +
            10,
          noteY,
          {
            font: regular,
            size: 8.5,
            color: DARK,
          }
        );

        noteY -= 11;
      }

      y -=
        noteHeight;
    }

    /* =====================================================
       STANDARD TERMS
    ===================================================== */

    ensureSpace(105);

    drawText(
      page,
      "GENERAL TERMS",
      MARGIN_LEFT,
      y,
      {
        font: bold,
        size: 9,
        color: BLUE,
      }
    );

    y -= 18;

    const standardTerms = [
      "Prices are based on the quoted quantity and specifications.",

      "Final embroidery cost may change if the approved artwork, stitch count, size, garment material or embroidery technique changes.",

      "Artwork or sample approval should be completed before bulk production.",

      "Delivery timeline begins after final approval and receipt of required advance or customer-supplied material, where applicable.",

      "Any taxes or statutory charges are applied as shown in this quotation.",
    ];

    for (
      let index = 0;
      index <
      standardTerms.length;
      index++
    ) {
      const lines =
        wrapText(
          `${index + 1}. ${standardTerms[index]}`,
          regular,
          7.5,
          CONTENT_WIDTH
        );

      for (
        const line of
        lines
      ) {
        ensureSpace(
          14
        );

        drawText(
          page,
          line,
          MARGIN_LEFT,
          y,
          {
            font: regular,
            size: 7.5,
            color: GRAY,
          }
        );

        y -= 10;
      }

      y -= 3;
    }

    /* =====================================================
       THANK YOU BOX
    ===================================================== */

    ensureSpace(85);

    y -= 8;

    page.drawRectangle({
      x: MARGIN_LEFT,

      y:
        y -
        58,

      width:
        CONTENT_WIDTH,

      height: 58,

      color:
        LIGHT_BLUE,

      borderColor:
        rgb(
          0.72,
          0.81,
          0.96
        ),

      borderWidth:
        0.7,
    });

    drawText(
      page,
      "Thank you for the opportunity to quote for your embroidery requirements.",
      MARGIN_LEFT + 14,
      y - 22,
      {
        font: bold,
        size: 9,
        color: DARK,
      }
    );

    drawText(
      page,
      "We look forward to creating quality embroidery that helps your brand stand out.",
      MARGIN_LEFT + 14,
      y - 40,
      {
        font: regular,
        size: 8,
        color: GRAY,
      }
    );

    /* =====================================================
       FOOTERS
    ===================================================== */

    const pages =
      pdf.getPages();

    pages.forEach(
      (
        currentPage,
        index
      ) => {
        currentPage.drawLine({
          start: {
            x:
              MARGIN_LEFT,

            y: 36,
          },

          end: {
            x:
              PAGE_WIDTH -
              MARGIN_RIGHT,

            y: 36,
          },

          thickness:
            0.6,

          color:
            BORDER,
        });

        drawText(
          currentPage,
          "EMBRASTIC | Custom Embroidery & Apparel",
          MARGIN_LEFT,
          20,
          {
            font: bold,
            size: 7,
            color: GRAY,
          }
        );

        drawRightText(
          currentPage,
          `Page ${index + 1} of ${pages.length}`,
          PAGE_WIDTH -
            MARGIN_RIGHT,
          20,
          {
            font: regular,
            size: 7,
            color: GRAY,
          }
        );
      }
    );

    /* =====================================================
       CREATE BYTES
    ===================================================== */

    const pdfBytes =
      await pdf.save();

    const fileName =
      `${safeFilename(
        quotationNumber
      )}.pdf`;

    /* =====================================================
       SAVE LOCAL COPY
    ===================================================== */

    const quotationsFolder =
      path.join(
        process.cwd(),
        "storage",
        "quotations"
      );

    await fs.mkdir(
      quotationsFolder,
      {
        recursive: true,
      }
    );

    const filePath =
      path.join(
        quotationsFolder,
        fileName
      );

    await fs.writeFile(
      filePath,
      pdfBytes
    );

    console.log(
      "Quotation PDF saved:",
      filePath
    );

    /* =====================================================
       RETURN PDF TO BROWSER
    ===================================================== */

    return new NextResponse(
      Buffer.from(
        pdfBytes
      ),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="${fileName}"`,

          "Cache-Control":
            "no-store",

          "X-Quotation-Filename":
            fileName,

          "X-Saved-Path":
            `storage/quotations/${fileName}`,
        },
      }
    );
  } catch (error) {
    console.error(
      "Quotation PDF generation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to generate quotation PDF.",
      },
      {
        status: 500,
      }
    );
  }
}
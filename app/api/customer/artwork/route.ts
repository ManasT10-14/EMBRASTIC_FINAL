import { NextRequest, NextResponse } from "next/server";
import {
  mkdir,
  writeFile,
} from "fs/promises";
import path from "path";
import crypto from "crypto";

/* =========================================================
   SETTINGS
========================================================= */

const MAX_FILE_SIZE =
  15 * 1024 * 1024;

const ALLOWED_EXTENSIONS =
  new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".pdf",
    ".svg",
  ]);

const ALLOWED_MIME_TYPES =
  new Set([
    "image/png",
    "image/jpeg",
    "image/svg+xml",
    "application/pdf",
  ]);

/* =========================================================
   HELPERS
========================================================= */

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function safeFilename(
  filename: string
) {
  const extension = path
    .extname(filename)
    .toLowerCase();

  const basename = path
    .basename(
      filename,
      extension
    )
    .replace(
      /[^a-zA-Z0-9_-]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .slice(0, 80);

  return `${
    basename || "artwork"
  }${extension}`;
}

/* =========================================================
   POST - TEMPORARY ARTWORK UPLOAD
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    /* =====================================================
       CUSTOMER SESSION
    ===================================================== */

    const sessionValue =
      clean(
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
            "Please sign in before uploading artwork.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       FORM DATA
    ===================================================== */

    let formData: FormData;

    try {
      formData =
        await request.formData();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "The artwork upload request is invalid.",
        },
        {
          status: 400,
        }
      );
    }

    const value =
      formData.get("file");

    if (
      !(value instanceof File)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select an artwork file.",
        },
        {
          status: 400,
        }
      );
    }

    const file = value;

    /* =====================================================
       FILE VALIDATION
    ===================================================== */

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected artwork file is empty.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Artwork must be 15 MB or smaller.",
        },
        {
          status: 400,
        }
      );
    }

    const extension =
      path
        .extname(file.name)
        .toLowerCase();

    if (
      !ALLOWED_EXTENSIONS.has(
        extension
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please upload a PNG, JPG, JPEG, SVG or PDF file.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Some browsers may provide an
     * empty MIME type.
     *
     * If one is supplied, however,
     * it must be supported.
     */

    if (
      file.type &&
      !ALLOWED_MIME_TYPES.has(
        file.type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected file type is not supported.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       CREATE UPLOAD
    ===================================================== */

    const uploadId =
      crypto.randomUUID();

    const storedName =
      safeFilename(
        file.name
      );

    const relativeDirectory =
      path.join(
        "customer-uploads",
        "temporary",
        uploadId
      );

    const absoluteDirectory =
      path.join(
        process.cwd(),
        "data",
        relativeDirectory
      );

    await mkdir(
      absoluteDirectory,
      {
        recursive: true,
      }
    );

    /* =====================================================
       WRITE ARTWORK FILE
    ===================================================== */

    const bytes =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(bytes);

    const absoluteFilePath =
      path.join(
        absoluteDirectory,
        storedName
      );

    await writeFile(
      absoluteFilePath,
      buffer,
      {
        flag: "wx",
      }
    );

    /* =====================================================
       PRIVATE UPLOAD METADATA

       This file is never sent directly
       to the browser.

       The order API will use it later
       to verify that the upload belongs
       to the customer session placing
       the order.
    ===================================================== */

    const uploadedAt =
      new Date().toISOString();

    const metadata = {
      uploadId,

      sessionValue,

      originalName:
        file.name,

      storedName,

      size:
        file.size,

      type:
        file.type ||
        "application/octet-stream",

      extension,

      status:
        "temporary",

      uploadedAt,
    };

    const metadataPath =
      path.join(
        absoluteDirectory,
        "_upload.json"
      );

    await writeFile(
      metadataPath,
      JSON.stringify(
        metadata,
        null,
        2
      ),
      {
        encoding: "utf8",
        flag: "wx",
      }
    );

    /* =====================================================
       RESPONSE

       Do NOT expose:
       - sessionValue
       - physical filesystem paths
       - _upload.json
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        artwork: {
          uploadId,

          name:
            file.name,

          storedName,

          size:
            file.size,

          type:
            file.type ||
            "application/octet-stream",
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/customer/artwork failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to upload artwork.",
      },
      {
        status: 500,
      }
    );
  }
}
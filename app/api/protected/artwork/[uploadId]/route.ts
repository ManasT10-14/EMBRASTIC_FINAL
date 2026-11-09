import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

/* =========================================================
   RUNTIME
========================================================= */



/* =========================================================
   TYPES
========================================================= */

type UploadMetadata = {
  uploadId: string;

  sessionValue?: string;

  originalName: string;

  storedName: string;

  size: number;

  type: string;

  extension?: string;

  status?: string;

  uploadedAt?: string;
};

/* =========================================================
   HELPERS
========================================================= */

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function safeUploadId(value: unknown) {
  const uploadId = clean(value);

  /*
   * Current upload route creates IDs using:
   *
   * crypto.randomUUID()
   *
   * UUIDs therefore only need:
   * letters, numbers and hyphens.
   *
   * Keeping validation strict prevents path traversal.
   */

  if (
    !uploadId ||
    uploadId.length > 100 ||
    !/^[a-zA-Z0-9-]+$/.test(uploadId)
  ) {
    return "";
  }

  return uploadId;
}

function safeStoredName(value: unknown) {
  const storedName = clean(value);

  if (!storedName) {
    return "";
  }

  /*
   * Metadata was created by our own upload API,
   * but we still refuse directory components.
   */

  if (
    storedName !== path.basename(storedName)
  ) {
    return "";
  }

  if (
    storedName.includes("/") ||
    storedName.includes("\\")
  ) {
    return "";
  }

  return storedName;
}

function safeDownloadName(value: unknown) {
  const originalName =
    clean(value) || "artwork";

  /*
   * Content-Disposition is an HTTP header.
   * Remove characters that could corrupt/inject
   * additional header values.
   */

  return originalName
    .replace(/[\r\n"]/g, "")
    .replace(/[^\x20-\x7E]/g, "_")
    .slice(0, 180);
}

function isBusinessSession(
  request: NextRequest
) {
  /*
   * IMPORTANT:
   *
   * This endpoint sits under /api/protected/...
   *
   * Your application may already protect /protected
   * pages through middleware/session logic.
   *
   * We still check for a likely internal session
   * cookie here rather than exposing artwork as
   * a public endpoint.
   *
   * If your Business OS uses a differently named
   * authentication cookie, we'll connect that exact
   * cookie in the next step.
   */

  const possibleSessionCookies = [
    "embrastic_session",
    "embrastic_admin_session",
    "embrastic_business_session",
    "session",
  ];

  return possibleSessionCookies.some(
    (cookieName) =>
      Boolean(
        clean(
          request.cookies.get(
            cookieName
          )?.value
        )
      )
  );
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      uploadId: string;
    }>;
  }
) {
  try {
    /* =====================================================
       BUSINESS OS AUTHENTICATION
    ===================================================== */

    if (!isBusinessSession(request)) {
      return NextResponse.json(
        {
          success: false,

          message:
            "You must be signed in to Business OS to access customer artwork.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       ROUTE PARAMETER
    ===================================================== */

    const params =
      await context.params;

    const uploadId =
      safeUploadId(
        params.uploadId
      );

    if (!uploadId) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Invalid artwork upload ID.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       UPLOAD DIRECTORY

       Existing upload API stores files at:

       data/
         customer-uploads/
           temporary/
             {uploadId}/
               artwork-file.ext
               _upload.json
    ===================================================== */

    const uploadDirectory =
      path.join(
        process.cwd(),
        "data",
        "customer-uploads",
        "temporary",
        uploadId
      );

    const metadataPath =
      path.join(
        uploadDirectory,
        "_upload.json"
      );

    /* =====================================================
       READ PRIVATE METADATA
    ===================================================== */

    let metadataText: string;

    try {
      metadataText =
        await readFile(
          metadataPath,
          "utf8"
        );
    } catch {
      return NextResponse.json(
        {
          success: false,

          message:
            "Artwork upload could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    let metadata: UploadMetadata;

    try {
      metadata =
        JSON.parse(
          metadataText
        ) as UploadMetadata;
    } catch {
      console.error(
        "Invalid artwork metadata:",
        metadataPath
      );

      return NextResponse.json(
        {
          success: false,

          message:
            "Artwork metadata is invalid.",
        },
        {
          status: 500,
        }
      );
    }

    /* =====================================================
       VERIFY METADATA
    ===================================================== */

    if (
      safeUploadId(
        metadata.uploadId
      ) !== uploadId
    ) {
      console.error(
        "Artwork upload ID mismatch:",
        uploadId
      );

      return NextResponse.json(
        {
          success: false,

          message:
            "Artwork metadata does not match the requested upload.",
        },
        {
          status: 409,
        }
      );
    }

    const storedName =
      safeStoredName(
        metadata.storedName
      );

    if (!storedName) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Artwork filename is invalid.",
        },
        {
          status: 500,
        }
      );
    }

    /* =====================================================
       BUILD FILE PATH
    ===================================================== */

    const artworkPath =
      path.join(
        uploadDirectory,
        storedName
      );

    /*
     * Defense in depth:
     *
     * Confirm resolved file is still inside the
     * upload's own directory.
     */

    const resolvedDirectory =
      path.resolve(
        uploadDirectory
      );

    const resolvedArtwork =
      path.resolve(
        artworkPath
      );

    if (
      !resolvedArtwork.startsWith(
        resolvedDirectory +
          path.sep
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Artwork path is invalid.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VERIFY FILE
    ===================================================== */

    let fileStats;

    try {
      fileStats =
        await stat(
          resolvedArtwork
        );
    } catch {
      return NextResponse.json(
        {
          success: false,

          message:
            "Artwork file could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    if (!fileStats.isFile()) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Artwork file is unavailable.",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       READ FILE
    ===================================================== */

    const fileBuffer =
      await readFile(
        resolvedArtwork
      );

    /* =====================================================
       VIEW OR DOWNLOAD

       Default:
       ?download=1  -> attachment
       otherwise    -> inline

       This lets Business OS have separate:
       View Artwork
       Download Artwork
       buttons using the same secure endpoint.
    ===================================================== */

    const download =
      request.nextUrl.searchParams.get(
        "download"
      ) === "1";

    const originalName =
      safeDownloadName(
        metadata.originalName ||
          storedName
      );

    const contentType =
      clean(metadata.type) ||
      "application/octet-stream";

    const disposition =
      download
        ? "attachment"
        : "inline";

    /* =====================================================
       RESPONSE
    ===================================================== */

    return new NextResponse(
      fileBuffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            contentType,

          "Content-Length":
            String(
              fileBuffer.length
            ),

          "Content-Disposition":
            `${disposition}; filename="${originalName}"`,

          /*
           * Artwork is private customer content.
           * Do not allow browsers/proxies to cache it
           * publicly.
           */

          "Cache-Control":
            "private, no-store, max-age=0",

          "X-Content-Type-Options":
            "nosniff",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/protected/artwork/[uploadId] failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to retrieve artwork.",
      },
      {
        status: 500,
      }
    );
  }
}
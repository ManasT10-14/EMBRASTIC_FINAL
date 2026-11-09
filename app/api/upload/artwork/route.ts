import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

function cleanPart(
  value: string
) {
  return value
    .replace(
      /[^a-zA-Z0-9-_]/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^-|-$/g,
      ""
    );
}

function cleanFileName(
  value: string
) {
  const extension =
    path.extname(
      value
    );

  const base =
    path.basename(
      value,
      extension
    );

  const safeBase =
    cleanPart(base) ||
    "artwork";

  const safeExtension =
    extension
      .replace(
        /[^a-zA-Z0-9.]/g,
        ""
      )
      .toLowerCase();

  return `${safeBase}${safeExtension}`;
}

export async function POST(
  request: Request
) {
  try {
    const formData =
      await request.formData();

    const file =
      formData.get(
        "file"
      );

    const orderNumber =
      String(
        formData.get(
          "orderNumber"
        ) || ""
      );

    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Artwork file is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      file.size === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected artwork file is empty.",
        },
        {
          status: 400,
        }
      );
    }

    const maxSize =
      20 * 1024 * 1024;

    if (
      file.size >
      maxSize
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Artwork file must be 20 MB or smaller.",
        },
        {
          status: 400,
        }
      );
    }

    const allowedExtensions =
      new Set([
        ".pdf",
        ".png",
        ".jpg",
        ".jpeg",
        ".svg",
        ".ai",
        ".eps",
        ".psd",
        ".cdr",
        ".webp",
      ]);

    const originalName =
      file.name ||
      "artwork";

    const extension =
      path
        .extname(
          originalName
        )
        .toLowerCase();

    if (
      !allowedExtensions.has(
        extension
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unsupported artwork file type.",
        },
        {
          status: 400,
        }
      );
    }

    const uploadsDirectory =
      path.join(
        process.cwd(),
        "public",
        "uploads",
        "artwork"
      );

    await fs.promises.mkdir(
      uploadsDirectory,
      {
        recursive: true,
      }
    );

    const safeOrder =
      cleanPart(
        orderNumber
      ) || "NO-ORDER";

    const safeOriginal =
      cleanFileName(
        originalName
      );

    const timestamp =
      Date.now();

    const storedFileName =
      `${safeOrder}-${timestamp}-${safeOriginal}`;

    const absolutePath =
      path.join(
        uploadsDirectory,
        storedFileName
      );

    const bytes =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(
        bytes
      );

    await fs.promises.writeFile(
      absolutePath,
      buffer
    );

    const publicPath =
      `/uploads/artwork/${storedFileName}`;

    return NextResponse.json({
      success: true,

      fileName:
        storedFileName,

      originalName,

      filePath:
        publicPath,
    });
  } catch (error) {
    console.error(
      "Artwork upload error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to upload artwork file.",

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
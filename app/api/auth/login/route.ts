import {
  NextRequest,
  NextResponse,
} from "next/server";

/* =========================================================
   CONSTANTS
========================================================= */

const COOKIE_NAME =
  "embrastic_session";

const SESSION_MESSAGE =
  "EMBRASTIC_AUTHENTICATED";

/* =========================================================
   BASE64 URL
========================================================= */

function bytesToBase64Url(
  bytes: Uint8Array
) {
  let binary = "";

  for (
    let i = 0;
    i < bytes.length;
    i++
  ) {
    binary +=
      String.fromCharCode(
        bytes[i]
      );
  }

  return btoa(binary)
    .replace(
      /\+/g,
      "-"
    )
    .replace(
      /\//g,
      "_"
    )
    .replace(
      /=+$/g,
      ""
    );
}

/* =========================================================
   CREATE SESSION TOKEN
========================================================= */

async function createSessionToken(
  secret: string
) {
  const encoder =
    new TextEncoder();

  const key =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(
        secret
      ),
      {
        name:
          "HMAC",

        hash:
          "SHA-256",
      },
      false,
      [
        "sign",
      ]
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(
        SESSION_MESSAGE
      )
    );

  return bytesToBase64Url(
    new Uint8Array(
      signature
    )
  );
}

/* =========================================================
   POST LOGIN
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    /*
     * Read credentials server-side only.
     */
const configuredUsername = "admin";
const configuredPassword = "admin123";

    const authSecret =
      process.env
        .AUTH_SECRET
        ?.trim();

    /* =====================================================
       CONFIG CHECK
    ===================================================== */

    if (
      !authSecret
    ) {
      console.error(
        "EMBRASTIC login configuration is incomplete.",
        {
          usernameConfigured:
            Boolean(
              configuredUsername
            ),

          passwordConfigured:
            Boolean(
              configuredPassword
            ),

          secretConfigured:
            Boolean(
              authSecret
            ),
        }
      );

      return NextResponse.json(
        {
          success:
            false,

          message:
            "Login is not configured. Check APP_LOGIN_USERNAME, APP_LOGIN_PASSWORD and AUTH_SECRET in .env.local.",
        },
        {
          status:
            500,
        }
      );
    }

    /* =====================================================
       REQUEST BODY
    ===================================================== */

    let body: any;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid login request.",
        },
        {
          status:
            400,
        }
      );
    }

    const username =
      String(
        body?.username ??
          ""
      ).trim();

    const password =
      String(
        body?.password ??
          ""
      );

    if (
      !username ||
      !password
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Username and password are required.",
        },
        {
          status:
            400,
        }
      );
    }

    /* =====================================================
       CREDENTIAL CHECK
    ===================================================== */

    if (
      username !==
        configuredUsername ||
      password !==
        configuredPassword
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid username or password.",
        },
        {
          status:
            401,
        }
      );
    }

    /* =====================================================
       CREATE SESSION
    ===================================================== */

    const token =
      await createSessionToken(
        authSecret
      );

    const response =
      NextResponse.json({
        success:
          true,

        message:
          "Signed in successfully.",
      });

    response.cookies.set({
      name:
        COOKIE_NAME,

      value:
        token,

      httpOnly:
        true,

      /*
       * localhost normally runs over HTTP.
       */
      secure:
        process.env
          .NODE_ENV ===
        "production",

      sameSite:
        "lax",

      path:
        "/",

      /*
       * 12-hour session.
       */
      maxAge:
        60 *
        60 *
        12,
    });

    return response;
  } catch (
    error
  ) {
    console.error(
      "Login API error:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Unable to sign in. Check the server configuration and try again.",
      },
      {
        status:
          500,
      }
    );
  }
}
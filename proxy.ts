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
   CREATE EXPECTED TOKEN
========================================================= */

async function createExpectedToken(
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
   SAFE TOKEN COMPARISON
========================================================= */

function safeEqual(
  first: string,
  second: string
) {
  if (
    first.length !==
    second.length
  ) {
    return false;
  }

  let result = 0;

  for (
    let i = 0;
    i < first.length;
    i++
  ) {
    result |=
      first.charCodeAt(
        i
      ) ^
      second.charCodeAt(
        i
      );
  }

  return result === 0;
}

/* =========================================================
   PROXY
========================================================= */

export async function proxy(
  request: NextRequest
) {
  const {
    pathname,
  } =
    request.nextUrl;

  /*
   * We only protect /protected routes.
   */
  if (
    !pathname.startsWith(
      "/protected"
    )
  ) {
    return NextResponse.next();
  }

  const secret =
    process.env
      .AUTH_SECRET
      ?.trim();

  /*
   * If auth isn't configured, do not allow a protected
   * page to open accidentally.
   */
  if (!secret) {
    const loginUrl =
      new URL(
        "/login",
        request.url
      );

    loginUrl.searchParams.set(
      "error",
      "configuration"
    );

    return NextResponse.redirect(
      loginUrl
    );
  }

  const sessionCookie =
    request.cookies.get(
      COOKIE_NAME
    )?.value;

  if (
    !sessionCookie
  ) {
    const loginUrl =
      new URL(
        "/login",
        request.url
      );

    return NextResponse.redirect(
      loginUrl
    );
  }

  try {
    const expectedToken =
      await createExpectedToken(
        secret
      );

    if (
      !safeEqual(
        sessionCookie,
        expectedToken
      )
    ) {
      const loginUrl =
        new URL(
          "/login",
          request.url
        );

      const response =
        NextResponse.redirect(
          loginUrl
        );

      /*
       * Remove invalid / old cookie.
       */
      response.cookies.set({
        name:
          COOKIE_NAME,

        value:
          "",

        path:
          "/",

        maxAge:
          0,
      });

      return response;
    }

    return NextResponse.next();
  } catch (
    error
  ) {
    console.error(
      "Authentication proxy error:",
      error
    );

    return NextResponse.redirect(
      new URL(
        "/login",
        request.url
      )
    );
  }
}

/* =========================================================
   MATCH ONLY PROTECTED AREA
========================================================= */

export const config = {
  matcher: [
    "/protected/:path*",
  ],
};
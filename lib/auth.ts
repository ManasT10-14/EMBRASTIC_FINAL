const AUTH_COOKIE_NAME =
  "embrastic_auth";

const TOKEN_LIFETIME_SECONDS =
  60 * 60 * 12;

function textEncoder() {
  return new TextEncoder();
}

function bytesToBase64Url(
  bytes: Uint8Array
) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(
      byte
    );
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function stringToBase64Url(
  value: string
) {
  return bytesToBase64Url(
    textEncoder().encode(value)
  );
}

function base64UrlToString(
  value: string
) {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded =
    base64 +
    "=".repeat(
      (4 - (base64.length % 4)) %
        4
    );

  const binary =
    atob(padded);

  const bytes =
    Uint8Array.from(
      binary,
      (char) =>
        char.charCodeAt(0)
    );

  return new TextDecoder().decode(
    bytes
  );
}

async function getSigningKey() {
  const secret =
    process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not configured."
    );
  }

  return crypto.subtle.importKey(
    "raw",
    textEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    [
      "sign",
      "verify",
    ]
  );
}

async function sign(
  value: string
) {
  const key =
    await getSigningKey();

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      textEncoder().encode(value)
    );

  return bytesToBase64Url(
    new Uint8Array(signature)
  );
}

export async function createAuthToken(
  username: string
) {
  const payload = {
    username,

    expires:
      Math.floor(
        Date.now() / 1000
      ) +
      TOKEN_LIFETIME_SECONDS,
  };

  const encoded =
    stringToBase64Url(
      JSON.stringify(payload)
    );

  const signature =
    await sign(encoded);

  return `${encoded}.${signature}`;
}

export async function verifyAuthToken(
  token?: string | null
) {
  try {
    if (!token) {
      return false;
    }

    const [
      encoded,
      signature,
    ] =
      token.split(".");

    if (
      !encoded ||
      !signature
    ) {
      return false;
    }

    const key =
      await getSigningKey();

    const expected =
      await crypto.subtle.sign(
        "HMAC",
        key,
        textEncoder().encode(
          encoded
        )
      );

    const expectedText =
      bytesToBase64Url(
        new Uint8Array(
          expected
        )
      );

    if (
      expectedText !==
      signature
    ) {
      return false;
    }

    const payload =
      JSON.parse(
        base64UrlToString(
          encoded
        )
      );

    if (
      !payload.expires ||
      payload.expires <
        Math.floor(
          Date.now() / 1000
        )
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export {
  AUTH_COOKIE_NAME,
  TOKEN_LIFETIME_SECONDS,
};
export function generateId() {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .substring(
      2,
      10
    )}`;
}

export function today() {
  return new Date()
    .toISOString()
    .split(
      "T"
    )[0];
}

export function safeNumber(
  value: unknown,
  fallback = 0
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : fallback;
}

export function parseJsonArray<
  T
>(
  value: unknown
): T[] {
  if (
    Array.isArray(
      value
    )
  ) {
    return value as T[];
  }

  if (
    typeof value !==
    "string" ||
    !value.trim()
  ) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(
        value
      );

    return Array.isArray(
      parsed
    )
      ? parsed
      : [];
  } catch {
    return [];
  }
}

async function parseResponse(
  response: Response
) {
  const text =
    await response.text();

  let data: any;

  try {
    data =
      JSON.parse(
        text
      );
  } catch {
    throw new Error(
      `Server returned invalid JSON (${response.status}).`
    );
  }

  if (
    !response.ok ||
    !data.success
  ) {
    throw new Error(
      data.message ||
        "Excel request failed."
    );
  }

  return data;
}

export async function loadSheet<
  T
>(
  sheet: string
): Promise<T[]> {
  const response =
    await fetch(
      `/api/excel?sheet=${encodeURIComponent(
        sheet
      )}`,
      {
        cache:
          "no-store",
      }
    );

  const data =
    await parseResponse(
      response
    );

  return (
    data.rows || []
  ) as T[];
}

export async function addRecord(
  sheet: string,
  record: Record<
    string,
    unknown
  >
) {
  const response =
    await fetch(
      "/api/excel",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            {
              action:
                "add",
              sheet,
              record,
            }
          ),
      }
    );

  return parseResponse(
    response
  );
}

export async function updateRecord(
  sheet: string,
  id: string,
  record: Record<
    string,
    unknown
  >
) {
  const response =
    await fetch(
      "/api/excel",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            {
              action:
                "update",
              sheet,
              id,
              record,
            }
          ),
      }
    );

  return parseResponse(
    response
  );
}

export async function deleteRecord(
  sheet: string,
  id: string
) {
  const response =
    await fetch(
      "/api/excel",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            {
              action:
                "delete",
              sheet,
              id,
            }
          ),
      }
    );

  return parseResponse(
    response
  );
}

export async function nextNumber(
  sheet: string,
  field: string,
  prefix: string
) {
  const response =
    await fetch(
      "/api/excel",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            {
              action:
                "nextNumber",
              sheet,
              field,
              prefix,
            }
          ),
      }
    );

  const data =
    await parseResponse(
      response
    );

  return String(
    data.value
  );
}
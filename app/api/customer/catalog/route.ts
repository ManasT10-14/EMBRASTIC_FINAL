import { NextRequest, NextResponse } from "next/server";

/* =========================================================
   TYPES
========================================================= */

type ExcelRow = Record<string, any>;

type PublicCategory = {
  id: string;
  categoryCode: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  featured: boolean;
};

type PublicProduct = {
  id: string;

  productCode: string;
  sku: string;

  name: string;
  slug: string;

  categoryId: string;
  categoryName: string;
  categorySlug: string;

  productType: string;
  garmentType: string;

  shortDescription: string;
  description: string;

  primaryImage: string;
  additionalImages: string[];

  badge: string;

  featured: boolean;
  newArrival: boolean;
  allowCustomisation: boolean;

  availableColours: string[];
  availableSizes: string[];

  displayOrder: number;

  price: {
    sellingPrice: number;
    originalPrice: number | null;
    gstPercent: number;
    unit: string;
    priceMasterSku: string;
  };
};

/* =========================================================
   HELPERS
========================================================= */

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalize(value: unknown) {
  return clean(value).toLowerCase();
}

function numberValue(value: unknown) {
  const parsed = Number(
    clean(value)
      .replace(/,/g, "")
      .replace(/[₹%]/g, "")
  );

  return Number.isFinite(parsed) ? parsed : 0;
}

function yes(value: unknown) {
  const text = normalize(value);

  return (
    text === "yes" ||
    text === "true" ||
    text === "1"
  );
}

function active(value: unknown) {
  const text = normalize(value);

  return !text || text === "active";
}

function splitList(value: unknown) {
  const text = clean(value);

  if (!text) {
    return [];
  }

  /*
   * This lets Excel store lists as:
   *
   * Black, White, Navy
   *
   * or:
   *
   * ["Black","White","Navy"]
   */

  if (
    text.startsWith("[") &&
    text.endsWith("]")
  ) {
    try {
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => clean(item))
          .filter(Boolean);
      }
    } catch {
      // Fall back to comma-separated values.
    }
  }

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/* =========================================================
   READ EXCEL SHEET

   IMPORTANT:
   This is server-side.

   The customer browser calls /api/customer/catalog.
   It does NOT need to call PriceMaster directly.
========================================================= */

async function readSheet(
  request: NextRequest,
  sheet: string
): Promise<ExcelRow[]> {
  const url = new URL("/api/excel", request.url);

  url.searchParams.set("sheet", sheet);

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `Invalid response while reading ${sheet}.`
    );
  }

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message ||
        `Unable to read ${sheet}.`
    );
  }

  return Array.isArray(data.rows)
    ? data.rows
    : [];
}

/* =========================================================
   EFFECTIVE DATE CHECK
========================================================= */

function priceIsCurrentlyEffective(
  price: ExcelRow
) {
  const now = new Date();

  const effectiveFrom = clean(
    price.effectiveFrom
  );

  const effectiveTo = clean(
    price.effectiveTo
  );

  if (effectiveFrom) {
    const fromDate =
      new Date(effectiveFrom);

    if (
      !Number.isNaN(
        fromDate.getTime()
      ) &&
      now < fromDate
    ) {
      return false;
    }
  }

  if (effectiveTo) {
    const toDate =
      new Date(effectiveTo);

    if (
      !Number.isNaN(
        toDate.getTime()
      )
    ) {
      /*
       * If Excel only contains a date such as
       * 2026-09-30, keep the price valid through
       * the end of that day.
       */

      if (
        /^\d{4}-\d{2}-\d{2}$/.test(
          effectiveTo
        )
      ) {
        toDate.setHours(
          23,
          59,
          59,
          999
        );
      }

      if (now > toDate) {
        return false;
      }
    }
  }

  return true;
}

/* =========================================================
   FIND PRICE MASTER RECORD

   Stable relationship:
   Products.priceMasterId
             ↓
   PriceMaster.id

   SKU is used only as a fallback for older records.
========================================================= */

function findPriceMasterRow(
  product: ExcelRow,
  prices: ExcelRow[]
) {
  const priceMasterId = clean(
    product.priceMasterId
  );

  if (priceMasterId) {
    const byId = prices.find(
      (price) =>
        clean(price.id) ===
        priceMasterId
    );

    if (byId) {
      return byId;
    }
  }

  const priceMasterSku = normalize(
    product.priceMasterSku
  );

  if (priceMasterSku) {
    const bySku = prices.find(
      (price) =>
        normalize(price.sku) ===
        priceMasterSku
    );

    if (bySku) {
      return bySku;
    }
  }

  return undefined;
}

/* =========================================================
   GET CUSTOMER CATALOGUE
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    /* =====================================================
       READ BUSINESS DATA
    ====================================================== */

    const [
      categoryRows,
      productRows,
      priceRows,
    ] = await Promise.all([
      readSheet(
        request,
        "ProductCategories"
      ),

      readSheet(
        request,
        "Products"
      ),

      readSheet(
        request,
        "PriceMaster"
      ),
    ]);

    /* =====================================================
       PUBLIC CATEGORIES

       Only Active categories are exposed.
    ====================================================== */

    const categories: PublicCategory[] =
      categoryRows
        .filter((row) =>
          active(row.status)
        )
        .map((row) => ({
          id: clean(row.id),

          categoryCode: clean(
            row.categoryCode
          ),

          name: clean(row.name),

          slug: clean(row.slug),

          description: clean(
            row.description
          ),

          imageUrl: clean(
            row.imageUrl
          ),

          displayOrder: numberValue(
            row.displayOrder
          ),

          featured: yes(
            row.featured
          ),
        }))
        .filter(
          (category) =>
            category.id &&
            category.name
        )
        .sort((a, b) => {
          if (
            a.displayOrder !==
            b.displayOrder
          ) {
            return (
              a.displayOrder -
              b.displayOrder
            );
          }

          return a.name.localeCompare(
            b.name
          );
        });

    /* =====================================================
       CATEGORY LOOKUP
    ====================================================== */

    const categoryById =
      new Map<
        string,
        PublicCategory
      >();

    categories.forEach(
      (category) => {
        categoryById.set(
          category.id,
          category
        );
      }
    );

    /* =====================================================
       VALID PRICES

       We filter BEFORE exposing anything.

       costPrice
       minimumSellingPrice
       notes

       are never included in the customer response.
    ====================================================== */

    const validPrices =
      priceRows.filter(
        (price) =>
          active(price.status) &&
          priceIsCurrentlyEffective(
            price
          )
      );

    /* =====================================================
       PUBLIC PRODUCTS
    ====================================================== */

    const products: PublicProduct[] =
      [];

    for (const row of productRows) {
      /*
       * Product must be Active.
       */

      if (!active(row.status)) {
        continue;
      }

      /*
       * Product must belong to an Active
       * customer-facing category.
       */

      const category =
        categoryById.get(
          clean(row.categoryId)
        );

      if (!category) {
        continue;
      }

      /*
       * Find the linked Price Master row.
       */

      const price =
        findPriceMasterRow(
          row,
          validPrices
        );

      /*
       * A product without a valid selling
       * price should not appear for sale.
       */

      if (!price) {
        continue;
      }

      const sellingPrice =
        numberValue(
          price.sellingPrice
        );

      if (sellingPrice <= 0) {
        continue;
      }

      const originalPrice =
        numberValue(
          row.originalPrice
        );

      products.push({
        id: clean(row.id),

        productCode: clean(
          row.productCode
        ),

        sku:
          clean(row.sku) ||
          clean(price.sku),

        name: clean(row.name),

        slug: clean(row.slug),

        categoryId:
          category.id,

        categoryName:
          category.name,

        categorySlug:
          category.slug,

        productType: clean(
          row.productType
        ),

        garmentType: clean(
          row.garmentType
        ),

        shortDescription: clean(
          row.shortDescription
        ),

        description: clean(
          row.description
        ),

        primaryImage: clean(
          row.primaryImage
        ),

        additionalImages:
          splitList(
            row.additionalImages
          ),

        badge: clean(row.badge),

        featured: yes(
          row.featured
        ),

        newArrival: yes(
          row.newArrival
        ),

        allowCustomisation:
          yes(
            row.allowCustomisation
          ),

        availableColours:
          splitList(
            row.availableColours
          ),

        availableSizes:
          splitList(
            row.availableSizes
          ),

        displayOrder:
          numberValue(
            row.displayOrder
          ),

        price: {
          sellingPrice,

          originalPrice:
            originalPrice >
              sellingPrice
              ? originalPrice
              : null,

          gstPercent:
            numberValue(
              price.gstPercent
            ),

          unit: clean(
            price.unit
          ),

          priceMasterSku:
            clean(price.sku),
        },
      });
    }

    /* =====================================================
       CLEAN INVALID PRODUCTS
    ====================================================== */

    const cleanProducts =
      products
        .filter(
          (product) =>
            product.id &&
            product.name
        )
        .sort((a, b) => {
          if (
            a.displayOrder !==
            b.displayOrder
          ) {
            return (
              a.displayOrder -
              b.displayOrder
            );
          }

          return a.name.localeCompare(
            b.name
          );
        });

    /* =====================================================
       OPTIONAL QUERY FILTERS

       Examples:

       /api/customer/catalog

       /api/customer/catalog?category=anime-lovers

       /api/customer/catalog?featured=true

       /api/customer/catalog?new=true

       /api/customer/catalog?id=PRODUCT_ID
    ====================================================== */

    const searchParams =
      request.nextUrl.searchParams;

    const requestedCategory =
      normalize(
        searchParams.get(
          "category"
        )
      );

    const requestedId =
      clean(
        searchParams.get("id")
      );

    const requestedSlug =
      normalize(
        searchParams.get(
          "slug"
        )
      );

    const featuredOnly =
      normalize(
        searchParams.get(
          "featured"
        )
      ) === "true";

    const newOnly =
      normalize(
        searchParams.get("new")
      ) === "true";

    let filteredProducts =
      cleanProducts;

    if (requestedCategory) {
      filteredProducts =
        filteredProducts.filter(
          (product) =>
            normalize(
              product.categorySlug
            ) ===
              requestedCategory ||
            normalize(
              product.categoryName
            ) ===
              requestedCategory ||
            normalize(
              product.categoryId
            ) ===
              requestedCategory
        );
    }

    if (requestedId) {
      filteredProducts =
        filteredProducts.filter(
          (product) =>
            product.id ===
            requestedId
        );
    }

    if (requestedSlug) {
      filteredProducts =
        filteredProducts.filter(
          (product) =>
            normalize(
              product.slug
            ) ===
            requestedSlug
        );
    }

    if (featuredOnly) {
      filteredProducts =
        filteredProducts.filter(
          (product) =>
            product.featured
        );
    }

    if (newOnly) {
      filteredProducts =
        filteredProducts.filter(
          (product) =>
            product.newArrival
        );
    }

    /* =====================================================
       CATEGORY COUNTS

       Useful for the customer storefront sidebar.
    ====================================================== */

    const categoryCounts =
      categories.reduce<
        Record<string, number>
      >(
        (result, category) => {
          result[category.id] =
            cleanProducts.filter(
              (product) =>
                product.categoryId ===
                category.id
            ).length;

          return result;
        },
        {}
      );

    /* =====================================================
       RESPONSE
    ====================================================== */

    return NextResponse.json({
      success: true,

      categories:
        categories.map(
          (category) => ({
            ...category,

            productCount:
              categoryCounts[
                category.id
              ] || 0,
          })
        ),

      products:
        filteredProducts,

      totalProducts:
        filteredProducts.length,

      totalCategories:
        categories.length,
    });
  } catch (error) {
    console.error(
      "Customer catalogue error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to load customer catalogue.",

        categories: [],
        products: [],
      },
      {
        status: 500,
      }
    );
  }
}
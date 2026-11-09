"use client";
import './globals.css';
import Image from "next/image";
import Link from "next/link";
import { Manrope } from "next/font/google";
import { usePathname } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  Home,
  Info,
  LogOut,
  Menu,
  Package,
  Palette,
  ReceiptText,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";


const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-customer",
});
/* =========================================================
   TYPES
========================================================= */

type CartSize = {
  size: string;
  quantity: number;
};

type CartItem = {
  quantity?: number;
  sizes?: CartSize[];
};

/* =========================================================
   NAVIGATION
========================================================= */

const mainNavigation = [
  {
    label: "Home",
    href: "/customer",
    icon: Home,
  },
  {
    label: "Products",
    href: "/customer/products",
    icon: Shirt,
  },
  {
    label: "My Orders",
    href: "/customer/orders",
    icon: Package,
  },
  {
    label: "Design Approvals",
    href: "/customer/designs",
    icon: Palette,
  },
];

const accountNavigation = [
  {
    label: "About EMBRASTIC",
    href: "/customer/about",
    icon: Info,
  },
  {
    label: "Invoices",
    href: "/customer/invoices",
    icon: ReceiptText,
  },
  {
    label: "Profile",
    href: "/customer/profile",
    icon: UserRound,
  },
];

/* =========================================================
   PAGE
========================================================= */

function CustomerLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
const [customerName, setCustomerName] = useState("");
const [loggingOut, setLoggingOut] = useState(false);

async function handleLogout() {
  if (loggingOut) return;

  try {
    setLoggingOut(true);

    const response = await fetch("/api/customer-auth/logout", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    // Clear customer-side data that should not carry into another login.
    window.localStorage.removeItem("embrastic_cart");

    // Hard navigation ensures the authenticated customer UI is fully reset.
    window.location.href = "/customer/login";
  } catch (error) {
    console.error("Customer logout failed:", error);
    setLoggingOut(false);

    alert("Unable to log out. Please try again.");
  }
}

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [
    accountMenuOpen,
    setAccountMenuOpen,
  ] = useState(false);

  const [
    cartCount,
    setCartCount,
  ] = useState(0);

  /* =======================================================
     ACTIVE ROUTE
  ======================================================= */

  function isActive(
    href: string
  ) {
    if (href === "/customer") {
      return pathname === "/customer";
    }

    return pathname.startsWith(
      href
    );
  }

  /* =======================================================
     CLOSE MENUS ON NAVIGATION
  ======================================================= */

  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  }, [pathname]);
useEffect(() => {
  let cancelled = false;

  async function loadLoggedInCustomer() {
    try {
      const response = await fetch("/api/customer-auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (
        !cancelled &&
        data?.success &&
        data?.customer
      ) {
        const name =
          String(
            data.customer.name ||
            data.customer.contactPerson ||
            data.customer.businessName ||
            ""
          ).trim();

        setCustomerName(name);
      }
    } catch (error) {
      console.error(
        "Unable to load customer name:",
        error
      );
    }
  }

  loadLoggedInCustomer();

  return () => {
    cancelled = true;
  };
}, []);

  /* =======================================================
     CART COUNT
  ======================================================= */

  useEffect(() => {
    function readCart() {
      try {
        const raw =
          window.localStorage.getItem(
            "embrastic_cart"
          );

        if (!raw) {
          setCartCount(0);
          return;
        }

        const parsed =
          JSON.parse(raw);

        const items: CartItem[] =
          Array.isArray(parsed)
            ? parsed
            : Array.isArray(
                  parsed?.items
                )
              ? parsed.items
              : [];

        const total =
          items.reduce(
            (
              sum,
              item
            ) => {
              if (
                Array.isArray(
                  item?.sizes
                ) &&
                item.sizes.length
              ) {
                const sizeTotal =
                  item.sizes.reduce(
                    (
                      sizeSum,
                      size
                    ) =>
                      sizeSum +
                      Math.max(
                        0,
                        Number(
                          size?.quantity ||
                            0
                        )
                      ),
                    0
                  );

                return (
                  sum +
                  sizeTotal
                );
              }

              return (
                sum +
                Math.max(
                  0,
                  Number(
                    item?.quantity ||
                      0
                  )
                )
              );
            },
            0
          );

        setCartCount(total);
      } catch {
        setCartCount(0);
      }
    }

    readCart();

    const handleStorage = () =>
      readCart();

    const handleCartUpdated = () =>
      readCart();

    window.addEventListener(
      "storage",
      handleStorage
    );

    window.addEventListener(
      "embrastic-cart-updated",
      handleCartUpdated
    );

    /*
     * Product pages may currently update localStorage
     * without dispatching a custom event.
     *
     * This small interval keeps the header count in sync
     * while we progressively standardise the cart flow.
     */
    const timer =
      window.setInterval(
        readCart,
        1000
      );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );

      window.removeEventListener(
        "embrastic-cart-updated",
        handleCartUpdated
      );

      window.clearInterval(
        timer
      );
    };
  }, []);

  /* =======================================================
     CHECKOUT MODE
  ======================================================= */

  const isCheckoutFlow =
    useMemo(
      () =>
        pathname.startsWith(
          "/customer/checkout"
        ),
      [pathname]
    );

  return (
    <div
  className={`${manrope.className} min-h-screen bg-[#f7f9fc] pb-[74px] antialiased lg:pb-0`}
>
      {/* =====================================================
          TOP ANNOUNCEMENT
      ====================================================== */}

      {!isCheckoutFlow && (
        <div className="hidden bg-[#07101f] text-white md:block">
          <div className="mx-auto flex h-9 max-w-[1500px] items-center justify-between px-6 lg:px-8">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />

              Custom embroidery &
              branded apparel
            </div>

            <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400">
              <span>
                Artwork approval
                before production
              </span>

              <span className="h-3 w-px bg-white/15" />

              <Link
                href="/customer/orders"
                className="transition hover:text-white"
              >
                Track your order
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,.02)] backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1500px] items-center gap-4 px-4 sm:px-6 lg:h-[82px] lg:px-8">
          {/* =================================================
              BRAND
          ================================================== */}

          <Link
            href="/customer"
            className="flex shrink-0 items-center gap-3"
          >
            <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:h-12 sm:w-12">
              <Image
                src="/EMBRASTICLogo.jpeg"
                alt="EMBRASTIC"
                fill
                priority
                sizes="48px"
                className="object-cover"
              />
            </div>

            <div className="hidden sm:block">
              <div className="text-[17px] font-black leading-none tracking-[0.04em] text-slate-950">
                EMBRASTIC
              </div>

              <div className="mt-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">
                Stitched to Stand
                Out
              </div>
            </div>
          </Link>

          {/* =================================================
              DESKTOP NAVIGATION
          ================================================== */}

          {!isCheckoutFlow && (
            <nav className="ml-5 hidden flex-1 items-center justify-center gap-1 xl:flex">
              {mainNavigation.map(
                (item) => {
                  const active =
                    isActive(
                      item.href
                    );

                  return (
                    <Link
                      key={
                        item.href
                      }
                      href={
                        item.href
                      }
                      className={`relative rounded-xl px-4 py-2.5 text-[13px] font-extrabold transition ${
                        active
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                      }`}
                    >
                      {
                        item.label
                      }

                      {active && (
                        <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-blue-600" />
                      )}
                    </Link>
                  );
                }
              )}

              <Link
                href="/customer/about"
                className={`relative rounded-xl px-4 py-2.5 text-[13px] font-extrabold transition ${
                  isActive(
                    "/customer/about"
                  )
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                About
              </Link>
            </nav>
          )}

          {/* =================================================
              CHECKOUT HEADER MESSAGE
          ================================================== */}

          {isCheckoutFlow && (
            <div className="hidden flex-1 items-center justify-center lg:flex">
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />

                Secure order
                checkout
              </div>
            </div>
          )}

          {/* =================================================
              RIGHT ACTIONS
          ================================================== */}

          <div className="ml-auto flex items-center gap-2">
            {/* START ORDER */}

            {!isCheckoutFlow && (
              <Link
                href="/customer/products"
                className="hidden h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white shadow-[0_8px_25px_rgba(37,99,235,.2)] transition hover:-translate-y-0.5 hover:bg-blue-700 lg:inline-flex"
              >
                <ShoppingBag className="h-4 w-4" />

                Start Order
              </Link>
            )}

            {/* CART */}

            <Link
              href="/customer/cart"
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                isActive(
                  "/customer/cart"
                )
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingCart className="h-[19px] w-[19px]" />

              {cartCount >
                0 && (
                <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 px-1 text-[9px] font-black leading-none text-white">
                  {cartCount >
                  99
                    ? "99+"
                    : cartCount}
                </span>
              )}
            </Link>

            {/* ACCOUNT MENU */}

            {!isCheckoutFlow && (
              <div className="relative hidden lg:block">
                <button
                  type="button"
                  onClick={() =>
                    setAccountMenuOpen(
                      (
                        current
                      ) =>
                        !current
                    )
                  }
                  className={`flex h-11 items-center gap-2 rounded-xl border px-3 transition ${
                    accountMenuOpen ||
                    isActive(
                      "/customer/profile"
                    ) ||
                    isActive(
                      "/customer/invoices"
                    )
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-black uppercase text-white">
  {customerName
    ? customerName.charAt(0)
    : "C"}
                  </div>

<div className="hidden text-left 2xl:block">
  <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
    {customerName ? "Welcome" : "Account"}
  </div>
  <div className="max-w-[120px] truncate text-xs font-black text-slate-900">
    {customerName || "My Account"}
  </div>
</div>

                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className={`h-3.5 w-3.5 transition ${
                      accountMenuOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  >
                    <path
                      d="M5 7.5 10 12.5 15 7.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {accountMenuOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Close account menu"
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() =>
                        setAccountMenuOpen(
                          false
                        )
                      }
                    />

                    <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_25px_70px_rgba(15,23,42,.18)]">
                      <div className="border-b border-slate-100 px-3 pb-3 pt-2">
                        <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                          Customer
                          Account
                        </div>

                        <div className="mt-1 text-sm font-black text-slate-950">
  {customerName
    ? `Welcome, ${customerName}`
    : "EMBRASTIC Portal"}
</div>
                      </div>

                      <div className="pt-2">
                        {accountNavigation.map(
                          (
                            item
                          ) => {
                            const Icon =
                              item.icon;

                            const active =
                              isActive(
                                item.href
                              );

                            return (
                              <Link
                                key={
                                  item.href
                                }
                                href={
                                  item.href
                                }
                                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${
                                  active
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                                }`}
                              >
                                <Icon className="h-4 w-4" />

                                {
                                  item.label
                                }
                              </Link>
                            );
                          }
                        )}
			<div className="mt-2 border-t border-slate-100 pt-2">
  <button
    type="button"
    onClick={handleLogout}
    disabled={loggingOut}
    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
      <LogOut className="h-4 w-4" />
    </div>

    <div>
      <div className="font-extrabold">
        {loggingOut ? "Logging out..." : "Logout"}
      </div>

      <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
        Sign out of your account
      </div>
    </div>
  </button>
</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* MOBILE MENU */}

            {!isCheckoutFlow && (
              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(
                    (
                      current
                    ) =>
                      !current
                  )
                }
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 xl:hidden"
                aria-label={
                  mobileMenuOpen
                    ? "Close menu"
                    : "Open menu"
                }
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* =================================================
            MOBILE / TABLET MENU
        ================================================== */}

        {mobileMenuOpen &&
          !isCheckoutFlow && (
            <div className="border-t border-slate-200 bg-white xl:hidden">
              <div className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6">
                {/* START ORDER */}

                <Link
                  href="/customer/products"
                  className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-100"
                >
                  <ShoppingBag className="h-4 w-4" />

                  Start a New
                  Order
                </Link>

                {/* MAIN */}

                <div className="grid gap-1 sm:grid-cols-2">
                  {mainNavigation.map(
                    (item) => {
                      const Icon =
                        item.icon;

                      const active =
                        isActive(
                          item.href
                        );

                      return (
                        <Link
                          key={
                            item.href
                          }
                          href={
                            item.href
                          }
                          className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition ${
                            active
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                              active
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          {
                            item.label
                          }
                        </Link>
                      );
                    }
                  )}
                </div>

                {/* ACCOUNT */}

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.17em] text-slate-400">
                    More
                  </div>

                  <div className="grid gap-1 sm:grid-cols-2">
  {accountNavigation.map((item) => {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
          active
            ? "bg-blue-50 text-blue-700"
            : "text-slate-600 hover:bg-slate-50"
        }`}
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  })}
</div>

<button
  type="button"
  onClick={handleLogout}
  disabled={loggingOut}
  className="mt-3 flex w-full items-center gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
>
  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm">
    <LogOut className="h-4 w-4" />
  </div>

  <div>
    <div className="font-extrabold">
      {loggingOut ? "Logging out..." : "Logout"}
    </div>

    <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
      Sign out of EMBRASTIC
    </div>
  </div>
</button>
</div>

                {/* CART SUMMARY */}

                <Link
                  href="/customer/cart"
                  className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />

                    <div>
                      <div className="text-sm font-black text-slate-950">
                        Your Cart
                      </div>

                      <div className="text-xs text-slate-500">
                        {cartCount ===
                        1
                          ? "1 item"
                          : `${cartCount} items`}
                      </div>
                    </div>
                  </div>

                  <span className="text-sm font-black text-blue-600">
                    View
                  </span>
                </Link>
              </div>
            </div>
          )}
      </header>

      {/* =====================================================
          PAGE CONTENT
      ====================================================== */}

      <main>
        {children}
      </main>

      {/* =====================================================
          MOBILE BOTTOM NAVIGATION
      ====================================================== */}

      {!isCheckoutFlow && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,.06)] backdrop-blur-xl lg:hidden">
          <div className="grid grid-cols-5">
            <MobileNavItem
              href="/customer"
              label="Home"
              icon={
                <Home className="h-[19px] w-[19px]" />
              }
              active={
                pathname ===
                "/customer"
              }
            />

            <MobileNavItem
              href="/customer/products"
              label="Products"
              icon={
                <Shirt className="h-[19px] w-[19px]" />
              }
              active={pathname.startsWith(
                "/customer/products"
              )}
            />

            <MobileNavItem
              href="/customer/cart"
              label="Cart"
              icon={
                <div className="relative">
                  <ShoppingCart className="h-[19px] w-[19px]" />

                  {cartCount >
                    0 && (
                    <span className="absolute -right-3 -top-2 flex min-h-[17px] min-w-[17px] items-center justify-center rounded-full bg-blue-600 px-1 text-[8px] font-black text-white">
                      {cartCount >
                      99
                        ? "99+"
                        : cartCount}
                    </span>
                  )}
                </div>
              }
              active={pathname.startsWith(
                "/customer/cart"
              )}
              emphasised
            />

            <MobileNavItem
              href="/customer/orders"
              label="Orders"
              icon={
                <Package className="h-[19px] w-[19px]" />
              }
              active={pathname.startsWith(
                "/customer/orders"
              )}
            />

            <MobileNavItem
              href="/customer/profile"
              label="Account"
              icon={
                <UserRound className="h-[19px] w-[19px]" />
              }
              active={
                pathname.startsWith(
                  "/customer/profile"
                ) ||
                pathname.startsWith(
                  "/customer/invoices"
                ) ||
                pathname.startsWith(
                  "/customer/designs"
                )
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MOBILE NAV ITEM
========================================================= */

function MobileNavItem({
  href,
  label,
  icon,
  active,
  emphasised = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  emphasised?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative flex min-h-[72px] flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-extrabold transition ${
        active
          ? "text-blue-600"
          : "text-slate-500"
      }`}
    >
      <span
        className={`flex h-8 min-w-8 items-center justify-center rounded-xl px-1 transition ${
          emphasised
            ? active
              ? "bg-blue-600 text-white shadow-md shadow-blue-200"
              : "bg-slate-950 text-white"
            : active
              ? "bg-blue-50 text-blue-600"
              : ""
        }`}
      >
        {icon}
      </span>

      {label}

      {active &&
        !emphasised && (
          <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-blue-600" />
        )}
    </Link>
  );
}
export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div
          className={`${manrope.className} min-h-screen bg-[#f7f9fc] antialiased`}
        >
          {children}
        </div>
      }
    >
      <CustomerLayoutContent>
        {children}
      </CustomerLayoutContent>
    </Suspense>
  );
}
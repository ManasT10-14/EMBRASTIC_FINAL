"use client";

import {
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

/* =========================================================
   NAVIGATION
========================================================= */

const menu = [
  {
    name: "Dashboard",
    icon: "📊",
    href: "/protected",
  },
  {
    name: "Customers",
    icon: "👥",
    href: "/protected/customers",
  },
  {
    name: "Quotations",
    icon: "📝",
    href: "/protected/quotations",
  },
  {
    name: "Orders",
    icon: "📦",
    href: "/protected/orders",
  },
  {
    name: "Artwork & Designs",
    icon: "🎨",
    href: "/protected/designs",
  },
  {
    name: "Digitizing",
    icon: "🧵",
    href: "/protected/digitizing",
  },
  {
    name: "Production",
    icon: "🪡",
    href: "/protected/production",
  },
  {
    name: "Quality Control",
    icon: "✅",
    href: "/protected/quality-control",
  },
  {
    name: "Dispatch",
    icon: "🚚",
    href: "/protected/dispatch",
  },
  {
    name: "Inventory",
    icon: "📋",
    href: "/protected/inventory",
  },
  {
    name: "Invoices",
    icon: "🧾",
    href: "/protected/invoices",
  },
  {
    name: "Payments",
    icon: "💳",
    href: "/protected/payments",
  },
  {
    name: "Expenses",
    icon: "💰",
    href: "/protected/expenses",
  },
  {
    name: "Reports",
    icon: "📈",
    href: "/protected/reports",
  },
  {
    name: "Settings",
    icon: "⚙️",
    href: "/protected/settings",
  },
];

/* =========================================================
   PAGE TITLE
========================================================= */

function getPageTitle(
  pathname: string
) {
  if (
    pathname === "/protected"
  ) {
    return "Dashboard";
  }

  const item =
    menu.find(
      (
        entry
      ) =>
        entry.href !==
          "/protected" &&
        pathname.startsWith(
          entry.href
        )
    );

  return (
    item?.name ||
    "Dashboard"
  );
}

/* =========================================================
   LAYOUT
========================================================= */

export default function ProtectedLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const [
    open,
    setOpen,
  ] =
    useState(true);

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(false);

  const pageTitle =
    getPageTitle(
      pathname
    );

  function isActive(
    href: string
  ) {
    if (
      href ===
      "/protected"
    ) {
      return (
        pathname ===
        "/protected"
      );
    }

    return pathname.startsWith(
      href
    );
  }

  async function logout() {
    try {
      setLoggingOut(
        true
      );

      const response =
        await fetch(
          "/api/auth/logout",
          {
            method:
              "POST",
          }
        );

      if (
        !response.ok
      ) {
        console.warn(
          "Logout endpoint returned a non-success response."
        );
      }

      router.replace(
        "/login"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      router.replace(
        "/login"
      );

      router.refresh();
    } finally {
      setLoggingOut(
        false
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-800 bg-slate-950 text-white shadow-2xl transition-all duration-300 ${
          open
            ? "w-72"
            : "w-20"
        }`}
      >

        {/* =================================================
            BRAND
        ================================================= */}

        <div className="flex h-24 shrink-0 items-center border-b border-white/10 px-4">

          <div
            className={`flex w-full items-center ${
              open
                ? "justify-between"
                : "justify-center"
            }`}
          >

            {open ? (

              <div className="flex min-w-0 items-center gap-3">

                {/* LOGO */}

                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-white shadow-lg">

                  <Image
                    src="/EMBRASTICLogo.jpeg"
                    alt="EMBRASTIC Logo"
                    fill
                    priority
                    sizes="56px"
                    className="object-cover"
                  />

                </div>

                {/* BRAND TEXT */}

                <div className="min-w-0">

                  <div className="truncate text-[17px] font-black tracking-[0.08em] text-white">
                    EMBRASTIC
                  </div>

                  <div className="mt-1 whitespace-nowrap text-[9px] font-semibold tracking-[0.19em] text-amber-400">
                    STITCHED TO STAND OUT
                  </div>

                  <div className="mt-1 text-[10px] text-slate-500">
                    Business OS
                  </div>

                </div>

              </div>

            ) : (

              <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-white/15 bg-white shadow-lg">

                <Image
                  src="/EMBRASTICLogo.jpeg"
                  alt="EMBRASTIC Logo"
                  fill
                  priority
                  sizes="44px"
                  className="object-cover"
                />

              </div>

            )}

          </div>

        </div>

        {/* =================================================
            COLLAPSE BUTTON
        ================================================= */}

        <div
          className={`shrink-0 px-3 pt-3 ${
            open
              ? ""
              : "flex justify-center"
          }`}
        >

          <button
            type="button"
            onClick={() =>
              setOpen(
                !open
              )
            }
            className={`flex h-10 items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white ${
              open
                ? "w-full justify-between px-3"
                : "w-10 justify-center"
            }`}
            aria-label="Toggle sidebar"
            title={
              open
                ? "Collapse sidebar"
                : "Expand sidebar"
            }
          >

            {open && (
              <span className="text-xs font-semibold">
                Collapse menu
              </span>
            )}

            <span className="text-xl leading-none">
              {open
                ? "‹"
                : "›"}
            </span>

          </button>

        </div>

        {/* =================================================
            WORKSPACE LABEL
        ================================================= */}

        {open && (

          <div className="px-5 pb-2 pt-5">

            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Workspace
            </div>

          </div>

        )}

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">

          <div className="space-y-1">

            {menu.map(
              (
                item
              ) => {
                const active =
                  isActive(
                    item.href
                  );

                return (

                  <Link
                    key={
                      item.name
                    }
                    href={
                      item.href
                    }
                    title={
                      !open
                        ? item.name
                        : undefined
                    }
                    className={`group flex items-center rounded-xl transition-all duration-200 ${
                      open
                        ? "gap-3 px-3 py-2.5"
                        : "justify-center px-2 py-2.5"
                    } ${
                      active
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >

                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg transition ${
                        active
                          ? "bg-white/10"
                          : "group-hover:bg-white/5"
                      }`}
                    >
                      {
                        item.icon
                      }
                    </span>

                    {open && (

                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {
                          item.name
                        }
                      </span>

                    )}

                    {open &&
                      active && (

                      <span className="h-2 w-2 shrink-0 rounded-full bg-white" />

                    )}

                  </Link>

                );
              }
            )}

          </div>

        </nav>

        {/* =================================================
            USER AREA
        ================================================= */}

        <div className="shrink-0 border-t border-white/10 p-3">

          {open && (

            <div className="mb-2 rounded-xl border border-white/10 bg-white/5 p-3">

              <div className="flex items-center gap-3">

                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white">

                  <Image
                    src="/EMBRASTICLogo.jpeg"
                    alt="EMBRASTIC"
                    fill
                    sizes="40px"
                    className="object-cover"
                  />

                </div>

                <div className="min-w-0">

                  <div className="truncate text-sm font-bold text-white">
                    Business Owner
                  </div>

                  <div className="truncate text-xs text-slate-400">
                    Administrator
                  </div>

                </div>

              </div>

            </div>

          )}

          {/* =================================================
              LOGOUT
          ================================================= */}

          <button
            type="button"
            onClick={
              logout
            }
            disabled={
              loggingOut
            }
            title={
              !open
                ? "Sign out"
                : undefined
            }
            className={`flex w-full items-center rounded-xl text-sm font-semibold text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50 ${
              open
                ? "gap-3 px-3 py-2.5"
                : "justify-center px-2 py-2.5"
            }`}
          >

            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg">
              🚪
            </span>

            {open && (

              <span>
                {loggingOut
                  ? "Signing out..."
                  : "Sign out"}
              </span>

            )}

          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <main
        className={`min-h-screen transition-all duration-300 ${
          open
            ? "ml-72"
            : "ml-20"
        }`}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">

          <div className="flex h-20 items-center justify-between px-6 lg:px-8">

            {/* LEFT */}

            <div className="flex min-w-0 items-center gap-4">

              {/* SMALL HEADER LOGO */}

              <div className="relative hidden h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:block">

                <Image
                  src="/EMBRASTICLogo.jpeg"
                  alt="EMBRASTIC Logo"
                  fill
                  sizes="44px"
                  className="object-cover"
                />

              </div>

              <div className="min-w-0">

                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  EMBRASTIC Business OS
                </div>

                <h1 className="mt-1 truncate text-xl font-black text-slate-900">
                  {pageTitle}
                </h1>

              </div>

            </div>

            {/* RIGHT */}

            <div className="flex items-center gap-4">

              {/* SYSTEM STATUS */}

              <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 md:flex">

                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                <span className="text-xs font-bold text-emerald-700">
                  System Online
                </span>

              </div>

              {/* DIVIDER */}

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              {/* USER */}

              <div className="flex items-center gap-3">

                <div className="hidden text-right sm:block">

                  <div className="text-sm font-bold text-slate-800">
                    Business Owner
                  </div>

                  <div className="text-xs text-slate-500">
                    Administrator
                  </div>

                </div>

                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                  <Image
                    src="/EMBRASTICLogo.jpeg"
                    alt="EMBRASTIC"
                    fill
                    sizes="44px"
                    className="object-cover"
                  />

                </div>

              </div>

            </div>

          </div>

        </header>

        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <div className="min-h-[calc(100vh-5rem)]">

          <div className="px-5 py-5 sm:px-6 lg:px-8">

            {children}

          </div>

        </div>

      </main>

    </div>
  );
}
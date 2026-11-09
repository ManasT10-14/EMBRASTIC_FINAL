"use client";

import {
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

const menu = [
  ["Dashboard", "📊"],
  ["Customers", "👥"],
  ["Quotations", "📝"],
  ["Orders", "📦"],
  ["Artwork & Designs", "🎨"],
  ["Digitizing", "🧵"],
  ["Production", "🪡"],
  ["Quality Control", "✅"],
  ["Dispatch", "🚚"],
  ["Inventory", "📋"],
  ["Invoices", "🧾"],
  ["Payments", "💳"],
  ["Expenses", "💰"],
  ["Reports", "📈"],
  ["Settings", "⚙️"],
];

function getRoute(
  name: string
) {
  switch (name) {
    case "Dashboard":
      return "/protected";

    case "Customers":
      return "/protected/customers";

    case "Quotations":
      return "/protected/quotations";

    case "Orders":
      return "/protected/orders";

    case "Artwork & Designs":
      return "/protected/designs";

    case "Digitizing":
      return "/protected/digitizing";

    case "Production":
      return "/protected/production";

    case "Quality Control":
      return "/protected/quality-control";

    case "Dispatch":
      return "/protected/dispatch";

    case "Inventory":
      return "/protected/inventory";

    case "Invoices":
      return "/protected/invoices";

    case "Payments":
      return "/protected/payments";

    case "Expenses":
      return "/protected/expenses";

    case "Reports":
      return "/protected/reports";

    case "Settings":
      return "/protected/settings";

    default:
      return "/protected";
  }
}

export default function ProtectedLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  const router =
    useRouter();

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

  async function logout() {
    try {
      setLoggingOut(
        true
      );

      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
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
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* SIDEBAR */}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col bg-slate-950 text-white transition-all duration-300 ${
          open
            ? "w-64"
            : "w-20"
        }`}
      >

        {/* LOGO */}

        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-5">

          {open && (

            <div>

              <div className="text-xl font-black tracking-wide text-blue-400">
                EMBRASTIC
              </div>

              <div className="text-[10px] tracking-[0.25em] text-amber-400">
                STITCHED TO STAND OUT
              </div>

            </div>

          )}

          <button
            onClick={() =>
              setOpen(
                !open
              )
            }
            className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>

        </div>

        {/* NAV */}

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">

          {menu.map(
            (
              [
                name,
                icon,
              ]
            ) => {

              const route =
                getRoute(
                  name
                );

              return (

                <Link
                  key={
                    name
                  }
                  href={
                    route
                  }
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-blue-600 hover:text-white"
                >

                  <span className="flex w-7 shrink-0 items-center justify-center text-lg">
                    {icon}
                  </span>

                  {open && (

                    <span className="whitespace-nowrap">
                      {name}
                    </span>

                  )}

                </Link>

              );
            }
          )}

        </nav>

        {/* LOGOUT */}

        <div className="shrink-0 border-t border-white/10 p-3">

          <button
            onClick={
              logout
            }
            disabled={
              loggingOut
            }
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
          >

            <span className="flex w-7 items-center justify-center text-lg">
              🚪
            </span>

            {open && (
              <span>
                {loggingOut
                  ? "Signing out..."
                  : "Logout"}
              </span>
            )}

          </button>

        </div>

      </aside>

      {/* MAIN */}

      <main
        className={`min-h-screen transition-all duration-300 ${
          open
            ? "ml-64"
            : "ml-20"
        }`}
      >

        {/* HEADER */}

        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-white px-6 shadow-sm">

          <div>

            <h1 className="text-xl font-bold">
              EMBRASTIC Business OS
            </h1>

            <p className="text-xs text-slate-500">
              Custom Embroidery
              Management System
            </p>

          </div>

          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">

              <div className="text-sm font-semibold">
                Business Owner
              </div>

              <div className="text-xs text-slate-500">
                Administrator
              </div>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
              E
            </div>

          </div>

        </header>

        {/* PAGE */}

        <div className="min-h-[calc(100vh-5rem)] p-6">
          {children}
        </div>

      </main>

    </div>
  );
}
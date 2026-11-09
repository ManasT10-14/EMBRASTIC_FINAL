"use client";

import {
  useEffect,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  type AppSettings,
} from "@/lib/app-settings";

/* =========================================================
   TYPES
========================================================= */

type MenuItem = {
  name: string;
  icon: string;
  href: string;
};

type GroupTone =
  | "slate"
  | "blue"
  | "purple"
  | "cyan"
  | "amber"
  | "emerald"
  | "rose";

type MenuGroup = {
  id: string;
  name: string;
  icon: string;
  tone: GroupTone;
  items: MenuItem[];
};

/* =========================================================
   BUSINESS PROCESS MENU
========================================================= */

const menuGroups: MenuGroup[] = [
  {
    id: "overview",
    name: "Overview",
    icon: "🏠",
    tone: "slate",
    items: [
      {
        name: "Dashboard",
        icon: "📊",
        href: "/protected",
      },
    ],
  },

  {
    id: "sales",
    name: "Sales & Customers",
    icon: "🤝",
    tone: "blue",
    items: [
      {
        name: "Customers",
        icon: "👥",
        href: "/protected/customers",
      },
      {
        name: "Price Master",
        icon: "🏷️",
        href: "/protected/price-master",
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
    ],
  },

  {
    id: "production",
    name: "Design & Production",
    icon: "🪡",
    tone: "purple",
    items: [
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
        name: "Work Orders",
        icon: "🧰",
        href: "/protected/work-orders",
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
    ],
  },

  {
    id: "fulfilment",
    name: "Fulfilment",
    icon: "🚚",
    tone: "cyan",
    items: [
      {
        name: "Dispatch",
        icon: "🚚",
        href: "/protected/dispatch",
      },
    ],
  },

  {
    id: "procurement",
    name: "Procurement & Inventory",
    icon: "🏭",
    tone: "amber",
    items: [
      {
        name: "Suppliers",
        icon: "🏭",
        href: "/protected/suppliers",
      },
      {
        name: "Purchase Orders",
        icon: "🛒",
        href: "/protected/purchase-orders",
      },
      {
        name: "Inventory",
        icon: "📋",
        href: "/protected/inventory",
      },
    ],
  },

  {
    id: "finance",
    name: "Finance",
    icon: "💰",
    tone: "emerald",
    items: [
      {
        name: "Invoices",
        icon: "🧾",
        href: "/protected/invoices",
      },
      {
        name: "Customer Payments",
        icon: "💳",
        href: "/protected/payments",
      },
      {
        name: "Supplier Payables",
        icon: "🏦",
        href: "/protected/supplier-payables",
      },
      {
        name: "Expenses",
        icon: "💰",
        href: "/protected/expenses",
      },
    ],
  },

  {
    id: "management",
    name: "Management",
    icon: "📈",
    tone: "rose",
    items: [
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
    ],
  },
];

/* =========================================================
   FLAT MENU
========================================================= */

const allMenuItems =
  menuGroups.flatMap(
    (
      group
    ) =>
      group.items
  );

/* =========================================================
   GROUP COLOURS
========================================================= */

const groupToneStyles: Record<
  GroupTone,
  {
    header: string;
    headerActive: string;
    icon: string;
    iconActive: string;
    activeItem: string;
    marker: string;
    badge: string;
    childBorder: string;
  }
> = {
  slate: {
    header:
      "border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white",

    headerActive:
      "border-slate-500 bg-slate-700 text-white",

    icon:
      "bg-slate-700 text-slate-200",

    iconActive:
      "bg-slate-500 text-white",

    activeItem:
      "bg-slate-600 text-white shadow-lg shadow-black/20",

    marker:
      "bg-slate-300",

    badge:
      "bg-slate-500/30 text-slate-200",

    childBorder:
      "border-slate-700",
  },

  blue: {
    header:
      "border-blue-900/60 bg-blue-950/40 text-blue-200 hover:bg-blue-900/50 hover:text-white",

    headerActive:
      "border-blue-600 bg-blue-900/60 text-blue-100",

    icon:
      "bg-blue-900/60 text-blue-200",

    iconActive:
      "bg-blue-600 text-white",

    activeItem:
      "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950/40",

    marker:
      "bg-blue-300",

    badge:
      "bg-blue-500/20 text-blue-200",

    childBorder:
      "border-blue-900/60",
  },

  purple: {
    header:
      "border-purple-900/60 bg-purple-950/40 text-purple-200 hover:bg-purple-900/50 hover:text-white",

    headerActive:
      "border-purple-600 bg-purple-900/60 text-purple-100",

    icon:
      "bg-purple-900/60 text-purple-200",

    iconActive:
      "bg-purple-600 text-white",

    activeItem:
      "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-950/40",

    marker:
      "bg-purple-300",

    badge:
      "bg-purple-500/20 text-purple-200",

    childBorder:
      "border-purple-900/60",
  },

  cyan: {
    header:
      "border-cyan-900/60 bg-cyan-950/40 text-cyan-200 hover:bg-cyan-900/50 hover:text-white",

    headerActive:
      "border-cyan-600 bg-cyan-900/60 text-cyan-100",

    icon:
      "bg-cyan-900/60 text-cyan-200",

    iconActive:
      "bg-cyan-600 text-white",

    activeItem:
      "bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-lg shadow-cyan-950/40",

    marker:
      "bg-cyan-300",

    badge:
      "bg-cyan-500/20 text-cyan-200",

    childBorder:
      "border-cyan-900/60",
  },

  amber: {
    header:
      "border-amber-900/60 bg-amber-950/40 text-amber-200 hover:bg-amber-900/50 hover:text-white",

    headerActive:
      "border-amber-600 bg-amber-900/60 text-amber-100",

    icon:
      "bg-amber-900/60 text-amber-200",

    iconActive:
      "bg-amber-600 text-white",

    activeItem:
      "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-950/40",

    marker:
      "bg-amber-300",

    badge:
      "bg-amber-500/20 text-amber-200",

    childBorder:
      "border-amber-900/60",
  },

  emerald: {
    header:
      "border-emerald-900/60 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/50 hover:text-white",

    headerActive:
      "border-emerald-600 bg-emerald-900/60 text-emerald-100",

    icon:
      "bg-emerald-900/60 text-emerald-200",

    iconActive:
      "bg-emerald-600 text-white",

    activeItem:
      "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/40",

    marker:
      "bg-emerald-300",

    badge:
      "bg-emerald-500/20 text-emerald-200",

    childBorder:
      "border-emerald-900/60",
  },

  rose: {
    header:
      "border-rose-900/60 bg-rose-950/40 text-rose-200 hover:bg-rose-900/50 hover:text-white",

    headerActive:
      "border-rose-600 bg-rose-900/60 text-rose-100",

    icon:
      "bg-rose-900/60 text-rose-200",

    iconActive:
      "bg-rose-600 text-white",

    activeItem:
      "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-950/40",

    marker:
      "bg-rose-300",

    badge:
      "bg-rose-500/20 text-rose-200",

    childBorder:
      "border-rose-900/60",
  },
};

/* =========================================================
   PAGE TITLE
========================================================= */

function getPageTitle(
  pathname: string
) {
  if (
    pathname ===
    "/protected"
  ) {
    return "Dashboard";
  }

  const item =
    [...allMenuItems]
      .sort(
        (
          a,
          b
        ) =>
          b.href.length -
          a.href.length
      )
      .find(
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
   ACTIVE GROUP
========================================================= */

function getActiveGroupId(
  pathname: string
) {
  const group =
    menuGroups.find(
      (
        currentGroup
      ) =>
        currentGroup.items.some(
          (
            item
          ) =>
            item.href ===
            "/protected"
              ? pathname ===
                "/protected"
              : pathname.startsWith(
                  item.href
                )
        )
    );

  return (
    group?.id ||
    null
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
    appSettings,
    setAppSettings,
  ] =
    useState<AppSettings>(
      DEFAULT_APP_SETTINGS
    );

  const [
    sidebarOpen,
    setSidebarOpen,
  ] =
    useState(
      true
    );

  /*
   * null = all business groups collapsed
   *
   * Only one group ID can be stored,
   * so opening another group automatically
   * closes the current one.
   */
  const [
    expandedGroup,
    setExpandedGroup,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(
      false
    );

  const pageTitle =
    getPageTitle(
      pathname
    );

  /* =======================================================
     LOAD APP SETTINGS
  ======================================================= */

  useEffect(
    () => {
      let active =
        true;

      async function loadSettings() {
        try {
          const settings =
            await loadAppSettings();

          if (
            active
          ) {
            setAppSettings(
              settings
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Failed to load application settings:",
            error
          );
        }
      }

      void loadSettings();

      return () => {
        active =
          false;
      };
    },
    [
      pathname,
    ]
  );

  /* =======================================================
     ACTIVE ROUTE
  ======================================================= */

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

  function groupIsActive(
    group:
      MenuGroup
  ) {
    return group.items.some(
      (
        item
      ) =>
        isActive(
          item.href
        )
    );
  }

  /* =======================================================
     OPEN CURRENT PROCESS GROUP
  ======================================================= */

  useEffect(
    () => {
      const activeGroupId =
        getActiveGroupId(
          pathname
        );

      setExpandedGroup(
        activeGroupId
      );
    },
    [
      pathname,
    ]
  );

  /* =======================================================
     ACCORDION
  ======================================================= */

  function toggleGroup(
    groupId: string
  ) {
    setExpandedGroup(
      (
        current
      ) =>
        current ===
        groupId
          ? null
          : groupId
    );
  }

  /* =======================================================
     SIDEBAR COLLAPSE
  ======================================================= */

  function toggleSidebar() {
    setSidebarOpen(
      (
        current
      ) =>
        !current
    );
  }

  /* =======================================================
     LOGOUT
  ======================================================= */

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
    } catch (
      error
    ) {
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

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-700 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white shadow-2xl transition-all duration-300 ${
          sidebarOpen
            ? "w-72"
            : "w-20"
        }`}
      >

        {/* =================================================
            COMPANY / BRAND BLOCK
        ================================================= */}

        <div className="flex h-24 shrink-0 items-center border-b border-white/10 bg-slate-950/50 px-4">

          {sidebarOpen ? (

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

              {/* COMPANY */}

              <div className="min-w-0">

                <div className="truncate text-[17px] font-black tracking-[0.08em] text-white">
                  EMBRASTIC
                </div>

                <div className="mt-1 whitespace-nowrap text-[9px] font-black tracking-[0.18em] text-amber-300">
                  STITCHED TO STAND OUT
                </div>

                <div className="mt-1 text-[10px] font-semibold text-slate-400">
                  Business OS
                </div>

              </div>

            </div>

          ) : (

            <div className="mx-auto relative h-11 w-11 overflow-hidden rounded-xl border border-white/15 bg-white shadow-lg">

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

        {/* =================================================
            SIDEBAR COLLAPSE / EXPAND
        ================================================= */}

        <div
          className={`shrink-0 px-3 pt-3 ${
            sidebarOpen
              ? ""
              : "flex justify-center"
          }`}
        >

          <button
            type="button"
            onClick={
              toggleSidebar
            }
            className={`flex h-10 items-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 shadow-sm transition hover:border-slate-600 hover:bg-slate-700 hover:text-white ${
              sidebarOpen
                ? "w-full justify-between px-3"
                : "w-10 justify-center"
            }`}
            title={
              sidebarOpen
                ? "Collapse sidebar"
                : "Expand sidebar"
            }
            aria-label={
              sidebarOpen
                ? "Collapse sidebar"
                : "Expand sidebar"
            }
          >

            {sidebarOpen && (

              <span className="text-xs font-bold">
                Collapse Sidebar
              </span>

            )}

            <span className="text-xl leading-none">
              {sidebarOpen
                ? "‹"
                : "›"}
            </span>

          </button>

        </div>

        {/* =================================================
            BUSINESS PROCESS LABEL
        ================================================= */}

        {sidebarOpen && (

          <div className="shrink-0 px-4 pb-2 pt-4">

            <div className="text-[10px] font-black uppercase tracking-[0.17em] text-slate-500">
              Business Processes
            </div>

            <div className="mt-1 text-[10px] font-medium text-slate-600">
              One process opens at a time
            </div>

          </div>

        )}

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-2">

          <div className="space-y-2">

            {menuGroups.map(
              (
                group
              ) => {
                const activeGroup =
                  groupIsActive(
                    group
                  );

                const expanded =
                  expandedGroup ===
                  group.id;

                const colors =
                  groupToneStyles[
                    group.tone
                  ];

                return (

                  <div
                    key={
                      group.id
                    }
                  >

                    {/* =====================================
                        FULL SIDEBAR GROUP
                    ===================================== */}

                    {sidebarOpen ? (

                      <>

                        <button
                          type="button"
                          onClick={() =>
                            toggleGroup(
                              group.id
                            )
                          }
                          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200 ${
                            expanded ||
                            activeGroup
                              ? colors.headerActive
                              : colors.header
                          }`}
                        >

                          {/* GROUP ICON */}

                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base ${
                              expanded ||
                              activeGroup
                                ? colors.iconActive
                                : colors.icon
                            }`}
                          >
                            {
                              group.icon
                            }
                          </span>

                          {/* TITLE */}

                          <div className="min-w-0 flex-1">

                            <div className="truncate text-xs font-black uppercase tracking-[0.08em]">
                              {
                                group.name
                              }
                            </div>

                            <div className="mt-1 text-[10px] font-semibold opacity-70">
                              {
                                group.items.length
                              }{" "}
                              {group.items.length ===
                              1
                                ? "module"
                                : "modules"}
                            </div>

                          </div>

                          {/* ACTIVE */}

                          {activeGroup && (

                            <span
                              className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${colors.badge}`}
                            >
                              Active
                            </span>

                          )}

                          {/* ARROW */}

                          <span
                            className={`ml-1 text-base transition-transform duration-200 ${
                              expanded
                                ? "rotate-90"
                                : ""
                            }`}
                          >
                            ›
                          </span>

                        </button>

                        {/* =================================
                            CHILDREN
                        ================================= */}

                        {expanded && (

                          <div
                            className={`ml-4 mt-1.5 space-y-1 border-l-2 pl-3 ${colors.childBorder}`}
                          >

                            {group.items.map(
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
                                      item.href
                                    }
                                    href={
                                      item.href
                                    }
                                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                                      active
                                        ? colors.activeItem
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                    }`}
                                  >

                                    {/* ITEM ICON */}

                                    <span
                                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ${
                                        active
                                          ? "bg-white/15"
                                          : "bg-slate-800 text-slate-200 group-hover:bg-slate-700"
                                      }`}
                                    >
                                      {
                                        item.icon
                                      }
                                    </span>

                                    {/* ITEM NAME */}

                                    <span className="min-w-0 flex-1 truncate font-bold">
                                      {
                                        item.name
                                      }
                                    </span>

                                    {/* ACTIVE DOT */}

                                    {active && (

                                      <span className="h-2 w-2 shrink-0 rounded-full bg-white" />

                                    )}

                                  </Link>

                                );
                              }
                            )}

                          </div>

                        )}

                      </>

                    ) : (

                      /* ===================================
                         COLLAPSED SIDEBAR
                      =================================== */

                      <div className="space-y-1">

                        {group.items.map(
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
                                  item.href
                                }
                                href={
                                  item.href
                                }
                                title={`${group.name} — ${item.name}`}
                                className={`relative flex items-center justify-center rounded-xl px-2 py-2.5 transition ${
                                  active
                                    ? colors.activeItem
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }`}
                              >

                                <span className="flex h-9 w-9 items-center justify-center rounded-lg text-lg">
                                  {
                                    item.icon
                                  }
                                </span>

                                {active && (

                                  <span
                                    className={`absolute right-0 h-7 w-1 rounded-l-full ${colors.marker}`}
                                  />

                                )}

                              </Link>

                            );
                          }
                        )}

                        <div className="mx-auto my-2 h-px w-8 bg-slate-700" />

                      </div>

                    )}

                  </div>

                );
              }
            )}

          </div>

        </nav>

        {/* =================================================
            USER AREA
        ================================================= */}

        <div className="shrink-0 border-t border-white/10 bg-slate-950/70 p-3">

          {sidebarOpen && (

            <div className="mb-2 rounded-xl border border-slate-700 bg-slate-800/80 p-3">

              <div className="flex items-center gap-3">

                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white">

                  <Image
                    src="/EMBRASTICLogo.jpeg"
                    alt="User"
                    fill
                    sizes="40px"
                    className="object-cover"
                  />

                </div>

                <div className="min-w-0">

                  <div className="truncate text-sm font-black text-slate-100">
                    {appSettings.businessOwnerName ||
                      "Business Owner"}
                  </div>

                  <div className="truncate text-xs text-slate-400">
                    {appSettings.administratorTitle ||
                      "Administrator"}
                  </div>

                </div>

              </div>

            </div>

          )}

          {/* SIGN OUT */}

          <button
            type="button"
            onClick={
              logout
            }
            disabled={
              loggingOut
            }
            title={
              !sidebarOpen
                ? "Sign out"
                : undefined
            }
            className={`flex w-full items-center rounded-xl border border-transparent text-sm font-bold text-slate-300 transition hover:border-red-900/50 hover:bg-red-950/40 hover:text-red-300 disabled:opacity-50 ${
              sidebarOpen
                ? "gap-3 px-3 py-2.5"
                : "justify-center px-2 py-2.5"
            }`}
          >

            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg">
              🚪
            </span>

            {sidebarOpen && (

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
          sidebarOpen
            ? "ml-72"
            : "ml-20"
        }`}
      >

        {/* =================================================
            TOP HEADER
        ================================================= */}

        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">

          <div className="flex h-20 items-center justify-between px-6 lg:px-8">

            {/* LEFT */}

            <div className="flex min-w-0 items-center gap-4">

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

                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  EMBRASTIC Business OS
                </div>

                <h1 className="mt-1 truncate text-xl font-black text-slate-900">
                  {pageTitle}
                </h1>

              </div>

            </div>

            {/* RIGHT */}

            <div className="flex items-center gap-4">

              <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 md:flex">

                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                <span className="text-xs font-bold text-emerald-700">
                  System Online
                </span>

              </div>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="flex items-center gap-3">

                <div className="hidden max-w-[220px] text-right sm:block">

                  <div className="truncate text-sm font-black text-slate-800">
                    {appSettings.businessOwnerName ||
                      "Business Owner"}
                  </div>

                  <div className="truncate text-xs text-slate-500">
                    {appSettings.administratorTitle ||
                      "Administrator"}
                  </div>

                </div>

                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                  <Image
                    src="/EMBRASTICLogo.jpeg"
                    alt="User"
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
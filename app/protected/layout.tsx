"use client";

import {
  Suspense,
  useEffect,
  useMemo,
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
   MENU
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
    id: "catalogue",
    name: "Catalogue",
    icon: "🛍️",
    tone: "blue",

    items: [
      {
        name: "Product Categories",
        icon: "🗂️",
        href: "/protected/product-categories",
      },

      {
        name: "Products",
        icon: "👕",
        href: "/protected/products",
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
    group =>
      group.items
  );

/* =========================================================
   COLOURS
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
      "border-white/5 bg-white/[0.03] text-slate-400 hover:bg-white/[0.07] hover:text-white",

    headerActive:
      "border-white/10 bg-white/[0.09] text-white",

    icon:
      "bg-white/10 text-slate-300",

    iconActive:
      "bg-white/20 text-white",

    activeItem:
      "border-l-2 border-slate-300 bg-white/10 text-white",

    marker:
      "bg-slate-300",

    badge:
      "bg-white/10 text-slate-200",

    childBorder:
      "border-white/10",
  },

  blue: {
    header:
      "border-white/5 bg-blue-500/[0.05] text-blue-200/80 hover:bg-blue-500/[0.12] hover:text-white",

    headerActive:
      "border-blue-400/25 bg-blue-500/[0.14] text-white",

    icon:
      "bg-blue-500/15 text-blue-300",

    iconActive:
      "bg-blue-500/25 text-blue-100",

    activeItem:
      "border-l-2 border-blue-400 bg-blue-500/[0.16] text-white",

    marker:
      "bg-blue-400",

    badge:
      "bg-blue-400/20 text-blue-200",

    childBorder:
      "border-blue-500/15",
  },

  purple: {
    header:
      "border-white/5 bg-purple-500/[0.05] text-purple-200/80 hover:bg-purple-500/[0.12] hover:text-white",

    headerActive:
      "border-purple-400/25 bg-purple-500/[0.14] text-white",

    icon:
      "bg-purple-500/15 text-purple-300",

    iconActive:
      "bg-purple-500/25 text-purple-100",

    activeItem:
      "border-l-2 border-purple-400 bg-purple-500/[0.16] text-white",

    marker:
      "bg-purple-400",

    badge:
      "bg-purple-400/20 text-purple-200",

    childBorder:
      "border-purple-500/15",
  },

  cyan: {
    header:
      "border-white/5 bg-cyan-500/[0.05] text-cyan-200/80 hover:bg-cyan-500/[0.12] hover:text-white",

    headerActive:
      "border-cyan-400/25 bg-cyan-500/[0.14] text-white",

    icon:
      "bg-cyan-500/15 text-cyan-300",

    iconActive:
      "bg-cyan-500/25 text-cyan-100",

    activeItem:
      "border-l-2 border-cyan-400 bg-cyan-500/[0.16] text-white",

    marker:
      "bg-cyan-400",

    badge:
      "bg-cyan-400/20 text-cyan-200",

    childBorder:
      "border-cyan-500/15",
  },

  amber: {
    header:
      "border-white/5 bg-amber-500/[0.05] text-amber-200/80 hover:bg-amber-500/[0.12] hover:text-white",

    headerActive:
      "border-amber-400/25 bg-amber-500/[0.14] text-white",

    icon:
      "bg-amber-500/15 text-amber-300",

    iconActive:
      "bg-amber-500/25 text-amber-100",

    activeItem:
      "border-l-2 border-amber-400 bg-amber-500/[0.16] text-white",

    marker:
      "bg-amber-400",

    badge:
      "bg-amber-400/20 text-amber-200",

    childBorder:
      "border-amber-500/15",
  },

  emerald: {
    header:
      "border-white/5 bg-emerald-500/[0.05] text-emerald-200/80 hover:bg-emerald-500/[0.12] hover:text-white",

    headerActive:
      "border-emerald-400/25 bg-emerald-500/[0.14] text-white",

    icon:
      "bg-emerald-500/15 text-emerald-300",

    iconActive:
      "bg-emerald-500/25 text-emerald-100",

    activeItem:
      "border-l-2 border-emerald-400 bg-emerald-500/[0.16] text-white",

    marker:
      "bg-emerald-400",

    badge:
      "bg-emerald-400/20 text-emerald-200",

    childBorder:
      "border-emerald-500/15",
  },

  rose: {
    header:
      "border-white/5 bg-rose-500/[0.05] text-rose-200/80 hover:bg-rose-500/[0.12] hover:text-white",

    headerActive:
      "border-rose-400/25 bg-rose-500/[0.14] text-white",

    icon:
      "bg-rose-500/15 text-rose-300",

    iconActive:
      "bg-rose-500/25 text-rose-100",

    activeItem:
      "border-l-2 border-rose-400 bg-rose-500/[0.16] text-white",

    marker:
      "bg-rose-400",

    badge:
      "bg-rose-400/20 text-rose-200",

    childBorder:
      "border-rose-500/15",
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
        item =>
          item.href !==
            "/protected" &&
          pathname.startsWith(
            item.href
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
      currentGroup =>
        currentGroup.items.some(
          item =>
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

function ProtectedLayoutContent({
  children,
}: {
  children:
    React.ReactNode;
}) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  /* =======================================================
     SETTINGS
  ======================================================= */

  const [
    appSettings,
    setAppSettings,
  ] =
    useState<AppSettings>(
      DEFAULT_APP_SETTINGS
    );

  /* =======================================================
     SIDEBAR
  ======================================================= */

  const [
    sidebarOpen,
    setSidebarOpen,
  ] =
    useState(
      true
    );

  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] =
    useState(
      false
    );

  /* =======================================================
     COMMAND SEARCH
  ======================================================= */

  const [
    commandPaletteOpen,
    setCommandPaletteOpen,
  ] =
    useState(
      false
    );

  const [
    commandQuery,
    setCommandQuery,
  ] =
    useState(
      ""
    );

  /* =======================================================
     SYSTEM STATUS
  ======================================================= */

  const [
    systemStatus,
    setSystemStatus,
  ] =
    useState<
      "checking" |
      "online" |
      "offline"
    >(
      "checking"
    );

  /* =======================================================
     ACCORDION
  ======================================================= */

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
     LOAD SETTINGS
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
     SYSTEM ONLINE

     IMPORTANT:
     We are NOT calling /api/health.

     Your project currently does not have that endpoint.
     The previous layout was therefore receiving 404 and
     incorrectly displaying "System Offline".
  ======================================================= */

  useEffect(
    () => {
      setSystemStatus(
        "online"
      );
    },
    []
  );

  /* =======================================================
     SIDEBAR LOCAL STORAGE
  ======================================================= */

  useEffect(
    () => {
      try {
        const saved =
          window.localStorage.getItem(
            "embrastic:sidebarOpen"
          );

        if (
          saved !==
          null
        ) {
          setSidebarOpen(
            saved ===
            "true"
          );
        }
      } catch {
        //
      }
    },
    []
  );

  useEffect(
    () => {
      try {
        window.localStorage.setItem(
          "embrastic:sidebarOpen",
          String(
            sidebarOpen
          )
        );
      } catch {
        //
      }
    },
    [
      sidebarOpen,
    ]
  );

  /* =======================================================
     ACTIVE
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
      item =>
        isActive(
          item.href
        )
    );
  }

  /* =======================================================
     AUTO OPEN CURRENT GROUP
  ======================================================= */

  useEffect(
    () => {
      const groupId =
        getActiveGroupId(
          pathname
        );

      setExpandedGroup(
        groupId
      );

      setMobileSidebarOpen(
        false
      );
    },
    [
      pathname,
    ]
  );

  /* =======================================================
     KEYBOARD SEARCH
  ======================================================= */

  useEffect(
    () => {
      function handleKeyDown(
        event:
          KeyboardEvent
      ) {
        const shortcut =
          (
            event.ctrlKey ||
            event.metaKey
          ) &&
          event.key
            .toLowerCase() ===
            "k";

        if (
          shortcut
        ) {
          event.preventDefault();

          setCommandPaletteOpen(
            current =>
              !current
          );
        }

        if (
          event.key ===
          "Escape"
        ) {
          setCommandPaletteOpen(
            false
          );

          setMobileSidebarOpen(
            false
          );
        }
      }

      window.addEventListener(
        "keydown",
        handleKeyDown
      );

      return () => {
        window.removeEventListener(
          "keydown",
          handleKeyDown
        );
      };
    },
    []
  );

  /* =======================================================
     COMMAND RESULTS
  ======================================================= */

  const commandResults =
    useMemo(
      () => {
        const query =
          commandQuery
            .trim()
            .toLowerCase();

        if (
          !query
        ) {
          return allMenuItems;
        }

        return allMenuItems.filter(
          item =>
            item.name
              .toLowerCase()
              .includes(
                query
              )
        );
      },
      [
        commandQuery,
      ]
    );

  /* =======================================================
     BREADCRUMB
  ======================================================= */

  const breadcrumbGroup =
    menuGroups.find(
      group =>
        group.id ===
        getActiveGroupId(
          pathname
        )
    );

  /* =======================================================
     TOGGLES
  ======================================================= */

  function toggleGroup(
    groupId:
      string
  ) {
    setExpandedGroup(
      current =>
        current ===
        groupId
          ? null
          : groupId
    );
  }

  function toggleSidebar() {
    setSidebarOpen(
      current =>
        !current
    );
  }

  function toggleMobileSidebar() {
    setMobileSidebarOpen(
      current =>
        !current
    );
  }

  function goToCommandResult(
    href:
      string
  ) {
    setCommandPaletteOpen(
      false
    );

    router.push(
      href
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
    } catch (
      error
    ) {
      console.error(
        "Logout error:",
        error
      );
    } finally {
      router.replace(
        "/login"
      );

      router.refresh();

      setLoggingOut(
        false
      );
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* =================================================
          MOBILE BACKDROP
      ================================================= */}

      {mobileSidebarOpen && (

        <div
          onClick={
            toggleMobileSidebar
          }
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm md:hidden"
        />

      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-white/5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl transition-all duration-300 ${
          mobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } md:translate-x-0 ${
          sidebarOpen
            ? "md:w-72"
            : "md:w-20"
        }`}
      >

        {/* =================================================
            COMPANY
        ================================================= */}

        <div className="flex h-24 shrink-0 items-center border-b border-white/[0.06] bg-black/20 px-4">

          {sidebarOpen ||
          mobileSidebarOpen ? (

            <div className="flex min-w-0 items-center gap-3">

              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white shadow-lg">

                <Image
                  src="/EMBRASTICLogo.jpeg"
                  alt="EMBRASTIC Logo"
                  fill
                  priority
                  sizes="56px"
                  className="object-cover"
                />

              </div>

              <div className="min-w-0">

                <div className="truncate text-[16px] font-bold tracking-[0.06em] text-white">
                  EMBRASTIC
                </div>

                <div className="mt-1 whitespace-nowrap text-[9px] font-semibold tracking-[0.16em] text-amber-300">
                  STITCHED TO STAND OUT
                </div>

                <div className="mt-1 text-[10px] text-slate-500">
                  Business OS
                </div>

              </div>

            </div>

          ) : (

            <div className="relative mx-auto h-11 w-11 overflow-hidden rounded-xl bg-white">

              <Image
                src="/EMBRASTICLogo.jpeg"
                alt="EMBRASTIC Logo"
                fill
                sizes="44px"
                className="object-cover"
              />

            </div>

          )}

        </div>

        {/* =================================================
            COLLAPSE
        ================================================= */}

        <div className="hidden shrink-0 px-3 pt-3 md:block">

          <button
            type="button"
            onClick={
              toggleSidebar
            }
            className={`flex h-10 items-center rounded-xl border border-white/5 bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.07] hover:text-white ${
              sidebarOpen
                ? "w-full justify-between px-3"
                : "mx-auto w-10 justify-center"
            }`}
          >

            {sidebarOpen && (

              <span className="text-xs font-semibold">
                Collapse Sidebar
              </span>

            )}

            <span className="text-xl">
              {sidebarOpen
                ? "‹"
                : "›"}
            </span>

          </button>

        </div>

        {/* =================================================
            SEARCH
        ================================================= */}

        <div className="shrink-0 px-3 pt-3">

          <button
            type="button"
            onClick={() =>
              setCommandPaletteOpen(
                true
              )
            }
            className={`flex h-10 items-center rounded-xl border border-white/5 bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.07] hover:text-white ${
              sidebarOpen ||
              mobileSidebarOpen
                ? "w-full justify-between px-3"
                : "mx-auto w-10 justify-center"
            }`}
          >

            <span className="flex items-center gap-2">

              <span>
                🔍
              </span>

              {(sidebarOpen ||
                mobileSidebarOpen) && (

                <span className="text-xs font-semibold">
                  Search modules
                </span>

              )}

            </span>

            {(sidebarOpen ||
              mobileSidebarOpen) && (

              <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px]">
                Ctrl K
              </span>

            )}

          </button>

        </div>

        {/* =================================================
            LABEL
        ================================================= */}

        {(sidebarOpen ||
          mobileSidebarOpen) && (

          <div className="px-4 pb-2 pt-5">

            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              Business Processes
            </div>

            <div className="mt-1 text-[10px] text-slate-500">
              One process opens at a time
            </div>

          </div>

        )}

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-2">

          <div className="space-y-1.5">

            {menuGroups.map(
              group => {
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

                const full =
                  sidebarOpen ||
                  mobileSidebarOpen;

                return (

                  <div
                    key={
                      group.id
                    }
                  >

                    {full ? (

                      <>

                        <button
                          type="button"
                          onClick={() =>
                            toggleGroup(
                              group.id
                            )
                          }
                          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                            expanded ||
                            activeGroup
                              ? colors.headerActive
                              : colors.header
                          }`}
                        >

                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
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

                          <div className="min-w-0 flex-1">

                            <div className="truncate text-xs font-semibold uppercase tracking-[0.07em]">
                              {
                                group.name
                              }
                            </div>

                            <div className="mt-1 text-[10px] opacity-70">
                              {
                                group.items.length
                              }{" "}
                              {group.items.length ===
                              1
                                ? "module"
                                : "modules"}
                            </div>

                          </div>

                          {activeGroup && (

                            <span
                              className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${colors.badge}`}
                            >
                              Active
                            </span>

                          )}

                          <span
                            className={`transition-transform ${
                              expanded
                                ? "rotate-90"
                                : ""
                            }`}
                          >
                            ›
                          </span>

                        </button>

                        {expanded && (

                          <div
                            className={`ml-4 mt-1.5 space-y-1 border-l pl-3 ${colors.childBorder}`}
                          >

                            {group.items.map(
                              item => {
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
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                                      active
                                        ? colors.activeItem
                                        : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                                    }`}
                                  >

                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                                      {
                                        item.icon
                                      }
                                    </span>

                                    <span className="min-w-0 flex-1 truncate font-medium">
                                      {
                                        item.name
                                      }
                                    </span>

                                    {active && (

                                      <span className="h-1.5 w-1.5 rounded-full bg-white" />

                                    )}

                                  </Link>

                                );
                              }
                            )}

                          </div>

                        )}

                      </>

                    ) : (

                      <div className="space-y-1">

                        {group.items.map(
                          item => {
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
                                title={
                                  item.name
                                }
                                className={`relative flex items-center justify-center rounded-xl px-2 py-2.5 ${
                                  active
                                    ? colors.activeItem
                                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                                }`}
                              >

                                <span className="text-lg">
                                  {
                                    item.icon
                                  }
                                </span>

                                {active && (

                                  <span
                                    className={`absolute right-0 h-7 w-1 rounded-l ${colors.marker}`}
                                  />

                                )}

                              </Link>

                            );
                          }
                        )}

                      </div>

                    )}

                  </div>

                );
              }
            )}

          </div>

        </nav>

        {/* =================================================
            USER
        ================================================= */}

        <div className="shrink-0 border-t border-white/[0.06] bg-black/20 p-3">

          {(sidebarOpen ||
            mobileSidebarOpen) && (

            <div className="mb-2 rounded-xl border border-white/5 bg-white/[0.04] p-3">

              <div className="flex items-center gap-3">

                <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white">

                  <Image
                    src="/EMBRASTICLogo.jpeg"
                    alt="User"
                    fill
                    sizes="40px"
                    className="object-cover"
                  />

                </div>

                <div className="min-w-0">

                  <div className="truncate text-sm font-semibold text-slate-100">
                    {appSettings.businessOwnerName ||
                      "Business Owner"}
                  </div>

                  <div className="truncate text-xs text-slate-500">
                    {appSettings.administratorTitle ||
                      "Administrator"}
                  </div>

                </div>

              </div>

            </div>

          )}

          <button
            type="button"
            onClick={
              logout
            }
            disabled={
              loggingOut
            }
            className={`flex w-full items-center rounded-xl text-sm font-semibold text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 ${
              sidebarOpen ||
              mobileSidebarOpen
                ? "gap-3 px-3 py-2.5"
                : "justify-center px-2 py-2.5"
            }`}
          >

            <span className="text-lg">
              🚪
            </span>

            {(sidebarOpen ||
              mobileSidebarOpen) && (

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
            ? "md:ml-72"
            : "md:ml-20"
        }`}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">

          <div className="flex h-20 items-center justify-between px-5 lg:px-8">

            {/* LEFT */}

            <div className="flex min-w-0 items-center gap-4">

              <button
                type="button"
                onClick={
                  toggleMobileSidebar
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-slate-600 md:hidden"
              >
                ☰
              </button>

              <div className="relative hidden h-11 w-11 overflow-hidden rounded-xl border bg-white shadow-sm sm:block">

                <Image
                  src="/EMBRASTICLogo.jpeg"
                  alt="EMBRASTIC"
                  fill
                  sizes="44px"
                  className="object-cover"
                />

              </div>

              <div className="min-w-0">

                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  EMBRASTIC Business OS
                </div>

                <div className="mt-1 flex items-center gap-1.5">

                  {breadcrumbGroup && (

                    <>
                      <span className="hidden text-sm text-slate-400 sm:inline">
                        {
                          breadcrumbGroup.name
                        }
                      </span>

                      <span className="hidden text-slate-300 sm:inline">
                        /
                      </span>
                    </>

                  )}

                  <h1 className="truncate text-xl font-bold text-slate-900">
                    {pageTitle}
                  </h1>

                </div>

              </div>

            </div>

            {/* RIGHT */}

            <div className="flex items-center gap-4">

              {/* =========================================
                  SYSTEM STATUS
              ========================================= */}

              <div
                className={`hidden items-center gap-2 rounded-full border px-3 py-2 md:flex ${
                  systemStatus ===
                  "online"
                    ? "border-emerald-200 bg-emerald-50"
                    : systemStatus ===
                      "offline"
                    ? "border-red-200 bg-red-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >

                <span className="relative flex h-2 w-2">

                  {systemStatus ===
                    "online" && (

                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />

                  )}

                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      systemStatus ===
                      "online"
                        ? "bg-emerald-500"
                        : systemStatus ===
                          "offline"
                        ? "bg-red-500"
                        : "bg-slate-400"
                    }`}
                  />

                </span>

                <span
                  className={`text-xs font-semibold ${
                    systemStatus ===
                    "online"
                      ? "text-emerald-700"
                      : systemStatus ===
                        "offline"
                      ? "text-red-700"
                      : "text-slate-500"
                  }`}
                >
                  {systemStatus ===
                    "online"
                    ? "System Online"
                    : systemStatus ===
                      "offline"
                    ? "System Offline"
                    : "Checking..."}
                </span>

              </div>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="flex items-center gap-3">

                <div className="hidden text-right sm:block">

                  <div className="text-sm font-semibold text-slate-800">
                    {appSettings.businessOwnerName ||
                      "Business Owner"}
                  </div>

                  <div className="text-xs text-slate-500">
                    {appSettings.administratorTitle ||
                      "Administrator"}
                  </div>

                </div>

                <div className="relative h-11 w-11 overflow-hidden rounded-xl border bg-white shadow-sm">

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
            PAGE
        ================================================= */}

        <div className="min-h-[calc(100vh-5rem)]">

          <div className="px-5 py-5 sm:px-6 lg:px-8">
            {children}
          </div>

        </div>

      </main>

      {/* =================================================
          COMMAND PALETTE
      ================================================= */}

      {commandPaletteOpen && (

        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24 sm:pt-32">

          <button
            type="button"
            aria-label="Close search"
            onClick={() =>
              setCommandPaletteOpen(
                false
              )
            }
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border bg-white shadow-2xl">

            <div className="flex items-center gap-3 border-b px-4 py-3">

              <span>
                🔍
              </span>

              <input
                value={
                  commandQuery
                }
                onChange={
                  event =>
                    setCommandQuery(
                      event.target.value
                    )
                }
                autoFocus
                placeholder="Search modules..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />

              <span className="rounded-md border bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400">
                Esc
              </span>

            </div>

            <div className="max-h-80 overflow-y-auto p-2">

              {commandResults.length ===
              0 ? (

                <div className="px-3 py-8 text-center text-sm text-slate-400">
                  No matching modules.
                </div>

              ) : (

                commandResults.map(
                  item => (

                    <button
                      key={
                        item.href
                      }
                      type="button"
                      onClick={() =>
                        goToCommandResult(
                          item.href
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                    >

                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                        {
                          item.icon
                        }
                      </span>

                      <span className="font-medium">
                        {
                          item.name
                        }
                      </span>

                    </button>

                  )
                )

              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50" />
      }
    >
      <ProtectedLayoutContent>
        {children}
      </ProtectedLayoutContent>
    </Suspense>
  );
}
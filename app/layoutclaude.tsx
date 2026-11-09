"use client";

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  type AppSettings,
} from "@/lib/app-settings";

/* =========================================================
   ICONS
   Inline line icons (24px grid, 1.75 stroke) so the layout
   needs no extra dependency and no emoji.
========================================================= */

const icons = {
  home: [
    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    "M9 22V12h6v10",
  ],
  dashboard: [
    "M3 3h7v9H3z",
    "M14 3h7v5h-7z",
    "M14 12h7v9h-7z",
    "M3 16h7v5H3z",
  ],
  briefcase: [
    "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z",
    "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
  ],
  users: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M22 21v-2a4 4 0 0 0-3-3.87",
    "M16 3.13a4 4 0 0 1 0 7.75",
  ],
  tag: [
    "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z",
    "M7 7h.01",
  ],
  fileText: [
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
    "M14 2v6h6",
    "M16 13H8",
    "M16 17H8",
    "M10 9H8",
  ],
  package: [
    "M16.5 9.4l-9-5.19",
    "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
    "M3.27 6.96L12 12.01l8.73-5.05",
    "M12 22.08V12",
  ],
  folder: [
    "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
  ],
  shirt: [
    "M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z",
  ],
  pen: [
    "M12 20h9",
    "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z",
  ],
  layers: [
    "M12 2l10 5-10 5L2 7z",
    "M2 17l10 5 10-5",
    "M2 12l10 5 10-5",
  ],
  clipboard: [
    "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
    "M9 2h6v4H9z",
    "M12 11h4",
    "M12 16h4",
    "M8 11h.01",
    "M8 16h.01",
  ],
  factory: [
    "M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z",
    "M17 18h1",
    "M12 18h1",
    "M7 18h1",
  ],
  shieldCheck: [
    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    "M9 12l2 2 4-4",
  ],
  truck: [
    "M1 3h15v13H1z",
    "M16 8h4l3 3v5h-7z",
    "M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    "M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  ],
  building: [
    "M3 21h18",
    "M5 21V7l8-4v18",
    "M19 21V11l-6-4",
    "M9 9v.01",
    "M9 12v.01",
    "M9 15v.01",
    "M9 18v.01",
  ],
  cart: [
    "M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    "M20 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    "M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6",
  ],
  archive: ["M21 8v13H3V8", "M1 3h22v5H1z", "M10 12h4"],
  receipt: [
    "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z",
    "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8",
    "M12 17.5v-11",
  ],
  creditCard: [
    "M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
    "M1 10h22",
  ],
  landmark: [
    "M3 21h18",
    "M5 21V10",
    "M9 21V10",
    "M15 21V10",
    "M19 21V10",
    "M12 3l9 5H3z",
  ],
  banknote: [
    "M2 6h20v12H2z",
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    "M6 12h.01",
    "M18 12h.01",
  ],
  chart: ["M12 20V10", "M18 20V4", "M6 20v-4"],
  sliders: [
    "M4 21v-7",
    "M4 10V3",
    "M12 21v-9",
    "M12 8V3",
    "M20 21v-5",
    "M20 12V3",
    "M1 14h6",
    "M9 8h6",
    "M17 16h6",
  ],
  search: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.35-4.35"],
  menu: ["M3 6h18", "M3 12h18", "M3 18h18"],
  chevronRight: ["M9 18l6-6-6-6"],
  chevronsLeft: ["M11 17l-5-5 5-5", "M18 17l-5-5 5-5"],
  chevronsRight: ["M13 17l5-5-5-5", "M6 17l5-5-5-5"],
  logout: [
    "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
    "M16 17l5-5-5-5",
    "M21 12H9",
  ],
} as const;

type IconName = keyof typeof icons;

function Icon({
  name,
  className = "h-[18px] w-[18px]",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {icons[name].map((d, index) => (
        <path key={index} d={d} />
      ))}
    </svg>
  );
}

/* =========================================================
   TYPES
========================================================= */

type MenuItem = {
  name: string;
  icon: IconName;
  href: string;
};

type MenuGroup = {
  id: string;
  name: string;
  icon: IconName;
  items: MenuItem[];
};

type FlatMenuItem = MenuItem & {
  group: string;
};

type SystemStatus = "checking" | "online" | "offline";

/* =========================================================
   MENU
========================================================= */

const menuGroups: MenuGroup[] = [
  {
    id: "overview",
    name: "Overview",
    icon: "home",
    items: [{ name: "Dashboard", icon: "dashboard", href: "/protected" }],
  },
  {
    id: "sales",
    name: "Sales & Customers",
    icon: "briefcase",
    items: [
      { name: "Customers", icon: "users", href: "/protected/customers" },
      { name: "Price Master", icon: "tag", href: "/protected/price-master" },
      { name: "Quotations", icon: "fileText", href: "/protected/quotations" },
      { name: "Orders", icon: "package", href: "/protected/orders" },
    ],
  },
  {
    id: "catalogue",
    name: "Catalogue",
    icon: "shirt",
    items: [
      {
        name: "Product Categories",
        icon: "folder",
        href: "/protected/product-categories",
      },
      { name: "Products", icon: "shirt", href: "/protected/products" },
    ],
  },
  {
    id: "production",
    name: "Design & Production",
    icon: "factory",
    items: [
      { name: "Artwork & Designs", icon: "pen", href: "/protected/designs" },
      { name: "Digitizing", icon: "layers", href: "/protected/digitizing" },
      {
        name: "Work Orders",
        icon: "clipboard",
        href: "/protected/work-orders",
      },
      { name: "Production", icon: "factory", href: "/protected/production" },
      {
        name: "Quality Control",
        icon: "shieldCheck",
        href: "/protected/quality-control",
      },
    ],
  },
  {
    id: "fulfilment",
    name: "Fulfilment",
    icon: "truck",
    items: [{ name: "Dispatch", icon: "truck", href: "/protected/dispatch" }],
  },
  {
    id: "procurement",
    name: "Procurement & Inventory",
    icon: "building",
    items: [
      { name: "Suppliers", icon: "building", href: "/protected/suppliers" },
      {
        name: "Purchase Orders",
        icon: "cart",
        href: "/protected/purchase-orders",
      },
      { name: "Inventory", icon: "archive", href: "/protected/inventory" },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    icon: "banknote",
    items: [
      { name: "Invoices", icon: "receipt", href: "/protected/invoices" },
      {
        name: "Customer Payments",
        icon: "creditCard",
        href: "/protected/payments",
      },
      {
        name: "Supplier Payables",
        icon: "landmark",
        href: "/protected/supplier-payables",
      },
      { name: "Expenses", icon: "banknote", href: "/protected/expenses" },
    ],
  },
  {
    id: "management",
    name: "Management",
    icon: "chart",
    items: [
      { name: "Reports", icon: "chart", href: "/protected/reports" },
      { name: "Settings", icon: "sliders", href: "/protected/settings" },
    ],
  },
];

/* =========================================================
   HELPERS
========================================================= */

const allMenuItems: FlatMenuItem[] = menuGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.name }))
);

const statusStyles: Record<
  SystemStatus,
  { dot: string; label: string }
> = {
  online: { dot: "bg-emerald-500", label: "System online" },
  offline: { dot: "bg-red-500", label: "System offline" },
  checking: { dot: "bg-slate-400", label: "Checking status" },
};

function matchesPath(pathname: string, href: string) {
  if (href === "/protected") {
    return pathname === "/protected";
  }

  return pathname.startsWith(href);
}

function getPageTitle(pathname: string) {
  if (pathname === "/protected") {
    return "Dashboard";
  }

  const item = [...allMenuItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find(
      (current) =>
        current.href !== "/protected" && pathname.startsWith(current.href)
    );

  return item?.name || "Dashboard";
}

function getActiveGroupId(pathname: string) {
  const group = menuGroups.find((current) =>
    current.items.some((item) => matchesPath(pathname, item.href))
  );

  return group?.id || null;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "BO";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* Shared focus treatment so keyboard users can always see where they are. */
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-0";

/* =========================================================
   LAYOUT
========================================================= */

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [appSettings, setAppSettings] =
    useState<AppSettings>(DEFAULT_APP_SETTINGS);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");

  const [systemStatus, setSystemStatus] =
    useState<SystemStatus>("checking");

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const pageTitle = getPageTitle(pathname);
  const full = sidebarOpen || mobileSidebarOpen;

  const ownerName = appSettings.businessOwnerName || "Business Owner";
  const ownerTitle = appSettings.administratorTitle || "Administrator";

  /* -------------------------------------------------------
     Load settings
  ------------------------------------------------------- */

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const settings = await loadAppSettings();

        if (active) {
          setAppSettings(settings);
        }
      } catch (error) {
        console.error("Failed to load application settings:", error);
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, [pathname]);

  /* -------------------------------------------------------
     System status
     There is no /api/health endpoint in this project, so the
     status is set directly instead of polling a 404.
  ------------------------------------------------------- */

  useEffect(() => {
    setSystemStatus("online");
  }, []);

  /* -------------------------------------------------------
     Sidebar state persistence
  ------------------------------------------------------- */

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("embrastic:sidebarOpen");

      if (saved !== null) {
        setSidebarOpen(saved === "true");
      }
    } catch {
      // Storage unavailable: keep the default.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("embrastic:sidebarOpen", String(sidebarOpen));
    } catch {
      // Storage unavailable: keep the default.
    }
  }, [sidebarOpen]);

  /* -------------------------------------------------------
     Auto-open the current group, close the mobile drawer
  ------------------------------------------------------- */

  useEffect(() => {
    setExpandedGroup(getActiveGroupId(pathname));
    setMobileSidebarOpen(false);
  }, [pathname]);

  /* -------------------------------------------------------
     Keyboard shortcuts
  ------------------------------------------------------- */

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const shortcut =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";

      if (shortcut) {
        event.preventDefault();
        setCommandPaletteOpen((current) => !current);
      }

      if (event.key === "Escape") {
        setCommandPaletteOpen(false);
        setMobileSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  /* -------------------------------------------------------
     Command palette results
  ------------------------------------------------------- */

  const commandResults = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();

    if (!query) {
      return allMenuItems;
    }

    return allMenuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.group.toLowerCase().includes(query)
    );
  }, [commandQuery]);

  /* -------------------------------------------------------
     Derived navigation state
  ------------------------------------------------------- */

  const breadcrumbGroup = menuGroups.find(
    (group) => group.id === getActiveGroupId(pathname)
  );

  function isActive(href: string) {
    return matchesPath(pathname, href);
  }

  function groupIsActive(group: MenuGroup) {
    return group.items.some((item) => isActive(item.href));
  }

  function toggleGroup(groupId: string) {
    setExpandedGroup((current) => (current === groupId ? null : groupId));
  }

  function toggleSidebar() {
    setSidebarOpen((current) => !current);
  }

  function toggleMobileSidebar() {
    setMobileSidebarOpen((current) => !current);
  }

  function closeCommandPalette() {
    setCommandPaletteOpen(false);
    setCommandQuery("");
  }

  function goToCommandResult(href: string) {
    closeCommandPalette();
    router.push(href);
  }

  /* -------------------------------------------------------
     Logout
  ------------------------------------------------------- */

  async function logout() {
    try {
      setLoggingOut(true);

      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        console.warn("Logout endpoint returned a non-success response.");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      router.replace("/login");
      router.refresh();
      setLoggingOut(false);
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={toggleMobileSidebar}
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-slate-950/50 md:hidden"
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        aria-label="Primary"
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/[0.06] bg-slate-950 text-slate-100 transition-[transform,width] duration-200 ${
          mobileSidebarOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full"
        } md:translate-x-0 md:shadow-none ${
          sidebarOpen ? "md:w-64" : "md:w-[72px]"
        }`}
      >
        {/* Brand */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-white/[0.06] ${
            full ? "gap-3 px-4" : "justify-center px-2"
          }`}
        >
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-white">
            <Image
              src="/EMBRASTICLogo.jpeg"
              alt="EMBRASTIC logo"
              fill
              priority
              sizes="36px"
              className="object-cover"
            />
          </div>

          {full && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold tracking-wide text-white">
                EMBRASTIC
              </div>
              <div className="truncate text-xs text-slate-400">
                Business OS
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="shrink-0 px-3 pt-4">
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="Search modules"
            title="Search modules (Ctrl K)"
            className={`flex h-9 items-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white ${focusRing} ${
              full ? "w-full gap-2 px-3" : "mx-auto w-9 justify-center"
            }`}
          >
            <Icon name="search" className="h-4 w-4" />

            {full && (
              <>
                <span className="flex-1 text-left text-sm">Search</span>
                <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-sans text-[10px] text-slate-500">
                  Ctrl K
                </kbd>
              </>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Modules"
          className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-4"
        >
          <div className="space-y-0.5">
            {menuGroups.map((group, groupIndex) => {
              const activeGroup = groupIsActive(group);
              const expanded = expandedGroup === group.id;

              if (!full) {
                return (
                  <div
                    key={group.id}
                    className={`space-y-0.5 ${
                      groupIndex > 0
                        ? "mt-2 border-t border-white/[0.06] pt-2"
                        : ""
                    }`}
                  >
                    {group.items.map((item) => {
                      const active = isActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={item.name}
                          aria-label={item.name}
                          aria-current={active ? "page" : undefined}
                          className={`relative flex h-10 items-center justify-center rounded-lg transition-colors ${focusRing} ${
                            active
                              ? "bg-white/[0.08] text-white"
                              : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                          }`}
                        >
                          {active && (
                            <span className="absolute inset-y-2 left-0 w-0.5 rounded-r bg-amber-400" />
                          )}
                          <Icon name={item.icon} />
                        </Link>
                      );
                    })}
                  </div>
                );
              }

              return (
                <div key={group.id}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={expanded}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-white/[0.05] hover:text-white ${focusRing} ${
                      activeGroup ? "text-white" : "text-slate-300"
                    }`}
                  >
                    <Icon
                      name={group.icon}
                      className={`h-[18px] w-[18px] ${
                        activeGroup ? "text-amber-400" : "text-slate-500"
                      }`}
                    />

                    <span className="min-w-0 flex-1 truncate">
                      {group.name}
                    </span>

                    <Icon
                      name="chevronRight"
                      className={`h-4 w-4 text-slate-500 transition-transform duration-150 ${
                        expanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {expanded && (
                    <div className="ml-[21px] mt-0.5 space-y-0.5 border-l border-white/10 pb-1 pl-3">
                      {group.items.map((item) => {
                        const active = isActive(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={`relative flex items-center rounded-md px-3 py-2 text-sm transition-colors ${focusRing} ${
                              active
                                ? "bg-white/[0.08] font-medium text-white"
                                : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                            }`}
                          >
                            {active && (
                              <span className="absolute -left-[13px] inset-y-1.5 w-0.5 rounded-full bg-amber-400" />
                            )}
                            <span className="truncate">{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="shrink-0 space-y-1 border-t border-white/[0.06] p-3">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className={`hidden h-9 items-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white md:flex ${focusRing} ${
              sidebarOpen ? "w-full gap-3 px-3" : "mx-auto w-9 justify-center"
            }`}
          >
            <Icon
              name={sidebarOpen ? "chevronsLeft" : "chevronsRight"}
              className="h-4 w-4"
            />
            {sidebarOpen && <span className="text-sm">Collapse</span>}
          </button>

          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            aria-label="Sign out"
            title="Sign out"
            className={`flex h-9 items-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white disabled:opacity-60 ${focusRing} ${
              full ? "w-full gap-3 px-3" : "mx-auto w-9 justify-center"
            }`}
          >
            <Icon name="logout" className="h-4 w-4" />
            {full && (
              <span className="text-sm">
                {loggingOut ? "Signing out…" : "Sign out"}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <main
        className={`min-h-screen transition-[margin] duration-200 ${
          sidebarOpen ? "md:ml-64" : "md:ml-[72px]"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            {/* Left */}
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={toggleMobileSidebar}
                aria-label="Open navigation"
                aria-expanded={mobileSidebarOpen}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 md:hidden ${focusRing}`}
              >
                <Icon name="menu" />
              </button>

              <nav
                aria-label="Breadcrumb"
                className="flex min-w-0 items-center gap-2"
              >
                {breadcrumbGroup && breadcrumbGroup.id !== "overview" && (
                  <>
                    <span className="hidden truncate text-sm text-slate-500 sm:inline">
                      {breadcrumbGroup.name}
                    </span>
                    <Icon
                      name="chevronRight"
                      className="hidden h-3.5 w-3.5 text-slate-300 sm:block"
                    />
                  </>
                )}

                <h1 className="truncate text-base font-semibold text-slate-900">
                  {pageTitle}
                </h1>
              </nav>
            </div>

            {/* Right */}
            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label="Search modules"
                title="Search modules (Ctrl K)"
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 ${focusRing}`}
              >
                <Icon name="search" />
              </button>

              <div
                className="hidden items-center gap-2 md:flex"
                role="status"
              >
                <span
                  className={`h-2 w-2 rounded-full ${statusStyles[systemStatus].dot}`}
                />
                <span className="text-xs text-slate-500">
                  {statusStyles[systemStatus].label}
                </span>
              </div>

              <div className="hidden h-6 w-px bg-slate-200 sm:block" />

              <div className="flex items-center gap-3">
                <div className="hidden text-right leading-tight sm:block">
                  <div className="text-sm font-medium text-slate-900">
                    {ownerName}
                  </div>
                  <div className="text-xs text-slate-500">{ownerTitle}</div>
                </div>

                <div
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white"
                >
                  {getInitials(ownerName)}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page */}
        <div id="main-content" className="min-h-[calc(100vh-4rem)]">
          <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </div>
      </main>

      {/* =================================================
          COMMAND PALETTE
      ================================================= */}

      {commandPaletteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search modules"
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24 sm:pt-32"
        >
          <button
            type="button"
            aria-label="Close search"
            onClick={closeCommandPalette}
            className="fixed inset-0 bg-slate-950/40"
          />

          <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
              <Icon name="search" className="h-4 w-4 text-slate-400" />

              <input
                value={commandQuery}
                onChange={(event) => setCommandQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && commandResults[0]) {
                    goToCommandResult(commandResults[0].href);
                  }
                }}
                autoFocus
                placeholder="Search modules"
                aria-label="Search modules"
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />

              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[10px] text-slate-500">
                Esc
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {commandResults.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-slate-500">
                  No modules match “{commandQuery.trim()}”.
                </div>
              ) : (
                commandResults.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => goToCommandResult(item.href)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 ${focusRing}`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                      <Icon name={item.icon} className="h-4 w-4" />
                    </span>

                    <span className="flex-1 truncate font-medium">
                      {item.name}
                    </span>

                    <span className="truncate text-xs text-slate-400">
                      {item.group}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

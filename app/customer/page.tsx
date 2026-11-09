"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  PackageCheck,
  Palette,
  Scissors,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  Truck,
  Upload,
} from "lucide-react";

/* =========================================================
   PRODUCT CATEGORIES
========================================================= */

const products = [
  {
    name: "Polo T-Shirts",
    description:
      "Premium polos customised with your company, team or brand logo.",
    href: "/customer/products?category=Polo%20T-Shirts",
    image:
      "https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&w=1200&q=88",
    tag: "POPULAR",
  },
  {
    name: "T-Shirts",
    description:
      "Comfortable custom T-shirts for businesses, events, teams and brands.",
    href: "/customer/products?category=T-Shirts",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=88",
    tag: "CUSTOMISE",
  },
  {
    name: "Corporate Shirts",
    description:
      "Professional embroidered shirts for offices, hospitality and teams.",
    href: "/customer/products?category=Corporate%20Shirts",
    image:
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1200&q=88",
    tag: "BUSINESS",
  },
  {
    name: "Hoodies & Sweatshirts",
    description:
      "Premium casual apparel customised with your embroidered branding.",
    href: "/customer/products?category=Hoodies",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=88",
    tag: "PREMIUM",
  },
  {
    name: "Caps",
    description:
      "Custom embroidered caps with front, side and back placement options.",
    href: "/customer/products?category=Caps",
    image:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1200&q=88",
    tag: "EMBROIDERY",
  },
  {
    name: "Jackets",
    description:
      "Professional branded jackets for corporate teams and workwear.",
    href: "/customer/products?category=Jackets",
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=88",
    tag: "WORKWEAR",
  },
];

/* =========================================================
   ORDER PROCESS
========================================================= */

const steps = [
  {
    number: "01",
    title: "Choose",
    subtitle: "Your garment",
    description:
      "Choose polos, T-shirts, shirts, jackets, caps or another product.",
    icon: Shirt,
  },
  {
    number: "02",
    title: "Customise",
    subtitle: "Sizes & placement",
    description:
      "Select colours, sizes, quantities and where your embroidery should go.",
    icon: Palette,
  },
  {
    number: "03",
    title: "Upload",
    subtitle: "Your logo",
    description:
      "Upload your company logo, artwork or design and add your instructions.",
    icon: Upload,
  },
  {
    number: "04",
    title: "Approve",
    subtitle: "Before production",
    description:
      "Review your embroidery design and approve it before we start production.",
    icon: CheckCircle2,
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function CustomerHomePage() {
  return (
    <main className="overflow-hidden bg-white text-slate-950">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#07101f]">
        <div className="absolute inset-0">
          <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px]" />
          <div className="absolute -right-40 top-0 h-[600px] w-[600px] rounded-full bg-cyan-400/10 blur-[150px]" />
        </div>

        <div className="relative mx-auto grid min-h-[720px] max-w-7xl gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:px-10 lg:py-20">
          {/* LEFT */}

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              Custom Embroidery & Branded Apparel
            </div>

            <h1 className="mt-7 max-w-3xl text-[3rem] font-black leading-[1] tracking-[-0.055em] text-white sm:text-6xl lg:text-[4.7rem]">
              Custom embroidered
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                apparel for your brand.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Choose your garments, add your logo, select sizes and quantities,
              approve your embroidery design and let EMBRASTIC handle
              production and delivery.
            </p>

            {/* SIMPLE EXPLANATION */}

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
              <HeroCheck text="Choose garments" />
              <HeroCheck text="Upload your logo" />
              <HeroCheck text="Approve the design" />
              <HeroCheck text="Track your order" />
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/customer/products"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-4 text-sm font-black text-white shadow-[0_15px_45px_rgba(37,99,235,.35)] transition hover:-translate-y-0.5 hover:bg-blue-500"
              >
                Choose Your Product
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-7 py-4 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/10"
              >
                How It Works
              </a>
            </div>

            <p className="mt-5 text-xs leading-5 text-slate-500">
              Need help deciding? You can configure your order before placing
              it.
            </p>
          </div>

          {/* PRODUCT VISUAL */}

          <div className="relative mx-auto w-full max-w-[570px] lg:max-w-none">
            <div className="absolute left-[10%] top-[10%] h-[75%] w-[75%] rounded-full bg-blue-500/20 blur-[100px]" />

            <div className="relative ml-auto aspect-[0.92] max-w-[570px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900 shadow-[0_45px_120px_rgba(0,0,0,.5)]">
              <img
                src="https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&w=1400&q=90"
                alt="Custom embroidered apparel"
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#07101f]/90 via-transparent to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="rounded-[1.5rem] border border-white/10 bg-[#07101f]/75 p-5 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white">
                      <Shirt className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.15em] text-blue-300">
                        Your garment + your logo
                      </div>

                      <div className="mt-1 text-lg font-black text-white">
                        Professionally embroidered.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FLOATING APPROVAL CARD */}

            <div className="absolute -bottom-5 right-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-2xl sm:right-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>

                <div>
                  <div className="text-xs font-black text-slate-950">
                    You approve it first
                  </div>

                  <div className="mt-0.5 text-[11px] text-slate-500">
                    Before production begins
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          QUICK TRUST STRIP
      ====================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 sm:px-8 lg:grid-cols-4 lg:px-10">
          <TrustItem
            icon={<Sparkles className="h-5 w-5" />}
            title="Professional Embroidery"
            text="Clean, premium finish"
          />

          <TrustItem
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Design Approval"
            text="Approve before production"
          />

          <TrustItem
            icon={<PackageCheck className="h-5 w-5" />}
            title="Quality Checked"
            text="Checked before dispatch"
          />

          <TrustItem
            icon={<Truck className="h-5 w-5" />}
            title="Order Tracking"
            text="Follow your order online"
          />
        </div>
      </section>

      {/* =====================================================
          WHAT DO YOU NEED?
      ====================================================== */}

      <section className="bg-[#f7f9fc]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              Start Here
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">
              What do you need?
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Whether you need garments as well as embroidery or already have
              your own garments, we can help.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {/* OPTION 1 */}

            <Link
              href="/customer/products"
              className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl sm:p-9"
            >
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-50 transition group-hover:bg-blue-100" />

              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <ShoppingBag className="h-6 w-6" />
                </div>

                <div className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                  OPTION 01
                </div>

                <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  I need garments
                  <br />+ embroidery
                </h3>

                <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">
                  Choose polos, T-shirts, shirts, jackets, caps and more. Then
                  customise them with your logo or design.
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  <SmallPill text="Choose garment" />
                  <SmallPill text="Select sizes" />
                  <SmallPill text="Add logo" />
                </div>

                <div className="mt-9 inline-flex items-center gap-2 text-sm font-black text-blue-600">
                  Shop Garments
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            {/* OPTION 2 */}

            <Link
              href="/customer/products?category=Embroidery"
              className="group relative overflow-hidden rounded-[2rem] bg-[#0b1526] p-7 shadow-xl transition duration-300 hover:-translate-y-1 sm:p-9"
            >
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-500/10 transition group-hover:bg-blue-500/20" />

              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-blue-300">
                  <Scissors className="h-6 w-6" />
                </div>

                <div className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                  OPTION 02
                </div>

                <h3 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  I already have
                  <br />
                  my garments
                </h3>

                <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
                  Send us your existing garments and we'll professionally
                  embroider your logo, name or design onto them.
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  <DarkPill text="Upload logo" />
                  <DarkPill text="Choose placement" />
                  <DarkPill text="Tell us quantity" />
                </div>

                <div className="mt-9 inline-flex items-center gap-2 text-sm font-black text-blue-300">
                  Embroidery Service
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          PRODUCTS
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              Choose Your Garment
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">
              What would you like
              <br />
              to customise?
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500">
              Select a garment to start building your custom embroidery order.
            </p>
          </div>

          <Link
            href="/customer/products"
            className="group inline-flex items-center gap-2 text-sm font-black text-slate-900"
          >
            See All Products
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-12 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.name}
              href={product.href}
              className="group"
            >
              <div className="relative aspect-[4/4.6] overflow-hidden rounded-[1.75rem] bg-slate-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.045]"
                />

                <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[9px] font-black tracking-[0.16em] text-slate-800 shadow-sm backdrop-blur">
                  {product.tag}
                </div>

                <div className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-950 opacity-0 shadow-xl transition duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              <div className="px-1 pt-5">
                <h3 className="text-lg font-black text-slate-950">
                  {product.name}
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  {product.description}
                </p>

                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-blue-600">
                  Customise
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}

      <section
        id="how-it-works"
        className="relative overflow-hidden bg-[#07101f]"
      >
        <div className="absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-400">
              How Ordering Works
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl">
              From your idea to
              <br />
              finished embroidery.
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
              No complicated forms. Build your order visually and we'll guide
              you through every step.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-sm transition hover:border-blue-500/30 hover:bg-white/[0.07]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="text-xs font-black tracking-[0.2em] text-slate-600">
                      {step.number}
                    </div>
                  </div>

                  <div className="mt-10 text-xl font-black text-white">
                    {step.title}
                  </div>

                  <div className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-blue-400">
                    {step.subtitle}
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-400">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* WE HANDLE REST */}

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <div className="grid gap-7 lg:grid-cols-[220px_1fr] lg:items-center">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-400">
                  Then
                </div>

                <div className="mt-2 text-xl font-black text-white">
                  We handle the rest.
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <WorkflowStep
                  icon={<Scissors className="h-4 w-4" />}
                  text="Digitizing"
                />

                <WorkflowStep
                  icon={<Shirt className="h-4 w-4" />}
                  text="Production"
                />

                <WorkflowStep
                  icon={<ShieldCheck className="h-4 w-4" />}
                  text="Quality Check"
                />

                <WorkflowStep
                  icon={<Truck className="h-4 w-4" />}
                  text="Delivery"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          APPROVAL / CONFIDENCE
      ====================================================== */}

      <section className="bg-[#f7f9fc]">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-10 lg:py-28">
          {/* VISUAL */}

          <div className="relative">
            <div className="overflow-hidden rounded-[2.5rem] bg-slate-200 shadow-[0_30px_80px_rgba(15,23,42,.12)]">
              <img
                src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1400&q=90"
                alt="Custom branded apparel"
                className="aspect-[1.08] h-full w-full object-cover"
              />
            </div>

            <div className="absolute -bottom-6 left-4 right-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-xl sm:left-8 sm:right-auto sm:max-w-[330px]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>

                <div>
                  <div className="text-sm font-black text-slate-950">
                    Design approved
                  </div>

                  <div className="mt-1 text-xs leading-5 text-slate-500">
                    Production starts only after you approve your embroidery
                    design.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT */}

          <div className="lg:pl-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              No Unwanted Surprises
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">
              See your design
              <br />
              before we stitch it.
            </h2>

            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-500 sm:text-base">
              Your artwork goes through our embroidery preparation process.
              You'll be able to review the design before your order moves into
              production.
            </p>

            <div className="mt-8 space-y-4">
              <Benefit text="Your artwork is prepared for embroidery" />
              <Benefit text="Review the design before production" />
              <Benefit text="Request changes when needed" />
              <Benefit text="Production starts after approval" />
            </div>

            <Link
              href="/customer/designs"
              className="group mt-9 inline-flex items-center gap-2 text-sm font-black text-blue-600"
            >
              View Design Approvals
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          TRACKING
      ====================================================== */}

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-10 lg:py-28">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <PackageCheck className="h-6 w-6" />
            </div>

            <p className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              Your Order. Your Account.
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">
              Know what's
              <br />
              happening next.
            </h2>

            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-500 sm:text-base">
              Once you've ordered, your EMBRASTIC account keeps everything
              together — orders, artwork approvals, production progress,
              dispatch and invoices.
            </p>

            <Link
              href="/customer/orders"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-black text-white transition hover:bg-blue-600"
            >
              View My Orders
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* TRACKING CARD */}

          <div className="rounded-[2.25rem] border border-slate-200 bg-[#f8fafc] p-4 shadow-[0_30px_80px_rgba(15,23,42,.08)] sm:p-7">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Example Order
                  </div>

                  <div className="mt-1 text-lg font-black text-slate-950">
                    Premium Polo — Logo Embroidery
                  </div>
                </div>

                <div className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">
                  Design Approval
                </div>
              </div>

              <div className="mt-8">
                <OrderStatus
                  title="Order Received"
                  description="Your custom order has been received."
                  state="done"
                />

                <OrderStatus
                  title="Artwork & Digitizing"
                  description="Your logo has been prepared for embroidery."
                  state="done"
                />

                <OrderStatus
                  title="Design Approval"
                  description="Your design is ready for your approval."
                  state="active"
                />

                <OrderStatus
                  title="Production"
                  description="Embroidery production starts after approval."
                  state="future"
                />

                <OrderStatus
                  title="Quality Check"
                  description="Your finished order is inspected before dispatch."
                  state="future"
                />

                <OrderStatus
                  title="Dispatched"
                  description="Delivery and tracking information appears here."
                  state="future"
                  last
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}

      <section className="bg-white px-5 pb-16 pt-6 sm:px-8 lg:px-10 lg:pb-24">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.75rem] bg-blue-600 px-7 py-14 sm:px-12 lg:px-16 lg:py-20">
          <div className="absolute -right-28 -top-32 h-96 w-96 rounded-full border-[70px] border-white/[0.06]" />
          <div className="absolute -bottom-40 left-[35%] h-96 w-96 rounded-full bg-cyan-300/15 blur-[90px]" />

          <div className="relative z-10 flex flex-col gap-9 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                Let's Create Something
              </p>

              <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                Ready to put your
                <br />
                brand on something?
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
                Choose your garment, upload your logo and build your custom
                embroidery order online.
              </p>
            </div>

            <Link
              href="/customer/products"
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black text-blue-700 shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Choose a Product
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-slate-200 bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <div className="text-xl font-black tracking-tight text-slate-950">
                EMBRASTIC
              </div>

              <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                Stitched to Stand Out
              </div>

              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
                Custom embroidered apparel for businesses, teams and brands.
              </p>
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-[0.15em] text-slate-950">
                Shop
              </div>

              <div className="mt-4 space-y-3 text-sm font-semibold text-slate-500">
                <FooterLink
                  href="/customer/products"
                  text="All Products"
                />

                <FooterLink
                  href="/customer/products?category=Polo%20T-Shirts"
                  text="Polo T-Shirts"
                />

                <FooterLink
                  href="/customer/products?category=Caps"
                  text="Caps"
                />

                <FooterLink
                  href="/customer/products?category=Embroidery"
                  text="Embroidery Service"
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-[0.15em] text-slate-950">
                Your Account
              </div>

              <div className="mt-4 space-y-3 text-sm font-semibold text-slate-500">
                <FooterLink
                  href="/customer/orders"
                  text="My Orders"
                />

                <FooterLink
                  href="/customer/designs"
                  text="Design Approvals"
                />

                <FooterLink
                  href="/customer/invoices"
                  text="Invoices"
                />

                <FooterLink
                  href="/customer/profile"
                  text="Profile"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-400">
            © 2026 EMBRASTIC. Stitched to Stand Out.
          </div>
        </div>
      </footer>

      
    </main>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function HeroCheck({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15">
        <Check className="h-3 w-3 text-blue-400" />
      </div>

      {text}
    </div>
  );
}

function TrustItem({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-[100px] items-center gap-3 border-b border-r border-slate-100 px-3 py-5 sm:px-5 lg:border-b-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <div>
        <div className="text-xs font-black text-slate-950">
          {title}
        </div>

        <div className="mt-1 text-[11px] leading-4 text-slate-400">
          {text}
        </div>
      </div>
    </div>
  );
}

function SmallPill({
  text,
}: {
  text: string;
}) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600">
      {text}
    </span>
  );
}

function DarkPill({
  text,
}: {
  text: string;
}) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold text-slate-300">
      {text}
    </span>
  );
}

function Benefit({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50">
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      </div>

      <span className="text-sm font-bold text-slate-700">
        {text}
      </span>
    </div>
  );
}

function WorkflowStep({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="text-blue-400">
        {icon}
      </div>

      <span className="text-xs font-bold text-slate-300">
        {text}
      </span>
    </div>
  );
}

function OrderStatus({
  title,
  description,
  state,
  last = false,
}: {
  title: string;
  description: string;
  state: "done" | "active" | "future";
  last?: boolean;
}) {
  const circle =
    state === "done"
      ? "bg-emerald-500 text-white"
      : state === "active"
        ? "bg-blue-600 text-white ring-4 ring-blue-100"
        : "border-2 border-slate-200 bg-white";

  return (
    <div className="relative flex gap-4">
      {!last && (
        <div
          className={`absolute left-[15px] top-8 h-[calc(100%-2px)] w-px ${
            state === "done"
              ? "bg-emerald-200"
              : "bg-slate-200"
          }`}
        />
      )}

      <div
        className={`relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${circle}`}
      >
        {state === "done" ? (
          <Check className="h-4 w-4" />
        ) : state === "active" ? (
          <div className="h-2 w-2 rounded-full bg-white" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-slate-200" />
        )}
      </div>

      <div className={last ? "" : "pb-7"}>
        <div
          className={`text-sm font-black ${
            state === "future"
              ? "text-slate-400"
              : "text-slate-950"
          }`}
        >
          {title}
        </div>

        <div className="mt-1 text-xs leading-5 text-slate-400">
          {description}
        </div>
      </div>
    </div>
  );
}

function FooterLink({
  href,
  text,
}: {
  href: string;
  text: string;
}) {
  return (
    <div>
      <Link
        href={href}
        className="transition hover:text-blue-600"
      >
        {text}
      </Link>
    </div>
  );
}
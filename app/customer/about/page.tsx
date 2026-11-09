import Link from "next/link";
import { Bricolage_Grotesque } from "next/font/google";
import {
  BadgeCheck,
  CheckCircle2,
  Circle,
  Layers3,
  PackageCheck,
  Palette,
  Scissors,
  ShieldCheck,
  Shirt,
  Sparkles,
  Target,
  Truck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

/* =========================================================
   DESIGN NOTES
   - Motif: the embroidery hoop and the running stitch. Dashed
     borders stand in for stitching; dashed circles are hoops.
   - One moment of motion: the chest logo stitches itself on
     page load (respects prefers-reduced-motion).
   - Palette: ink navy #0E1A3B, thread blue (blue-600),
     gold thread #F2B632, linen tint #F3F6FC.
========================================================= */

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
});

const capabilities = [
  {
    icon: Shirt,
    title: "Corporate & workwear",
    description:
      "Professional garments designed for teams, businesses, institutions and organisations.",
  },
  {
    icon: Sparkles,
    title: "Custom embroidery",
    description:
      "Turn your logo or artwork into professionally embroidered branding for your garments.",
  },
  {
    icon: Palette,
    title: "Brand customisation",
    description:
      "Choose garments, colours, sizes and embroidery placements to suit your brand.",
  },
  {
    icon: PackageCheck,
    title: "Bulk orders",
    description:
      "A streamlined ordering experience for multi-size team and organisational requirements.",
  },
];

const process = [
  {
    title: "Choose your products",
    description:
      "Browse the EMBRASTIC catalogue and select garments suited to your team or requirement.",
  },
  {
    title: "Configure your order",
    description:
      "Select colours, enter size-wise quantities and choose the required embroidery placement.",
  },
  {
    title: "Submit your artwork",
    description:
      "Upload your logo or design with the order so our team can prepare it for embroidery.",
  },
  {
    title: "Artwork and approval",
    description:
      "The design moves through artwork preparation and approval before production begins.",
  },
  {
    title: "Production",
    description:
      "Approved requirements move into embroidery, production and quality control.",
  },
  {
    title: "Dispatch",
    description:
      "Your completed order is prepared for dispatch and tracked through delivery.",
  },
];

const principles = [
  {
    icon: Target,
    title: "Made around your requirement",
    description:
      "Every organisation is different. Our ordering process is built around product, size, colour and branding requirements rather than a one-size-fits-all checkout.",
  },
  {
    icon: BadgeCheck,
    title: "Brand consistency",
    description:
      "Artwork, placement and garment specifications stay connected to the order so your branding requirements remain clear throughout production.",
  },
  {
    icon: ShieldCheck,
    title: "Controlled workflow",
    description:
      "Orders move through defined stages from submission and artwork through production, quality control and dispatch.",
  },
];

const heroHighlights = [
  { icon: Shirt, label: "Garments" },
  { icon: Scissors, label: "Embroidery" },
  { icon: Layers3, label: "Customisation" },
  { icon: Truck, label: "Fulfilment" },
];

const trackerStages = [
  { label: "Order received", state: "done" },
  { label: "Artwork approved", state: "done" },
  { label: "Embroidery in progress", state: "current" },
  { label: "Quality check", state: "todo" },
  { label: "Dispatch", state: "todo" },
] as const;

const sampleSizes = [
  { size: "S", qty: 10 },
  { size: "M", qty: 20 },
  { size: "L", qty: 15 },
  { size: "XL", qty: 5 },
];

const container = "mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10";
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600";

export default function CustomerAboutPage() {
  return (
    <main className="min-h-screen bg-white text-[#0E1A3B]">
      <style>{`
        @keyframes stitch-draw {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        .stitch-draw {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: stitch-draw 2.6s ease-in-out 0.5s forwards;
        }
        .stitch-draw-late { animation-delay: 2.4s; animation-duration: 1.2s; }
        @media (prefers-reduced-motion: reduce) {
          .stitch-draw { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>

      {/* =====================================================
          HERO
      ====================================================== */}
      <section
        className="relative overflow-hidden bg-[#F3F6FC]"
        style={{
          backgroundImage:
            "radial-gradient(#C9D4EE 1.2px, transparent 1.2px)",
          backgroundSize: "20px 20px",
        }}
      >
        <div className={`${container} py-16 sm:py-20 lg:py-28`}>
          <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <h1
                className={`${display.className} max-w-2xl text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-7xl`}
              >
                Your logo, stitched onto every team uniform.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                Choose your garments, enter size-wise quantities, upload your
                artwork and follow the order from approval to delivery. All in
                one place.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/customer/products"
                  className={`inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-8 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 ${focusRing}`}
                >
                  Browse products
                </Link>

                <a
                  href="#how-it-works"
                  className={`inline-flex h-12 items-center justify-center rounded-full border-2 border-dashed border-[#0E1A3B]/30 bg-white/70 px-8 text-sm font-bold text-[#0E1A3B] transition hover:border-blue-600 hover:text-blue-600 ${focusRing}`}
                >
                  See how ordering works
                </a>
              </div>

              <ul className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-slate-600">
                {heroHighlights.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-blue-600" aria-hidden />
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            {/* HERO VISUAL: stitched polo */}
            <div className="relative mx-auto w-full max-w-[460px] pb-10 lg:mx-0 lg:justify-self-end">
              <div className="relative rounded-[40px] bg-white p-7 shadow-[0_40px_90px_-40px_rgba(14,26,59,0.45)]">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-3 rounded-[30px] border-2 border-dashed border-blue-200"
                />

                <svg
                  viewBox="0 0 400 420"
                  role="img"
                  aria-label="Navy polo shirt with an embroidered E logo on the chest"
                  className="relative mx-auto block w-full"
                >
                  <defs>
                    <mask
                      id="reveal-ring"
                      maskUnits="userSpaceOnUse"
                      x="0"
                      y="0"
                      width="400"
                      height="420"
                    >
                      <circle
                        className="stitch-draw"
                        pathLength={1}
                        cx="252"
                        cy="178"
                        r="30"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="8"
                      />
                    </mask>
                    <mask
                      id="reveal-e"
                      maskUnits="userSpaceOnUse"
                      x="0"
                      y="0"
                      width="400"
                      height="420"
                    >
                      <path
                        className="stitch-draw stitch-draw-late"
                        pathLength={1}
                        d="M262 164 H243 V192 H262 M243 178 H258"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="8"
                      />
                    </mask>
                  </defs>

                  {/* body + sleeves */}
                  <path
                    d="M130 40 L60 80 L20 150 L75 182 L100 150 L100 380 Q100 395 115 395 L285 395 Q300 395 300 380 L300 150 L325 182 L380 150 L340 80 L270 40 Q250 72 200 72 Q150 72 130 40 Z"
                    fill="#1B2B5E"
                  />
                  {/* stitched hem */}
                  <path
                    d="M108 374 H292"
                    stroke="#fff"
                    strokeOpacity="0.28"
                    strokeWidth="2"
                    strokeDasharray="7 6"
                    strokeLinecap="round"
                  />
                  {/* collar */}
                  <path
                    d="M130 40 Q152 78 200 78 Q248 78 270 40 L246 30 Q226 54 200 56 Q174 54 154 30 Z"
                    fill="#2C3F80"
                  />
                  {/* placket */}
                  <path
                    d="M200 78 V148"
                    stroke="#0E1A3B"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  <circle cx="200" cy="100" r="3.5" fill="#fff" />
                  <circle cx="200" cy="124" r="3.5" fill="#fff" />

                  {/* embroidered logo */}
                  <circle
                    cx="252"
                    cy="178"
                    r="30"
                    fill="#fff"
                    fillOpacity="0.06"
                  />
                  <circle
                    cx="252"
                    cy="178"
                    r="30"
                    fill="none"
                    stroke="#F2B632"
                    strokeWidth="3"
                    strokeDasharray="7 5"
                    strokeLinecap="round"
                    mask="url(#reveal-ring)"
                  />
                  <path
                    d="M262 164 H243 V192 H262 M243 178 H258"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="3.5"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    mask="url(#reveal-e)"
                  />
                </svg>

                <div className="relative mt-2 flex items-center gap-3 px-1">
                  <div className="flex -space-x-1.5" aria-hidden>
                    {["#0E1A3B", "#2563EB", "#F2B632", "#D64545", "#FFFFFF"].map(
                      (c) => (
                        <span
                          key={c}
                          className="h-6 w-6 rounded-full ring-2 ring-white"
                          style={{
                            backgroundColor: c,
                            boxShadow: "inset 0 0 0 1px rgba(14,26,59,0.15)",
                          }}
                        />
                      )
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    Thread and garment colours to match your brand
                  </span>
                </div>
              </div>

              {/* hang tag */}
              <div className="absolute -bottom-0 right-2 w-[210px] rounded-2xl bg-[#0E1A3B] p-4 text-white shadow-xl sm:-right-6">
                <div className="text-xs font-semibold text-blue-300">
                  Example order
                </div>
                <div
                  className={`${display.className} mt-0.5 text-base font-bold`}
                >
                  Team polo, size-wise
                </div>
                <div className="mt-3 flex gap-1.5">
                  {sampleSizes.map((s) => (
                    <div
                      key={s.size}
                      className="flex-1 rounded-lg bg-white/10 py-1.5 text-center"
                    >
                      <div className="text-[10px] font-semibold text-slate-300">
                        {s.size}
                      </div>
                      <div className="text-sm font-bold">{s.qty}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          WHO WE ARE
      ====================================================== */}
      <section className="bg-white">
        <div className={`${container} py-20 lg:py-28`}>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-24">
            <h2
              className={`${display.className} text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl`}
            >
              More than putting a logo on a garment.
            </h2>

            <div className="max-w-[60ch] space-y-6 text-base leading-8 text-slate-600">
              <p className="text-xl leading-9 text-slate-800">
                EMBRASTIC makes customised apparel ordering clearer and more
                organised for businesses, teams and institutions.
              </p>
              <p>
                Instead of separating garments, size requirements, artwork and
                embroidery instructions across different conversations, the
                EMBRASTIC customer experience brings them together as part of
                one order.
              </p>
              <p>
                That means your team can select what it needs, provide
                size-wise quantities, specify branding requirements and follow
                the order as it moves from artwork through production and
                dispatch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          WHAT WE DO
      ====================================================== */}
      <section className="bg-[#F3F6FC]">
        <div className={`${container} py-20 lg:py-28`}>
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-24">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <h2
                className={`${display.className} text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl`}
              >
                Apparel built around your organisation.
              </h2>
              <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
                Products and customisation come together through a workflow
                designed for real business ordering.
              </p>
            </div>

            <ul className="divide-y-2 divide-dashed divide-slate-300 border-y-2 border-dashed border-slate-300">
              {capabilities.map((item) => (
                <li
                  key={item.title}
                  className="group flex gap-5 py-7 sm:gap-7 sm:py-8"
                >
                  <Hoop icon={item.icon} />
                  <div>
                    <h3
                      className={`${display.className} text-xl font-bold tracking-tight`}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-[52ch] text-base leading-7 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* =====================================================
          THE APPROACH
      ====================================================== */}
      <section className="bg-white">
        <div className={`${container} py-20 lg:py-28`}>
          <div className="max-w-2xl">
            <h2
              className={`${display.className} text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl`}
            >
              Keep every detail connected to the order.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              Custom apparel has a lot of moving parts. EMBRASTIC keeps those
              details visible from the moment an order is configured until it
              is delivered.
            </p>
          </div>

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {principles.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="border-t-2 border-dashed border-slate-300 pt-6"
                >
                  <Icon className="h-7 w-7 text-blue-600" aria-hidden />
                  <h3
                    className={`${display.className} mt-5 text-xl font-bold tracking-tight`}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-slate-600">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="relative mt-16 overflow-hidden rounded-[32px] bg-[#0E1A3B] p-8 text-white sm:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-3 rounded-[24px] border-2 border-dashed border-white/15"
            />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-blue-300/60 text-blue-300">
                <UsersRound className="h-7 w-7" aria-hidden />
              </span>
              <div>
                <h3
                  className={`${display.className} text-2xl font-bold tracking-tight sm:text-3xl`}
                >
                  Designed for teams
                </h3>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                  Size-wise quantities, branding instructions and order
                  tracking make the experience practical for organisations
                  ordering for multiple people.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}
      <section id="how-it-works" className="scroll-mt-16 bg-[#0E1A3B] text-white">
        <div className={`${container} py-20 lg:py-28`}>
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <h2
                className={`${display.className} text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl`}
              >
                From product selection to delivery.
              </h2>
              <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
                A clear path for customised orders, from the customer portal
                through EMBRASTIC production.
              </p>
            </div>

            <ol className="relative">
              <div
                aria-hidden
                className="absolute bottom-5 left-[19px] top-5 border-l-2 border-dashed border-white/25"
              />
              {process.map((step, i) => (
                <li key={step.title} className="relative pb-10 pl-16 last:pb-0">
                  <span
                    className={`${display.className} absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold ring-4 ring-[#0E1A3B]`}
                  >
                    {i + 1}
                  </span>
                  <h3
                    className={`${display.className} pt-1.5 text-xl font-bold tracking-tight`}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-[52ch] text-base leading-7 text-slate-300">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* =====================================================
          ORDER TO PRODUCTION
      ====================================================== */}
      <section className="bg-[#F3F6FC]">
        <div className={`${container} py-20 lg:py-28`}>
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
            <div>
              <h2
                className={`${display.className} text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl`}
              >
                Your order does not stop at checkout.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
                Requirements move into the EMBRASTIC workflow for artwork,
                production, quality control and fulfilment, connected to the
                order you placed.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  "Size-wise order requirements",
                  "Artwork linked to customised orders",
                  "Defined production stages",
                  "Customer order tracking",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-base font-semibold"
                  >
                    <CheckCircle2
                      className="h-5 w-5 shrink-0 text-blue-600"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* tracker mock */}
            <div className="relative mx-auto w-full max-w-md rounded-[28px] bg-white p-7 shadow-[0_30px_70px_-35px_rgba(14,26,59,0.4)] sm:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-2.5 rounded-[20px] border-2 border-dashed border-blue-100"
              />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">
                      Example order
                    </div>
                    <div
                      className={`${display.className} mt-0.5 text-xl font-bold`}
                    >
                      Team polo order
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    In production
                  </span>
                </div>

                <div
                  className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-valuenow={50}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Example order progress"
                >
                  <div className="h-full w-1/2 rounded-full bg-blue-600" />
                </div>

                <ol className="mt-7 space-y-5">
                  {trackerStages.map((stage) => (
                    <li key={stage.label} className="flex items-center gap-3">
                      {stage.state === "done" && (
                        <CheckCircle2
                          className="h-5 w-5 shrink-0 text-blue-600"
                          aria-hidden
                        />
                      )}
                      {stage.state === "current" && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[#F2B632]">
                          <span className="h-2 w-2 rounded-full bg-[#F2B632]" />
                        </span>
                      )}
                      {stage.state === "todo" && (
                        <Circle
                          className="h-5 w-5 shrink-0 text-slate-300"
                          aria-hidden
                        />
                      )}
                      <span
                        className={
                          stage.state === "todo"
                            ? "text-sm font-medium text-slate-400"
                            : "text-sm font-bold"
                        }
                      >
                        {stage.label}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
      ====================================================== */}
      <section className="bg-white">
        <div className={`${container} py-20 lg:py-24`}>
          <div className="relative overflow-hidden rounded-[36px] bg-blue-600 px-6 py-16 text-center text-white sm:px-12 sm:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-3.5 rounded-[26px] border-2 border-dashed border-white/35"
            />
            <div className="relative">
              <h2
                className={`${display.className} mx-auto max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl`}
              >
                Ready to build your next branded order?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-blue-100">
                Browse the catalogue, configure your requirements and submit
                your order through the EMBRASTIC customer portal.
              </p>
              <Link
                href="/customer/products"
                className={`mt-9 inline-flex h-12 items-center justify-center rounded-full bg-white px-9 text-sm font-bold text-blue-700 shadow-lg shadow-blue-900/20 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600`}
              >
                Browse products
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

/** Icon inside a stitched circle, like an embroidery hoop. */
function Hoop({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-blue-400 bg-white text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
      <Icon className="h-6 w-6" aria-hidden />
    </span>
  );
}

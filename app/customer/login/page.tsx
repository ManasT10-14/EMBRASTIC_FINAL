"use client";

import Link from "next/link";
import {
  FormEvent,
  Suspense,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

/* =========================================================
   PAGE

   Next.js 16 requires useSearchParams() to live below
   a Suspense boundary.
========================================================= */

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <CustomerLoginContent />
    </Suspense>
  );
}

/* =========================================================
   LOGIN CONTENT
========================================================= */

function CustomerLoginContent() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * We don't need useEffect here.
   * searchParams is already available inside this
   * Suspense-protected component.
   */

  const registered =
    searchParams.get(
      "registered"
    ) === "1";

  /*
   * Checkout sends:
   *
   * /customer/login?next=/customer/checkout
   *
   * After login we return the customer there.
   */

  const requestedNext =
    searchParams.get("next");

  /*
   * SECURITY:
   *
   * Only allow redirects to our own /customer routes.
   * This prevents an external redirect such as:
   *
   * ?next=https://bad-site.example
   */

  const nextPath =
    requestedNext &&
    requestedNext.startsWith(
      "/customer"
    ) &&
    !requestedNext.startsWith(
      "//"
    )
      ? requestedNext
      : "/customer";

  /* =====================================================
     LOGIN
  ====================================================== */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    if (!cleanEmail) {
      setError(
        "Please enter your email address."
      );

      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await fetch(
          "/api/customer-auth/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email: cleanEmail,
              password,
            }),
          }
        );

      /*
       * Read as text first so a server error page
       * doesn't produce an unhelpful JSON parse error.
       */

      const text =
        await response.text();

      let data: {
        success?: boolean;
        message?: string;
      } | null = null;

      try {
        data = text
          ? JSON.parse(text)
          : null;
      } catch {
        throw new Error(
          "The login service returned an invalid response."
        );
      }

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to sign in."
        );
      }

      /*
       * IMPORTANT:
       *
       * Return to checkout when the customer came
       * from checkout.
       *
       * Otherwise go to the customer home page.
       */

      router.replace(
        nextPath
      );

      router.refresh();
    } catch (err) {
      console.error(
        "Customer login error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     UI
  ====================================================== */

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          {/* =========================================
              BRAND
          ========================================== */}

          <div className="mb-8 text-center">
            <Link
              href="/customer"
              className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
            >
              EMBRASTIC Customer
              Portal
            </Link>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Welcome back
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
              Sign in to place
              orders, track
              production, approve
              designs and view your
              EMBRASTIC account.
            </p>
          </div>

          {/* =========================================
              LOGIN CARD
          ========================================== */}

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="p-6 sm:p-8">
              {/* REGISTRATION SUCCESS */}

              {registered && (
                <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">
                      ✓
                    </div>

                    <div>
                      <div className="text-sm font-extrabold text-emerald-800">
                        Account created
                        successfully
                      </div>

                      <p className="mt-1 text-sm leading-5 text-emerald-700">
                        Your EMBRASTIC
                        customer account
                        is ready. Sign in
                        using the email
                        and password you
                        just created.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* CHECKOUT MESSAGE */}

              {nextPath ===
                "/customer/checkout" && (
                <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <div className="text-sm font-extrabold text-blue-800">
                    Your order is
                    waiting
                  </div>

                  <p className="mt-1 text-sm leading-5 text-blue-700">
                    Sign in to your
                    customer account and
                    we'll take you
                    straight back to
                    checkout.
                  </p>
                </div>
              )}

              {/* =====================================
                  LOGIN FORM
              ====================================== */}

              <form
                onSubmit={
                  handleSubmit
                }
              >
                {/* EMAIL */}

                <label className="block">
                  <div className="mb-2 text-sm font-bold text-slate-700">
                    Email Address

                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </div>

                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(
                      event
                    ) =>
                      setEmail(
                        event.target
                          .value
                      )
                    }
                    placeholder="you@company.com"
                    disabled={
                      loading
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                </label>

                {/* PASSWORD */}

                <label className="mt-5 block">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">
                      Password

                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      value={
                        password
                      }
                      onChange={(
                        event
                      ) =>
                        setPassword(
                          event.target
                            .value
                        )
                      }
                      placeholder="Enter your password"
                      disabled={
                        loading
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (
                            current
                          ) =>
                            !current
                        )
                      }
                      disabled={
                        loading
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>
                  </div>
                </label>

                {/* ERROR */}

                {error && (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <div className="flex gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-black text-red-700">
                        !
                      </div>

                      <div>
                        <div className="text-sm font-extrabold text-red-800">
                          Sign in failed
                        </div>

                        <div className="mt-1 text-sm leading-5 text-red-700">
                          {error}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SIGN IN */}

                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}

                  {loading
                    ? "Signing In..."
                    : nextPath ===
                        "/customer/checkout"
                      ? "Sign In & Continue"
                      : "Sign In"}
                </button>
              </form>
            </div>

            {/* =========================================
                CREATE ACCOUNT
            ========================================== */}

            <div className="border-t border-slate-200 bg-slate-50 p-6 sm:p-8">
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">
                  New to
                  EMBRASTIC?
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Create your
                  customer account to
                  start placing and
                  tracking orders
                  online.
                </p>

                <Link
                  href={
                    nextPath ===
                    "/customer/checkout"
                      ? `/customer/register?next=${encodeURIComponent(
                          nextPath
                        )}`
                      : "/customer/register"
                  }
                  className="mt-4 block w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  Create an Account
                </Link>
              </div>
            </div>
          </div>

          {/* =========================================
              FOOTER
          ========================================== */}

          <div className="mt-7 text-center">
            <p className="text-xs text-slate-400">
              EMBRASTIC

              <span className="mx-2">
                •
              </span>

              Stitched to Stand
              Out
            </p>

            <Link
              href="/customer"
              className="mt-3 inline-block text-xs font-bold text-slate-500 transition hover:text-blue-600"
            >
              ← Back to store
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   SUSPENSE FALLBACK
========================================================= */

function LoginLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto h-8 w-56 animate-pulse rounded-full bg-slate-200" />

            <div className="mx-auto mt-5 h-10 w-52 animate-pulse rounded-xl bg-slate-200" />

            <div className="mx-auto mt-3 h-5 w-72 max-w-full animate-pulse rounded-lg bg-slate-200" />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="h-11 animate-pulse rounded-xl bg-slate-100" />

            <div className="mt-5 h-11 animate-pulse rounded-xl bg-slate-100" />

            <div className="mt-6 h-12 animate-pulse rounded-xl bg-slate-200" />
          </div>
        </div>
      </div>
    </main>
  );
}
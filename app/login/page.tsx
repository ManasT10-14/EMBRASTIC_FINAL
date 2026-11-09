"use client";

import {
  FormEvent,
  useState,
} from "react";

import Image from "next/image";

import {
  useRouter,
} from "next/navigation";

export default function LoginPage() {
  const router =
    useRouter();

  const [
    username,
    setUsername,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !username.trim() ||
      !password
    ) {
      setError(
        "Enter your username and password."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/auth/login",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                username:
                  username.trim(),

                password,
              }),
          }
        );

      let data: any = {};

      try {
        data =
          await response.json();
      } catch {
        setError(
          "The login service returned an invalid response."
        );

        return;
      }

      /*
       * IMPORTANT:
       *
       * Do NOT throw an Error here.
       * Wrong credentials are a normal form error,
       * not a Next.js application crash.
       */
      if (
        !response.ok ||
        !data?.success
      ) {
        setError(
          data?.message ||
            "Invalid username or password."
        );

        return;
      }

      /*
       * Cookie has been created by the server.
       */
      router.replace(
        "/protected"
      );

      router.refresh();
    } catch (
      error
    ) {
      console.error(
        "Login request error:",
        error
      );

      setError(
        "Unable to contact the login service. Make sure the EMBRASTIC server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">

      {/* BACKGROUND */}

      <div className="pointer-events-none absolute inset-0">

        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-700/20 blur-3xl" />

        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",

            backgroundSize:
              "32px 32px",
          }}
        />

      </div>

      {/* PAGE */}

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">

        <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl lg:grid-cols-[0.95fr_1.05fr]">

          {/* =============================================
              BRAND SIDE
          ============================================= */}

          <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">

            <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />

            <div className="relative">

              <div className="flex items-center gap-4">

                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white shadow-xl">

                  <Image
                    src="/EMBRASTICLogo.jpeg"
                    alt="EMBRASTIC"
                    width={64}
                    height={64}
                    priority
                    className="h-full w-full object-cover"
                  />

                </div>

                <div>

                  <div className="text-xl font-black tracking-[0.08em]">
                    EMBRASTIC
                  </div>

                  <div className="mt-1 text-[10px] font-black tracking-[0.22em] text-amber-400">
                    STITCHED TO STAND OUT
                  </div>

                </div>

              </div>

              <div className="mt-16">

                <div className="mb-4 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">
                  BUSINESS OPERATIONS PLATFORM
                </div>

                <h1 className="max-w-md text-4xl font-black leading-tight tracking-tight">
                  Your embroidery business,
                  connected end to end.
                </h1>

                <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
                  Manage customers, quotations, artwork, digitizing,
                  production, quality control, dispatch, invoicing and
                  payments from one workspace.
                </p>

              </div>

            </div>

            <div className="relative">

              <div className="grid grid-cols-3 gap-3">

                <BrandFeature
                  icon="🧵"
                  title="Production"
                />

                <BrandFeature
                  icon="✅"
                  title="Quality"
                />

                <BrandFeature
                  icon="📊"
                  title="Business"
                />

              </div>

              <div className="mt-8 border-t border-white/10 pt-5 text-xs text-slate-500">
                EMBRASTIC Custom Embroidery & Apparel
              </div>

            </div>

          </section>

          {/* =============================================
              LOGIN SIDE
          ============================================= */}

          <section className="flex min-h-[620px] items-center justify-center bg-white px-6 py-10 sm:px-10 lg:px-14">

            <div className="w-full max-w-sm">

              {/* MOBILE BRAND */}

              <div className="mb-10 text-center lg:hidden">

                <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border bg-white shadow-lg">

                  <Image
                    src="/EMBRASTICLogo.jpeg"
                    alt="EMBRASTIC"
                    width={80}
                    height={80}
                    priority
                    className="h-full w-full object-cover"
                  />

                </div>

                <div className="mt-4 text-xl font-black tracking-wide text-slate-950">
                  EMBRASTIC
                </div>

                <div className="mt-1 text-[10px] font-black tracking-[0.2em] text-amber-600">
                  STITCHED TO STAND OUT
                </div>

              </div>

              {/* HEADER */}

              <div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                  🔐
                </div>

                <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sign in to access EMBRASTIC Business OS.
                </p>

              </div>

              {/* FORM */}

              <form
                onSubmit={
                  handleSubmit
                }
                className="mt-8 space-y-5"
              >

                {/* USERNAME */}

                <div>

                  <label
                    htmlFor="username"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Username
                  </label>

                  <div className="relative">

                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      👤
                    </div>

                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      autoFocus
                      value={
                        username
                      }
                      onChange={(e) => {
                        setUsername(
                          e.target.value
                        );

                        if (
                          error
                        ) {
                          setError(
                            ""
                          );
                        }
                      }}
                      placeholder="Enter your username"
                      disabled={
                        loading
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                    />

                  </div>

                </div>

                {/* PASSWORD */}

                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <label
                      htmlFor="password"
                      className="block text-sm font-bold text-slate-700"
                    >
                      Password
                    </label>

                    <span className="text-xs font-medium text-slate-400">
                      Secure access
                    </span>

                  </div>

                  <div className="relative">

                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      🔑
                    </div>

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      value={
                        password
                      }
                      onChange={(e) => {
                        setPassword(
                          e.target.value
                        );

                        if (
                          error
                        ) {
                          setError(
                            ""
                          );
                        }
                      }}
                      placeholder="Enter your password"
                      disabled={
                        loading
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
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
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-xs font-bold text-blue-700"
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>

                </div>

                {/* ERROR */}

                {error && (

                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                    <span>
                      ⚠️
                    </span>

                    <div className="text-sm font-semibold leading-5 text-red-700">
                      {error}
                    </div>

                  </div>

                )}

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <span>
                        →
                      </span>
                    </>
                  )}
                </button>

              </form>

              {/* FOOTER */}

              <div className="mt-8 border-t border-slate-100 pt-5">

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">

                  <span>
                    🔒
                  </span>

                  <span>
                    Authorized users only
                  </span>

                </div>

              </div>

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}

/* =========================================================
   SMALL BRAND COMPONENT
========================================================= */

function BrandFeature({
  icon,
  title,
}: {
  icon: string;

  title: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">

      <div className="text-lg">
        {icon}
      </div>

      <div className="mt-2 text-xs font-bold text-slate-300">
        {title}
      </div>

    </div>
  );
}
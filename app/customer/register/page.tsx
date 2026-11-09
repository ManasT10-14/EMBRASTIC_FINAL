"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type RegistrationForm = {
  name: string;
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstNumber: string;

  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  billingCountry: string;

  password: string;
  confirmPassword: string;
};

const initialForm: RegistrationForm = {
  name: "",
  businessName: "",
  contactPerson: "",
  phone: "",
  email: "",
  gstNumber: "",

  billingAddress: "",
  billingCity: "",
  billingState: "",
  billingPostalCode: "",
  billingCountry: "India",

  password: "",
  confirmPassword: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export default function CustomerRegisterPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<RegistrationForm>(initialForm);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  function updateField(
    field: keyof RegistrationForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError(
        "Please enter your name."
      );
      return;
    }

    if (!form.phone.trim()) {
      setError(
        "Please enter your mobile number."
      );
      return;
    }

    if (!form.email.trim()) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    if (form.password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/customer-auth/register",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(form),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to create your account."
        );
      }

      setSuccess(
        "Account created successfully. Taking you to sign in..."
      );

      setForm(initialForm);

      window.setTimeout(() => {
        router.push(
          "/customer/login?registered=1"
        );
      }, 1200);
    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">
            EMBRASTIC Customer Portal
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Create your account
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Register to place embroidery
            orders, track progress, approve
            designs and view your invoices.
          </p>

          <p className="mt-5 text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/customer/login"
              className="font-extrabold text-blue-600 transition hover:text-blue-800"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* =====================================================
            FORM
        ====================================================== */}

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >

          {/* =================================================
              SECTION 1 - CUSTOMER DETAILS
          ================================================== */}

          <section className="border-b border-slate-200 p-5 sm:p-8">
            <SectionHeading
              number="1"
              title="Your details"
              description="Tell us who we will be working with."
            />

            <div className="mt-6 grid gap-5 sm:grid-cols-2">

              <Field
                label="Your Name"
                required
              >
                <input
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="Enter your full name"
                  className={inputClass}
                />
              </Field>

              <Field label="Business Name">
                <input
                  type="text"
                  autoComplete="organization"
                  value={
                    form.businessName
                  }
                  onChange={(event) =>
                    updateField(
                      "businessName",
                      event.target.value
                    )
                  }
                  placeholder="Company name (optional)"
                  className={inputClass}
                />
              </Field>

              <Field label="Contact Person">
                <input
                  type="text"
                  value={
                    form.contactPerson
                  }
                  onChange={(event) =>
                    updateField(
                      "contactPerson",
                      event.target.value
                    )
                  }
                  placeholder="Main contact person"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Mobile Number"
                required
              >
                <input
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) =>
                    updateField(
                      "phone",
                      event.target.value
                    )
                  }
                  placeholder="+91 98765 43210"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Email Address"
                required
              >
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value
                    )
                  }
                  placeholder="you@company.com"
                  className={inputClass}
                />
              </Field>

              <Field label="GST Number">
                <input
                  type="text"
                  value={form.gstNumber}
                  onChange={(event) =>
                    updateField(
                      "gstNumber",
                      event.target.value.toUpperCase()
                    )
                  }
                  placeholder="GSTIN (optional)"
                  className={inputClass}
                />
              </Field>

            </div>
          </section>

          {/* =================================================
              SECTION 2 - BILLING ADDRESS
          ================================================== */}

          <section className="border-b border-slate-200 p-5 sm:p-8">
            <SectionHeading
              number="2"
              title="Billing address"
              description="We'll use this as your default billing and delivery address. You can use a different delivery address when placing an order."
            />

            <div className="mt-6 grid gap-5 sm:grid-cols-2">

              <div className="sm:col-span-2">
                <Field label="Address">
                  <textarea
                    rows={3}
                    autoComplete="street-address"
                    value={
                      form.billingAddress
                    }
                    onChange={(event) =>
                      updateField(
                        "billingAddress",
                        event.target.value
                      )
                    }
                    placeholder="Building, street, area"
                    className={
                      inputClass +
                      " resize-none"
                    }
                  />
                </Field>
              </div>

              <Field label="City">
                <input
                  type="text"
                  autoComplete="address-level2"
                  value={
                    form.billingCity
                  }
                  onChange={(event) =>
                    updateField(
                      "billingCity",
                      event.target.value
                    )
                  }
                  placeholder="City"
                  className={inputClass}
                />
              </Field>

              <Field label="State">
                <input
                  type="text"
                  autoComplete="address-level1"
                  value={
                    form.billingState
                  }
                  onChange={(event) =>
                    updateField(
                      "billingState",
                      event.target.value
                    )
                  }
                  placeholder="State"
                  className={inputClass}
                />
              </Field>

              <Field label="PIN / Postal Code">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={
                    form.billingPostalCode
                  }
                  onChange={(event) =>
                    updateField(
                      "billingPostalCode",
                      event.target.value
                    )
                  }
                  placeholder="PIN code"
                  className={inputClass}
                />
              </Field>

              <Field label="Country">
                <input
                  type="text"
                  autoComplete="country-name"
                  value={
                    form.billingCountry
                  }
                  onChange={(event) =>
                    updateField(
                      "billingCountry",
                      event.target.value
                    )
                  }
                  placeholder="Country"
                  className={inputClass}
                />
              </Field>

            </div>
          </section>

          {/* =================================================
              SECTION 3 - LOGIN DETAILS
          ================================================== */}

          <section className="p-5 sm:p-8">
            <SectionHeading
              number="3"
              title="Create your login"
              description="Your email address and password will be used to access your EMBRASTIC customer account."
            />

            <div className="mt-6 grid gap-5 sm:grid-cols-2">

              <Field
                label="Password"
                required
              >
                <div className="relative">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) =>
                      updateField(
                        "password",
                        event.target.value
                      )
                    }
                    placeholder="Minimum 8 characters"
                    className={
                      inputClass +
                      " pr-20"
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Use at least 8 characters.
                </p>
              </Field>

              <Field
                label="Confirm Password"
                required
              >
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  value={
                    form.confirmPassword
                  }
                  onChange={(event) =>
                    updateField(
                      "confirmPassword",
                      event.target.value
                    )
                  }
                  placeholder="Enter password again"
                  className={inputClass}
                />
              </Field>

            </div>

            {/* ===============================================
                ERROR
            ================================================ */}

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-black text-red-700">
                    !
                  </div>

                  <div>
                    <div className="text-sm font-extrabold text-red-800">
                      Unable to create account
                    </div>

                    <div className="mt-1 text-sm leading-5 text-red-700">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================
                SUCCESS
            ================================================ */}

            {success && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">
                    ✓
                  </div>

                  <div>
                    <div className="text-sm font-extrabold text-emerald-800">
                      Account created
                    </div>

                    <div className="mt-1 text-sm leading-5 text-emerald-700">
                      {success}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================
                SUBMIT
            ================================================ */}

            <div className="mt-8 rounded-2xl bg-slate-50 p-4 sm:flex sm:items-center sm:justify-between sm:gap-6">

              <div className="text-xs leading-5 text-slate-500">
                By creating an account, your
                customer profile will be
                registered with EMBRASTIC.
                Your password is stored
                securely as a password hash.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full shrink-0 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0 sm:w-auto"
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account"}
              </button>

            </div>

            <div className="mt-6 text-center text-sm text-slate-500">
              Already registered?{" "}
              <Link
                href="/customer/login"
                className="font-extrabold text-blue-600 hover:text-blue-800"
              >
                Sign in to your account
              </Link>
            </div>

          </section>
        </form>

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <div className="mx-auto mt-8 max-w-2xl text-center text-xs leading-5 text-slate-400">
          EMBRASTIC Customer Portal
          <span className="mx-2">•</span>
          Stitched to Stand Out
        </div>

      </div>
    </main>
  );
}

/* =========================================================
   FIELD COMPONENT
========================================================= */

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-bold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </div>

      {children}
    </label>
  );
}

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white">
        {number}
      </div>

      <div>
        <h2 className="text-lg font-black text-slate-900">
          {title}
        </h2>

        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}
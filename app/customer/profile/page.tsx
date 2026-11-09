"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type Customer = {
  id?: string;
  customerCode?: string;
  name?: string;
  businessName?: string;
  contactPerson?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  gstNumber?: string;
  panNumber?: string;

  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;

  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;

  shippingSameAsBilling?: string;

  priceCategory?: string;
  paymentTermsDays?: string | number;
};

function value(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function AddressBlock({
  address,
  city,
  state,
  postalCode,
  country,
}: {
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}) {
  return (
    <div className="space-y-1 text-sm leading-6 text-slate-600">
      <div>{value(address)}</div>

      {(city || state || postalCode) && (
        <div>
          {[city, state, postalCode]
            .filter(Boolean)
            .join(", ")}
        </div>
      )}

      {country && <div>{country}</div>}
    </div>
  );
}

export default function CustomerProfilePage() {
  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/customer-auth/me",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.message ||
              "Unable to load your profile."
          );
        }

        if (!cancelled) {
          setCustomer(data.customer || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your profile."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your profile...
        </div>
      </main>
    );
  }

  if (error || !customer) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-red-100 bg-red-50 p-8">
          <h1 className="text-xl font-black text-red-700">
            Unable to load profile
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {error ||
              "Customer profile could not be found."}
          </p>
        </div>
      </main>
    );
  }

  const displayName =
    customer.name ||
    customer.contactPerson ||
    customer.businessName ||
    "Customer";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-white sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-white/10">
              <UserRound className="h-9 w-9" />
            </div>

            <div>
              <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-300">
                Customer Profile
              </div>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                {displayName}
              </h1>

              <div className="mt-3 flex flex-wrap gap-2">
                {customer.customerCode && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
                    {customer.customerCode}
                  </span>
                )}

                {customer.priceCategory && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
                    {customer.priceCategory} Pricing
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2 lg:p-10">
          <ProfileCard
            icon={<UserRound className="h-5 w-5" />}
            title="Contact Details"
          >
            <Detail
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={value(customer.email)}
            />

            <Detail
              icon={<Phone className="h-4 w-4" />}
              label="Phone"
              value={value(customer.phone)}
            />

            <Detail
              icon={<UserRound className="h-4 w-4" />}
              label="Contact Person"
              value={value(
                customer.contactPerson
              )}
            />
          </ProfileCard>

          <ProfileCard
            icon={<Building2 className="h-5 w-5" />}
            title="Business Details"
          >
            <Detail
              label="Business Name"
              value={value(
                customer.businessName
              )}
            />

            <Detail
              label="GST Number"
              value={value(customer.gstNumber)}
            />

            <Detail
              label="PAN Number"
              value={value(customer.panNumber)}
            />

            <Detail
              label="Price Category"
              value={value(
                customer.priceCategory
              )}
            />
          </ProfileCard>

          <ProfileCard
            icon={<MapPin className="h-5 w-5" />}
            title="Billing Address"
          >
            <AddressBlock
              address={customer.billingAddress}
              city={customer.billingCity}
              state={customer.billingState}
              postalCode={
                customer.billingPostalCode
              }
              country={customer.billingCountry}
            />
          </ProfileCard>

          <ProfileCard
            icon={<MapPin className="h-5 w-5" />}
            title="Shipping Address"
          >
            <AddressBlock
              address={customer.shippingAddress}
              city={customer.shippingCity}
              state={customer.shippingState}
              postalCode={
                customer.shippingPostalCode
              }
              country={
                customer.shippingCountry
              }
            />
          </ProfileCard>

          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5 sm:p-6">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-black text-slate-900">
                    EMBRASTIC Customer Account
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Your profile information is
                    connected to your EMBRASTIC
                    customer account and is used for
                    orders, invoices, billing and
                    shipping.
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <ReceiptText className="h-4 w-4" />

                    Payment terms:{" "}
                    {value(
                      customer.paymentTermsDays
                    )}{" "}
                    days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProfileCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50/50 p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
          {icon}
        </div>

        <h2 className="text-base font-black text-slate-900">
          {title}
        </h2>
      </div>

      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
        {icon}
        {label}
      </div>

      <div className="text-sm font-bold text-slate-700">
        {value}
      </div>
    </div>
  );
}
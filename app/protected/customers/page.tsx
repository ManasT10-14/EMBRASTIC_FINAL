"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";


import Link from "next/link";
type Customer = {
  id: string;

  customerCode: string;

  name: string;
  businessName: string;

  customerType: string;
  status: string;

  phone: string;
  alternatePhone: string;
  email: string;

  contactPerson: string;
  designation: string;

  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  billingCountry: string;

  shippingSameAsBilling: string;

  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;

  gstNumber: string;
  panNumber: string;

  preferredContactMethod: string;

  creditLimit: number;
  paymentTermsDays: number;

  priceCategory: string;

  tags: string;

  notes: string;

  createdAt: string;
  updatedAt: string;
};

type CustomerForm = Omit<
  Customer,
  "id" | "customerCode" | "createdAt" | "updatedAt"
>;

const CUSTOMER_TYPES = [
  "Individual",
  "Business",
  "Corporate",
  "School / College",
  "Uniform Supplier",
  "Retailer",
  "Reseller",
  "Sports Club",
  "Event Company",
  "Promotional Products",
  "NGO / Organisation",
  "Government",
  "Other",
];

const CUSTOMER_STATUSES = [
  "Active",
  "Inactive",
  "On Hold",
  "Blocked",
];

const CONTACT_METHODS = [
  "Phone",
  "WhatsApp",
  "Email",
  "SMS",
  "Any",
];

const PRICE_CATEGORIES = [
  "Standard",
  "Retail",
  "Wholesale",
  "Corporate",
  "Dealer",
  "Special Contract",
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const TAG_SUGGESTIONS = [
  "VIP",
  "Repeat Customer",
  "Corporate",
  "School",
  "Uniform",
  "Wholesale",
  "Retail",
  "Dealer",
  "Credit Customer",
  "Priority",
  "Seasonal",
  "New Customer",
];

function generateId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 10)}`;
}

function emptyForm(): CustomerForm {
  return {
    name: "",
    businessName: "",

    customerType: "Business",
    status: "Active",

    phone: "",
    alternatePhone: "",
    email: "",

    contactPerson: "",
    designation: "",

    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingPostalCode: "",
    billingCountry: "India",

    shippingSameAsBilling: "Yes",

    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingPostalCode: "",
    shippingCountry: "India",

    gstNumber: "",
    panNumber: "",

    preferredContactMethod: "WhatsApp",

    creditLimit: 0,
    paymentTermsDays: 0,

    priceCategory: "Standard",

    tags: "",

    notes: "",
  };
}

function normalizeCustomer(
  row: any
): Customer {
  return {
    id: String(
      row?.id ?? ""
    ).trim(),

    customerCode: String(
      row?.customerCode ?? ""
    ).trim(),

    name: String(
      row?.name ?? ""
    ).trim(),

    businessName: String(
      row?.businessName ?? ""
    ).trim(),

    customerType: String(
      row?.customerType ?? "Business"
    ),

    status: String(
      row?.status ?? "Active"
    ),

    phone: String(
      row?.phone ?? ""
    ).trim(),

    alternatePhone: String(
      row?.alternatePhone ?? ""
    ).trim(),

    email: String(
      row?.email ?? ""
    ).trim(),

    contactPerson: String(
      row?.contactPerson ?? ""
    ).trim(),

    designation: String(
      row?.designation ?? ""
    ).trim(),

    billingAddress: String(
      row?.billingAddress ??
        row?.address ??
        ""
    ),

    billingCity: String(
      row?.billingCity ?? ""
    ),

    billingState: String(
      row?.billingState ?? ""
    ),

    billingPostalCode: String(
      row?.billingPostalCode ?? ""
    ),

    billingCountry: String(
      row?.billingCountry ?? "India"
    ),

    shippingSameAsBilling: String(
      row?.shippingSameAsBilling ?? "Yes"
    ),

    shippingAddress: String(
      row?.shippingAddress ?? ""
    ),

    shippingCity: String(
      row?.shippingCity ?? ""
    ),

    shippingState: String(
      row?.shippingState ?? ""
    ),

    shippingPostalCode: String(
      row?.shippingPostalCode ?? ""
    ),

    shippingCountry: String(
      row?.shippingCountry ?? "India"
    ),

    gstNumber: String(
      row?.gstNumber ?? ""
    ).trim(),

    panNumber: String(
      row?.panNumber ?? ""
    ).trim(),

    preferredContactMethod: String(
      row?.preferredContactMethod ??
        "WhatsApp"
    ),

    creditLimit: Number(
      row?.creditLimit ?? 0
    ),

    paymentTermsDays: Number(
      row?.paymentTermsDays ?? 0
    ),

    priceCategory: String(
      row?.priceCategory ??
        "Standard"
    ),

    tags: String(
      row?.tags ?? ""
    ),

    notes: String(
      row?.notes ?? ""
    ),

    createdAt: String(
      row?.createdAt ?? ""
    ),

    updatedAt: String(
      row?.updatedAt ?? ""
    ),
  };
}

function displayAddress(
  customer: Customer
) {
  const parts = [
    customer.billingAddress,
    customer.billingCity,
    customer.billingState,
    customer.billingPostalCode,
    customer.billingCountry,
  ].filter(Boolean);

  return parts.join(", ");
}

export default function CustomersPage() {
  const [
    customers,
    setCustomers,
  ] = useState<Customer[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] =
    useState<Customer | null>(
      null
    );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("All");

  const [
    form,
    setForm,
  ] =
    useState<CustomerForm>(
      emptyForm()
    );

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (!showForm) {
      return;
    }

    const oldOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        oldOverflow;
    };
  }, [showForm]);

  async function loadCustomers(
    silent = false
  ) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response =
        await fetch(
          "/api/excel?sheet=Customers",
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to load Customers."
        );
      }

      const rows: Customer[] =
        Array.isArray(data.rows)
          ? data.rows
              .map(
                normalizeCustomer
              )
              .filter(
                (
                  customer: Customer
                ) =>
                  Boolean(
                    customer.id
                  )
              )
          : [];

      rows.sort((a, b) =>
        String(
          b.createdAt
        ).localeCompare(
          String(a.createdAt)
        )
      );

      setCustomers(rows);
    } catch (error) {
      console.error(
        "Customer load error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load Customers."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm());
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function openEdit(
    customer: Customer
  ) {
    setEditing(customer);

    setForm({
      name: customer.name,

      businessName:
        customer.businessName,

      customerType:
        customer.customerType,

      status:
        customer.status,

      phone:
        customer.phone,

      alternatePhone:
        customer.alternatePhone,

      email:
        customer.email,

      contactPerson:
        customer.contactPerson,

      designation:
        customer.designation,

      billingAddress:
        customer.billingAddress,

      billingCity:
        customer.billingCity,

      billingState:
        customer.billingState,

      billingPostalCode:
        customer.billingPostalCode,

      billingCountry:
        customer.billingCountry ||
        "India",

      shippingSameAsBilling:
        customer.shippingSameAsBilling ||
        "Yes",

      shippingAddress:
        customer.shippingAddress,

      shippingCity:
        customer.shippingCity,

      shippingState:
        customer.shippingState,

      shippingPostalCode:
        customer.shippingPostalCode,

      shippingCountry:
        customer.shippingCountry ||
        "India",

      gstNumber:
        customer.gstNumber,

      panNumber:
        customer.panNumber,

      preferredContactMethod:
        customer.preferredContactMethod ||
        "WhatsApp",

      creditLimit:
        customer.creditLimit,

      paymentTermsDays:
        customer.paymentTermsDays,

      priceCategory:
        customer.priceCategory ||
        "Standard",

      tags:
        customer.tags,

      notes:
        customer.notes,
    });

    setShowForm(true);
  }

  function nextCustomerCode() {
    let maxNumber = 0;

    customers.forEach(
      (
        customer
      ) => {
        const match =
          customer.customerCode.match(
            /(\d+)$/
          );

        if (match) {
          maxNumber =
            Math.max(
              maxNumber,
              Number(
                match[1]
              )
            );
        }
      }
    );

    return `CUS-${String(
      maxNumber + 1
    ).padStart(
      5,
      "0"
    )}`;
  }

  function copyBillingToShipping() {
    setForm(
      (
        old
      ) => ({
        ...old,

        shippingAddress:
          old.billingAddress,

        shippingCity:
          old.billingCity,

        shippingState:
          old.billingState,

        shippingPostalCode:
          old.billingPostalCode,

        shippingCountry:
          old.billingCountry,
      })
    );
  }

  function toggleShippingSame(
    value: string
  ) {
    if (value === "Yes") {
      setForm(
        (
          old
        ) => ({
          ...old,

          shippingSameAsBilling:
            "Yes",

          shippingAddress:
            old.billingAddress,

          shippingCity:
            old.billingCity,

          shippingState:
            old.billingState,

          shippingPostalCode:
            old.billingPostalCode,

          shippingCountry:
            old.billingCountry,
        })
      );
    } else {
      setForm(
        (
          old
        ) => ({
          ...old,

          shippingSameAsBilling:
            "No",
        })
      );
    }
  }

  function addTag(
    tag: string
  ) {
    const existing =
      form.tags
        .split(",")
        .map(
          (
            value
          ) =>
            value.trim()
        )
        .filter(Boolean);

    if (
      existing.includes(tag)
    ) {
      return;
    }

    setForm({
      ...form,

      tags:
        [...existing, tag]
          .join(", "),
    });
  }

  async function saveCustomer() {
    if (
      !form.name.trim()
    ) {
      alert(
        "Customer Name is required."
      );

      return;
    }

    if (
      !form.phone.trim() &&
      !form.email.trim()
    ) {
      alert(
        "Please provide at least a Phone Number or Email Address."
      );

      return;
    }

    if (
      form.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email
      )
    ) {
      alert(
        "Please enter a valid Email Address."
      );

      return;
    }

    if (
      Number(
        form.creditLimit
      ) < 0
    ) {
      alert(
        "Credit Limit cannot be negative."
      );

      return;
    }

    if (
      Number(
        form.paymentTermsDays
      ) < 0
    ) {
      alert(
        "Payment Terms cannot be negative."
      );

      return;
    }

    /*
     * Basic duplicate check.
     */
    const duplicate =
      customers.find(
        (
          customer
        ) =>
          customer.id !==
            editing?.id &&
          (
            (
              form.phone.trim() &&
              customer.phone ===
                form.phone.trim()
            ) ||
            (
              form.email.trim() &&
              customer.email
                .toLowerCase() ===
                form.email
                  .trim()
                  .toLowerCase()
            )
          )
      );

    if (duplicate) {
      const proceed =
        confirm(
          `A customer already exists with the same phone or email: ${duplicate.name}. Save anyway?`
        );

      if (!proceed) {
        return;
      }
    }

    try {
      setSaving(true);

      const finalShipping =
        form.shippingSameAsBilling ===
        "Yes"
          ? {
              shippingAddress:
                form.billingAddress,

              shippingCity:
                form.billingCity,

              shippingState:
                form.billingState,

              shippingPostalCode:
                form.billingPostalCode,

              shippingCountry:
                form.billingCountry,
            }
          : {
              shippingAddress:
                form.shippingAddress,

              shippingCity:
                form.shippingCity,

              shippingState:
                form.shippingState,

              shippingPostalCode:
                form.shippingPostalCode,

              shippingCountry:
                form.shippingCountry,
            };

      const now =
        new Date()
          .toISOString();

      const record = {
        customerCode:
          editing
            ? editing.customerCode
            : nextCustomerCode(),

        name:
          form.name.trim(),

        businessName:
          form.businessName.trim(),

        customerType:
          form.customerType,

        status:
          form.status,

        phone:
          form.phone.trim(),

        alternatePhone:
          form.alternatePhone.trim(),

        email:
          form.email
            .trim()
            .toLowerCase(),

        contactPerson:
          form.contactPerson.trim(),

        designation:
          form.designation.trim(),

        billingAddress:
          form.billingAddress.trim(),

        billingCity:
          form.billingCity.trim(),

        billingState:
          form.billingState,

        billingPostalCode:
          form.billingPostalCode.trim(),

        billingCountry:
          form.billingCountry.trim(),

        shippingSameAsBilling:
          form.shippingSameAsBilling,

        ...finalShipping,

        gstNumber:
          form.gstNumber
            .trim()
            .toUpperCase(),

        panNumber:
          form.panNumber
            .trim()
            .toUpperCase(),

        preferredContactMethod:
          form.preferredContactMethod,

        creditLimit:
          Number(
            form.creditLimit
          ),

        paymentTermsDays:
          Number(
            form.paymentTermsDays
          ),

        priceCategory:
          form.priceCategory,

        tags:
          form.tags.trim(),

        notes:
          form.notes.trim(),

        updatedAt: now,
      };

      const response =
        await fetch(
          "/api/excel",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                action:
                  editing
                    ? "update"
                    : "add",

                sheet:
                  "Customers",

                ...(editing
                  ? {
                      id:
                        editing.id,
                    }
                  : {}),

                record:
                  editing
                    ? {
                        ...editing,
                        ...record,
                      }
                    : {
                        id:
                          generateId(),

                        ...record,

                        createdAt:
                          now,
                      },
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to save Customer."
        );
      }

      closeForm();

      await loadCustomers(
        true
      );
    } catch (error) {
      console.error(
        "Customer save error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to save Customer."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer(
    customer: Customer
  ) {
    if (
      !confirm(
        `Delete customer ${customer.name}? This should only be done if the customer is not linked to Orders, Invoices or Dispatch records.`
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/excel",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                action:
                  "delete",

                sheet:
                  "Customers",

                id:
                  customer.id,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to delete Customer."
        );
      }

      await loadCustomers(
        true
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete Customer."
      );
    } finally {
      setSaving(false);
    }
  }

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return customers.filter(
        (
          customer
        ) => {
          const matchesStatus =
            statusFilter ===
              "All" ||
            customer.status ===
              statusFilter;

          const matchesType =
            typeFilter ===
              "All" ||
            customer.customerType ===
              typeFilter;

          const matchesSearch =
            !query ||
            [
              customer.customerCode,
              customer.name,
              customer.businessName,
              customer.phone,
              customer.alternatePhone,
              customer.email,
              customer.contactPerson,
              customer.billingCity,
              customer.billingState,
              customer.gstNumber,
              customer.panNumber,
              customer.tags,
            ]
              .join(" ")
              .toLowerCase()
              .includes(
                query
              );

          return (
            matchesStatus &&
            matchesType &&
            matchesSearch
          );
        }
      );
    }, [
      customers,
      search,
      statusFilter,
      typeFilter,
    ]);

  const statistics =
    useMemo(() => {
      const active =
        customers.filter(
          (
            customer
          ) =>
            customer.status ===
            "Active"
        ).length;

      const businesses =
        customers.filter(
          (
            customer
          ) =>
            customer.customerType !==
            "Individual"
        ).length;

      const creditCustomers =
        customers.filter(
          (
            customer
          ) =>
            Number(
              customer.creditLimit
            ) > 0 ||
            Number(
              customer.paymentTermsDays
            ) > 0
        ).length;

      return {
        total:
          customers.length,

        active,

        businesses,

        creditCustomers,
      };
    }, [customers]);

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="mx-auto w-full max-w-7xl space-y-6 pb-24 pr-2">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-black">
              Customers
            </h1>

            <p className="mt-1 max-w-4xl text-sm text-slate-500">
              Central customer master for
              Orders, billing, shipping,
              payments and Dispatch.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                loadCustomers(
                  true
                )
              }
              disabled={
                refreshing
              }
              className="rounded-xl border bg-white px-4 py-3 font-bold disabled:opacity-50"
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              onClick={
                openCreate
              }
              className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
            >
              + Add Customer
            </button>
          </div>
        </div>

        {/* STATISTICS */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Customers"
            value={String(
              statistics.total
            )}
            caption="All customer master records"
          />

          <StatCard
            label="Active"
            value={String(
              statistics.active
            )}
            caption="Customers currently available for business"
          />

          <StatCard
            label="Business Customers"
            value={String(
              statistics.businesses
            )}
            caption="Corporate, dealer and organisational customers"
          />

          <StatCard
            label="Credit Customers"
            value={String(
              statistics.creditCustomers
            )}
            caption="Customers with credit limit or payment terms"
          />
        </div>

        {/* FILTERS */}

        <div className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm lg:grid-cols-[1fr_220px_220px]">
          <input
            value={
              search
            }
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search customer, business, phone, email, city, GST or tag..."
            className="rounded-xl border px-4 py-3"
          />

          <select
            value={
              typeFilter
            }
            onChange={(e) =>
              setTypeFilter(
                e.target.value
              )
            }
            className="rounded-xl border bg-white px-4 py-3"
          >
            <option value="All">
              All Customer Types
            </option>

            {CUSTOMER_TYPES.map(
              (
                type
              ) => (
                <option
                  key={
                    type
                  }
                  value={
                    type
                  }
                >
                  {type}
                </option>
              )
            )}
          </select>

          <select
            value={
              statusFilter
            }
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="rounded-xl border bg-white px-4 py-3"
          >
            <option value="All">
              All Statuses
            </option>

            {CUSTOMER_STATUSES.map(
              (
                status
              ) => (
                <option
                  key={
                    status
                  }
                  value={
                    status
                  }
                >
                  {status}
                </option>
              )
            )}
          </select>
        </div>

        {/* TABLE */}

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading Customers...
            </div>
          ) : filtered.length ===
            0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl">
                👥
              </div>

              <h2 className="mt-4 text-xl font-bold">
                No customers found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Add a customer to start
                building the customer
                master.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1400px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                    <th className="px-4 py-4">
                      Customer
                    </th>

                    <th className="px-4 py-4">
                      Business
                    </th>

                    <th className="px-4 py-4">
                      Type
                    </th>

                    <th className="px-4 py-4">
                      Phone
                    </th>

                    <th className="px-4 py-4">
                      Email
                    </th>

                    <th className="px-4 py-4">
                      Location
                    </th>

                    <th className="px-4 py-4">
                      GST
                    </th>

                    <th className="px-4 py-4">
                      Terms
                    </th>

                    <th className="px-4 py-4">
                      Status
                    </th>

                    <th className="px-4 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map(
                    (
                      customer
                    ) => (
                      <tr
                        key={
                          customer.id
                        }
                        className="border-b last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-4 py-4">
                          <div className="font-bold">
                            {
                              customer.name
                            }
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {
                              customer.customerCode ||
                              "—"
                            }
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {
                            customer.businessName ||
                            "—"
                          }
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {
                            customer.customerType
                          }
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {
                            customer.phone ||
                            "—"
                          }
                        </td>

                        <td className="px-4 py-4">
                          {
                            customer.email ||
                            "—"
                          }
                        </td>

                        <td className="px-4 py-4">
                          {
                            [
                              customer.billingCity,
                              customer.billingState,
                            ]
                              .filter(
                                Boolean
                              )
                              .join(
                                ", "
                              ) ||
                            "—"
                          }
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {
                            customer.gstNumber ||
                            "—"
                          }
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {customer.paymentTermsDays >
                          0
                            ? `${customer.paymentTermsDays} days`
                            : "Immediate"}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={
                              customer.status
                            }
                          />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex gap-2">

                            <Link
                              href={`/protected/customers/${customer.id}`}
                              className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                            >
                              360° View
                            </Link>

                            <button
                              onClick={() =>
                                openEdit(
                                  customer
                                )
                              }
                              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                void deleteCustomer(
                                  customer
                                )
                              }
                              disabled={
                                saving
                              }
                              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                            >
                              Delete
                            </button>

                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOMER MODAL */}

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">

            <div className="my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex shrink-0 items-start justify-between border-b bg-white px-5 py-5 sm:px-6">
                <div>
                  <h2 className="text-2xl font-black">
                    {editing
                      ? "Edit Customer"
                      : "Add Customer"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Maintain billing,
                    shipping, tax, contact
                    and commercial details.
                  </p>
                </div>

                <button
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  className="text-3xl text-slate-400"
                >
                  ×
                </button>
              </div>

              {/* SCROLLABLE BODY */}

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
                <div className="space-y-7">

                  {/* BASIC INFO */}

                  <Section
                    title="Customer Profile"
                    description="Primary customer identity used throughout EMBRASTIC."
                  >
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      <Field
                        label="Customer Name *"
                        caption="Name used on Orders and general customer records."
                      >
                        <input
                          value={
                            form.name
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              name:
                                e.target
                                  .value,
                            })
                          }
                          placeholder="Customer / person name"
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field
                        label="Business / Company Name"
                        caption="Legal or trading business name, where applicable."
                      >
                        <input
                          value={
                            form.businessName
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              businessName:
                                e.target
                                  .value,
                            })
                          }
                          placeholder="Company name"
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field
                        label="Customer Type"
                        caption="Useful for pricing, reporting and segmentation."
                      >
                        <select
                          value={
                            form.customerType
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              customerType:
                                e.target
                                  .value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >
                          {CUSTOMER_TYPES.map(
                            (
                              type
                            ) => (
                              <option
                                key={
                                  type
                                }
                                value={
                                  type
                                }
                              >
                                {type}
                              </option>
                            )
                          )}
                        </select>
                      </Field>

                      <Field
                        label="Customer Status"
                        caption="Inactive or Blocked customers can be retained without deleting history."
                      >
                        <select
                          value={
                            form.status
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              status:
                                e.target
                                  .value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >
                          {CUSTOMER_STATUSES.map(
                            (
                              status
                            ) => (
                              <option
                                key={
                                  status
                                }
                                value={
                                  status
                                }
                              >
                                {status}
                              </option>
                            )
                          )}
                        </select>
                      </Field>

                      <Field
                        label="Price Category"
                        caption="Default commercial pricing category for this customer."
                      >
                        <select
                          value={
                            form.priceCategory
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              priceCategory:
                                e.target
                                  .value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >
                          {PRICE_CATEGORIES.map(
                            (
                              category
                            ) => (
                              <option
                                key={
                                  category
                                }
                                value={
                                  category
                                }
                              >
                                {
                                  category
                                }
                              </option>
                            )
                          )}
                        </select>
                      </Field>
                    </div>
                  </Section>

                  {/* CONTACT */}

                  <Section
                    title="Contact Information"
                    description="Phone, email and primary business contact information."
                  >
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      <Field
                        label="Phone"
                        caption="Primary mobile or business phone number."
                      >
                        <input
                          value={
                            form.phone
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              phone:
                                e.target
                                  .value,
                            })
                          }
                          placeholder="+91..."
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field
                        label="Alternate Phone"
                        caption="Secondary phone or alternate contact number."
                      >
                        <input
                          value={
                            form.alternatePhone
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              alternatePhone:
                                e.target
                                  .value,
                            })
                          }
                          placeholder="Alternate mobile"
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field
                        label="Email"
                        caption="Used for quotations, invoices and communication."
                      >
                        <input
                          type="email"
                          value={
                            form.email
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              email:
                                e.target
                                  .value,
                            })
                          }
                          placeholder="customer@example.com"
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field
                        label="Contact Person"
                        caption="Primary person handling Orders, artwork or billing."
                      >
                        <input
                          value={
                            form.contactPerson
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              contactPerson:
                                e.target
                                  .value,
                            })
                          }
                          placeholder="Contact person"
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field
                        label="Designation"
                        caption="Job title of primary contact person."
                      >
                        <input
                          value={
                            form.designation
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              designation:
                                e.target
                                  .value,
                            })
                          }
                          placeholder="Purchase Manager"
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field
                        label="Preferred Contact Method"
                        caption="Preferred method for approvals and updates."
                      >
                        <select
                          value={
                            form.preferredContactMethod
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              preferredContactMethod:
                                e.target
                                  .value,
                            })
                          }
                          className="w-full rounded-xl border bg-white px-4 py-3"
                        >
                          {CONTACT_METHODS.map(
                            (
                              method
                            ) => (
                              <option
                                key={
                                  method
                                }
                                value={
                                  method
                                }
                              >
                                {
                                  method
                                }
                              </option>
                            )
                          )}
                        </select>
                      </Field>
                    </div>
                  </Section>

                  {/* BILLING ADDRESS */}

                  <Section
                    title="Billing Address"
                    description="Used for invoices, GST records and billing correspondence."
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field
                        label="Billing Address"
                        caption="Street, building, floor, area or locality."
                      >
                        <textarea
                          value={
                            form.billingAddress
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              billingAddress:
                                e.target
                                  .value,
                            })
                          }
                          placeholder="Street / building / area"
                          className="min-h-24 w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                          label="City"
                          caption="Billing city."
                        >
                          <input
                            value={
                              form.billingCity
                            }
                            onChange={(e) =>
                              setForm({
                                ...form,

                                billingCity:
                                  e.target
                                    .value,
                              })
                            }
                            className="w-full rounded-xl border px-4 py-3"
                          />
                        </Field>

                        <Field
                          label="State"
                          caption="Billing state."
                        >
                          <select
                            value={
                              form.billingState
                            }
                            onChange={(e) =>
                              setForm({
                                ...form,

                                billingState:
                                  e.target
                                    .value,
                              })
                            }
                            className="w-full rounded-xl border bg-white px-4 py-3"
                          >
                            <option value="">
                              Select State
                            </option>

                            {INDIAN_STATES.map(
                              (
                                state
                              ) => (
                                <option
                                  key={
                                    state
                                  }
                                  value={
                                    state
                                  }
                                >
                                  {
                                    state
                                  }
                                </option>
                              )
                            )}
                          </select>
                        </Field>

                        <Field
                          label="Postal Code"
                          caption="PIN / postal code."
                        >
                          <input
                            value={
                              form.billingPostalCode
                            }
                            onChange={(e) =>
                              setForm({
                                ...form,

                                billingPostalCode:
                                  e.target
                                    .value,
                              })
                            }
                            className="w-full rounded-xl border px-4 py-3"
                          />
                        </Field>

                        <Field
                          label="Country"
                          caption="Billing country."
                        >
                          <input
                            value={
                              form.billingCountry
                            }
                            onChange={(e) =>
                              setForm({
                                ...form,

                                billingCountry:
                                  e.target
                                    .value,
                              })
                            }
                            className="w-full rounded-xl border px-4 py-3"
                          />
                        </Field>
                      </div>
                    </div>
                  </Section>

                  {/* SHIPPING */}

                  <Section
                    title="Shipping / Delivery Address"
                    description="This address is used automatically by the Dispatch page."
                  >
                    <Field
                      label="Shipping Same as Billing?"
                      caption="Choose Yes to automatically copy billing details."
                    >
                      <select
                        value={
                          form.shippingSameAsBilling
                        }
                        onChange={(e) =>
                          toggleShippingSame(
                            e.target
                              .value
                          )
                        }
                        className="w-full rounded-xl border bg-white px-4 py-3"
                      >
                        <option value="Yes">
                          Yes
                        </option>

                        <option value="No">
                          No
                        </option>
                      </select>
                    </Field>

                    {form.shippingSameAsBilling ===
                      "No" && (
                      <div className="mt-5">
                        <div className="mb-4 flex justify-end">
                          <button
                            type="button"
                            onClick={
                              copyBillingToShipping
                            }
                            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700"
                          >
                            Copy Billing Address
                          </button>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <Field
                            label="Shipping Address"
                            caption="Primary delivery street address."
                          >
                            <textarea
                              value={
                                form.shippingAddress
                              }
                              onChange={(e) =>
                                setForm({
                                  ...form,

                                  shippingAddress:
                                    e.target
                                      .value,
                                })
                              }
                              className="min-h-24 w-full rounded-xl border px-4 py-3"
                            />
                          </Field>

                          <div className="grid gap-5 sm:grid-cols-2">
                            <Field
                              label="City"
                              caption="Shipping city."
                            >
                              <input
                                value={
                                  form.shippingCity
                                }
                                onChange={(e) =>
                                  setForm({
                                    ...form,

                                    shippingCity:
                                      e.target
                                        .value,
                                  })
                                }
                                className="w-full rounded-xl border px-4 py-3"
                              />
                            </Field>

                            <Field
                              label="State"
                              caption="Shipping state."
                            >
                              <select
                                value={
                                  form.shippingState
                                }
                                onChange={(e) =>
                                  setForm({
                                    ...form,

                                    shippingState:
                                      e.target
                                        .value,
                                  })
                                }
                                className="w-full rounded-xl border bg-white px-4 py-3"
                              >
                                <option value="">
                                  Select State
                                </option>

                                {INDIAN_STATES.map(
                                  (
                                    state
                                  ) => (
                                    <option
                                      key={
                                        state
                                      }
                                      value={
                                        state
                                      }
                                    >
                                      {
                                        state
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            </Field>

                            <Field
                              label="Postal Code"
                              caption="Shipping PIN / postal code."
                            >
                              <input
                                value={
                                  form.shippingPostalCode
                                }
                                onChange={(e) =>
                                  setForm({
                                    ...form,

                                    shippingPostalCode:
                                      e.target
                                        .value,
                                  })
                                }
                                className="w-full rounded-xl border px-4 py-3"
                              />
                            </Field>

                            <Field
                              label="Country"
                              caption="Shipping country."
                            >
                              <input
                                value={
                                  form.shippingCountry
                                }
                                onChange={(e) =>
                                  setForm({
                                    ...form,

                                    shippingCountry:
                                      e.target
                                        .value,
                                  })
                                }
                                className="w-full rounded-xl border px-4 py-3"
                              />
                            </Field>
                          </div>
                        </div>
                      </div>
                    )}
                  </Section>

                  {/* TAX */}

                  <Section
                    title="Tax & Business Information"
                    description="Tax identifiers used for Indian business billing."
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field
                        label="GST Number"
                        caption="Customer GSTIN for taxable invoices."
                      >
                        <input
                          value={
                            form.gstNumber
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              gstNumber:
                                e.target
                                  .value
                                  .toUpperCase(),
                            })
                          }
                          placeholder="GSTIN"
                          className="w-full rounded-xl border px-4 py-3 uppercase"
                        />
                      </Field>

                      <Field
                        label="PAN Number"
                        caption="PAN for business/customer tax records."
                      >
                        <input
                          value={
                            form.panNumber
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              panNumber:
                                e.target
                                  .value
                                  .toUpperCase(),
                            })
                          }
                          placeholder="PAN"
                          className="w-full rounded-xl border px-4 py-3 uppercase"
                        />
                      </Field>
                    </div>
                  </Section>

                  {/* COMMERCIAL */}

                  <Section
                    title="Commercial Terms"
                    description="Default credit and payment terms for customer billing."
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field
                        label="Credit Limit ₹"
                        caption="Maximum recommended outstanding credit for this customer."
                      >
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            form.creditLimit
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              creditLimit:
                                Number(
                                  e.target
                                    .value
                                ),
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>

                      <Field
                        label="Payment Terms (Days)"
                        caption="0 means immediate payment. Example: 15, 30 or 45 days."
                      >
                        <input
                          type="number"
                          min="0"
                          value={
                            form.paymentTermsDays
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,

                              paymentTermsDays:
                                Number(
                                  e.target
                                    .value
                                ),
                            })
                          }
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </Field>
                    </div>
                  </Section>

                  {/* TAGS */}

                  <Section
                    title="Tags & Segmentation"
                    description="Tags make customer search and reporting much easier."
                  >
                    <Field
                      label="Customer Tags"
                      caption="Comma-separated customer labels."
                    >
                      <input
                        value={
                          form.tags
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,

                            tags:
                              e.target
                                .value,
                          })
                        }
                        placeholder="Corporate, VIP, Repeat Customer..."
                        className="w-full rounded-xl border px-4 py-3"
                      />
                    </Field>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {TAG_SUGGESTIONS.map(
                        (
                          tag
                        ) => (
                          <button
                            key={
                              tag
                            }
                            type="button"
                            onClick={() =>
                              addTag(
                                tag
                              )
                            }
                            className="rounded-full border bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                          >
                            + {tag}
                          </button>
                        )
                      )}
                    </div>
                  </Section>

                  {/* NOTES */}

                  <Section
                    title="Customer Notes"
                    description="Internal notes, customer preferences and important business context."
                  >
                    <textarea
                      value={
                        form.notes
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,

                          notes:
                            e.target
                              .value,
                        })
                      }
                      placeholder="Example: Prefers WhatsApp approvals. Left chest embroidery usually 80 mm. Requires PO before production..."
                      className="min-h-32 w-full resize-y rounded-xl border px-4 py-3"
                    />
                  </Section>
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border px-5 py-3 font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    saveCustomer
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update Customer"
                    : "Add Customer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  caption,
  children,
}: {
  label: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-800">
        {label}
      </label>

      {children}

      <p className="mt-1.5 text-xs leading-5 text-slate-400">
        {caption}
      </p>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-slate-50/50 p-4 sm:p-5">
      <div className="mb-5">
        <h3 className="text-base font-black">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const className =
    status === "Active"
      ? "bg-green-100 text-green-700"
      : status === "On Hold"
      ? "bg-yellow-100 text-yellow-700"
      : status === "Blocked"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-600";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-2xl font-black">
        {value}
      </div>

      <div className="mt-1 text-xs leading-5 text-slate-400">
        {caption}
      </div>
    </div>
  );
}
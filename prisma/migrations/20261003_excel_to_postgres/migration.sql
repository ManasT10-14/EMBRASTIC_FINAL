-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "customerCode" TEXT,
    "name" TEXT,
    "businessName" TEXT,
    "customerType" TEXT,
    "status" TEXT,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "email" TEXT,
    "contactPerson" TEXT,
    "designation" TEXT,
    "billingAddress" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "billingPostalCode" TEXT,
    "billingCountry" TEXT,
    "shippingSameAsBilling" TEXT,
    "shippingAddress" TEXT,
    "shippingCity" TEXT,
    "shippingState" TEXT,
    "shippingPostalCode" TEXT,
    "shippingCountry" TEXT,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "preferredContactMethod" TEXT,
    "creditLimit" DECIMAL(14,2),
    "paymentTermsDays" INTEGER,
    "priceCategory" TEXT,
    "tags" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digitizing" (
    "id" TEXT NOT NULL,
    "digitizingNumber" TEXT,
    "artworkId" TEXT,
    "artworkNumber" TEXT,
    "orderId" TEXT,
    "orderNumber" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "designName" TEXT,
    "digitizingDate" DATE,
    "digitizerName" TEXT,
    "stitchCount" INTEGER,
    "width" DECIMAL(12,2),
    "height" DECIMAL(12,2),
    "machineFormat" TEXT,
    "embroideryType" TEXT,
    "needleCount" INTEGER,
    "colorCount" INTEGER,
    "density" DECIMAL(12,4),
    "underlayType" TEXT,
    "pullCompensation" DECIMAL(12,4),
    "fileName" TEXT,
    "digitizedFileUrl" TEXT,
    "status" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "digitizing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT,
    "quotationId" TEXT,
    "quotationNumber" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "customerPoNumber" TEXT,
    "orderDate" DATE,
    "deliveryDate" DATE,
    "priority" TEXT,
    "orderSource" TEXT,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "shippingAddress" TEXT,
    "paymentTermsDays" INTEGER,
    "status" TEXT,
    "items" JSONB,
    "orderItems" JSONB,
    "totalQuantity" INTEGER,
    "subtotal" DECIMAL(14,2),
    "gstAmount" DECIMAL(14,2),
    "totalAmount" DECIMAL(14,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "invoiceNumber" TEXT,
    "customer" TEXT,
    "customerId" TEXT,
    "orderId" TEXT,
    "orderNumber" TEXT,
    "dispatchId" TEXT,
    "dispatchNumber" TEXT,
    "date" DATE,
    "amount" DECIMAL(14,2),
    "method" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "quotationNumber" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "date" DATE,
    "validUntil" DATE,
    "items" JSONB,
    "discount" DECIMAL(14,2),
    "gstPercent" DECIMAL(7,2),
    "notes" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artwork" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "orderNumber" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "designName" TEXT,
    "fileName" TEXT,
    "status" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "artwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT,
    "workOrderNumber" TEXT,
    "orderId" TEXT,
    "orderNumber" TEXT,
    "orderItemId" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "digitizingId" TEXT,
    "designName" TEXT,
    "itemDescription" TEXT,
    "garmentColor" TEXT,
    "garmentSize" TEXT,
    "status" TEXT,
    "machineName" TEXT,
    "operatorName" TEXT,
    "productionQuantity" INTEGER,
    "completedQuantity" INTEGER,
    "stitchCount" INTEGER,
    "embroideryWidthMm" DECIMAL(12,2),
    "embroideryHeightMm" DECIMAL(12,2),
    "hoopSize" TEXT,
    "colourCount" INTEGER,
    "threadColors" TEXT,
    "threadType" TEXT,
    "needleType" TEXT,
    "backingType" TEXT,
    "toppingRequired" TEXT,
    "machineSpeed" INTEGER,
    "placement" TEXT,
    "sampleApproved" TEXT,
    "sampleApprovedBy" TEXT,
    "startDate" DATE,
    "startTime" TEXT,
    "completedDate" DATE,
    "completedTime" TEXT,
    "rejectedQuantity" INTEGER,
    "reworkQuantity" INTEGER,
    "downtimeMinutes" INTEGER,
    "stoppageReason" TEXT,
    "productionInstructions" TEXT,
    "packingInstructions" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "production_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_control" (
    "id" TEXT NOT NULL,
    "qcNumber" TEXT,
    "productionId" TEXT,
    "productionNumber" TEXT,
    "workOrderId" TEXT,
    "workOrderNumber" TEXT,
    "orderId" TEXT,
    "orderNumber" TEXT,
    "orderItemId" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "digitizingId" TEXT,
    "designName" TEXT,
    "itemDescription" TEXT,
    "garmentColor" TEXT,
    "garmentSize" TEXT,
    "machineName" TEXT,
    "operatorName" TEXT,
    "productionQuantity" INTEGER,
    "productionCompletedQuantity" INTEGER,
    "productionRejectedQuantity" INTEGER,
    "productionReworkQuantity" INTEGER,
    "inspectedQuantity" INTEGER,
    "passedQuantity" INTEGER,
    "rejectedQuantity" INTEGER,
    "reworkQuantity" INTEGER,
    "qcStatus" TEXT,
    "stitchQuality" TEXT,
    "threadQuality" TEXT,
    "placementAccuracy" TEXT,
    "sizeAccuracy" TEXT,
    "colorAccuracy" TEXT,
    "finishingQuality" TEXT,
    "cleanliness" TEXT,
    "packagingReadiness" TEXT,
    "defectType" TEXT,
    "defectDetails" TEXT,
    "correctiveAction" TEXT,
    "inspectionDate" DATE,
    "inspectorName" TEXT,
    "dispatchReady" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "quality_control_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "category" TEXT,
    "sku" TEXT,
    "brand" TEXT,
    "color" TEXT,
    "colour" TEXT,
    "colorCode" TEXT,
    "colourCode" TEXT,
    "size" TEXT,
    "variant" TEXT,
    "quantity" DECIMAL(14,3),
    "unit" TEXT,
    "minimumStock" DECIMAL(14,3),
    "price" DECIMAL(14,2),
    "supplier" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "date" DATE,
    "category" TEXT,
    "description" TEXT,
    "amount" DECIMAL(14,2),
    "paymentMethod" TEXT,
    "reference" TEXT,
    "supplier" TEXT,
    "inventoryTransactionId" TEXT,
    "inventoryId" TEXT,
    "sku" TEXT,
    "itemName" TEXT,
    "quantity" DECIMAL(14,3),
    "unit" TEXT,
    "unitCost" DECIMAL(14,2),
    "supplierId" TEXT,
    "supplierCode" TEXT,
    "supplierBillId" TEXT,
    "supplierBillNumber" TEXT,
    "supplierInvoiceNumber" TEXT,
    "purchaseOrderId" TEXT,
    "purchaseOrderNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT,
    "value" TEXT,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "customer" TEXT,
    "customerId" TEXT,
    "orderNumber" TEXT,
    "orderId" TEXT,
    "dispatchId" TEXT,
    "dispatchNumber" TEXT,
    "workOrderId" TEXT,
    "workOrderNumber" TEXT,
    "productionId" TEXT,
    "productionNumber" TEXT,
    "qualityControlId" TEXT,
    "qcNumber" TEXT,
    "dispatchStatus" TEXT,
    "dispatchDate" DATE,
    "courierName" TEXT,
    "trackingNumber" TEXT,
    "invoiceDate" DATE,
    "dueDate" DATE,
    "items" JSONB,
    "discount" DECIMAL(14,2),
    "gstPercent" DECIMAL(7,2),
    "subtotal" DECIMAL(14,2),
    "taxableAmount" DECIMAL(14,2),
    "taxAmount" DECIMAL(14,2),
    "totalAmount" DECIMAL(14,2),
    "paidAmount" DECIMAL(14,2),
    "outstandingAmount" DECIMAL(14,2),
    "notes" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT,
    "sku" TEXT,
    "itemName" TEXT,
    "type" TEXT,
    "quantity" DECIMAL(14,3),
    "previousQuantity" DECIMAL(14,3),
    "newQuantity" DECIMAL(14,3),
    "supplier" TEXT,
    "purchaseNumber" TEXT,
    "unitCost" DECIMAL(14,2),
    "purchaseAmount" DECIMAL(14,2),
    "referenceType" TEXT,
    "referenceId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch" (
    "id" TEXT NOT NULL,
    "dispatchNumber" TEXT,
    "orderId" TEXT,
    "orderNumber" TEXT,
    "orderItemId" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "qualityControlId" TEXT,
    "qcNumber" TEXT,
    "qcResult" TEXT,
    "qcDate" DATE,
    "qcInspector" TEXT,
    "productionId" TEXT,
    "productionNumber" TEXT,
    "workOrderId" TEXT,
    "workOrderNumber" TEXT,
    "designName" TEXT,
    "itemDescription" TEXT,
    "garmentColor" TEXT,
    "garmentSize" TEXT,
    "qcPassedQuantity" INTEGER,
    "dispatchQuantity" INTEGER,
    "dispatchDate" DATE,
    "courierName" TEXT,
    "trackingNumber" TEXT,
    "shippingMode" TEXT,
    "dispatchMethod" TEXT,
    "packageCount" INTEGER,
    "totalWeight" DECIMAL(14,3),
    "vehicleNumber" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "deliveryAddress" TEXT,
    "packingInstructions" TEXT,
    "expectedDeliveryDate" DATE,
    "actualDeliveryDate" DATE,
    "status" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "workOrderNumber" TEXT,
    "orderId" TEXT,
    "orderNumber" TEXT,
    "orderItemId" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "customerPoNumber" TEXT,
    "digitizingId" TEXT,
    "digitizingNumber" TEXT,
    "itemType" TEXT,
    "itemDescription" TEXT,
    "designName" TEXT,
    "embroideryService" TEXT,
    "placement" TEXT,
    "garmentColor" TEXT,
    "garmentSize" TEXT,
    "orderedQuantity" INTEGER,
    "productionQuantity" INTEGER,
    "unit" TEXT,
    "stitchCount" INTEGER,
    "embroideryWidthMm" DECIMAL(12,2),
    "embroideryHeightMm" DECIMAL(12,2),
    "colourCount" INTEGER,
    "threadColors" TEXT,
    "fileFormat" TEXT,
    "machineName" TEXT,
    "operatorName" TEXT,
    "hoopSize" TEXT,
    "threadType" TEXT,
    "needleType" TEXT,
    "backingType" TEXT,
    "toppingRequired" TEXT,
    "machineSpeed" INTEGER,
    "sampleRequired" TEXT,
    "sampleApproved" TEXT,
    "sampleApprovedBy" TEXT,
    "plannedStartDate" DATE,
    "targetCompletionDate" DATE,
    "priority" TEXT,
    "status" TEXT,
    "packingInstructions" TEXT,
    "productionInstructions" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "supplierCode" TEXT,
    "supplierName" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "email" TEXT,
    "gstin" TEXT,
    "pan" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "paymentTermsDays" INTEGER,
    "leadTimeDays" INTEGER,
    "categories" TEXT,
    "bankName" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "ifscCode" TEXT,
    "upiId" TEXT,
    "notes" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "purchaseOrderNumber" TEXT,
    "supplierId" TEXT,
    "supplierCode" TEXT,
    "supplierName" TEXT,
    "supplierGstin" TEXT,
    "poDate" DATE,
    "expectedDeliveryDate" DATE,
    "paymentTermsDays" INTEGER,
    "reference" TEXT,
    "items" JSONB,
    "subtotal" DECIMAL(14,2),
    "taxAmount" DECIMAL(14,2),
    "totalAmount" DECIMAL(14,2),
    "receivedQuantity" DECIMAL(14,3),
    "pendingQuantity" DECIMAL(14,3),
    "status" TEXT,
    "deliveryAddress" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "returns_rework" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT,
    "caseType" TEXT,
    "sourceStage" TEXT,
    "orderId" TEXT,
    "orderNumber" TEXT,
    "orderItemId" TEXT,
    "workOrderId" TEXT,
    "workOrderNumber" TEXT,
    "productionId" TEXT,
    "qualityControlId" TEXT,
    "qcNumber" TEXT,
    "dispatchId" TEXT,
    "dispatchNumber" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "itemDescription" TEXT,
    "garmentColor" TEXT,
    "garmentSize" TEXT,
    "designName" TEXT,
    "reportedDate" DATE,
    "quantity" INTEGER,
    "reasonCategory" TEXT,
    "defectType" TEXT,
    "issueDetails" TEXT,
    "responsibility" TEXT,
    "severity" TEXT,
    "actionRequired" TEXT,
    "reworkQuantity" INTEGER,
    "replacementQuantity" INTEGER,
    "scrapQuantity" INTEGER,
    "refundQuantity" INTEGER,
    "estimatedCost" DECIMAL(14,2),
    "actualCost" DECIMAL(14,2),
    "assignedTo" TEXT,
    "targetDate" DATE,
    "completedDate" DATE,
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "preventiveAction" TEXT,
    "customerResolution" TEXT,
    "status" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "returns_rework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_master" (
    "id" TEXT NOT NULL,
    "sku" TEXT,
    "itemName" TEXT,
    "itemType" TEXT,
    "category" TEXT,
    "description" TEXT,
    "unit" TEXT,
    "sellingPrice" DECIMAL(14,2),
    "gstPercent" DECIMAL(7,2),
    "minimumSellingPrice" DECIMAL(14,2),
    "costPrice" DECIMAL(14,2),
    "customerPriceCategory" TEXT,
    "effectiveFrom" DATE,
    "effectiveTo" DATE,
    "status" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "price_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_bills" (
    "id" TEXT NOT NULL,
    "billNumber" TEXT,
    "supplierInvoiceNumber" TEXT,
    "supplierId" TEXT,
    "supplierCode" TEXT,
    "supplierName" TEXT,
    "purchaseOrderId" TEXT,
    "purchaseOrderNumber" TEXT,
    "billDate" DATE,
    "dueDate" DATE,
    "subtotal" DECIMAL(14,2),
    "taxAmount" DECIMAL(14,2),
    "totalAmount" DECIMAL(14,2),
    "notes" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "supplier_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_payments" (
    "id" TEXT NOT NULL,
    "supplierBillId" TEXT,
    "billNumber" TEXT,
    "supplierInvoiceNumber" TEXT,
    "supplierId" TEXT,
    "supplierCode" TEXT,
    "supplierName" TEXT,
    "purchaseOrderId" TEXT,
    "purchaseOrderNumber" TEXT,
    "paymentDate" DATE,
    "amount" DECIMAL(14,2),
    "paymentMethod" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "supplier_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_accounts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "status" TEXT,
    "emailVerified" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "customer_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "categoryCode" TEXT,
    "name" TEXT,
    "slug" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "displayOrder" INTEGER,
    "featured" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "productCode" TEXT,
    "sku" TEXT,
    "name" TEXT,
    "slug" TEXT,
    "categoryId" TEXT,
    "categoryName" TEXT,
    "productType" TEXT,
    "garmentType" TEXT,
    "shortDescription" TEXT,
    "description" TEXT,
    "primaryImage" TEXT,
    "additionalImages" TEXT,
    "priceMasterId" TEXT,
    "priceMasterSku" TEXT,
    "originalPrice" DECIMAL(14,2),
    "badge" TEXT,
    "featured" TEXT,
    "newArrival" TEXT,
    "allowCustomisation" TEXT,
    "availableColours" TEXT,
    "availableSizes" TEXT,
    "displayOrder" INTEGER,
    "status" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_customerCode_key" ON "customers"("customerCode");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_status_idx" ON "customers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "digitizing_digitizingNumber_key" ON "digitizing"("digitizingNumber");

-- CreateIndex
CREATE INDEX "digitizing_orderId_idx" ON "digitizing"("orderId");

-- CreateIndex
CREATE INDEX "digitizing_customerId_idx" ON "digitizing"("customerId");

-- CreateIndex
CREATE INDEX "digitizing_artworkId_idx" ON "digitizing"("artworkId");

-- CreateIndex
CREATE INDEX "digitizing_status_idx" ON "digitizing"("status");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_customerId_idx" ON "orders"("customerId");

-- CreateIndex
CREATE INDEX "orders_orderDate_idx" ON "orders"("orderDate");

-- CreateIndex
CREATE INDEX "orders_deliveryDate_idx" ON "orders"("deliveryDate");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "payments_invoiceId_idx" ON "payments"("invoiceId");

-- CreateIndex
CREATE INDEX "payments_customerId_idx" ON "payments"("customerId");

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_dispatchId_idx" ON "payments"("dispatchId");

-- CreateIndex
CREATE INDEX "payments_date_idx" ON "payments"("date");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotationNumber_key" ON "quotations"("quotationNumber");

-- CreateIndex
CREATE INDEX "quotations_customerId_idx" ON "quotations"("customerId");

-- CreateIndex
CREATE INDEX "quotations_date_idx" ON "quotations"("date");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE INDEX "artwork_orderId_idx" ON "artwork"("orderId");

-- CreateIndex
CREATE INDEX "artwork_customerId_idx" ON "artwork"("customerId");

-- CreateIndex
CREATE INDEX "artwork_status_idx" ON "artwork"("status");

-- CreateIndex
CREATE INDEX "production_workOrderId_idx" ON "production"("workOrderId");

-- CreateIndex
CREATE INDEX "production_orderId_idx" ON "production"("orderId");

-- CreateIndex
CREATE INDEX "production_customerId_idx" ON "production"("customerId");

-- CreateIndex
CREATE INDEX "production_digitizingId_idx" ON "production"("digitizingId");

-- CreateIndex
CREATE INDEX "production_status_idx" ON "production"("status");

-- CreateIndex
CREATE UNIQUE INDEX "quality_control_qcNumber_key" ON "quality_control"("qcNumber");

-- CreateIndex
CREATE INDEX "quality_control_productionId_idx" ON "quality_control"("productionId");

-- CreateIndex
CREATE INDEX "quality_control_workOrderId_idx" ON "quality_control"("workOrderId");

-- CreateIndex
CREATE INDEX "quality_control_orderId_idx" ON "quality_control"("orderId");

-- CreateIndex
CREATE INDEX "quality_control_customerId_idx" ON "quality_control"("customerId");

-- CreateIndex
CREATE INDEX "quality_control_qcStatus_idx" ON "quality_control"("qcStatus");

-- CreateIndex
CREATE INDEX "inventory_sku_idx" ON "inventory"("sku");

-- CreateIndex
CREATE INDEX "inventory_category_idx" ON "inventory"("category");

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date");

-- CreateIndex
CREATE INDEX "expenses_inventoryId_idx" ON "expenses"("inventoryId");

-- CreateIndex
CREATE INDEX "expenses_supplierId_idx" ON "expenses"("supplierId");

-- CreateIndex
CREATE INDEX "expenses_supplierBillId_idx" ON "expenses"("supplierBillId");

-- CreateIndex
CREATE INDEX "expenses_purchaseOrderId_idx" ON "expenses"("purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_customerId_idx" ON "invoices"("customerId");

-- CreateIndex
CREATE INDEX "invoices_orderId_idx" ON "invoices"("orderId");

-- CreateIndex
CREATE INDEX "invoices_dispatchId_idx" ON "invoices"("dispatchId");

-- CreateIndex
CREATE INDEX "invoices_invoiceDate_idx" ON "invoices"("invoiceDate");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "inventory_transactions_inventoryId_idx" ON "inventory_transactions"("inventoryId");

-- CreateIndex
CREATE INDEX "inventory_transactions_sku_idx" ON "inventory_transactions"("sku");

-- CreateIndex
CREATE INDEX "inventory_transactions_referenceId_idx" ON "inventory_transactions"("referenceId");

-- CreateIndex
CREATE INDEX "inventory_transactions_createdAt_idx" ON "inventory_transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "dispatch_dispatchNumber_key" ON "dispatch"("dispatchNumber");

-- CreateIndex
CREATE INDEX "dispatch_orderId_idx" ON "dispatch"("orderId");

-- CreateIndex
CREATE INDEX "dispatch_customerId_idx" ON "dispatch"("customerId");

-- CreateIndex
CREATE INDEX "dispatch_qualityControlId_idx" ON "dispatch"("qualityControlId");

-- CreateIndex
CREATE INDEX "dispatch_productionId_idx" ON "dispatch"("productionId");

-- CreateIndex
CREATE INDEX "dispatch_workOrderId_idx" ON "dispatch"("workOrderId");

-- CreateIndex
CREATE INDEX "dispatch_status_idx" ON "dispatch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_workOrderNumber_key" ON "work_orders"("workOrderNumber");

-- CreateIndex
CREATE INDEX "work_orders_orderId_idx" ON "work_orders"("orderId");

-- CreateIndex
CREATE INDEX "work_orders_customerId_idx" ON "work_orders"("customerId");

-- CreateIndex
CREATE INDEX "work_orders_digitizingId_idx" ON "work_orders"("digitizingId");

-- CreateIndex
CREATE INDEX "work_orders_status_idx" ON "work_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_supplierCode_key" ON "suppliers"("supplierCode");

-- CreateIndex
CREATE INDEX "suppliers_email_idx" ON "suppliers"("email");

-- CreateIndex
CREATE INDEX "suppliers_status_idx" ON "suppliers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_purchaseOrderNumber_key" ON "purchase_orders"("purchaseOrderNumber");

-- CreateIndex
CREATE INDEX "purchase_orders_supplierId_idx" ON "purchase_orders"("supplierId");

-- CreateIndex
CREATE INDEX "purchase_orders_poDate_idx" ON "purchase_orders"("poDate");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "returns_rework_caseNumber_key" ON "returns_rework"("caseNumber");

-- CreateIndex
CREATE INDEX "returns_rework_orderId_idx" ON "returns_rework"("orderId");

-- CreateIndex
CREATE INDEX "returns_rework_workOrderId_idx" ON "returns_rework"("workOrderId");

-- CreateIndex
CREATE INDEX "returns_rework_productionId_idx" ON "returns_rework"("productionId");

-- CreateIndex
CREATE INDEX "returns_rework_qualityControlId_idx" ON "returns_rework"("qualityControlId");

-- CreateIndex
CREATE INDEX "returns_rework_dispatchId_idx" ON "returns_rework"("dispatchId");

-- CreateIndex
CREATE INDEX "returns_rework_customerId_idx" ON "returns_rework"("customerId");

-- CreateIndex
CREATE INDEX "returns_rework_status_idx" ON "returns_rework"("status");

-- CreateIndex
CREATE INDEX "price_master_sku_idx" ON "price_master"("sku");

-- CreateIndex
CREATE INDEX "price_master_category_idx" ON "price_master"("category");

-- CreateIndex
CREATE INDEX "price_master_status_idx" ON "price_master"("status");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_bills_billNumber_key" ON "supplier_bills"("billNumber");

-- CreateIndex
CREATE INDEX "supplier_bills_supplierId_idx" ON "supplier_bills"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_bills_purchaseOrderId_idx" ON "supplier_bills"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "supplier_bills_billDate_idx" ON "supplier_bills"("billDate");

-- CreateIndex
CREATE INDEX "supplier_bills_status_idx" ON "supplier_bills"("status");

-- CreateIndex
CREATE INDEX "supplier_payments_supplierBillId_idx" ON "supplier_payments"("supplierBillId");

-- CreateIndex
CREATE INDEX "supplier_payments_supplierId_idx" ON "supplier_payments"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_payments_purchaseOrderId_idx" ON "supplier_payments"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "supplier_payments_paymentDate_idx" ON "supplier_payments"("paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "customer_accounts_email_key" ON "customer_accounts"("email");

-- CreateIndex
CREATE INDEX "customer_accounts_customerId_idx" ON "customer_accounts"("customerId");

-- CreateIndex
CREATE INDEX "customer_accounts_status_idx" ON "customer_accounts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_categoryCode_key" ON "product_categories"("categoryCode");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_slug_key" ON "product_categories"("slug");

-- CreateIndex
CREATE INDEX "product_categories_status_idx" ON "product_categories"("status");

-- CreateIndex
CREATE UNIQUE INDEX "products_productCode_key" ON "products"("productCode");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_priceMasterId_idx" ON "products"("priceMasterId");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");


-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- Backfill customers from users.
INSERT INTO "public"."Customer" ("id", "customerId", "userId", "name", "email", "phone", "createdAt", "updatedAt")
SELECT
    'cust_user_' || md5("id"),
    COALESCE("customerId", 'CUS-' || LPAD((ROW_NUMBER() OVER (ORDER BY "createdAt"))::TEXT, 4, '0')),
    "id",
    "name",
    "email",
    '',
    "createdAt",
    "updatedAt"
FROM "public"."User"
ON CONFLICT DO NOTHING;

-- Backfill guest/order-only customers that do not have a matching user.
WITH order_customers AS (
    SELECT
        MIN(o."id") AS "sourceId",
        COALESCE(NULLIF(o."customerId", ''), '') AS "externalCustomerId",
        COALESCE(NULLIF(o."customerName", ''), 'Customer') AS "name",
        COALESCE(NULLIF(o."customerEmail", ''), 'customer-' || md5(MIN(o."id")) || '@example.local') AS "email",
        COALESCE(MAX(o."phone"), '') AS "phone",
        MIN(o."createdAt") AS "createdAt",
        MAX(o."updatedAt") AS "updatedAt"
    FROM "public"."Order" o
    LEFT JOIN "public"."User" u ON u."id" = o."userId"
    LEFT JOIN "public"."Customer" c ON c."userId" = u."id"
        OR LOWER(c."email") = LOWER(COALESCE(o."customerEmail", ''))
        OR c."customerId" = o."customerId"
    WHERE c."id" IS NULL
    GROUP BY LOWER(COALESCE(o."customerEmail", '')), o."customerId", o."customerName", o."customerEmail"
),
numbered_order_customers AS (
    SELECT *, ROW_NUMBER() OVER (ORDER BY "createdAt", "sourceId") + 1000 AS seq
    FROM order_customers
)
INSERT INTO "public"."Customer" ("id", "customerId", "name", "email", "phone", "createdAt", "updatedAt")
SELECT
    'cust_order_' || md5("sourceId"),
    COALESCE(NULLIF("externalCustomerId", ''), 'CUS-' || seq::TEXT),
    "name",
    "email",
    "phone",
    "createdAt",
    "updatedAt"
FROM numbered_order_customers
ON CONFLICT DO NOTHING;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerId_key" ON "public"."Customer"("customerId");
CREATE UNIQUE INDEX "Customer_userId_key" ON "public"."Customer"("userId");
CREATE INDEX "Customer_email_idx" ON "public"."Customer"("email");

-- Prepare Order for Customer FK and the new status field.
ALTER TABLE "public"."Order"
ADD COLUMN "customerFk" TEXT,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';

UPDATE "public"."Order" o
SET "customerFk" = COALESCE(
        (SELECT c."id" FROM "public"."Customer" c WHERE c."userId" = o."userId" LIMIT 1),
        (SELECT c."id" FROM "public"."Customer" c WHERE LOWER(c."email") = LOWER(COALESCE(o."customerEmail", '')) LIMIT 1),
        (SELECT c."id" FROM "public"."Customer" c WHERE c."customerId" = o."customerId" LIMIT 1)
    ),
    "status" = COALESCE(NULLIF(o."orderStatus", ''), 'pending')
WHERE o."customerFk" IS NULL;

UPDATE "public"."Order" o
SET "customerFk" = c."id"
FROM "public"."Customer" c
WHERE o."customerFk" IS NULL
  AND (c."userId" = o."userId" OR LOWER(c."email") = LOWER(COALESCE(o."customerEmail", '')));

ALTER TABLE "public"."Order" ALTER COLUMN "customerFk" SET NOT NULL;

-- Replace embedded customer/payment columns with relational columns.
DROP INDEX IF EXISTS "public"."Order_orderId_key";
ALTER TABLE "public"."Order" DROP CONSTRAINT IF EXISTS "Order_userId_fkey";

ALTER TABLE "public"."Order"
DROP COLUMN "customerId",
DROP COLUMN "customerName",
DROP COLUMN "customerEmail",
DROP COLUMN "phone",
DROP COLUMN "orderStatus",
DROP COLUMN "orderDate";

ALTER TABLE "public"."Order" RENAME COLUMN "customerFk" TO "customerId";
ALTER TABLE "public"."Order" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "public"."Order" ALTER COLUMN "address" SET DEFAULT '{}';
ALTER TABLE "public"."Order" ALTER COLUMN "items" SET DEFAULT '[]';

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- Backfill paid/refunded embedded payment records as real transactions.
WITH payable_orders AS (
    SELECT
        o."id",
        o."customerId",
        o."totalAmount",
        COALESCE(NULLIF(o_old."paymentMethod", ''), 'ONLINE') AS "paymentMethod",
        COALESCE(NULLIF(o_old."paymentStatus", ''), 'PAID') AS "paymentStatus",
        o."createdAt",
        o."updatedAt",
        ROW_NUMBER() OVER (ORDER BY o."createdAt", o."id") + 1000 AS seq
    FROM "public"."Order" o
    JOIN (
        SELECT "id", "paymentMethod", "paymentStatus", "transactionId"
        FROM "public"."Order"
    ) o_old ON o_old."id" = o."id"
    WHERE COALESCE(NULLIF(o_old."transactionId", ''), '') <> ''
       OR UPPER(COALESCE(o_old."paymentStatus", '')) IN ('PAID', 'REFUNDED')
)
INSERT INTO "public"."Transaction" ("id", "transactionId", "orderId", "customerId", "amount", "paymentMethod", "paymentStatus", "createdAt", "updatedAt")
SELECT
    'txn_' || md5("id"),
    'TXN-' || seq::TEXT,
    "id",
    "customerId",
    "totalAmount",
    "paymentMethod",
    "paymentStatus",
    "createdAt",
    "updatedAt"
FROM payable_orders;

-- Repoint Order.transactionId from external text into Transaction.id.
UPDATE "public"."Order" o
SET "transactionId" = t."id"
FROM "public"."Transaction" t
WHERE t."orderId" = o."id";

UPDATE "public"."Order"
SET "transactionId" = NULL
WHERE "transactionId" IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM "public"."Transaction" t WHERE t."id" = "public"."Order"."transactionId"
  );

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "shipping" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grandTotal" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Paid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

WITH invoice_orders AS (
    SELECT
        t."id" AS "transactionPk",
        t."orderId",
        t."customerId",
        o."price" AS "subtotal",
        o."shippingCost" AS "shipping",
        o."totalAmount" AS "grandTotal",
        CASE WHEN UPPER(t."paymentStatus") = 'REFUNDED' THEN 'Refunded' ELSE 'Paid' END AS "status",
        t."createdAt",
        t."updatedAt",
        ROW_NUMBER() OVER (ORDER BY t."createdAt", t."id") + 1000 AS seq
    FROM "public"."Transaction" t
    JOIN "public"."Order" o ON o."id" = t."orderId"
    WHERE UPPER(t."paymentStatus") IN ('PAID', 'REFUNDED')
)
INSERT INTO "public"."Invoice" ("id", "invoiceId", "orderId", "transactionId", "customerId", "subtotal", "shipping", "tax", "grandTotal", "status", "createdAt", "updatedAt")
SELECT
    'inv_' || md5("orderId"),
    'INV-' || seq::TEXT,
    "orderId",
    "transactionPk",
    "customerId",
    "subtotal",
    "shipping",
    0,
    "grandTotal",
    "status",
    "createdAt",
    "updatedAt"
FROM invoice_orders;

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderId_key" ON "public"."Order"("orderId");
CREATE UNIQUE INDEX "Order_transactionId_key" ON "public"."Order"("transactionId");
CREATE INDEX "Order_customerId_idx" ON "public"."Order"("customerId");
CREATE INDEX "Order_userId_idx" ON "public"."Order"("userId");
CREATE INDEX "Order_status_idx" ON "public"."Order"("status");
CREATE UNIQUE INDEX "Transaction_transactionId_key" ON "public"."Transaction"("transactionId");
CREATE UNIQUE INDEX "Transaction_orderId_key" ON "public"."Transaction"("orderId");
CREATE INDEX "Transaction_customerId_idx" ON "public"."Transaction"("customerId");
CREATE INDEX "Transaction_paymentStatus_idx" ON "public"."Transaction"("paymentStatus");
CREATE UNIQUE INDEX "Invoice_invoiceId_key" ON "public"."Invoice"("invoiceId");
CREATE UNIQUE INDEX "Invoice_orderId_key" ON "public"."Invoice"("orderId");
CREATE UNIQUE INDEX "Invoice_transactionId_key" ON "public"."Invoice"("transactionId");
CREATE INDEX "Invoice_customerId_idx" ON "public"."Invoice"("customerId");
CREATE INDEX "Invoice_status_idx" ON "public"."Invoice"("status");

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."Order"
DROP COLUMN "paymentMethod",
DROP COLUMN "paymentStatus",
DROP COLUMN "payment";

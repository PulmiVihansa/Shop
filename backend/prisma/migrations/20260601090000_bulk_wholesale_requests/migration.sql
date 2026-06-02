-- AlterTable
ALTER TABLE "public"."BulkCustomer" RENAME COLUMN "name" TO "contactPerson";

ALTER TABLE "public"."BulkCustomer"
ADD COLUMN "companyName" TEXT,
ADD COLUMN "phone_new" TEXT NOT NULL DEFAULT '';

UPDATE "public"."BulkCustomer"
SET "companyName" = COALESCE(NULLIF("company", ''), "contactPerson"),
    "phone_new" = COALESCE("phone", '');

ALTER TABLE "public"."BulkCustomer"
DROP COLUMN IF EXISTS "company",
DROP COLUMN IF EXISTS "phone",
DROP COLUMN IF EXISTS "updatedAt";

ALTER TABLE "public"."BulkCustomer" RENAME COLUMN "phone_new" TO "phone";

ALTER TABLE "public"."BulkCustomer"
ALTER COLUMN "companyName" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."BulkOrderRequest" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "products" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "orderValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "message" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "bulkCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkOrderRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BulkCustomer_companyName_idx" ON "public"."BulkCustomer"("companyName");

-- CreateIndex
CREATE INDEX "BulkOrderRequest_bulkCustomerId_idx" ON "public"."BulkOrderRequest"("bulkCustomerId");

-- CreateIndex
CREATE INDEX "BulkOrderRequest_status_idx" ON "public"."BulkOrderRequest"("status");

-- AddForeignKey
ALTER TABLE "public"."BulkOrderRequest" ADD CONSTRAINT "BulkOrderRequest_bulkCustomerId_fkey" FOREIGN KEY ("bulkCustomerId") REFERENCES "public"."BulkCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

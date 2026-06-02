ALTER TABLE "public"."Invoice"
ADD COLUMN IF NOT EXISTS "customerName" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "customerEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "customerPhone" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "customerAddress" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "emailSent" BOOLEAN NOT NULL DEFAULT false;

UPDATE "public"."Invoice" i
SET
  "customerName" = COALESCE(NULLIF(i."customerName", ''), c."name", ''),
  "customerEmail" = COALESCE(NULLIF(i."customerEmail", ''), c."email", ''),
  "customerPhone" = COALESCE(NULLIF(i."customerPhone", ''), c."phone", ''),
  "customerAddress" = COALESCE(i."customerAddress", o."address", '{}')
FROM "public"."Customer" c, "public"."Order" o
WHERE i."customerId" = c."id"
  AND i."orderId" = o."id";

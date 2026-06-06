ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "PaymentSettings" ADD COLUMN IF NOT EXISTS "sandboxMode" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Order"
SET
  "orderStatus" = UPPER(COALESCE("status", 'pending')),
  "paymentStatus" = COALESCE("paymentStatus", 'PENDING');

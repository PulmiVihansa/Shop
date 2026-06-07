CREATE TABLE IF NOT EXISTS "GiftVoucher" (
  "id" TEXT NOT NULL,
  "voucherCode" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "recipientName" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "senderEmail" TEXT NOT NULL,
  "message" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "pdfUrl" TEXT NOT NULL DEFAULT '',
  "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "redeemedAt" TIMESTAMP(3),
  "orderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GiftVoucher_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GiftVoucher_voucherCode_key" ON "GiftVoucher"("voucherCode");
CREATE UNIQUE INDEX IF NOT EXISTS "GiftVoucher_orderId_key" ON "GiftVoucher"("orderId");
CREATE INDEX IF NOT EXISTS "GiftVoucher_status_purchasedAt_idx" ON "GiftVoucher"("status", "purchasedAt");
CREATE INDEX IF NOT EXISTS "GiftVoucher_recipientEmail_idx" ON "GiftVoucher"("recipientEmail");
CREATE INDEX IF NOT EXISTS "GiftVoucher_senderEmail_idx" ON "GiftVoucher"("senderEmail");

CREATE TABLE IF NOT EXISTS "FinanceTransaction" (
  "id" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Completed',
  "reference" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinanceTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FinanceTransaction_transactionId_key" ON "FinanceTransaction"("transactionId");
CREATE INDEX IF NOT EXISTS "FinanceTransaction_category_createdAt_idx" ON "FinanceTransaction"("category", "createdAt");
CREATE INDEX IF NOT EXISTS "FinanceTransaction_type_status_idx" ON "FinanceTransaction"("type", "status");
CREATE INDEX IF NOT EXISTS "FinanceTransaction_createdAt_idx" ON "FinanceTransaction"("createdAt");

CREATE TABLE IF NOT EXISTS "FeaturedProduct" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeaturedProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FeaturedProduct_productId_key" ON "FeaturedProduct"("productId");
CREATE INDEX IF NOT EXISTS "FeaturedProduct_isActive_displayOrder_idx" ON "FeaturedProduct"("isActive", "displayOrder");

ALTER TABLE "FeaturedProduct"
  ADD CONSTRAINT "FeaturedProduct_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "SaleCampaign" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "originalPrice" DOUBLE PRECISION NOT NULL,
  "salePrice" DOUBLE PRECISION NOT NULL,
  "discountPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "badge" TEXT NOT NULL DEFAULT '',
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SaleCampaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SaleCampaign_productId_idx" ON "SaleCampaign"("productId");
CREATE INDEX IF NOT EXISTS "SaleCampaign_isActive_startDate_endDate_idx" ON "SaleCampaign"("isActive", "startDate", "endDate");

ALTER TABLE "SaleCampaign"
  ADD CONSTRAINT "SaleCampaign_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

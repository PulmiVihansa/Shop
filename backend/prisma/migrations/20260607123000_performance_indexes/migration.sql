-- Product listing and collection filters
CREATE INDEX IF NOT EXISTS "Product_collection_createdAt_idx" ON "Product"("collection", "createdAt");
CREATE INDEX IF NOT EXISTS "Product_collection_category_createdAt_idx" ON "Product"("collection", "category", "createdAt");
CREATE INDEX IF NOT EXISTS "Product_stock_idx" ON "Product"("stock");

-- Dashboard, reporting, and admin list sorting
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS "Order_paymentStatus_createdAt_idx" ON "Order"("paymentStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_orderStatus_createdAt_idx" ON "Order"("orderStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx" ON "Transaction"("createdAt");
CREATE INDEX IF NOT EXISTS "Invoice_createdAt_idx" ON "Invoice"("createdAt");
CREATE INDEX IF NOT EXISTS "Expense_category_date_idx" ON "Expense"("category", "date");
CREATE INDEX IF NOT EXISTS "Expense_date_idx" ON "Expense"("date");
CREATE INDEX IF NOT EXISTS "BulkOrderRequest_createdAt_idx" ON "BulkOrderRequest"("createdAt");
CREATE INDEX IF NOT EXISTS "SaleCampaign_createdAt_idx" ON "SaleCampaign"("createdAt");

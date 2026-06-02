ALTER TABLE "public"."Order"
ALTER COLUMN "transactionId" DROP DEFAULT,
ALTER COLUMN "transactionId" DROP NOT NULL;

UPDATE "public"."Order"
SET "transactionId" = NULL
WHERE "transactionId" = '';

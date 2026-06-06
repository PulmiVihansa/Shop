UPDATE "Product"
SET
  "collection" = 'men',
  "category" = CASE
    WHEN "category" IN ('Graphic Tees', 'Oversized Tees', 'Premium T-Shirts', 'Shirts', 'Polo Shirts', 'Jackets', 'Hoodies', 'Sweatshirts')
      THEN "category"
    WHEN "category" ILIKE '%shirt%' OR "category" ILIKE '%blouse%' OR "category" ILIKE '%top%'
      THEN 'Shirts'
    WHEN "category" ILIKE '%hood%'
      THEN 'Hoodies'
    WHEN "category" ILIKE '%sweat%'
      THEN 'Sweatshirts'
    WHEN "category" ILIKE '%jacket%' OR "category" ILIKE '%coat%'
      THEN 'Jackets'
    ELSE 'Graphic Tees'
  END;

ALTER TABLE "Product" ALTER COLUMN "collection" SET DEFAULT 'men';
ALTER TABLE "Product" ALTER COLUMN "sizeStock" SET DEFAULT '{"XS":0,"S":0,"M":0,"L":0,"XL":0,"XXL":0}';
ALTER TABLE "Product" DROP COLUMN IF EXISTS "subcategory";

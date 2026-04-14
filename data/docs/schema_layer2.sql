-- Layer 2 Schema Extension: Add year/engine-level fitment + parsed product data
-- Run this in Supabase SQL Editor

-- 1. Add parsed year/engine columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS year_start INT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS year_end INT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS parsed_engine_code TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS parsed_displacement TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS parsed_config TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS magento_make TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS magento_model TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS magento_engine TEXT;

-- 2. Add year_id and engine_id to product_fitment for YMME-level mapping
ALTER TABLE product_fitment ADD COLUMN IF NOT EXISTS year_start INT;
ALTER TABLE product_fitment ADD COLUMN IF NOT EXISTS year_end INT;
ALTER TABLE product_fitment ADD COLUMN IF NOT EXISTS engine_pattern TEXT;
ALTER TABLE product_fitment ADD COLUMN IF NOT EXISTS confidence INT DEFAULT 0;

-- 3. Drop the old unique constraint (it doesn't include year) and add a better one
-- First check if the constraint exists
ALTER TABLE product_fitment DROP CONSTRAINT IF EXISTS product_fitment_product_id_make_id_model_id_key;

-- Add new unique constraint including year range
ALTER TABLE product_fitment ADD CONSTRAINT product_fitment_unique_mapping
    UNIQUE (product_id, make_id, model_id, year_start, year_end, engine_pattern);

-- 4. Indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_products_year_range ON products(year_start, year_end);
CREATE INDEX IF NOT EXISTS idx_products_displacement ON products(parsed_displacement);
CREATE INDEX IF NOT EXISTS idx_products_engine_code ON products(parsed_engine_code);
CREATE INDEX IF NOT EXISTS idx_fitment_year_range ON product_fitment(year_start, year_end);
CREATE INDEX IF NOT EXISTS idx_fitment_confidence ON product_fitment(confidence);

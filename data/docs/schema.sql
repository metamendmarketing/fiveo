-- FiveO Motorsport - Database Schema
-- Run this in the Supabase SQL Editor or via the loader script.
-- ═══════════════════════════════════════════
-- VEHICLES (from fitment tree)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS makes (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    finder_value TEXT,
    finder_path  TEXT
);

CREATE TABLE IF NOT EXISTS models (
    id          SERIAL PRIMARY KEY,
    make_id     INT NOT NULL REFERENCES makes(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    finder_value TEXT,
    finder_path  TEXT,
    UNIQUE(make_id, name)
);

CREATE TABLE IF NOT EXISTS years (
    id          SERIAL PRIMARY KEY,
    model_id    INT NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    year        INT NOT NULL,
    finder_value TEXT,
    finder_path  TEXT,
    UNIQUE(model_id, year)
);

CREATE TABLE IF NOT EXISTS engines (
    id          SERIAL PRIMARY KEY,
    year_id     INT NOT NULL REFERENCES years(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    trim        TEXT,
    config      TEXT,
    displacement TEXT,
    engine_code TEXT,
    fuel_type   TEXT,
    finder_value TEXT,
    finder_path  TEXT,
    UNIQUE(year_id, label)
);

-- ═══════════════════════════════════════════
-- PRODUCTS (from enriched catalog)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS products (
    id              SERIAL PRIMARY KEY,
    sku             TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    price           NUMERIC(10,2),
    url_key         TEXT,
    product_url     TEXT,
    description     TEXT,
    flow_rate_cc    NUMERIC(8,2),
    impedance       TEXT,
    connector_type  TEXT,
    injector_type   TEXT,
    fuel_types      TEXT[],
    manufacturer    TEXT,
    raw_specs       JSONB,
    raw_categories  TEXT[],
    notes           TEXT[]
);

-- ═══════════════════════════════════════════
-- PRODUCT ↔ VEHICLE MAPPING
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS product_fitment (
    id          SERIAL PRIMARY KEY,
    product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    make_id     INT REFERENCES makes(id) ON DELETE CASCADE,
    model_id    INT REFERENCES models(id) ON DELETE CASCADE,
    match_source TEXT NOT NULL,
    UNIQUE(product_id, make_id, model_id)
);

-- ═══════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_models_make ON models(make_id);
CREATE INDEX IF NOT EXISTS idx_years_model ON years(model_id);
CREATE INDEX IF NOT EXISTS idx_engines_year ON engines(year_id);
CREATE INDEX IF NOT EXISTS idx_fitment_product ON product_fitment(product_id);
CREATE INDEX IF NOT EXISTS idx_fitment_make ON product_fitment(make_id);
CREATE INDEX IF NOT EXISTS idx_fitment_model ON product_fitment(model_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_flow ON products(flow_rate_cc);
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON products(manufacturer);

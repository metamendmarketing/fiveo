-- Layer 3 Schema: OEM Cross-Reference + AI Knowledge Base
-- Run this in Supabase SQL Editor

-- 1. OEM Part Number Cross-Reference
-- Enables: "I have a Bosch 0280155884, what cars does it fit?"
CREATE TABLE IF NOT EXISTS oem_cross_reference (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    oem_manufacturer TEXT NOT NULL,      -- 'bosch', 'denso', 'keihin', 'gm'
    oem_part_number TEXT NOT NULL,       -- '0280155884'
    product_sku TEXT,
    product_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oem_part_number ON oem_cross_reference(oem_part_number);
CREATE INDEX IF NOT EXISTS idx_oem_manufacturer ON oem_cross_reference(oem_manufacturer);
CREATE INDEX IF NOT EXISTS idx_oem_product_id ON oem_cross_reference(product_id);

-- 2. Stock Flow Rates per Engine Code
-- Enables: "What's the stock injector flow rate for a B18B1?"
CREATE TABLE IF NOT EXISTS stock_flow_rates (
    id BIGSERIAL PRIMARY KEY,
    engine_code TEXT NOT NULL UNIQUE,
    flow_rate_cc NUMERIC,
    impedance_ohms NUMERIC,
    connector_type TEXT,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_sfr_engine_code ON stock_flow_rates(engine_code);

-- 3. Knowledge Base — the "Ask Anything" content store
-- Stores ALL searchable content: technical guides, product specs,
-- website pages, PDF extracts, brochures, FAQs, etc.
-- Designed for RAG retrieval with optional pgvector embeddings later.
CREATE TABLE IF NOT EXISTS knowledge_base (
    id BIGSERIAL PRIMARY KEY,
    category TEXT NOT NULL,              -- 'technical_guide', 'product_spec', 'website_content',
                                         -- 'brochure', 'faq', 'compatibility', 'upgrade_guide'
    title TEXT NOT NULL,                 -- searchable title
    content TEXT NOT NULL,               -- the actual text content
    metadata JSONB DEFAULT '{}',         -- flexible extra data (source_url, product_id, etc.)
    tags TEXT[] DEFAULT '{}',            -- searchable tags for filtering
    source TEXT,                         -- where this came from: 'fiveo_website', 'bosch_catalog', etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_kb_tags ON knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_kb_title ON knowledge_base USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_kb_content ON knowledge_base USING GIN(to_tsvector('english', content));

-- Full-text search function for the AI
CREATE OR REPLACE FUNCTION search_knowledge(query TEXT, category_filter TEXT DEFAULT NULL, max_results INT DEFAULT 10)
RETURNS TABLE(id BIGINT, category TEXT, title TEXT, content TEXT, metadata JSONB, rank REAL) AS $$
BEGIN
    RETURN QUERY
    SELECT kb.id, kb.category, kb.title, kb.content, kb.metadata,
           ts_rank(to_tsvector('english', kb.title || ' ' || kb.content), websearch_to_tsquery('english', query)) AS rank
    FROM knowledge_base kb
    WHERE to_tsvector('english', kb.title || ' ' || kb.content) @@ websearch_to_tsquery('english', query)
      AND (category_filter IS NULL OR kb.category = category_filter)
    ORDER BY rank DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Product search function for the AI (searches across products + fitment + specs)
CREATE OR REPLACE FUNCTION search_products_by_vehicle(
    p_make TEXT DEFAULT NULL,
    p_model TEXT DEFAULT NULL,
    p_year INT DEFAULT NULL,
    p_engine_code TEXT DEFAULT NULL
)
RETURNS TABLE(
    product_id BIGINT, sku TEXT, product_name TEXT,
    flow_rate NUMERIC, impedance TEXT, connector TEXT, price NUMERIC,
    match_confidence INT, match_source TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (p.id)
        p.id, p.sku, p.name,
        p.flow_rate_cc, p.impedance, p.connector_type, p.price,
        COALESCE(pf.confidence, 0), pf.match_source
    FROM products p
    JOIN product_fitment pf ON pf.product_id = p.id
    JOIN makes mk ON mk.id = pf.make_id
    LEFT JOIN models md ON md.id = pf.model_id
    WHERE (p_make IS NULL OR UPPER(mk.name) = UPPER(p_make))
      AND (p_model IS NULL OR UPPER(md.name) = UPPER(p_model))
      AND (p_year IS NULL OR (
          (pf.year_start IS NULL AND pf.year_end IS NULL) OR
          (pf.year_start <= p_year AND pf.year_end >= p_year) OR
          (pf.year_start IS NULL AND pf.year_end IS NULL)
      ))
    ORDER BY p.id, COALESCE(pf.confidence, 0) DESC;
END;
$$ LANGUAGE plpgsql;

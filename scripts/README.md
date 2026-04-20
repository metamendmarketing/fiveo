# FiveO Data Pipeline

This directory contains the Python and Ruby scripts responsible for harvesting, enriching, and loading product data into the Supabase database.

## Execution Flow

For a full refresh of the database, the scripts should be run in the following sequence:

### 1. Harvesting
Extract raw data from source locations (magento, cross-references, etc.)
- `harvesters/brand_stage_ingest.py`
- `harvesters/oracle_ingest.py`
- ...etc.

### 2. Normalization
Standardize raw data into consistent JSON formats.
- `normalize_magento_products.rb`: Normalizes raw Magento exports.

### 3. Enrichment (The "Layer" System)
Process the data through progressive enrichment layers.
- **Layer 2**: `layer2_enrich.py` & `layer2_engine_match.py` (Vehicle/Engine association)
- **Layer 3**: `layer3_enrichment.py` (Deep specs and fitment mapping)
- **Layer 4**: `layer4_harvester_sync.py` (Syncing harvested insights)
- **Layer 5**: `layer5_text_enrichment.py` (LLM/Text-based descriptions)
- **Layer 6**: `layer6_spec_sync.py` (Final specification validation)

### 4. Finder Enrichment
- `enrich_products_finder.rb`: Generates the final enriched product JSON with storefront URLs and finder-specific fields.

### 5. Final Load
- `load_supabase.py`: Upserts the final normalized and enriched datasets into Supabase.

## Requirements
- Python 3.9+
- Ruby 3.0+
- `.env` file with `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.

## Directory Structure
- `fitment/`: Scripts related strictly to vehicle fitment logic.
- `harvesters/`: Standalone ingestion scripts for different data sources.

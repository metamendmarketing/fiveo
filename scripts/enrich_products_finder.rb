#!/usr/bin/env ruby
# frozen_string_literal: true

# Enriches products.normalized.json with storefront URLs and finder-oriented fields
# derived from category paths + fitment.*. Optionally merges data/fitment/*.json when
# you run the crawler locally (not available inside this workspace without your cookies).
#
# Usage:
#   ruby scripts/enrich_products_finder.rb
#
# Env:
#   STORE_BASE_URL=https://www.fiveomotorsport.com  (default)
#   PRODUCTS_JSON=...  FITMENT_RECORDS_JSON=...  OUT_JSON=...

require "json"
require "time"
require "fileutils"
require "uri"

ROOT = File.expand_path("..", __dir__)
PRODUCTS_PATH = ENV.fetch("PRODUCTS_JSON", File.join(ROOT, "data/normalized/products.normalized.json"))
FITMENT_RECORDS_PATH = ENV.fetch("FITMENT_RECORDS_PATH", File.join(ROOT, "data/fitment/fitment_records.json"))
FITMENT_MAP_PATH = ENV.fetch("FITMENT_MAP_PATH", File.join(ROOT, "data/fitment/product_vehicle_map.json"))
OUT_PATH = ENV.fetch("OUT_JSON", File.join(ROOT, "data/normalized/products.enriched.json"))
STORE_BASE = ENV.fetch("STORE_BASE_URL", "https://www.fiveomotorsport.com").sub(%r{/\z}, "")

def slugify(str)
  return nil if str.nil?

  s = str.to_s.strip.downcase
  return nil if s.empty?

  s = s.gsub(/[^a-z0-9]+/i, "-")
  s.gsub(/^-|-$/, "").gsub(/-+/, "-")
end

def root_line_from_categories(categories)
  cats = categories.is_a?(Array) ? categories : []
  return "fuel-pumps" if cats.any? { |c| c.to_s.include?("Fuel Pumps") }
  return "fuel-injectors" if cats.any? { |c| c.to_s.include?("Injectors") }

  "fuel-injectors"
end

def deepest_make_model_from_categories(categories)
  cats = categories.is_a?(Array) ? categories : []
  best = nil
  cats.each do |c|
    c = c.to_s
    next unless c.start_with?("Search By Vehicle/Makes/")

    rest = c.delete_prefix("Search By Vehicle/Makes/")
    parts = rest.split("/").map(&:strip).reject(&:empty?)
    next if parts.empty?

    best = parts if best.nil? || parts.size > best.size
  end
  return [nil, nil] unless best

  make = best[0]
  model = best.size >= 2 ? best[1..].join("/") : nil
  [make, model]
end

def product_page_url(url_key)
  return nil if url_key.nil? || url_key.to_s.strip.empty?

  "#{STORE_BASE}/#{url_key.to_s.strip}.html"
end

# Store pattern (observed): /{line}/{make}/{model}/{year}/{engine-slug}/
def canonical_vehicle_url(root_line, make, model, year, engine_raw)
  sm = slugify(make)
  mo = slugify(model)
  yr = year.to_s.strip[/\A(19|20)\d{2}\z/] || nil
  eng = slugify(engine_raw)
  return nil if sm.nil? || mo.nil? || yr.nil? || eng.nil?

  "#{STORE_BASE}/#{root_line}/#{sm}/#{mo}/#{yr}/#{eng}/"
end

def load_json_if_exists(path)
  return nil unless File.file?(path)

  JSON.parse(File.read(path, encoding: "UTF-8"))
rescue StandardError => e
  warn "Skip #{path}: #{e.message}"
  nil
end

def main
  unless File.file?(PRODUCTS_PATH)
    warn "Missing #{PRODUCTS_PATH}"
    exit 1
  end

  data = JSON.parse(File.read(PRODUCTS_PATH, encoding: "UTF-8"))
  products = data["products"] || []
  fitment_recs = load_json_if_exists(FITMENT_RECORDS_PATH)
  fitment_map = load_json_if_exists(FITMENT_MAP_PATH)

  rec_count = fitment_recs && fitment_recs["records"] ? fitment_recs["records"].size : 0
  map_count = fitment_map && fitment_map["mappings"] ? fitment_map["mappings"].size : 0

  enriched = products.map do |p|
    cats = p["categories"] || []
    f = p["fitment"] || {}
    root = root_line_from_categories(cats)
    mk, md = deepest_make_model_from_categories(cats)

    make = f["make"] || mk
    model = f["model"] || md
    year = f["year"]
    engine = f["engine"]

    url_key = p["url_key"]
    page = product_page_url(url_key)

    canon = canonical_vehicle_url(root, make, model, year, engine)

    {
      "sku" => p["sku"],
      "name" => p["name"],
      "price" => p["price"],
      "url_key" => url_key,
      "product_page_url" => page,
      "categories" => cats,
      "fitment" => f,
      "specs" => p["specs"],
      "description" => p["description"],
      "notes" => p["notes"],
      "raw_source_fields" => p["raw_source_fields"],
      "finder_enrichment" => {
        "store_base_url" => STORE_BASE,
        "finder_root_line" => root,
        "categories_make_model_deepest" => {
          "make" => mk,
          "model" => md
        },
        "canonical_vehicle_url" => canon,
        "canonical_vehicle_url_complete" => !canon.nil?,
        "vehicle_path" => canon ? URI.parse(canon).path.sub(%r{/\z}, "") : nil,
        "fitment_join_source" => "magento_export_normalized",
        "fitment_records_available" => rec_count,
        "product_vehicle_mappings_available" => map_count
      }
    }
  end

  # fitment_records.json from pfcategory crawl uses Magento category id paths, not public
  # fuel-injectors/... slugs — automatic merge requires a future mapping table.

  # Optional: map SKUs from product_vehicle_map.json
  if fitment_map && fitment_map["mappings"].is_a?(Array)
    sku_to_ctx = {}
    fitment_map["mappings"].each do |m|
      (m["products"] || []).each do |pr|
        sku = pr["sku"] || pr["sku".to_sym]
        next if sku.to_s.empty?

        sku_to_ctx[sku.to_s] ||= []
        sku_to_ctx[sku.to_s] << { "vehicle_context" => m["vehicle_context"], "product" => pr }
      end
    end
    enriched.each do |row|
      sku = row["sku"].to_s
      next if sku.empty?

      next unless sku_to_ctx[sku]

      row["finder_enrichment"]["finder_product_vehicle_map_hits"] = sku_to_ctx[sku]
    end
  end

  out = {
    "meta" => {
      "source_products" => PRODUCTS_PATH,
      "fitment_records_path" => File.file?(FITMENT_RECORDS_PATH) ? FITMENT_RECORDS_PATH : nil,
      "product_vehicle_map_path" => File.file?(FITMENT_MAP_PATH) ? FITMENT_MAP_PATH : nil,
      "generated_at" => Time.now.utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
      "product_count" => enriched.size,
      "enrichment_note" => "Finder crawl files optional; re-run after crawl_pfcategory_fitment.rb + product map capture.",
      "limitations" => [
        "canonical_vehicle_url is only set when fitment has make, model, a 4-digit year, and a single engine string (slug). Most SKUs omit year/engine.",
        "data/fitment/*.json was absent here — re-run enrichment locally after crawl + product map capture to merge.",
        "Do not treat canonical_vehicle_url as exclusive proof of fitment."
      ]
    },
    "products" => enriched
  }

  FileUtils.mkdir_p(File.dirname(OUT_PATH))
  File.write(OUT_PATH, JSON.pretty_generate(out))
  puts "Wrote #{OUT_PATH} (#{enriched.size} products)"
  puts "Fitment records merged: #{rec_count} available, product map entries: #{map_count}"
end

main if __FILE__ == $PROGRAM_NAME

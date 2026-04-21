#!/usr/bin/env ruby
# frozen_string_literal: true

require "csv"
require "json"
require "fileutils"
require "time"

RAW_GLOB = File.expand_path("../data/raw/*.csv", __dir__)
OUT_JSON = File.expand_path("../data/normalized/products.normalized.json", __dir__)
OUT_SUMMARY = File.expand_path("../data/normalized/normalization_summary.txt", __dir__)
CATALOG_YEAR_ATTR = "2016" # Magento export uses this as meta year; do not treat as vehicle year
MEDIA_BASE_URL = "https://www.fiveomotorsport.com/pub/media/catalog/product"

# Map raw additional_attributes keys to standardized names in other_relevant_specs / specs
ATTR_KEY_ALIASES = {
  "cc_min_at_3_bar" => "cc_min_at_3_bar",
  "lbs_hr_at_43_psi" => "lbs_hr_at_43_psi",
  "rating_lph" => "flow_lph_rating",
  "maximum_psi" => "maximum_psi",
  "impedance" => "impedance",
  "connector_type" => "connector_type",
  "manufacturer" => "manufacturer",
  "part_number" => "part_number",
  "option" => "selling_option",
  "oem_or_aftermarket" => "oem_or_aftermarket",
  "fitment" => "fitment_raw",
  "keywords" => "keywords_raw",
  "quickbooks_sku" => "quickbooks_sku"
}.freeze

# Multi-segment engine uses pipe-quoted chunks: engine="A"|"B" — breaks a naive quote parser.
def scrub_multi_segment_engine_fields(raw)
  return raw if raw.nil?

  raw.gsub(/engine="[^"]*"(?:\|"[^"]*")+/, 'engine="__MULTI_ENGINE__"')
end

# After CSV parse, Magento exports typically look like: sw_featured="No",cc_min_at_3_bar="260"
# (CSV unescapes doubled quotes from the file into a single pair of ASCII quotes.)
def parse_magento_additional_attributes(str)
  return {} if str.nil? || str.strip.empty?

  out = {}
  i = 0
  n = str.length
  while i < n
    i += 1 while i < n && %[,\s\r\n].include?(str[i])
    break if i >= n

    eq = str.index("=", i)
    break unless eq

    key = str[i...eq].strip
    i = eq + 1
    i += 1 while i < n && str[i] == " "

    next unless i < n && str[i] == '"'

    i += 1
    buf = +""
    while i < n
      if str[i] == "\\" && (i + 1) < n && str[i + 1] == '"'
        buf << '"'
        i += 2
      elsif str[i] == '"'
        i += 1
        break
      else
        buf << str[i]
        i += 1
      end
    end
    out[key] = buf.freeze
  end
  out
end

def parse_float_loose(s)
  return nil if s.nil?

  m = s.to_s.match(/-?\d+(?:\.\d+)?/)
  m ? m[0].to_f : nil
end

def extract_flow_rate_cc(val)
  return nil if val.nil?

  v = val.strip
  return nil if v.empty?
  return nil if /please select|select an option/i.match?(v)

  # Prefer explicit cc/min
  if (m = v.match(/(\d+(?:\.\d+)?)\s*cc\/min/i))
    return m[1].to_f
  end
  if (m = v.match(/(\d+(?:\.\d+)?)\s*cc\b/i))
    return m[1].to_f
  end
  # Bare number from cc_min_at_3_bar like "260"
  if /^\d+(?:\.\d+)?$/.match?(v)
    return v.to_f
  end

  nil
end

def clean_impedance(val)
  return nil if val.nil? || val.strip.empty?

  v = val.strip
  v.gsub(/\s+/, " ")
end

def normalize_connector(val)
  return nil if val.nil? || val.strip.empty?

  val.strip
end

def infer_fuel_types(attrs, categories_str, _name, _description)
  blob = [attrs["keywords"], attrs["fitment"], categories_str].compact.join(" ")
  types = []
  types << "gasoline" if /\bGAS\b|\bgasoline\b|\bpetrol\b/i.match?(blob)
  types << "diesel" if /\bDIESEL\b|\bdiesel\b/i.match?(blob)
  types << "e85" if /\bE85\b|\bethanol\b/i.match?(blob)
  types.uniq
  types.empty? ? nil : types
end

def injector_type_from_row(categories_str, oem_raw)
  cats = (categories_str || "").downcase
  if cats.include?("fuel pumps") && !cats.include?("injectors")
    return "fuel_pump"
  end
  return nil if oem_raw.nil? || oem_raw.strip.empty?

  case oem_raw.strip.downcase
  when "oem" then "oem_injector"
  when "oem upgrade" then "oem_upgrade_injector"
  when "high performance" then "high_performance"
  else
    oem_raw.strip
  end
end

def category_paths(categories_str)
  return [] if categories_str.nil? || categories_str.strip.empty?

  categories_str.split(",").map(&:strip).reject(&:empty?)
end

def extract_fitment_from_categories(paths)
  makes_models = []
  paths.each do |p|
    next unless p.start_with?("Search By Vehicle/Makes/")

    rest = p.delete_prefix("Search By Vehicle/Makes/")
    parts = rest.split("/").map(&:strip).reject(&:empty?)
    next if parts.empty?

    make = parts[0]
    model = parts.length >= 2 ? parts[1..].join("/") : nil
    makes_models << { make: make, model: model }
  end
  makes_models
end

def consolidate_fitment(mm_rows)
  return { make: nil, model: nil } if mm_rows.empty?

  pairs = mm_rows.map { |r| [r[:make], r[:model]] }.uniq
  makes = pairs.map(&:first).compact.uniq
  make = makes.length == 1 ? makes[0] : nil

  model = nil
  if make
    models_with_path = pairs.select { |_m, mo| mo && !mo.to_s.strip.empty? }.map(&:last).uniq
    model = models_with_path.length == 1 ? models_with_path[0] : nil
  end
  { make: make, model: model }
end

def attrs_vehicle_year(year_val)
  return nil if year_val.nil? || year_val.strip.empty?

  y = year_val.strip
  return nil if y == CATALOG_YEAR_ATTR
  return nil unless /\A(19|20)\d{2}\z/.match?(y)

  y
end

def extract_engine(attrs)
  e = attrs["engine"]
  return [nil, nil] if e.nil? || e.strip.empty?
  return [nil, "multiple_engine_variants_in_source"] if e.strip == "__MULTI_ENGINE__"

  if e.include?("|")
    [nil, "multiple_engine_variants_in_source"]
  else
    [e.strip, nil]
  end
end

def flow_rate_cc_from_row(attrs)
  v1 = attrs["cc_min_at_3_bar"]
  v2 = attrs["flow_rate"]
  extract_flow_rate_cc(v1) || extract_flow_rate_cc(v2)
end

def build_other_specs(attrs)
  skip = %w[
    sw_featured is_hot dynamic_description_id quickbooks_sku
    keywords year oem_or_aftermarket flow_rate connector_type impedance
    cc_min_at_3_bar lbs_hr_at_43_psi rating_lph maximum_psi fitment make model engine
    mp_exclude_sitemap rma_allowed apply_core_fee ma_extra_fee_attribute override_fee
    wesupply_estimation_display synced_to_yotpo_product
  ]
  other = {}
  attrs.each do |k, v|
    next if v.nil? || v.to_s.strip.empty?
    next if skip.include?(k)

    std = ATTR_KEY_ALIASES[k] || k
    other[std] = v.to_s.strip
  end
  # Promote common performance attrs for pumps / injectors when not in primary specs
  %w[lbs_hr_at_43_psi rating_lph maximum_psi].each do |k|
    next unless attrs[k] && !attrs[k].to_s.strip.empty?

    other[ATTR_KEY_ALIASES[k] || k] = attrs[k].to_s.strip
  end
  other
end

def price_value(row)
  p = row["price"]
  return nil if p.nil? || p.strip.empty?

  p.to_f
rescue StandardError
  nil
end

def image_url_from_row(row)
  img = row["base_image"]
  return nil if img.nil? || img.strip.empty? || img == "no_selection"

  path = img.strip
  path = "/#{path}" unless path.start_with?("/")
  "#{MEDIA_BASE_URL}#{path}"
end

def main
  raw_files = Dir[RAW_GLOB].select { |f| File.file?(f) }
  abort "No CSV found in data/raw" if raw_files.empty?

  path = raw_files.max_by { |f| File.mtime(f) }
  latest_parent_image = nil
  latest_parent_sku = nil
  products = []
  per_field_present = Hash.new(0)
  sku_count = 0

  CSV.foreach(path, headers: true, liberal_parsing: true, encoding: "UTF-8").each do |row|
    sku = row["sku"]&.strip
    next if sku.nil? || sku.empty?

    sku_count += 1
    raw_add_attrs = scrub_multi_segment_engine_fields(row["additional_attributes"])
    attrs = parse_magento_additional_attributes(raw_add_attrs)
    categories = row["categories"].to_s
    name = row["name"].to_s
    description = row["description"].to_s
    image_url = image_url_from_row(row)

    # Sequential Image Inheritance Logic:
    # Magento child products (simple) often omit the base_image.
    # We propagate the latest valid image seen to any subsequent product missing one.
    if image_url
      latest_parent_image = image_url
    elsif latest_parent_image && row["product_type"] == "simple"
      image_url = latest_parent_image
    end

    paths = category_paths(categories)
    mm_rows = extract_fitment_from_categories(paths)
    cat_fit = consolidate_fitment(mm_rows)

    fit_make = attrs["make"]&.strip
    fit_model = attrs["model"]&.strip
    fit_make = cat_fit[:make] if fit_make.nil? || fit_make.empty?
    fit_model = cat_fit[:model] if fit_model.nil? || fit_model.empty?

    year_val = attrs_vehicle_year(attrs["year"])
    engine, engine_note = extract_engine(attrs)

    notes = []
    notes << engine_note if engine_note
    if attrs["flow_rate"] && /please select/i.match?(attrs["flow_rate"].to_s)
      notes << "flow_rate_dropdown_placeholder_in_source"
    end
    if mm_rows.map { |r| [r[:make], r[:model]] }.uniq.length > 3 && fit_model.nil?
      notes << "multiple_category_models_listed"
    end

    oem_raw = attrs["oem_or_aftermarket"]
    flow_cc = flow_rate_cc_from_row(attrs)

    specs = {
      flow_rate_cc: flow_cc,
      fuel_types: infer_fuel_types(attrs, categories, name, description),
      injector_type: injector_type_from_row(categories, oem_raw),
      connector_type: normalize_connector(attrs["connector_type"]),
      impedance: clean_impedance(attrs["impedance"]),
      other_relevant_specs: build_other_specs(attrs)
    }

    fitment = {
      make: (fit_make && !fit_make.empty?) ? fit_make : nil,
      model: (fit_model && !fit_model.empty?) ? fit_model : nil,
      year: year_val,
      engine: engine
    }

    raw_source = {
      "additional_attributes" => row["additional_attributes"].to_s,
      "categories" => categories,
      "name" => name,
      "meta_title" => row["meta_title"].to_s,
      "short_description" => row["short_description"].to_s
    }

    rec = {
      sku: sku.strip,
      name: name,
      price: price_value(row),
      url_key: (row["url_key"] && !row["url_key"].strip.empty?) ? row["url_key"].strip : nil,
      categories: paths,
      fitment: fitment,
      specs: specs,
      hero_image_url: image_url,
      description: description,
      notes: notes.uniq,
      raw_source_fields: raw_source
    }

    # Summary counts
    %i[sku name price url_key].each { |k| per_field_present[k] += 1 if rec[k] }
    per_field_present[:categories_nonempty] += 1 if paths.any?
    per_field_present[:fitment_make] += 1 if fitment[:make]
    per_field_present[:fitment_model] += 1 if fitment[:model]
    per_field_present[:fitment_year] += 1 if fitment[:year]
    per_field_present[:fitment_engine] += 1 if fitment[:engine]
    per_field_present[:spec_flow_rate_cc] += 1 if specs[:flow_rate_cc]
    per_field_present[:spec_fuel_types] += 1 if specs[:fuel_types]
    per_field_present[:spec_injector_type] += 1 if specs[:injector_type]
    per_field_present[:spec_connector] += 1 if specs[:connector_type]
    per_field_present[:spec_impedance] += 1 if specs[:impedance]
    per_field_present[:description_nonempty] += 1 if !description.strip.empty?

    products << rec
  end

  payload = {
    meta: {
      source_csv: File.basename(path),
      source_abspath: path,
      product_count: products.length,
      generated_at: Time.now.utc.iso8601
    },
    products: products
  }

  FileUtils.mkdir_p(File.dirname(OUT_JSON))
  File.write(OUT_JSON, JSON.pretty_generate(payload))
  File.write(OUT_SUMMARY, build_summary(payload[:meta], per_field_present, sku_count, products))
  puts File.read(OUT_SUMMARY)
end

def build_summary(meta, per_field, _sku_count, products)
  n = meta[:product_count]
  lines = []
  lines << "Normalization summary"
  lines << "======================="
  lines << "Source: #{meta[:source_csv]}"
  lines << "Products: #{n}"
  lines << "Generated: #{meta[:generated_at]}"
  lines << ""
  lines << "Fields extracted (non-null / useful)"
  lines << "--------------------------------------"
  {
    sku: "sku",
    name: "name",
    price: "price",
    url_key: "url_key",
    categories_nonempty: "categories (non-empty)",
    fitment_make: "fitment.make",
    fitment_model: "fitment.model",
    fitment_year: "fitment.year (vehicle; catalog meta year excluded)",
    fitment_engine: "fitment.engine (single variant only)",
    spec_flow_rate_cc: "specs.flow_rate_cc (numeric, from cc/min or bare number)",
    spec_fuel_types: "specs.fuel_types (inferred from keywords/categories text only)",
    spec_injector_type: "specs.injector_type (from category + oem_or_aftermarket)",
    spec_connector: "specs.connector_type",
    spec_impedance: "specs.impedance",
    description_nonempty: "description (non-empty)"
  }.each do |k, label|
    c = per_field[k] || 0
    pct = n.positive? ? format("%.1f", (c.to_f / n) * 100) : "0.0"
    lines << "  #{label}: #{c} (#{pct}%)"
  end

  lines << ""
  lines << "Missing or inconsistent (high level)"
  lines << "------------------------------------"
  missing_year = n - (per_field[:fitment_year] || 0)
  missing_model = n - (per_field[:fitment_model] || 0)
  multi_notes = products.count { |p| p[:notes].include?("multiple_category_models_listed") }
  placeholder_flow = products.count { |p| p[:notes].include?("flow_rate_dropdown_placeholder_in_source") }
  lines << "  fitment.year null (no explicit vehicle year attr or catalog-only year): #{missing_year}"
  lines << "  fitment.model null (multi-model or only make-level categories): #{missing_model}"
  lines << "  products with multiple category models hint note: #{multi_notes}"
  lines << "  products with Magento 'please select' flow_rate placeholder: #{placeholder_flow}"

  connector_vals = products.map { |p| p[:specs][:connector_type] }.compact.uniq.length
  lines << "  distinct connector_type values: #{connector_vals}"

  lines << ""
  lines << "Conservative rules applied"
  lines << "--------------------------"
  lines << "  - Magento additional_attributes 'year' equal to #{CATALOG_YEAR_ATTR} is ignored for fitment."
  lines << "  - Fitment uses explicit make/model attributes when present, else single make+model from categories."
  lines << "  - Multiple models under one make yields model null."
  lines << "  - Engine with pipe-separated variants yields engine null + note."
  lines << "  - flow_rate_cc null when value is non-numeric or dropdown placeholder."

  lines.join("\n")
end

main if __FILE__ == $PROGRAM_NAME

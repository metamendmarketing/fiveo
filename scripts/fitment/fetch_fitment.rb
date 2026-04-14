#!/usr/bin/env ruby
# frozen_string_literal: true

# Crawls the fiveomotorsport.com vehicle finder *after* you document real
# endpoints in site_config.local.json (from Chrome DevTools). This file does
# not contain guessed URLs.
#
# Usage:
#   cp site_config.example.json site_config.local.json
#   # Edit site_config.local.json — add discovery_flow from your captures
#   ruby fetch_fitment.rb
#
# Optional:
#   FITMENT_OUT_DIR=/path/to/out ruby fetch_fitment.rb
#
# See CHROME_NETWORK_CAPTURE.md for how to capture traffic safely.

require "json"
require "net/http"
require "openssl"
require "time"
require "uri"
require "fileutils"

SCRIPT_DIR = File.expand_path(__dir__)
DEFAULT_CONFIG = File.join(SCRIPT_DIR, "site_config.local.json")
OUT_DIR = File.expand_path(ENV.fetch("FITMENT_OUT_DIR", File.join(SCRIPT_DIR, "../../data/fitment")))

class FitmentHTTPError < StandardError; end

module CookieLoader
  module_function

  # Supports:
  # 1) Netscape cookies.txt (tab-separated)
  # 2) A one-line file: "name=value; other=val" (no "Cookie:" prefix required)
  def header_value(path)
    return nil if path.nil? || path.to_s.strip.empty? || !File.file?(path)

    raw = File.read(path, encoding: "UTF-8").strip
    if raw.include?("\t") && !raw.include?("=")
      # probably not cookies
    end
    if raw.lines.size > 1 || raw.include?("\t")
      pairs = []
      raw.each_line do |line|
        line = line.strip
        next if line.empty? || line.start_with?("#")

        parts = line.split("\t")
        next if parts.size < 7

        name = parts[5]
        value = parts[6].to_s.strip
        pairs << "#{name}=#{value}"
      end
      return pairs.join("; ")
    end

    raw.sub(/\ACookie:\s*/i, "").strip
  end
end

class JsonHttpClient
  def initialize(base_url:, headers: {}, cookie_header: nil, rate_seconds: 0.35)
    @base = base_url.end_with?("/") ? base_url[0..-2] : base_url
    @headers = headers.merge("Accept" => headers["Accept"] || "application/json, text/plain, */*")
    @headers["Cookie"] = cookie_header if cookie_header && !cookie_header.empty?
    @rate = rate_seconds
    @last = Time.at(0)
  end

  def full_uri(url)
    return URI(url) if url.start_with?("http://", "https://")

    URI("#{@base}/#{url.sub(%r{\A/}, "")}")
  end

  def request_json(method, url, body: nil, form: nil)
    sleep_gap
    uri = full_uri(url)
    klass = case method.to_s.upcase
            when "GET" then Net::HTTP::Get
            when "POST" then Net::HTTP::Post
            else
              raise ArgumentError, "Unsupported method #{method}"
            end
    req = klass.new(uri)
    @headers.each { |k, v| req[k] = v if v }

    if form
      req.set_form_data(form)
    elsif body
      req["Content-Type"] ||= "application/json"
      req.body = body.is_a?(String) ? body : JSON.generate(body)
    end

    Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https") do |http|
      res = http.request(req)
      unless res.code.to_i.between?(200, 299)
        raise FitmentHTTPError, "#{uri}: HTTP #{res.code} #{res.body.byteslice(0, 500)}"
      end
      ctype = res["content-type"].to_s
      unless ctype.include?("json") || res.body.strip.start_with?("{", "[")
        raise FitmentHTTPError, "#{uri}: expected JSON, got content-type=#{ctype.inspect}"
      end
      JSON.parse(res.body)
    end
  end

  def sleep_gap
    return if @rate <= 0

    dt = Time.now - @last
    sleep(@rate - dt) if dt < @rate
    @last = Time.now
  end
end

module JsonDrill
  module_function

  # path: "" or nil → obj itself; "key" → obj["key"]; "a.b" → nested
  def dig(obj, path)
    return obj if path.nil? || path.to_s.strip.empty?

    path.to_s.split(".").reduce(obj) do |mem, key|
      return nil if mem.nil?

      if mem.is_a?(Array) && key.match?(/\A\d+\z/)
        mem[key.to_i]
      elsif mem.is_a?(Hash)
        mem[key]
      else
        nil
      end
    end
  end
end

def load_config(path)
  unless File.file?(path)
    warn "Missing config: #{path}"
    warn "Copy site_config.example.json → site_config.local.json and add discovery_flow from DevTools."
    exit 1
  end
  JSON.parse(File.read(path, encoding: "UTF-8"))
end

def validate_discovery!(cfg)
  flow = cfg["discovery_flow"]
  if flow.nil? || flow.empty?
    warn "Config must include a non-empty \"discovery_flow\" array."
    warn "Each step needs url or url_template, method, and extract rules — fill these from Chrome captures."
    warn "See CHROME_NETWORK_CAPTURE.md"
    exit 1
  end
  flow
end

def interpolate(template, ctx)
  out = template.dup
  ctx.each { |k, v| out = out.gsub("{#{k}}", URI.encode_www_form_component(v.to_s)) }
  out
end

# Runs a linear chain of discovery steps. Each step fetches a list; for each item,
# the next step runs with context merged. Good for Make → Year → Model → Engine
# when each level uses the parent's id.
def run_discovery_chain(client, steps, ctx: {})
  return [] if steps.empty?

  step = steps[0]
  rest = steps[1..] || []
  method = (step["method"] || "GET").upcase
  url = step["url"] || interpolate(step.fetch("url_template"), ctx)
  body = step["body"]
  form = step["form"]

  payload =
    case method
    when "GET"
      raise "GET with body not supported here" if body || form

      client.request_json("GET", url)
    when "POST"
      client.request_json("POST", url, body: body, form: form)
    else
      raise "Unsupported method #{method}"
    end

  items = JsonDrill.dig(payload, step.dig("extract", "items_path"))
  unless items.is_a?(Array)
    raise FitmentHTTPError,
          "Step #{step['name'] || step['url']}: extract.items_path must resolve to Array, got #{items.class}"
  end

  id_key = step.dig("extract", "id_key") || "id"
  label_key = step.dig("extract", "label_key") || "label"
  maps_to = step["maps_to"] || step["name"] || "level"
  maps_id_to = step["maps_id_to"] || "#{maps_to}_id"

  rows = []
  items.each do |item|
    next if item.nil?

    id = item.is_a?(Hash) ? item[id_key] : nil
    label = item.is_a?(Hash) ? item[label_key] : item.to_s

    row_ctx = ctx.merge(
      maps_to => label,
      maps_id_to => id,
      "_last_raw" => item
    )

    if rest.empty?
      rows << row_ctx
    else
      rows.concat(run_discovery_chain(client, rest, ctx: row_ctx))
    end
  end
  rows
end

def build_tree_from_records(records, keys)
  tree = {}
  records.each do |r|
    node = tree
    keys.each_with_index do |key, i|
      val = r[key.to_s]
      val = val.to_s
      node[val] ||= (i == keys.size - 1 ? { "_leaf" => true } : {})
      node = node[val]
    end
  end
  tree
end

def tree_nested_hash(h)
  return h unless h.is_a?(Hash)

  h.map do |k, v|
    if v.is_a?(Hash) && v["_leaf"]
      { "name" => k }
    elsif v.is_a?(Hash)
      { "name" => k, "children" => tree_nested_hash(v) }
    else
      { "name" => k, "value" => v }
    end
  end
end

def extract_product_links(payload, hint)
  return [] unless hint.is_a?(Hash)

  items = JsonDrill.dig(payload, hint["items_path"])
  return [] unless items.is_a?(Array)

  sku_key = hint["sku_key"] || "sku"
  id_key = hint["id"] || "entity_id"
  url_key = hint["url_key"] || "url_key"

  items.filter_map do |it|
    next unless it.is_a?(Hash)

    { "sku" => it[sku_key], "product_id" => it[id_key], "url_key" => it[url_key], "raw" => it }
  end
end

def main
  cfg_path = ENV.fetch("FITMENT_CONFIG", DEFAULT_CONFIG)
  cfg = load_config(cfg_path)
  flow = validate_discovery!(cfg)

  base = cfg.fetch("base_url")
  headers = cfg["headers"] || {}
  cookie_path = cfg["cookie_file"].to_s
  cookie_path = File.join(SCRIPT_DIR, cookie_path) unless cookie_path.start_with?("/")
  cookie = CookieLoader.header_value(cookie_path)

  client = JsonHttpClient.new(
    base_url: base,
    headers: headers,
    cookie_header: cookie,
    rate_seconds: (cfg["rate_limit_seconds"] || 0.35).to_f
  )

  warn "Cookie file not found or empty — requests may fail if the API needs auth: #{cookie_path}" if cfg["cookie_file"] && cookie.to_s.empty?

  flat = run_discovery_chain(client, flow)

  key_for = cfg["record_keys"] || %w[make year model engine]
  records = flat.map do |ctx|
    rec = {}
    key_for.each do |k|
      rec[k] = ctx[k]
    end
    rec["_raw_step"] = ctx["_last_raw"]
    rec
  end

  tree_hash = build_tree_from_records(records, key_for)
  tree_out = {
    "meta" => {
      "source" => "fiveomotorsport_finder",
      "generated_at" => Time.now.utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
      "note" => "Tree derived from flat discovery; shapes depend on discovery_flow config."
    },
    "tree" => tree_nested_hash(tree_hash)
  }

  records_out = {
    "meta" => tree_out["meta"].dup,
    "records" => records.map { |r| r.reject { |k, _| k == "_raw_step" } }
  }

  product_map = { "meta" => tree_out["meta"].dup, "mappings" => [] }
  pm_cfg = cfg["product_map_step"]
  if pm_cfg && pm_cfg["url_template"]
    warn "product_map_step configured — fetching product mapping (may be slow)..."
    flat.each do |ctx|
      url = interpolate(pm_cfg.fetch("url_template"), ctx)
      begin
        payload = client.request_json(pm_cfg["method"] || "GET", url, body: pm_cfg["body"], form: pm_cfg["form"])
        items = extract_product_links(payload, pm_cfg["extract"])
        next if items.empty?

        product_map["mappings"] << {
          "vehicle_context" => ctx.reject { |k, _| k.start_with?("_") },
          "products" => items
        }
      rescue FitmentHTTPError => e
        warn "Skip mapping: #{e.message}"
      end
    end
  else
    product_map["meta"]["note"] = "No product_map_step in config — mappings left empty. Add final AJAX call from DevTools when you pick a vehicle."
  end

  FileUtils.mkdir_p(OUT_DIR)
  File.write(File.join(OUT_DIR, "fitment_tree.json"), JSON.pretty_generate(tree_out))
  File.write(File.join(OUT_DIR, "fitment_records.json"), JSON.pretty_generate(records_out))
  File.write(File.join(OUT_DIR, "product_vehicle_map.json"), JSON.pretty_generate(product_map))

  puts "Wrote:"
  puts "  #{File.join(OUT_DIR, 'fitment_tree.json')}"
  puts "  #{File.join(OUT_DIR, 'fitment_records.json')}"
  puts "  #{File.join(OUT_DIR, 'product_vehicle_map.json')}"
end

main if __FILE__ == $PROGRAM_NAME

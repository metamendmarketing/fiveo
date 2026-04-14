#!/usr/bin/env ruby
# frozen_string_literal: true

# Crawls fiveomotorsport.com vehicle-finder dropdowns via the real endpoint:
#   GET /pfcategory/index/options/?level=N&path=1%2F2%2F3&use_saved_values=false
#
# The store returns HTML (option list), not JSON. Cloudflare blocks bare scripts:
# export cookies from your browser into scripts/fitment/private/cookies.txt
#
# Setup:
#   cp pfcategory_config.example.json pfcategory_config.local.json
#   mkdir -p private
#   # Paste Cookie header value into private/cookies.txt (one line) — see README below
#   ruby crawl_pfcategory_fitment.rb
#
# Output (default):
#   data/fitment/fitment_tree.json
#   data/fitment/fitment_records.json
#   data/fitment/product_vehicle_map.json  (stub — this endpoint is categories only)

require "json"
require "net/http"
require "uri"
require "fileutils"
require "time"

SCRIPT_DIR = File.expand_path(__dir__)
DEFAULT_CFG = File.join(SCRIPT_DIR, "pfcategory_config.local.json")
OUT_DIR = File.expand_path(ENV.fetch("FITMENT_OUT_DIR", File.join(SCRIPT_DIR, "../../data/fitment")))

module CookieHeader
  module_function

  def from_file(path)
    return nil if path.nil? || !File.file?(path)

    raw = File.read(path, encoding: "UTF-8").strip
    raw.sub(/\ACookie:\s*/i, "")
  end
end

def load_json(path)
  JSON.parse(File.read(path, encoding: "UTF-8"))
end

def parse_options_html(html)
  options = []
  html.scan(/<option\s+([^>]*)>([^<]*)<\/option>/mi) do |attrs, text|
    label = text.to_s.strip.gsub(/&amp;/, "&").gsub(/&#039;/, "'")
    next if label.empty?
    next if label.match?(/\A(ch|--|choose|select)/i)

    val =
      if attrs =~ /value\s*=\s*["']([^"']*)["']/i
        ::Regexp.last_match(1).to_s.strip
      else
        label
      end
    next if val.empty? && label.match?(/\Achoose/i)

    options << { "value" => val, "label" => label }
  end
  options
end

def cloudflare_blocked?(body)
  body.include?("Attention Required") || body.include?("cf-browser-verification")
end

class PfCategoryClient
  def initialize(cfg, cookie)
    @base = cfg.fetch("base_url").sub(%r{/\z}, "")
    @endpoint = cfg.fetch("options_endpoint")
    @headers = cfg["headers"] || {}
    @cookie = cookie
    @rate = (cfg["rate_limit_seconds"] || 0.35).to_f
    @last = Time.at(0)
  end

  def fetch(level, path)
    sleep_rate
    uri = URI.parse(@base + @endpoint)
    uri.query = URI.encode_www_form(
      "level" => level.to_s,
      "path" => path,
      "use_saved_values" => "false",
      "_" => (Time.now.to_f * 1000).to_i.to_s
    )

    req = Net::HTTP::Get.new(uri)
    @headers.each { |k, v| req[k] = v }
    req["Cookie"] = @cookie if @cookie && !@cookie.empty?

    Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
      res = http.request(req)
      [res.code.to_i, res.body.to_s, res["content-type"].to_s]
    end
  end

  def sleep_rate
    dt = Time.now - @last
    sleep(@rate - dt) if dt < @rate
    @last = Time.now
  end
end

def child_path(parent_path, option_value)
  v = option_value.to_s
  return v if v.include?("/")

  "#{parent_path}/#{v}"
end

def crawl_node(client, cfg, path, level, depth, memo)
  key = [path, level]
  return memo[key] if memo.key?(key)

  code, body, ctype = client.fetch(level, path)

  if code != 200
    memo[key] = { "error" => "HTTP #{code}", "path" => path, "level" => level }
    return memo[key]
  end

  if cloudflare_blocked?(body)
    memo[key] = {
      "error" => "Cloudflare_block",
      "hint" => "Refresh cf_clearance in private/cookies.txt from your browser after passing the check.",
      "path" => path,
      "level" => level
    }
    return memo[key]
  end

  opts = parse_options_html(body)
  max_c = (cfg["max_children_per_node"] || 500).to_i
  opts = opts.take(max_c) if opts.size > max_c

  node = {
    "path" => path,
    "level" => level,
    "depth" => depth,
    "response_content_type" => ctype,
    "option_count" => opts.size,
    "children" => []
  }

  max_depth = (cfg["max_depth"] || 15).to_i
  if depth >= max_depth || opts.empty?
    memo[key] = node
    return node
  end

  opts.each do |opt|
    next_path = child_path(path, opt["value"])
    next_level = level + 1
    child = crawl_node(client, cfg, next_path, next_level, depth + 1, memo)
    node["children"] << {
      "label" => opt["label"],
      "value" => opt["value"],
      "subtree" => child
    }
  end

  memo[key] = node
  node
end

def flatten_tree(node, trail_labels, records)
  if node["error"]
    records << {
      "trail" => trail_labels.dup,
      "path" => node["path"],
      "level" => node["level"],
      "error" => node["error"]
    }
    return
  end

  kids = node["children"]
  if kids.nil? || kids.empty?
    records << {
      "trail" => trail_labels.dup,
      "category_path" => node["path"],
      "level" => node["level"]
    }
    return
  end

  kids.each do |ch|
    flatten_tree(ch["subtree"], trail_labels + [ch["label"]], records)
  end
end

def main
  cfg_path = ENV.fetch("PFCATEGORY_CONFIG", DEFAULT_CFG)
  unless File.file?(cfg_path)
    warn "Missing #{cfg_path} — copy pfcategory_config.example.json to pfcategory_config.local.json"
    exit 1
  end

  cfg = load_json(cfg_path)
  cookie_path = cfg["cookie_file"].to_s
  cookie_path = File.join(SCRIPT_DIR, cookie_path) unless cookie_path.start_with?("/")
  cookie = CookieHeader.from_file(cookie_path)

  if cookie.nil? || cookie.strip.empty?
    warn <<~WARN
      No cookie file found. Cloudflare will usually block this script.

      Create: scripts/fitment/private/cookies.txt
      Put ONE line (no "Cookie:" prefix needed), copied from DevTools → that request → Request Headers → cookie:

        PHPSESSID=...; form_key=...; cf_clearance=...; (etc.)

      Never commit this file (it is gitignored).
    WARN
    exit 1
  end

  client = PfCategoryClient.new(cfg, cookie)
  memo = {}
  root = crawl_node(
    client,
    cfg,
    cfg.fetch("root_path"),
    cfg.fetch("root_level").to_i,
    0,
    memo
  )

  meta = {
    "source" => "fiveomotorsport_pfcategory_options",
    "endpoint" => cfg.fetch("options_endpoint"),
    "generated_at" => Time.now.utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
    "note" => "Built by recursive GET options HTML. Leaf 'trail' is make/year/model-style labels if the store categories match that shape."
  }

  records = []
  flatten_tree(root, [], records)

  tree_out = { "meta" => meta, "tree" => root }
  records_out = { "meta" => meta, "records" => records }
  product_stub = {
    "meta" => meta.merge(
      "note" => "pfcategory/index/options returns category dropdown HTML only. When you capture the XHR that loads product SKUs for a chosen vehicle, extend this pipeline."
    ),
    "mappings" => []
  }

  FileUtils.mkdir_p(OUT_DIR)
  File.write(File.join(OUT_DIR, "fitment_tree.json"), JSON.pretty_generate(tree_out))
  File.write(File.join(OUT_DIR, "fitment_records.json"), JSON.pretty_generate(records_out))
  File.write(File.join(OUT_DIR, "product_vehicle_map.json"), JSON.pretty_generate(product_stub))

  puts "Wrote #{OUT_DIR}/{fitment_tree,fitment_records,product_vehicle_map}.json"
  puts "Records (leaf trails): #{records.count { |r| !r['error'] }}"
end

main if __FILE__ == $PROGRAM_NAME

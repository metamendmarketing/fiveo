#!/usr/bin/env ruby
# frozen_string_literal: true

# Fallback when the finder returns HTML (e.g. <option> lists) instead of JSON.
#
# 1. In Chrome: open the dropdown, then in Elements copy the <select> outerHTML
#    or save the response body from Network → Response.
# 2. Save as private/finder_fragment.html
# 3. ruby scrape_finder_html.rb private/finder_fragment.html
#
# This only parses a saved fragment (no network). Prefer capture + fetch_fitment.rb
# with the real request URL once you see it in DevTools.

require "json"
require "fileutils"

OUT_DIR = File.expand_path("../../data/fitment", __dir__)

html_path = ARGV[0]
if html_path.nil? || html_path.empty?
  warn "Usage: ruby scrape_finder_html.rb path/to/saved.html"
  exit 1
end

html = File.read(html_path, encoding: "UTF-8")

options = []
html.scan(/<option([^>]*)>([^<]*)<\/option>/mi) do |attrs, text|
  lab = text.to_s.strip
  next if lab.empty?
  next if lab.match?(/\A(choose|select|--)/i)

  val = if attrs =~ /value\s*=\s*["']([^"']*)["']/i
          ::Regexp.last_match(1).to_s.strip
        else
          lab
        end
  options << { "value" => val, "label" => lab }
end

out = {
  "meta" => {
    "source" => "html_fragment",
    "generated_at" => Time.now.utc.strftime("%Y-%m-%dT%H:%M:%SZ")
  },
  "options" => options
}

FileUtils.mkdir_p(OUT_DIR)
dest = File.join(OUT_DIR, "finder_html_options.json")
File.write(dest, JSON.pretty_generate(out))

puts "Wrote #{dest} (#{options.size} options). If count is wrong, the HTML may use a non-standard <option> format."

# encoding: utf-8
require 'nokogiri'

# 1. Pre-render: Insert temporary markers
Jekyll::Hooks.register [:pages, :documents], :pre_render do |doc|
  next unless doc.extname == ".md"
  content = doc.content.dup.force_encoding("utf-8")
  lines = content.split("\n")
  processed_lines = lines.map.with_index do |line, i|
    line_num = i + 1
    # Skip empty lines or purely whitespace lines
    if line =~ /\S/
      "<!--L:#{line_num}-->" + line
    else
      line
    end
  end
  doc.content = processed_lines.join("\n")
end

# 2. Post-convert: Move markers to data attributes
Jekyll::Hooks.register [:pages, :documents], :post_convert do |doc|
  next unless doc.extname == ".md"
  path = doc.relative_path
  html = doc.content.dup.force_encoding("utf-8")

  # Find markers and inject them into the next opening tag
  # Example: <!--L:10--><p> -> <p data-line="10" data-path="...">
  updated_html = html.gsub(/<!--L:(\d+)--><([a-z1-6]+)([^>]*)>/) do
    line = $1
    tag = $2
    attrs = $3
    "<#{tag}#{attrs} data-line=\"#{line}\" data-path=\"#{path}\">"
  end

  # Remove markers that didn't get attached to a tag
  doc.content = updated_html.gsub(/<!--L:\d+-->/, "")
end

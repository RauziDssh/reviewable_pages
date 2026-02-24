# encoding: utf-8
require 'nokogiri'

# Force UTF-8 globally for this process
Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8

Jekyll::Hooks.register [:pages, :documents], :pre_render do |doc|
  next unless doc.extname == ".md"
  
  # Ensure content is treated as UTF-8
  content = doc.content.dup.force_encoding("UTF-8")
  lines = content.split("\n")
  
  processed_lines = lines.map.with_index do |line, i|
    line_num = i + 1
    # Only inject markers into lines that look like content
    if line =~ /^#+\s/ || line =~ /^\s*[-*+]\s/ || line =~ /^[^\s#\-*+]/
      # Inject a hidden marker that is less likely to break Markdown
      "<!--LL:#{line_num}-->#{line}"
    else
      line
    end
  end
  
  doc.content = processed_lines.join("\n")
end

Jekyll::Hooks.register [:pages, :documents], :post_convert do |doc|
  next unless doc.extname == ".md"
  
  path = doc.relative_path
  # Use a simpler regex to move markers into the preceding tag as a data attribute
  # This looks for <tag><!--LL:num--> and moves it
  html = doc.content.dup.force_encoding("UTF-8")
  
  # This regex targets markers placed immediately after an opening tag or at the start of a line
  # It's more robust against encoding issues than complex tag parsing
  updated_html = html.gsub(/<([a-z1-6]+)([^>]*)>\s*<!--LL:(\d+)-->/) do
    tag = $1
    attrs = $2
    line = $3
    "<#{tag}#{attrs} data-line=\"#{line}\" data-path=\"#{path}\">"
  end

  # Remove any stray markers that weren't captured (e.g., inside code blocks)
  doc.content = updated_html.gsub(/<!--LL:\d+-->/, "")
end

# _plugins/line_number_injector.rb
require 'nokogiri'

# 1. Insert temporary markers for each line in Markdown
Jekyll::Hooks.register [:pages, :documents], :pre_render do |doc|
  next unless doc.extname == ".md"
  lines = doc.content.split("
")
  processed_lines = lines.each_with_index.map do |line, i|
    line_num = i + 1
    if line =~ /^#+\s+(.*)/ # Headers
      line.sub(/^(#+\s+)(.*)/, "\1<!--L:#{line_num}-->\2")
    elsif line =~ /^(\s*[-*+]\s+)(.*)/ # Lists
      line.sub(/^(\s*[-*+]\s+)(.*)/, "\1<!--L:#{line_num}-->\2")
    elsif line =~ /^\s*[a-zA-Z0-9\u3000-\u30FE\u4E00-\u9FA0]/ # Paragraphs (incl. Japanese)
      "<!--L:#{line_num}-->" + line
    else
      line
    end
  end
  doc.content = processed_lines.join("
")
end

# 2. Convert markers to data attributes in the final HTML
Jekyll::Hooks.register [:pages, :documents], :post_convert do |doc|
  next unless doc.extname == ".md"
  path = doc.relative_path
  # Move the comment marker immediately after the HTML tag to a data attribute
  doc.content = doc.content.gsub(/<([a-z1-6]+)([^>]*)><!--L:(\d+)-->/) do
    tag = $1
    attrs = $2
    line = $3
    "<#{tag}#{attrs} data-line="#{line}" data-path="#{path}""
  end
end

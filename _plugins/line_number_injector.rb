# encoding: utf-8
require 'nokogiri'

# 1. Markdownの各行に一時的なマーカーを挿入
Jekyll::Hooks.register [:pages, :documents], :pre_render do |doc|
  next unless doc.extname == ".md"
  # 強制的にUTF-8として読み込む
  content = doc.content.force_encoding("utf-8")
  lines = content.split("\n")
  processed_lines = lines.each_with_index.map do |line, i|
    line_num = i + 1
    if line =~ /^#+\s+(.*)/ # Headers
      line.sub(/^(#+\s+)(.*)/, "\\1<!--L:#{line_num}-->\\2")
    elsif line =~ /^(\s*[-*+]\s+)(.*)/ # Lists
      line.sub(/^(\s*[-*+]\s+)(.*)/, "\\1<!--L:#{line_num}-->\\2")
    elsif line =~ /^\s*\S/ # 空行以外（日本語含むあらゆる文字）
      "<!--L:#{line_num}-->" + line
    else
      line
    end
  end
  doc.content = processed_lines.join("\n")
end

# 2. 変換後のHTMLでマーカーを探し、属性に変換
Jekyll::Hooks.register [:pages, :documents], :post_convert do |doc|
  next unless doc.extname == ".md"
  path = doc.relative_path
  # HTMLタグ直後のコメントマーカーを data 属性に移動
  # 漢字や記号が含まれても壊れないように置換
  doc.content = doc.content.gsub(/<([a-z1-6]+)([^>]*)><!--L:(\d+)-->/) do
    tag = $1
    attrs = $2
    line = $3
    "<#{tag}#{attrs} data-line=\"#{line}\" data-path=\"#{path}\""
  end
end

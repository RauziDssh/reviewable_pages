# encoding: utf-8
require 'nokogiri'

# 1. Pre-render: 行の先頭に特殊なマーカーを挿入
Jekyll::Hooks.register [:pages, :documents], :pre_render do |doc|
  next unless doc.extname == ".md"
  content = doc.content.dup.force_encoding("utf-8")
  lines = content.split("\n")
  processed_lines = lines.map.with_index do |line, i|
    line_num = i + 1
    # 空行やコメント、フロントマター以外を対象にする
    if line =~ /\S/ && line !~ /^---/ && line !~ /^layout:/
      "@@@L:#{line_num}@@@ " + line
    else
      line
    end
  end
  doc.content = processed_lines.join("\n")
end

# 2. Post-convert: マーカーを探して、親タグまたは兄弟タグに属性を付与
Jekyll::Hooks.register [:pages, :documents], :post_convert do |doc|
  next unless doc.extname == ".md"
  path = doc.relative_path
  html_content = doc.content.dup.force_encoding("utf-8")
  
  # Nokogiriを使ってHTML構造を解析
  doc_html = Nokogiri::HTML.fragment(html_content)
  
  # テキストノードからマーカーを探す
  doc_html.traverse do |node|
    if node.text? && node.content.include?("@@@L:")
      # マーカー(@@@L:123@@@)を抽出
      if node.content =~ /@@@L:(\d+)@@@/
        line_num = $1
        # 親要素に属性を付与
        parent = node.parent
        if parent && parent.name != "document"
          parent["data-line"] = line_num
          parent["data-path"] = path
          # マーカー自体は削除
          node.content = node.content.sub(/@@@L:\d+@@@\s*/, "")
        end
      end
    end
  end
  
  doc.content = doc_html.to_html
end

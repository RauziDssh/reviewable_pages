# encoding: utf-8

# KramdownのIAL (Inline Attribute List) 機能を利用して属性を付与する
Jekyll::Hooks.register [:pages, :documents], :pre_render do |doc|
  next unless doc.extname == ".md"
  content = doc.content.dup.force_encoding("utf-8")
  lines = content.split("\n")
  path = doc.relative_path
  
  processed_lines = []
  in_front_matter = false
  
  lines.each_with_index do |line, i|
    processed_lines << line
    line_num = i + 1
    
    # フロントマターの境界をチェック
    if line =~ /^---/
      in_front_matter = !in_front_matter
      next
    end
    
    # コンテンツ行（空行、フロントマター内、すでに属性がある行以外）に属性を挿入
    if !in_front_matter && line =~ /\S/ && line !~ /^\{:/
      # 次の行にKramdown用の属性リストを挿入
      processed_lines << "{: data-line=\"#{line_num}\" data-path=\"#{path}\" .reviewable}"
    end
  end
  
  doc.content = processed_lines.join("\n")
end

# encoding: utf-8

# Markdownの各行の末尾にHTMLコメントでマーカーを打つ
# これによりMarkdownのパースを妨げずに行番号をHTMLに渡す
Jekyll::Hooks.register [:pages, :documents], :pre_render do |doc|
  next unless doc.extname == ".md"
  content = doc.content.dup.force_encoding("utf-8")
  lines = content.split("\n")
  
  processed_lines = []
  in_front_matter = false
  
  lines.each_with_index do |line, i|
    line_num = i + 1
    # フロントマターの判定
    if line =~ /^---/
      in_front_matter = !in_front_matter
      processed_lines << line
      next
    end

    # 空行やフロントマター内以外なら、末尾にコメントを付与
    if !in_front_matter && line =~ /\S/
      processed_lines << "#{line} <!--L:#{line_num}-->"
    else
      processed_lines << line
    end
  end
  
  doc.content = processed_lines.join("\n")
end

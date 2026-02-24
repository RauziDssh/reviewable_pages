# encoding: utf-8

# ファイル全体の行番号（フロントマターを含む）を正確に特定する
Jekyll::Hooks.register [:pages, :documents], :pre_render do |doc|
  next unless doc.extname == ".md"
  
  # raw_content はファイルそのままの内容（フロントマター含む）
  raw_content = doc.raw_content.dup.force_encoding("utf-8")
  lines = raw_content.split("\n")
  
  processed_lines = []
  in_front_matter = false
  front_matter_passed = false
  
  lines.each_with_index do |line, i|
    line_num = i + 1
    
    # フロントマターの開始・終了を検知
    if line =~ /^---/
      if !in_front_matter && !front_matter_passed
        in_front_matter = true
      elsif in_front_matter
        in_front_matter = false
        front_matter_passed = true
      end
      processed_lines << line
      next
    end

    # フロントマターの外側かつ空行でない行に、ファイル全体での行番号を付与
    if !in_front_matter && line =~ /\S/
      # すでにJekyllが処理を始めている場合があるため、確実に末尾にコメントを付与
      processed_lines << "#{line} <!--L:#{line_num}-->"
    else
      processed_lines << line
    end
  end
  
  # 最終的なコンテンツをJekyllに差し戻す
  # Jekyllはここからフロントマターを再解釈することはないが、
  # doc.contentを更新することで、この後のMarkdown変換に反映させる
  full_content = processed_lines.join("\n")
  
  # フロントマター部分を切り取って doc.content (本文) を更新
  if full_content =~ /\A---.*?---\s*(.*)\z/m
    doc.content = $1
  else
    doc.content = full_content
  end
end

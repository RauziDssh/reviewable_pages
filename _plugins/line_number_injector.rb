# encoding: utf-8

Jekyll::Hooks.register [:pages, :documents], :pre_render do |doc|
  next unless doc.extname == ".md"
  
  # ソースファイルのパスを取得
  file_path = doc.path
  next unless file_path && File.exist?(file_path)

  # ファイル全体を読み込んで、フロントマターの行数を数える
  raw_lines = File.readlines(file_path, encoding: "utf-8")
  
  front_matter_line_count = 0
  dash_count = 0
  raw_lines.each do |line|
    front_matter_line_count += 1
    if line.start_with?("---")
      dash_count += 1
      break if dash_count == 2 # 2つ目の --- でフロントマター終了
    end
  end

  # doc.content (本文) の各行に対して、オフセットを加えたマーカーを付与
  content = doc.content.dup.force_encoding("utf-8")
  lines = content.split("\n")
  
  processed_lines = lines.map.with_index do |line, i|
    # 行番号 = フロントマターの行数 + 本文内での行索引 + 1
    # ※ split("\n") で消えた改行分を考慮
    line_num = front_matter_line_count + i + 1
    
    if line =~ /\S/
      "#{line} <!--L:#{line_num}-->"
    else
      line
    end
  end
  
  doc.content = processed_lines.join("\n")
end

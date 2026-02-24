# encoding: utf-8

Jekyll::Hooks.register [:pages, :documents], :pre_render do |doc|
  next unless doc.extname == ".md"
  
  file_path = doc.path
  next unless file_path && File.exist?(file_path)

  # ファイル全体をバイナリとして読み込み、フロントマターの「行数」を正確に算出する
  raw_content = File.read(file_path, encoding: "utf-8")
  
  # フロントマター部分（先頭の --- から 終了の --- ＋ その後の空行/改行まで）を抽出
  if raw_content =~ /\A(---.*?---\r?\n)/m
    front_matter_part = $1
    # フロントマター部分に含まれる改行の数が、本文開始位置のオフセットになる
    line_offset = front_matter_part.count("\n")
  else
    line_offset = 0
  end

  # 本文の各行にオフセットを適用
  content = doc.content.dup.force_encoding("utf-8")
  # Windows/Linux両方の改行コードに対応して分割
  lines = content.split(/\r?\n/)
  
  processed_lines = lines.map.with_index do |line, i|
    # 行番号 = オフセット + 本文内インデックス + 1
    line_num = line_offset + i + 1
    
    if line =~ /\S/
      "#{line} <!--L:#{line_num}-->"
    else
      line
    end
  end
  
  doc.content = processed_lines.join("\n")
end

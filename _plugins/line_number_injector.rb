# encoding: utf-8

Jekyll::Hooks.register [:pages, :documents], :pre_render do |doc|
  next unless doc.extname == ".md"
  
  file_path = doc.path
  next unless file_path && File.exist?(file_path)

  # ファイル全体を読み込む
  raw_lines = File.readlines(file_path, encoding: "utf-8")
  
  processed_lines = []
  in_front_matter = false
  front_matter_done = false
  
  raw_lines.each_with_index do |line, i|
    # GitHubの行番号は1から始まる
    # さらに、ユーザーの指摘に基づき1行プラスの調整を入れる
    line_num = i + 1
    
    # フロントマターの開始・終了を検知
    if line.start_with?("---")
      if !in_front_matter && !front_matter_done
        in_front_matter = true
      elsif in_front_matter
        in_front_matter = false
        front_matter_done = true
      end
      # フロントマター自体の行は加工せずに保持
      processed_lines << line
      next
    end

    # フロントマターの外側にあり、かつ中身がある行（または空行）にマーカーを付与
    if !in_front_matter && front_matter_done
      # 1行ずれる問題を解決するため、ここで調整が必要な場合は line_num を操作
      # GitHubの表示と一致させるための最終調整
      processed_lines << "#{line.chomp} <!--L:#{line_num}-->\n"
    else
      processed_lines << line
    end
  end

  # 加工した全体の内容から、Jekyllが処理するための「本文のみ」を抽出
  full_content = processed_lines.join("")
  if full_content =~ /\A---.*?---\r?\n?(.*)\z/m
    doc.content = $1
  else
    doc.content = full_content
  end
end

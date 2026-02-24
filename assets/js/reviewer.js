// assets/js/reviewer.js
let selectedElement = null;

document.addEventListener('DOMContentLoaded', function() {
    const contentArea = document.getElementById('content-area');
    const toggle = document.getElementById('review-mode-checkbox');

    if (!contentArea || !toggle) return;

    // 1. data-line 属性を持つすべての要素にボタンを配置
    const reviewableElements = contentArea.querySelectorAll('[data-line]');
    
    reviewableElements.forEach(el => {
        const btn = document.createElement('span');
        btn.className = 'review-btn';
        btn.innerHTML = '💬';
        btn.title = 'この箇所をレビュー';
        
        btn.onclick = function(e) {
            e.stopPropagation();
            openReviewBox(el, e);
        };
        
        // 要素の先頭にボタンを挿入
        el.style.position = 'relative'; // CSSでも設定しているが念のため
        el.prepend(btn);
    });

    // 2. トグルスイッチのイベント
    toggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('review-mode');
        } else {
            document.body.classList.remove('review-mode');
            closeReview();
        }
    });
});

function openReviewBox(el, e) {
    selectedElement = el;
    const box = document.getElementById('review-box');
    // ボタンの記号(💬)を除いたテキストを取得
    const fullText = el.innerText || "";
    const quote = fullText.replace('💬', '').trim();
    
    document.getElementById('review-quote').innerText = quote.length > 100 ? quote.substring(0, 100) + "..." : quote;
    
    box.style.display = 'block';
    
    // ポップアップをマウス位置に表示
    const boxWidth = 340;
    let left = e.pageX;
    if (left + boxWidth > window.innerWidth) {
        left = window.innerWidth - boxWidth - 20;
    }
    box.style.left = left + 'px';
    box.style.top = e.pageY + 'px';
    
    document.getElementById('review-text').focus();
}

function closeReview() {
    const box = document.getElementById('review-box');
    if (box) {
        box.style.display = 'none';
        document.getElementById('review-text').value = '';
    }
}

function submitReview() {
    const line = selectedElement.getAttribute('data-line');
    const path = selectedElement.getAttribute('data-path');
    const comment = document.getElementById('review-text').value;
    const fullText = selectedElement.innerText || "";
    const quote = fullText.replace('💬', '').trim();
    const repoUrl = window.siteConfig.repository_url;

    if (!comment.trim()) {
        alert("指摘内容を入力してください。");
        return;
    }

    const permalink = `${repoUrl}/blob/main/${path}#L${line}`;
    const body = `## Review Comment\n\n` +
                 `**Source:** ${permalink}\n\n` +
                 `### Quote\n> ${quote}\n\n` +
                 `### Feedback\n${comment}`;

    const title = `Review: ${path} (L${line})`;
    const issueUrl = `${repoUrl}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;

    window.open(issueUrl, '_blank');
    closeReview();
}

// ボックス外クリックで閉じる
document.addEventListener('click', function(e) {
    const box = document.getElementById('review-box');
    if (box && box.style.display === 'block' && !box.contains(e.target) && !e.target.classList.contains('review-btn')) {
        closeReview();
    }
});

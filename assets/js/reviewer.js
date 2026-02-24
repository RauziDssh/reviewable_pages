// assets/js/reviewer.js
let selectedElement = null;

document.addEventListener('DOMContentLoaded', function() {
    const contentArea = document.getElementById('content-area');
    const toggle = document.getElementById('review-mode-checkbox');

    if (!contentArea || !toggle) return;

    // 1. レビューボタンをすべての対象要素に挿入
    // data-line属性がある要素か、一般的なコンテンツ要素を対象
    const targetTags = 'p, li, h1, h2, h3, h4, h5, h6, blockquote';
    const reviewableElements = contentArea.querySelectorAll(targetTags);
    
    reviewableElements.forEach(el => {
        // もしdata-lineがなかったとしても、行番号推定（暫定）のために表示
        if (!el.getAttribute('data-line')) {
            // 親や子にdata-lineがあれば継承
            const nearestLine = el.closest('[data-line]') || el.querySelector('[data-line]');
            if (nearestLine) {
                el.setAttribute('data-line', nearestLine.getAttribute('data-line'));
                el.setAttribute('data-path', nearestLine.getAttribute('data-path'));
            } else {
                // デバッグ用: data-lineが全く見つからない場合はボタンを出さない
                return;
            }
        }

        const btn = document.createElement('span');
        btn.className = 'review-btn';
        btn.innerHTML = '💬';
        btn.title = 'この行をレビュー';
        btn.style.display = 'none'; // 最初は隠しておく
        
        btn.onclick = function(e) {
            e.stopPropagation();
            openReviewBox(el, e);
        };
        el.appendChild(btn);
    });

    // 2. トグルスイッチのイベント
    toggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('review-mode');
            // 明示的にボタンを表示
            document.querySelectorAll('.review-btn').forEach(b => b.style.display = 'inline-block');
        } else {
            document.body.classList.remove('review-mode');
            document.querySelectorAll('.review-btn').forEach(b => b.style.display = 'none');
            closeReview();
        }
    });
});

function openReviewBox(el, e) {
    selectedElement = el;
    const box = document.getElementById('review-box');
    const quote = el.innerText.replace('💬', '').trim();
    
    document.getElementById('review-quote').innerText = quote.length > 100 ? quote.substring(0, 100) + "..." : quote;
    
    box.style.display = 'block';
    
    const boxWidth = 320;
    let left = e.pageX;
    if (left + boxWidth > window.innerWidth) {
        left = window.innerWidth - boxWidth - 20;
    }
    box.style.left = left + 'px';
    box.style.top = e.pageY + 'px';
    
    document.getElementById('review-text').focus();
}

function closeReview() {
    document.getElementById('review-box').style.display = 'none';
    document.getElementById('review-text').value = '';
}

function submitReview() {
    const line = selectedElement.getAttribute('data-line');
    const path = selectedElement.getAttribute('data-path');
    const comment = document.getElementById('review-text').value;
    const quote = selectedElement.innerText.replace('💬', '').trim();
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

document.addEventListener('click', function(e) {
    const box = document.getElementById('review-box');
    if (box && box.style.display === 'block' && !box.contains(e.target) && !e.target.classList.contains('review-btn')) {
        closeReview();
    }
});

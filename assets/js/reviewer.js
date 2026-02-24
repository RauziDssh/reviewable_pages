// assets/js/reviewer.js
let selectedElement = null;

document.addEventListener('DOMContentLoaded', function() {
    const contentArea = document.getElementById('content-area');
    const toggle = document.getElementById('review-mode-checkbox');

    // 1. レビューボタンをすべての対象要素に挿入
    const reviewableElements = contentArea.querySelectorAll('[data-line]');
    reviewableElements.forEach(el => {
        const btn = document.createElement('span');
        btn.className = 'review-btn';
        btn.innerHTML = '💬';
        btn.title = 'この行をレビュー';
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
        } else {
            document.body.classList.remove('review-mode');
            closeReview();
        }
    });
});

function openReviewBox(el, e) {
    selectedElement = el;
    const box = document.getElementById('review-box');
    const quote = el.innerText.replace('💬', '').trim(); // ボタンのテキストを除去
    
    document.getElementById('review-quote').innerText = quote.length > 100 ? quote.substring(0, 100) + "..." : quote;
    
    box.style.display = 'block';
    
    // ポップアップ位置調整
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

// ボックス以外をクリックしたら閉じる
document.addEventListener('click', function(e) {
    const box = document.getElementById('review-box');
    if (box.style.display === 'block' && !box.contains(e.target) && !e.target.classList.contains('review-btn')) {
        closeReview();
    }
});

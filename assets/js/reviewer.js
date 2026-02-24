// assets/js/reviewer.js
document.addEventListener('DOMContentLoaded', function() {
    const contentArea = document.getElementById('content-area');
    const toggle = document.getElementById('review-mode-checkbox');
    const path = "index.md"; // 簡易化のため。本来はmetaタグ等から取得可能

    if (!contentArea || !toggle) return;

    // 1. HTML内のコメント <!--L:n--> を探し、親要素を「レビュー可能」にする
    const walker = document.createTreeWalker(contentArea, NodeFilter.SHOW_COMMENT, null, false);
    let node;
    const markers = [];
    while(node = walker.nextNode()) {
        if (node.nodeValue.startsWith('L:')) {
            markers.push(node);
        }
    }

    markers.forEach(comment => {
        const lineNum = comment.nodeValue.split(':')[1];
        const parent = comment.parentElement;
        
        if (parent && !parent.hasAttribute('data-line')) {
            parent.setAttribute('data-line', lineNum);
            parent.setAttribute('data-path', path);
            parent.style.position = 'relative';

            // レビューボタンを作成
            const btn = document.createElement('span');
            btn.className = 'review-btn';
            btn.innerHTML = '💬';
            btn.onclick = (e) => {
                e.stopPropagation();
                openReviewBox(parent, e);
            };
            // 先頭に挿入
            parent.prepend(btn);
        }
        // マーカーコメントは削除
        comment.remove();
    });

    // 2. トグルイベント
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
    const box = document.getElementById('review-box');
    const quote = el.innerText.replace('💬', '').trim();
    
    window.selectedElement = el;
    document.getElementById('review-quote').innerText = quote.substring(0, 100) + (quote.length > 100 ? "..." : "");
    box.style.display = 'block';
    
    // 位置合わせ（マウス位置）
    box.style.left = Math.min(e.pageX, window.innerWidth - 360) + 'px';
    box.style.top = e.pageY + 'px';
    document.getElementById('review-text').focus();
}

function closeReview() {
    const box = document.getElementById('review-box');
    if (box) box.style.display = 'none';
}

function submitReview() {
    const el = window.selectedElement;
    const line = el.getAttribute('data-line');
    const path = el.getAttribute('data-path');
    const comment = document.getElementById('review-text').value;
    const repoUrl = window.siteConfig.repository_url;

    if (!comment.trim()) return;

    const body = `## Review Comment\n\n**Source:** ${repoUrl}/blob/main/${path}#L${line}\n\n### Quote\n> ${el.innerText.replace('💬', '').trim()}\n\n### Feedback\n${comment}`;
    const url = `${repoUrl}/issues/new?title=Review:${path}(L${line})&body=${encodeURIComponent(body)}`;

    window.open(url, '_blank');
    closeReview();
}

document.addEventListener('click', e => {
    const box = document.getElementById('review-box');
    if (box && box.style.display === 'block' && !box.contains(e.target) && !e.target.classList.contains('review-btn')) closeReview();
});

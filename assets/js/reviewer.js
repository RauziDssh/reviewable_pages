// assets/js/reviewer.js
// コメントの保存用オブジェクト: { line: { text: "...", quote: "...", path: "..." } }
let lineComments = {};
let currentActiveElement = null;

document.addEventListener('DOMContentLoaded', function() {
    const contentArea = document.getElementById('content-area');
    const toggle = document.getElementById('review-mode-checkbox');
    const path = "index.md"; // 簡易化のため

    if (!contentArea || !toggle) return;

    // 1. HTMLコメント <!--L:n--> を探して親要素に属性付与 & ボタン設置
    const walker = document.createTreeWalker(contentArea, NodeFilter.SHOW_COMMENT, null, false);
    let node;
    const markers = [];
    while(node = walker.nextNode()) {
        if (node.nodeValue.startsWith('L:')) markers.push(node);
    }

    markers.forEach(comment => {
        const lineNum = comment.nodeValue.split(':')[1];
        const parent = comment.parentElement;
        if (parent && !parent.hasAttribute('data-line')) {
            parent.setAttribute('data-line', lineNum);
            parent.setAttribute('data-path', path);
            parent.style.position = 'relative';

            const btn = document.createElement('span');
            btn.className = 'review-btn';
            btn.innerHTML = '💬';
            btn.dataset.line = lineNum;
            btn.onclick = (e) => {
                e.stopPropagation();
                openReviewBox(parent, e);
            };
            parent.prepend(btn);
        }
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
    currentActiveElement = el;
    const line = el.getAttribute('data-line');
    const box = document.getElementById('review-box');
    const textarea = document.getElementById('review-text');
    // ボタン記号(💬)やコメントマーカー(<!--L:n-->)を除外
    const rawText = el.innerText || "";
    const quote = rawText.replace(/💬|<!--L:\d+-->/g, '').trim();
    
    document.getElementById('review-quote').innerText = quote.substring(0, 100) + (quote.length > 100 ? "..." : "");
    
    // すでにコメントがあれば復元
    textarea.value = lineComments[line] ? lineComments[line].text : "";
    
    box.style.display = 'block';
    box.style.left = Math.min(e.pageX, window.innerWidth - 320) + 'px';
    box.style.top = e.pageY + 'px';
    textarea.focus();
}

// 現在開いている要素のコメントを保存
function saveCurrentComment() {
    const line = currentActiveElement.getAttribute('data-line');
    const text = document.getElementById('review-text').value.trim();
    const rawText = currentActiveElement.innerText || "";
    const quote = rawText.replace(/💬|<!--L:\d+-->/g, '').trim();
    const path = currentActiveElement.getAttribute('data-path');

    if (text) {
        lineComments[line] = { text, quote, path };
        currentActiveElement.querySelector('.review-btn').classList.add('has-comment');
    } else {
        delete lineComments[line];
        currentActiveElement.querySelector('.review-btn').classList.remove('has-comment');
    }

    updateCommentCount();
    closeReview();
}

function updateCommentCount() {
    const count = Object.keys(lineComments).length;
    document.getElementById('comment-count').innerText = count;
}

function closeReview() {
    document.getElementById('review-box').style.display = 'none';
}

// すべてのコメントをまとめてIssue投稿
function submitBatchIssue() {
    const lines = Object.keys(lineComments);
    if (lines.length === 0) {
        alert("コメントがありません。");
        return;
    }

    const repoUrl = window.siteConfig.repository_url;
    const commitSha = window.siteConfig.commit_sha;
    let body = "## Unified Review Comments\n\n";

    lines.sort((a, b) => parseInt(a) - parseInt(b)).forEach(line => {
        const item = lineComments[line];
        // パーマリンク形式: repo/blob/SHA/path?plain=1#Lline
        const permalink = `${repoUrl}/blob/${commitSha}/${item.path}?plain=1#L${line}`;
        
        body += `### Line ${line}\n`;
        body += `${permalink}\n\n`;
        body += `**Quote:**\n> ${item.quote}\n\n`;
        body += `**Feedback:**\n${item.text}\n\n`;
        body += `---\n\n`;
    });

    const title = `Batch Review: ${Object.keys(lineComments).length} comments`;
    const url = `${repoUrl}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;

    window.open(url, '_blank');
}

// 枠外クリック
document.addEventListener('click', e => {
    const box = document.getElementById('review-box');
    if (box && box.style.display === 'block' && !box.contains(e.target) && !e.target.classList.contains('review-btn')) {
        closeReview();
    }
});

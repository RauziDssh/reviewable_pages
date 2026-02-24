// assets/js/reviewer.js
// コメントの保存用オブジェクト: { line: { text: "...", quote: "...", path: "..." } }
let lineComments = {};
let currentActiveElement = null;

document.addEventListener('DOMContentLoaded', function() {
    const contentArea = document.getElementById('content-area');
    const toggle = document.getElementById('review-mode-checkbox');
    const path = "index.md"; 

    if (!contentArea || !toggle) return;

    // 1. HTML内のコメント <!--L:n--> を探し、親要素を「レビュー可能」にする
    const walker = document.createTreeWalker(contentArea, NodeFilter.SHOW_COMMENT, null, false);
    let node;
    const markers = [];
    while(node = walker.nextNode()) {
        if (node.nodeValue.trim().startsWith('L:')) markers.push(node);
    }

    markers.forEach(comment => {
        const lineNum = comment.nodeValue.split(':')[1].trim();
        const parent = comment.parentElement;
        if (parent && !parent.hasAttribute('data-line')) {
            const itemPath = parent.getAttribute('data-path') || path;
            const blockElement = parent.closest('p, li, h1, h2, h3, h4, h5, h6, blockquote') || parent;
            
            if (!blockElement.hasAttribute('data-line')) {
                blockElement.setAttribute('data-line', lineNum);
                blockElement.setAttribute('data-path', itemPath);
                blockElement.style.position = 'relative';

                const btn = document.createElement('span');
                btn.className = 'review-btn';
                btn.innerHTML = '💬';
                btn.dataset.line = lineNum;
                btn.onclick = (e) => {
                    e.stopPropagation();
                    openReviewBox(blockElement, e);
                };
                blockElement.prepend(btn);
            }
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
    
    // クリーンアップ処理
    const rawText = el.innerText || "";
    const quote = rawText.replace(/💬/g, '').replace(/<!--L:\d+-->/g, '').trim();
    
    document.getElementById('review-quote').innerText = quote.substring(0, 100) + (quote.length > 100 ? "..." : "");
    textarea.value = lineComments[line] ? lineComments[line].text : "";
    
    box.style.display = 'block';
    box.style.left = Math.min(e.pageX, window.innerWidth - 320) + 'px';
    box.style.top = e.pageY + 'px';
    textarea.focus();
}

function saveCurrentComment() {
    const line = currentActiveElement.getAttribute('data-line');
    const text = document.getElementById('review-text').value.trim();
    const rawText = currentActiveElement.innerText || "";
    const quote = rawText.replace(/💬/g, '').replace(/<!--L:\d+-->/g, '').trim();
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
    const box = document.getElementById('review-box');
    if (box) box.style.display = 'none';
}

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
        const startLine = parseInt(line);
        const endLine = startLine + 1;
        // 範囲指定形式: #L開始行-L終了行
        const permalink = `${repoUrl}/blob/${commitSha}/${item.path}?plain=1#L${startLine}-L${endLine}`;
        
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

document.addEventListener('click', e => {
    const box = document.getElementById('review-box');
    if (box && box.style.display === 'block' && !box.contains(e.target) && !e.target.classList.contains('review-btn')) {
        closeReview();
    }
});

// assets/js/reviewer.js
let selectedElement = null;

document.addEventListener('click', function(e) {
    const target = e.target.closest('[data-line]');
    const box = document.getElementById('review-box');
    
    // Check if click is outside review-box and not on a data-line
    if (box.style.display === 'block' && !box.contains(e.target) && !target) {
        closeReview();
        return;
    }

    if (target) {
        selectedElement = target;
        const quoteText = target.innerText.trim();
        document.getElementById('review-quote').innerText = quoteText.length > 100 ? quoteText.substring(0, 100) + "..." : quoteText;
        
        box.style.display = 'block';
        
        // Position the box near the cursor, keeping it within viewport
        const boxWidth = 320;
        let left = e.pageX;
        if (left + boxWidth > window.innerWidth) {
            left = window.innerWidth - boxWidth - 20;
        }
        
        box.style.left = left + 'px';
        box.style.top = e.pageY + 'px';
        
        // Focus the textarea
        document.getElementById('review-text').focus();
    }
});

function closeReview() {
    document.getElementById('review-box').style.display = 'none';
    document.getElementById('review-text').value = '';
}

function submitReview() {
    const line = selectedElement.getAttribute('data-line');
    const path = selectedElement.getAttribute('data-path');
    const comment = document.getElementById('review-text').value;
    const quote = selectedElement.innerText.trim();
    const repoUrl = window.siteConfig.repository_url;

    if (!comment.trim()) {
        alert("指摘内容を入力してください。");
        return;
    }

    // Generate GitHub permalink
    const permalink = `${repoUrl}/blob/main/${path}#L${line}`;
    
    const body = `## Review Comment

` +
                 `**Source:** ${permalink}

` +
                 `### Quote
> ${quote}

` +
                 `### Feedback
${comment}`;

    const title = `Review: ${path} (L${line})`;
    const issueUrl = `${repoUrl}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;

    // Open GitHub in a new tab
    window.open(issueUrl, '_blank');
    
    closeReview();
}

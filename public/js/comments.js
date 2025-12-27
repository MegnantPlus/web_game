// comments.js - UPDATED FOR API DATA
function renderComments() {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    
    if (!window.commentsData || window.commentsData.length === 0) {
        commentsList.innerHTML = `
            <div class="no-comments">
                <i class="fas fa-comment-slash"></i>
                <h4>No comments yet</h4>
                <p>Be the first to comment!</p>
            </div>
        `;
        document.getElementById('commentsCount').textContent = '(0)';
        return;
    }
    
    // Hiển thị comments từ API
    commentsList.innerHTML = window.commentsData.map(comment => 
        createCommentHTML(comment)
    ).join('');
    
    // Update comment count
    let totalComments = window.commentsData.length;
    window.commentsData.forEach(comment => {
        if (comment.replies) totalComments += comment.replies.length;
    });
    document.getElementById('commentsCount').textContent = `(${totalComments})`;
}

function createCommentHTML(comment) {
    const isCurrentUser = currentUser && comment.user && 
                         comment.user._id === currentUser._id;
    
    return `
        <div class="comment-item" data-id="${comment._id}">
            <div class="comment-main">
                <div class="comment-content-wrapper">
                    <div class="comment-header">
                        <div class="comment-avatar ${comment.user.username === 'Dmaster' ? 'admin-avatar' : ''}">
                            ${comment.user.username.charAt(0).toUpperCase()}
                        </div>
                        <div class="comment-info">
                            <span class="comment-author">
                                ${comment.user.username}
                                ${comment.user.username === 'Dmaster' ? '<span class="admin-badge">(admin)</span>' : ''}
                            </span>
                            <span class="comment-time">
                                ${formatTimeAgo(new Date(comment.createdAt).getTime())}
                            </span>
                            ${isCurrentUser ? '<span class="comment-owner">(You)</span>' : ''}
                        </div>
                        ${isCurrentUser || (currentUser && currentUser.isAdmin) ? `
                            <button class="delete-btn" onclick="deleteComment('${comment._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                    
                    <div class="comment-content">${escapeHtml(comment.content)}</div>
                    
                    ${currentUser && comment.depth < 2 ? `
                        <div class="comment-actions">
                            <button class="reply-btn" onclick="toggleReplyForm('${comment._id}')">
                                <i class="fas fa-reply"></i> Reply
                            </button>
                        </div>
                        
                        <div class="reply-form hidden" id="replyForm-${comment._id}">
                            <textarea class="reply-input" placeholder="Write a reply..."></textarea>
                            <div class="reply-form-actions">
                                <button class="cancel-btn" onclick="cancelReply('${comment._id}')">Cancel</button>
                                <button class="submit-btn" onclick="submitReply('${comment._id}')">Reply</button>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${comment.replies && comment.replies.length > 0 ? `
                        <div class="replies-container">
                            ${comment.replies.map(reply => createReplyHTML(reply)).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function createReplyHTML(reply) {
    const isCurrentUser = currentUser && reply.user && 
                         reply.user._id === currentUser._id;
    
    return `
        <div class="comment-item reply-item" data-id="${reply._id}">
            <div class="comment-main">
                <div class="comment-content-wrapper">
                    <div class="comment-header">
                        <div class="comment-avatar ${reply.user.username === 'Dmaster' ? 'admin-avatar' : ''}">
                            ${reply.user.username.charAt(0).toUpperCase()}
                        </div>
                        <div class="comment-info">
                            <span class="comment-author">
                                ${reply.user.username}
                                ${reply.user.username === 'Dmaster' ? '<span class="admin-badge">(admin)</span>' : ''}
                            </span>
                            <span class="comment-time">
                                ${formatTimeAgo(new Date(reply.createdAt).getTime())}
                            </span>
                            ${isCurrentUser ? '<span class="comment-owner">(You)</span>' : ''}
                        </div>
                        ${isCurrentUser || (currentUser && currentUser.isAdmin) ? `
                            <button class="delete-btn" onclick="deleteComment('${reply._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                    
                    <div class="comment-content">${escapeHtml(reply.content)}</div>
                </div>
            </div>
        </div>
    `;
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTimeAgo(timestamp) {
    if (!timestamp) return "Just now";
    
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 5) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
}
// main.js - Main Application File
let isFullscreen = false;

// Initialize everything
function initializePage() {
    // Update auth UI
    updateAuthUI();
    
    // Render comments
    renderComments();
    
    // Render updates
    updatesSlider.renderSlider();
    
    // Update update count
    updateUpdatesCount();
    
    // Set up event listeners
    setupSmoothScroll();
    setupFullscreenListener();
    
    // Auto-save comments every 30 seconds
    setInterval(() => {
        if (window.commentsSystem) commentsSystem.saveComments();
    }, 30000);
}

// Auth functions
function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userAvatar = document.getElementById('userAvatar');
    const adminPanel = document.getElementById('adminPanel');
    
    if (userSystem.isLoggedIn()) {
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';
        usernameDisplay.textContent = userSystem.getUsername();
        userAvatar.textContent = userSystem.getUserAvatar();
        
        if (userSystem.isAdmin()) {
            usernameDisplay.innerHTML = `${userSystem.getUsername()} <span class="admin-badge">(admin)</span>`;
            userAvatar.classList.add('admin-avatar');
            adminPanel.style.display = 'block';
        } else {
            userAvatar.classList.remove('admin-avatar');
            adminPanel.style.display = 'none';
        }
        
        // Show comment form
        document.getElementById('loginToComment').style.display = 'none';
        document.getElementById('commentInputSection').style.display = 'block';
    } else {
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
        adminPanel.style.display = 'none';
        
        // Hide comment form
        document.getElementById('loginToComment').style.display = 'block';
        document.getElementById('commentInputSection').style.display = 'none';
    }
    
    // Update updates display based on login status
    updatesSlider.renderSlider();
}

// Comment rendering
function renderComments() {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    
    commentsList.innerHTML = commentsSystem.comments.map(comment => 
        createCommentHTML(comment)
    ).join('');
    
    // Update comment count
    const totalComments = commentsSystem.getTotalComments();
    document.getElementById('commentsCount').textContent = `(${totalComments})`;
}

function createCommentHTML(comment) {
    const isCurrentUser = userSystem.isLoggedIn() && 
                         comment.author === userSystem.getUsername();
    const isAdminUser = userSystem.users.find(u => u.username === comment.author)?.isAdmin === true;
    const currentUsername = userSystem.getUsername();
    const userVote = comment.votedUsers[currentUsername];
    
    const voteNumberClass = comment.voteScore > 0 ? 'positive' : 
                           comment.voteScore < 0 ? 'negative' : '';
    
    return `
        <div class="comment-item" data-id="${comment.id}">
            <div class="comment-main">
                <div class="comment-votes">
                    <div class="vote-system">
                        <button class="vote-btn vote-up ${userVote === 'up' ? 'active' : ''}" 
                                onclick="handleVote(${comment.id}, 'up')">
                            <i class="fas fa-chevron-up"></i>
                        </button>
                        <span class="vote-number ${voteNumberClass}">${comment.voteScore}</span>
                        <button class="vote-btn vote-down ${userVote === 'down' ? 'active' : ''}" 
                                onclick="handleVote(${comment.id}, 'down')">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                </div>
                
                <div class="comment-content-wrapper">
                    <div class="comment-header">
                        <div class="comment-avatar ${isAdminUser ? 'admin-avatar' : ''}">
                            ${comment.author.charAt(0).toUpperCase()}
                        </div>
                        <div class="comment-info">
                            <span class="comment-author">
                                ${comment.author}
                                ${isAdminUser ? '<span class="admin-badge">(admin)</span>' : ''}
                            </span>
                            <span class="comment-time">
                                ${formatTimeAgo(comment.timestamp)}
                            </span>
                            ${isCurrentUser ? '<span class="comment-owner">(You)</span>' : ''}
                        </div>
                        ${isCurrentUser || userSystem.isAdmin() ? `
                            <button class="delete-btn" onclick="deleteComment(${comment.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                    
                    <div class="comment-content">${escapeHtml(comment.content)}</div>
                    
                    ${userSystem.isLoggedIn() ? `
                        <div class="comment-actions">
                            <button class="reply-btn" onclick="toggleReplyForm(${comment.id})">
                                <i class="fas fa-reply"></i> Reply
                            </button>
                        </div>
                        
                        <div class="reply-form hidden" id="replyForm-${comment.id}">
                            <textarea class="reply-input" placeholder="Write a reply..."></textarea>
                            <div class="reply-form-actions">
                                <button class="cancel-btn" onclick="cancelReply(${comment.id})">Cancel</button>
                                <button class="submit-btn" onclick="submitReply(${comment.id})">Reply</button>
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
    const isCurrentUser = userSystem.isLoggedIn() && 
                         reply.author === userSystem.getUsername();
    const isAdminUser = userSystem.users.find(u => u.username === reply.author)?.isAdmin === true;
    const currentUsername = userSystem.getUsername();
    const userVote = reply.votedUsers[currentUsername];
    
    const voteNumberClass = reply.voteScore > 0 ? 'positive' : 
                           reply.voteScore < 0 ? 'negative' : '';
    
    return `
        <div class="comment-item reply-item" data-id="${reply.id}">
            <div class="comment-main">
                <div class="comment-votes">
                    <div class="vote-system">
                        <button class="vote-btn vote-up ${userVote === 'up' ? 'active' : ''}" 
                                onclick="handleVote(${reply.id}, 'up')">
                            <i class="fas fa-chevron-up"></i>
                        </button>
                        <span class="vote-number ${voteNumberClass}">${reply.voteScore}</span>
                        <button class="vote-btn vote-down ${userVote === 'down' ? 'active' : ''}" 
                                onclick="handleVote(${reply.id}, 'down')">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                </div>
                
                <div class="comment-content-wrapper">
                    <div class="comment-header">
                        <div class="comment-avatar ${isAdminUser ? 'admin-avatar' : ''}">
                            ${reply.author.charAt(0).toUpperCase()}
                        </div>
                        <div class="comment-info">
                            <span class="comment-author">
                                ${reply.author}
                                ${isAdminUser ? '<span class="admin-badge">(admin)</span>' : ''}
                            </span>
                            <span class="comment-time">
                                ${formatTimeAgo(reply.timestamp)}
                            </span>
                            ${isCurrentUser ? '<span class="comment-owner">(You)</span>' : ''}
                        </div>
                        ${isCurrentUser || userSystem.isAdmin() ? `
                            <button class="delete-btn" onclick="deleteComment(${reply.id})">
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

// Comment actions
function submitComment() {
    const input = document.getElementById('commentInput');
    const content = input.value.trim();
    
    if (!content) {
        showCustomAlert('Error', 'Please enter a comment', 'error');
        return;
    }
    
    if (!userSystem.isLoggedIn()) {
        showAuthModal('login');
        return;
    }
    
    commentsSystem.addComment(content, userSystem.getUsername());
    input.value = '';
    renderComments();
    showCustomAlert('Success', 'Comment added!', 'success');
}

function submitReply(commentId) {
    const replyForm = document.getElementById(`replyForm-${commentId}`);
    if (!replyForm) return;
    
    const textarea = replyForm.querySelector('.reply-input');
    const content = textarea.value.trim();
    
    if (!content) {
        showCustomAlert('Error', 'Please enter a reply', 'error');
        return;
    }
    
    if (!userSystem.isLoggedIn()) {
        showAuthModal('login');
        return;
    }
    
    commentsSystem.addReply(commentId, content, userSystem.getUsername());
    textarea.value = '';
    replyForm.classList.add('hidden');
    renderComments();
    showCustomAlert('Success', 'Reply added!', 'success');
}

function deleteComment(commentId) {
    if (!userSystem.isLoggedIn()) {
        showAuthModal('login');
        return;
    }
    
    const comment = commentsSystem.findCommentById(commentId);
    if (!comment) return;
    
    const isOwner = comment.author === userSystem.getUsername();
    if (!isOwner && !userSystem.isAdmin()) {
        showCustomAlert('Error', 'You can only delete your own comments!', 'error');
        return;
    }
    
    showCustomConfirm(
        'Delete Comment',
        'Are you sure you want to delete this comment?',
        () => {
            commentsSystem.deleteComment(commentId);
            renderComments();
            if (adminPanel) adminPanel.loadAdminCommentsList();
            showCustomAlert('Success', 'Comment deleted!', 'success');
        }
    );
}

function handleVote(commentId, voteType) {
    if (!userSystem.isLoggedIn()) {
        showAuthModal('login');
        return;
    }
    
    const userId = userSystem.getUsername();
    if (commentsSystem.voteComment(commentId, userId, voteType)) {
        renderComments();
    }
}

// Reply form functions
function toggleReplyForm(commentId) {
    const form = document.getElementById(`replyForm-${commentId}`);
    if (form) {
        form.classList.toggle('hidden');
        if (!form.classList.contains('hidden')) {
            form.querySelector('.reply-input').focus();
        }
    }
}

function cancelReply(commentId) {
    const form = document.getElementById(`replyForm-${commentId}`);
    if (form) {
        form.classList.add('hidden');
        form.querySelector('.reply-input').value = '';
    }
}

// Game functions
function startGame() {
    // Placeholder for game start
    // You can replace this with actual game embed code
    const placeholder = document.getElementById('gamePlaceholder');
    placeholder.innerHTML = `
        <div class="placeholder-content">
            <h2 style="color: white; margin-bottom: 20px;">🎮 Game Loading...</h2>
            <p style="color: #aaa; margin-bottom: 30px;">Game will start in fullscreen mode</p>
            <div class="game-buttons">
                <button class="run-game-btn" onclick="startGame()">
                    🔄 Restart Game
                </button>
            </div>
        </div>
    `;
    
    // Add exit button
    const exitBtn = document.createElement('button');
    exitBtn.className = 'exit-game-btn';
    exitBtn.innerHTML = '✕';
    exitBtn.title = 'Exit Game';
    exitBtn.onclick = exitGame;
    
    document.getElementById('gamePlayer').appendChild(exitBtn);
}

function exitGame() {
    const placeholder = document.getElementById('gamePlaceholder');
    placeholder.innerHTML = `
        <div class="placeholder-content">
            <button class="run-game-btn" onclick="startGame()">
                ▶ RUN GAME
            </button>
            <p>Click RUN GAME to start playing</p>
        </div>
    `;
    
    // Remove exit button
    const exitBtn = document.querySelector('.exit-game-btn');
    if (exitBtn) exitBtn.remove();
    
    // Exit fullscreen if active
    if (isFullscreen) {
        toggleFullscreen();
    }
}

// Fullscreen functions
function toggleFullscreen() {
    const gamePlayer = document.getElementById('gamePlayer');
    
    if (!isFullscreen) {
        if (gamePlayer.requestFullscreen) {
            gamePlayer.requestFullscreen();
        } else if (gamePlayer.mozRequestFullScreen) {
            gamePlayer.mozRequestFullScreen();
        } else if (gamePlayer.webkitRequestFullscreen) {
            gamePlayer.webkitRequestFullscreen();
        } else if (gamePlayer.msRequestFullscreen) {
            gamePlayer.msRequestFullscreen();
        }
        
        // On mobile, lock to landscape
        if (window.innerWidth < 768) {
            gamePlayer.classList.add('fullscreen');
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        gamePlayer.classList.remove('fullscreen');
    }
    
    isFullscreen = !isFullscreen;
}

function setupFullscreenListener() {
    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    document.addEventListener('mozfullscreenchange', updateFullscreenState);
    document.addEventListener('MSFullscreenChange', updateFullscreenState);
}

function updateFullscreenState() {
    if (!document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.mozFullScreenElement &&
        !document.msFullscreenElement) {
        isFullscreen = false;
        document.getElementById('gamePlayer').classList.remove('fullscreen');
    } else {
        isFullscreen = true;
        if (window.innerWidth < 768) {
            document.getElementById('gamePlayer').classList.add('fullscreen');
        }
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTimeAgo(timestamp) {
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

function updateUpdatesCount() {
    const count = userSystem.getVisibleUpdates().length;
    document.getElementById('updatesCount').textContent = `(${count})`;
}

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializePage);
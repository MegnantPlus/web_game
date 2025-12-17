// main.js - Main Application File
let showCommentsToPublic = true;
let isFullscreen = false;
let currentUser = null;
let isShowingAllUpdates = false;
let currentUpdateIndex = 0;
let currentPreviewIndex = 0; // Thêm dòng này

// SIMPLE HASH FUNCTION - CHẠY CHÍNH XÁC
function simpleHash(password) {
    let hash = 5381;
    for (let i = 0; i < password.length; i++) {
        hash = (hash * 33) ^ password.charCodeAt(i);
    }
    return (hash >>> 0).toString(36);
}

// TẠO ADMIN TÀI KHOẢN TỰ ĐỘNG
function createAdminAccount() {
    let users = JSON.parse(localStorage.getItem('pickleball_users') || '[]');
    const adminExists = users.find(u => u.username === 'Dmaster' && u.email === 'abc@gmail.com');
    
    if (!adminExists) {
        const adminUser = {
            username: 'Dmaster',
            email: 'abc@gmail.com',
            password: simpleHash('010101'),
            createdAt: Date.now(),
            isAdmin: true,
            isBanned: false
        };
        users.push(adminUser);
        localStorage.setItem('pickleball_users', JSON.stringify(users));
        console.log('✅ Admin account created: Dmaster / 010101 / abc@gmail.com');
    }
}

// Initialize everything
function initializePage() {
    console.log('🔄 Initializing page...');
    
    // Tạo admin account nếu chưa có
    createAdminAccount();
    
    // Load session
    loadSession();
    
    // Update UI based on login status
    updateAuthUI();
    
    // Render comments ngay lập tức
    renderComments();
    
    // Render updates
    renderUpdates();
    
    // Setup event listeners
    setupSmoothScroll();
    setupFullscreenListener();
    setupOrientationListener(); // Thêm dòng này
    
    // Thêm listener để khôi phục scroll khi load lại trang
    window.addEventListener('load', function() {
        if (!isFullscreen) {
            enableScroll();
        }
    });
    
    console.log('✅ Page initialized');
}

// Session management
function loadSession() {
    const sessionUsername = localStorage.getItem('pickleball_session');
    if (sessionUsername) {
        const users = JSON.parse(localStorage.getItem('pickleball_users') || '[]');
        const user = users.find(u => u.username === sessionUsername);
        
        if (user) {
            // Kiểm tra xem user có bị banned không
            const bannedUsers = JSON.parse(localStorage.getItem('pickleball_banned') || '[]');
            if (!bannedUsers.includes(sessionUsername) && !user.isBanned) {
                currentUser = user;
                console.log('✅ User logged in:', currentUser.username, currentUser.email);
            } else {
                // Nếu bị banned, xóa session
                localStorage.removeItem('pickleball_session');
                currentUser = null;
                console.log('❌ User is banned');
            }
        } else {
            // Nếu user không tồn tại trong database
            localStorage.removeItem('pickleball_session');
            currentUser = null;
        }
    }
    console.log('Current user after load:', currentUser);
}

function saveSession() {
    if (currentUser) {
        localStorage.setItem('pickleball_session', currentUser.username);
    }
}

// Auth functions
function showAuthModal(mode = 'login') {
    const modal = document.getElementById('authModal');
    const title = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const switchText = document.getElementById('authSwitch');
    const authForm = document.querySelector('.auth-form');
    
    document.getElementById('authError').textContent = '';
    document.getElementById('authEmail').value = '';
    document.getElementById('authPassword').value = '';
    if (mode === 'signup') {
        document.getElementById('authUsername').value = '';
    }
    
    // Hiển thị/ẩn trường username dựa trên mode
    const usernameField = document.getElementById('usernameField');
    if (usernameField) {
        usernameField.style.display = mode === 'signup' ? 'block' : 'none';
    }
    
    if (mode === 'signup') {
        title.textContent = 'Sign up';
        submitBtn.textContent = 'Sign up';
        switchText.innerHTML = 'Already have an account? <a href="#" onclick="toggleAuthMode()">Log in</a>';
    } else {
        title.textContent = 'Log in';
        submitBtn.textContent = 'Log in';
        switchText.innerHTML = 'Don\'t have an account? <a href="#" onclick="toggleAuthMode()">Sign up</a>';
    }
    
    modal.style.display = 'flex';
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
    
    // Reset error state
    document.getElementById('authError').textContent = '';
    document.querySelectorAll('.auth-form input').forEach(input => {
        input.classList.remove('error');
    });
}

function toggleAuthMode() {
    const currentMode = document.getElementById('modalTitle').textContent.includes('Sign up') ? 'signup' : 'login';
    showAuthModal(currentMode === 'login' ? 'signup' : 'login');
}

function handleAuthSubmit() {
    const isSignupMode = document.getElementById('modalTitle').textContent.includes('Sign up');
    const errorElement = document.getElementById('authError');
    
    // Xóa class error cũ
    document.querySelectorAll('.auth-form input').forEach(input => {
        input.classList.remove('error');
    });
    
    if (isSignupMode) {
        // SIGN UP - 3 trường
        const username = document.getElementById('authUsername').value.trim();
        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value;
        
        if (!username || !email || !password) {
            errorElement.textContent = 'Please fill in all fields';
            // Thêm class error cho input trống
            if (!username) document.getElementById('authUsername').classList.add('error');
            if (!email) document.getElementById('authEmail').classList.add('error');
            if (!password) document.getElementById('authPassword').classList.add('error');
            return;
        }
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorElement.textContent = 'Please enter a valid email address';
            document.getElementById('authEmail').classList.add('error');
            return;
        }
        
        // Get users from localStorage
        let users = JSON.parse(localStorage.getItem('pickleball_users') || '[]');
        
        // Check if username exists
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            errorElement.textContent = 'Username already exists';
            document.getElementById('authUsername').classList.add('error');
            return;
        }
        
        // Check if email exists
        if (users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase())) {
            errorElement.textContent = 'Email already registered';
            document.getElementById('authEmail').classList.add('error');
            return;
        }
        
        if (username.length < 3 || username.length > 20) {
            errorElement.textContent = 'Username must be 3-20 characters';
            document.getElementById('authUsername').classList.add('error');
            return;
        }
        
        // ĐỔI TỪ 6 KÍ TỰ THÀNH 8 KÍ TỰ
        if (password.length < 8) {
            errorElement.textContent = 'Password must be at least 8 characters';
            document.getElementById('authPassword').classList.add('error');
            return;
        }
        
        // ... phần còn lại của sign up ...
        
    } else {
        // LOGIN - 2 trường
        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value;
        
        if (!email || !password) {
            errorElement.textContent = 'Please fill in all fields';
            // Thêm class error cho input trống
            if (!email) document.getElementById('authEmail').classList.add('error');
            if (!password) document.getElementById('authPassword').classList.add('error');
            return;
        }
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorElement.textContent = 'Please enter a valid email address';
            document.getElementById('authEmail').classList.add('error');
            return;
        }
        
        // Get users from localStorage
        let users = JSON.parse(localStorage.getItem('pickleball_users') || '[]');
        
        // Tìm user bằng email
        const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            errorElement.textContent = 'Invalid email or password';
            document.getElementById('authEmail').classList.add('error');
            document.getElementById('authPassword').classList.add('error');
            return;
        }
        
        const hashedPassword = simpleHash(password);
        
        if (user.password !== hashedPassword) {
            errorElement.textContent = 'Invalid email or password';
            document.getElementById('authEmail').classList.add('error');
            document.getElementById('authPassword').classList.add('error');
            return;
        }
        
        if (user.isBanned) {
            errorElement.textContent = 'This account has been banned!';
            return;
        }
        
        // Success
        currentUser = user;
        saveSession();
        closeAuthModal();
        updateAuthUI();
        renderUpdates();
        showNotification('Logged in successfully!', 'success');
    }
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userAvatar = document.getElementById('userAvatar');
    const adminPanel = document.getElementById('adminPanel');
    const loginToComment = document.getElementById('loginToComment');
    const commentInputSection = document.getElementById('commentInputSection');
    
    console.log('Updating auth UI, current user:', currentUser);
    
    if (currentUser) {
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';
        usernameDisplay.textContent = currentUser.username;
        userAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
        
        if (currentUser.isAdmin) {
            usernameDisplay.innerHTML = `${currentUser.username} <span class="admin-badge">(admin)</span>`;
            userAvatar.classList.add('admin-avatar');
            adminPanel.style.display = 'block';
        } else {
            userAvatar.classList.remove('admin-avatar');
            adminPanel.style.display = 'none';
        }
        
        // Show comment form
        if (loginToComment) loginToComment.style.display = 'none';
        if (commentInputSection) commentInputSection.style.display = 'block';
    } else {
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
        adminPanel.style.display = 'none';
        
        // Show login prompt for comments
        if (loginToComment) loginToComment.style.display = 'block';
        if (commentInputSection) commentInputSection.style.display = 'none';
    }
    
    // Luôn render lại comments để cập nhật UI
    renderComments();
    renderUpdates();
}

function logout() {
    showCustomConfirm(
        'Logout',
        'Are you sure you want to logout?',
        () => {
            currentUser = null;
            localStorage.removeItem('pickleball_session');
            updateAuthUI();
            renderComments();
            renderUpdates();
            showNotification('Logged out successfully!', 'success');
        }
    );
}

// Comments functions
window.commentsData = JSON.parse(localStorage.getItem('pickleball_comments') || '[]');

function renderComments() {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    
    console.log('Rendering comments...', window.commentsData.length, 'comments');
    
    if (window.commentsData.length === 0) {
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
    
    // HIỂN THỊ COMMENT CHO TẤT CẢ MỌI NGƯỜI
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
    const isCurrentUser = currentUser && comment.author === currentUser.username;
    
    // Get user's vote
    let userVote = null;
    if (currentUser && comment.votes) {
        userVote = comment.votes[currentUser.username];
    }
    
    const voteNumberClass = comment.voteScore > 0 ? 'positive' : 
                           comment.voteScore < 0 ? 'negative' : '';
    
    // LUÔN HIỂN THỊ NỘI DUNG COMMENT, CHỈ ẨN NÚT HÀNH ĐỘNG NẾU CHƯA LOGIN
    return `
        <div class="comment-item" data-id="${comment.id}">
            <div class="comment-main">
                <div class="comment-votes">
                    <div class="vote-system">
                        ${currentUser ? `
                            <button class="vote-btn vote-up ${userVote === 'up' ? 'active' : ''}" 
                                    onclick="handleVote(${comment.id}, 'up')">
                                <i class="fas fa-chevron-up"></i>
                            </button>
                            <span class="vote-number ${voteNumberClass}">${comment.voteScore || 0}</span>
                            <button class="vote-btn vote-down ${userVote === 'down' ? 'active' : ''}" 
                                    onclick="handleVote(${comment.id}, 'down')">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        ` : `
                            <div style="text-align: center;">
                                <span class="vote-number ${voteNumberClass}">${comment.voteScore || 0}</span>
                                <div style="font-size: 0.7rem; color: #888; margin-top: 2px;">votes</div>
                            </div>
                        `}
                    </div>
                </div>
                
                <div class="comment-content-wrapper">
                    <div class="comment-header">
                        <div class="comment-avatar ${comment.author === 'Dmaster' ? 'admin-avatar' : ''}">
                            ${comment.author.charAt(0).toUpperCase()}
                        </div>
                        <div class="comment-info">
                            <span class="comment-author">
                                ${comment.author}
                                ${comment.author === 'Dmaster' ? '<span class="admin-badge">(admin)</span>' : ''}
                            </span>
                            <span class="comment-time">
                                ${formatTimeAgo(comment.timestamp)}
                            </span>
                            ${isCurrentUser ? '<span class="comment-owner">(You)</span>' : ''}
                        </div>
                        ${isCurrentUser || (currentUser && currentUser.isAdmin) ? `
                            <button class="delete-btn" onclick="deleteComment(${comment.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                    
                    <div class="comment-content">${escapeHtml(comment.content)}</div>
                    
                    ${currentUser ? `
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
    const isCurrentUser = currentUser && reply.author === currentUser.username;
    let userVote = null;
    if (currentUser && reply.votes) {
        userVote = reply.votes[currentUser.username];
    }
    
    const voteNumberClass = reply.voteScore > 0 ? 'positive' : 
                           reply.voteScore < 0 ? 'negative' : '';
    
    // LUÔN HIỂN THỊ REPLY CHO MỌI NGƯỜI
    return `
        <div class="comment-item reply-item" data-id="${reply.id}">
            <div class="comment-main">
                <div class="comment-votes">
                    <div class="vote-system">
                        ${currentUser ? `
                            <button class="vote-btn vote-up ${userVote === 'up' ? 'active' : ''}" 
                                    onclick="handleVote(${reply.id}, 'up')">
                                <i class="fas fa-chevron-up"></i>
                            </button>
                            <span class="vote-number ${voteNumberClass}">${reply.voteScore || 0}</span>
                            <button class="vote-btn vote-down ${userVote === 'down' ? 'active' : ''}" 
                                    onclick="handleVote(${reply.id}, 'down')">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        ` : `
                            <div style="text-align: center;">
                                <span class="vote-number ${voteNumberClass}">${reply.voteScore || 0}</span>
                                <div style="font-size: 0.7rem; color: #888; margin-top: 2px;">votes</div>
                            </div>
                        `}
                    </div>
                </div>
                
                <div class="comment-content-wrapper">
                    <div class="comment-header">
                        <div class="comment-avatar ${reply.author === 'Dmaster' ? 'admin-avatar' : ''}">
                            ${reply.author.charAt(0).toUpperCase()}
                        </div>
                        <div class="comment-info">
                            <span class="comment-author">
                                ${reply.author}
                                ${reply.author === 'Dmaster' ? '<span class="admin-badge">(admin)</span>' : ''}
                            </span>
                            <span class="comment-time">
                                ${formatTimeAgo(reply.timestamp)}
                            </span>
                            ${isCurrentUser ? '<span class="comment-owner">(You)</span>' : ''}
                        </div>
                        ${isCurrentUser || (currentUser && currentUser.isAdmin) ? `
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

function submitComment() {
    const input = document.getElementById('commentInput');
    const content = input.value.trim();
    
    if (!content) {
        showNotification('Please enter a comment', 'error');
        return;
    }
    
    if (!currentUser) {
        showAuthModal('login');
        return;
    }
    
    const newComment = {
        id: Date.now(),
        author: currentUser.username,
        content: content,
        timestamp: Date.now(),
        voteScore: 0,
        votes: {},
        replies: []
    };
    
    window.commentsData.unshift(newComment);
    localStorage.setItem('pickleball_comments', JSON.stringify(window.commentsData));
    
    input.value = '';
    renderComments();
    showNotification('Comment added!', 'success');
}

function submitReply(commentId) {
    const form = document.getElementById(`replyForm-${commentId}`);
    if (!form) return;
    
    const textarea = form.querySelector('.reply-input');
    const content = textarea.value.trim();
    
    if (!content) {
        showNotification('Please enter a reply', 'error');
        return;
    }
    
    if (!currentUser) {
        showAuthModal('login');
        return;
    }
    
    const parentComment = window.commentsData.find(c => c.id === commentId);
    if (!parentComment) return;
    
    if (!parentComment.replies) parentComment.replies = [];
    
    const newReply = {
        id: Date.now(),
        author: currentUser.username,
        content: content,
        timestamp: Date.now(),
        voteScore: 0,
        votes: {}
    };
    
    parentComment.replies.unshift(newReply);
    localStorage.setItem('pickleball_comments', JSON.stringify(window.commentsData));
    
    textarea.value = '';
    form.classList.add('hidden');
    renderComments();
    showNotification('Reply added!', 'success');
}

function deleteComment(commentId) {
    if (!currentUser) {
        showAuthModal('login');
        return;
    }
    
    // Check if it's a reply
    let commentToDelete = null;
    let isReply = false;
    let parentComment = null;
    
    // Search in main comments
    commentToDelete = window.commentsData.find(c => c.id === commentId);
    
    // Search in replies
    if (!commentToDelete) {
        for (let comment of window.commentsData) {
            if (comment.replies) {
                const reply = comment.replies.find(r => r.id === commentId);
                if (reply) {
                    commentToDelete = reply;
                    parentComment = comment;
                    isReply = true;
                    break;
                }
            }
        }
    }
    
    if (!commentToDelete) return;
    
    // Check permissions
    if (commentToDelete.author !== currentUser.username && !currentUser.isAdmin) {
        showCustomAlert('Error', 'You can only delete your own comments!', 'error');
        return;
    }
    
    showCustomConfirm(
        'Delete Comment',
        'Are you sure you want to delete this comment?',
        () => {
            if (isReply && parentComment) {
                parentComment.replies = parentComment.replies.filter(r => r.id !== commentId);
            } else {
                window.commentsData = window.commentsData.filter(c => c.id !== commentId);
            }
            
            localStorage.setItem('pickleball_comments', JSON.stringify(window.commentsData));
            renderComments();
            showNotification('Comment deleted!', 'success');
        }
    );
}

function handleVote(commentId, voteType) {
    if (!currentUser) {
        showAuthModal('login');
        return;
    }
    
    // Find comment or reply
    let commentToVote = null;
    
    // Search in main comments
    commentToVote = window.commentsData.find(c => c.id === commentId);
    
    // Search in replies
    if (!commentToVote) {
        for (let comment of window.commentsData) {
            if (comment.replies) {
                const reply = comment.replies.find(r => r.id === commentId);
                if (reply) {
                    commentToVote = reply;
                    break;
                }
            }
        }
    }
    
    if (!commentToVote) return;
    
    if (!commentToVote.votes) commentToVote.votes = {};
    if (!commentToVote.voteScore) commentToVote.voteScore = 0;
    
    const currentVote = commentToVote.votes[currentUser.username];
    
    if (currentVote === voteType) {
        // Remove vote
        delete commentToVote.votes[currentUser.username];
        commentToVote.voteScore -= (voteType === 'up' ? 1 : -1);
    } else {
        // Change vote
        if (currentVote) {
            commentToVote.voteScore -= (currentVote === 'up' ? 1 : -1);
        }
        commentToVote.votes[currentUser.username] = voteType;
        commentToVote.voteScore += (voteType === 'up' ? 1 : -1);
    }
    
    localStorage.setItem('pickleball_comments', JSON.stringify(window.commentsData));
    renderComments();
}

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

function clearCommentInput() {
    document.getElementById('commentInput').value = '';
}

// ============ UPDATES FUNCTIONS ============
function renderUpdates() {
    const updates = JSON.parse(localStorage.getItem('pickleball_updates') || '[]');
    const updatesCount = document.getElementById('updatesCount');
    const updatesSlider = document.getElementById('updatesSlider');
    const updatePreviews = document.getElementById('updatePreviews');
    const noUpdates = document.getElementById('noUpdates');
    
    if (updatesCount) updatesCount.textContent = `(${updates.length})`;
    
    // Reset preview index
    currentPreviewIndex = 0;
    currentUpdateIndex = 0;
    
    // Reset search input
    const searchInput = document.getElementById('searchUpdates');
    if (searchInput) searchInput.value = '';
    
    if (updates.length === 0) {
        if (updatesSlider) updatesSlider.style.display = 'none';
        if (updatePreviews) updatePreviews.style.display = 'none';
        if (noUpdates) noUpdates.style.display = 'block';
        return;
    }
    
    if (currentUser) {
        // ĐÃ LOGIN: Show full slider
        if (updatesSlider) updatesSlider.style.display = 'block';
        if (updatePreviews) updatePreviews.style.display = 'none';
        if (noUpdates) noUpdates.style.display = 'none';
        renderUpdateSlider(updates);
    } else {
        // CHƯA LOGIN: Show locked previews
        if (updatesSlider) updatesSlider.style.display = 'none';
        if (updatePreviews) updatePreviews.style.display = 'block';
        if (noUpdates) noUpdates.style.display = 'none';
        renderUpdatePreviews(updates);
    }
}

function renderUpdateSlider(updates) {
    const slidesContainer = document.getElementById('updateSlides');
    const counter = document.getElementById('updateCounter');
    const dotsContainer = document.getElementById('updateDots');
    const prevBtn = document.getElementById('prevUpdate');
    const nextBtn = document.getElementById('nextUpdate');
    
    if (!slidesContainer) return;
    
    if (isShowingAllUpdates) {
        // SHOW ALL - hiển thị tất cả
        slidesContainer.innerHTML = updates.map(update => `
            <div class="update-slide">
                <h3><i class="fas fa-newspaper"></i> ${update.title}</h3>
                <div class="update-content-unlocked">
                    ${update.content}
                </div>
                <div class="update-meta">
                    <div class="update-author">
                        <i class="fas fa-user"></i>
                        <span>${update.author}</span>
                    </div>
                    <div class="update-date">
                        <i class="far fa-calendar"></i>
                        <span>${new Date(update.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        if (counter) counter.textContent = `All Updates (${updates.length})`;
        if (dotsContainer) dotsContainer.innerHTML = '';
        
        // Disable prev/next buttons khi show all
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        
    } else {
        // SHOW SINGLE - chỉ hiển thị 1 update
        if (updates.length === 0) return;
        
        const update = updates[currentUpdateIndex];
        slidesContainer.innerHTML = `
            <div class="update-slide">
                <h3><i class="fas fa-newspaper"></i> ${update.title}</h3>
                <div class="update-content-unlocked">
                    ${update.content}
                </div>
                <div class="update-meta">
                    <div class="update-author">
                        <i class="fas fa-user"></i>
                        <span>${update.author}</span>
                    </div>
                    <div class="update-date">
                        <i class="far fa-calendar"></i>
                        <span>${new Date(update.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `;
        
        if (counter) counter.textContent = `${currentUpdateIndex + 1} / ${updates.length}`;
        
        // Create dots
        if (dotsContainer && updates.length > 1) {
            dotsContainer.innerHTML = updates.map((_, index) => 
                `<span class="slider-dot ${index === currentUpdateIndex ? 'active' : ''}" onclick="goToSlide(${index})"></span>`
            ).join('');
        }
        
        // Enable/disable buttons
        if (prevBtn) prevBtn.disabled = updates.length <= 1;
        if (nextBtn) nextBtn.disabled = updates.length <= 1;
    }
}

// ============ FIXED VERSION - KHÔNG LỘ NỘI DUNG ============
function renderUpdatePreviews(updates) {
    const previewsContainer = document.getElementById('updatePreviews');
    if (!previewsContainer) return;
    
    if (updates.length === 0) {
        previewsContainer.innerHTML = `<div class="no-updates"><p>No updates yet</p></div>`;
        return;
    }
    
    // CHỈ HIỂN THỊ THÔNG TIN TỐI THIỂU - KHÔNG CÓ NỘI DUNG THẬT
    previewsContainer.innerHTML = `
        <div class="update-preview">
            <h4><i class="fas fa-newspaper"></i> Update #${currentPreviewIndex + 1}</h4>
            
            <!-- CHỈ 1 DÒNG THÔNG BÁO - KHÔNG CÓ NỘI DUNG UPDATE -->
            <div style="background: rgba(255,152,0,0.1); border: 1px solid rgba(255,152,0,0.3); 
                        border-radius: 8px; padding: 40px 20px; text-align: center; 
                        color: #FF9800; font-weight: bold; margin: 20px 0;">
                <i class="fas fa-lock"></i> 
                <p style="margin: 10px 0;">Login to read this update</p>
                <a onclick="showAuthModal('login')" 
                   style="color: #2196F3; cursor: pointer; text-decoration: underline; font-size: 0.9rem;">
                   Click here to login
                </a>
            </div>
            
            <div style="color: #666; font-size: 0.9rem;">
                <small><i class="far fa-calendar"></i> Update posted</small>
            </div>
        </div>
        
        ${updates.length > 1 ? `
            <div class="preview-navigation">
                <button class="preview-nav-btn" onclick="prevPreviewUpdate()">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <span class="preview-counter">${currentPreviewIndex + 1}/${updates.length}</span>
                <button class="preview-nav-btn" onclick="nextPreviewUpdate()">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        ` : ''}
    `;
}

function nextPreviewUpdate() {
    const updates = JSON.parse(localStorage.getItem('pickleball_updates') || '[]');
    if (currentPreviewIndex >= updates.length - 1) return;
    currentPreviewIndex++;
    renderUpdatePreviews(updates);
}

function prevPreviewUpdate() {
    const updates = JSON.parse(localStorage.getItem('pickleball_updates') || '[]');
    if (currentPreviewIndex <= 0) return;
    currentPreviewIndex--;
    renderUpdatePreviews(updates);
}

function filterUpdates() {
    const searchTerm = document.getElementById('searchUpdates')?.value.toLowerCase() || '';
    const updates = JSON.parse(localStorage.getItem('pickleball_updates') || '[]');
    
    const filtered = updates.filter(update => 
        update.title.toLowerCase().includes(searchTerm) || 
        update.content.toLowerCase().includes(searchTerm)
    );
    
    // Reset index khi search
    currentPreviewIndex = 0;
    currentUpdateIndex = 0;
    
    if (currentUser) {
        // Người đã login
        if (filtered.length === 0) {
            document.getElementById('updatesSlider').innerHTML = `
                <div class="no-search-results" style="text-align: center; padding: 40px;">
                    <i class="fas fa-search"></i>
                    <h4>No updates found</h4>
                </div>
            `;
        } else {
            renderUpdateSlider(filtered);
        }
    } else {
        // Người chưa login
        if (filtered.length === 0) {
            document.getElementById('updatePreviews').innerHTML = `
                <div class="no-search-results">
                    <i class="fas fa-search"></i>
                    <h4>No updates found</h4>
                    <p>Try different keywords</p>
                </div>
            `;
        } else {
            renderUpdatePreviews(filtered);
        }
    }
    
    document.getElementById('updatesCount').textContent = `(${filtered.length})`;
}

// Game functions
let scrollPosition = 0;

// Game functions - Sửa hàm startGame
function startGame() {
    const placeholder = document.getElementById('gamePlaceholder');
    
    // Hiển thị loading
    placeholder.innerHTML = `
        <div class="placeholder-content">
            <h2 style="color: white; margin-bottom: 20px;">🎮 Game Loading...</h2>
            <p style="color: #aaa; margin-bottom: 30px;">Game will start in fullscreen mode</p>
            <div class="loading-spinner"></div>
        </div>
    `;
    
    // Sau 1 giây load game
    setTimeout(() => {
        placeholder.innerHTML = '';
        
        // Tạo iframe
        const iframe = document.createElement('iframe');
        iframe.id = 'gameFrame';
        iframe.src = 'Game/Game.html';
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            background: #000;
        `;
        
        // Thêm iframe
        placeholder.appendChild(iframe);
        
        // Vào fullscreen
        toggleFullscreen();
        
        // Thêm nút exit
        const exitBtn = document.createElement('button');
        exitBtn.className = 'exit-game-btn';
        exitBtn.innerHTML = '✕';
        exitBtn.title = 'Exit Game';
        exitBtn.onclick = exitGame;
        
        document.getElementById('gamePlayer').appendChild(exitBtn);
        
    }, 1000);
}

function exitGame() {
    // Xóa iframe game
    const gameFrame = document.getElementById('gameFrame');
    if (gameFrame) {
        gameFrame.remove();
    }
    
    // Xóa nút exit
    const exitBtn = document.querySelector('.exit-game-btn');
    if (exitBtn) exitBtn.remove();
    
    // Khôi phục placeholder
    const placeholder = document.getElementById('gamePlaceholder');
    placeholder.innerHTML = `
        <div class="placeholder-content">
            <button class="run-game-btn" onclick="startGame()">
                ▶ RUN GAME
            </button>
            <p>Click RUN GAME to start playing</p>
        </div>
    `;
    
    // Thoát fullscreen
    if (isFullscreen) {
        toggleFullscreen();
    }
    
    showNotification('Game exited', 'info');
}

// Fullscreen functions
function toggleFullscreen() {
    const gamePlayer = document.getElementById('gamePlayer');
    
    if (!isFullscreen) {
        // Lưu vị trí scroll
        scrollPosition = window.pageYOffset;
        
        // Chặn scroll
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        
        if (gamePlayer.requestFullscreen) {
            gamePlayer.requestFullscreen();
        } else if (gamePlayer.webkitRequestFullscreen) {
            gamePlayer.webkitRequestFullscreen();
        }
        
        gamePlayer.classList.add('fullscreen');
    } else {
        // Mở scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        
        gamePlayer.classList.remove('fullscreen');
        
        // Khôi phục scroll
        window.scrollTo(0, scrollPosition);
    }
    
    isFullscreen = !isFullscreen;
}


function setupFullscreenListener() {
    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
}

function updateFullscreenState() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        isFullscreen = false;
        document.getElementById('gamePlayer').classList.remove('fullscreen');
        
        // Mở lại scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        window.scrollTo(0, scrollPosition);
    } else {
        isFullscreen = true;
        document.getElementById('gamePlayer').classList.add('fullscreen');
        
        // Chặn scroll
        scrollPosition = window.pageYOffset;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    }
}

function setupOrientationListener() {
    // Kiểm tra khi xoay màn hình
    window.addEventListener('orientationchange', function() {
        const header = document.querySelector('.header');
        
        if (isFullscreen) {
            // Nếu đang fullscreen và xoay ngang
            if (window.matchMedia("(orientation: landscape)").matches) {
                // Ẩn header
                if (header) {
                    header.style.display = 'none';
                    header.style.opacity = '0';
                    header.style.visibility = 'hidden';
                }
            } else {
                // Xoay dọc - hiện header lại
                if (header) {
                    header.style.display = '';
                    header.style.opacity = '';
                    header.style.visibility = '';
                }
            }
        }
    });
}


function disableScroll() {
    // Lưu vị trí scroll hiện tại
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // Thêm CSS để chặn scroll
    document.body.style.cssText = `
        position: fixed;
        top: -${scrollPosition}px;
        left: 0;
        width: 100%;
        overflow: hidden;
        height: 100vh;
    `;
    
    // Lưu class để nhận biết
    document.body.classList.add('no-scroll');
}
 
function enableScroll() {
    // Xóa CSS chặn scroll
    document.body.style.cssText = '';
    document.body.classList.remove('no-scroll');
    
    // Khôi phục scroll position
    window.scrollTo(0, scrollPosition);
}

// Donate function
function donate(platform) {
    if (platform === 'paypal') {
        window.open('https://paypal.com', '_blank');
    } else if (platform === 'patreon') {
        window.open('https://patreon.com', '_blank');
    }
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

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#ff4757' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        max-width: 350px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Slider functions
function prevUpdate() {
    if (isShowingAllUpdates) return;
    
    const updates = JSON.parse(localStorage.getItem('pickleball_updates') || '[]');
    if (updates.length <= 1) return;
    
    currentUpdateIndex = (currentUpdateIndex - 1 + updates.length) % updates.length;
    renderUpdateSlider(updates);
}

function nextUpdate() {
    if (isShowingAllUpdates) return;
    
    const updates = JSON.parse(localStorage.getItem('pickleball_updates') || '[]');
    if (updates.length <= 1) return;
    
    currentUpdateIndex = (currentUpdateIndex + 1) % updates.length;
    renderUpdateSlider(updates);
}

function toggleShowAll() {
    const updates = JSON.parse(localStorage.getItem('pickleball_updates') || '[]');
    isShowingAllUpdates = !isShowingAllUpdates;
    currentUpdateIndex = 0;
    
    // Update button text
    const showAllBtn = document.getElementById('showAllUpdates');
    if (showAllBtn) {
        showAllBtn.innerHTML = isShowingAllUpdates ? 
            '<i class="fas fa-times"></i> Show Single' : 
            '<i class="fas fa-list"></i> Show All';
    }
    
    renderUpdateSlider(updates);
}

function goToSlide(index) {
    if (isShowingAllUpdates) return;
    
    const updates = JSON.parse(localStorage.getItem('pickleball_updates') || '[]');
    if (index >= 0 && index < updates.length) {
        currentUpdateIndex = index;
        renderUpdateSlider(updates);
    }
}

// Kiểm tra session tự động
function checkSession() {
    const sessionUsername = localStorage.getItem('pickleball_session');
    if (sessionUsername && !currentUser) {
        console.log('Auto-reloading session...');
        loadSession();
        updateAuthUI();
    }
}

// Kiểm tra mỗi 2 giây
setInterval(checkSession, 2000);

// Gọi ngay khi load
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    
    // Auto check after 1 second
    setTimeout(checkSession, 1000);
});
// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function resetAuthForm() {
    document.getElementById('authUsername').value = '';
    document.getElementById('authEmail').value = '';
    document.getElementById('authPassword').value = '';
    document.getElementById('authError').textContent = '';
    
    // Remove error classes
    document.querySelectorAll('.auth-form input').forEach(input => {
        input.classList.remove('error');
    });
}

function toggleAuthMode() {
    const currentMode = document.getElementById('modalTitle').textContent.includes('Sign up') ? 'signup' : 'login';
    
    // Reset form trước khi chuyển mode
    resetAuthForm();
    
    // Hiển thị modal với mode mới
    showAuthModal(currentMode === 'login' ? 'signup' : 'login');
}

function toggleAuthMode() {
    const currentMode = document.getElementById('modalTitle').textContent.includes('Sign up') ? 'signup' : 'login';
    
    // Reset form trước khi chuyển mode
    resetAuthForm();
    
    // Hiển thị modal với mode mới
    showAuthModal(currentMode === 'login' ? 'signup' : 'login');
}
// Thêm vào cuối file main.js

// Hàm chặn scroll hoàn toàn
function preventDefaultScroll(e) {
    if (isFullscreen) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}

// Thêm event listeners để chặn scroll
document.addEventListener('wheel', preventDefaultScroll, { passive: false });
document.addEventListener('touchmove', preventDefaultScroll, { passive: false });
document.addEventListener('keydown', function(e) {
    // Chặn phím space, page up/down, arrow keys khi fullscreen
    if (isFullscreen && 
        (e.code === 'Space' || 
         e.code === 'PageUp' || 
         e.code === 'PageDown' ||
         e.code === 'ArrowUp' ||
         e.code === 'ArrowDown' ||
         e.code === 'Home' ||
         e.code === 'End')) {
        e.preventDefault();
    }
});

// Thêm vào hàm initializePage
function initializePage() {
    console.log('🔄 Initializing page...');
    
    // Tạo admin account nếu chưa có
    createAdminAccount();
    
    // Load session
    loadSession();
    
    // Update UI based on login status
    updateAuthUI();
    
    // Render comments ngay lập tức
    renderComments();
    
    // Render updates
    renderUpdates();
    
    // Setup event listeners
    setupSmoothScroll();
    setupFullscreenListener();
    
    // Thêm listener để khôi phục scroll khi load lại trang
    window.addEventListener('load', function() {
        if (!isFullscreen) {
            enableScroll();
        }
    });
    
    console.log('✅ Page initialized');
}
// Tìm đoạn code cũ và thay thế bằng đoạn này:

playBtn.addEventListener('click', () => {
    // 1. Ẩn thumbnail, hiện game
    thumbnailContainer.style.display = 'none';
    gameContainer.style.display = 'block';

    // 2. Yêu cầu Fullscreen trên CONTAINER CHA (quan trọng!)
    if (gameContainer.requestFullscreen) {
        gameContainer.requestFullscreen().catch(err => {
            console.log("Lỗi fullscreen: ", err);
            // Fallback nếu API bị chặn (đặc biệt trên iOS)
            enablePseudoFullscreen(); 
        });
    } else if (gameContainer.webkitRequestFullscreen) { // Safari/Chrome cũ
        gameContainer.webkitRequestFullscreen();
    } else {
        // Trường hợp trình duyệt không hỗ trợ API (ví dụ iPhone)
        enablePseudoFullscreen();
    }
});

// Hàm "Giả lập" Fullscreen cho mobile (CSS Only)
function enablePseudoFullscreen() {
    gameContainer.classList.add('pseudo-fullscreen');
    document.body.style.overflow = 'hidden'; // Khóa cuộn trang
}
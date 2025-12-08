// file.js - Complete with Admin Panel & Update Slider (FIXED VERSION - NO CONFLICT)

// ============ GLOBAL VARIABLES ============
let isFullscreen = false;
let comments = [];
let isSignupMode = false;

// ============ UPDATE SLIDER VARIABLES ============
let currentUpdateIndex = 0;
let allUpdates = [];
let isShowingAll = false;

// ============ AUTH FUNCTIONS ============
function showAuthModal(mode = 'login') {
    isSignupMode = (mode === 'signup');
    
    if (isSignupMode) {
        document.getElementById('modalTitle').textContent = 'Sign up';
        document.getElementById('authSubmitBtn').textContent = 'Sign up';
        document.getElementById('authSwitch').innerHTML = 
            'Already have an account? <a href="#" onclick="toggleAuthMode()">Log in</a>';
    } else {
        document.getElementById('modalTitle').textContent = 'Log in';
        document.getElementById('authSubmitBtn').textContent = 'Log in';
        document.getElementById('authSwitch').innerHTML = 
            'Don\'t have an account? <a href="#" onclick="toggleAuthMode()">Sign up</a>';
    }
    
    document.getElementById('authError').textContent = '';
    document.getElementById('authUsername').value = '';
    document.getElementById('authPassword').value = '';
    document.getElementById('authModal').style.display = 'flex';
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function toggleAuthMode() {
    showAuthModal(isSignupMode ? 'login' : 'signup');
}

function handleAuthSubmit() {
    const username = document.getElementById('authUsername').value.trim();
    const password = document.getElementById('authPassword').value;
    const errorElement = document.getElementById('authError');
    
    if (!username || !password) {
        errorElement.textContent = 'Please fill in all fields';
        return;
    }
    
    // Check if user is banned
    if (userSystem.isBanned(username)) {
        errorElement.textContent = 'This account has been banned!';
        return;
    }
    
    let result;
    if (isSignupMode) {
        result = userSystem.signUp(username, password);
    } else {
        result = userSystem.login(username, password);
    }
    
    if (result.success) {
        if (isSignupMode) {
            errorElement.style.color = '#2196F3';
            errorElement.textContent = result.message;
            
            setTimeout(() => {
                showAuthModal('login');
                document.getElementById('authUsername').value = username;
            }, 1500);
        } else {
            closeAuthModal();
            updateAuthUI();
            showCommentForm();
            
            // TỰ ĐỘNG HIỂN THỊ UPDATES SAU KHI ĐĂNG NHẬP
            showUpdatesSection();
            
            // Sử dụng showCustomAlert từ customModals.js
            if (typeof showCustomAlert === 'function') {
                showCustomAlert('Success', 'Logged in successfully!', 'success');
            }
        }
    } else {
        errorElement.style.color = '#ff4757';
        errorElement.textContent = result.message;
    }
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userSystem.isLoggedIn()) {
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';
        usernameDisplay.textContent = userSystem.getUsername();
        userAvatar.textContent = userSystem.getUserAvatar();
        
        // Add admin badge and avatar effect if admin
        if (userSystem.isAdmin()) {
            usernameDisplay.innerHTML = `${userSystem.getUsername()} <span class="admin-badge">(admin)</span>`;
            userAvatar.classList.add('admin-avatar');
        } else {
            userAvatar.classList.remove('admin-avatar');
        }
        
        // TỰ ĐỘNG HIỂN THỊ UPDATES KHI ĐĂNG NHẬP
        showUpdatesSection();
        
        // Show comment form
        showCommentForm();
    } else {
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
        hideCommentForm();
        
        // VẪN HIỂN THỊ UPDATES SECTION (chỉ là thông báo đăng nhập)
        showUpdatesSection();
    }
    
    // Show admin button if user is admin
    showAdminButton();
    
    // Render comments
    renderComments();
}

function logout() {
    // Sử dụng showCustomConfirm từ customModals.js
    if (typeof showCustomConfirm === 'function') {
        showCustomConfirm(
            'Logout',
            'Are you sure you want to logout?',
            () => {
                userSystem.logout();
                updateAuthUI();
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert('Success', 'Logged out successfully!', 'success');
                }
            }
        );
    }
}

// ============ LOCAL STORAGE FUNCTIONS ============
function saveCommentsToStorage() {
    try {
        localStorage.setItem('pickleball_comments', JSON.stringify(comments));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

function loadCommentsFromStorage() {
    try {
        const savedComments = localStorage.getItem('pickleball_comments');
        
        if (savedComments) {
            comments = JSON.parse(savedComments);
            comments.forEach(comment => {
                if (!comment.timestamp) comment.timestamp = comment.id || Date.now();
                if (!comment.votedUsers) comment.votedUsers = {};
                if (!comment.likes) comment.likes = 0;
                if (!comment.dislikes) comment.dislikes = 0;
                
                if (comment.replies) {
                    comment.replies.forEach(reply => {
                        if (!reply.timestamp) reply.timestamp = reply.id || Date.now();
                        if (!reply.votedUsers) reply.votedUsers = {};
                        if (!reply.likes) reply.likes = 0;
                        if (!reply.dislikes) reply.dislikes = 0;
                    });
                }
            });
        } else {
            comments = [];
        }
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        comments = [];
    }
}

// ============ COMMENT FUNCTIONS ============
function createCommentHTML(comment, isReply = false) {
    const timestamp = comment.timestamp || comment.id || Date.now();
    const isCurrentUser = userSystem.isLoggedIn() && 
                         comment.author === userSystem.getUsername();
    
    // Check if comment author is admin
    const commentAuthorUser = userSystem.users.find(u => u.username === comment.author);
    const isAdminUser = commentAuthorUser && commentAuthorUser.isAdmin === true;
    
    const currentUsername = userSystem.getUsername();
    const userVote = comment.votedUsers ? comment.votedUsers[currentUsername] : null;
    const isLiked = userVote === 'like';
    const isDisliked = userVote === 'dislike';
    
    return `
        <div class="comment-item ${isReply ? 'reply-item' : ''}" data-id="${comment.id}">
            <div class="comment-main">
                <div class="comment-votes">
                    <button class="vote-btn like-btn ${isLiked ? 'active' : ''}" 
                            onclick="handleVote(${comment.id}, 'like')">
                        <i class="fas fa-chevron-up"></i>
                        <span class="vote-count">${comment.likes || 0}</span>
                    </button>
                    <button class="vote-btn dislike-btn ${isDisliked ? 'active' : ''}" 
                            onclick="handleVote(${comment.id}, 'dislike')">
                        <i class="fas fa-chevron-down"></i>
                        <span class="vote-count">${comment.dislikes || 0}</span>
                    </button>
                </div>
                
                <div class="comment-content-wrapper">
                    <div class="comment-header">
                        <div class="comment-avatar ${isAdminUser ? 'admin-avatar' : ''}">
                            ${comment.author ? comment.author.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div class="comment-info">
                            <span class="comment-author">
                                ${comment.author || 'Anonymous'}
                                ${isAdminUser ? ' <span class="admin-badge">(admin)</span>' : ''}
                            </span>
                            <span class="comment-time" data-timestamp="${timestamp}">
                                ${formatTimeAgo(timestamp)}
                            </span>
                            ${isCurrentUser ? '<span class="comment-owner">(You)</span>' : ''}
                        </div>
                        ${isCurrentUser ? `
                            <button class="delete-btn" onclick="deleteComment(${comment.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                        ${userSystem.isAdmin() ? `
                            <button class="admin-delete-comment-btn" onclick="deleteCommentAsAdmin(${comment.id})">
                                <i class="fas fa-trash-alt"></i> Admin Delete
                            </button>
                        ` : ''}
                    </div>
                    
                    <div class="comment-content">${escapeHtml(comment.content)}</div>
                    
                    ${userSystem.isLoggedIn() ? `
                        <div class="comment-actions">
                            <button class="comment-action-btn reply-btn" onclick="toggleReplyForm(${comment.id})">
                                <i class="fas fa-reply"></i>
                                <span>Reply</span>
                            </button>
                        </div>
                        
                        <div class="reply-form hidden" id="replyForm-${comment.id}">
                            <textarea class="reply-input" placeholder="Write a reply..."></textarea>
                            <div class="reply-form-actions">
                                <button class="cancel-reply-btn" onclick="cancelReply(${comment.id})">Cancel</button>
                                <button class="submit-reply-btn" onclick="submitReply(${comment.id})">Reply</button>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${comment.replies && comment.replies.length > 0 ? `
                        <div class="replies-container">
                            ${comment.replies.map(reply => createCommentHTML(reply, true)).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// THÊM hàm escapeHtml ở đầu file.js (sau global variables)
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function handleVote(commentId, voteType) {
    if (!userSystem.isLoggedIn()) {
        showAuthModal('login');
        return;
    }
    
    const comment = findCommentById(comments, commentId);
    if (!comment) return;
    
    const currentUsername = userSystem.getUsername();
    
    if (!comment.votedUsers) comment.votedUsers = {};
    const currentVote = comment.votedUsers[currentUsername];
    
    if (currentVote === voteType) {
        delete comment.votedUsers[currentUsername];
        if (voteType === 'like') {
            comment.likes = Math.max(0, (comment.likes || 0) - 1);
        } else {
            comment.dislikes = Math.max(0, (comment.dislikes || 0) - 1);
        }
    } else if (currentVote && currentVote !== voteType) {
        if (currentVote === 'like') {
            comment.likes = Math.max(0, (comment.likes || 0) - 1);
        } else {
            comment.dislikes = Math.max(0, (comment.dislikes || 0) - 1);
        }
        
        comment.votedUsers[currentUsername] = voteType;
        if (voteType === 'like') {
            comment.likes = (comment.likes || 0) + 1;
        } else {
            comment.dislikes = (comment.dislikes || 0) + 1;
        }
    } else {
        comment.votedUsers[currentUsername] = voteType;
        if (voteType === 'like') {
            comment.likes = (comment.likes || 0) + 1;
        } else {
            comment.dislikes = (comment.dislikes || 0) + 1;
        }
    }
    
    renderComments();
    saveCommentsToStorage();
}

function findCommentById(commentList, id) {
    for (let comment of commentList) {
        if (comment.id === id) return comment;
        if (comment.replies && comment.replies.length > 0) {
            const found = findCommentById(comment.replies, id);
            if (found) return found;
        }
    }
    return null;
}

function deleteComment(commentId) {
    if (!userSystem.isLoggedIn()) {
        showAuthModal('login');
        return;
    }
    
    const comment = findCommentById(comments, commentId);
    if (!comment) return;
    
    const isOwner = comment.author === userSystem.getUsername();
    if (!isOwner && !userSystem.isAdmin()) {
        // Sử dụng showCustomAlert từ customModals.js
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('Error', 'You can only delete your own comments!', 'error');
        }
        return;
    }
    
    // Sử dụng showCustomConfirm từ customModals.js
    if (typeof showCustomConfirm === 'function') {
        showCustomConfirm(
            'Delete Comment',
            'Are you sure you want to delete this comment?',
            () => {
                comments = deleteCommentFromArray(comments, commentId);
                renderComments();
                saveCommentsToStorage();
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert('Success', 'Comment deleted!', 'success');
                }
            }
        );
    }
}

function deleteCommentAsAdmin(commentId) {
    if (!userSystem.isAdmin()) {
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('Error', 'Only admin can delete any comment!', 'error');
        }
        return;
    }
    
    // Sử dụng showCustomConfirm từ customModals.js
    if (typeof showCustomConfirm === 'function') {
        showCustomConfirm(
            'Delete Comment as Admin',
            'Are you sure you want to delete this comment as admin?',
            () => {
                comments = deleteCommentFromArray(comments, commentId);
                renderComments();
                saveCommentsToStorage();
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert('Success', 'Comment deleted by admin!', 'success');
                }
                
                // Reload admin comments list if panel is open
                if (document.getElementById('adminModal').style.display === 'flex') {
                    loadAdminCommentsList();
                    updateAdminStats();
                }
            }
        );
    }
}

function deleteCommentFromArray(commentList, id) {
    return commentList.filter(comment => {
        if (comment.id === id) return false;
        if (comment.replies && comment.replies.length > 0) {
            comment.replies = deleteCommentFromArray(comment.replies, id);
        }
        return true;
    });
}

function getUserComments(username) {
    let count = 0;
    
    function countComments(commentList) {
        commentList.forEach(comment => {
            if (comment.author === username) {
                count++;
            }
            if (comment.replies && comment.replies.length > 0) {
                countComments(comment.replies);
            }
        });
    }
    
    countComments(comments);
    return count;
}

function renderComments() {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    
    commentsList.innerHTML = comments.map(comment => createCommentHTML(comment)).join('');
    
    const totalComments = comments.reduce((total, comment) => 
        total + 1 + (comment.replies ? comment.replies.length : 0), 0);
    
    const commentsCount = document.getElementById('commentsCount');
    if (commentsCount) commentsCount.textContent = `(${totalComments})`;
    
    // Update admin stats if admin panel is open
    if (userSystem.isAdmin() && document.getElementById('adminModal').style.display === 'flex') {
        updateAdminStats();
    }
}

function showCommentForm() {
    if (userSystem.isLoggedIn()) {
        document.getElementById('loginToComment').style.display = 'none';
        document.getElementById('commentInputSection').style.display = 'block';
    }
}

function hideCommentForm() {
    document.getElementById('loginToComment').style.display = 'block';
    document.getElementById('commentInputSection').style.display = 'none';
}

function clearCommentInput() {
    document.getElementById('commentInput').value = '';
}

function submitComment() {
    const input = document.getElementById('commentInput');
    const content = input.value.trim();
    
    if (!content) {
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('Error', 'Please enter a comment', 'error');
        }
        return;
    }
    
    if (!userSystem.isLoggedIn()) {
        showAuthModal('login');
        return;
    }
    
    const timestamp = Date.now();
    const newComment = {
        id: timestamp,
        author: userSystem.getUsername(),
        timestamp: timestamp,
        content: content,
        likes: 0,
        dislikes: 0,
        votedUsers: {},
        replies: []
    };
    
    comments.push(newComment);
    renderComments();
    saveCommentsToStorage();
    input.value = '';
    if (typeof showCustomAlert === 'function') {
        showCustomAlert('Success', 'Comment added!', 'success');
    }
}

function toggleReplyForm(commentId) {
    const replyForm = document.getElementById(`replyForm-${commentId}`);
    if (replyForm) {
        replyForm.classList.toggle('hidden');
        if (!replyForm.classList.contains('hidden')) {
            replyForm.querySelector('.reply-input').focus();
        }
    }
}

function cancelReply(commentId) {
    const replyForm = document.getElementById(`replyForm-${commentId}`);
    if (replyForm) {
        replyForm.classList.add('hidden');
        replyForm.querySelector('.reply-input').value = '';
    }
}

function submitReply(commentId) {
    const replyForm = document.getElementById(`replyForm-${commentId}`);
    if (replyForm) {
        const textarea = replyForm.querySelector('.reply-input');
        const content = textarea.value.trim();
        if (content) {
            if (!userSystem.isLoggedIn()) {
                showAuthModal('login');
                return;
            }
            
            const timestamp = Date.now();
            const newReply = {
                id: timestamp,
                author: userSystem.getUsername(),
                timestamp: timestamp,
                content: content,
                likes: 0,
                dislikes: 0,
                votedUsers: {},
                replies: []
            };
            
            const parentComment = findCommentById(comments, commentId);
            if (parentComment) {
                if (!parentComment.replies) parentComment.replies = [];
                parentComment.replies.push(newReply);
                renderComments();
                saveCommentsToStorage();
                textarea.value = '';
                replyForm.classList.add('hidden');
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert('Success', 'Reply added!', 'success');
                }
            }
        }
    }
}

// ============ UPDATE SLIDER FUNCTIONS ============
function initializeUpdateSlider() {
    allUpdates = userSystem.getVisibleUpdates();
    
    if (!allUpdates || allUpdates.length === 0) {
        return;
    }
    
    // Sắp xếp theo thời gian gần nhất
    allUpdates.sort((a, b) => b.createdAt - a.createdAt);
    
    // Reset index
    currentUpdateIndex = 0;
    isShowingAll = false;
    
    // Hiển thị slider
    renderUpdateSlider();
    updateSliderControls();
}

function renderUpdateSlider() {
    const slidesContainer = document.getElementById('updateSlides');
    if (!slidesContainer) return;
    
    if (isShowingAll) {
        // Hiển thị tất cả
        slidesContainer.innerHTML = allUpdates.map((update, index) => `
            <div class="update-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                <h3><i class="fas fa-newspaper"></i> ${update.title}</h3>
                <div class="update-content">${update.content}</div>
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
    } else {
        // Hiển thị chỉ 1 slide
        const update = allUpdates[currentUpdateIndex];
        slidesContainer.innerHTML = `
            <div class="update-slide active" data-index="${currentUpdateIndex}">
                <h3><i class="fas fa-newspaper"></i> ${update.title}</h3>
                <div class="update-content">${update.content}</div>
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
    }
    
    updateSliderCounter();
}

function updateSliderControls() {
    const prevBtn = document.getElementById('prevUpdate');
    const nextBtn = document.getElementById('nextUpdate');
    const showAllBtn = document.getElementById('showAllUpdates');
    
    if (!prevBtn || !nextBtn || !showAllBtn) return;
    
    prevBtn.disabled = (allUpdates.length <= 1) || isShowingAll;
    prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
    
    nextBtn.disabled = (allUpdates.length <= 1) || isShowingAll;
    nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
    
    showAllBtn.innerHTML = isShowingAll ? 
        '<i class="fas fa-times"></i> Show Single' : 
        '<i class="fas fa-list"></i> Show All';
    
    const sliderNav = document.querySelector('.slider-navigation');
    if (sliderNav) {
        sliderNav.style.display = isShowingAll ? 'none' : 'flex';
    }
}

function updateSliderCounter() {
    const counter = document.getElementById('updateCounter');
    if (!counter) return;
    
    if (isShowingAll) {
        counter.textContent = `Showing all (${allUpdates.length})`;
    } else {
        counter.textContent = `${currentUpdateIndex + 1} / ${allUpdates.length}`;
    }
}

function nextUpdate() {
    if (allUpdates.length <= 1 || isShowingAll) return;
    
    currentUpdateIndex = (currentUpdateIndex + 1) % allUpdates.length;
    renderUpdateSlider();
    updateSliderControls();
}

function prevUpdate() {
    if (allUpdates.length <= 1 || isShowingAll) return;
    
    currentUpdateIndex = (currentUpdateIndex - 1 + allUpdates.length) % allUpdates.length;
    renderUpdateSlider();
    updateSliderControls();
}

function toggleShowAll() {
    isShowingAll = !isShowingAll;
    
    if (isShowingAll) {
        currentUpdateIndex = 0;
    }
    
    renderUpdateSlider();
    updateSliderControls();
}

function filterUpdatesSlider() {
    const searchTerm = document.getElementById('searchUpdates')?.value.toLowerCase() || '';
    const filterValue = document.getElementById('filterUpdates')?.value || 'recent';
    
    let filtered = userSystem.getVisibleUpdates();
    
    if (searchTerm) {
        filtered = filtered.filter(update => 
            update.title.toLowerCase().includes(searchTerm) || 
            update.content.toLowerCase().includes(searchTerm) ||
            update.author.toLowerCase().includes(searchTerm)
        );
    }
    
    if (filterValue === 'recent') {
        filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else if (filterValue === 'oldest') {
        filtered.sort((a, b) => a.createdAt - b.createdAt);
    }
    
    allUpdates = filtered;
    currentUpdateIndex = 0;
    
    const updatesSlider = document.getElementById('updatesSlider');
    const noUpdates = document.getElementById('noUpdates');
    
    if (filtered.length === 0) {
        if (updatesSlider) updatesSlider.style.display = 'none';
        if (noUpdates) {
            noUpdates.style.display = 'block';
            noUpdates.innerHTML = `
                <div class="no-updates-content">
                    <i class="fas fa-search"></i>
                    <h3>No updates found</h3>
                    <p>Try searching with different keywords</p>
                </div>
            `;
        }
    } else {
        if (updatesSlider) updatesSlider.style.display = 'block';
        if (noUpdates) noUpdates.style.display = 'none';
        renderUpdateSlider();
        updateSliderControls();
    }
}

// ============ UPDATES FUNCTIONS ============
function showUpdatesSection() {
    const updatesSection = document.getElementById('updatesSection');
    const loginPrompt = document.getElementById('loginToViewUpdates');
    const updatesSlider = document.getElementById('updatesSlider');
    const noUpdates = document.getElementById('noUpdates');
    
    if (!updatesSection) return;
    
    // Luôn hiển thị section updates
    updatesSection.style.display = 'block';
    
    if (!userSystem.isLoggedIn()) {
        // Chưa đăng nhập - hiển thị thông báo đăng nhập
        if (loginPrompt) loginPrompt.style.display = 'block';
        if (updatesSlider) updatesSlider.style.display = 'none';
        if (noUpdates) noUpdates.style.display = 'none';
        return;
    }
    
    // Đã đăng nhập - ẩn thông báo đăng nhập
    if (loginPrompt) loginPrompt.style.display = 'none';
    
    // Tải và hiển thị updates
    allUpdates = userSystem.getVisibleUpdates();
    
    if (!allUpdates || allUpdates.length === 0) {
        // Không có updates nào
        if (updatesSlider) updatesSlider.style.display = 'none';
        if (noUpdates) noUpdates.style.display = 'block';
        const updatesCount = document.getElementById('updatesCount');
        if (updatesCount) updatesCount.textContent = '(0)';
    } else {
        // Có updates - hiển thị slider
        if (updatesSlider) updatesSlider.style.display = 'block';
        if (noUpdates) noUpdates.style.display = 'none';
        
        // Reset và hiển thị update gần nhất
        currentUpdateIndex = 0;
        isShowingAll = false;
        
        // Sắp xếp theo thời gian gần nhất
        allUpdates.sort((a, b) => b.createdAt - a.createdAt);
        
        renderUpdateSlider();
        updateSliderControls();
        
        // Update count
        const updatesCount = document.getElementById('updatesCount');
        if (updatesCount) updatesCount.textContent = `(${allUpdates.length})`;
    }
}

function hideUpdatesSection() {
    const updatesSection = document.getElementById('updatesSection');
    if (updatesSection) {
        updatesSection.style.display = 'none';
    }
}

function filterUpdates() {
    filterUpdatesSlider();
}

// ============ ADMIN PANEL FUNCTIONS ============
function showAdminButton() {
    const adminPanel = document.getElementById('adminPanel');
    if (userSystem.isAdmin()) {
        adminPanel.style.display = 'block';
    } else {
        adminPanel.style.display = 'none';
    }
}

function toggleAdminPanel() {
    const adminModal = document.getElementById('adminModal');
    if (adminModal.style.display === 'flex') {
        closeAdminModal();
    } else {
        openAdminModal();
    }
}

function openAdminModal() {
    const adminModal = document.getElementById('adminModal');
    adminModal.style.display = 'flex';
    loadAdminPanelData();
}

function closeAdminModal() {
    const adminModal = document.getElementById('adminModal');
    adminModal.style.display = 'none';
}

function openAdminTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.style.opacity = '0';
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    setTimeout(() => {
        document.getElementById(tabName + 'Tab').style.opacity = '1';
    }, 50);
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Update stats each time tab is switched
    updateAdminStats();
}

function loadAdminPanelData() {
    loadUsersList();
    loadAdminCommentsList();
    loadAdminUpdatesList();
    updateAdminStats();
}

// ============ ADMIN STATS FUNCTIONS ============
function updateAdminStats() {
    if (!userSystem.isAdmin()) return;
    
    const allUsers = userSystem.getAllUsers();
    const bannedUsers = userSystem.bannedUsers;
    const totalComments = comments.reduce((total, comment) => 
        total + 1 + (comment.replies ? comment.replies.length : 0), 0);
    
    // Update stat cards if they exist
    const totalUsersEl = document.getElementById('totalUsers');
    const totalCommentsEl = document.getElementById('totalComments');
    const bannedUsersEl = document.getElementById('bannedUsers');
    const totalUpdatesEl = document.getElementById('totalUpdates');
    
    if (totalUsersEl) totalUsersEl.textContent = allUsers.length;
    if (totalCommentsEl) totalCommentsEl.textContent = totalComments;
    if (bannedUsersEl) bannedUsersEl.textContent = bannedUsers.length;
    if (totalUpdatesEl) totalUpdatesEl.textContent = userSystem.updates.length;
}

// USERS MANAGEMENT
function loadUsersList() {
    if (!userSystem.isAdmin()) return;
    
    const usersList = document.getElementById('usersList');
    const allUsers = userSystem.getAllUsers();
    
    usersList.innerHTML = allUsers.map((user, index) => {
        const isBanned = userSystem.isBanned(user.username);
        const commentCount = getUserComments(user.username);
        const isAdminUser = user.isAdmin === true;
        
        return `
            <div class="user-item ${isBanned ? 'banned' : ''}" style="animation-delay: ${index * 0.1}s">
                <div class="user-info">
                    <strong>${user.username} ${isAdminUser ? '👑' : ''}</strong>
                    <div class="user-details">
                        <small><i class="far fa-calendar"></i> ${new Date(user.createdAt).toLocaleDateString()}</small>
                        <small><i class="far fa-comment"></i> ${commentCount} comments</small>
                        ${isBanned ? 
                            '<small style="color:#ff4757"><i class="fas fa-ban"></i> BANNED</small>' : 
                            '<small><i class="far fa-check-circle"></i> Active</small>'
                        }
                    </div>
                </div>
                <div class="user-actions">
                    ${isBanned ? 
                        `<button class="unban-btn" onclick="confirmUnbanUser('${user.username}')">
                            <i class="fas fa-unlock"></i> Unban
                        </button>` : 
                        `<button class="ban-btn" onclick="confirmBanUser('${user.username}')">
                            <i class="fas fa-ban"></i> Ban
                        </button>`
                    }
                    <button class="delete-user-btn" onclick="confirmDeleteUser('${user.username}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// COMMENTS MANAGEMENT

function searchComments() {
    const searchTerm = document.getElementById('searchComment').value.toLowerCase().trim();
    const commentItems = document.querySelectorAll('.admin-comment-item');
    
    commentItems.forEach(item => {
        const content = item.querySelector('.comment-content')?.textContent.toLowerCase() || '';
        const author = item.querySelector('.comment-author')?.textContent.toLowerCase() || '';
        
        if (content.includes(searchTerm) || author.includes(searchTerm)) {
            item.style.display = 'block';
            item.style.animation = 'fadeIn 0.3s ease';
        } else {
            item.style.display = 'none';
        }
    });
}

// TÌM hàm này trong file.js (khoảng dòng 720)
function loadAdminUpdatesList() {
  if (!userSystem.isAdmin()) return;
  
  const updatesList = document.getElementById('updatesList');
  const updates = userSystem.updates;
  
  updatesList.innerHTML = updates.map(update => {
    return `
      <div class="update-item">
        <h4>${update.title}</h4>
        <p>${update.content}</p>
        <div class="update-meta">
          <small><i class="fas fa-user"></i> By: ${update.author}</small>
          <small><i class="far fa-calendar"></i> Date: ${new Date(update.createdAt).toLocaleDateString()}</small>
        </div>
        <div class="update-actions">
          <!-- ĐÃ SỬA: gọi trực tiếp hàm từ customModals.js -->
          <button class="edit-update-btn" onclick="showEditUpdateForm(${update.id})">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="delete-update-btn" onclick="confirmDeleteUpdate(${update.id})">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Thay đổi tên hàm này để tránh xung đột
function showAddUpdateForm() {
    // Sử dụng showUpdateForm từ customModals.js
    if (typeof showUpdateForm === 'function') {
        showUpdateForm();
    } else {
        console.error('showUpdateForm function not found!');
        showCustomAlert('Error', 'System error: Update form not available', 'error');
    }
}

function searchUsers() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase().trim();
    const userItems = document.querySelectorAll('.user-item');
    
    userItems.forEach(item => {
        const username = item.querySelector('strong').textContent.toLowerCase();
        const userDetails = item.querySelector('.user-details').textContent.toLowerCase();
        
        if (username.includes(searchTerm) || userDetails.includes(searchTerm)) {
            item.style.display = 'flex';
            item.style.animation = 'fadeIn 0.3s ease';
        } else {
            item.style.display = 'none';
        }
    });
}

// ============ FULLSCREEN FUNCTIONS ============
function toggleFullscreen() {
    const gamePlayer = document.getElementById('gamePlayer');
    let fullscreenBtn = document.querySelector('.fullscreen-btn');
    
    if (!document.fullscreenElement) {
        if (gamePlayer.requestFullscreen) {
            gamePlayer.requestFullscreen();
        } else if (gamePlayer.mozRequestFullScreen) {
            gamePlayer.mozRequestFullScreen();
        } else if (gamePlayer.webkitRequestFullscreen) {
            gamePlayer.webkitRequestFullscreen();
        } else if (gamePlayer.msRequestFullscreen) {
            gamePlayer.msRequestFullscreen();
        }
        
        gamePlayer.classList.add('fullscreen');
        if (fullscreenBtn) fullscreenBtn.innerHTML = '🗕';
        isFullscreen = true;
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
        if (fullscreenBtn) fullscreenBtn.innerHTML = '⛶';
        isFullscreen = false;
    }
}

function updateFullscreenState() {
    const gamePlayer = document.getElementById('gamePlayer');
    const fullscreenBtn = document.querySelector('.fullscreen-btn');
    
    if (!document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.mozFullScreenElement &&
        !document.msFullscreenElement) {
        gamePlayer.classList.remove('fullscreen');
        isFullscreen = false;
        if (fullscreenBtn) fullscreenBtn.innerHTML = '⛶';
    } else {
        gamePlayer.classList.add('fullscreen');
        isFullscreen = true;
        if (fullscreenBtn) fullscreenBtn.innerHTML = '🗕';
    }
}

// ============ GAME FUNCTIONS ============
function startGame() {
    const gamePlayer = document.getElementById('gamePlayer');
    const placeholder = document.getElementById('gamePlaceholder');
    
    placeholder.innerHTML = '';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'placeholder-content';
    contentDiv.innerHTML = `
        <h2 style="color: white; margin-bottom: 20px;">🎮 Game đang khởi động...</h2>
        <p style="color: #aaa; margin-bottom: 30px;">Click nút phóng to để chơi toàn màn hình</p>
        <div class="game-buttons">
            <button class="run-game-btn" onclick="startGame()">
                🔄 Chơi lại
            </button>
        </div>
    `;
    
    placeholder.appendChild(contentDiv);
    
    const oldFullscreenBtn = document.querySelector('.fullscreen-btn');
    if (oldFullscreenBtn) oldFullscreenBtn.remove();
    
    const oldExitBtn = document.querySelector('.exit-game-btn');
    if (oldExitBtn) oldExitBtn.remove();
    
    const exitBtn = document.createElement('button');
    exitBtn.className = 'exit-game-btn';
    exitBtn.id = 'exitGameButton';
    exitBtn.innerHTML = '✕';
    exitBtn.title = 'Thoát Game';
    exitBtn.onclick = exitGame;
    
    const newFullscreenBtn = document.createElement('button');
    newFullscreenBtn.className = 'fullscreen-btn';
    newFullscreenBtn.id = 'fullscreenButton';
    newFullscreenBtn.innerHTML = isFullscreen ? '🗕' : '⛶';
    newFullscreenBtn.onclick = toggleFullscreen;
    
    gamePlayer.appendChild(exitBtn);
    gamePlayer.appendChild(newFullscreenBtn);
    
    if (isFullscreen) {
        gamePlayer.classList.add('fullscreen');
    } else {
        gamePlayer.classList.remove('fullscreen');
    }
}

function exitGame() {
    const gamePlayer = document.getElementById('gamePlayer');
    const placeholder = document.getElementById('gamePlaceholder');
    
    placeholder.innerHTML = '';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'placeholder-content';
    contentDiv.innerHTML = `
        <button class="run-game-btn" onclick="startGame()">
            ▶ RUN GAME
        </button>
        <p>Click RUN GAME to start playing</p>
    `;
    
    placeholder.appendChild(contentDiv);
    
    const oldFullscreenBtn = document.querySelector('.fullscreen-btn');
    if (oldFullscreenBtn) oldFullscreenBtn.remove();
    
    const oldExitBtn = document.querySelector('.exit-game-btn');
    if (oldExitBtn) oldExitBtn.remove();
    
    const newFullscreenBtn = document.createElement('button');
    newFullscreenBtn.className = 'fullscreen-btn';
    newFullscreenBtn.id = 'fullscreenButton';
    newFullscreenBtn.innerHTML = '⛶';
    newFullscreenBtn.onclick = toggleFullscreen;
    
    gamePlayer.appendChild(newFullscreenBtn);
    
    if (document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        isFullscreen = false;
        gamePlayer.classList.remove('fullscreen');
    }
}

// ============ SMOOTH SCROLL ============
function setupSmoothScroll() {
    const menuLinks = document.querySelectorAll('.title ul li a');
    
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    // Kiểm tra nếu là link Update
                    if (targetId === '#updatesSection') {
                        handleUpdateLinkClick();
                    }
                    
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// ============ HANDLE UPDATE LINK CLICK ============
function handleUpdateLinkClick() {
    // Kiểm tra nếu chưa đăng nhập
    if (!userSystem.isLoggedIn()) {
        // Hiển thị updates section với login prompt
        showUpdatesSection();
        
        // Thêm hiệu ứng focus vào phần login prompt
        setTimeout(() => {
            const updatesSection = document.getElementById('updatesSection');
            if (updatesSection) {
                updatesSection.style.animation = 'pulse 0.5s ease';
                updatesSection.style.boxShadow = '0 0 0 3px rgba(255, 152, 0, 0.3)';
                
                setTimeout(() => {
                    updatesSection.style.animation = '';
                    updatesSection.style.boxShadow = '';
                }, 1500);
            }
        }, 500);
        
        return;
    }
    
    // Nếu đã đăng nhập, đảm bảo updates section được hiển thị
    showUpdatesSection();
    
    // Thêm hiệu ứng để user biết đã scroll đến phần updates
    setTimeout(() => {
        const updatesSection = document.getElementById('updatesSection');
        if (updatesSection) {
            updatesSection.style.animation = 'highlight 1s ease';
            
            setTimeout(() => {
                updatesSection.style.animation = '';
            }, 1000);
        }
    }, 500);
}

// ============ TIME FORMATTING ============
function formatTimeAgo(timestamp) {
    if (!timestamp || isNaN(timestamp)) return "Just now";
    
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
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: days > 365 ? 'numeric' : undefined
    });
}

function updateAllCommentTimes() {
    document.querySelectorAll('.comment-time').forEach(element => {
        const timestamp = parseInt(element.dataset.timestamp);
        if (timestamp && !isNaN(timestamp)) {
            const newTime = formatTimeAgo(timestamp);
            if (element.textContent !== newTime) {
                element.textContent = newTime;
            }
        }
    });
}

// ============ NOTIFICATION ============
function showNotification(message, type = 'info') {
    // Sử dụng showCustomAlert từ customModals.js
    if (typeof showCustomAlert === 'function') {
        showCustomAlert(
            type === 'success' ? 'Success' : 
            type === 'error' ? 'Error' : 'Info',
            message,
            type
        );
    }
}

// ============ INITIALIZATION ============
function initializePage() {
    loadCommentsFromStorage();
    updateAuthUI();
    
    // LUÔN HIỂN THỊ UPDATES SECTION (kể cả khi chưa đăng nhập)
    showUpdatesSection();
    
    // ... phần còn lại giữ nguyên ...

    
    const fullscreenBtn = document.querySelector('.fullscreen-btn');
    if (document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement) {
        isFullscreen = true;
        document.getElementById('gamePlayer').classList.add('fullscreen');
        if (fullscreenBtn) fullscreenBtn.innerHTML = '🗕';
    } else {
        isFullscreen = false;
        document.getElementById('gamePlayer').classList.remove('fullscreen');
        if (fullscreenBtn) fullscreenBtn.innerHTML = '⛶';
    }
    
    setupSmoothScroll();
    renderComments();
    
    setInterval(saveCommentsToStorage, 30000);
    setInterval(updateAllCommentTimes, 30000);
    
    // Close modals when clicking outside
    document.addEventListener('click', function(event) {
        const authModal = document.getElementById('authModal');
        if (event.target === authModal) {
            closeAuthModal();
        }
        
        const adminModal = document.getElementById('adminModal');
        if (event.target === adminModal) {
            closeAdminModal();
        }
    });
    
    // Enter key support for auth modal
    document.addEventListener('keydown', function(e) {
        const modal = document.getElementById('authModal');
        if (modal.style.display === 'flex' && e.key === 'Enter') {
            handleAuthSubmit();
        }
    });
}

// ============ EVENT LISTENERS ============
document.addEventListener('fullscreenchange', updateFullscreenState);
document.addEventListener('webkitfullscreenchange', updateFullscreenState);
document.addEventListener('mozfullscreenchange', updateFullscreenState);
document.addEventListener('MSFullscreenChange', updateFullscreenState);

window.addEventListener('beforeunload', saveCommentsToStorage);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializePage);
// Thêm vào file.js
function exportAllData() {
    if (!userSystem.isAdmin()) {
        showCustomAlert('Error', 'Admin only!', 'error');
        return;
    }
    
    const data = {
        users: userSystem.users,
        updates: userSystem.updates,
        bannedUsers: userSystem.bannedUsers,
        comments: comments,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pickleball_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showCustomAlert('Success', 'Data exported successfully!', 'success');
}

function importData(event) {
    if (!userSystem.isAdmin()) {
        showCustomAlert('Error', 'Admin only!', 'error');
        return;
    }
    
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            showCustomConfirm(
                'Import Data',
                'This will replace ALL current data. Are you sure?',
                () => {
                    if (data.users) userSystem.users = data.users;
                    if (data.updates) userSystem.updates = data.updates;
                    if (data.bannedUsers) userSystem.bannedUsers = data.bannedUsers;
                    if (data.comments) comments = data.comments;
                    
                    userSystem.saveToStorage();
                    saveCommentsToStorage();
                    
                    // Reload everything
                    updateAuthUI();
                    initializeUpdateSlider();
                    renderComments();
                    loadAdminPanelData();
                    
                    showCustomAlert('Success', 'Data imported successfully!', 'success');
                }
            );
        } catch (error) {
            showCustomAlert('Error', 'Invalid backup file!', 'error');
        }
    };
    reader.readAsText(file);
}
// Thêm vào file.js
let currentCommentPage = 1;
const commentsPerPage = 10;

function renderCommentsWithPagination() {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    
    // Calculate pagination
    const startIndex = (currentCommentPage - 1) * commentsPerPage;
    const endIndex = startIndex + commentsPerPage;
    const paginatedComments = comments.slice(startIndex, endIndex);
    
    // Render comments
    commentsList.innerHTML = paginatedComments.map(comment => createCommentHTML(comment)).join('');
    
    // Render pagination controls
    const totalPages = Math.ceil(comments.length / commentsPerPage);
    renderCommentPagination(totalPages);
}

function renderCommentPagination(totalPages) {
    const paginationContainer = document.getElementById('commentsPagination') || 
        (function() {
            const div = document.createElement('div');
            div.id = 'commentsPagination';
            div.className = 'comments-pagination';
            document.getElementById('commentsList').after(div);
            return div;
        })();
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let html = `
        <button class="pagination-btn ${currentCommentPage === 1 ? 'disabled' : ''}" 
                onclick="changeCommentPage(${currentCommentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentCommentPage - 1 && i <= currentCommentPage + 1)) {
            html += `
                <button class="pagination-btn ${i === currentCommentPage ? 'active' : ''}" 
                        onclick="changeCommentPage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentCommentPage - 2 || i === currentCommentPage + 2) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    html += `
        <button class="pagination-btn ${currentCommentPage === totalPages ? 'disabled' : ''}" 
                onclick="changeCommentPage(${currentCommentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationContainer.innerHTML = html;
}

function changeCommentPage(page) {
    if (page < 1 || page > Math.ceil(comments.length / commentsPerPage)) return;
    currentCommentPage = page;
    renderCommentsWithPagination();
    window.scrollTo({
        top: document.getElementById('commentsList').offsetTop - 100,
        behavior: 'smooth'
    });
}
// Thêm vào file.js
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.isEnabled = true;
        this.loadNotifications();
    }
    
    loadNotifications() {
        const saved = localStorage.getItem('pickleball_notifications');
        if (saved) this.notifications = JSON.parse(saved);
    }
    
    saveNotifications() {
        localStorage.setItem('pickleball_notifications', JSON.stringify(this.notifications));
    }
    
    addNotification(type, message, data = null) {
        const notification = {
            id: Date.now(),
            type: type, // 'new_comment', 'new_update', 'user_mentioned'
            message: message,
            data: data,
            timestamp: Date.now(),
            read: false
        };
        
        this.notifications.unshift(notification);
        this.saveNotifications();
        
        // Hiển thị toast notification
        if (this.isEnabled && document.hasFocus()) {
            this.showToast(notification);
        }
        
        // Update notification badge
        this.updateBadge();
    }
    
    showToast(notification) {
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-bell"></i>
                <span>${notification.message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
    
    updateBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notificationBadge') || this.createBadge();
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
    
    createBadge() {
        const badge = document.createElement('div');
        badge.id = 'notificationBadge';
        badge.className = 'notification-badge';
        document.querySelector('.user-profile').appendChild(badge);
        return badge;
    }
}

// Khởi tạo notification manager
window.notificationManager = new NotificationManager();
// Thêm vào file.js
function optimizeSliderPerformance() {
    // Debounce search function
    let searchTimeout;
    const searchUpdates = document.getElementById('searchUpdates');
    if (searchUpdates) {
        searchUpdates.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterUpdatesSlider();
            }, 300);
        });
    }
    
    // Lazy load update content
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const slide = entry.target;
                slide.style.opacity = '1';
                slide.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    // Apply to existing slides
    document.querySelectorAll('.update-slide').forEach(slide => {
        slide.style.opacity = '0';
        slide.style.transform = 'translateY(20px)';
        slide.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        observer.observe(slide);
    });
}
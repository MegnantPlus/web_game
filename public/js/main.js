// main.js - Main Application File (UPDATED FOR API INTEGRATION)
// ============ GLOBAL STATE ============
let currentUser = null;
let isFullscreen = false;
let isShowingAllUpdates = false;
let currentUpdateIndex = 0;
let currentPreviewIndex = 0;
let scrollPosition = 0;

// ============ INITIALIZATION ============
async function initializePage() {
    console.log('🔄 Initializing page...');
    
    // Đợi userSystem khởi tạo xong
    if (window.userSystem) {
        // Kiểm tra nếu có token nhưng chưa load user
        if (window.userSystem.token && !window.userSystem.currentUser) {
            try {
                await window.userSystem.loadUserFromToken();
            } catch (error) {
                console.log('Failed to load user from token, clearing session');
                window.userSystem.clearToken();
            }
        }
        
        // Lấy user từ userSystem
        currentUser = window.userSystem.getUser();
        console.log('✅ User loaded:', currentUser?.username || 'No user');
    }
    
    // Update UI
    updateAuthUI();
    
    // Load data từ API
    await loadComments();
    await loadUpdates();
    
    // Setup event listeners
    setupSmoothScroll();
    setupFullscreenListener();
    setupOrientationListener();
    
    console.log('✅ Page initialized');
}

// ============ SESSION MANAGEMENT ============
function saveSession() {
    if (currentUser) {
        localStorage.setItem('pickleball_session', currentUser.username);
    }
}

// ============ AUTH MODAL FUNCTIONS (GIỮ NGUYÊN) ============
function showAuthModal(mode = 'login') {
    const modal = document.getElementById('authModal');
    const title = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const switchText = document.getElementById('authSwitch');
    
    document.getElementById('authError').textContent = '';
    document.getElementById('authEmail').value = '';
    document.getElementById('authPassword').value = '';
    if (mode === 'signup') {
        document.getElementById('authUsername').value = '';
    }
    
    // Hiển thị/ẩn trường username
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
    document.getElementById('authError').textContent = '';
    document.querySelectorAll('.auth-form input').forEach(input => {
        input.classList.remove('error');
    });
}

function toggleAuthMode() {
    const currentMode = document.getElementById('modalTitle').textContent.includes('Sign up') ? 'signup' : 'login';
    showAuthModal(currentMode === 'login' ? 'signup' : 'login');
}

// ============ LOADING FUNCTIONS ============
function showLoading(message = 'Loading...') {
    let overlay = document.getElementById('globalLoading');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'globalLoading';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div style="text-align: center; color: white;">
                <div class="loading-spinner"></div>
                <div style="margin-top: 20px;">${message}</div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
}

function hideLoading() {
    const overlay = document.getElementById('globalLoading');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            if (overlay.parentElement) {
                overlay.remove();
            }
        }, 300);
    }
}   

// ============ AUTHENTICATION (UPDATED FOR API) ============
async function handleAuthSubmit() {
    const isSignupMode = document.getElementById('modalTitle').textContent.includes('Sign up');
    const errorElement = document.getElementById('authError');
    errorElement.textContent = '';
    errorElement.classList.remove('show');
    
    // Show loading
    errorElement.textContent = 'Processing...';
    errorElement.style.color = '#2196F3';
    
    try {
        if (isSignupMode) {
            // SIGN UP
            const username = document.getElementById('authUsername').value.trim();
            const email = document.getElementById('authEmail').value.trim();
            const password = document.getElementById('authPassword').value;
            
            if (!username || !email || !password) {
                errorElement.textContent = 'Please fill in all fields';
                errorElement.classList.add('show');
                return;
            }
            
            const result = await window.userSystem.register(username, email, password);
            
            if (result.success) {
                currentUser = result.user;
                closeAuthModal();
                updateAuthUI();
                await loadComments();
                await loadUpdates();
                showNotification('Account created successfully!', 'success');
            } else {
                errorElement.textContent = result.error || 'Registration failed';
                errorElement.classList.add('show');
            }
        } else {
            // LOGIN
            const email = document.getElementById('authEmail').value.trim();
            const password = document.getElementById('authPassword').value;
            
            if (!email || !password) {
                errorElement.textContent = 'Please fill in all fields';
                errorElement.classList.add('show');
                return;
            }
            
            const result = await window.userSystem.login(email, password);
            
            if (result.success) {
                currentUser = result.user;
                closeAuthModal();
                updateAuthUI();
                await loadComments();
                await loadUpdates();
                showNotification('Logged in successfully!', 'success');
            } else {
                errorElement.textContent = result.error || 'Login failed';
                errorElement.classList.add('show');
            }
        }
    } catch (error) {
        errorElement.textContent = 'An error occurred. Please try again.';
        errorElement.classList.add('show');
        console.error('Auth error:', error);
    }
}

// ============ UPDATE AUTH UI FUNCTION ============
function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userAvatar = document.getElementById('userAvatar');
    const adminPanel = document.getElementById('adminPanel');
    const loginToComment = document.getElementById('loginToComment');
    const commentInputSection = document.getElementById('commentInputSection');
    
    // Sử dụng currentUser từ global hoặc từ userSystem
    const user = currentUser || window.userSystem.getUser();
    
    if (user && user.username) {
        // User đã login
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';
        usernameDisplay.textContent = user.username;
        userAvatar.textContent = user.username.charAt(0).toUpperCase();
        
        // Kiểm tra admin status
        if (user.isAdmin) {
            usernameDisplay.innerHTML = `${user.username} <span class="admin-badge">(admin)</span>`;
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
        // Chưa login
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
        adminPanel.style.display = 'none';
        userAvatar.classList.remove('admin-avatar');
        
        // Show login prompt
        if (loginToComment) loginToComment.style.display = 'block';
        if (commentInputSection) commentInputSection.style.display = 'none';
    }
    
    // Render lại để cập nhật UI
    if (window.renderComments) renderComments();
    if (window.renderUpdates) renderUpdates();
}


// ============ LOGOUT FUNCTION ============
async function logout() {
    showCustomConfirm(
        'Logout',
        'Are you sure you want to logout?',
        async () => {
            try {
                // Gọi logout từ userSystem
                const result = await window.userSystem.logout();
                
                if (result.success) {
                    // Reset global variables
                    currentUser = null;
                    
                    // Force UI update
                    updateAuthUI();
                    
                    // Load data lại với trạng thái không đăng nhập
                    await loadComments();
                    await loadUpdates();
                    
                    // Hiển thị thông báo
                    showNotification('Logged out successfully!', 'success');
                    
                    // Không reload page ngay lập tức
                    // Thay vào đó chỉ reset state
                    setTimeout(() => {
                        // Refresh để clean cache nếu cần
                        window.location.reload();
                    }, 500);
                } else {
                    showNotification(result.error || 'Logout failed', 'error');
                }
            } catch (error) {
                console.error('Logout error:', error);
                
                // Force logout cứng nếu API fail
                window.userSystem.clearToken();
                currentUser = null;
                updateAuthUI();
                await loadComments();
                await loadUpdates();
                
                showNotification('Logged out', 'info');
            }
        }
    );
}

// ============ COMMENTS SYSTEM (UPDATED FOR API) ============
window.commentsData = []; // Khởi tạo rỗng, sẽ load từ API

async function loadComments() {
    try {
        const result = await window.userSystem.getComments();
        if (result.success && result.data) {
            window.commentsData = result.data;
        } else {
            window.commentsData = [];
        }
        renderComments();
    } catch (error) {
        console.error('Failed to load comments:', error);
        window.commentsData = [];
        renderComments();
    }
}

function renderComments() {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    
    console.log('Rendering comments...', window.commentsData?.length || 0, 'comments');
    
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
    
    // Render comments từ API data
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
                         (comment.user.username === currentUser.username || 
                          comment.user._id === currentUser._id);
    const username = comment.user?.username || 'Unknown';
    
    // LUÔN HIỂN THỊ NỘI DUNG COMMENT CHO TẤT CẢ
    return `
        <div class="comment-item" data-id="${comment._id}">
            <div class="comment-main">
                <div class="comment-content-wrapper">
                    <div class="comment-header">
                        <div class="comment-avatar ${username === 'Dmaster' ? 'admin-avatar' : ''}">
                            ${username.charAt(0).toUpperCase()}
                        </div>
                        <div class="comment-info">
                            <span class="comment-author">
                                ${username}
                                ${username === 'Dmaster' ? '<span class="admin-badge">(admin)</span>' : ''}
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
                         (reply.user.username === currentUser.username || 
                          reply.user._id === currentUser._id);
    const username = reply.user?.username || 'Unknown';
    
    return `
        <div class="comment-item reply-item" data-id="${reply._id}">
            <div class="comment-main">
                <div class="comment-content-wrapper">
                    <div class="comment-header">
                        <div class="comment-avatar ${username === 'Dmaster' ? 'admin-avatar' : ''}">
                            ${username.charAt(0).toUpperCase()}
                        </div>
                        <div class="comment-info">
                            <span class="comment-author">
                                ${username}
                                ${username === 'Dmaster' ? '<span class="admin-badge">(admin)</span>' : ''}
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

async function submitComment() {
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
    
    try {
        const result = await window.userSystem.postComment(content);
        if (result.success) {
            input.value = '';
            await loadComments();
            showNotification('Comment added!', 'success');
        } else {
            showNotification(result.error || 'Failed to add comment', 'error');
        }
    } catch (error) {
        showNotification('Failed to add comment', 'error');
    }
}

async function submitReply(commentId) {
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
    
    try {
        const result = await window.userSystem.postComment(content, commentId);
        if (result.success) {
            textarea.value = '';
            form.classList.add('hidden');
            await loadComments();
            showNotification('Reply added!', 'success');
        } else {
            showNotification(result.error || 'Failed to add reply', 'error');
        }
    } catch (error) {
        showNotification('Failed to add reply', 'error');
    }
}

async function deleteComment(commentId) {
    if (!currentUser) {
        showAuthModal('login');
        return;
    }
    
    showCustomConfirm(
        'Delete Comment',
        'Are you sure you want to delete this comment?',
        async () => {
            try {
                const result = await window.userSystem.deleteComment(commentId);
                if (result.success) {
                    await loadComments();
                    showNotification('Comment deleted!', 'success');
                } else {
                    showNotification(result.error || 'Failed to delete comment', 'error');
                }
            } catch (error) {
                showNotification('Failed to delete comment', 'error');
            }
        }
    );
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

// ============ UPDATES SYSTEM (UPDATED FOR API) ============
window.updatesData = []; // Khởi tạo rỗng, sẽ load từ API

async function loadUpdates() {
    try {
        const result = await window.userSystem.getUpdates();
        if (result.success && result.data) {
            window.updatesData = result.data;
        } else {
            window.updatesData = [];
        }
        renderUpdates();
    } catch (error) {
        console.error('Failed to load updates:', error);
        window.updatesData = [];
        renderUpdates();
    }
}

function renderUpdates() {
    const updatesCount = document.getElementById('updatesCount');
    const updatesSlider = document.getElementById('updatesSlider');
    const updatePreviews = document.getElementById('updatePreviews');
    const noUpdates = document.getElementById('noUpdates');
    
    if (updatesCount) updatesCount.textContent = `(${window.updatesData.length})`;
    
    // Reset indices
    currentPreviewIndex = 0;
    currentUpdateIndex = 0;
    
    // Reset search input
    const searchInput = document.getElementById('searchUpdates');
    if (searchInput) searchInput.value = '';
    
    if (!window.updatesData || window.updatesData.length === 0) {
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
        renderUpdateSlider();
    } else {
        // CHƯA LOGIN: Show locked previews
        if (updatesSlider) updatesSlider.style.display = 'none';
        if (updatePreviews) updatePreviews.style.display = 'block';
        if (noUpdates) noUpdates.style.display = 'none';
        renderUpdatePreviews();
    }
}

function renderUpdateSlider() {
    const slidesContainer = document.getElementById('updateSlides');
    const counter = document.getElementById('updateCounter');
    const dotsContainer = document.getElementById('updateDots');
    const prevBtn = document.getElementById('prevUpdate');
    const nextBtn = document.getElementById('nextUpdate');
    
    if (!slidesContainer) return;
    
    if (isShowingAllUpdates) {
        // SHOW ALL
        slidesContainer.innerHTML = window.updatesData.map(update => `
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
        
        if (counter) counter.textContent = `All Updates (${window.updatesData.length})`;
        if (dotsContainer) dotsContainer.innerHTML = '';
        
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        
    } else {
        // SHOW SINGLE
        if (window.updatesData.length === 0) return;
        
        const update = window.updatesData[currentUpdateIndex];
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
        
        if (counter) counter.textContent = `${currentUpdateIndex + 1} / ${window.updatesData.length}`;
        
        // Create dots
        if (dotsContainer && window.updatesData.length > 1) {
            dotsContainer.innerHTML = window.updatesData.map((_, index) => 
                `<span class="slider-dot ${index === currentUpdateIndex ? 'active' : ''}" onclick="goToSlide(${index})"></span>`
            ).join('');
        }
        
        // Enable/disable buttons
        if (prevBtn) prevBtn.disabled = window.updatesData.length <= 1;
        if (nextBtn) nextBtn.disabled = window.updatesData.length <= 1;
    }
}

function renderUpdatePreviews() {
    const previewsContainer = document.getElementById('updatePreviews');
    if (!previewsContainer) return;
    
    if (!window.updatesData || window.updatesData.length === 0) {
        previewsContainer.innerHTML = `<div class="no-updates"><p>No updates yet</p></div>`;
        return;
    }
    
    // CHỈ HIỂN THỊ THÔNG BÁO LOGIN - KHÔNG NỘI DUNG THẬT
    previewsContainer.innerHTML = `
        <div class="update-preview">
            <h4><i class="fas fa-newspaper"></i> Update #${currentPreviewIndex + 1}</h4>
            
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
        
        ${window.updatesData.length > 1 ? `
            <div class="preview-navigation">
                <button class="preview-nav-btn" onclick="prevPreviewUpdate()">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <span class="preview-counter">${currentPreviewIndex + 1}/${window.updatesData.length}</span>
                <button class="preview-nav-btn" onclick="nextPreviewUpdate()">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        ` : ''}
    `;
}

function nextPreviewUpdate() {
    if (currentPreviewIndex >= window.updatesData.length - 1) return;
    currentPreviewIndex++;
    renderUpdatePreviews();
}

function prevPreviewUpdate() {
    if (currentPreviewIndex <= 0) return;
    currentPreviewIndex--;
    renderUpdatePreviews();
}

function filterUpdates() {
    const searchTerm = document.getElementById('searchUpdates')?.value.toLowerCase() || '';
    
    const filtered = window.updatesData.filter(update => 
        update.title.toLowerCase().includes(searchTerm) || 
        update.content.toLowerCase().includes(searchTerm)
    );
    
    // Reset index khi search
    currentPreviewIndex = 0;
    currentUpdateIndex = 0;
    
    if (currentUser) {
        if (filtered.length === 0) {
            document.getElementById('updatesSlider').innerHTML = `
                <div class="no-search-results" style="text-align: center; padding: 40px;">
                    <i class="fas fa-search"></i>
                    <h4>No updates found</h4>
                </div>
            `;
        } else {
            renderUpdateSlider();
        }
    } else {
        if (filtered.length === 0) {
            document.getElementById('updatePreviews').innerHTML = `
                <div class="no-search-results">
                    <i class="fas fa-search"></i>
                    <h4>No updates found</h4>
                    <p>Try different keywords</p>
                </div>
            `;
        } else {
            renderUpdatePreviews();
        }
    }
    
    document.getElementById('updatesCount').textContent = `(${filtered.length})`;
}

// Slider control functions (giữ nguyên)
function prevUpdate() {
    if (isShowingAllUpdates || window.updatesData.length <= 1) return;
    currentUpdateIndex = (currentUpdateIndex - 1 + window.updatesData.length) % window.updatesData.length;
    renderUpdateSlider();
}

function nextUpdate() {
    if (isShowingAllUpdates || window.updatesData.length <= 1) return;
    currentUpdateIndex = (currentUpdateIndex + 1) % window.updatesData.length;
    renderUpdateSlider();
}

function toggleShowAll() {
    isShowingAllUpdates = !isShowingAllUpdates;
    currentUpdateIndex = 0;
    
    const showAllBtn = document.getElementById('showAllUpdates');
    if (showAllBtn) {
        showAllBtn.innerHTML = isShowingAllUpdates ? 
            '<i class="fas fa-times"></i> Show Single' : 
            '<i class="fas fa-list"></i> Show All';
    }
    
    renderUpdateSlider();
}

function goToSlide(index) {
    if (isShowingAllUpdates || index < 0 || index >= window.updatesData.length) return;
    currentUpdateIndex = index;
    renderUpdateSlider();
}

// ============ ADMIN FUNCTIONS (UPDATED FOR API) ============
async function loadAdminStats() {
    try {
        const result = await window.userSystem.getStats();
        if (result.success) {
            document.getElementById('totalUsers').textContent = result.data.totalUsers || 0;
            document.getElementById('totalComments').textContent = result.data.totalComments || 0;
            document.getElementById('bannedUsers').textContent = result.data.totalBanned || 0;
            document.getElementById('totalUpdates').textContent = result.data.totalUpdates || 0;
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

async function banUser(userId) {
    showCustomConfirm(
        'Ban User',
        'Are you sure you want to ban this user?',
        async () => {
            try {
                const result = await window.userSystem.banUser(userId);
                if (result.success) {
                    showNotification(result.message || 'User banned', 'success');
                    if (typeof loadAdminUsers === 'function') await loadAdminUsers();
                    await loadAdminStats();
                } else {
                    showNotification(result.error || 'Failed to ban user', 'error');
                }
            } catch (error) {
                showNotification('Failed to ban user', 'error');
            }
        }
    );
}

async function promoteUser(userId) {
    try {
        const result = await window.userSystem.promoteUser(userId);
        if (result.success) {
            showNotification(result.message || 'User promoted', 'success');
            if (typeof loadAdminUsers === 'function') await loadAdminUsers();
        } else {
            showNotification(result.error || 'Failed to promote user', 'error');
        }
    } catch (error) {
        showNotification('Failed to promote user', 'error');
    }
}

async function deleteUser(userId) {
    showCustomConfirm(
        'Delete User',
        'Are you sure you want to delete this user? This cannot be undone.',
        async () => {
            try {
                const result = await window.userSystem.deleteUser(userId);
                if (result.success) {
                    showNotification(result.message || 'User deleted', 'success');
                    if (typeof loadAdminUsers === 'function') await loadAdminUsers();
                    await loadAdminStats();
                } else {
                    showNotification(result.error || 'Failed to delete user', 'error');
                }
            } catch (error) {
                showNotification('Failed to delete user', 'error');
            }
        }
    );
}

// ============ UPDATE MANAGEMENT (UPDATED FOR API) ============
async function submitUpdate() {
    const title = document.getElementById('updateTitle').value.trim();
    const content = document.getElementById('updateContent').value.trim();
    
    if (!title || !content) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (!window.userSystem.isAdmin()) {
        showNotification('Admin access required', 'error');
        return;
    }
    
    try {
        const result = await window.userSystem.createUpdate(title, content);
        if (result.success) {
            closeUpdateForm();
            await loadUpdates();
            showNotification('Update created!', 'success');
        } else {
            showNotification(result.error || 'Failed to create update', 'error');
        }
    } catch (error) {
        showNotification('Failed to create update', 'error');
    }
}

async function submitEditUpdate(updateId) {
    const title = document.getElementById('editUpdateTitle').value.trim();
    const content = document.getElementById('editUpdateContent').value.trim();
    
    if (!title || !content) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const result = await window.userSystem.editUpdate(updateId, title, content);
        if (result.success) {
            closeCustomModal('editUpdateFormModal');
            await loadUpdates();
            showNotification('Update updated!', 'success');
        } else {
            showNotification(result.error || 'Failed to update', 'error');
        }
    } catch (error) {
        showNotification('Failed to update', 'error');
    }
}

async function deleteUpdate(updateId) {
    showCustomConfirm(
        'Delete Update',
        'Are you sure you want to delete this update?',
        async () => {
            try {
                const result = await window.userSystem.deleteUpdate(updateId);
                if (result.success) {
                    await loadUpdates();
                    showNotification('Update deleted!', 'success');
                } else {
                    showNotification(result.error || 'Failed to delete update', 'error');
                }
            } catch (error) {
                showNotification('Failed to delete update', 'error');
            }
        }
    );
}



// ============ GAME FUNCTIONS (GIỮ NGUYÊN HOÀN TOÀN) ============
function startGame() {
    const placeholder = document.getElementById('gamePlaceholder');
    
    placeholder.innerHTML = `
        <div class="placeholder-content">
            <h2 style="color: white; margin-bottom: 20px;">🎮 Game Loading...</h2>
            <p style="color: #aaa; margin-bottom: 30px;">Game will start in fullscreen mode</p>
            <div class="loading-spinner"></div>
        </div>
    `;
    
    setTimeout(() => {
        placeholder.innerHTML = '';
        
        const gameContainer = document.createElement('div');
        gameContainer.id = 'gameContainer';
        gameContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            overflow: hidden;
        `;
        
        const iframe = document.createElement('iframe');
        iframe.id = 'gameFrame';
        iframe.src = 'Game/Game.html';
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            background: #000;
            display: block;
        `;
        
        gameContainer.appendChild(iframe);
        placeholder.appendChild(gameContainer);
        
        scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        if (!isFullscreen) {
            toggleFullscreen();
        }
        
        const exitBtn = document.createElement('button');
        exitBtn.className = 'exit-game-btn';
        exitBtn.innerHTML = '✕';
        exitBtn.title = 'Exit Game';
        exitBtn.onclick = exitGame;
        
        document.getElementById('gamePlayer').appendChild(exitBtn);
        
    }, 1000);
}

function exitGame() {
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    const gameFrame = document.getElementById('gameFrame');
    if (gameFrame) gameFrame.remove();
    
    const exitBtn = document.querySelector('.exit-game-btn');
    if (exitBtn) exitBtn.remove();
    
    const placeholder = document.getElementById('gamePlaceholder');
    placeholder.innerHTML = `
        <div class="placeholder-content">
            <button class="run-game-btn" onclick="startGame()">
                ▶ RUN GAME
            </button>
            <p>Click RUN GAME to start playing</p>
        </div>
    `;
    
    if (isFullscreen) {
        enableScroll();
        
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        document.getElementById('gamePlayer').classList.remove('fullscreen');
        isFullscreen = false;
    }
    
    setTimeout(() => {
        window.scrollTo(0, scrollPosition);
    }, 100);
    
    showNotification('Game exited', 'info');
}

// ============ FULLSCREEN FUNCTIONS (GIỮ NGUYÊN HOÀN TOÀN) ============
function toggleFullscreen() {
    const gamePlayer = document.getElementById('gamePlayer');
    const header = document.querySelector('.header');
    
    if (!isFullscreen) {
        scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        disableScroll();
        
        if (window.innerWidth < 768 && window.matchMedia("(orientation: landscape)").matches) {
            if (header) {
                header.style.display = 'none';
                header.style.opacity = '0';
                header.style.visibility = 'hidden';
            }
        }
        
        if (gamePlayer.requestFullscreen) {
            gamePlayer.requestFullscreen();
        } else if (gamePlayer.mozRequestFullScreen) {
            gamePlayer.mozRequestFullScreen();
        } else if (gamePlayer.webkitRequestFullscreen) {
            gamePlayer.webkitRequestFullscreen();
        } else if (gamePlayer.msRequestFullscreen) {
            gamePlayer.msRequestFullscreen();
        }
        
        if (window.innerWidth < 768) {
            gamePlayer.classList.add('fullscreen');
        }
    } else {
        enableScroll();
        
        if (header) {
            header.style.display = '';
            header.style.opacity = '';
            header.style.visibility = '';
        }
        
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
        window.scrollTo(0, scrollPosition);
    }
    
    isFullscreen = !isFullscreen;
}

function setupFullscreenListener() {
    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    document.addEventListener('mozfullscreenchange', updateFullscreenState);
    document.addEventListener('MSFullscreenChange', updateFullscreenState);
    
    document.addEventListener('touchmove', function(e) {
        if (isFullscreen) {
            e.preventDefault();
        }
    }, { passive: false });
}

function updateFullscreenState() {
    const header = document.querySelector('.header');
    
    if (!document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.mozFullScreenElement &&
        !document.msFullscreenElement) {
        isFullscreen = false;
        document.getElementById('gamePlayer').classList.remove('fullscreen');
        
        if (header) {
            header.style.display = '';
            header.style.opacity = '';
            header.style.visibility = '';
        }
        
        enableScroll();
        setTimeout(() => {
            window.scrollTo(0, scrollPosition);
        }, 100);
    } else {
        isFullscreen = true;
        
        if (window.innerWidth < 768 && window.matchMedia("(orientation: landscape)").matches) {
            if (header) {
                header.style.display = 'none';
                header.style.opacity = '0';
                header.style.visibility = 'hidden';
            }
        }
        
        if (window.innerWidth < 768) {
            document.getElementById('gamePlayer').classList.add('fullscreen');
        }
        
        scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        disableScroll();
    }
}

function setupOrientationListener() {
    window.addEventListener('orientationchange', function() {
        const header = document.querySelector('.header');
        
        if (isFullscreen) {
            if (window.matchMedia("(orientation: landscape)").matches) {
                if (header) {
                    header.style.display = 'none';
                    header.style.opacity = '0';
                    header.style.visibility = 'hidden';
                }
            } else {
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
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    document.body.style.cssText = `
        position: fixed;
        top: -${scrollPosition}px;
        left: 0;
        width: 100%;
        overflow: hidden;
        height: 100vh;
    `;
    
    document.body.classList.add('no-scroll');
}
 
function enableScroll() {
    document.body.style.cssText = '';
    document.body.classList.remove('no-scroll');
    window.scrollTo(0, scrollPosition);
}

// ============ DONATE FUNCTIONS (GIỮ NGUYÊN HOÀN TOÀN) ============
function showDonateForm() {
    // XÓA modal cũ nếu có
    const oldModal = document.querySelector('.donate-modal-overlay');
    if (oldModal) oldModal.remove();
    
    // Tạo modal mới - ĐẢM BẢO LUÔN VỪA MÀN HÌNH
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'donate-modal-overlay';
    
    // CSS ĐƠN GIẢN - QUAN TRỌNG: luôn căn giữa và vừa màn hình
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
        box-sizing: border-box;
    `;
    
    // Tự động điền thông tin nếu đã login
    const isLoggedIn = currentUser ? true : false;
    const userName = currentUser ? currentUser.username : '';
    const userEmail = currentUser ? (currentUser.email || '') : '';
    
    // NỘI DUNG MODAL - SIÊU NGẮN, KHÔNG BAO GIỜ VƯỢT QUÁ MÀN HÌNH
    const modalContent = document.createElement('div');
    modalContent.className = 'donate-modal-compact';
    modalContent.style.cssText = `
        background: #1a1a2e;
        border-radius: 10px;
        width: 100%;
        max-width: 400px; /* KHÔNG QUÁ RỘNG */
        max-height: 85vh; /* KHÔNG QUÁ CAO - LUÔN VỪA MÀN HÌNH */
        overflow: hidden; /* ẨN SCROLL */
        border: 2px solid #ff4757;
        position: relative;
        box-shadow: 0 5px 20px rgba(0,0,0,0.5);
    `;
    
    // HTML - CỰC KỲ ĐƠN GIẢN
    modalContent.innerHTML = `
        <!-- HEADER VỚI NÚT ĐÓNG LỚN, LUÔN HIỂN THỊ -->
        <div style="position: sticky; top: 0; background: #ff4757; padding: 12px 15px; 
                    display: flex; justify-content: space-between; align-items: center; 
                    z-index: 10;">
            <div style="color: white; font-weight: bold; font-size: 1.1rem;">
                <i class="fas fa-heart"></i> DONATE
            </div>
            <button onclick="this.closest('.donate-modal-overlay')?.remove()" 
                    style="background: white; color: #ff4757; border: none; width: 30px; 
                           height: 30px; border-radius: 50%; font-size: 1.2rem; 
                           font-weight: bold; cursor: pointer; display: flex; 
                           align-items: center; justify-content: center; padding: 0;">
                ×
            </button>
        </div>
        
        <!-- BODY - CHỈ CÓ 4 PHẦN, KHÔNG BAO GIỜ DÀI -->
        <div style="padding: 20px; color: white; max-height: calc(85vh - 60px); overflow-y: auto;">
            ${isLoggedIn ? `
                <div style="background: rgba(33,150,243,0.2); padding: 8px; border-radius: 5px; 
                            margin-bottom: 15px; text-align: center; font-size: 0.9rem;">
                    <i class="fas fa-user"></i> ${userName}
                </div>
            ` : ''}
            
            <!-- PHẦN 1: SỐ TIỀN (QUAN TRỌNG NHẤT) -->
            <div style="margin-bottom: 20px;">
                <div style="color: #aaa; margin-bottom: 8px; font-size: 0.9rem;">
                    <i class="fas fa-dollar-sign"></i> Amount ($)
                </div>
                
                <!-- 5 NÚT TRÊN 1 DÒNG -->
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; margin-bottom: 10px;">
                    ${[1, 5, 10, 20, 50].map(amt => `
                        <button type="button" onclick="setAmount(${amt})" 
                                style="padding: 10px; background: #2a2a3e; border: 1px solid #444; 
                                       color: white; border-radius: 5px; cursor: pointer; 
                                       font-weight: bold;">
                            $${amt}
                        </button>
                    `).join('')}
                </div>
                
                <!-- Ô NHẬP SỐ TIỀN -->
                <input type="number" id="donateAmount" 
                       placeholder="Other amount (min $1)" 
                       min="1" step="0.01"
                       style="width: 100%; padding: 12px; background: #2a2a3e; border: 1px solid #444; 
                              border-radius: 5px; color: white; font-size: 1rem; box-sizing: border-box;">
                <div style="color: #888; font-size: 0.8rem; margin-top: 5px;">
                    Minimum: $1.00
                </div>
            </div>
            
            <!-- PHẦN 2: THÔNG TIN (CHỈ KHI CHƯA LOGIN) -->
            ${!isLoggedIn ? `
                <div style="margin-bottom: 15px;">
                    <input type="text" id="donateName" placeholder="Your name" 
                           style="width: 100%; padding: 10px; background: #2a2a3e; border: 1px solid #444; 
                                  border-radius: 5px; color: white; margin-bottom: 10px; box-sizing: border-box;">
                    
                    <input type="email" id="donateEmail" placeholder="your@email.com" 
                           style="width: 100%; padding: 10px; background: #2a2a3e; border: 1px solid #444; 
                                  borderRadius: 5px; color: white; box-sizing: border-box;">
                </div>
            ` : ''}
            
            <!-- PHẦN 3: NÚT XÁC NHẬN LỚN, DỄ THẤY -->
            <button onclick="submitDonateForm()" 
                    style="width: 100%; background: #4CAF50; color: white; border: none; 
                           padding: 15px; border-radius: 5px; font-size: 1.1rem; font-weight: bold; 
                           cursor: pointer; margin-top: 10px;">
                <i class="fas fa-paper-plane"></i> DONATE NOW
            </button>
            
            <!-- PHẦN 4: THÔNG BÁO NHỎ -->
            <div style="color: #666; text-align: center; margin-top: 15px; font-size: 0.8rem;">
                <i class="fas fa-lock"></i> Secure payment
            </div>
        </div>
    `;
    
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    // THÊM CSS ĐƠN GIẢN
    const style = document.createElement('style');
    style.textContent = `
        /* ANIMATION ĐƠN GIẢN */
        .donate-modal-overlay {
            animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        /* FOCUS STATE */
        input:focus {
            outline: none;
            border-color: #4CAF50 !important;
        }
        
        button:hover {
            opacity: 0.9;
        }
        
        /* ĐẢM BẢO KHÔNG SCROLL TRÊN MOBILE */
        @media (max-height: 600px) {
            .donate-modal-compact {
                max-height: 90vh !important;
            }
            
            .donate-modal-compact > div:last-child {
                max-height: calc(90vh - 60px) !important;
            }
        }
    `;
    modalOverlay.appendChild(style);
    
    // ĐÓNG KHI CLICK NGOÀI
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    });
    
    // ĐÓNG BẰNG ESCAPE
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            modalOverlay.remove();
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
    
    // TỰ ĐỘNG FOCUS
    setTimeout(() => {
        document.getElementById('donateAmount').focus();
    }, 100);
}

// Hàm setAmount đơn giản
function setAmount(amount) {
    const input = document.getElementById('donateAmount');
    if (input) {
        input.value = amount;
        input.focus();
    }
}

// Giữ nguyên hàm setAmount nhưng thêm hiệu ứng
function setAmount(amount) {
    const amountInput = document.getElementById('donateAmount');
    if (amountInput) {
        amountInput.value = amount;
        
        // Highlight selected button
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = '';
            btn.style.color = '';
            
            if (parseInt(btn.dataset.amount) === amount) {
                btn.classList.add('active');
                btn.style.background = '#2196F3';
                btn.style.color = 'white';
                btn.style.boxShadow = '0 3px 10px rgba(33, 150, 243, 0.3)';
            }
        });
        
        // Highlight input
        amountInput.style.borderColor = '#2196F3';
        amountInput.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
        
        // Auto-remove highlight after 2 seconds
        setTimeout(() => {
            amountInput.style.borderColor = '';
            amountInput.style.backgroundColor = '';
        }, 2000);
    }
}

function submitDonation() {
    // Lấy giá trị - xử lý cho cả 2 trường hợp (đã login/chưa login)
    const amountInput = document.getElementById('donateAmount');
    const amount = amountInput ? amountInput.value : '';
    
    let name = '', email = '';
    
    if (currentUser) {
        // Đã đăng nhập: tự động lấy thông tin
        name = currentUser.username;
        email = currentUser.email || '';
    } else {
        // Chưa đăng nhập: lấy từ form
        const nameInput = document.getElementById('donateName');
        const emailInput = document.getElementById('donateEmail');
        name = nameInput ? nameInput.value.trim() : '';
        email = emailInput ? emailInput.value.trim() : '';
    }
    
    const messageInput = document.getElementById('donateMessage');
    const message = messageInput ? messageInput.value.trim() : '';
    
    // VALIDATION NGẮN GỌN
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum < 1) {
        showNotification('Vui lòng nhập số tiền ≥ $1.00', 'error');
        if (amountInput) amountInput.focus();
        return;
    }
    
    if (!currentUser) {
        if (!name || name.length < 2) {
            showNotification('Vui lòng nhập tên (ít nhất 2 ký tự)', 'error');
            document.getElementById('donateName')?.focus();
            return;
        }
        
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showNotification('Email không hợp lệ', 'error');
            document.getElementById('donateEmail')?.focus();
            return;
        }
    }
    
    // Tạo donation data
    const donationData = {
        name: name,
        email: email,
        amount: amountNum.toFixed(2),
        message: message,
        timestamp: Date.now(),
        userId: currentUser ? currentUser._id : null,
        donationId: 'D' + Date.now().toString().slice(-6)
    };
    
    // Hiển thị QR
    showQRCodeDemo(donationData);
    
    // Thông báo
    showNotification(`Đã tạo đóng góp $${donationData.amount}`, 'success');
}

// Hàm showQRCodeDemo compact
function showQRCodeDemo(donationData) {
    const form = document.getElementById('donateForm');
    const qrContainer = document.getElementById('qrCodeContainer');
    
    if (form && qrContainer) {
        form.style.display = 'none';
        qrContainer.style.display = 'block';
        
        // Update QR info
        document.getElementById('qrAmount').textContent = donationData.amount;
        document.getElementById('qrId').textContent = donationData.donationId;
        
        // Auto scroll to QR
        qrContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}


// Thêm hàm validate mới vào main.js
function validateDonationForm(name, email, amount) {
    const errors = [];
    
    // Kiểm tra tên
    if (!name || name.trim().length === 0) {
        errors.push('Vui lòng nhập tên');
    } else if (name.length < 2) {
        errors.push('Tên phải có ít nhất 2 ký tự');
    } else if (name.length > 50) {
        errors.push('Tên không được vượt quá 50 ký tự');
    }
    
    // Kiểm tra email
    if (!email || email.trim().length === 0) {
        errors.push('Vui lòng nhập email');
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push('Email không hợp lệ');
        }
    }
    
    // Kiểm tra số tiền
    if (!amount || amount.trim().length === 0) {
        errors.push('Vui lòng nhập số tiền');
    } else {
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum)) {
            errors.push('Số tiền không hợp lệ');
        } else if (amountNum < 1) {
            errors.push('Số tiền tối thiểu là $1.00');
        } else if (amountNum > 10000) {
            errors.push('Số tiền tối đa là $10,000.00');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Cập nhật hàm submitDonation() để sử dụng validate mới
function submitDonation() {
    const name = document.getElementById('donateName').value.trim();
    const email = document.getElementById('donateEmail').value.trim();
    const amount = document.getElementById('donateAmount').value;
    const message = document.getElementById('donateMessage').value.trim();
    
    // Validate form
    const validation = validateDonationForm(name, email, amount);
    
    if (!validation.isValid) {
        // Hiển thị tất cả lỗi
        validation.errors.forEach(error => {
            showNotification(error, 'error');
        });
        return;
    }
    
    // Nếu chưa đăng nhập và email không khớp với định dạng
    if (!currentUser) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Email không hợp lệ. Vui lòng kiểm tra lại', 'error');
            document.getElementById('donateEmail').focus();
            return;
        }
    }
    
    const amountNum = parseFloat(amount);
    
    // Tạo donation data
    const donationData = {
        name: name,
        email: email,
        amount: amountNum.toFixed(2),
        message: message,
        timestamp: Date.now(),
        userId: currentUser ? currentUser._id : null,
        username: currentUser ? currentUser.username : null,
        status: 'pending',
        donationId: 'DON' + Date.now().toString().slice(-8)
    };
    
    console.log('✅ Donation data validated:', donationData);
    
    // Hiển thị loading
    showNotification('🔄 Đang xử lý đóng góp của bạn...', 'info');
    
    // Giả lập gửi đến backend
    setTimeout(() => {
        // Lưu vào lịch sử donation
        saveDonationToHistory(donationData);
        
        // Hiển thị QR code
        showQRCodeDemo(donationData);
        
        // Thông báo thành công
        showNotification('✅ Đóng góp thành công! Cảm ơn bạn đã hỗ trợ!', 'success');
        
        // Log để debug
        console.log('🎉 Donation completed:', donationData);
        
    }, 1500);
}

// Cập nhật hàm showQRCodeDemo() để hiển thị thông tin chi tiết hơn
// Cập nhật hàm showQRCodeDemo cho compact version
function showQRCodeDemo(donationData) {
    const qrContainer = document.getElementById('qrCodeContainer');
    const form = document.getElementById('donateForm');
    
    if (qrContainer && form) {
        // Ẩn form, hiện QR với animation
        form.style.opacity = '0';
        form.style.height = '0';
        form.style.overflow = 'hidden';
        form.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            form.style.display = 'none';
            qrContainer.style.display = 'block';
            qrContainer.style.animation = 'modalFadeIn 0.5s ease';
            
            // Tạo QR code đơn giản
            const qrContent = `
                <div style="color: black; text-align: center; font-family: monospace;">
                    <div style="font-weight: bold; margin-bottom: 5px; color: #2196F3; font-size: 0.9rem;">
                        QR PAYMENT
                    </div>
                    <div style="font-size: 0.8rem; margin-bottom: 5px;">
                        <div style="font-weight: bold; color: #333;">$${donationData.amount}</div>
                        <div style="color: #666; font-size: 0.7rem;">ID: ${donationData.donationId}</div>
                    </div>
                    <div style="width: 120px; height: 120px; margin: 5px auto; 
                                background: repeating-linear-gradient(45deg, 
                                #000 0px, #000 1px, 
                                transparent 1px, transparent 20px),
                                repeating-linear-gradient(-45deg, 
                                #000 0px, #000 1px, 
                                transparent 1px, transparent 20px);
                                border: 1px solid #333;">
                        <!-- QR pattern simulation -->
                        <div style="width: 20px; height: 20px; background: #000; position: absolute; top: 10px; left: 10px;"></div>
                        <div style="width: 20px; height: 20px; background: #000; position: absolute; top: 10px; right: 10px;"></div>
                        <div style="width: 20px; height: 20px; background: #000; position: absolute; bottom: 10px; left: 10px;"></div>
                    </div>
                    <div style="color: #666; font-size: 0.7rem; margin-top: 5px;">
                        Scan with bank app
                    </div>
                </div>
            `;
            
            document.getElementById('qrCodeImage').innerHTML = qrContent;
            
            // Cập nhật thông tin chi tiết
            document.getElementById('qrName').textContent = donationData.name;
            document.getElementById('qrAmount').textContent = donationData.amount;
            document.getElementById('qrId').textContent = donationData.donationId;
            
        }, 300);
    }
}

// Cập nhật hàm saveDonationToHistory
function saveDonationToHistory(donationData) {
    try {
        const donations = JSON.parse(localStorage.getItem('pickleball_donations') || '[]');
        
        // Thêm thông tin bổ sung
        const completeDonation = {
            ...donationData,
            id: Date.now(),
            status: 'completed',
            completedAt: new Date().toISOString(),
            isVerified: true
        };
        
        donations.push(completeDonation);
        localStorage.setItem('pickleball_donations', JSON.stringify(donations));
        
        console.log('💾 Donation saved to history:', completeDonation);
        return true;
    } catch (error) {
        console.error('❌ Failed to save donation:', error);
        return false;
    }
}

// Thêm hàm real-time validation cho donation form
function setupDonationFormValidation() {
    const amountInput = document.getElementById('donateAmount');
    const nameInput = document.getElementById('donateName');
    const emailInput = document.getElementById('donateEmail');
    
    if (amountInput) {
        amountInput.addEventListener('input', function() {
            const value = parseFloat(this.value);
            if (!isNaN(value) && value < 1) {
                this.style.borderColor = '#ff4757';
                this.style.backgroundColor = 'rgba(255, 71, 87, 0.1)';
            } else {
                this.style.borderColor = '';
                this.style.backgroundColor = '';
            }
        });
    }
    
    if (emailInput && !currentUser) {
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (email && !emailRegex.test(email)) {
                this.style.borderColor = '#ff4757';
                this.style.backgroundColor = 'rgba(255, 71, 87, 0.1)';
                showNotification('Email không đúng định dạng', 'error');
            }
        });
    }
}

// Gọi hàm setup trong showDonateForm()
// Thêm dòng này vào cuối hàm showDonateForm():
setTimeout(setupDonationFormValidation, 500);

// ============ UTILITY FUNCTIONS (GIỮ NGUYÊN) ============
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
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
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
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function resetAuthForm() {
    document.getElementById('authUsername').value = '';
    document.getElementById('authEmail').value = '';
    document.getElementById('authPassword').value = '';
    document.getElementById('authError').textContent = '';
    
    document.querySelectorAll('.auth-form input').forEach(input => {
        input.classList.remove('error');
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function preventDefaultScroll(e) {
    if (isFullscreen) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}

// ============ EVENT LISTENERS ============
document.addEventListener('wheel', preventDefaultScroll, { passive: false });
document.addEventListener('touchmove', preventDefaultScroll, { passive: false });
document.addEventListener('keydown', function(e) {
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

// ============ INITIALIZE ON LOAD ============
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    
    // Make functions globally available
    window.handleAuthSubmit = handleAuthSubmit;
    window.submitComment = submitComment;
    window.submitReply = submitReply;
    window.deleteComment = deleteComment;
    window.submitUpdate = submitUpdate;
    window.submitEditUpdate = submitEditUpdate;
    window.deleteUpdate = deleteUpdate;
    window.banUser = banUser;
    window.promoteUser = promoteUser;
    window.deleteUser = deleteUser;
    window.showAuthModal = showAuthModal;
    window.closeAuthModal = closeAuthModal;
    window.toggleAuthMode = toggleAuthMode;
    window.logout = logout;
    window.startGame = startGame;
    window.exitGame = exitGame;
    window.toggleFullscreen = toggleFullscreen;
    window.showDonateForm = showDonateForm;
    window.setAmount = setAmount;
    window.submitDonation = submitDonation;
    window.prevUpdate = prevUpdate;
    window.nextUpdate = nextUpdate;
    window.toggleShowAll = toggleShowAll;
    window.goToSlide = goToSlide;
    window.filterUpdates = filterUpdates;
    window.nextPreviewUpdate = nextPreviewUpdate;
    window.prevPreviewUpdate = prevPreviewUpdate;
    window.toggleReplyForm = toggleReplyForm;
    window.cancelReply = cancelReply;
    window.clearCommentInput = clearCommentInput;
});

// Auto-check session
setInterval(() => {
    if (window.userSystem && window.userSystem.isLoggedIn() && !currentUser) {
        currentUser = window.userSystem.getUser();
        updateAuthUI();
    }
}, 2000);
// main.js - Main Application File
const IS_GITHUB_PAGES = window.location.hostname.includes('github.io');
const BASE_PATH = IS_GITHUB_PAGES ? '/YOUR_REPO_NAME/' : '/'; // Thay YOUR_REPO_NAME bằng tên repo thật

console.log('Environment:', IS_GITHUB_PAGES ? 'GitHub Pages' : 'Local');
console.log('Base Path:', BASE_PATH);
let showCommentsToPublic = true;
let isFullscreen = false;
let currentUser = null;
let isShowingAllUpdates = false;
let currentUpdateIndex = 0;
let currentPreviewIndex = 0; // Thêm dòng này
let isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// SIMPLE HASH FUNCTION - CHẠY CHÍNH XÁC
// Thêm test function để debug
function testHashFunction() {
    console.log('=== TESTING HASH FUNCTION ===');
    const testPassword = '010101';
    const hashed = simpleHash(testPassword);
    console.log('Password:', testPassword);
    console.log('Hashed:', hashed);
    console.log('Hash length:', hashed.length);
    console.log('Hash type:', typeof hashed);
    console.log('=== END TEST ===');
}

// Gọi trong initializePage() để test
function initializePage() {
    console.log('🔄 Initializing page...');
    
    // Test hash function
    testHashFunction();
    
    // ... phần còn lại của initializePage ...
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
    
    // Detect device type
    if (isMobileDevice) {
        document.body.classList.add('mobile');
        document.body.classList.remove('desktop');
        console.log('📱 Mobile device detected');
    } else {
        document.body.classList.add('desktop');
        document.body.classList.remove('mobile');
        console.log('💻 Desktop device detected');
    }
    
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
    setupOrientationListeners();
    setupFullscreenExitListeners();
    
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
        switchText.innerHTML = 'Already have an account? <a href="javascript:void(0)" onclick="toggleAuthMode()">Log in</a>';
    } else {
        title.textContent = 'Log in';
        submitBtn.textContent = 'Log in';
        switchText.innerHTML = 'Don\'t have an account? <a href="javascript:void(0)" onclick="toggleAuthMode()">Sign up</a>';
    }
    
    modal.style.display = 'flex';
    
    // NGĂN KHÔNG CHO SCROLL BACKGROUND
    document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
    
    // Reset error state
    document.getElementById('authError').textContent = '';
    document.querySelectorAll('.auth-form input').forEach(input => {
        input.classList.remove('error');
    });
    
    // KHÔI PHỤC SCROLL CHO BACKGROUND
    document.body.style.overflow = 'auto';
}

function toggleAuthMode(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const currentMode = document.getElementById('modalTitle').textContent.includes('Sign up') ? 'signup' : 'login';
    
    // Reset form
    resetAuthForm();
    
    // Chỉ chuyển đổi mode trong cùng modal
    showAuthModal(currentMode === 'login' ? 'signup' : 'login');
    
    return false;
}

function handleAuthSubmit() {
    const isSignupMode = document.getElementById('modalTitle').textContent.includes('Sign up');
    const errorElement = document.getElementById('authError');
    
    // Xóa class error cũ
    document.querySelectorAll('.auth-form input').forEach(input => {
        input.classList.remove('error');
    });
    errorElement.textContent = '';
    errorElement.style.color = ''; // Reset màu
    
    if (isSignupMode) {
        // ============ SIGN UP ============
        const username = document.getElementById('authUsername').value.trim();
        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value;
        
        console.log('Sign up attempt:', { username, email, passwordLength: password.length });
        
        // Validate inputs
        if (!username || !email || !password) {
            errorElement.textContent = 'Please fill in all fields';
            errorElement.style.color = '#ff4757';
            if (!username) document.getElementById('authUsername').classList.add('error');
            if (!email) document.getElementById('authEmail').classList.add('error');
            if (!password) document.getElementById('authPassword').classList.add('error');
            return;
        }
        
        // Validate username
        if (username.length < 3 || username.length > 20) {
            errorElement.textContent = 'Username must be 3-20 characters';
            errorElement.style.color = '#ff4757';
            document.getElementById('authUsername').classList.add('error');
            return;
        }
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorElement.textContent = 'Please enter a valid email address';
            errorElement.style.color = '#ff4757';
            document.getElementById('authEmail').classList.add('error');
            return;
        }
        
        // Validate password
        if (password.length < 8) {
            errorElement.textContent = 'Password must be at least 8 characters';
            errorElement.style.color = '#ff4757';
            document.getElementById('authPassword').classList.add('error');
            return;
        }
        
        // Get users from localStorage
        let users = JSON.parse(localStorage.getItem('pickleball_users') || '[]');
        console.log('Existing users count:', users.length);
        
        // Check if username exists
        const existingUsername = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (existingUsername) {
            errorElement.textContent = 'Username already exists';
            errorElement.style.color = '#ff4757';
            document.getElementById('authUsername').classList.add('error');
            console.log('Username exists:', existingUsername);
            return;
        }
        
        // Check if email exists
        const existingEmail = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        if (existingEmail) {
            errorElement.textContent = 'Email already registered';
            errorElement.style.color = '#ff4757';
            document.getElementById('authEmail').classList.add('error');
            console.log('Email exists:', existingEmail);
            return;
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            username: username,
            email: email,
            password: simpleHash(password),
            createdAt: Date.now(),
            banned: false,
            admin: false,
            isBanned: false,
            isAdmin: false
        };
        
        console.log('Creating new user:', newUser);
        
        // Add to users array
        users.push(newUser);
        
        // Save to localStorage
        localStorage.setItem('pickleball_users', JSON.stringify(users));
        console.log('User saved to localStorage. Total users:', users.length);
        
        // SUCCESS - Hiển thị thông báo thành công
        errorElement.textContent = '✅ Account created successfully! Please log in.';
        errorElement.style.color = '#4CAF50';
        
        // Tự động chuyển sang login form sau 2 giây
        setTimeout(() => {
            // Chuyển sang login mode
            const title = document.getElementById('modalTitle');
            const submitBtn = document.getElementById('authSubmitBtn');
            const switchText = document.getElementById('authSwitch');
            
            // Ẩn username field
            const usernameField = document.getElementById('usernameField');
            if (usernameField) {
                usernameField.style.display = 'none';
            }
            
            // Đặt lại form thành login mode
            title.textContent = 'Log in';
            submitBtn.textContent = 'Log in';
            switchText.innerHTML = 'Don\'t have an account? <a href="javascript:void(0)" onclick="toggleAuthMode(event)">Sign up</a>';
            
            // Giữ email đã nhập, xóa các trường khác
            document.getElementById('authEmail').value = email;
            document.getElementById('authUsername').value = '';
            document.getElementById('authPassword').value = '';
            
            // Reset error message
            errorElement.textContent = '';
            errorElement.style.color = '';
            
        }, 2000);
        
    } else {
        // ============ LOGIN ============
        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value;
        
        console.log('Login attempt:', { email, passwordLength: password.length });
        
        // Validate inputs
        if (!email || !password) {
            errorElement.textContent = 'Please fill in all fields';
            errorElement.style.color = '#ff4757';
            if (!email) document.getElementById('authEmail').classList.add('error');
            if (!password) document.getElementById('authPassword').classList.add('error');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorElement.textContent = 'Please enter a valid email address';
            errorElement.style.color = '#ff4757';
            document.getElementById('authEmail').classList.add('error');
            return;
        }
        
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('pickleball_users') || '[]');
        console.log('Searching for email:', email.toLowerCase());
        console.log('All users:', users.map(u => ({ email: u.email, username: u.username })));
        
        // Find user by email
        const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            errorElement.textContent = 'Invalid email or password';
            errorElement.style.color = '#ff4757';
            document.getElementById('authEmail').classList.add('error');
            document.getElementById('authPassword').classList.add('error');
            console.log('User not found');
            return;
        }
        
        const hashedPassword = simpleHash(password);
        console.log('Provided hash:', hashedPassword);
        console.log('Stored hash:', user.password);
        
        if (user.password !== hashedPassword) {
            errorElement.textContent = 'Invalid email or password';
            errorElement.style.color = '#ff4757';
            document.getElementById('authEmail').classList.add('error');
            document.getElementById('authPassword').classList.add('error');
            console.log('Password mismatch');
            return;
        }
        
        if (user.banned || user.isBanned) {
            errorElement.textContent = 'This account has been banned!';
            errorElement.style.color = '#ff4757';
            return;
        }
        
        // SUCCESS - Login
        console.log('Login successful:', user.username);
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
// ============ FIXED VERSION - HIỂN THỊ TÊN THẬT, ẨN NỘI DUNG ============
function renderUpdatePreviews(updates) {
    const previewsContainer = document.getElementById('updatePreviews');
    if (!previewsContainer) return;
    
    if (updates.length === 0) {
        previewsContainer.innerHTML = `<div class="no-updates"><p>No updates yet</p></div>`;
        return;
    }
    
    // HIỂN THỊ TIÊU ĐỀ THẬT, NHƯNG NỘI DUNG VẪN ẨN
    previewsContainer.innerHTML = `
        <div class="update-preview">
            <!-- HIỂN THỊ TIÊU ĐỀ THẬT CỦA UPDATE -->
            <h4><i class="fas fa-newspaper"></i> ${updates[currentPreviewIndex].title}</h4>
            
            <!-- KHÔNG HIỂN THỊ NỘI DUNG THẬT, CHỈ HIỂN THỊ THÔNG BÁO LOGIN -->
            <div style="background: rgba(255,152,0,0.1); border: 1px solid rgba(255,152,0,0.3); 
                        border-radius: 8px; padding: 40px 20px; text-align: center; 
                        color: #FF9800; font-weight: bold; margin: 20px 0;">
                <i class="fas fa-lock"></i> 
                <p style="margin: 10px 0;">Login to read this update content</p>
                <a onclick="showAuthModal('login')" 
                   style="color: #2196F3; cursor: pointer; text-decoration: underline; font-size: 0.9rem;">
                   Click here to login
                </a>
            </div>
            
            <div style="color: #666; font-size: 0.9rem;">
                <small><i class="far fa-calendar"></i> ${new Date(updates[currentPreviewIndex].createdAt).toLocaleDateString()}</small>
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
function startGame() {
    const placeholder = document.getElementById('gamePlaceholder');
    const isMobile = isMobileDevice;
    
    console.log('Starting game on:', isMobile ? 'Mobile' : 'Desktop');
    
    // Hiển thị loading
    placeholder.innerHTML = `
        <div class="placeholder-content">
            <h2 style="color: white; margin-bottom: 20px;">🎮 Game Loading...</h2>
            <p style="color: #aaa; margin-bottom: 30px;">
                ${isMobile ? 'Game will start in fullscreen landscape mode' : 'Game will start in fullscreen mode'}
            </p>
            <div class="loading-spinner"></div>
        </div>
    `;
    
    // Sau 1 giây load game
    setTimeout(() => {
        placeholder.innerHTML = '';
        
        // Tạo iframe để load game
        const iframe = document.createElement('iframe');
        iframe.id = 'gameFrame';
        iframe.src = 'Game/Game.html';
        iframe.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
            background: #000;
        `;
        
        // Thêm iframe vào placeholder
        placeholder.appendChild(iframe);
        
        // Nếu là mobile, dùng mobile fullscreen đặc biệt
        if (isMobile) {
            // Tự động vào fullscreen mobile
            setTimeout(() => {
                enterMobileFullscreen(document.getElementById('gamePlayer'));
            }, 500);
        } else {
            // Desktop: fullscreen bình thường
            if (!isFullscreen) {
                toggleFullscreen();
            }
        }
        
        // Thêm nút exit
        const exitBtn = document.createElement('button');
        exitBtn.className = 'exit-game-btn' + (isMobile ? ' mobile' : '');
        exitBtn.innerHTML = '✕';
        exitBtn.title = 'Exit Game';
        exitBtn.onclick = exitGame;
        
        document.getElementById('gamePlayer').appendChild(exitBtn);
        
    }, 1000);
}

function exitGame() {
    console.log('Exiting game...');
    
    // 1. Xóa iframe game
    const gameFrame = document.getElementById('gameFrame');
    if (gameFrame) {
        gameFrame.remove();
        console.log('Game frame removed');
    }
    
    // 2. Xóa nút exit
    const exitBtn = document.querySelector('.exit-game-btn');
    if (exitBtn) {
        exitBtn.remove();
        console.log('Exit button removed');
    }
    
    // 3. Khôi phục placeholder về ban đầu
    const placeholder = document.getElementById('gamePlaceholder');
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="placeholder-content">
                <button class="run-game-btn" onclick="startGame()">
                    ▶ RUN GAME
                </button>
                <p>Click RUN GAME to start playing</p>
            </div>
        `;
        console.log('Placeholder restored');
    }
    
    // 4. THOÁT FULLSCREEN ĐÚNG CÁCH
    if (isFullscreen) {
        console.log('Exiting fullscreen...');
        
        // Đảm bảo mở khóa tất cả
        restoreScrollAndOrientation();
        
        // Gọi hàm exitFullscreen
        exitFullscreen();
        
        // Reset lại biến
        isFullscreen = false;
    }
    
    // 5. ĐẢM BẢO BODY CÓ THỂ SCROLL LẠI
    restoreBodyScroll();
    
    console.log('Game exited successfully');
    showNotification('Game exited', 'info');
}

function restoreBodyScroll() {
    console.log('Restoring body scroll...');
    
    // Đảm bảo body có thể scroll
    document.body.style.overflow = 'auto';
    document.body.style.position = 'static';
    document.body.style.height = 'auto';
    document.body.style.width = 'auto';
    
    // Đảm bảo html có thể scroll
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.position = 'static';
    
    // Xóa lớp locked nếu có
    document.body.classList.remove('no-scroll', 'game-fullscreen');
    
    console.log('Body scroll restored');
}

function restoreScrollAndOrientation() {
    console.log('Restoring scroll and orientation...');
    
    // 1. Mở khóa orientation nếu đang khóa
    if (screen.orientation && screen.orientation.unlock) {
        try {
            screen.orientation.unlock();
            console.log('Orientation unlocked');
        } catch (err) {
            console.log('Orientation unlock failed:', err);
        }
    }
    
    // 2. Xóa overlay fullscreen nếu có
    const overlay = document.getElementById('fullscreenOverlay');
    if (overlay) {
        overlay.remove();
        console.log('Overlay removed');
    }
    
    // 3. Reset game player style
    const gamePlayer = document.getElementById('gamePlayer');
    if (gamePlayer) {
        gamePlayer.classList.remove('fullscreen');
        gamePlayer.style.cssText = ''; // Xóa tất cả inline styles
        console.log('Game player styles reset');
    }
    
    // 4. Force reflow
    if (gamePlayer) {
        gamePlayer.offsetHeight; // Trigger reflow
    }
}

// Fullscreen functions
function toggleFullscreen() {
    const gamePlayer = document.getElementById('gamePlayer');
    
    if (!isFullscreen) {
        // VÀO FULLSCREEN
        enterFullscreen(gamePlayer);
    } else {
        // THOÁT FULLSCREEN
        exitFullscreen();
    }
}

function enterFullscreen(element) {
    console.log('Entering fullscreen, device:', isMobileDevice ? 'Mobile' : 'Desktop');
    
    if (isMobileDevice) {
        // CHỈ MOBILE: Xoay ngang
        enterMobileFullscreen(element);
    } else {
        // DESKTOP: Fullscreen bình thường
        enterDesktopFullscreen(element);
    }
}

function enterMobileFullscreen(element) {
    console.log('MOBILE: Entering true fullscreen');
    
    // 1. Lock orientation to landscape
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape')
            .then(() => {
                console.log('Screen locked to landscape');
                applyTrueMobileFullscreen(element);
            })
            .catch(err => {
                console.log('Failed to lock orientation:', err);
                applyTrueMobileFullscreen(element);
            });
    } else {
        applyTrueMobileFullscreen(element);
    }
    
    // 2. Block all browser UI
    blockBrowserUI();
    
    // 3. Prevent zoom and gestures
    preventZoomAndGestures();
    
    // 4. Apply mobile-specific styles
    applyMobileFullscreenStyles(element);
    
    isFullscreen = true;
}

function applyTrueMobileFullscreen(element) {
    console.log('Applying true mobile fullscreen');
    
    // 1. Thêm class đặc biệt
    element.classList.add('mobile-fullscreen');
    document.body.classList.add('mobile-fullscreen-active');
    
    // 2. Áp dụng styles triệt để
    element.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vh !important;
        height: 100vw !important;
        z-index: 99999 !important;
        background: #000 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        border-radius: 0 !important;
        transform: rotate(90deg) translateY(-100%) !important;
        transform-origin: top left !important;
        overflow: hidden !important;
    `;
    
    // 3. Hide all other elements
    document.querySelectorAll('body > *:not(#gamePlayer):not(.exit-game-btn)').forEach(el => {
        el.style.display = 'none';
    });
}

function blockBrowserUI() {
    console.log('Blocking browser UI');
    
    // 1. Hide browser address bar (if possible)
    window.scrollTo(0, 1);
    
    // 2. Add meta tag to hide browser UI
    let meta = document.getElementById('fullscreen-meta');
    if (!meta) {
        meta = document.createElement('meta');
        meta.id = 'fullscreen-meta';
        meta.name = 'viewport';
        document.head.appendChild(meta);
    }
    
    // Viewport settings to hide browser UI
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    
    // 3. iOS specific - hide Safari UI
    document.documentElement.style.webkitTouchCallout = 'none';
    document.documentElement.style.webkitUserSelect = 'none';
    document.documentElement.style.KhtmlUserSelect = 'none';
    document.documentElement.style.MozUserSelect = 'none';
    document.documentElement.style.msUserSelect = 'none';
    document.documentElement.style.userSelect = 'none';
    
    // 4. Prevent pull-to-refresh
    document.body.style.overscrollBehavior = 'none';
}

function preventZoomAndGestures() {
    console.log('Preventing zoom and gestures');
    
    // Disable all gestures
    document.addEventListener('touchstart', preventTouch, { passive: false });
    document.addEventListener('touchmove', preventTouch, { passive: false });
    document.addEventListener('touchend', preventTouch, { passive: false });
    document.addEventListener('gesturestart', preventTouch, { passive: false });
    document.addEventListener('gesturechange', preventTouch, { passive: false });
    document.addEventListener('gestureend', preventTouch, { passive: false });
    
    // Disable double tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
    
    // Prevent pinch zoom
    document.addEventListener('wheel', preventPinchZoom, { passive: false });
}

function preventTouch(e) {
    if (e.touches.length > 1 || e.scale && e.scale !== 1) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}

function preventPinchZoom(e) {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}

function applyMobileFullscreenStyles(element) {
    // Áp dụng styles cho mobile fullscreen
    element.classList.add('fullscreen');
    element.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 9999;
        background: #000;
        transform: rotate(90deg);
        transform-origin: center center;
    `;
}

function applyMobileFullscreen(element) {
    console.log('Applying mobile fullscreen');
    
    // 1. Thêm class để style
    element.classList.add('fullscreen');
    
    // 2. Apply mobile fullscreen styles
    element.style.position = 'fixed';
    element.style.top = '0';
    element.style.left = '0';
    element.style.width = '100vw';
    element.style.height = '100vh';
    element.style.zIndex = '9999';
    element.style.margin = '0';
    element.style.borderRadius = '0';
    element.style.transform = 'rotate(90deg)';
    element.style.transformOrigin = 'center center';
    
    // 3. Khóa orientation cho mobile
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape')
            .then(() => {
                console.log('Screen locked to landscape');
            })
            .catch(err => {
                console.log('Failed to lock orientation:', err);
            });
    }
    
    // 4. Chỉ khóa scroll cho mobile
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // 5. Thêm overlay để ngăn touch ra ngoài
    if (!document.getElementById('mobileFullscreenOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'mobileFullscreenOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            z-index: 9998;
            display: block;
        `;
        document.body.appendChild(overlay);
    }
    
    isFullscreen = true;
    console.log('Mobile fullscreen applied');
}

function enterDesktopFullscreen(element) {
    console.log('DESKTOP: Standard fullscreen');
    
    // 1. Sử dụng Fullscreen API
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
    
    // 2. Thêm class nhưng KHÔNG khóa scroll
    element.classList.add('fullscreen');
    
    // 3. KHÔNG áp dụng transform (không xoay)
    element.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 9999;
        background: #000;
    `;
    
    // 4. QUAN TRỌNG: KHÔNG khóa scroll trên desktop
    // document.body.style.overflow = 'auto'; // GIỮ NGUYÊN
    
    isFullscreen = true;
}

function applyDesktopFullscreen(element) {
    console.log('Applying desktop fullscreen');
    
    // 1. Sử dụng Fullscreen API của browser
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
    
    // 2. KHÔNG khóa body scroll trên desktop
    // Chỉ thêm class để style
    element.classList.add('fullscreen');
    
    // 3. Đảm bảo game player có đúng kích thước
    element.style.width = '100%';
    element.style.height = '100%';
    
    isFullscreen = true;
    console.log('Desktop fullscreen applied - scroll NOT locked');
}

function exitMobileFullscreen() {
    console.log('MOBILE: Exiting fullscreen');
    
    // 1. Unlock orientation
    if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
    }
    
    // 2. Restore viewport
    let meta = document.getElementById('fullscreen-meta');
    if (meta) {
        meta.content = 'width=device-width, initial-scale=1.0';
    }
    
    // 3. Remove all event listeners
    document.removeEventListener('touchstart', preventTouch);
    document.removeEventListener('touchmove', preventTouch);
    document.removeEventListener('touchend', preventTouch);
    document.removeEventListener('gesturestart', preventTouch);
    document.removeEventListener('gesturechange', preventTouch);
    document.removeEventListener('gestureend', preventTouch);
    document.removeEventListener('wheel', preventPinchZoom);
    
    // 4. Restore all elements
    document.querySelectorAll('body > *').forEach(el => {
        el.style.display = '';
    });
    
    // 5. Remove classes and styles
    const gamePlayer = document.getElementById('gamePlayer');
    if (gamePlayer) {
        gamePlayer.classList.remove('mobile-fullscreen');
        gamePlayer.style.cssText = '';
    }
    
    document.body.classList.remove('mobile-fullscreen-active');
    
    // 6. Restore scroll and selection
    document.documentElement.style.webkitTouchCallout = '';
    document.documentElement.style.webkitUserSelect = '';
    document.documentElement.style.KhtmlUserSelect = '';
    document.documentElement.style.MozUserSelect = '';
    document.documentElement.style.msUserSelect = '';
    document.documentElement.style.userSelect = '';
    document.body.style.overscrollBehavior = '';
    
    // 7. Restore viewport position
    window.scrollTo(0, 0);
}

function exitMobileFullscreen() {
    console.log('MOBILE: Exiting landscape');
    
    // 1. Unlock orientation
    if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
    }
    
    // 2. Xóa styles
    const gamePlayer = document.getElementById('gamePlayer');
    if (gamePlayer) {
        gamePlayer.classList.remove('fullscreen');
        gamePlayer.style.cssText = '';
    }
    
    // 3. Mở khóa scroll
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
}


function exitDesktopFullscreen() {
    console.log('DESKTOP: Exiting fullscreen');
    
    // 1. Exit fullscreen API
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
    
    // 2. Xóa class và styles
    const gamePlayer = document.getElementById('gamePlayer');
    if (gamePlayer) {
        gamePlayer.classList.remove('fullscreen');
        gamePlayer.style.cssText = '';
    }
    
    // 3. Đảm bảo scroll hoạt động
    document.body.style.overflow = 'auto';
}

function setupFullscreenListener() {
    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    document.addEventListener('mozfullscreenchange', updateFullscreenState);
    document.addEventListener('MSFullscreenChange', updateFullscreenState);
}

function updateFullscreenState() {
    // Chỉ xử lý cho desktop (vì mobile tự quản lý)
    if (!isMobileDevice) {
        if (!document.fullscreenElement &&
            !document.webkitFullscreenElement &&
            !document.mozFullScreenElement &&
            !document.msFullscreenElement) {
            // Desktop đã thoát fullscreen
            isFullscreen = false;
            const gamePlayer = document.getElementById('gamePlayer');
            if (gamePlayer) {
                gamePlayer.classList.remove('fullscreen');
            }
            console.log('Desktop fullscreen state: exited');
        } else {
            isFullscreen = true;
            console.log('Desktop fullscreen state: entered');
        }
    }
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
    document.querySelectorAll('a').forEach(anchor => {
        // Bỏ qua các link đến external site
        if (anchor.href && 
            (anchor.href.startsWith('http') || 
             anchor.href.startsWith('mailto') || 
             anchor.href.startsWith('tel'))) {
            return;
        }
        
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Nếu là hash link và không phải là link auth
            if (href && href.startsWith('#') && href !== '#') {
                e.preventDefault();
                
                const targetId = href;
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    // Smooth scroll với offset cho header fixed
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                    
                    // Update URL hash mà không reload
                    if (history.pushState) {
                        history.pushState(null, null, href);
                    } else {
                        window.location.hash = href;
                    }
                }
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
// Sửa phần DOMContentLoaded trong main.js
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    
    // Ngăn default behavior cho tất cả các hash links
    document.addEventListener('click', function(e) {
        const target = e.target.closest('a');
        if (target && target.getAttribute('href') === '#') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);
    
    // Auto check after 1 second
    setTimeout(checkSession, 1000);
});
// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function resetAuthForm() {
    // Chỉ reset khi không có lỗi
    const errorElement = document.getElementById('authError');
    if (errorElement && !errorElement.textContent.includes('successfully')) {
        document.getElementById('authUsername').value = '';
        document.getElementById('authEmail').value = '';
        document.getElementById('authPassword').value = '';
        errorElement.textContent = '';
    }
    
    // Remove error classes
    document.querySelectorAll('.auth-form input').forEach(input => {
        input.classList.remove('error');
    });
}
// Thêm vào main.js
function setupOrientationListeners() {
    // CHỈ áp dụng cho mobile
    if (!isMobileDevice) return;
    
    window.addEventListener('orientationchange', function() {
        if (isFullscreen) {
            const gamePlayer = document.getElementById('gamePlayer');
            setTimeout(() => {
                // Re-apply styles khi orientation thay đổi
                applyMobileFullscreenStyles(gamePlayer);
            }, 300);
        }
    });
}

function handleOrientationChange() {
    if (isFullscreen) {
        const gamePlayer = document.getElementById('gamePlayer');
        setTimeout(() => {
            // Cập nhật lại kích thước khi xoay màn hình
            applyMobileFullscreen(gamePlayer);
        }, 300);
    }
}

function handleResize() {
    if (isFullscreen) {
        const gamePlayer = document.getElementById('gamePlayer');
        applyMobileFullscreen(gamePlayer);
    }
}

// Gọi trong initializePage()
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
    setupOrientationListeners(); // THÊM DÒNG NÀY
    
    console.log('✅ Page initialized');
}
// Thêm vào main.js
function scrollToSection(sectionId) {
    const target = document.querySelector(sectionId);
    if (target) {
        window.scrollTo({
            top: target.offsetTop - 80,
            behavior: 'smooth'
        });
        
        // Update URL mà không reload
        if (history.pushState) {
            history.pushState(null, null, sectionId);
        }
    }
    return false; // Ngăn default behavior
}
// Thêm vào main.js
function setupFullscreenExitListeners() {
    // ESC key để exit game
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isFullscreen) {
            console.log('ESC pressed, exiting game');
            exitGame();
        }
    });
    
    // Xử lý khi page được focus lại (tránh bị lock)
    window.addEventListener('focus', function() {
        if (!isFullscreen && document.body.classList.contains('game-fullscreen')) {
            console.log('Page refocused, restoring scroll');
            restoreBodyScroll();
        }
    });
}

// Gọi trong initializePage()
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
    setupOrientationListeners();
    setupFullscreenExitListeners(); // THÊM DÒNG NÀY
    
    console.log('✅ Page initialized');
}   
// Thêm vào main.js để debug
function checkScrollStatus() {
    console.log('=== SCROLL STATUS ===');
    console.log('Body overflow:', document.body.style.overflow);
    console.log('Body position:', document.body.style.position);
    console.log('HTML overflow:', document.documentElement.style.overflow);
    console.log('isFullscreen:', isFullscreen);
    console.log('Body has no-scroll class:', document.body.classList.contains('no-scroll'));
    console.log('Body has game-fullscreen class:', document.body.classList.contains('game-fullscreen'));
    console.log('========================');
}

// Có thể gọi sau khi exit game
// checkScrollStatus();

function debugUsers() {
    const users = JSON.parse(localStorage.getItem('pickleball_users') || '[]');
    console.log('=== DEBUG ALL USERS ===');
    console.log('Total users:', users.length);
    users.forEach((user, index) => {
        console.log(`User ${index + 1}:`, {
            username: user.username,
            email: user.email,
            passwordLength: user.password ? user.password.length : 'none',
            createdAt: new Date(user.createdAt).toLocaleString(),
            isAdmin: user.isAdmin || user.admin,
            isBanned: user.isBanned || user.banned
        });
    });
    console.log('=== END DEBUG ===');
}

// Có thể gọi từ console: debugUsers()
function toggleAuthMode(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const currentMode = document.getElementById('modalTitle').textContent.includes('Sign up') ? 'signup' : 'login';
    const newMode = currentMode === 'login' ? 'signup' : 'login';
    
    // Đóng modal hiện tại
    closeAuthModal();
    
    // Mở modal với mode mới sau delay
    setTimeout(() => {
        showAuthModal(newMode);
    }, 300);
    
    return false;
}
// Hash function - SAME AS userSystem.js
function simpleHash(password) {
    let hash = 5381;
    for (let i = 0; i < password.length; i++) {
        hash = (hash * 33) ^ password.charCodeAt(i);
    }
    return (hash >>> 0).toString(36);
}
// Thêm vào cuối file main.js, sau tất cả các hàm
function setupAuthFormEvents() {
    // Thêm sự kiện Enter cho auth form
    const authEmail = document.getElementById('authEmail');
    const authPassword = document.getElementById('authPassword');
    const authUsername = document.getElementById('authUsername');
    
    if (authEmail) {
        authEmail.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleAuthSubmit();
            }
        });
    }
    
    if (authPassword) {
        authPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleAuthSubmit();
            }
        });
    }
    
    if (authUsername) {
        authUsername.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleAuthSubmit();
            }
        });
    }
}

// Gọi trong initializePage()
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
    setupOrientationListeners();
    setupFullscreenExitListeners();
    setupAuthFormEvents(); // THÊM DÒNG NÀY
    
    console.log('✅ Page initialized');
}
// Thêm hàm kiểm tra fullscreen API
function checkFullscreenSupport() {
    const el = document.documentElement;
    return (
        el.requestFullscreen ||
        el.mozRequestFullScreen ||
        el.webkitRequestFullscreen ||
        el.msRequestFullscreen
    );
}

// Kiểm tra khi trang load
if (isMobileDevice && !checkFullscreenSupport()) {
    console.log('Fullscreen API not fully supported, using custom fullscreen');
}
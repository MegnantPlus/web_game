// admin.js - FIXED VERSION
// ============ ADMIN PANEL MANAGEMENT ============

// Load admin data
async function loadAdminData() {
    try {
        // Load users
        const usersResult = await window.userSystem.getUsers();
        if (usersResult.success) {
            window.adminUsers = usersResult.data || [];
        } else {
            window.adminUsers = [];
        }
        
        // Load updates
        const updatesResult = await window.userSystem.getUpdates();
        if (updatesResult.success) {
            window.adminUpdates = updatesResult.data || [];
        } else {
            window.adminUpdates = [];
        }
    } catch (error) {
        console.error('Failed to load admin data:', error);
        window.adminUsers = [];
        window.adminUpdates = [];
    }
}

// Toggle admin panel
function toggleAdminPanel() {
    const adminModal = document.getElementById('adminModal');
    if (adminModal.style.display === 'flex') {
        closeAdminModal();
    } else {
        openAdminModal();
    }
}

async function openAdminModal() {
    const adminModal = document.getElementById('adminModal');
    adminModal.style.display = 'flex';
    
    // Check if user is admin
    if (!window.userSystem.isAdmin()) {
        showNotification('Admin access required', 'error');
        closeAdminModal();
        return;
    }
    
    await loadAdminPanelData();
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
}

async function loadAdminPanelData() {
    await updateAdminStats();
    await loadUsersList();
    await loadAdminCommentsList();
}

async function updateAdminStats() {
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

// ============ USERS MANAGEMENT ============
async function loadUsersList() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    try {
        const result = await window.userSystem.getUsers();
        const currentUser = window.userSystem.getUser();
        
        if (result.success) {
            const users = result.data || [];
            
            if (users.length === 0) {
                usersList.innerHTML = '<div style="color: #aaa; text-align: center; padding: 30px;">No users found</div>';
                return;
            }
            
            usersList.innerHTML = users.map((user, index) => {
                const isCurrentUser = currentUser && user._id === currentUser._id;
                
                return `
                    <div class="user-item ${user.isBanned ? 'banned' : ''}" data-user-id="${user._id}" style="animation-delay: ${index * 0.1}s">
                        <div class="user-info">
                            <strong>${user.username} 
                                ${user.isAdmin ? '<span style="color: #2196F3; font-size: 0.8rem;">[ADMIN]</span>' : ''}
                            </strong>
                            <div class="user-details">
                                <small><i class="fas fa-envelope"></i> ${user.email || 'No email'}</small>
                                <small><i class="far fa-calendar"></i> ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown date'}</small>
                                ${user.isBanned ? 
                                    '<small style="color:#ff4757"><i class="fas fa-ban"></i> BANNED</small>' : 
                                    '<small><i class="far fa-check-circle"></i> Active</small>'
                                }
                            </div>
                        </div>
                        <div class="user-actions">
                            ${!isCurrentUser && !user.isAdmin ? `
                                ${user.isBanned ? 
                                    `<button class="unban-btn" onclick="unbanUser('${user._id}', '${user.username}')">
                                        <i class="fas fa-unlock"></i> Unban
                                    </button>` : 
                                    `<button class="ban-btn" onclick="banUser('${user._id}', '${user.username}')">
                                        <i class="fas fa-ban"></i> Ban
                                    </button>`
                                }
                            ` : ''}
                            
                            ${!isCurrentUser && !user.isAdmin ? `
                                <button class="delete-user-btn" onclick="deleteUser('${user._id}', '${user.username}')">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            usersList.innerHTML = '<div class="error" style="color: #ff4757; text-align: center; padding: 20px;">' + 
                                 (result.error || 'Failed to load users') + '</div>';
        }
    } catch (error) {
        console.error('Failed to load users:', error);
        usersList.innerHTML = '<div class="error" style="color: #ff4757; text-align: center; padding: 20px;">Error loading users: ' + error.message + '</div>';
    }
}

// ============ USER ACTIONS ============
async function banUser(userId, username) {
    if (!window.userSystem.isAdmin()) {
        showNotification('Admin only!', 'error');
        return;
    }
    
    console.log('🔍 Banning user:', userId);
    console.log('🔐 Current token:', window.userSystem.token ? 'Present' : 'Missing');
    console.log('👤 Current user:', window.userSystem.currentUser);
    
    showCustomConfirm(
        'Ban User',
        `Are you sure you want to ban user <strong>${username}</strong>?`,
        async () => {
            try {
                // Kiểm tra token trước khi gọi API
                if (!window.userSystem.token) {
                    showNotification('Please login again', 'error');
                    window.userSystem.clearToken();
                    window.location.reload();
                    return;
                }
                
                console.log('📡 Calling ban API...');
                const result = await window.userSystem.banUser(userId);
                console.log('📡 Ban result:', result);
                
                if (result.success) {
                    showNotification(result.message || 'User banned', 'success');
                    await loadUsersList();
                    await updateAdminStats();
                } else {
                    showNotification(result.error || 'Failed to ban user', 'error');
                    
                    // Nếu lỗi 401, clear token
                    if (result.error && result.error.includes('401')) {
                        window.userSystem.clearToken();
                        updateAuthUI();
                    }
                }
            } catch (error) {
                console.error('Ban user error:', error);
                showNotification('Failed to ban user: ' + error.message, 'error');
                
                // Nếu lỗi token, clear và reload
                if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                    window.userSystem.clearToken();
                    setTimeout(() => window.location.reload(), 1000);
                }
            }
        }
    );
}

async function unbanUser(userId, username) {
    showCustomConfirm(
        'Unban User',
        `Are you sure you want to unban user <strong>${username}</strong>?`,
        async () => {
            try {
                const result = await window.userSystem.banUser(userId); // Same endpoint toggles ban
                if (result.success) {
                    showNotification(result.message || 'User unbanned', 'success');
                    await loadUsersList();
                    await updateAdminStats();
                } else {
                    showNotification(result.error || 'Failed to unban user', 'error');
                }
            } catch (error) {
                showNotification('Failed to unban user', 'error');
            }
        }
    );
}

async function deleteUser(userId, username) {
    if (!window.userSystem.isAdmin()) {
        showNotification('Admin only!', 'error');
        return;
    }
    
    showCustomConfirm(
        'Delete User',
        `Are you sure you want to delete user <strong>${username}</strong> and ALL their comments?`,
        async () => {
            try {
                const result = await window.userSystem.deleteUser(userId);
                if (result.success) {
                    showNotification(result.message || 'User deleted', 'success');
                    await loadUsersList();
                    await updateAdminStats();
                    // Reload comments to reflect deletion
                    if (window.loadComments) {
                        await window.loadComments();
                    }
                } else {
                    showNotification(result.error || 'Failed to delete user', 'error');
                }
            } catch (error) {
                showNotification('Failed to delete user', 'error');
            }
        }
    );
}

// ============ COMMENTS MANAGEMENT ============
async function loadAdminCommentsList() {
    const commentsList = document.getElementById('adminCommentsList');
    if (!commentsList) return;
    
    try {
        const result = await window.userSystem.getComments();
        if (result.success) {
            const comments = result.data || [];
            
            // Flatten comments and replies
            const allComments = [];
            const flattenComments = (commentArray) => {
                commentArray.forEach(comment => {
                    allComments.push(comment);
                    if (comment.replies && comment.replies.length > 0) {
                        flattenComments(comment.replies);
                    }
                });
            };
            
            flattenComments(comments);
            
            commentsList.innerHTML = allComments.map(comment => {
                return `
                    <div class="admin-comment-item" data-comment-id="${comment._id}">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                            <div>
                                <strong>${comment.user?.username || 'Unknown'}</strong>
                                <small style="color: #888; margin-left: 10px;">
                                    ${new Date(comment.createdAt).toLocaleString()}
                                </small>
                                ${comment.depth > 0 ? 
                                    `<span style="background: #444; color: #aaa; padding: 2px 6px; border-radius: 3px; font-size: 0.8rem; margin-left: 10px;">
                                        Reply (Level ${comment.depth})
                                    </span>` : 
                                    '<span style="background: #2196F3; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8rem; margin-left: 10px;">Original</span>'
                                }
                            </div>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                            ${comment.content}
                        </div>
                        <button class="admin-delete-comment-btn" onclick="deleteCommentAdmin('${comment._id}')">
                            <i class="fas fa-trash"></i> Delete Comment
                        </button>
                    </div>
                `;
            }).join('');
        } else {
            commentsList.innerHTML = '<div class="error">Failed to load comments</div>';
        }
    } catch (error) {
        console.error('Failed to load comments:', error);
        commentsList.innerHTML = '<div class="error">Failed to load comments</div>';
    }
}

async function deleteCommentAdmin(commentId) {
    showCustomConfirm(
        'Delete Comment',
        'Are you sure you want to delete this comment?',
        async () => {
            try {
                // DÙNG ADMIN ENDPOINT: /api/admin/comments/:id
                const result = await window.userSystem.deleteCommentAdmin(commentId);
                
                if (result.success) {
                    showNotification('Comment deleted', 'success');
                    await loadAdminCommentsList();
                    await updateAdminStats();
                    
                    // Reload main comments
                    if (window.loadComments) {
                        await window.loadComments();
                    }
                } else {
                    showNotification(result.error || 'Failed to delete comment', 'error');
                    
                    // Debug thêm
                    console.error('Admin delete comment failed:', result);
                }
            } catch (error) {
                console.error('Delete comment error:', error);
                showNotification('Failed to delete comment: ' + error.message, 'error');
            }
        }
    );
}

// ============ TAB MANAGEMENT ============
function openAdminTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    event.target.closest('.admin-tab').classList.add('active');
    
    // Load data for the tab
    if (tabName === 'users') {
        loadUsersList();
    } else if (tabName === 'comments') {
        loadAdminCommentsList();
    } else if (tabName === 'notifications') {
        loadNotificationsList();
    }
}

// ============ SEARCH FUNCTIONS ============
function searchUsers() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    const userItems = document.querySelectorAll('.user-item');
    
    userItems.forEach(item => {
        const username = item.querySelector('strong').textContent.toLowerCase();
        const email = item.querySelector('.user-details small:first-child').textContent.toLowerCase();
        
        if (username.includes(searchTerm) || email.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function searchComments() {
    const searchTerm = document.getElementById('searchComment').value.toLowerCase();
    const commentItems = document.querySelectorAll('.admin-comment-item');
    
    commentItems.forEach(item => {
        const username = item.querySelector('strong').textContent.toLowerCase();
        const content = item.querySelector('div:nth-child(2)').textContent.toLowerCase();
        
        if (username.includes(searchTerm) || content.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// ============ NOTIFICATIONS MANAGEMENT ============
async function loadNotificationsList() {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;
    
    try {
        const result = await window.userSystem.getNotifications();
        if (result.success) {
            const notifications = result.data || [];
            
            if (notifications.length === 0) {
                notificationsList.innerHTML = '<div style="color: #aaa; text-align: center; padding: 30px;">No notifications yet</div>';
                return;
            }
            
            notificationsList.innerHTML = notifications.map(notification => {
                return `
                    <div class="notification-item" data-notification-id="${notification._id}">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                            <div>
                                <strong>${notification.title || 'No Title'}</strong>
                                <small style="color: #888; margin-left: 10px;">
                                    ${notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'Unknown date'}
                                </small>
                            </div>
                            <div>
                                <button class="reply-btn" onclick="showNotificationReplyForm('${notification._id}')" 
                                        style="background: rgba(33,150,243,0.1); border: 1px solid rgba(33,150,243,0.3); 
                                               color: #2196F3; padding: 5px 10px; border-radius: 5px; 
                                               font-size: 0.8rem; margin-right: 10px;">
                                    <i class="fas fa-reply"></i> Reply
                                </button>
                            </div>
                        </div>
                        <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            ${notification.content || ''}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <small style="color: #aaa;">
                                <i class="fas fa-user"></i> 
                                ${notification.author?.username || 'System'}
                            </small>
                            <button class="admin-delete-notification-btn" onclick="deleteNotificationAdmin('${notification._id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                        
                        <!-- Replies -->
                        ${notification.replies && notification.replies.length > 0 ? `
                            <div style="margin-top: 15px; padding-left: 20px; border-left: 2px solid rgba(255, 193, 7, 0.3);">
                                <h5 style="color: #aaa; margin-bottom: 10px; font-size: 0.9rem;">
                                    <i class="fas fa-reply"></i> Replies (${notification.replies.length})
                                </h5>
                                ${notification.replies.map(reply => `
                                    <div style="background: rgba(255, 255, 255, 0.03); padding: 10px; 
                                                border-radius: 6px; margin-bottom: 8px;">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                            <small style="color: #888;">
                                                <i class="fas fa-user"></i> ${reply.author?.username || 'System'}
                                            </small>
                                            <small style="color: #888;">
                                                ${reply.createdAt ? new Date(reply.createdAt).toLocaleString() : ''}
                                            </small>
                                        </div>
                                        <div>${reply.content || ''}</div>
                                        <div style="text-align: right; margin-top: 5px;">
                                            <button class="delete-reply-btn" onclick="deleteNotificationAdmin('${reply._id}')"
                                                    style="background: rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.3); 
                                                           color: #ff4757; padding: 3px 8px; border-radius: 4px; 
                                                           font-size: 0.75rem;">
                                                <i class="fas fa-trash"></i> Delete
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        } else {
            notificationsList.innerHTML = '<div class="error">' + (result.error || 'Failed to load notifications') + '</div>';
        }
    } catch (error) {
        console.error('Failed to load notifications:', error);
        notificationsList.innerHTML = '<div class="error">Failed to load notifications</div>';
    }
}

function showNotificationReplyForm(parentNotificationId) {
    window.showNotificationForm(parentNotificationId);
}

async function loadNotifications() {
    try {
        const result = await window.userSystem.getNotifications();
        if (result.success) {
            window.notificationsData = result.data || [];
            updateNotificationBadge();
        } else {
            window.notificationsData = [];
        }
    } catch (error) {
        console.error('Failed to load notifications:', error);
        window.notificationsData = [];
    }
}

function updateNotificationBadge() {
    if (!window.notificationsData || !window.notificationsData.length) return;
    
    // Tính số thông báo chưa đọc
    const unreadCount = window.notificationsData.filter(n => !n.read).length;
    
    // Tạo hoặc cập nhật badge
    let badge = document.getElementById('notificationBadge');
    
    if (unreadCount > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.id = 'notificationBadge';
            badge.className = 'notification-badge';
            badge.style.cssText = `
                background: #ff4757;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
                font-weight: bold;
                margin-left: 5px;
            `;
            
            // Thêm vào username nếu có
            const usernameDisplay = document.getElementById('usernameDisplay');
            if (usernameDisplay) {
                usernameDisplay.appendChild(badge);
            }
        }
        badge.textContent = unreadCount;
    } else if (badge) {
        badge.remove();
    }
}

// Gọi loadNotifications trong initializePage
async function initializePage() {
    console.log('🔄 Initializing page...');
    
    if (window.userSystem) {
        if (window.userSystem.token && !window.userSystem.currentUser) {
            try {
                await window.userSystem.loadUserFromToken();
            } catch (error) {
                window.userSystem.clearToken();
            }
        }
        
        currentUser = window.userSystem.getUser();
        console.log('✅ User loaded:', currentUser?.username || 'No user');
    }
    
    updateAuthUI();
    await loadComments();
    await loadUpdates();
    await loadNotifications(); // THÊM DÒNG NÀY
    
    setupSmoothScroll();
    setupFullscreenListener();
    setupOrientationListener();
    
    console.log('✅ Page initialized');
}

async function deleteNotificationAdmin(notificationId) {
    showCustomConfirm(
        'Delete Notification',
        'Are you sure you want to delete this notification?',
        async () => {
            try {
                const result = await window.userSystem.deleteNotification(notificationId);
                if (result.success) {
                    showNotification('Notification deleted', 'success');
                    await loadNotificationsList();
                } else {
                    showNotification(result.error || 'Failed to delete notification', 'error');
                }
            } catch (error) {
                showNotification('Failed to delete notification', 'error');
            }
        }
    );
}

// ============ GLOBAL EXPORTS ============
// Make functions available globally
window.toggleAdminPanel = toggleAdminPanel;
window.closeAdminModal = closeAdminModal;
window.openAdminTab = openAdminTab;
window.searchUsers = searchUsers;
window.searchComments = searchComments;
window.banUser = banUser;
window.unbanUser = unbanUser;
window.deleteUser = deleteUser;
window.deleteCommentAdmin = deleteCommentAdmin;
window.editUpdate = editUpdate;
window.deleteUpdateAdmin = deleteUpdateAdmin;
window.loadNotificationsList = loadNotificationsList;
window.deleteNotificationAdmin = deleteNotificationAdmin;
window.showNotificationReplyForm = showNotificationReplyForm;
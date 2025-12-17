// admin.js - Admin Panel Management (UPDATED FOR SIMPLE STRUCTURE WITH EMAIL)

// Load admin data
function loadAdminData() {
    // KHÔNG CẦN mảng bannedUsers riêng, tất cả đã có trong users[]
    adminUsers = JSON.parse(localStorage.getItem('pickleball_users') || '[]');
    adminUpdates = JSON.parse(localStorage.getItem('pickleball_updates') || '[]');
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

function openAdminModal() {
    const adminModal = document.getElementById('adminModal');
    adminModal.style.display = 'flex';
    
    // Ẩn nút exit và fullscreen
    if (typeof hideExitButton === 'function') hideExitButton();
    if (typeof hideFullscreenButton === 'function') hideFullscreenButton();
    
    loadAdminData();
    loadAdminPanelData();
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
    
    // Hiện lại nút exit nếu đang fullscreen
    if (isFullscreen && typeof showExitButton === 'function') {
        showExitButton();
    }
    
    // Hiện lại nút fullscreen nếu không fullscreen
    if (!isFullscreen && typeof showFullscreenButton === 'function') {
        showFullscreenButton();
    }
}

// Admin tabs
function openAdminTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    
    // Remove active from all tab buttons
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    const tabContent = document.getElementById(tabName + 'Tab');
    tabContent.classList.add('active');
    tabContent.style.display = 'block';
    
    // Add active to clicked tab
    event.target.classList.add('active');
    
    // Load tab data
    if (tabName === 'users') loadUsersList();
    else if (tabName === 'comments') loadAdminCommentsList();
    else if (tabName === 'updates') loadAdminUpdatesList();
}

// Load all admin data
function loadAdminPanelData() {
    updateAdminStats();
    loadUsersList();
    loadAdminCommentsList();
    loadAdminUpdatesList();
}

// Update admin stats - SIMPLIFIED
function updateAdminStats() {
    if (!currentUser || !currentUser.admin) return; // Check currentUser.admin
    
    loadAdminData();
    
    const totalUsers = adminUsers.filter(u => u.username !== 'Dmaster').length;
    const totalComments = window.commentsData ? window.commentsData.length : 0;
    const bannedUsers = adminUsers.filter(u => u.banned).length; // Count from users array
    const totalUpdates = adminUpdates.length;
    
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('totalComments').textContent = totalComments;
    document.getElementById('bannedUsers').textContent = bannedUsers;
    document.getElementById('totalUpdates').textContent = totalUpdates;
}

// Load users list - UPDATED WITH EMAIL DISPLAY
function loadUsersList() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    loadAdminData();
    
    // Filter out admin user
    const regularUsers = adminUsers.filter(user => user.username !== 'Dmaster');
    
    usersList.innerHTML = regularUsers.map((user, index) => {
        const commentCount = getUserComments(user.username);
        const userEmail = user.email || 'No email';
        const isBanned = user.banned || user.isBanned;
        
        return `
            <div class="user-item ${isBanned ? 'banned' : ''}" style="animation-delay: ${index * 0.1}s">
                <div class="user-info">
                    <strong>${user.username} 
                        ${user.admin || user.isAdmin ? '<span style="color: #2196F3; font-size: 0.8rem;">[ADMIN]</span>' : ''}
                    </strong>
                    <div class="user-details">
                        <small><i class="fas fa-envelope"></i> ${userEmail}</small>
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
                        `<button class="unban-btn" onclick="unbanUser('${user.id || user.username}')">
                            <i class="fas fa-unlock"></i> Unban
                        </button>` : 
                        `<button class="ban-btn" onclick="banUser('${user.id || user.username}')">
                            <i class="fas fa-ban"></i> Ban
                        </button>`
                    }
                    ${!(user.admin || user.isAdmin) ? 
                        `<button class="promote-btn" onclick="makeAdmin('${user.id || user.username}')">
                            <i class="fas fa-crown"></i> Make Admin
                        </button>` : 
                        `<button class="demote-btn" onclick="removeAdmin('${user.id || user.username}')">
                            <i class="fas fa-user"></i> Remove Admin
                        </button>`
                    }
                    <button class="delete-user-btn" onclick="deleteUser('${user.id || user.username}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Load admin comments list (giữ nguyên)
function loadAdminCommentsList() {
    const commentsList = document.getElementById('adminCommentsList');
    if (!commentsList) return;
    
    let allComments = [];
    
    // Collect all comments and replies
    if (window.commentsData) {
        window.commentsData.forEach(comment => {
            allComments.push({...comment, isReply: false});
            if (comment.replies) {
                comment.replies.forEach(reply => {
                    allComments.push({...reply, isReply: true, parentId: comment.id});
                });
            }
        });
    }
    
    // Sort by newest first
    allComments.sort((a, b) => b.timestamp - a.timestamp);
    
    commentsList.innerHTML = allComments.map(comment => {
        const isAdminComment = comment.author === 'Dmaster';
        
        return `
            <div class="admin-comment-item ${comment.isReply ? 'reply-item' : ''}">
                <div class="comment-header">
                    <div class="comment-author">
                        ${comment.author} 
                        ${isAdminComment ? '<span class="admin-badge">(admin)</span>' : ''}
                        ${comment.isReply ? '<span class="reply-badge">Reply</span>' : ''}
                    </div>
                    <div class="comment-time">
                        ${new Date(comment.timestamp).toLocaleString()}
                    </div>
                </div>
                <div class="comment-content">${comment.content}</div>
                <div class="comment-votes">
                    <span>Votes: ${comment.voteScore || 0}</span>
                </div>
                <button class="admin-delete-comment-btn" onclick="deleteCommentAsAdmin(${comment.id})">
                    <i class="fas fa-trash-alt"></i> Delete Comment
                </button>
            </div>
        `;
    }).join('');
}

// Load admin updates list (giữ nguyên)
function loadAdminUpdatesList() {
    const updatesList = document.getElementById('updatesList');
    if (!updatesList) return;
    
    loadAdminData();
    
    // Sort by newest first
    const sortedUpdates = [...adminUpdates].sort((a, b) => b.createdAt - a.createdAt);
    
    updatesList.innerHTML = sortedUpdates.map(update => {
        return `
            <div class="update-item">
                <h4>${update.title}</h4>
                <p>${update.content}</p>
                <div class="update-meta">
                    <small><i class="fas fa-user"></i> By: ${update.author}</small>
                    <small><i class="far fa-calendar"></i> Date: ${new Date(update.createdAt).toLocaleDateString()}</small>
                </div>
                <div class="update-actions">
                    <button class="edit-update-btn" onclick="editUpdatePrompt(${update.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-update-btn" onclick="deleteUpdatePrompt(${update.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Search functions (giữ nguyên)
function searchUsers() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    const userItems = document.querySelectorAll('.user-item');
    
    userItems.forEach(item => {
        const username = item.querySelector('strong').textContent.toLowerCase();
        const email = item.querySelector('.user-details small:nth-child(1)').textContent.toLowerCase();
        
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
        const content = item.querySelector('.comment-content').textContent.toLowerCase();
        const author = item.querySelector('.comment-author').textContent.toLowerCase();
        
        if (content.includes(searchTerm) || author.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Get user comments count (giữ nguyên)
function getUserComments(username) {
    if (!window.commentsData) return 0;
    
    let count = 0;
    window.commentsData.forEach(comment => {
        if (comment.author === username) count++;
        if (comment.replies) {
            comment.replies.forEach(reply => {
                if (reply.author === username) count++;
            });
        }
    });
    
    return count;
}

// Admin actions - UPDATED FOR SIMPLE STRUCTURE
function banUser(userIdentifier) {
    if (!currentUser || !currentUser.admin) { // Check currentUser.admin
        showNotification('Admin only!', 'error');
        return;
    }
    
    if (!confirm(`Ban user ${userIdentifier}? They will not be able to login.`)) return;
    
    loadAdminData();
    
    // Tìm user bằng id hoặc username
    const userIndex = adminUsers.findIndex(u => 
        u.id === userIdentifier || u.username === userIdentifier
    );
    
    if (userIndex !== -1 && !adminUsers[userIndex].banned && !adminUsers[userIndex].isBanned) {
        // Set banned: true
        adminUsers[userIndex].banned = true;
        adminUsers[userIndex].isBanned = true;
        localStorage.setItem('pickleball_users', JSON.stringify(adminUsers));
        
        // If user is currently logged in, log them out
        if (currentUser && 
            (currentUser.id === userIdentifier || currentUser.username === userIdentifier)) {
            logout();
        }
        
        showNotification(`User ${adminUsers[userIndex].username} banned!`, 'success');
        loadUsersList();
        updateAdminStats();
    }
}

function unbanUser(userIdentifier) {
    if (!currentUser || !currentUser.admin) {
        showNotification('Admin only!', 'error');
        return;
    }
    
    if (!confirm(`Unban user ${userIdentifier}?`)) return;
    
    loadAdminData();
    
    const userIndex = adminUsers.findIndex(u => 
        u.id === userIdentifier || u.username === userIdentifier
    );
    
    if (userIndex !== -1 && (adminUsers[userIndex].banned || adminUsers[userIndex].isBanned)) {
        // Set banned: false
        adminUsers[userIndex].banned = false;
        adminUsers[userIndex].isBanned = false;
        localStorage.setItem('pickleball_users', JSON.stringify(adminUsers));
        
        showNotification(`User ${adminUsers[userIndex].username} unbanned!`, 'success');
        loadUsersList();
        updateAdminStats();
    }
}

function makeAdmin(userIdentifier) {
    if (!currentUser || !currentUser.admin) {
        showNotification('Admin only!', 'error');
        return;
    }
    
    if (!confirm(`Make user ${userIdentifier} an admin?`)) return;
    
    loadAdminData();
    
    const userIndex = adminUsers.findIndex(u => 
        u.id === userIdentifier || u.username === userIdentifier
    );
    
    if (userIndex !== -1 && !adminUsers[userIndex].admin && !adminUsers[userIndex].isAdmin) {
        // Set admin: true
        adminUsers[userIndex].admin = true;
        adminUsers[userIndex].isAdmin = true;
        localStorage.setItem('pickleball_users', JSON.stringify(adminUsers));
        
        showNotification(`User ${adminUsers[userIndex].username} is now an admin!`, 'success');
        loadUsersList();
        updateAdminStats();
    }
}

function removeAdmin(userIdentifier) {
    if (!currentUser || !currentUser.admin) {
        showNotification('Admin only!', 'error');
        return;
    }
    
    // Don't allow removing admin from Dmaster
    if (userIdentifier === 'Dmaster' || userIdentifier === 'admin_001') {
        showNotification('Cannot remove admin from system administrator!', 'error');
        return;
    }
    
    if (!confirm(`Remove admin rights from ${userIdentifier}?`)) return;
    
    loadAdminData();
    
    const userIndex = adminUsers.findIndex(u => 
        u.id === userIdentifier || u.username === userIdentifier
    );
    
    if (userIndex !== -1 && (adminUsers[userIndex].admin || adminUsers[userIndex].isAdmin)) {
        // Set admin: false
        adminUsers[userIndex].admin = false;
        adminUsers[userIndex].isAdmin = false;
        localStorage.setItem('pickleball_users', JSON.stringify(adminUsers));
        
        showNotification(`Admin rights removed from ${adminUsers[userIndex].username}!`, 'success');
        loadUsersList();
        updateAdminStats();
    }
}

function deleteUser(userIdentifier) {
    if (!currentUser || !currentUser.admin) {
        showNotification('Admin only!', 'error');
        return;
    }
    
    // Don't allow deleting admin
    if (userIdentifier === 'Dmaster' || userIdentifier === 'admin_001') {
        showNotification('Cannot delete system administrator!', 'error');
        return;
    }
    
    if (!confirm(`Delete user ${userIdentifier} and all their comments? This cannot be undone.`)) return;
    
    loadAdminData();
    
    // Tìm user để lấy username
    const user = adminUsers.find(u => 
        u.id === userIdentifier || u.username === userIdentifier
    );
    
    if (!user) return;
    
    const username = user.username;
    
    // Remove from users
    adminUsers = adminUsers.filter(u => 
        u.id !== userIdentifier && u.username !== userIdentifier
    );
    localStorage.setItem('pickleball_users', JSON.stringify(adminUsers));
    
    // Delete user's comments
    if (window.commentsData) {
        window.commentsData = window.commentsData.filter(comment => comment.author !== username);
        window.commentsData.forEach(comment => {
            if (comment.replies) {
                comment.replies = comment.replies.filter(reply => reply.author !== username);
            }
        });
        localStorage.setItem('pickleball_comments', JSON.stringify(window.commentsData));
    }
    
    // If user is currently logged in, log them out
    if (currentUser && 
        (currentUser.id === userIdentifier || currentUser.username === userIdentifier)) {
        logout();
    }
    
    showNotification(`User ${username} deleted!`, 'success');
    loadUsersList();
    if (typeof renderComments === 'function') renderComments();
    updateAdminStats();
}

function deleteCommentAsAdmin(commentId) {
    if (!currentUser || !currentUser.admin) {
        showNotification('Admin only!', 'error');
        return;
    }
    
    if (!confirm('Delete this comment?')) return;
    
    // Find and delete comment
    if (window.commentsData) {
        const commentIndex = window.commentsData.findIndex(c => c.id === commentId);
        if (commentIndex > -1) {
            window.commentsData.splice(commentIndex, 1);
        } else {
            // Search in replies
            for (let comment of window.commentsData) {
                if (comment.replies) {
                    const replyIndex = comment.replies.findIndex(r => r.id === commentId);
                    if (replyIndex > -1) {
                        comment.replies.splice(replyIndex, 1);
                        break;
                    }
                }
            }
        }
        
        localStorage.setItem('pickleball_comments', JSON.stringify(window.commentsData));
    }
    
    showNotification('Comment deleted!', 'success');
    loadAdminCommentsList();
    if (typeof renderComments === 'function') renderComments();
    updateAdminStats();
}

function showAddUpdateForm() {
    if (!currentUser || !currentUser.admin) {
        showNotification('Admin only!', 'error');
        return;
    }
    
    // Dùng form modal mới
    if (typeof showUpdateForm === 'function') {
        showUpdateForm();
    } else {
        // Fallback nếu chưa có
        const title = prompt('Enter update title:');
        if (!title) return;
        
        const content = prompt('Enter update content:');
        if (!content) return;
        
        loadAdminData();
        
        const newUpdate = {
            id: Date.now(),
            title: title,
            content: content,
            author: currentUser.username,
            createdAt: Date.now(),
            isVisible: true
        };
        
        adminUpdates.unshift(newUpdate);
        localStorage.setItem('pickleball_updates', JSON.stringify(adminUpdates));
        
        showNotification('Update added!', 'success');
        loadAdminUpdatesList();
        if (typeof renderUpdates === 'function') renderUpdates();
        updateAdminStats();
    }
}

function editUpdatePrompt(updateId) {
    if (!currentUser || !currentUser.admin) {
        showNotification('Admin only!', 'error');
        return;
    }
    
    loadAdminData();
    
    const update = adminUpdates.find(u => u.id === updateId);
    if (!update) return;
    
    const newTitle = prompt('Enter new title:', update.title);
    if (!newTitle) return;
    
    const newContent = prompt('Enter new content:', update.content);
    if (!newContent) return;
    
    update.title = newTitle;
    update.content = newContent;
    update.updatedAt = Date.now();
    
    localStorage.setItem('pickleball_updates', JSON.stringify(adminUpdates));
    
    showNotification('Update edited!', 'success');
    loadAdminUpdatesList();
    if (typeof renderUpdates === 'function') renderUpdates();
}

function deleteUpdatePrompt(updateId) {
    if (!currentUser || !currentUser.admin) {
        showNotification('Admin only!', 'error');
        return;
    }
    
    if (!confirm('Delete this update?')) return;
    
    loadAdminData();
    
    adminUpdates = adminUpdates.filter(u => u.id !== updateId);
    localStorage.setItem('pickleball_updates', JSON.stringify(adminUpdates));
    
    showNotification('Update deleted!', 'success');
    loadAdminUpdatesList();
    if (typeof renderUpdates === 'function') renderUpdates();
    updateAdminStats();
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    // Make sure admin functions are available globally
    window.toggleAdminPanel = toggleAdminPanel;
    window.openAdminTab = openAdminTab;
    window.closeAdminModal = closeAdminModal;
    window.searchUsers = searchUsers;
    window.searchComments = searchComments;
    window.banUser = banUser;
    window.unbanUser = unbanUser;
    window.makeAdmin = makeAdmin;
    window.removeAdmin = removeAdmin;
    window.deleteUser = deleteUser;
    window.deleteCommentAsAdmin = deleteCommentAsAdmin;
    window.showAddUpdateForm = showAddUpdateForm;
    window.editUpdatePrompt = editUpdatePrompt;
    window.deleteUpdatePrompt = deleteUpdatePrompt;
});

// Auto-refresh admin panel khi mở
function refreshAdminPanel() {
    if (document.getElementById('adminModal').style.display === 'flex') {
        loadAdminPanelData();
    }
}

// Refresh mỗi 5 giây
setInterval(refreshAdminPanel, 5000);

// Khai báo biến toàn cục
let adminUsers = [];
let adminUpdates = [];
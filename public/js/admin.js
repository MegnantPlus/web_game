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
    loadAdminData();
    loadAdminPanelData();
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
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
    
    usersList.innerHTML = adminUsers.map((user, index) => {
        const isAdmin = user.admin || user.isAdmin;
        const isBanned = user.banned || user.isBanned;
        const isSystemAdmin = user.isSystemAdmin;
        
        return `
            <div class="user-item ${isBanned ? 'banned' : ''}" style="animation-delay: ${index * 0.1}s">
                <div class="user-info">
                    <strong>${user.username} 
                        ${isAdmin ? '<span style="color: #2196F3; font-size: 0.8rem;">[ADMIN]</span>' : ''}
                        ${isSystemAdmin ? '<span style="color: #8f4cc5; font-size: 0.8rem;">[SYSTEM]</span>' : ''}
                    </strong>
                    <div class="user-details">
                        <small><i class="fas fa-envelope"></i> ${user.email || 'No email'}</small>
                        <small><i class="far fa-calendar"></i> ${new Date(user.createdAt).toLocaleDateString()}</small>
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
                    ${!isAdmin && !isSystemAdmin ? 
                        `<button class="promote-btn" onclick="makeAdmin('${user.id || user.username}')">
                            <i class="fas fa-crown"></i> Make Admin
                        </button>` : 
                        !isSystemAdmin ?
                        `<button class="demote-btn" onclick="removeAdmin('${user.id || user.username}')">
                            <i class="fas fa-user"></i> Remove Admin
                        </button>` : ''
                    }
                    ${!isSystemAdmin ? 
                        `<button class="delete-user-btn" onclick="deleteUser('${user.id || user.username}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>` : ''
                    }
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
    // Kiểm tra bằng ID hoặc isSystemAdmin flag thay vì username
    loadAdminData();
    
    const user = adminUsers.find(u => 
        u.id === userIdentifier || u.username === userIdentifier
    );
    
    if (!user) return;
    
    // Kiểm tra nếu là system admin (thêm property mới)
    if (user.isSystemAdmin) {
        showNotification('Cannot remove system administrator!', 'error');
        return;
    }
    
    if (confirm(`Remove admin rights from ${user.username}?`)) {
        // Gọi API hoặc xử lý local
        user.admin = false;
        user.isAdmin = false;
        localStorage.setItem('pickleball_users', JSON.stringify(adminUsers));
        showNotification(`Admin rights removed from ${user.username}!`, 'success');
        loadUsersList();
    }
}


function deleteUser(userIdentifier) {
    if (!currentUser || !currentUser.admin) {
        showNotification('Admin only!', 'error');
        return;
    }
    
    loadAdminData();
    
    // Tìm user để lấy thông tin
    const user = adminUsers.find(u => 
        u.id === userIdentifier || u.username === userIdentifier
    );
    
    if (!user) return;
    
    // KHÔNG kiểm tra username cụ thể nữa
    // Thay vào đó kiểm tra isSystemAdmin hoặc firstAdmin flag
    if (user.isSystemAdmin) {
        showNotification('Cannot delete system administrator!', 'error');
        return;
    }
    
    // Không cho xóa chính mình
    if (currentUser && 
        (currentUser.id === userIdentifier || currentUser.username === userIdentifier)) {
        showNotification('You cannot delete your own account!', 'error');
        return;
    }
    
    // Không cho xóa admin khác (tùy chọn - bỏ nếu muốn)
    if ((user.admin || user.isAdmin) && !confirm(`WARNING: ${user.username} is an admin. Delete anyway?`)) {
        return;
    }
    
    if (!confirm(`Delete user ${user.username} and all their comments? This cannot be undone.`)) return;
    
    const username = user.username;
    
    // Remove from users
    adminUsers = adminUsers.filter(u => 
        u.id !== userIdentifier && u.username !== userIdentifier
    );
    localStorage.setItem('pickleball_users', JSON.stringify(adminUsers));
    
    // Delete user's comments
    if (window.commentsData) {
        // Xóa comments chính
        window.commentsData = window.commentsData.filter(comment => comment.author !== username);
        
        // Xóa replies của user trong các comment khác
        window.commentsData.forEach(comment => {
            if (comment.replies) {
                comment.replies = comment.replies.filter(reply => reply.author !== username);
            }
        });
        localStorage.setItem('pickleball_comments', JSON.stringify(window.commentsData));
    }
    
    // Nếu user đang login, logout họ
    const sessionUsername = localStorage.getItem('pickleball_session');
    if (sessionUsername === username) {
        localStorage.removeItem('pickleball_session');
        // Refresh page để logout
        if (!currentUser || currentUser.username === username) {
            location.reload();
        }
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
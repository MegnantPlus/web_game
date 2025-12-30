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
    await loadAdminUpdatesList();
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
                                <small><i class="far fa-calendar"></i> ${new Date(user.createdAt).toLocaleDateString()}</small>
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
                            
                            ${!isCurrentUser ? `
                                ${user.isAdmin ? 
                                    `<button class="demote-btn" onclick="removeAdmin('${user._id}', '${user.username}')">
                                        <i class="fas fa-user"></i> Remove Admin
                                    </button>` : 
                                    `<button class="promote-btn" onclick="makeAdmin('${user._id}', '${user.username}')">
                                        <i class="fas fa-crown"></i> Make Admin
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
            usersList.innerHTML = '<div class="error">Failed to load users</div>';
        }
    } catch (error) {
        console.error('Failed to load users:', error);
        usersList.innerHTML = '<div class="error">Failed to load users</div>';
    }
}

// ============ USER ACTIONS ============
async function banUser(userId, username) {
    if (!window.userSystem.isAdmin()) {
        showNotification('Admin only!', 'error');
        return;
    }
    
    showCustomConfirm(
        'Ban User',
        `Are you sure you want to ban user <strong>${username}</strong>?`,
        async () => {
            try {
                const result = await window.userSystem.banUser(userId);
                if (result.success) {
                    showNotification(result.message || 'User banned', 'success');
                    await loadUsersList();
                    await updateAdminStats();
                } else {
                    showNotification(result.error || 'Failed to ban user', 'error');
                }
            } catch (error) {
                showNotification('Failed to ban user', 'error');
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

async function makeAdmin(userId, username) {
    if (!window.userSystem.isAdmin()) {
        showNotification('Admin only!', 'error');
        return;
    }
    
    showCustomConfirm(
        'Make Admin',
        `Are you sure you want to make <strong>${username}</strong> an admin?`,
        async () => {
            try {
                const result = await window.userSystem.promoteUser(userId);
                if (result.success) {
                    showNotification(result.message || 'User promoted to admin', 'success');
                    await loadUsersList();
                } else {
                    showNotification(result.error || 'Failed to promote user', 'error');
                }
            } catch (error) {
                showNotification('Failed to promote user', 'error');
            }
        }
    );
}

async function removeAdmin(userId, username) {
    showCustomConfirm(
        'Remove Admin',
        `Are you sure you want to remove admin privileges from <strong>${username}</strong>?`,
        async () => {
            try {
                // Note: You need to implement demoteUser in userSystem.js
                // For now, we'll use the same endpoint or create a new one
                const result = await window.userSystem.promoteUser(userId); // This should be demote
                if (result && result.success) {
                    showNotification('Admin privileges removed', 'success');
                    await loadUsersList();
                } else {
                    showNotification('Failed to remove admin', 'error');
                }
            } catch (error) {
                showNotification('Failed to remove admin', 'error');
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
                const result = await window.userSystem.deleteComment(commentId);
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
                }
            } catch (error) {
                showNotification('Failed to delete comment', 'error');
            }
        }
    );
}

// ============ UPDATES MANAGEMENT ============
async function loadAdminUpdatesList() {
    const updatesList = document.getElementById('updatesList');
    if (!updatesList) return;
    
    try {
        const result = await window.userSystem.getUpdates();
        if (result.success) {
            const updates = result.data || [];
            
            updatesList.innerHTML = updates.map(update => {
                return `
                    <div class="update-item" data-update-id="${update._id}">
                        <h4>${update.title}</h4>
                        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 5px; margin: 10px 0;">
                            ${update.content.substring(0, 200)}${update.content.length > 200 ? '...' : ''}
                        </div>
                        <div class="update-meta">
                            <small><i class="fas fa-user"></i> ${update.author}</small>
                            <small><i class="far fa-calendar"></i> ${new Date(update.createdAt).toLocaleDateString()}</small>
                        </div>
                        <div class="update-actions">
                            <button class="edit-update-btn" onclick="editUpdate('${update._id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="delete-update-btn" onclick="deleteUpdateAdmin('${update._id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            updatesList.innerHTML = '<div class="error">Failed to load updates</div>';
        }
    } catch (error) {
        console.error('Failed to load updates:', error);
        updatesList.innerHTML = '<div class="error">Failed to load updates</div>';
    }
}

async function deleteUpdateAdmin(updateId) {
    showCustomConfirm(
        'Delete Update',
        'Are you sure you want to delete this update?',
        async () => {
            try {
                const result = await window.userSystem.deleteUpdate(updateId);
                if (result.success) {
                    showNotification('Update deleted', 'success');
                    await loadAdminUpdatesList();
                    await updateAdminStats();
                    // Reload main updates
                    if (window.loadUpdates) {
                        await window.loadUpdates();
                    }
                } else {
                    showNotification(result.error || 'Failed to delete update', 'error');
                }
            } catch (error) {
                showNotification('Failed to delete update', 'error');
            }
        }
    );
}

async function editUpdate(updateId) {
    try {
        const result = await window.userSystem.getUpdates();
        if (result.success) {
            const update = result.data.find(u => u._id === updateId);
            if (update) {
                showEditUpdateForm(update._id, update.title, update.content);
            }
        }
    } catch (error) {
        showNotification('Failed to load update for editing', 'error');
    }
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
    } else if (tabName === 'updates') {
        loadAdminUpdatesList();
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

// ============ GLOBAL EXPORTS ============
// Make functions available globally
window.toggleAdminPanel = toggleAdminPanel;
window.closeAdminModal = closeAdminModal;
window.openAdminTab = openAdminTab;
window.searchUsers = searchUsers;
window.searchComments = searchComments;
window.banUser = banUser;
window.unbanUser = unbanUser;
window.makeAdmin = makeAdmin;
window.removeAdmin = removeAdmin;
window.deleteUser = deleteUser;
window.deleteCommentAdmin = deleteCommentAdmin;
window.editUpdate = editUpdate;
window.deleteUpdateAdmin = deleteUpdateAdmin;
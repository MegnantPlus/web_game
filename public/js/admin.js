// admin.js - UPDATED FOR API
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

async function loadUsersList() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    try {
        const result = await window.userSystem.getUsers();
        if (result.success) {
            const users = result.data;
            
            usersList.innerHTML = users.map((user, index) => {
                return `
                    <div class="user-item ${user.isBanned ? 'banned' : ''}" style="animation-delay: ${index * 0.1}s">
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
                            ${user.isBanned ? 
                                `<button class="unban-btn" onclick="unbanUser('${user._id}')">
                                    <i class="fas fa-unlock"></i> Unban
                                </button>` : 
                                `<button class="ban-btn" onclick="banUser('${user._id}')">
                                    <i class="fas fa-ban"></i> Ban
                                </button>`
                            }
                            ${!user.isAdmin && currentUser._id !== user._id ? 
                                `<button class="promote-btn" onclick="makeAdmin('${user._id}')">
                                    <i class="fas fa-crown"></i> Make Admin
                                </button>` : 
                                user.isAdmin && currentUser._id !== user._id ?
                                `<button class="demote-btn" onclick="removeAdmin('${user._id}')">
                                    <i class="fas fa-user"></i> Remove Admin
                                </button>` : ''
                            }
                            ${currentUser._id !== user._id && !user.isAdmin ? 
                                `<button class="delete-user-btn" onclick="deleteUser('${user._id}')">
                                    <i class="fas fa-trash"></i> Delete
                                </button>` : ''
                            }
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Failed to load users:', error);
        usersList.innerHTML = '<div class="error">Failed to load users</div>';
    }
}

// Admin actions
async function banUser(userId) {
    if (!window.userSystem.isAdmin()) {
        showNotification('Admin only!', 'error');
        return;
    }
    
    showCustomConfirm(
        'Ban User',
        'Are you sure you want to ban this user?',
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

async function unbanUser(userId) {
    // Note: This uses the same endpoint (toggle ban/unban)
    await banUser(userId);
}

// Similar updates for makeAdmin, removeAdmin, deleteUser functions
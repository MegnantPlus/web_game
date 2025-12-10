// admin.js - Admin Panel Management
class AdminPanel {
    constructor() {
        this.initialize();
    }
    
    initialize() {
        this.loadEventListeners();
    }
    
    loadEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('admin-delete-comment-btn')) {
                const commentId = parseInt(e.target.closest('.comment-item').dataset.id);
                this.deleteCommentAsAdmin(commentId);
            }
        });
    }
    
    loadAdminPanelData() {
        if (!userSystem.isAdmin()) return;
        
        this.loadUsersList();
        this.loadAdminCommentsList();
        this.loadAdminUpdatesList();
        this.updateAdminStats();
    }
    
    updateAdminStats() {
        if (!userSystem.isAdmin()) return;
        
        const totalUsers = userSystem.getAllUsers().length;
        const totalComments = commentsSystem.getTotalComments();
        const bannedUsers = userSystem.bannedUsers.length;
        const totalUpdates = userSystem.updates.length;
        
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalComments').textContent = totalComments;
        document.getElementById('bannedUsers').textContent = bannedUsers;
        document.getElementById('totalUpdates').textContent = totalUpdates;
    }
    
    loadUsersList() {
        if (!userSystem.isAdmin()) return;
        
        const usersList = document.getElementById('usersList');
        const allUsers = userSystem.getAllUsers();
        
        usersList.innerHTML = allUsers.map((user, index) => {
            const isBanned = userSystem.isBanned(user.username);
            const commentCount = commentsSystem.getUserComments(user.username);
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
    
    loadAdminCommentsList() {
        if (!userSystem.isAdmin()) return;
        
        const commentsList = document.getElementById('adminCommentsList');
        if (!commentsList) return;
        
        let allComments = [];
        
        // Collect all comments and replies
        commentsSystem.comments.forEach(comment => {
            allComments.push({...comment, isReply: false});
            if (comment.replies && comment.replies.length > 0) {
                comment.replies.forEach(reply => {
                    allComments.push({...reply, isReply: true});
                });
            }
        });
        
        // Sort by newest first
        allComments.sort((a, b) => b.timestamp - a.timestamp);
        
        commentsList.innerHTML = allComments.map(comment => {
            const isAdminUser = userSystem.users.find(u => u.username === comment.author)?.isAdmin === true;
            
            return `
                <div class="admin-comment-item ${comment.isReply ? 'reply-item' : ''}">
                    <div class="comment-header">
                        <div class="comment-author">
                            ${comment.author} 
                            ${isAdminUser ? '<span class="admin-badge">(admin)</span>' : ''}
                            ${comment.isReply ? '<span class="reply-badge">Reply</span>' : ''}
                        </div>
                        <div class="comment-time">
                            ${new Date(comment.timestamp).toLocaleString()}
                        </div>
                    </div>
                    <div class="comment-content">${comment.content}</div>
                    <div class="comment-votes">
                        <span>Votes: ${comment.voteScore}</span>
                    </div>
                    <button class="admin-delete-comment-btn" data-id="${comment.id}">
                        <i class="fas fa-trash-alt"></i> Delete Comment
                    </button>
                </div>
            `;
        }).join('');
    }
    
    loadAdminUpdatesList() {
        if (!userSystem.isAdmin()) return;
        
        const updatesList = document.getElementById('updatesList');
        const updates = userSystem.updates;
        
        // Sort by newest first
        updates.sort((a, b) => b.createdAt - a.createdAt);
        
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
    
    searchUsers() {
        const searchTerm = document.getElementById('searchUser').value.toLowerCase().trim();
        const userItems = document.querySelectorAll('.user-item');
        
        userItems.forEach(item => {
            const username = item.querySelector('strong').textContent.toLowerCase();
            const userDetails = item.querySelector('.user-details').textContent.toLowerCase();
            
            if (username.includes(searchTerm) || userDetails.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    searchComments() {
        const searchTerm = document.getElementById('searchComment').value.toLowerCase().trim();
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
    
    deleteCommentAsAdmin(commentId) {
        if (!userSystem.isAdmin()) {
            showCustomAlert('Error', 'Admin only!', 'error');
            return;
        }
        
        showCustomConfirm(
            'Delete Comment as Admin',
            'Are you sure you want to delete this comment?',
            () => {
                commentsSystem.deleteComment(commentId);
                showCustomAlert('Success', 'Comment deleted!', 'success');
                
                // Reload all comment lists
                this.loadAdminCommentsList();
                if (window.renderComments) renderComments();
                this.updateAdminStats();
            }
        );
    }
}

// Create global instance
window.adminPanel = new AdminPanel();
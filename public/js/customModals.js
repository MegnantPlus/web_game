// customModals.js - Custom Form and Confirm Modals (FIXED VERSION)
// THÊM hàm này vào customModals.js (trước showUpdateForm)
function validateInput(text, minLength, maxLength, fieldName) {
    if (!text || text.trim().length === 0) {
        return `${fieldName} cannot be empty`;
    }
    if (text.length < minLength) {
        return `${fieldName} must be at least ${minLength} characters`;
    }
    if (text.length > maxLength) {
        return `${fieldName} must be less than ${maxLength} characters`;
    }
    return null;
}
// ===== UPDATE FORM MODAL =====
function showUpdateForm() {
    const modal = document.createElement('div');
    modal.className = 'custom-modal-overlay';
    modal.id = 'updateFormModal';
    
    modal.innerHTML = `
        <div class="custom-modal">
            <div class="modal-header">
                <h2><i class="fas fa-plus-circle"></i> Add New Update</h2>
                <button class="modal-close-btn" onclick="closeUpdateForm()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="form-group">
                    <label for="updateTitle">
                        <i class="fas fa-heading"></i> Title
                    </label>
                    <input type="text" 
                           id="updateTitle" 
                           class="form-input" 
                           placeholder="Enter update title..."
                           maxlength="100">
                    <div class="char-count">
                        <span id="titleCharCount">0</span>/100 characters
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="updateContent">
                        <i class="fas fa-align-left"></i> Content
                    </label>
                    <textarea id="updateContent" 
                              class="form-textarea" 
                              placeholder="Enter update content..."
                              rows="6"></textarea>
                    <div class="char-count">
                        <span id="contentCharCount">0</span>/5000 characters
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="cancel-btn" onclick="closeUpdateForm()">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="submit-btn" onclick="submitUpdate()">
                    <i class="fas fa-check"></i> Add Update
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add character counters
    const titleInput = document.getElementById('updateTitle');
    const contentInput = document.getElementById('updateContent');
    const titleCounter = document.getElementById('titleCharCount');
    const contentCounter = document.getElementById('contentCharCount');
    
    titleInput.addEventListener('input', () => {
        titleCounter.textContent = titleInput.value.length;
    });
    
    contentInput.addEventListener('input', () => {
        contentCounter.textContent = contentInput.value.length;
    });
    
    // Focus on title input
    setTimeout(() => titleInput.focus(), 100);
}

function closeUpdateForm() {
    const modal = document.getElementById('updateFormModal');
    if (modal) {
        modal.style.animation = 'modalFadeOut 0.3s ease forwards';
        setTimeout(() => modal.remove(), 300);
    }
}

// ===== NOTIFICATION FORM MODAL =====
function showNotificationForm() {
    const modal = document.createElement('div');
    modal.className = 'custom-modal-overlay';
    modal.id = 'notificationFormModal';
    
    modal.innerHTML = `
        <div class="custom-modal">
            <div class="modal-header">
                <h2><i class="fas fa-bell"></i> Add Notification</h2>
                <button class="modal-close-btn" onclick="closeCustomModal('notificationFormModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="form-group">
                    <label for="notificationName">
                        <i class="fas fa-tag"></i> Notification Name
                    </label>
                    <input type="text" 
                           id="notificationName" 
                           class="form-input" 
                           placeholder="Enter notification name..."
                           value="Thông báo cơ bản"
                           maxlength="50">
                    <div class="char-count">
                        <span id="notificationNameCharCount">15</span>/50 characters
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="notificationTitle">
                        <i class="fas fa-heading"></i> Title
                    </label>
                    <input type="text" 
                           id="notificationTitle" 
                           class="form-input" 
                           placeholder="Enter notification title..."
                           maxlength="100">
                    <div class="char-count">
                        <span id="notificationTitleCharCount">0</span>/100 characters
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="notificationContent">
                        <i class="fas fa-align-left"></i> Content
                    </label>
                    <textarea id="notificationContent" 
                              class="form-textarea" 
                              placeholder="Enter notification content..."
                              rows="4"></textarea>
                    <div class="char-count">
                        <span id="notificationContentCharCount">0</span>/500 characters
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="cancel-btn" onclick="closeCustomModal('notificationFormModal')">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="submit-btn" onclick="submitNotification()">
                    <i class="fas fa-check"></i> Send Notification
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Character counters
    const nameInput = document.getElementById('notificationName');
    const titleInput = document.getElementById('notificationTitle');
    const contentInput = document.getElementById('notificationContent');
    const nameCounter = document.getElementById('notificationNameCharCount');
    const titleCounter = document.getElementById('notificationTitleCharCount');
    const contentCounter = document.getElementById('notificationContentCharCount');
    
    nameInput.addEventListener('input', () => {
        nameCounter.textContent = nameInput.value.length;
    });
    
    titleInput.addEventListener('input', () => {
        titleCounter.textContent = titleInput.value.length;
    });
    
    contentInput.addEventListener('input', () => {
        contentCounter.textContent = contentInput.value.length;
    });
    
    setTimeout(() => nameInput.focus(), 100);
}

async function submitNotification() {
    const name = document.getElementById('notificationName').value.trim();
    const title = document.getElementById('notificationTitle').value.trim();
    const content = document.getElementById('notificationContent').value.trim();
    
    if (!name || !title || !content) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (!window.userSystem.isAdmin()) {
        showNotification('Admin access required', 'error');
        return;
    }
    
    try {
        const result = await window.userSystem.createNotification(title, content, name);
        if (result.success) {
            closeCustomModal('notificationFormModal');
            if (typeof loadNotificationsList === 'function') {
                await loadNotificationsList();
            }
            showNotification('Notification sent!', 'success');
        } else {
            showNotification(result.error || 'Failed to send notification', 'error');
        }
    } catch (error) {
        showNotification('Failed to send notification', 'error');
    }
}

// ============ UPDATES ============
async function loadUpdates() {
    try {
        const result = await window.userSystem.getUpdates();
        if (result.success) {
            window.updatesData = result.data || [];
            renderUpdates();
        } else {
            window.updatesData = [];
            renderUpdates();
        }
    } catch (error) {
        console.error('Failed to load updates:', error);
        window.updatesData = [];
        renderUpdates();
    }
}

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

// Make functions available globally
window.showUpdateForm = showUpdateForm;
window.closeUpdateForm = closeUpdateForm;
window.submitUpdate = submitUpdate;

function closeCustomModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.animation = 'modalFadeOut 0.3s ease forwards';
        setTimeout(() => modal.remove(), 300);
    }
}

function submitCustomUpdate() {
    const title = document.getElementById('updateTitle').value.trim();
    const content = document.getElementById('updateContent').value.trim();
    
    if (!title) {
        showCustomAlert('Error', 'Please enter a title for the update!', 'error');
        document.getElementById('updateTitle').focus();
        return;
    }
    
    if (!content) {
        showCustomAlert('Error', 'Please enter content for the update!', 'error');
        document.getElementById('updateContent').focus();
        return;
    }
    
    if (title.length < 3) {
        showCustomAlert('Error', 'Title must be at least 3 characters!', 'error');
        return;
    }
    
    // 🔴 SỬA LỖI: Thay Acontent bằng content
    const updateResult = userSystem.addUpdate(title, content);
    if (updateResult) {  // updateResult là object hoặc false
        closeCustomModal('updateFormModal');
        if (window.loadAdminUpdatesList) loadAdminUpdatesList();
        if (window.showUpdatesSection) showUpdatesSection();
        if (window.updateAdminStats) updateAdminStats();
        showCustomAlert('Success', 'Update added successfully!', 'success');
    } else {
        showCustomAlert('Error', 'Failed to add update. Admin only!', 'error');

        if (window.loadAdminUpdatesList) loadAdminUpdatesList();
        if (window.showUpdatesSection) showUpdatesSection();
        if (window.updateAdminStats) updateAdminStats();
        showCustomAlert('Success', 'Update added successfully!', 'success');
    }
}

// ===== CUSTOM CONFIRM MODAL =====
function showCustomConfirm(title, message, onConfirm, onCancel = null) {
    const modal = document.createElement('div');
    modal.className = 'custom-modal-overlay';
    modal.id = 'confirmModal';
    
    modal.innerHTML = `
        <div class="custom-modal confirm-modal">
            <div class="modal-header" style="border-bottom-color: #FF9800">
                <h2><i class="fas fa-exclamation-triangle" style="color: #FF9800"></i> ${title}</h2>
                <button class="modal-close-btn" onclick="closeCustomModal('confirmModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="confirm-icon">
                    <i class="fas fa-question-circle" style="color: #FF9800; font-size: 4rem;"></i>
                </div>
                <p class="confirm-message" style="text-align: center; color: #ddd; font-size: 1.1rem; line-height: 1.5;">
                    ${message}
                </p>
            </div>
            
            <div class="modal-footer" style="justify-content: center; gap: 20px;">
                <button class="cancel-btn" onclick="handleCancelConfirm()" 
                        style="background: rgba(255, 255, 255, 0.1); color: #aaa;">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="confirm-btn" onclick="handleConfirmAction()" 
                        style="background: linear-gradient(135deg, #ff4757, #ff3838); color: white;">
                    <i class="fas fa-check"></i> Confirm
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Store callbacks globally
    window.confirmCallback = onConfirm;
    window.cancelCallback = onCancel;
}

function handleConfirmAction() {
    if (window.confirmCallback) {
        window.confirmCallback();
    }
    closeCustomModal('confirmModal');
}

function handleCancelConfirm() {
    if (window.cancelCallback) {
        window.cancelCallback();
    }
    closeCustomModal('confirmModal');
}

function closeCustomModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.animation = 'modalFadeOut 0.3s ease forwards';
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 300);
    }
}

function handleConfirmAction() {
    if (window.confirmCallback) {
        window.confirmCallback();
        window.confirmCallback = null;
    }
    closeCustomModal('confirmModal');
}

// ============ CUSTOM ALERT MODAL ============
function showCustomAlert(title, message, type = 'info') {
    const colors = {
        'success': '#4CAF50',
        'error': '#ff4757',
        'warning': '#FF9800',
        'info': '#2196F3'
    };
    
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    
    const modal = document.createElement('div');
    modal.className = 'custom-modal-overlay';
    modal.id = 'alertModal';
    
    modal.innerHTML = `
        <div class="custom-modal" style="max-width: 400px;">
            <div class="modal-header" style="border-bottom-color: ${colors[type]}">
                <h2><i class="fas ${icons[type]}" style="color: ${colors[type]}"></i> ${title}</h2>
                <button class="modal-close-btn" onclick="closeCustomModal('alertModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <p style="color: #ddd; text-align: center; font-size: 1.1rem;">${message}</p>
            </div>
            
            <div class="modal-footer" style="justify-content: center;">
                <button class="ok-btn" onclick="closeCustomModal('alertModal')"
                        style="background: ${colors[type]}; color: white; min-width: 100px;">
                    OK
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ============ CUSTOM EDIT UPDATE FORM ============
function showEditUpdateForm(updateId) {
    console.log('DEBUG: showEditUpdateForm called with ID:', updateId);
    console.log('DEBUG: userSystem exists?', typeof userSystem);
    console.log('DEBUG: all updates:', userSystem ? userSystem.updates : 'no userSystem');
    
    // Chuyển updateId thành số (tránh lỗi string/number)
    const id = parseInt(updateId);
    console.log('DEBUG: Parsed ID:', id);
    
    const update = userSystem.updates.find(u => u.id === id);
    console.log('DEBUG: Found update:', update);
    
    if (!update) {
        console.error('DEBUG: Update not found:', id);
        showCustomAlert('Error', 'Update not found!', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'custom-modal-overlay';
    modal.id = 'editUpdateFormModal';
    
    modal.innerHTML = `
        <div class="custom-modal">
            <div class="modal-header">
                <h2><i class="fas fa-edit"></i> Edit Update</h2>
                <button class="modal-close-btn" onclick="closeCustomModal('editUpdateFormModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="form-group">
                    <label for="editUpdateTitle">
                        <i class="fas fa-heading"></i> Title
                    </label>
                    <input type="text" 
                           id="editUpdateTitle" 
                           class="form-input" 
                           value="${update.title.replace(/"/g, '&quot;')}"
                           placeholder="Enter update title..."
                           maxlength="100">
                    <div class="char-count">
                        <span id="editTitleCharCount">${update.title.length}</span>/100 characters
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="editUpdateContent">
                        <i class="fas fa-align-left"></i> Content
                    </label>
                    <textarea id="editUpdateContent" 
                              class="form-textarea" 
                              placeholder="Enter update content..."
                              rows="6">${update.content}</textarea>
                    <div class="char-count">
                        <span id="editContentCharCount">${update.content.length}</span>/5000 characters
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="cancel-btn" onclick="closeCustomModal('editUpdateFormModal')">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="submit-btn" onclick="submitEditUpdate(${id})">
                    <i class="fas fa-save"></i> Save Changes
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add character counters
    const titleInput = document.getElementById('editUpdateTitle');
    const contentInput = document.getElementById('editUpdateContent');
    const titleCounter = document.getElementById('editTitleCharCount');
    const contentCounter = document.getElementById('editContentCharCount');
    
    titleInput.addEventListener('input', () => {
        titleCounter.textContent = titleInput.value.length;
    });
    
    contentInput.addEventListener('input', () => {
        contentCounter.textContent = contentInput.value.length;
    });
    
    // Focus on title input
    setTimeout(() => titleInput.focus(), 100);
    
    console.log('DEBUG: Modal created successfully');
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


// ============ CUSTOM DELETE CONFIRMATIONS ============
function confirmDeleteUpdate(updateId) {
    showCustomConfirm(
        'Delete Update',
        'Are you sure you want to delete this update? This action cannot be undone.',
        () => {
            if (userSystem.deleteUpdate(updateId)) {
                if (window.loadAdminUpdatesList) loadAdminUpdatesList();
                if (window.showUpdatesSection) showUpdatesSection();
                if (window.updateAdminStats) updateAdminStats();
                showCustomAlert('Success', 'Update deleted successfully!', 'success');
            }
        }
    );
}

function confirmDeleteUser(username) {
    showCustomConfirm(
        'Delete User',
        `Are you sure you want to delete user <strong>${username}</strong> and ALL their comments? This action cannot be undone.`,
        () => {
            // Gọi hàm từ file.js nếu tồn tại
            if (window.deleteUserComments) {
                window.comments = deleteUserComments(username);
                saveCommentsToStorage();
            }
            
            if (userSystem.deleteUser(username)) {
                showCustomAlert('Success', `User ${username} deleted!`, 'success');
                if (window.loadUsersList) loadUsersList();
                if (window.renderComments) renderComments();
                if (window.updateAdminStats) updateAdminStats();
            }
        }
    );
}

function confirmBanUser(username) {
    showCustomConfirm(
        'Ban User',
        `Are you sure you want to ban user <strong>${username}</strong>? They will not be able to login anymore.`,
        () => {
            if (userSystem.banUser(username)) {
                showCustomAlert('Success', `User ${username} banned!`, 'success');
                if (window.loadUsersList) loadUsersList();
                if (window.updateAdminStats) updateAdminStats();
            }
        }
    );
}

function confirmUnbanUser(username) {
    showCustomConfirm(
        'Unban User',
        `Are you sure you want to unban user <strong>${username}</strong>? They will be able to login again.`,
        () => {
            if (userSystem.unbanUser(username)) {
                showCustomAlert('Success', `User ${username} unbanned!`, 'success');
                if (window.loadUsersList) loadUsersList();
                if (window.updateAdminStats) updateAdminStats();
            }
        }
    );
}

window.showNotificationForm = showNotificationForm;
window.submitNotification = submitNotification;
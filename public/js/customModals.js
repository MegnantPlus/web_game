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
// ============ CUSTOM UPDATE FORM ============
function showUpdateForm() {
    const modal = document.createElement('div');
    modal.className = 'custom-modal-overlay';
    modal.id = 'updateFormModal';
    
    modal.innerHTML = `
        <div class="custom-modal">
            <div class="modal-header">
                <h2><i class="fas fa-plus-circle"></i> Add New Update</h2>
                <button class="modal-close-btn" onclick="closeCustomModal('updateFormModal')">
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
                <button class="cancel-btn" onclick="closeCustomModal('updateFormModal')">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="submit-btn" onclick="submitCustomUpdate()">
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

// ============ CUSTOM CONFIRM MODAL ============
function showCustomConfirm(title, message, onConfirm, onCancel = null) {
    const modal = document.createElement('div');
    modal.className = 'custom-modal-overlay';
    modal.id = 'confirmModal';
    
    modal.innerHTML = `
        <div class="custom-modal confirm-modal">
            <div class="modal-header">
                <h2><i class="fas fa-exclamation-triangle"></i> ${title}</h2>
                <button class="modal-close-btn" onclick="closeCustomModal('confirmModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="confirm-icon">
                    <i class="fas fa-question-circle"></i>
                </div>
                <p class="confirm-message">${message}</p>
            </div>
            
            <div class="modal-footer">
                <button class="cancel-btn" onclick="closeCustomModal('confirmModal')">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="confirm-btn" onclick="handleConfirmAction()">
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
        window.confirmCallback = null;
    }
    closeCustomModal('confirmModal');
}

// ============ CUSTOM ALERT MODAL ============
function showCustomAlert(title, message, type = 'info') {
    const icons = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    
    const colors = {
        'success': '#4CAF50',
        'error': '#ff4757',
        'warning': '#FF9800',
        'info': '#2196F3'
    };
    
    const modal = document.createElement('div');
    modal.className = 'custom-modal-overlay';
    modal.id = 'alertModal';
    
    modal.innerHTML = `
        <div class="custom-modal alert-modal">
            <div class="modal-header" style="border-bottom-color: ${colors[type]}">
                <h2><i class="${icons[type]}" style="color: ${colors[type]}"></i> ${title}</h2>
                <button class="modal-close-btn" onclick="closeCustomModal('alertModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <p class="alert-message">${message}</p>
            </div>
            
            <div class="modal-footer">
                <button class="ok-btn" onclick="closeCustomModal('alertModal')">
                    OK
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto close after 5 seconds for success/info
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            closeCustomModal('alertModal');
        }, 5000);
    }
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

function submitEditUpdate(updateId) {
    console.log('DEBUG: submitEditUpdate called with ID:', updateId);
    
    const title = document.getElementById('editUpdateTitle').value.trim();
    const content = document.getElementById('editUpdateContent').value.trim();
    
    // Kiểm tra đầu vào
    if (!title) {
        showCustomAlert('Error', 'Please enter a title for the update!', 'error');
        document.getElementById('editUpdateTitle').focus();
        return;
    }
    
    if (!content) {
        showCustomAlert('Error', 'Please enter content for the update!', 'error');
        document.getElementById('editUpdateContent').focus();
        return;
    }
    
    if (title.length < 3) {
        showCustomAlert('Error', 'Title must be at least 3 characters!', 'error');
        return;
    }
    
    console.log('DEBUG: Calling editUpdate with:', { updateId, title, content });
    
    // Gọi hàm editUpdate từ userSystem
    const result = userSystem.editUpdate(updateId, title, content);
    console.log('DEBUG: editUpdate result:', result);
    
    if (result) {
        closeCustomModal('editUpdateFormModal');
        
        // Refresh các phần liên quan
        if (window.loadAdminUpdatesList) loadAdminUpdatesList();
        if (window.showUpdatesSection) showUpdatesSection();
        if (window.updateAdminStats) updateAdminStats();
        if (window.initializeUpdateSlider) initializeUpdateSlider();
        
        showCustomAlert('Success', 'Update edited successfully!', 'success');
    } else {
        showCustomAlert('Error', 'Failed to edit update. You may not have permission.', 'error');
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

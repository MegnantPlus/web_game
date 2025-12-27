// updates.js - UPDATED FOR API
async function submitUpdate() {
    const title = document.getElementById('updateTitle').value.trim();
    const content = document.getElementById('updateContent').value.trim();
    
    if (!title || !content) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const result = await window.userSystem.createUpdate(title, content);
        
        if (result.success) {
            closeUpdateForm();
            await loadUpdates();
            showNotification('Update created!', 'success');
            
            // Refresh admin panel if open
            if (typeof loadAdminUpdatesList === 'function') {
                await loadAdminUpdatesList();
                await updateAdminStats();
            }
        } else {
            showNotification(result.error || 'Failed to create update', 'error');
        }
    } catch (error) {
        showNotification('Failed to create update', 'error');
    }
}
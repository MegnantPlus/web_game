// updates.js - Update Slider System

// Update data structure
window.updatesData = JSON.parse(localStorage.getItem('pickleball_updates') || '[]');

// Initialize updates
function initUpdates() {
    // Create default admin if not exists
    const users = JSON.parse(localStorage.getItem('pickleball_users') || '[]');
    const adminExists = users.find(u => u.username === 'Dmaster');
    
    if (!adminExists) {
        const adminUser = {
            username: 'Dmaster',
            password: hashPassword('010101'),
            createdAt: Date.now(),
            isAdmin: true,
            isBanned: false
        };
        users.push(adminUser);
        localStorage.setItem('pickleball_users', JSON.stringify(users));
    }
    
    // Add sample update if none exists
    if (window.updatesData.length === 0) {
        const sampleUpdate = {
            id: Date.now(),
            title: 'Welcome to Pickleball Champions!',
            content: 'Welcome to our game! We\'re excited to have you here. Check back regularly for updates and new features.',
            author: 'Dmaster',
            createdAt: Date.now(),
            isVisible: true
        };
        window.updatesData.push(sampleUpdate);
        saveUpdates();
    }
}

// Save updates to localStorage
function saveUpdates() {
    localStorage.setItem('pickleball_updates', JSON.stringify(window.updatesData));
}

// Add new update (admin only)
function addUpdate(title, content, author) {
    const newUpdate = {
        id: Date.now(),
        title: title,
        content: content,
        author: author,
        createdAt: Date.now(),
        isVisible: true
    };
    
    window.updatesData.unshift(newUpdate);
    saveUpdates();
    return newUpdate;
}

// Edit update (admin only)
function editUpdate(updateId, title, content) {
    const update = window.updatesData.find(u => u.id === updateId);
    if (!update) return false;
    
    update.title = title;
    update.content = content;
    update.updatedAt = Date.now();
    
    saveUpdates();
    return true;
}

// Delete update (admin only)
function deleteUpdate(updateId) {
    window.updatesData = window.updatesData.filter(u => u.id !== updateId);
    saveUpdates();
    return true;
}

// Get visible updates
function getVisibleUpdates() {
    return window.updatesData.filter(update => update.isVisible);
}

// Password hash function (same as in main.js)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

// Initialize when loaded
initUpdates();
// userSystem.js - COMPLETE VERSION WITH ADMIN
class UserSystem {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('pickleball_users')) || [];
        this.bannedUsers = JSON.parse(localStorage.getItem('pickleball_banned')) || [];
        this.updates = JSON.parse(localStorage.getItem('pickleball_updates')) || [];
        this.loadSession();
        this.createDefaultAdmin();
        this.clearOldSessions();
    }
    
    // Hash function
    hashPassword(password) {
        let hash = 5381;
        for (let i = 0; i < password.length; i++) {
            hash = (hash * 33) ^ password.charCodeAt(i);
        }
        return (hash >>> 0).toString(36);
    }
    
    // Validate username
    validateUsername(username) {
        const trimmed = username.trim();
        if (trimmed.length < 3) return "Username must be at least 3 characters";
        if (trimmed.length > 20) return "Username must be less than 20 characters";
        if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return "Username can only contain letters, numbers and underscore";
        return null;
    }
    
    // Validate password
    validatePassword(password) {
        if (password.length < 6) return "Password must be at least 6 characters";
        if (password.length > 30) return "Password must be less than 30 characters";
        return null;
    }
    
    // ============ SIGN UP ============
    signUp(username, password) {
        // Validate
        const usernameError = this.validateUsername(username);
        if (usernameError) return { success: false, message: usernameError };
        
        const passwordError = this.validatePassword(password);
        if (passwordError) return { success: false, message: passwordError };
        
        // Check if user exists
        if (this.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            return { success: false, message: "Username already exists" };
        }
        
        // Check if user is banned
        if (this.isBanned(username)) {
            return { success: false, message: "This username is banned" };
        }
        
        // Create new user
        const newUser = {
            username: username.trim(),
            password: this.hashPassword(password),
            createdAt: Date.now(),
            lastLogin: null,
            isLoggedIn: false,
            isAdmin: false,
            isBanned: false
        };
        
        this.users.push(newUser);
        this.saveToStorage();
        
        return { 
            success: true, 
            message: "Account created successfully! Please log in.",
            user: newUser 
        };
    }
    
    // ============ LOGIN ============
    login(username, password) {
        // Check if user is banned
        if (this.isBanned(username)) {
            return { success: false, message: "This account has been banned!" };
        }
        
        const user = this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
        
        if (!user) {
            return { success: false, message: "Invalid username or password" };
        }
        
        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: "Invalid username or password" };
        }
        
        // Check if user is banned in user object
        if (user.isBanned) {
            return { success: false, message: "This account has been banned!" };
        }
        
        // Mark user as logged in
        user.isLoggedIn = true;
        user.lastLogin = Date.now();
        this.currentUser = user;
        
        this.saveToStorage();
        this.saveSession();
        
        return { success: true, user: user };
    }
    
    // ============ LOGOUT ============
    logout() {
        if (this.currentUser) {
            const user = this.users.find(u => u.username === this.currentUser.username);
            if (user) {
                user.isLoggedIn = false;
            }
        }
        this.currentUser = null;
        localStorage.removeItem('pickleball_session');
        this.saveToStorage();
    }
    
    // ============ ADMIN FUNCTIONS ============
    createDefaultAdmin() {
        const adminExists = this.users.find(u => u.username === 'Dmaster');
        if (!adminExists) {
            const adminUser = {
                username: 'Dmaster',
                password: this.hashPassword('010101'),
                createdAt: Date.now(),
                lastLogin: null,
                isLoggedIn: false,
                isAdmin: true,
                isBanned: false
            };
            this.users.push(adminUser);
            this.saveToStorage();
            console.log('✅ Admin account created: Dmaster / 010101');
        }
    }
    
    isAdmin() {
        return this.currentUser && this.currentUser.isAdmin === true;
    }
    
    isBanned(username = this.currentUser?.username) {
        if (!username) return false;
        // Check both bannedUsers array and user.isBanned flag
        return this.bannedUsers.includes(username) || 
               (this.users.find(u => u.username === username)?.isBanned === true);
    }
    
    banUser(username) {
        if (!this.bannedUsers.includes(username)) {
            this.bannedUsers.push(username);
            
            // Also set isBanned flag on user object
            const user = this.users.find(u => u.username === username);
            if (user) {
                user.isBanned = true;
                user.isLoggedIn = false; // Log them out
            }
            
            this.saveToStorage();
            return true;
        }
        return false;
    }
    
    unbanUser(username) {
        this.bannedUsers = this.bannedUsers.filter(u => u !== username);
        
        // Remove isBanned flag from user object
        const user = this.users.find(u => u.username === username);
        if (user) {
            user.isBanned = false;
        }
        
        this.saveToStorage();
        return true;
    }
    
    deleteUser(username) {
        // Remove from users list
        this.users = this.users.filter(u => u.username !== username);
        
        // Remove from banned list if present
        this.bannedUsers = this.bannedUsers.filter(u => u !== username);
        
        this.saveToStorage();
        return true;
    }
    
    getAllUsers() {
        return this.users.filter(user => user.username !== 'Dmaster');
    }
    
    // ============ UPDATES MANAGEMENT ============
    addUpdate(title, content) {
        if (!this.currentUser || !this.isAdmin()) {
            return false;
        }
        
        const newUpdate = {
            id: Date.now(),
            title: title,
            content: content,
            author: this.currentUser.username,
            createdAt: Date.now(),
            isVisible: true
        };
        
        this.updates.push(newUpdate);
        this.saveToStorage();
        return newUpdate;
    }
    
   editUpdate(updateId, title, content) {
    console.log('EDIT UPDATE CALLED:', { 
        updateId, 
        title, 
        currentUser: this.currentUser?.username,
        isAdmin: this.isAdmin()
    });
    
    // Kiểm tra người dùng đã đăng nhập chưa
    if (!this.currentUser) {
        console.error('User not logged in');
        return false;
    }
    
    // Tìm update cần sửa
    const update = this.updates.find(u => u.id === updateId);
    
    if (!update) {
        console.error('Update not found:', updateId);
        console.log('Available updates:', this.updates.map(u => ({ id: u.id, title: u.title })));
        return false;
    }
    
    console.log('Found update:', update);
    console.log('Update author:', update.author);
    console.log('Current user:', this.currentUser.username);
    console.log('Is admin?', this.isAdmin());
    
    // Kiểm tra quyền: chỉ admin hoặc chính người tạo update mới được sửa
    if (this.isAdmin() || update.author === this.currentUser.username) {
        console.log('Permission granted, updating...');
        update.title = title;
        update.content = content;
        update.updatedAt = Date.now();
        this.saveToStorage();
        console.log('Update edited successfully:', updateId);
        return true;
    } else {
        console.error('No permission to edit this update');
        console.log('Update author:', update.author);
        console.log('Current user:', this.currentUser.username);
        return false;
    }
}
    
    deleteUpdate(updateId) {
        if (!this.currentUser || !this.isAdmin()) {
            return false;
        }
        
        this.updates = this.updates.filter(u => u.id !== updateId);
        this.saveToStorage();
        return true;
    }
    
    getVisibleUpdates() {
        return this.updates.filter(update => update.isVisible);
    }
    
    // ============ USER INFO FUNCTIONS ============
    getUsername() {
        return this.currentUser ? this.currentUser.username : null;
    }
    
    getUserAvatar() {
        if (!this.currentUser) return "👤";
        const initials = this.currentUser.username.charAt(0).toUpperCase();
        return initials;
    }
    
    isLoggedIn() {
        return this.currentUser !== null;
    }
    
    getUserData() {
        return this.currentUser;
    }
    
    // ============ SESSION MANAGEMENT ============
    saveSession() {
        if (this.currentUser) {
            localStorage.setItem('pickleball_session', this.currentUser.username);
        }
    }
    
    loadSession() {
        const sessionUsername = localStorage.getItem('pickleball_session');
        if (sessionUsername) {
            const user = this.users.find(u => u.username === sessionUsername);
            if (user) {
                // Check if user is banned
                if (this.isBanned(sessionUsername)) {
                    localStorage.removeItem('pickleball_session');
                    return;
                }
                
                user.isLoggedIn = true;
                user.lastLogin = Date.now();
                this.currentUser = user;
            }
        }
    }
    
    // ============ STORAGE ============
    saveToStorage() {
        localStorage.setItem('pickleball_users', JSON.stringify(this.users));
        localStorage.setItem('pickleball_banned', JSON.stringify(this.bannedUsers));
        localStorage.setItem('pickleball_updates', JSON.stringify(this.updates));
    }
    clearOldSessions() {
        // Tự động logout user không hoạt động sau 7 ngày
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        this.users.forEach(user => {
            if (user.lastLogin && user.lastLogin < sevenDaysAgo) {
                user.isLoggedIn = false;
            }
        });
        this.saveToStorage();
    }
    markUpdateAsRead(updateId) {
        if (!this.currentUser) return;
        
        if (!this.currentUser.readUpdates) {
            this.currentUser.readUpdates = [];
        }
        
        if (!this.currentUser.readUpdates.includes(updateId)) {
            this.currentUser.readUpdates.push(updateId);
            this.saveToStorage();
        }
    }
    
    isUpdateRead(updateId) {
        if (!this.currentUser || !this.currentUser.readUpdates) return false;
        return this.currentUser.readUpdates.includes(updateId);
    }
    
    getUnreadUpdatesCount() {
        if (!this.currentUser) return 0;
        const visibleUpdates = this.getVisibleUpdates();
        return visibleUpdates.filter(update => !this.isUpdateRead(update.id)).length;
    }
}

// Create global instance
window.userSystem = new UserSystem();
window.userSystem.loadSession();
    
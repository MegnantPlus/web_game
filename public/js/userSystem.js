// userSystem.js - SIMPLIFIED VERSION FOR API WITH EMAIL SUPPORT
class UserSystem {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('pickleball_users')) || [];
        this.updates = JSON.parse(localStorage.getItem('pickleball_updates')) || [];
        this.loadSession();
        this.createDefaultAdmin();
    }
    
    // Hash function - SAME AS MAIN.JS
    hashPassword(password) {
        let hash = 5381;
        for (let i = 0; i < password.length; i++) {
            hash = (hash * 33) ^ password.charCodeAt(i);
        }
        return (hash >>> 0).toString(36);
    }
    
    // ============ EMAIL VALIDATION ============
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // ============ SIGN UP (WITH EMAIL) ============
    signUp(username, email, password) {
    // Validate inputs
    if (!username || !email || !password) {
        return { success: false, message: "Please fill in all fields" };
    }
    
    // Validate username
    if (username.length < 3 || username.length > 20) {
        return { success: false, message: "Username must be 3-20 characters" };
    }
    
    // Validate email
    if (!this.isValidEmail(email)) {
        return { success: false, message: "Please enter a valid email address" };
    }
    
    // Validate password - ĐÃ THAY ĐỔI TỪ 6 THÀNH 8
    if (password.length < 8) {
        return { success: false, message: "Password must be at least 8 characters" };
    }
    
    // Check if username exists
    if (this.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return { success: false, message: "Username already exists" };
    }
    
    // Check if email exists
    if (this.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, message: "Email already registered" };
    }
    
    // Create new user with email
    const newUser = {
        id: Date.now().toString(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: this.hashPassword(password),
        createdAt: Date.now(),
        banned: false,
        admin: username === 'Dmaster',
        isBanned: false,
        isAdmin: username === 'Dmaster'
    };
    
    this.users.push(newUser);
    this.saveToStorage();
    
    return { 
        success: true, 
        message: "Account created successfully! Please log in.",
        user: newUser 
    };
}
    
    // ============ LOGIN (WITH EMAIL) ============
    login(email, password) {
        // Validate inputs
        if (!email || !password) {
            return { success: false, message: "Please fill in all fields" };
        }
        
        const emailLower = email.trim().toLowerCase();
        
        // Find user by email
        const user = this.users.find(u => u.email && u.email.toLowerCase() === emailLower);
        
        if (!user) {
            return { success: false, message: "Invalid email or password" };
        }
        
        // Verify password
        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: "Invalid email or password" };
        }
        
        // Check if banned
        if (user.banned || user.isBanned) {
            return { success: false, message: "This account has been banned!" };
        }
        
        // Success - set current user
        this.currentUser = user;
        this.saveSession();
        
        return { 
            success: true, 
            message: "Logged in successfully!",
            user: user 
        };
    }
    
    // ============ LOGOUT ============
    logout() {
        this.currentUser = null;
        localStorage.removeItem('pickleball_session');
        return { success: true, message: "Logged out successfully!" };
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
            if (user && !(user.banned || user.isBanned)) {
                this.currentUser = user;
            }
        }
    }
    
    // ============ CREATE DEFAULT ADMIN ============
    createDefaultAdmin() {
        const adminExists = this.users.find(u => 
            u.username === 'Dmaster' && u.email === 'abc@gmail.com'
        );
        
        if (!adminExists) {
            const adminUser = {
                id: "admin_001",
                username: 'Dmaster',
                email: 'abc@gmail.com',
                password: this.hashPassword('010101'),
                createdAt: Date.now(),
                banned: false,
                admin: true,
                isBanned: false,
                isAdmin: true
            };
            this.users.push(adminUser);
            this.saveToStorage();
            console.log('✅ Default admin account created');
        }
    }
    
    // ============ ADMIN FUNCTIONS ============
    isAdmin() {
        return this.currentUser && (this.currentUser.admin || this.currentUser.isAdmin);
    }
    
    isBanned() {
        return this.currentUser && (this.currentUser.banned || this.currentUser.isBanned);
    }
    
    // ============ USER MANAGEMENT ============
    getAllUsers() {
        return this.users.filter(user => user.username !== 'Dmaster');
    }
    
    getBannedUsers() {
        return this.users.filter(user => user.banned || user.isBanned);
    }
    
    getAdmins() {
        return this.users.filter(user => user.admin || user.isAdmin);
    }
    
    banUser(userId) {
        if (!this.isAdmin()) return false;
        
        const user = this.users.find(u => u.id === userId || u.username === userId);
        if (user && !(user.banned || user.isBanned)) {
            user.banned = true;
            user.isBanned = true;
            
            // If current user is being banned, log them out
            if (this.currentUser && (this.currentUser.id === userId || this.currentUser.username === userId)) {
                this.logout();
            }
            
            this.saveToStorage();
            return true;
        }
        return false;
    }
    
    unbanUser(userId) {
        if (!this.isAdmin()) return false;
        
        const user = this.users.find(u => u.id === userId || u.username === userId);
        if (user && (user.banned || user.isBanned)) {
            user.banned = false;
            user.isBanned = false;
            this.saveToStorage();
            return true;
        }
        return false;
    }
    
    makeAdmin(userId) {
        if (!this.isAdmin()) return false;
        
        const user = this.users.find(u => u.id === userId || u.username === userId);
        if (user && !(user.admin || user.isAdmin)) {
            user.admin = true;
            user.isAdmin = true;
            this.saveToStorage();
            return true;
        }
        return false;
    }
    
    removeAdmin(userId) {
        if (!this.isAdmin()) return false;
        
        // Don't remove admin from Dmaster
        const user = this.users.find(u => u.id === userId || u.username === userId);
        if (user && user.username === 'Dmaster') {
            return false;
        }
        
        if (user && (user.admin || user.isAdmin)) {
            user.admin = false;
            user.isAdmin = false;
            this.saveToStorage();
            return true;
        }
        return false;
    }
    
    deleteUser(userId) {
        if (!this.isAdmin()) return false;
        
        // Don't delete Dmaster
        const user = this.users.find(u => u.id === userId || u.username === userId);
        if (user && user.username === 'Dmaster') {
            return false;
        }
        
        const initialLength = this.users.length;
        this.users = this.users.filter(u => u.id !== userId && u.username !== userId);
        
        // If current user is being deleted, log them out
        if (this.currentUser && (this.currentUser.id === userId || this.currentUser.username === userId)) {
            this.logout();
        }
        
        if (this.users.length < initialLength) {
            this.saveToStorage();
            return true;
        }
        return false;
    }
    
    // ============ UPDATES MANAGEMENT ============
    addUpdate(title, content) {
        if (!this.isAdmin()) return false;
        
        const newUpdate = {
            id: Date.now(),
            title: title,
            content: content,
            author: this.currentUser.username,
            authorId: this.currentUser.id,
            createdAt: Date.now()
        };
        
        this.updates.push(newUpdate);
        this.saveToStorage();
        return newUpdate;
    }
    
    editUpdate(updateId, title, content) {
        if (!this.isAdmin()) return false;
        
        const update = this.updates.find(u => u.id === updateId);
        if (!update) return false;
        
        update.title = title;
        update.content = content;
        update.updatedAt = Date.now();
        
        this.saveToStorage();
        return true;
    }
    
    deleteUpdate(updateId) {
        if (!this.isAdmin()) return false;
        
        const initialLength = this.updates.length;
        this.updates = this.updates.filter(u => u.id !== updateId);
        
        if (this.updates.length < initialLength) {
            this.saveToStorage();
            return true;
        }
        return false;
    }
    
    getAllUpdates() {
        return this.updates;
    }
    
    // ============ BACKWARD COMPATIBILITY ============
    // Helper function to migrate old users to new format
    migrateOldUsers() {
        let migrated = false;
        this.users.forEach(user => {
            if (!user.email) {
                // Create placeholder email for old users
                user.email = `${user.username.toLowerCase()}@pickleball.com`;
                migrated = true;
            }
            
            // Ensure both old and new properties exist
            if (user.isAdmin !== undefined && user.admin === undefined) {
                user.admin = user.isAdmin;
            }
            if (user.admin !== undefined && user.isAdmin === undefined) {
                user.isAdmin = user.admin;
            }
            if (user.isBanned !== undefined && user.banned === undefined) {
                user.banned = user.isBanned;
            }
            if (user.banned !== undefined && user.isBanned === undefined) {
                user.isBanned = user.banned;
            }
        });
        
        if (migrated) {
            this.saveToStorage();
        }
        return migrated;
    }
    
    // ============ STORAGE ============
    saveToStorage() {
        localStorage.setItem('pickleball_users', JSON.stringify(this.users));
        localStorage.setItem('pickleball_updates', JSON.stringify(this.updates));
    }
    
    // ============ UTILITY FUNCTIONS ============
    getUserByEmail(email) {
        const emailLower = email.trim().toLowerCase();
        return this.users.find(u => u.email && u.email.toLowerCase() === emailLower);
    }
    
    getUserByUsername(username) {
        const usernameLower = username.trim().toLowerCase();
        return this.users.find(u => u.username.toLowerCase() === usernameLower);
    }
    
    // Check if user exists by email or username
    userExists(identifier) {
        return this.users.find(u => 
            (u.email && u.email.toLowerCase() === identifier.toLowerCase()) ||
            u.username.toLowerCase() === identifier.toLowerCase()
        );
    }
    
    // Get user statistics
    getUserStats() {
        return {
            totalUsers: this.users.filter(u => u.username !== 'Dmaster').length,
            totalAdmins: this.getAdmins().length,
            totalBanned: this.getBannedUsers().length,
            totalUpdates: this.updates.length
        };
    }
}

// Create global instance
window.userSystem = new UserSystem();

// Auto-migrate old users on load
window.userSystem.migrateOldUsers();

// Re-load session
window.userSystem.loadSession();
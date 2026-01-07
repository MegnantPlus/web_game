// userSystem.js - COMPLETE VERSION WITH NOTIFICATIONS
class UserSystem {
    constructor() {
        this.API_BASE = 'https://backend-api-service-cyxi.onrender.com/api';
        
        this.token = localStorage.getItem('pickleball_token');
        this.currentUser = null;
        
        if (this.token) {
            this.loadUserFromToken().then(user => {
                console.log('User loaded:', user);
                // Force update UI after user loads
                if (typeof updateAuthUI === 'function') {
                    setTimeout(updateAuthUI, 100);
                }
            }).catch(error => {
                console.log('Failed to load user:', error);
                this.clearToken();
            });
        }
    }

    // ============ API CALL METHOD ============
    async apiCall(endpoint, method = 'GET', data = null) {
        const url = `${this.API_BASE}${endpoint}`;
        console.log(`📡 API Call: ${method} ${url}`);
        console.log('🔐 Token exists:', !!this.token);
        console.log('👤 Current user:', this.currentUser);
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        // Add token if exists
        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
            console.log('🔐 Token added to headers');
        } else {
            console.warn('⚠️ No token available for API call');
        }

        if (data) {
            options.body = JSON.stringify(data);
            console.log('📦 Request body:', data);
        }

        try {
            const response = await fetch(url, options);
            console.log(`📡 Response status: ${response.status} ${response.statusText}`);
            
            // Log response headers
            console.log('📋 Response headers:', {
                'content-type': response.headers.get('content-type'),
                'authorization': response.headers.get('authorization')
            });
            
            if (!response.ok) {
                // If unauthorized, clear token
                if (response.status === 401) {
                    console.error('❌ 401 Unauthorized - Token invalid or expired');
                    this.clearToken();
                    // Force reload page
                    if (typeof updateAuthUI === 'function') {
                        updateAuthUI();
                    }
                }
                
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
            }
            
            const result = await response.json();
            console.log(`✅ API Response ${endpoint}:`, result);
            return result;
            
        } catch (error) {
            console.error(`❌ API Error ${endpoint}:`, error.message);
            throw error;
        }
    }

    // ============ PROFILE & LOGOUT ============
    async getProfile() {
        try {
            const result = await this.apiCall('/auth/profile', 'GET');
            return result;
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async updateProfile(updateData) {
        try {
            const result = await this.apiCall('/auth/profile', 'PUT', updateData);
            return result;
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // ============ AUTH METHODS ============
    async register(username, email, password) {
        try {
            const result = await this.apiCall('/auth/register', 'POST', {
                username,
                email,
                password
            });
            
            if (result.token) {
                this.token = result.token;
                localStorage.setItem('pickleball_token', this.token);
                
                const userData = result.user || result;
                
                this.currentUser = {
                    _id: userData._id,
                    username: userData.username,
                    email: userData.email,
                    isAdmin: Boolean(userData.isAdmin),
                    createdAt: userData.createdAt
                };
                
                localStorage.setItem('pickleball_user', JSON.stringify(this.currentUser));
                
                console.log('✅ User registered (Admin?):', this.currentUser.isAdmin);
                
                return {
                    success: true,
                    message: result.message,
                    user: this.currentUser,
                    token: result.token
                };
            } else {
                return {
                    success: false,
                    error: result.error
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async login(email, password) {
        try {
            const result = await this.apiCall('/auth/login', 'POST', {
                email,
                password
            });
            
            console.log('🔍 Login result:', result);
            
            if (result.token) {
                this.token = result.token;
                localStorage.setItem('pickleball_token', this.token);
                
                const userData = result.user || result;
                
                this.currentUser = {
                    _id: userData._id,
                    username: userData.username,
                    email: userData.email,
                    isAdmin: Boolean(userData.isAdmin),
                    createdAt: userData.createdAt
                };
                
                localStorage.setItem('pickleball_user', JSON.stringify(this.currentUser));
                
                console.log('✅ User logged in (Admin?):', this.currentUser.isAdmin);
                console.log('✅ User object:', this.currentUser);
                
                return {
                    success: true,
                    message: result.message,
                    user: this.currentUser,
                    token: result.token
                };
            } else {
                return {
                    success: false,
                    error: result.error
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async logout() {
        try {
            const result = await this.apiCall('/auth/logout', 'POST');
            this.clearToken();
            return result;
        } catch (error) {
            this.clearToken(); // Vẫn clear token dù API fail
            return { 
                success: true, 
                message: 'Logged out locally'
            };
        }
    }

    // ============ SESSION MANAGEMENT ============
    async loadUserFromToken() {
        try {
            const savedUser = localStorage.getItem('pickleball_user');
            if (savedUser) {
                try {
                    this.currentUser = JSON.parse(savedUser);
                    console.log('✅ User from localStorage (Admin?):', this.currentUser.isAdmin);
                    return this.currentUser;
                } catch (e) {
                    console.error('Failed to parse saved user:', e);
                }
            }
            
            if (!this.token) return null;
            
            const result = await this.apiCall('/auth/profile', 'GET');
            
            if (result && result._id) {
                this.currentUser = {
                    _id: result._id,
                    username: result.username,
                    email: result.email,
                    isAdmin: Boolean(result.isAdmin),
                    createdAt: result.createdAt
                };
                
                localStorage.setItem('pickleball_user', JSON.stringify(this.currentUser));
                
                console.log('✅ User from API (Admin?):', this.currentUser.isAdmin);
                return this.currentUser;
            }
            
            return null;
        } catch (error) {
            console.error('Failed to load user:', error);
            this.clearToken();
            return null;
        }
    }

    clearToken() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('pickleball_token');
        localStorage.removeItem('pickleball_user');
    }

    isLoggedIn() {
        return !!(this.token && this.currentUser);
    }

    getUser() {
        return this.currentUser;
    }

    getToken() {
        return this.token;
    }

    isAdmin() {
        if (!this.currentUser) return false;
        console.log('🔍 Checking admin status:', {
            user: this.currentUser.username,
            isAdmin: this.currentUser.isAdmin,
            type: typeof this.currentUser.isAdmin
        });
        return Boolean(this.currentUser.isAdmin);
    }

    // ============ COMMENT METHODS ============
    async getComments() {
        try {
            const result = await this.apiCall('/comments', 'GET');
            
            if (!result) {
                return {
                    success: false,
                    error: 'No response from server',
                    data: []
                };
            }
            
            return result;
        } catch (error) {
            console.error('Failed to load comments:', error);
            return { 
                success: false, 
                error: error.message,
                data: [] 
            };
        }
    }

    async postComment(content, parentCommentId = null) {
        try {
            const data = { content };
            if (parentCommentId) {
                data.parentCommentId = parentCommentId;
            }
            
            const result = await this.apiCall('/comments', 'POST', data);
            
            if (!result) {
                return {
                    success: false,
                    error: 'No response from server'
                };
            }
            
            return result;
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async deleteComment(commentId) {
        try {
            const result = await this.apiCall(`/comments/${commentId}`, 'DELETE');
            
            if (!result) {
                return {
                    success: false,
                    error: 'No response from server'
                };
            }
            
            return result;
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // ============ UPDATE METHODS ============
    async getUpdates() {
        try {
            const result = await this.apiCall('/updates', 'GET');
            
            if (!result) {
                return {
                    success: false,
                    error: 'No response from server',
                    data: []
                };
            }
            
            return result;
        } catch (error) {
            console.error('Failed to load updates:', error);
            return { 
                success: false, 
                error: error.message,
                data: [] 
            };
        }
    }

    async createUpdate(title, content) {
        try {
            const result = await this.apiCall('/updates', 'POST', { 
                title, 
                content 
            });
            
            if (!result) {
                return {
                    success: false,
                    error: 'No response from server'
                };
            }
            
            return result;
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async editUpdate(updateId, title, content) {
        try {
            const result = await this.apiCall(`/updates/${updateId}`, 'PUT', { 
                title, 
                content 
            });
            
            if (!result) {
                return {
                    success: false,
                    error: 'No response from server'
                };
            }
            
            return result;
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async deleteUpdate(updateId) {
        try {
            const result = await this.apiCall(`/updates/${updateId}`, 'DELETE');
            
            if (!result) {
                return {
                    success: false,
                    error: 'No response from server'
                };
            }
            
            return result;
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // ============ NOTIFICATIONS API ============
    async createNotification(title, content, parentNotificationId = null) {
        try {
            const data = {
                title: title,
                content: content
            };
            
            // Thêm parentNotificationId nếu có
            if (parentNotificationId) {
                data.parentNotificationId = parentNotificationId;
            }
            
            const result = await this.apiCall('/notifications', 'POST', data);
            return result;
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async getNotifications() {
        try {
            const result = await this.apiCall('/notifications', 'GET');
            
            // Format data để hiển thị replies nếu có
            if (result.success && result.data) {
                const notifications = result.data;
                
                // Chia thành parent và child notifications
                const parentNotifications = notifications.filter(n => !n.parentNotificationId);
                const childNotifications = notifications.filter(n => n.parentNotificationId);
                
                // Gắn replies vào parent
                parentNotifications.forEach(parent => {
                    parent.replies = childNotifications.filter(child => 
                        child.parentNotificationId === parent._id
                    );
                });
                
                return {
                    success: true,
                    data: parentNotifications
                };
            }
            
            return result;
        } catch (error) {
            console.error('Failed to load notifications:', error);
            return { 
                success: false, 
                error: error.message,
                data: []
            };
        }
    }

    async updateNotification(notificationId, title, content) {
        try {
            const result = await this.apiCall(`/notifications/${notificationId}`, 'PUT', { 
                title,
                content 
            });
            return result;
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async getNotificationById(notificationId) {
        try {
            const result = await this.apiCall(`/notifications/${notificationId}`, 'GET');
            return result;
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async deleteNotification(notificationId) {
        try {
            const result = await this.apiCall(`/notifications/${notificationId}`, 'DELETE');
            return result;
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // ============ PAYMENT METHODS ============
    async createPayment(amount, description = "Ủng hộ website") {
        try {
            const result = await this.apiCall('/donations/create', 'POST', {
                amount: parseInt(amount),
                description: description
            });
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async checkPaymentStatus(orderCode) {
        try {
            const result = await this.apiCall(`/donations/${orderCode}`, 'GET');
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ============ ADMIN METHODS ============
    async getUsers() {
        try {
            console.log('📡 Fetching users from:', `${this.API_BASE}/admin/users`);
            
            if (!this.token) {
                console.error('❌ No token available');
                return { 
                    success: false, 
                    error: 'Not authenticated' 
                };
            }
            
            const result = await this.apiCall('/admin/users', 'GET');
            console.log('📡 Users API response:', result);
            
            return result;
        } catch (error) {
            console.error('❌ Failed to get users:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async getStats() {
        try {
            const result = await this.apiCall('/admin/stats', 'GET');
            return result;
        } catch (error) {
            console.error('Failed to get stats:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async banUser(userId) {
        try {
            // ĐÚNG: PATCH /api/admin/users/:id/ban (theo API document)
            const result = await this.apiCall(`/admin/users/${userId}/ban`, 'PATCH', {});
            
            if (!result) {
                return {
                    success: false,
                    error: 'No response from server'
                };
            }
            
            return result;
        } catch (error) {
            console.error('Failed to ban user:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async deleteUser(userId) {
        try {
            // ĐÚNG: DELETE /api/admin/users/:id
            const result = await this.apiCall(`/admin/users/${userId}`, 'DELETE');
            
            if (!result) {
                return {
                    success: false,
                    error: 'No response from server'
                };
            }
            
            return result;
        } catch (error) {
            console.error('Failed to delete user:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // Admin comments
    async deleteCommentAdmin(commentId) {
        try {
            // Admin endpoint: DELETE /api/admin/comments/:id
            const result = await this.apiCall(`/admin/comments/${commentId}`, 'DELETE');
            
            if (!result) {
                return {
                    success: false,
                    error: 'No response from server'
                };
            }
            
            return result;
        } catch (error) {
            console.error('Failed to delete comment as admin:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // Check if user can delete comment (for UI)
    canDeleteComment(commentAuthor) {
        if (!this.currentUser) return false;
        return this.currentUser.username === commentAuthor || this.isAdmin();
    }
}

// Create global instance
window.userSystem = new UserSystem();
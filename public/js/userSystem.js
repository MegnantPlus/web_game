// userSystem.js - UPDATED FOR REAL API CONNECTION
class UserSystem {
    constructor() {
        // ĐỔI THÀNH URL BACKEND THẬT CỦA BẠN
        this.API_BASE = 'https://backend-api-service-cyxi.onrender.com/api'; 
        // Hoặc local: 'http://localhost:5000/api'
        
        this.token = localStorage.getItem('pickleball_token');
        this.currentUser = null;
        
        if (this.token) {
            this.loadUserFromToken();
        }
    }

    // ============ API CALL METHOD ============
    async apiCall(endpoint, method = 'GET', data = null) {
        const url = `${this.API_BASE}${endpoint}`;
        console.log(`📡 API Call: ${method} ${url}`, data);
        
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
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const result = await response.json();
            
            console.log(`📡 API Response ${endpoint}:`, result);
            
            if (!response.ok) {
                // If unauthorized, clear token
                if (response.status === 401 || response.status === 403) {
                    this.clearToken();
                }
                throw new Error(result.error || `HTTP ${response.status}`);
            }
            
            return result;
        } catch (error) {
            console.error(`❌ API Error ${endpoint}:`, error.message);
            
            // Show user-friendly error
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Cannot connect to server. Please check your connection.');
            }
            
            throw error;
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
                localStorage.setItem('pickleball_token', result.token);
                this.currentUser = result.user;
            }
            
            return result;
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
            
            if (result.token) {
                this.token = result.token;
                localStorage.setItem('pickleball_token', result.token);
                this.currentUser = result.user;
            }
            
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async logout() {
        try {
            await this.apiCall('/auth/logout', 'POST');
        } catch (error) {
            console.log('Logout error (ignored):', error);
        } finally {
            this.clearToken();
        }
        
        return { success: true, message: "Logged out successfully!" };
    }

    // ============ COMMENT METHODS ============
    async getComments() {
        try {
            const result = await this.apiCall('/comments', 'GET');
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
            const result = await this.apiCall('/comments', 'POST', { 
                content, 
                parentCommentId 
            });
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
            return result;
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // ============ ADMIN METHODS ============
    async getUsers() {
        try {
            const result = await this.apiCall('/admin/users', 'GET');
            return result;
        } catch (error) {
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
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async banUser(userId) {
        try {
            const result = await this.apiCall(`/admin/users/${userId}/ban`, 'PUT');
            return result;
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async promoteUser(userId) {
        try {
            const result = await this.apiCall(`/admin/users/${userId}/promote`, 'PUT');
            return result;
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async deleteUser(userId) {
        try {
            const result = await this.apiCall(`/admin/users/${userId}`, 'DELETE');
            return result;
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // ============ UTILITY METHODS ============
    async loadUserFromToken() {
        try {
            const result = await this.apiCall('/auth/profile', 'GET');
            if (result && result.username) {
                this.currentUser = result;
                console.log('✅ User loaded from token:', this.currentUser.username);
            }
        } catch (error) {
            console.log('No valid token or failed to load user:', error);
            this.clearToken();
        }
    }

    clearToken() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('pickleball_token');
    }

    isLoggedIn() {
        return !!this.currentUser;
    }

    getUser() {
        return this.currentUser;
    }

    getToken() {
        return this.token;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.isAdmin;
    }

    canDeleteComment(commentAuthor) {
        if (!this.currentUser) return false;
        return this.currentUser.username === commentAuthor || this.isAdmin();
    }
}

// Create global instance
window.userSystem = new UserSystem();
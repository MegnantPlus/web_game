// userSystem.js - SIMPLIFIED API CLIENT FOR FRONTEND
class UserSystem {
    constructor() {
        this.API_BASE = 'http://localhost:3000/api';
        this.token = localStorage.getItem('pickleball_token');
        this.currentUser = null;
        
        // Load user from token if exists
        if (this.token) {
            this.loadUserFromToken();
        }
    }

    // ============ LOAD USER FROM TOKEN ============
    async loadUserFromToken() {
        if (!this.token) return;
        
        try {
            const response = await fetch(`${this.API_BASE}/verify-token`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    this.currentUser = data.user;
                }
            } else {
                // Token invalid, clear it
                this.clearToken();
            }
        } catch (error) {
            console.error('Failed to verify token:', error);
            this.clearToken();
        }
    }

    // ============ CLEAR TOKEN ============
    clearToken() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('pickleball_token');
    }

    // ============ API CALL METHOD ============
    async apiCall(endpoint, method = 'GET', data = null) {
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
            const response = await fetch(`${this.API_BASE}${endpoint}`, options);
            const result = await response.json();
            
            if (!response.ok) {
                // If unauthorized, clear token
                if (response.status === 401) {
                    this.clearToken();
                }
                throw new Error(result.error || `HTTP ${response.status}`);
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error.message);
            throw error;
        }
    }

    // ============ AUTHENTICATION METHODS ============
    
    async signUp(username, email, password) {
        try {
            const result = await this.apiCall('/signup', 'POST', {
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
                message: error.message
            };
        }
    }

    async signIn(email, password) {
        try {
            const result = await this.apiCall('/signin', 'POST', {
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
                message: error.message
            };
        }
    }

    async signOut() {
        try {
            await this.apiCall('/signout', 'POST');
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            this.clearToken();
        }
        
        return { success: true, message: "Signed out successfully!" };
    }

    // ============ USER METHODS ============
    
    async getProfile() {
        try {
            const result = await this.apiCall('/profile', 'GET');
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async isAdmin() {
        if (!this.currentUser) return false;
        
        try {
            const result = await this.apiCall('/check-admin', 'GET');
            return result.isAdmin || false;
        } catch (error) {
            return this.currentUser.isAdmin || false;
        }
    }

    // ============ COMMENTS METHODS ============
    
    async getComments() {
        try {
            const result = await this.apiCall('/comments', 'GET');
            return result;
        } catch (error) {
            console.error('Failed to load comments:', error);
            return { comments: [] };
        }
    }

    async postComment(content) {
        try {
            const result = await this.apiCall('/comments', 'POST', { content });
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async voteComment(commentId, voteType) {
        try {
            const result = await this.apiCall(`/comments/${commentId}/vote`, 'POST', { 
                vote: voteType 
            });
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteComment(commentId) {
        try {
            const result = await this.apiCall(`/comments/${commentId}`, 'DELETE');
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ============ UPDATES METHODS ============
    
    async getUpdates() {
        try {
            const result = await this.apiCall('/updates', 'GET');
            return result;
        } catch (error) {
            console.error('Failed to load updates:', error);
            return { updates: [] };
        }
    }

    async postUpdate(title, content) {
        try {
            const result = await this.apiCall('/updates', 'POST', { 
                title, 
                content 
            });
            return result;
        } catch (error) {
            return { success: false, error: error.message };
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
            return { success: false, error: error.message };
        }
    }

    async deleteUpdate(updateId) {
        try {
            const result = await this.apiCall(`/updates/${updateId}`, 'DELETE');
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ============ ADMIN METHODS ============
    
    async getUsers() {
        try {
            const result = await this.apiCall('/users', 'GET');
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async banUser(userId) {
        try {
            const result = await this.apiCall(`/users/${userId}/ban`, 'PUT');
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteUser(userId) {
        try {
            const result = await this.apiCall(`/users/${userId}`, 'DELETE');
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ============ UTILITY METHODS ============
    
    isLoggedIn() {
        return !!this.currentUser;
    }

    getUser() {
        return this.currentUser;
    }

    getToken() {
        return this.token;
    }

    // Check if user can delete comment (owner or admin)
    canDeleteComment(commentAuthor) {
        if (!this.currentUser) return false;
        
        return this.currentUser.username === commentAuthor || 
               (this.currentUser.isAdmin !== undefined && this.currentUser.isAdmin);
    }

    // Check if user can delete update (admin only)
    canDeleteUpdate() {
        if (!this.currentUser) return false;
        return this.currentUser.isAdmin !== undefined && this.currentUser.isAdmin;
    }
}

// Create global instance
window.userSystem = new UserSystem();
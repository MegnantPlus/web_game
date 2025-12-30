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
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error ${response.status}:`, errorText);
                
                if (response.status === 401 || response.status === 403) {
                    this.clearToken();
                }
                
                throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error(`API Error ${endpoint}:`, error.message);
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
                localStorage.setItem('pickleball_token', this.token);
                
                // IMPORTANT: Get user data correctly
                const userData = result.user || result;
                
                this.currentUser = {
                    _id: userData._id,
                    username: userData.username,
                    email: userData.email,
                    isAdmin: Boolean(userData.isAdmin), // Convert to boolean
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
                
                // IMPORTANT: Handle admin flag correctly
                const userData = result.user || result;
                
                this.currentUser = {
                    _id: userData._id,
                    username: userData.username,
                    email: userData.email,
                    isAdmin: Boolean(userData.isAdmin), // Convert to boolean
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
        this.clearToken();
        return { success: true, message: 'Logged out' };
    }

    // ============ SESSION MANAGEMENT ============
    async loadUserFromToken() {
        try {
            // Check localStorage first
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
            
            // Call API to get profile
            const result = await this.apiCall('/auth/profile', 'GET');
            
            if (result && result._id) {
                this.currentUser = {
                    _id: result._id,
                    username: result.username,
                    email: result.email,
                    isAdmin: Boolean(result.isAdmin), // Convert to boolean
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
        // IMPORTANT: Check if user exists and isAdmin is true
        if (!this.currentUser) return false;
        console.log('🔍 Checking admin status:', {
            user: this.currentUser.username,
            isAdmin: this.currentUser.isAdmin,
            type: typeof this.currentUser.isAdmin
        });
        return Boolean(this.currentUser.isAdmin);
    }

    // ... (rest of the methods remain the same) ...

    // ============ COMMENT METHODS ============
    async getComments() {
        try {
            const result = await this.apiCall('/comments', 'GET');
            
            // FIX: Handle empty response
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
            
            // FIX: Check result
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
            
            // FIX: Check result
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
            
            // FIX: Handle empty response
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
            
            // FIX: Check result
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
            
            // FIX: Check result
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
            
            // FIX: Check result
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

    // ============ ADMIN METHODS ============
    async getUsers() {
        try {
            const result = await this.apiCall('/admin/users', 'GET');
            
            // FIX: Check result
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

    async getStats() {
        try {
            const result = await this.apiCall('/admin/stats', 'GET');
            
            // FIX: Check result
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

    async banUser(userId) {
        try {
            const result = await this.apiCall(`/admin/users/${userId}/ban`, 'PUT');
            
            // FIX: Check result
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

    async promoteUser(userId) {
        try {
            const result = await this.apiCall(`/admin/users/${userId}/promote`, 'PUT');
            
            // FIX: Check result
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

    async deleteUser(userId) {
        try {
            const result = await this.apiCall(`/admin/users/${userId}`, 'DELETE');
            
            // FIX: Check result
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

    canDeleteComment(commentAuthor) {
        if (!this.currentUser) return false;
        return this.currentUser.username === commentAuthor || this.isAdmin();
    }
}

// Create global instance
window.userSystem = new UserSystem();

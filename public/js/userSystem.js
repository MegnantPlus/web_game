// userSystem.js - FIXED UNDEFINED ERROR
class UserSystem {
    constructor() {
        this.API_BASE = 'https://backend-api-service-cyxi.onrender.com/api';
        
        this.token = localStorage.getItem('pickleball_token');
        this.currentUser = null;
        
        // Load user if token exists
        if (this.token) {
            this.loadUserFromToken().catch(error => {
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

        // Add token if exists
        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            console.log(`📡 API Call: ${method} ${url}`);
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API Error ${response.status}:`, errorText);
                
                if (response.status === 401 || response.status === 403) {
                    this.clearToken();
                }
                
                throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
            }
            
            const result = await response.json();
            console.log(`✅ API Success ${endpoint}:`, result);
            return result;
            
        } catch (error) {
            console.error(`❌ API Error ${endpoint}:`, error.message);
            
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
            
            console.log('Register API result:', result);
            
            // FIX: Check if result exists and has token
            if (result && result.token) {
                this.token = result.token;
                localStorage.setItem('pickleball_token', this.token);
                
                // FIX: Safely get user data
                const userData = result.user || result;
                
                this.currentUser = {
                    _id: userData._id || result._id,
                    username: userData.username || result.username,
                    email: userData.email || result.email,
                    isAdmin: userData.isAdmin || result.isAdmin || false
                };
                
                localStorage.setItem('pickleball_user', JSON.stringify(this.currentUser));
                
                return {
                    success: true,
                    message: result.message || 'Registration successful',
                    user: this.currentUser,
                    token: result.token
                };
            } else {
                // Registration failed
                return {
                    success: false,
                    error: result?.error || 'Registration failed. No token received.'
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
            
            console.log('Login API result:', result);
            
            // FIX: Check if result exists
            if (!result) {
                return {
                    success: false,
                    error: 'No response from server'
                };
            }
            
            if (result.token) {
                this.token = result.token;
                localStorage.setItem('pickleball_token', this.token);
                
                // FIX: Handle both response formats
                let userData;
                if (result.user) {
                    userData = result.user;
                } else if (result._id) {
                    userData = result;
                } else {
                    return {
                        success: false,
                        error: 'Invalid user data from server'
                    };
                }
                
                this.currentUser = {
                    _id: userData._id,
                    username: userData.username,
                    email: userData.email,
                    isAdmin: userData.isAdmin || false
                };
                
                localStorage.setItem('pickleball_user', JSON.stringify(this.currentUser));
                
                return {
                    success: true,
                    message: result.message || 'Login successful',
                    user: this.currentUser,
                    token: result.token
                };
            } else if (result.error) {
                // Login failed
                return {
                    success: false,
                    error: result.error
                };
            } else {
                return {
                    success: false,
                    error: 'Login failed. Unknown error.'
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async logout() {
        try {
            // Clear local data
            this.clearToken();
            
            return { 
                success: true, 
                message: 'Logged out successfully' 
            };
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // ============ SESSION MANAGEMENT ============
    async loadUserFromToken() {
        try {
            // Check localStorage first
            const savedUser = localStorage.getItem('pickleball_user');
            if (savedUser) {
                try {
                    this.currentUser = JSON.parse(savedUser);
                    console.log('✅ User loaded from localStorage');
                    return this.currentUser;
                } catch (e) {
                    console.error('Failed to parse saved user:', e);
                }
            }
            
            if (!this.token) {
                return null;
            }
            
            // Call API to get profile
            const result = await this.apiCall('/auth/profile', 'GET');
            
            // FIX: Check if result exists
            if (!result) {
                throw new Error('No response from profile API');
            }
            
            if (result._id && result.username) {
                this.currentUser = {
                    _id: result._id,
                    username: result.username,
                    email: result.email,
                    isAdmin: result.isAdmin || false
                };
                
                localStorage.setItem('pickleball_user', JSON.stringify(this.currentUser));
                
                console.log('✅ User loaded from API:', this.currentUser.username);
                return this.currentUser;
            } else {
                throw new Error('Invalid user data from server');
            }
        } catch (error) {
            console.error('Failed to load user from token:', error.message);
            this.clearToken();
            throw error;
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
        return this.currentUser && this.currentUser.isAdmin;
    }

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
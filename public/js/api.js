// userSystem.js - UPDATED WITH CORRECT API URL
class UserSystem {
    constructor() {
        // DÙNG API CỦA BẠN
        this.API_BASE = 'https://backend-api-service-cyxi.onrender.com/api';
        
        this.token = localStorage.getItem('pickleball_token');
        this.currentUser = null;
        
        // Test connection
        this.testConnection();
        
        if (this.token) {
            this.loadUserFromToken().then(() => {
                console.log('✅ User loaded from token:', this.currentUser);
            }).catch((error) => {
                console.log('❌ Failed to load user from token:', error.message);
                this.clearToken();
            });
        }
    }

    // ============ TEST CONNECTION ============
    async testConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch('https://backend-api-service-cyxi.onrender.com/api/health', {
                method: 'GET',
                headers: { 
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                signal: controller.signal,
                mode: 'cors'
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Server connection OK:', data);
                return true;
            } else {
                console.warn('⚠️ Server responded with error:', response.status);
                return false;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('❌ Connection timeout (8 seconds)');
            } else {
                console.error('❌ Cannot connect to server:', error.message);
            }
            
            console.log('🔧 Debug info:');
            console.log('- API URL:', this.API_BASE);
            console.log('- Check if server is running on Render.com');
            console.log('- Check if CORS is configured properly');
            console.log('- Check browser console for CORS errors');
            
            return false;
        }
    }

    // ============ API CALL METHOD ============
    async apiCall(endpoint, method = 'GET', data = null) {
        const url = `${this.API_BASE}${endpoint}`;
        console.log(`📡 API Call: ${method} ${url}`, data || '');
        
        // Abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            console.log('⏱️ Request timeout for:', url);
        }, 15000); // 15 seconds timeout
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            signal: controller.signal,
            mode: 'cors',
            credentials: 'omit' // Không dùng credentials với Render.com
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
            clearTimeout(timeoutId);
            
            console.log(`📡 Response status: ${response.status} ${response.statusText}`);
            
            // Kiểm tra content type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('❌ Response is not JSON:', text.substring(0, 200));
                
                if (response.ok) {
                    // Try to parse anyway if it's 200 OK
                    try {
                        const parsed = JSON.parse(text);
                        return parsed;
                    } catch {
                        throw new Error(`Server returned non-JSON: ${text.substring(0, 100)}`);
                    }
                } else {
                    throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
                }
            }
            
            const result = await response.json();
            console.log(`📡 API Response ${endpoint}:`, result);
            
            if (!response.ok) {
                // If unauthorized, clear token
                if (response.status === 401 || response.status === 403) {
                    console.log('🔐 Token expired or invalid, clearing...');
                    this.clearToken();
                }
                
                const errorMsg = result.error || result.message || `HTTP ${response.status}`;
                throw new Error(errorMsg);
            }
            
            return result;
            
        } catch (error) {
            clearTimeout(timeoutId);
            console.error(`❌ API Error ${endpoint}:`, error.message);
            
            // Show user-friendly error
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Server may be slow or unresponsive.');
            } else if (error.message.includes('Failed to fetch') || 
                       error.message.includes('NetworkError') ||
                       error.message.includes('Network request failed')) {
                throw new Error('Cannot connect to server. Please check your internet connection and try again.');
            } else if (error.message.includes('CORS')) {
                throw new Error('CORS error. Please check server configuration.');
            }
            
            throw error;
        }
    }

    // ============ AUTH METHODS ============
    async register(username, email, password) {
        try {
            console.log('🚀 Attempting registration...');
            const result = await this.apiCall('/auth/register', 'POST', {
                username,
                email,
                password
            });
            
            console.log('🔍 Register result:', result);
            
            if (result.token) {
                this.token = result.token;
                localStorage.setItem('pickleball_token', result.token);
                
                // Get user data from result
                const userData = result.user || result;
                
                this.currentUser = {
                    _id: userData._id || result._id,
                    username: userData.username || result.username,
                    email: userData.email || result.email,
                    isAdmin: userData.isAdmin || result.isAdmin || false,
                    createdAt: userData.createdAt || result.createdAt
                };
                
                // Save to localStorage
                localStorage.setItem('pickleball_user', JSON.stringify(this.currentUser));
                
                console.log('✅ Registration successful, user set:', this.currentUser);
                
                return {
                    success: true,
                    message: result.message || 'Registration successful!',
                    user: this.currentUser,
                    token: result.token
                };
            } else if (result.success) {
                // Registration succeeded but no token
                return {
                    success: true,
                    message: result.message || 'Registration successful!',
                    requiresLogin: true
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'Registration failed'
                };
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            return {
                success: false,
                error: error.message || 'Registration failed. Please try again.'
            };
        }
    }

    async login(email, password) {
        try {
            console.log('🔐 Attempting login...');
            const result = await this.apiCall('/auth/login', 'POST', {
                email,
                password
            });
            
            console.log('🔍 Login result:', result);
            
            if (result.token) {
                this.token = result.token;
                localStorage.setItem('pickleball_token', result.token);
                
                // Get user data
                const userData = result.user || result;
                
                this.currentUser = {
                    _id: userData._id,
                    username: userData.username,
                    email: userData.email,
                    isAdmin: userData.isAdmin || false
                };
                
                // Save to localStorage
                localStorage.setItem('pickleball_user', JSON.stringify(this.currentUser));
                
                console.log('✅ Login successful, user set:', this.currentUser);
                
                return {
                    success: true,
                    message: result.message || 'Login successful!',
                    user: this.currentUser,
                    token: result.token
                };
            } else if (result.success) {
                // Login succeeded but no token (should not happen)
                return {
                    success: true,
                    message: result.message || 'Login successful!',
                    requiresToken: true
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'Login failed'
                };
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            return {
                success: false,
                error: error.message || 'Login failed. Please check your credentials.'
            };
        }
    }

    // ============ LOGOUT METHOD ============
    async logout() {
        try {
            console.log('🚪 Attempting logout...');
            
            // Try to call logout API
            if (this.token) {
                try {
                    await this.apiCall('/auth/logout', 'POST');
                } catch (error) {
                    console.log('Logout API call failed, but clearing local session');
                }
            }
            
            // Clear everything
            this.clearToken();
            
            // Clear localStorage
            localStorage.removeItem('pickleball_user');
            localStorage.removeItem('pickleball_token');
            
            console.log('✅ Logout successful');
            
            return { 
                success: true, 
                message: 'Logged out successfully' 
            };
        } catch (error) {
            console.error('Logout error:', error);
            this.clearToken();
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // ============ SESSION MANAGEMENT ============
    async loadUserFromToken() {
        try {
            console.log('🔍 Loading user from token...');
            
            // First check localStorage
            const savedUser = localStorage.getItem('pickleball_user');
            if (savedUser) {
                try {
                    this.currentUser = JSON.parse(savedUser);
                    console.log('✅ User loaded from localStorage:', this.currentUser);
                    return this.currentUser;
                } catch {
                    console.log('Failed to parse saved user');
                }
            }
            
            // If no token, throw error
            if (!this.token) {
                throw new Error('No token available');
            }
            
            // Call API to get profile
            const result = await this.apiCall('/auth/profile', 'GET');
            console.log('🔍 Profile API result:', result);
            
            if (result && result.username) {
                this.currentUser = {
                    _id: result._id,
                    username: result.username,
                    email: result.email,
                    isAdmin: result.isAdmin || false
                };
                
                // Save to localStorage
                localStorage.setItem('pickleball_user', JSON.stringify(this.currentUser));
                
                console.log('✅ User loaded from API:', this.currentUser.username);
                return this.currentUser;
            } else if (result && result.error) {
                throw new Error(result.error);
            } else {
                throw new Error('Invalid user data from server');
            }
        } catch (error) {
            console.log('❌ Failed to load user from token:', error.message);
            this.clearToken();
            throw error;
        }
    }

    clearToken() {
        console.log('🧹 Clearing token and user data...');
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

    canDeleteComment(commentAuthor) {
        if (!this.currentUser) return false;
        return this.currentUser.username === commentAuthor || this.isAdmin();
    }
}

// Create global instance
window.userSystem = new UserSystem();
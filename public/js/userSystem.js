// userSystem.js - UPDATED FOR REAL API CONNECTION
class UserSystem {
    constructor() {
        // ĐỔI THÀNH URL BACKEND THẬT CỦA BẠN
        this.API_BASE = 'https://backend-api-service-cyxi.onrender.com/api'; 
        // Hoặc local: 'http://localhost:5000/api'
        
        this.token = localStorage.getItem('pickleball_token');
        this.currentUser = null;
        
        if (this.token) {
            this.loadUserFromToken().then(() => {
                console.log('✅ User loaded from token:', this.currentUser);
            }).catch(() => {
                console.log('❌ Failed to load user from token');
                this.clearToken();
            });
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
            },
            // Thêm credentials nếu cần
            credentials: 'include'
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
            
            // Kiểm tra response status trước
            if (!response.ok) {
                // Nếu unauthorized, clear token
                if (response.status === 401 || response.status === 403) {
                    this.clearToken();
                }
                
                // Try to get error message from response
                let errorMessage = `HTTP ${response.status}`;
                try {
                    const errorResult = await response.json();
                    errorMessage = errorResult.error || errorResult.message || errorMessage;
                } catch (e) {
                    // Không parse được JSON
                }
                
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            console.log(`📡 API Response ${endpoint}:`, result);
            
            return result;
        } catch (error) {
            console.error(`❌ API Error ${endpoint}:`, error.message);
            
            // Show user-friendly error
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
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
            
            console.log('🔍 Register result:', result);
            
            if (result.token) {
                this.token = result.token;
                localStorage.setItem('pickleball_token', result.token);
                
                // Lấy thông tin user từ result.user hoặc result trực tiếp
                const userData = result.user || result;
                
                this.currentUser = {
                    _id: userData._id || result._id,
                    username: userData.username || result.username,
                    email: userData.email || result.email,
                    isAdmin: userData.isAdmin || result.isAdmin || false,
                    createdAt: userData.createdAt || result.createdAt
                };
                
                console.log('✅ Registration successful, user set:', this.currentUser);
                
                return {
                    success: true,
                    message: result.message || 'Registration successful!',
                    user: this.currentUser,
                    token: result.token
                };
            } else {
                // Registration succeeded but no token (maybe email verification required)
                return {
                    success: true,
                    message: result.message || 'Registration successful! Please login.',
                    requiresLogin: true
                };
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            return {
                success: false,
                error: error.message || 'Registration failed'
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
                localStorage.setItem('pickleball_token', result.token);
                
                // Lấy thông tin user từ result
                const userData = result.user || result;
                
                this.currentUser = {
                    _id: userData._id,
                    username: userData.username,
                    email: userData.email,
                    isAdmin: userData.isAdmin || false
                };
                
                console.log('✅ Login successful, user set:', this.currentUser);
                
                // Lưu thêm thông tin user vào localStorage để dễ truy cập
                localStorage.setItem('pickleball_user', JSON.stringify(this.currentUser));
                
                return {
                    success: true,
                    message: result.message || 'Login successful!',
                    user: this.currentUser,
                    token: result.token
                };
            } else {
                return {
                    success: false,
                    error: 'No token received from server'
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
            // Gọi API logout nếu backend hỗ trợ
            if (this.token) {
                try {
                    await this.apiCall('/auth/logout', 'POST');
                } catch (error) {
                    console.log('Logout API call failed, but clearing local session');
                }
            }
            
            // Clear everything
            this.clearToken();
            
            // Xóa tất cả session data
            localStorage.removeItem('pickleball_user');
            localStorage.removeItem('pickleball_token');
            
            // Force reload để clean state
            setTimeout(() => {
                // Chỉ reload nếu cần thiết
                if (window.location.pathname === '/') {
                    window.location.reload();
                }
            }, 100);
            
            return { success: true, message: 'Logged out successfully' };
        } catch (error) {
            console.error('Logout error:', error);
            this.clearToken();
            return { success: false, error: error.message };
        }
    }

    // ============ SESSION MANAGEMENT ============
    async loadUserFromToken() {
        try {
            // Trước tiên kiểm tra nếu có user trong localStorage
            const savedUser = localStorage.getItem('pickleball_user');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                console.log('✅ User loaded from localStorage:', this.currentUser);
                return this.currentUser;
            }
            
            // Nếu không, gọi API để lấy profile
            if (!this.token) {
                throw new Error('No token available');
            }
            
            const result = await this.apiCall('/auth/profile', 'GET');
            console.log('🔍 Profile result:', result);
            
            if (result && result.username) {
                this.currentUser = {
                    _id: result._id,
                    username: result.username,
                    email: result.email,
                    isAdmin: result.isAdmin || false
                };
                
                // Lưu vào localStorage
                localStorage.setItem('pickleball_user', JSON.stringify(this.currentUser));
                
                console.log('✅ User loaded from API:', this.currentUser.username);
                return this.currentUser;
            }
            
            throw new Error('Invalid user data');
        } catch (error) {
            console.log('❌ Failed to load user from token:', error.message);
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
        // Kiểm tra cả token và user object
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

    // Các method còn lại giữ nguyên...
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
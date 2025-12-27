// app.js - Complete API Server with Comment Depth Control
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pickleball', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('✅ Connected to MongoDB');
});

// ============ SCHEMAS ============

// User Schema
const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        lowercase: true
    },
    password: { 
        type: String, 
        required: true 
    },
    isAdmin: { 
        type: Boolean, 
        default: false 
    },
    isBanned: { 
        type: Boolean, 
        default: false 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const User = mongoose.model('User', userSchema);

// Comment Schema
const commentSchema = new mongoose.Schema({
    content: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 1000
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    parentComment: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comment', 
        default: null 
    },
    replies: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comment' 
    }],
    depth: { 
        type: Number, 
        default: 0,
        min: 0,
        max: 2
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const Comment = mongoose.model('Comment', commentSchema);

// Update Schema
const updateSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 100
    },
    content: { 
        type: String, 
        required: true,
        maxlength: 5000
    },
    author: { 
        type: String, 
        required: true 
    },
    isVisible: { 
        type: Boolean, 
        default: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const Update = mongoose.model('Update', updateSchema);

// ============ MIDDLEWARE ============

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Admin Authorization Middleware
const authorizeAdmin = (req, res, next) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// ============ API ROUTES ============

// 1. AUTHENTICATION ROUTES

// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ error: 'Username must be 3-20 characters' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create user (NOT admin by default)
        const user = new User({
            username,
            email,
            password: hashedPassword,
            isAdmin: false
        });
        
        await user.save();
        
        // Create token
        const token = jwt.sign(
            { 
                id: user._id, 
                username: user.username, 
                email: user.email,
                isAdmin: user.isAdmin 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
                createdAt: user.createdAt
            }
        });
        
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // Check if banned
        if (user.isBanned) {
            return res.status(403).json({ error: 'Account is banned' });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // Create token
        const token = jwt.sign(
            { 
                id: user._id, 
                username: user.username, 
                email: user.email,
                isAdmin: user.isAdmin 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
                createdAt: user.createdAt
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. COMMENT ROUTES

// Get all comments with nested replies
app.get('/api/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ parentComment: null })
            .populate('user', 'username')
            .populate({
                path: 'replies',
                populate: {
                    path: 'user',
                    select: 'username'
                }
            })
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: comments.length,
            data: comments
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new comment or reply
app.post('/api/comments', authenticateToken, async (req, res) => {
    try {
        const { content, parentCommentId } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Comment content is required' });
        }
        
        if (content.length > 1000) {
            return res.status(400).json({ error: 'Comment too long (max 1000 characters)' });
        }
        
        let depth = 0;
        let parentComment = null;
        
        // If replying to a comment
        if (parentCommentId) {
            parentComment = await Comment.findById(parentCommentId);
            if (!parentComment) {
                return res.status(404).json({ error: 'Parent comment not found' });
            }
            
            depth = parentComment.depth + 1;
            
            // Check depth limit (max 2 levels)
            if (depth > 2) {
                return res.status(400).json({ 
                    error: 'Cannot reply to this comment (maximum depth reached)' 
                });
            }
        }
        
        // Create comment
        const comment = new Comment({
            content: content.trim(),
            user: req.user.id,
            parentComment: parentCommentId || null,
            depth: depth
        });
        
        await comment.save();
        
        // If it's a reply, add to parent's replies array
        if (parentComment) {
            parentComment.replies.push(comment._id);
            await parentComment.save();
        }
        
        // Populate user info
        await comment.populate('user', 'username');
        
        res.status(201).json({
            success: true,
            message: parentComment ? 'Reply added' : 'Comment added',
            data: comment
        });
        
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete comment (owner or admin only)
app.delete('/api/comments/:id', authenticateToken, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        
        // Check permission
        const isOwner = comment.user.toString() === req.user.id;
        const isAdmin = req.user.isAdmin;
        
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        // If comment has replies, we should handle them
        if (comment.replies.length > 0) {
            // Mark as deleted instead of removing
            comment.content = '[Deleted]';
            comment.user = null;
            await comment.save();
        } else {
            // Remove from parent's replies array if it's a reply
            if (comment.parentComment) {
                await Comment.findByIdAndUpdate(
                    comment.parentComment,
                    { $pull: { replies: comment._id } }
                );
            }
            
            // Delete the comment
            await comment.deleteOne();
        }
        
        res.json({
            success: true,
            message: 'Comment deleted'
        });
        
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// 3. UPDATE ROUTES

// Get all visible updates
app.get('/api/updates', async (req, res) => {
    try {
        const updates = await Update.find({ isVisible: true })
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: updates.length,
            data: updates
        });
    } catch (error) {
        console.error('Get updates error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new update (admin only)
app.post('/api/updates', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { title, content } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }
        
        if (title.length > 100) {
            return res.status(400).json({ error: 'Title too long (max 100 characters)' });
        }
        
        if (content.length > 5000) {
            return res.status(400).json({ error: 'Content too long (max 5000 characters)' });
        }
        
        const update = new Update({
            title: title.trim(),
            content: content.trim(),
            author: req.user.username
        });
        
        await update.save();
        
        res.status(201).json({
            success: true,
            message: 'Update created',
            data: update
        });
        
    } catch (error) {
        console.error('Create update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update an update (admin only)
app.put('/api/updates/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { title, content } = req.body;
        
        if (!title && !content) {
            return res.status(400).json({ error: 'Title or content is required' });
        }
        
        const update = await Update.findById(req.params.id);
        if (!update) {
            return res.status(404).json({ error: 'Update not found' });
        }
        
        if (title) update.title = title.trim();
        if (content) update.content = content.trim();
        
        await update.save();
        
        res.json({
            success: true,
            message: 'Update updated',
            data: update
        });
        
    } catch (error) {
        console.error('Update update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete update (admin only)
app.delete('/api/updates/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const update = await Update.findById(req.params.id);
        
        if (!update) {
            return res.status(404).json({ error: 'Update not found' });
        }
        
        // Soft delete by hiding
        update.isVisible = false;
        await update.save();
        
        res.json({
            success: true,
            message: 'Update deleted'
        });
        
    } catch (error) {
        console.error('Delete update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// 4. ADMIN ROUTES

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Ban/Unban user (admin only)
app.put('/api/admin/users/:id/ban', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Cannot ban yourself
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ error: 'Cannot ban yourself' });
        }
        
        // Cannot ban another admin
        if (user.isAdmin) {
            return res.status(400).json({ error: 'Cannot ban another admin' });
        }
        
        user.isBanned = !user.isBanned;
        await user.save();
        
        res.json({
            success: true,
            message: `User ${user.isBanned ? 'banned' : 'unbanned'}`,
            data: {
                _id: user._id,
                username: user.username,
                isBanned: user.isBanned
            }
        });
        
    } catch (error) {
        console.error('Ban user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Make user admin (admin only)
app.put('/api/admin/users/:id/promote', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        user.isAdmin = true;
        await user.save();
        
        res.json({
            success: true,
            message: 'User promoted to admin',
            data: {
                _id: user._id,
                username: user.username,
                isAdmin: user.isAdmin
            }
        });
        
    } catch (error) {
        console.error('Promote user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Remove admin status (admin only, cannot remove yourself)
app.put('/api/admin/users/:id/demote', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Cannot demote yourself
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ error: 'Cannot demote yourself' });
        }
        
        user.isAdmin = false;
        await user.save();
        
        res.json({
            success: true,
            message: 'User demoted from admin',
            data: {
                _id: user._id,
                username: user.username,
                isAdmin: user.isAdmin
            }
        });
        
    } catch (error) {
        console.error('Demote user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user (admin only, cannot delete yourself)
app.delete('/api/admin/users/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Cannot delete yourself
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }
        
        // Cannot delete another admin
        if (user.isAdmin) {
            return res.status(400).json({ error: 'Cannot delete another admin' });
        }
        
        // Delete user's comments
        await Comment.deleteMany({ user: user._id });
        
        // Delete user
        await user.deleteOne();
        
        res.json({
            success: true,
            message: 'User deleted'
        });
        
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// 5. STATS ROUTES

// Get dashboard stats (admin only)
app.get('/api/admin/stats', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalComments = await Comment.countDocuments();
        const totalBanned = await User.countDocuments({ isBanned: true });
        const totalUpdates = await Update.countDocuments({ isVisible: true });
        
        res.json({
            success: true,
            data: {
                totalUsers,
                totalComments,
                totalBanned,
                totalUpdates
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// 6. HEALTH CHECK
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Pickleball Champions API'
    });
});

// ============ ERROR HANDLING ============

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============ SERVER START ============

const PORT = process.env.PORT || 5000;

// Create default admin if doesn't exist
async function createDefaultAdmin() {
    try {
        const adminExists = await User.findOne({ username: 'Dmaster' });
        
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('010101', salt);
            
            const adminUser = new User({
                username: 'Dmaster',
                email: 'admin@pickleball.com',
                password: hashedPassword,
                isAdmin: true
            });
            
            await adminUser.save();
            console.log('✅ Default admin user created');
        }
    } catch (error) {
        console.error('Failed to create default admin:', error);
    }
}

app.listen(PORT, async () => {
    console.log(`✅ API Server running on http://localhost:${PORT}`);
    await createDefaultAdmin();
});

module.exports = app;
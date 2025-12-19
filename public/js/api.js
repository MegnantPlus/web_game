// app.js - API Server
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pickleball', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Comment Schema
const commentSchema = new mongoose.Schema({
    author: String,
    content: String,
    timestamp: { type: Date, default: Date.now },
    voteScore: { type: Number, default: 0 },
    votes: Object,
    replies: Array
});

const Comment = mongoose.model('Comment', commentSchema);

// Update Schema
const updateSchema = new mongoose.Schema({
    title: String,
    content: String,
    author: String,
    createdAt: { type: Date, default: Date.now },
    isVisible: { type: Boolean, default: true }
});

const Update = mongoose.model('Update', updateSchema);

// JWT Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access denied' });
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// ============ API ROUTES ============

// 1. REGISTER
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user (NOT admin by default)
        const user = new User({
            username,
            email,
            password: hashedPassword,
            isAdmin: false // Default user is NOT admin
        });
        
        await user.save();
        
        // Create token
        const token = jwt.sign(
            { id: user._id, username: user.username, isAdmin: user.isAdmin },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
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
            { id: user._id, username: user.username, isAdmin: user.isAdmin },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
                isBanned: user.isBanned
            }
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. GET USER PROFILE (protected)
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. GET ALL USERS (admin only)
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        // Check if admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const users = await User.find().select('-password');
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. BAN/UNBAN USER (admin only)
app.put('/api/users/:id/ban', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        user.isBanned = !user.isBanned;
        await user.save();
        
        res.json({ 
            message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`,
            user: {
                id: user._id,
                username: user.username,
                isBanned: user.isBanned
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. COMMENTS API
app.get('/api/comments', async (req, res) => {
    try {
        const comments = await Comment.find().sort({ timestamp: -1 });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/comments', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        const comment = new Comment({
            author: req.user.username,
            content,
            votes: {}
        });
        
        await comment.save();
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 7. UPDATES API
app.get('/api/updates', async (req, res) => {
    try {
        const updates = await Update.find({ isVisible: true }).sort({ createdAt: -1 });
        res.json(updates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/updates', authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { title, content } = req.body;
        const update = new Update({
            title,
            content,
            author: req.user.username
        });
        
        await update.save();
        res.status(201).json(update);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 8. CHECK ADMIN STATUS
app.get('/api/check-admin', authenticateToken, (req, res) => {
    res.json({ isAdmin: req.user.isAdmin });
});

// 9. LOGOUT
app.post('/api/logout', authenticateToken, (req, res) => {
    // In JWT, logout is client-side (just delete token)
    res.json({ message: 'Logged out successfully' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ API Server running on http://localhost:${PORT}`);
});
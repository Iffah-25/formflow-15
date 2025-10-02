// server.js - DEFINITIVE FINAL VERSION (Node/Express Backend)

const express = require('express');
const bodyParser = require('body-parser'); 
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); // Assuming you have installed this

const app = express();
const PORT = process.env.PORT || 3000;
    
const JWT_SECRET = process.env.JWT_SECRET; // <-- Set your JWT secret in an environment variable named JWT_SECRET!

// --- Database Connection ---
// REPLACE THIS URI with your valid MongoDB Atlas connection string!
const MONGODB_URI = process.env.MONGO_URI; 

// --- Mongoose Schemas ---
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// Mock data model for Forms (for dashboard demo)
const mockForms = [
    { id: 1, userId: 'mock-user-id', name: 'Event Registration 2026', status: 'published', icon: 'user-plus', responses: 45 },
    { id: 2, userId: 'mock-user-id', name: 'Q4 Customer Survey', status: 'draft', icon: 'check-square', responses: 0 },
    { id: 3, userId: 'mock-user-id', name: 'HR Onboarding Form (PDF)', status: 'published', icon: 'file-pdf', responses: 12 },
];

// --- Middleware Setup ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); 

// Middleware to verify JWT and protect routes
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user info to the request
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token. Access denied.' });
    }
};


// --- Database Connection and Server Startup ---
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully. Defining routes...');
        
        // =======================================================
        // AUTHENTICATION ROUTES (Token Generation)
        // =======================================================

        app.post('/api/v1/auth/register', async (req, res) => {
            const { username, email, password } = req.body;
            if (!username || !email || !password) return res.status(400).json({ message: 'Please enter all fields' });

            try {
                let user = await User.findOne({ email });
                if (user) return res.status(400).json({ message: 'User already exists' });

                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                user = new User({ username, email, password: hashedPassword });
                await user.save(); 

                res.status(201).json({ message: 'Registration successful. Please log in.' });

            } catch (error) {
                if (error.code === 11000) return res.status(400).json({ message: 'User with this email already exists in the database.' });
                res.status(500).json({ message: 'Server error during registration.' });
            }
        });

        app.post('/api/v1/auth/login', async (req, res) => {
            const { email, password } = req.body; 
            if (!email || !password) return res.status(400).json({ message: 'Please enter all fields' });
            
            try {
                const user = await User.findOne({ email });
                if (!user) return res.status(401).json({ message: 'Invalid credentials (Email not found)' });

                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) return res.status(401).json({ message: 'Invalid credentials (Incorrect password)' });

                // JWT GENERATION
                const token = jwt.sign(
                    { userId: user._id, username: user.username }, 
                    JWT_SECRET, 
                    { expiresIn: '1h' } 
                );

                res.status(200).json({ 
                    message: 'Login successful',
                    username: user.username,
                    token: token
                });

            } catch (error) {
                res.status(500).json({ message: 'Server error during login.' });
            }
        });

        // =======================================================
        // DASHBOARD ROUTES (PROTECTED)
        // =======================================================

        app.get('/api/v1/dashboard/stats', verifyToken, (req, res) => {
            res.status(200).json({
                totalForms: 25, 
                totalResponses: 1450,
                revenueGenerated: 5200.55
            });
        });

        app.get('/api/v1/dashboard/forms', verifyToken, (req, res) => {
            res.status(200).json(mockForms);
        });

        // =======================================================
        // FORM BUILDER SUBMISSION ENDPOINT
        // =======================================================
        app.post('/api/v1/forms/submit', (req, res) => {
            console.log('\n--- FORM BUILDER SUBMISSION ---');
            console.log('New form submitted:', req.body);
            res.status(200).json({ message: 'Form submitted successfully to the server', submissionId: Date.now() });
        });

        // =======================================================
        // STATIC FILE FAILSAFE ROUTING
        // =======================================================
        // This is the extra layer of protection to ensure the server finds the files
        app.get('/dashboard.html', (req, res) => {
            res.sendFile(path.join(__dirname, 'dashboard.html'));
        });

        app.get('/SignUp_LogIn_Form.html', (req, res) => {
            res.sendFile(path.join(__dirname, 'SignUp_LogIn_Form.html'));
        });

        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });


        // --- Start Express Server ---
        app.listen(PORT, () => {
            console.log('============================================');
            console.log(`🚀 FormFlow Server running on http://localhost:${PORT}`);
            console.log('============================================');
        });

    }) 
    .catch(err => {
        console.error('❌ MONGODB CONNECTION FAILED: Server not started.', err.message);
        process.exit(1); 
    });
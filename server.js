const express = require('express');
const bodyParser = require('body-parser'); 
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const JWT_SECRET = '25bb302b318e84b9db5fa509593e724b5b5aca88c36f028eb7ee290cb7b25ae';

const MONGODB_URI = "mongodb+srv://iffahtech25_db_user:Iffah%4096618@cluster0.n22btrk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; 

// === MONGOOSE SCHEMAS ===

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

const FormSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    formId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    icon: { type: String, default: 'file-blank' },
    fields: { type: Array, default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
const Form = mongoose.model('Form', FormSchema);

const ResponseSchema = new mongoose.Schema({
    formId: { type: String, required: true },
    responses: { type: Object, required: true },
    submittedAt: { type: Date, default: Date.now },
    ipAddress: { type: String }
});
const Response = mongoose.model('Response', ResponseSchema);

// === MIDDLEWARE ===
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

// === DATABASE CONNECTION ===
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully.');
        
        // === AUTHENTICATION ROUTES ===
        
        app.post('/api/v1/auth/register', async (req, res) => {
            const { username, email, password } = req.body;
            if (!username || !email || !password) 
                return res.status(400).json({ message: 'Please enter all fields' });

            try {
                let user = await User.findOne({ email });
                if (user) return res.status(400).json({ message: 'User already exists' });

                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                user = new User({ username, email, password: hashedPassword });
                await user.save(); 

                res.status(201).json({ message: 'Registration successful. Please log in.' });
            } catch (error) {
                if (error.code === 11000) 
                    return res.status(400).json({ message: 'User already exists.' });
                res.status(500).json({ message: 'Server error during registration.' });
            }
        });

        app.post('/api/v1/auth/login', async (req, res) => {
            const { email, password } = req.body; 
            if (!email || !password) 
                return res.status(400).json({ message: 'Please enter all fields' });
            
            try {
                const user = await User.findOne({ email });
                if (!user) return res.status(401).json({ message: 'Invalid credentials' });

                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

                const token = jwt.sign(
                    { userId: user._id, username: user.username }, 
                    JWT_SECRET, 
                    { expiresIn: '24h' }
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

        // === DASHBOARD ROUTES (PROTECTED) ===
        
        app.get('/api/v1/dashboard/stats', verifyToken, async (req, res) => {
            try {
                const userId = req.user.userId;
                
                const totalForms = await Form.countDocuments({ userId });
                const userForms = await Form.find({ userId }).select('formId');
                const formIds = userForms.map(f => f.formId);
                
                const totalResponses = await Response.countDocuments({ 
                    formId: { $in: formIds } 
                });
                
                res.status(200).json({
                    totalForms,
                    totalResponses,
                    revenueGenerated: 0
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
                res.status(500).json({ message: 'Error fetching dashboard stats' });
            }
        });

        app.get('/api/v1/dashboard/forms', verifyToken, async (req, res) => {
            try {
                const userId = req.user.userId;
                const forms = await Form.find({ userId }).sort({ createdAt: -1 });
                
                const formsWithResponses = await Promise.all(
                    forms.map(async (form) => {
                        const responseCount = await Response.countDocuments({ 
                            formId: form.formId 
                        });
                        return {
                            id: form._id,
                            formId: form.formId,
                            name: form.name,
                            status: form.status,
                            icon: form.icon,
                            responses: responseCount
                        };
                    })
                );
                
                res.status(200).json(formsWithResponses);
            } catch (error) {
                console.error('Error fetching forms:', error);
                res.status(500).json({ message: 'Error fetching forms' });
            }
        });

        // === FORM MANAGEMENT ROUTES ===
        
        app.post('/api/v1/forms/create', verifyToken, async (req, res) => {
            try {
                const { name, description, fields, icon } = req.body;
                const userId = req.user.userId;
                
                const formId = crypto.randomBytes(8).toString('hex');
                
                const newForm = new Form({
                    userId,
                    formId,
                    name,
                    description: description || '',
                    icon: icon || 'file-blank',
                    fields: fields || [],
                    status: 'draft'
                });
                
                await newForm.save();
                
                res.status(201).json({
                    message: 'Form created successfully',
                    formId,
                    shareUrl: `${req.protocol}://${req.get('host')}/form/${formId}`
                });
            } catch (error) {
                console.error('Error creating form:', error);
                res.status(500).json({ message: 'Error creating form' });
            }
        });

        app.put('/api/v1/forms/:formId/publish', verifyToken, async (req, res) => {
            try {
                const { formId } = req.params;
                const userId = req.user.userId;
                
                const form = await Form.findOneAndUpdate(
                    { formId, userId },
                    { status: 'published', updatedAt: Date.now() },
                    { new: true }
                );
                
                if (!form) return res.status(404).json({ message: 'Form not found' });
                
                res.json({ 
                    message: 'Form published successfully',
                    shareUrl: `${req.protocol}://${req.get('host')}/form/${formId}`
                });
            } catch (error) {
                console.error('Error publishing form:', error);
                res.status(500).json({ message: 'Error publishing form' });
            }
        });

        // === PUBLIC FORM ROUTES (NO AUTH) ===
        
        app.get('/api/v1/forms/:formId', async (req, res) => {
            try {
                const { formId } = req.params;
                const form = await Form.findOne({ formId, status: 'published' });
                
                if (!form) return res.status(404).json({ message: 'Form not found or not published' });
                
                res.json({
                    formId: form.formId,
                    name: form.name,
                    description: form.description,
                    fields: form.fields
                });
            } catch (error) {
                console.error('Error fetching form:', error);
                res.status(500).json({ message: 'Error fetching form' });
            }
        });

        app.post('/api/v1/forms/:formId/submit', async (req, res) => {
            try {
                const { formId } = req.params;
                const responses = req.body;
                
                const form = await Form.findOne({ formId, status: 'published' });
                if (!form) return res.status(404).json({ message: 'Form not found or not published' });
                
                const newResponse = new Response({
                    formId,
                    responses,
                    ipAddress: req.ip
                });
                
                await newResponse.save();
                
                res.status(200).json({ 
                    message: 'Response submitted successfully',
                    submissionId: newResponse._id
                });
            } catch (error) {
                console.error('Error submitting response:', error);
                res.status(500).json({ message: 'Error submitting response' });
            }
        });

        // === RESPONSE VIEWING (PROTECTED) ===
        
        app.get('/api/v1/forms/:formId/responses', verifyToken, async (req, res) => {
            try {
                const { formId } = req.params;
                const userId = req.user.userId;
                
                const form = await Form.findOne({ formId, userId });
                if (!form) return res.status(404).json({ message: 'Form not found' });
                
                const responses = await Response.find({ formId }).sort({ submittedAt: -1 });
                
                res.json({
                    formName: form.name,
                    totalResponses: responses.length,
                    responses: responses.map(r => ({
                        id: r._id,
                        data: r.responses,
                        submittedAt: r.submittedAt
                    }))
                });
            } catch (error) {
                console.error('Error fetching responses:', error);
                res.status(500).json({ message: 'Error fetching responses' });
            }
        });

        // === STATIC FILE ROUTES ===
        
        app.get('/form/:formId', (req, res) => {
            res.sendFile(path.join(__dirname, 'form_view.html'));
        });

        app.get('/dashboard.html', (req, res) => {
            res.sendFile(path.join(__dirname, 'dashboard.html'));
        });

        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });

        app.listen(PORT, () => {
            console.log('============================================');
            console.log(`🚀 FormFlow Server running on http://localhost:${PORT}`);
            console.log('============================================');
        });
    }) 
    .catch(err => {
        console.error('❌ MONGODB CONNECTION FAILED:', err.message);
        process.exit(1); 
    });
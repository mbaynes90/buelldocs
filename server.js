const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const session = require('express-session');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS.split(','),
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS,
    max: process.env.RATE_LIMIT_MAX
});
app.use('/api/', limiter);

// Force HTTPS
app.use((req, res, next) => {
    if (!req.secure && process.env.NODE_ENV === 'production') {
        return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
});

// Content Security Policy
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com"],
        objectSrc: ["'none'"]
    }
}));

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Data storage configuration
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Input validation middleware
const validateRegistration = (req, res, next) => {
    const { name, email, service } = req.body;
    if (!name || !email) {
        return res.status(400).json({ 
            success: false, 
            message: 'Name and email are required fields' 
        });
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid email format' 
        });
    }
    next();
};

// Enhanced registration endpoint
app.post('/api/register', validateRegistration, async (req, res) => {
    try {
        const { name, email, password, service = 'general', details = '' } = req.body;
        
        const users = readDataFile(USERS_FILE);
        const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: generateId(),
            operativeId: generateOperativeId(),
            name,
            email,
            passwordHash,
            services: [service],
            clearanceLevel: 'GAMMA',
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            status: 'active',
            securityHash: crypto.createHash('sha256').update(email + Date.now()).digest('hex')
        };
        
        users.push(newUser);
        await writeDataFile(USERS_FILE, users);

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: newUser.id, 
                operativeId: newUser.operativeId,
                clearanceLevel: newUser.clearanceLevel 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Access granted. Your operative ID has been generated.',
            operativeId: newUser.operativeId,
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
});

// Utility functions
function generateId() {
    return crypto.randomBytes(16).toString('hex');
}

function generateOperativeId() {
    return `OP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

async function readDataFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            await fs.promises.writeFile(filePath, '[]');
            return [];
        }
        const data = await fs.promises.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
}

async function writeDataFile(filePath, data) {
    try {
        await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing to ${filePath}:`, error);
        throw error;
    }
}

// Authentication routes
app.post('/api/auth/login', validateLogin, async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await authenticateUser(email, password);
        req.session.userId = user.id;
        res.json({ success: true, user });
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
});

// Service routes
app.post('/api/services/order', validateOrder, async (req, res) => {
    const { serviceType, requirements, deliverySpeed } = req.body;
    try {
        const order = await createOrder({
            userId: req.session.userId,
            serviceType,
            requirements,
            deliverySpeed,
            status: 'pending'
        });
        res.json({ success: true, orderId: order.id });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Payment processing
app.post('/api/payments/process', validatePayment, async (req, res) => {
    const { orderId, paymentMethod, amount } = req.body;
    try {
        const payment = await processPayment({
            orderId,
            paymentMethod,
            amount,
            userId: req.session.userId
        });
        res.json({ success: true, payment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`BuellDocs server operational on port ${PORT}`);
});
const AdminController = require('../controllers/AdminController');
const jwt = require('jsonwebtoken');

const requireAdminAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }

    const [username, password] = Buffer.from(authHeader.split(' ')[1], 'base64')
        .toString()
        .split(':');

    const isValid = await AdminController.validateAdmin(username, password);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    next();
};

const requireSuperAdminAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }

    const [username, password] = Buffer.from(authHeader.split(' ')[1], 'base64')
        .toString()
        .split(':');

    const admins = await AdminController.readAdmins();
    const admin = admins.find(a => a.username === username);
    
    if (!admin || admin.role !== 'superadmin') {
        return res.status(403).json({ error: 'Requires super admin privileges' });
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    next();
};

const requireAuth = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

module.exports = { requireAuth, requireAdminAuth, requireSuperAdminAuth };

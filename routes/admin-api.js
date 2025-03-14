const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const PaymentController = require('../controllers/PaymentController');
const { requireAdminAuth, requireSuperAdminAuth } = require('../middleware/auth');

// Apply admin authentication middleware to all routes
router.use(requireAdminAuth);

// Dashboard metrics
router.get('/metrics', async (req, res) => {
    try {
        const metrics = await AdminController.getDashboardMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

// User management
router.get('/users', async (req, res) => {
    try {
        const users = await AdminController.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.post('/users', async (req, res) => {
    try {
        const newUser = await AdminController.createUser(req.body);
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const updatedUser = await AdminController.updateUser(req.params.id, req.body);
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        await AdminController.deleteUser(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Security operations
router.post('/security/emergency-shutdown', async (req, res) => {
    try {
        await AdminController.initiateEmergencyShutdown();
        res.json({ message: 'Emergency shutdown initiated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to initiate shutdown' });
    }
});

router.get('/security/logs', async (req, res) => {
    try {
        const logs = await AdminController.getSecurityLogs();
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch security logs' });
    }
});

// Analytics
router.get('/analytics/revenue', async (req, res) => {
    try {
        const revenue = await AdminController.getRevenueAnalytics();
        res.json(revenue);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch revenue analytics' });
    }
});

router.get('/analytics/usage', async (req, res) => {
    try {
        const usage = await AdminController.getSystemUsageAnalytics();
        res.json(usage);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch usage analytics' });
    }
});

// Payment Analytics Routes
router.get('/payments', async (req, res) => {
    try {
        const { startDate, endDate, category, serviceType, userId } = req.query;
        const payments = await PaymentController.getPayments({ 
            startDate, 
            endDate, 
            category, 
            serviceType, 
            userId 
        });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

router.get('/payments/summary', async (req, res) => {
    try {
        const summary = await PaymentController.getPaymentsSummary();
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payments summary' });
    }
});

// Super Admin Routes (requires higher privileges)
router.use('/super', requireSuperAdminAuth);

router.post('/super/admins', async (req, res) => {
    try {
        const newAdmin = await AdminController.createAdmin(req.body);
        res.status(201).json(newAdmin);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/super/admins', async (req, res) => {
    try {
        const admins = await AdminController.getAllAdmins();
        res.json(admins);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
});

module.exports = router;
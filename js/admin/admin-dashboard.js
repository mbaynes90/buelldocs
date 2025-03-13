class AdminDashboard {
    constructor() {
        this.currentPanel = 'overview';
        this.userManager = new UserManager();
        this.analyticsManager = new AnalyticsManager();
        this.securityManager = new SecurityManager();
        this.init();
    }

    async init() {
        this.initializeEventListeners();
        await this.loadInitialData();
        this.startRealTimeUpdates();
    }

    initializeEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchPanel(e.currentTarget.dataset.panel);
            });
        });

        // User Management
        document.getElementById('addUser').addEventListener('click', () => {
            this.showAddUserModal();
        });

        document.getElementById('userSearch').addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });

        // Emergency Controls
        document.getElementById('emergencyShutdown').addEventListener('click', () => {
            this.handleEmergencyShutdown();
        });
    }

    async loadInitialData() {
        try {
            const [users, analytics, security] = await Promise.all([
                this.userManager.getAllUsers(),
                this.analyticsManager.getDashboardMetrics(),
                this.securityManager.getSecurityStatus()
            ]);

            this.updateDashboardMetrics(analytics);
            this.updateUsersTable(users);
            this.updateSecurityStatus(security);
        } catch (error) {
            this.handleError(error);
        }
    }

    switchPanel(panelId) {
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(panelId).classList.add('active');
        this.currentPanel = panelId;
    }

    async handleUserAction(action, userId) {
        try {
            switch (action) {
                case 'edit':
                    await this.showEditUserModal(userId);
                    break;
                case 'suspend':
                    await this.userManager.suspendUser(userId);
                    break;
                case 'delete':
                    if (await this.confirmAction('Delete user?')) {
                        await this.userManager.deleteUser(userId);
                    }
                    break;
                case 'resetPassword':
                    await this.userManager.resetUserPassword(userId);
                    break;
            }
            await this.refreshUserData();
        } catch (error) {
            this.handleError(error);
        }
    }

    async handleEmergencyShutdown() {
        if (await this.confirmAction('INITIATE EMERGENCY SHUTDOWN?')) {
            try {
                await this.securityManager.initiateEmergencyShutdown();
                this.showNotification('Emergency shutdown initiated', 'critical');
            } catch (error) {
                this.handleError(error);
            }
        }
    }

    startRealTimeUpdates() {
        setInterval(async () => {
            if (this.currentPanel === 'overview') {
                const metrics = await this.analyticsManager.getDashboardMetrics();
                this.updateDashboardMetrics(metrics);
            }
        }, 30000); // Update every 30 seconds
    }

    updateDashboardMetrics(metrics) {
        document.getElementById('activeUsers').textContent = metrics.activeUsers;
        document.getElementById('dailyRevenue').textContent = 
            `$${metrics.dailyRevenue.toLocaleString()}`;
        document.getElementById('systemLoad').textContent = 
            `${metrics.systemLoad}%`;
        // Update other metrics...
    }

    handleError(error) {
        console.error('Admin Dashboard Error:', error);
        this.showNotification(
            'An error occurred. Check console for details.',
            'error'
        );
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});
class AdminDashboard {
    constructor() {
        this.currentPanel = 'dashboard';
        this.charts = {};
        this.adminRole = null;
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.initEventListeners();
        this.loadInitialData();
        this.setupCharts();
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/admin/auth/verify', {
                headers: {
                    'Authorization': `Basic ${this.getAuthToken()}`
                }
            });
            if (!response.ok) {
                window.location.href = '/admin/login';
                return;
            }
            const data = await response.json();
            this.adminRole = data.role;
            this.updateUIForRole();
        } catch (error) {
            window.location.href = '/admin/login';
        }
    }

    updateUIForRole() {
        const superAdminElements = document.querySelectorAll('.super-admin-only');
        superAdminElements.forEach(el => {
            el.style.display = this.adminRole === 'superadmin' ? 'block' : 'none';
        });
    }

    async loadInitialData() {
        try {
            const [paymentSummary, recentTransactions] = await Promise.all([
                this.fetchPaymentSummary(),
                this.fetchRecentTransactions()
            ]);

            this.updatePaymentMetrics(paymentSummary);
            this.updateTransactionsTable(recentTransactions);
            this.updateCharts(paymentSummary);
        } catch (error) {
            this.showError('Failed to load dashboard data');
        }
    }

    async fetchPaymentSummary(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/admin/payments/summary?${queryParams}`, {
            headers: {
                'Authorization': `Basic ${this.getAuthToken()}`
            }
        });
        return response.json();
    }

    async fetchRecentTransactions() {
        const response = await fetch('/api/admin/payments?limit=10', {
            headers: {
                'Authorization': `Basic ${this.getAuthToken()}`
            }
        });
        return response.json();
    }

    updatePaymentMetrics(summary) {
        document.getElementById('totalRevenue').textContent = 
            `$${summary.total.toLocaleString()}`;
        document.getElementById('transactionCount').textContent = 
            summary.count.toLocaleString();
        document.getElementById('avgTransaction').textContent = 
            `$${(summary.total / summary.count || 0).toLocaleString()}`;
    }

    updateTransactionsTable(transactions) {
        const tbody = document.querySelector('#recentTransactions tbody');
        tbody.innerHTML = transactions.map(t => `
            <tr>
                <td>${new Date(t.timestamp).toLocaleDateString()}</td>
                <td>${t.userId}</td>
                <td>${t.serviceType}</td>
                <td>$${t.amount.toLocaleString()}</td>
                <td><span class="status-${t.status.toLowerCase()}">${t.status}</span></td>
            </tr>
        `).join('');
    }

    setupCharts() {
        this.charts.revenue = new Chart(
            document.getElementById('revenueChart').getContext('2d'),
            {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Daily Revenue',
                        data: [],
                        borderColor: '#4CAF50'
                    }]
                }
            }
        );

        this.charts.category = new Chart(
            document.getElementById('categoryChart').getContext('2d'),
            {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                            '#4BC0C0'
                        ]
                    }]
                }
            }
        );
    }

    updateCharts(summary) {
        // Update revenue chart
        const revenueData = Object.entries(summary.byDate)
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB));

        this.charts.revenue.data.labels = revenueData.map(([date]) => date);
        this.charts.revenue.data.datasets[0].data = revenueData.map(([, data]) => data.total);
        this.charts.revenue.update();

        // Update category chart
        const categoryData = Object.entries(summary.byCategory);
        this.charts.category.data.labels = categoryData.map(([category]) => category);
        this.charts.category.data.datasets[0].data = categoryData.map(([, data]) => data.total);
        this.charts.category.update();
    }

    initEventListeners() {
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        if (this.adminRole === 'superadmin') {
            document.getElementById('createAdminForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.createNewAdmin(new FormData(e.target));
            });
        }
    }

    async applyFilters() {
        const filters = {
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            category: document.getElementById('categoryFilter').value,
            serviceType: document.getElementById('serviceFilter').value
        };

        const summary = await this.fetchPaymentSummary(filters);
        this.updatePaymentMetrics(summary);
        this.updateCharts(summary);
    }

    async createNewAdmin(formData) {
        try {
            const response = await fetch('/api/admin/super/admins', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(Object.fromEntries(formData))
            });

            if (response.ok) {
                this.showSuccess('Admin created successfully');
            } else {
                this.showError('Failed to create admin');
            }
        } catch (error) {
            this.showError('Failed to create admin');
        }
    }

    getAuthToken() {
        return localStorage.getItem('adminToken');
    }

    logout() {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
    }

    showError(message) {
        // Implement error notification
        console.error(message);
    }

    showSuccess(message) {
        // Implement success notification
        console.log(message);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});
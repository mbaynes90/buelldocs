class OperationalDashboard {
    constructor() {
        this.operativeId = localStorage.getItem('operativeId');
        this.clearanceLevel = null;
        this.activeOrders = [];
        this.init();
    }

    async init() {
        try {
            await this.validateOperative();
            this.setupInterface();
            this.initializeRealTimeUpdates();
        } catch (error) {
            this.handleSecurityBreach(error);
        }
    }

    async validateOperative() {
        const response = await fetch('/api/operative/validate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ operativeId: this.operativeId })
        });

        if (response.ok) {
            const data = await response.json();
            this.clearanceLevel = data.clearanceLevel;
            this.updateClearanceInterface();
        } else {
            throw new Error('ACCESS_DENIED');
        }
    }

    setupInterface() {
        this.renderCommandCenter();
        this.initializeServiceModules();
        this.setupEventListeners();
    }

    renderCommandCenter() {
        const dashboard = document.getElementById('command-center');
        dashboard.innerHTML = `
            <div class="command-header">
                <div class="status-panel">
                    <div class="status-indicator ${this.clearanceLevel.toLowerCase()}">
                        <span class="pulse"></span>
                        <span class="level-text">${this.clearanceLevel} CLEARANCE</span>
                    </div>
                    <div class="system-time">${this.getSystemTime()}</div>
                </div>
                <div class="operative-id">OPERATIVE ${this.operativeId}</div>
            </div>
            <div class="service-grid"></div>
            <div class="active-operations-panel">
                <h2>ACTIVE OPERATIONS</h2>
                <div class="operations-list"></div>
            </div>
        `;

        this.renderServiceModules();
        this.updateActiveOperations();
    }

    renderServiceModules() {
        const serviceGrid = document.querySelector('.service-grid');
        const services = this.getAuthorizedServices();

        serviceGrid.innerHTML = services.map(service => `
            <div class="service-module ${service.clearanceRequired.toLowerCase()}" 
                 data-service="${service.id}">
                <div class="module-header">
                    <span class="service-category">${service.category}</span>
                    <span class="clearance-indicator ${service.clearanceRequired.toLowerCase()}">
                        ${service.clearanceRequired}
                    </span>
                </div>
                <h3 class="service-title">${service.name}</h3>
                <div class="service-description">${service.description}</div>
                <div class="service-status">
                    <span class="status-dot active"></span>
                    OPERATIONAL
                </div>
                <button class="deploy-btn" onclick="dashboard.initiateOperation('${service.id}')">
                    DEPLOY
                </button>
            </div>
        `).join('');
    }

    getAuthorizedServices() {
        const allServices = [
            {
                id: 'hustle-boost',
                category: 'INCOME ARCHITECTURE',
                name: 'Hustle Boost Protocol',
                description: 'Precision-crafted income documentation',
                clearanceRequired: 'STANDARD'
            },
            {
                id: 'phantom-schedule',
                category: 'DIGITAL INTERVENTION',
                name: 'Phantom Schedule Protocol',
                description: 'Strategic calendar manipulation system',
                clearanceRequired: 'ALPHA'
            },
            // Add more services based on the comprehensive list
        ];

        return allServices.filter(service => 
            this.hasRequiredClearance(service.clearanceRequired));
    }

    hasRequiredClearance(requiredLevel) {
        const clearanceLevels = {
            'STANDARD': 0,
            'BETA': 1,
            'ALPHA': 2
        };
        return clearanceLevels[this.clearanceLevel] >= clearanceLevels[requiredLevel];
    }

    async initiateOperation(serviceId) {
        try {
            const service = this.getAuthorizedServices()
                .find(s => s.id === serviceId);
            
            if (!service) throw new Error('SERVICE_NOT_FOUND');

            const deploymentModal = new DeploymentModal(service);
            const operationDetails = await deploymentModal.show();

            if (operationDetails) {
                await this.deployOperation(serviceId, operationDetails);
            }
        } catch (error) {
            this.handleOperationalError(error);
        }
    }

    async deployOperation(serviceId, details) {
        const response = await fetch('/api/operations/deploy', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                serviceId,
                operativeId: this.operativeId,
                details
            })
        });

        if (response.ok) {
            const result = await response.json();
            this.showDeploymentConfirmation(result);
            this.updateActiveOperations();
        } else {
            throw new Error('DEPLOYMENT_FAILED');
        }
    }

    updateActiveOperations() {
        fetch(`/api/operations/${this.operativeId}/active`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
            }
        })
        .then(response => response.json())
        .then(operations => {
            this.activeOrders = operations;
            this.renderActiveOperations();
        });
    }

    renderActiveOperations() {
        const operationsList = document.querySelector('.operations-list');
        operationsList.innerHTML = this.activeOrders.map(op => `
            <div class="operation-item ${op.status.toLowerCase()}">
                <div class="operation-header">
                    <span class="operation-id">${op.id}</span>
                    <span class="operation-status">${op.status}</span>
                </div>
                <div class="operation-details">
                    <div class="service-name">${op.serviceName}</div>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${op.progress}%"></div>
                    </div>
                </div>
                <div class="operation-actions">
                    <button onclick="dashboard.viewOperation('${op.id}')" class="action-btn">
                        VIEW
                    </button>
                </div>
            </div>
        `).join('');
    }

    getSystemTime() {
        return new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // ... Additional methods for handling operations and updates ...
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new OperationalDashboard();
});
class SecurePortal {
    constructor() {
        this.encryptionKey = null;
        this.operativeId = localStorage.getItem('operativeId');
        this.sessionToken = localStorage.getItem('sessionToken');
        this.init();
    }

    async init() {
        if (!this.operativeId || !this.sessionToken) {
            this.redirectToLogin();
            return;
        }

        try {
            await this.validateSession();
            this.setupPortalUI();
            this.initializeEncryption();
            this.loadUserDocuments();
        } catch (error) {
            this.handleError(error);
        }
    }

    async validateSession() {
        const response = await fetch('/api/validate-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.sessionToken}`
            },
            body: JSON.stringify({ operativeId: this.operativeId })
        });

        if (!response.ok) {
            throw new Error('Invalid session');
        }
    }

    setupPortalUI() {
        // Setup document upload
        const uploadForm = document.getElementById('document-upload');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => this.handleDocumentUpload(e));
        }

        // Setup document viewer
        const viewer = document.getElementById('document-viewer');
        if (viewer) {
            this.setupDocumentViewer(viewer);
        }

        // Setup security controls
        this.setupSecurityControls();

        // Initialize real-time status updates
        this.initializeStatusUpdates();
    }

    async initializeEncryption() {
        // Generate encryption key for client-side encryption
        const key = await window.crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256
            },
            true,
            ["encrypt", "decrypt"]
        );
        this.encryptionKey = key;
    }

    async handleDocumentUpload(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            // Encrypt sensitive data before upload
            const encryptedData = await this.encryptFormData(formData);
            
            const response = await fetch('/api/documents/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                },
                body: encryptedData
            });

            if (response.ok) {
                this.showNotification('Document uploaded successfully', 'success');
                this.loadUserDocuments(); // Refresh document list
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    async loadUserDocuments() {
        try {
            const response = await fetch(`/api/documents/${this.operativeId}`, {
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });

            if (response.ok) {
                const documents = await response.json();
                this.renderDocumentList(documents);
            } else {
                throw new Error('Failed to load documents');
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    renderDocumentList(documents) {
        const container = document.getElementById('document-list');
        if (!container) return;

        container.innerHTML = documents.map(doc => `
            <div class="document-item" data-id="${doc.id}">
                <div class="document-info">
                    <span class="document-title">${this.sanitizeHTML(doc.title)}</span>
                    <span class="document-status ${doc.status}">${doc.status}</span>
                </div>
                <div class="document-actions">
                    <button onclick="securePortal.viewDocument('${doc.id}')" class="btn-view">View</button>
                    <button onclick="securePortal.downloadDocument('${doc.id}')" class="btn-download">Download</button>
                </div>
            </div>
        `).join('');
    }

    async viewDocument(docId) {
        try {
            const response = await fetch(`/api/documents/${this.operativeId}/${docId}`, {
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });

            if (response.ok) {
                const document = await response.json();
                const decryptedContent = await this.decryptDocument(document.content);
                this.displayDocument(decryptedContent);
            } else {
                throw new Error('Failed to load document');
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    async downloadDocument(docId) {
        try {
            const response = await fetch(`/api/documents/${this.operativeId}/${docId}/download`, {
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `document-${docId}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                throw new Error('Download failed');
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    setupSecurityControls() {
        // Auto-logout timer
        let inactivityTimer;
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => this.logout(), 30 * 60 * 1000); // 30 minutes
        };

        document.addEventListener('mousemove', resetTimer);
        document.addEventListener('keypress', resetTimer);
        resetTimer();

        // Setup secure communication channel
        this.setupSecureWebSocket();
    }

    setupSecureWebSocket() {
        this.ws = new WebSocket('wss://api.buelldocs.com/secure-channel');
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'status_update') {
                this.updateDocumentStatus(data);
            }
        };

        this.ws.onclose = () => {
            setTimeout(() => this.setupSecureWebSocket(), 5000); // Reconnect after 5 seconds
        };
    }

    updateDocumentStatus(data) {
        const documentElement = document.querySelector(`[data-id="${data.documentId}"]`);
        if (documentElement) {
            const statusElement = documentElement.querySelector('.document-status');
            statusElement.className = `document-status ${data.status}`;
            statusElement.textContent = data.status;
        }
    }

    async encryptFormData(formData) {
        // Implementation of client-side encryption
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const content = await this.getFormDataAsString(formData);
        
        const encryptedContent = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            this.encryptionKey,
            new TextEncoder().encode(content)
        );

        const encryptedFormData = new FormData();
        encryptedFormData.append('iv', iv);
        encryptedFormData.append('content', encryptedContent);
        return encryptedFormData;
    }

    sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    handleError(error) {
        console.error('Portal Error:', error);
        this.showNotification(error.message || 'An error occurred', 'error');
        
        if (error.message === 'Invalid session') {
            this.redirectToLogin();
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    redirectToLogin() {
        localStorage.removeItem('operativeId');
        localStorage.removeItem('sessionToken');
        window.location.href = '/Secure-Access-Portal.html';
    }

    logout() {
        fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.sessionToken}`
            }
        }).finally(() => {
            this.redirectToLogin();
        });
    }
}

// Initialize portal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.securePortal = new SecurePortal();
});
class CareerFormHandler {
    constructor() {
        this.templates = new CareerDocumentTemplates();
        this.processor = new CareerAdvancementProcessor();
        this.certProcessor = new CertificationProcessor();
    }

    initializeEventListeners() {
        document.querySelectorAll('.deploy-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const serviceType = e.target.getAttribute('href').split('/').pop();
                this.handleServiceDeployment(serviceType);
            });
        });
    }

    async handleServiceDeployment(serviceType) {
        try {
            const form = await this.loadServiceForm(serviceType);
            this.showFormModal(form);
        } catch (error) {
            console.error('Form deployment failed:', error);
            this.showError('Service deployment failed. Please try again.');
        }
    }

    async loadServiceForm(serviceType) {
        const formTemplates = {
            'reference-package': '/templates/forms/reference-package-form.html',
            'offer-letter': '/templates/forms/offer-letter-form.html',
            'resume': '/templates/forms/resume-form.html',
            'forklift-cert': '/templates/forms/forklift-cert-form.html',
            'food-handler': '/templates/forms/food-handler-form.html',
            'medical-note': '/templates/forms/medical-note-form.html'
        };

        const formUrl = formTemplates[serviceType];
        if (!formUrl) {
            throw new Error(`Form template not found for ${serviceType}`);
        }

        const response = await fetch(formUrl);
        if (!response.ok) {
            throw new Error('Failed to load form template');
        }

        return await response.text();
    }

    showFormModal(formHtml) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                ${formHtml}
            </div>
        `;

        document.body.appendChild(modal);
        this.initializeFormHandlers(modal);
    }

    initializeFormHandlers(modal) {
        const form = modal.querySelector('form');
        const closeBtn = modal.querySelector('.close');

        closeBtn.onclick = () => {
            modal.remove();
        };

        form.onsubmit = async (e) => {
            e.preventDefault();
            await this.handleFormSubmission(form);
            modal.remove();
        };
    }

    async handleFormSubmission(form) {
        const formData = new FormData(form);
        const serviceType = form.getAttribute('data-service-type');
        
        try {
            let result;
            if (serviceType.includes('cert')) {
                result = await this.certProcessor.processCertification({
                    certType: serviceType,
                    personalInfo: Object.fromEntries(formData),
                    requirements: this.extractRequirements(formData)
                });
            } else {
                result = await this.processor.processOrder({
                    documentType: serviceType,
                    details: Object.fromEntries(formData)
                });
            }

            await this.handleSuccessfulSubmission(result);
        } catch (error) {
            this.showError('Document generation failed. Please try again.');
        }
    }

    async handleSuccessfulSubmission(result) {
        // Show preview and download options
        const previewModal = document.createElement('div');
        previewModal.className = 'preview-modal';
        previewModal.innerHTML = `
            <div class="preview-content">
                <h3>Document Preview</h3>
                <div class="document-preview">${result.preview}</div>
                <div class="action-buttons">
                    <button class="download-btn">Download</button>
                    <button class="close-btn">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(previewModal);
        this.initializePreviewHandlers(previewModal, result);
    }

    initializePreviewHandlers(modal, result) {
        const downloadBtn = modal.querySelector('.download-btn');
        const closeBtn = modal.querySelector('.close-btn');

        downloadBtn.onclick = () => {
            this.downloadDocument(result.document);
        };

        closeBtn.onclick = () => {
            modal.remove();
        };
    }

    downloadDocument(document) {
        const blob = new Blob([document], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `document-${Date.now()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}
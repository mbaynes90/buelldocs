class DocumentBuilder {
    constructor() {
        this.currentType = 'paystub';
        this.templates = {
            paystub: new PaystubTemplate(),
            w2: new W2Template(),
            '1099': new Form1099Template()
        };
        this.processors = {
            paystub: new IncomeDocumentProcessor(),
            w2: new IncomeDocumentProcessor(),
            '1099': new IncomeDocumentProcessor()
        };
        this.previewDebounceTimer = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Document type selection
        document.querySelectorAll('.doc-type-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchDocumentType(btn.dataset.type));
        });

        // Preview controls
        document.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handlePreviewAction(btn.dataset.action));
        });

        // Form change listeners
        const formContainer = document.querySelector('.form-container');
        formContainer.addEventListener('input', (e) => this.handleFormChange(e));
    }

    switchDocumentType(type) {
        this.currentType = type;
        this.loadFormTemplate();
        this.updatePreview();
        
        // Update UI state
        document.querySelectorAll('.doc-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
    }

    loadFormTemplate() {
        const formContainer = document.querySelector('.form-container');
        switch(this.currentType) {
            case 'w2':
                formContainer.innerHTML = this.getW2Form();
                break;
            case '1099':
                formContainer.innerHTML = this.get1099Form();
                break;
            default:
                formContainer.innerHTML = this.getPaystubForm();
        }
    }

    handleFormChange(e) {
        // Debounce preview updates
        clearTimeout(this.previewDebounceTimer);
        this.previewDebounceTimer = setTimeout(() => this.updatePreview(), 500);
    }

    async updatePreview() {
        const formData = this.getFormData();
        const preview = await this.generatePreview(formData);
        this.renderPreview(preview);
    }

    async generatePreview(formData) {
        try {
            const template = this.templates[this.currentType];
            const preview = await template.generate(formData);
            return preview;
        } catch (error) {
            console.error('Preview generation failed:', error);
            return this.getErrorPreview();
        }
    }

    renderPreview(previewData) {
        const previewContainer = document.querySelector('.document-preview');
        previewContainer.innerHTML = previewData;
    }

    async handlePreviewAction(action) {
        switch(action) {
            case 'refresh':
                await this.updatePreview();
                break;
            case 'download':
                await this.exportDocument();
                break;
        }
    }

    async exportDocument() {
        try {
            const formData = this.getFormData();
            const template = this.templates[this.currentType];
            const document = await template.generateFinal(formData);
            
            // Create download link
            const blob = new Blob([document], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `document-${Date.now()}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Document export failed');
        }
    }

    getFormTemplate(type) {
        const templates = {
            paystub: `
                <form class="document-form">
                    <div class="form-group">
                        <label>Employer Name</label>
                        <input type="text" name="employerName" required>
                    </div>
                    <div class="form-group">
                        <label>Pay Rate</label>
                        <input type="number" name="payRate" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Pay Period</label>
                        <input type="date" name="payPeriod" required>
                    </div>
                </form>
            `,
            w2: this.templates.w2.getFormTemplate(),
            '1099': this.templates['1099'].getFormTemplate()
        };
        return templates[type] || templates.paystub;
    }

    async generateDocument(formData) {
        try {
            const processor = this.processors[this.currentType];
            const template = this.templates[this.currentType];
            
            // Process the document
            const processedData = await processor.processOrder({
                documentType: this.currentType,
                details: Object.fromEntries(formData)
            });

            // Generate final document
            const document = await template.createFinalDocument(processedData);
            
            // Apply quality control
            const qualityControl = new QualityControlSystem();
            return await qualityControl.review(document);
        } catch (error) {
            console.error('Document generation failed:', error);
            throw error;
        }
    }

    getFormData() {
        const form = document.querySelector('.document-form');
        return new FormData(form);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.querySelector('.form-container').prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}
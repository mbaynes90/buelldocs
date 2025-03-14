class BaseDocumentProcessor {
    constructor() {
        this.qualityControl = new QualityControlSystem();
        this.templates = new TemplateManager();
        this.delivery = new DeliverySystem();
    }

    async processOrder(orderData) {
        try {
            // Standard processing flow
            await this.validateOrder(orderData);
            const template = await this.selectTemplate(orderData);
            const document = await this.generateDocument(template, orderData);
            await this.qualityControl.review(document);
            return await this.delivery.prepare(document, orderData.deliveryMethod);
        } catch (error) {
            throw new ProcessingError(error.message);
        }
    }

    async validateOrder(orderData) {
        if (!orderData.service || !orderData.details) {
            throw new ValidationError('Invalid order data');
        }
    }

    async selectTemplate(orderData) {
        return await this.templates.get(orderData.documentType);
    }

    async generateDocument(template, orderData) {
        throw new Error('Must be implemented by subclass');
    }
}
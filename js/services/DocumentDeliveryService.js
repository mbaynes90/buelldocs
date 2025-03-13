class DocumentDeliveryService {
    constructor() {
        this.emailService = new EmailService();
        this.scheduler = new DocumentScheduler();
        this.encryptionService = new EncryptionService();
    }

    async scheduleDelivery(userId, documentConfig) {
        const schedule = {
            userId,
            documentType: documentConfig.type,
            frequency: documentConfig.frequency, // 'once', 'weekly', 'monthly'
            nextDeliveryDate: this.calculateNextDeliveryDate(documentConfig),
            deliveryMethod: documentConfig.deliveryMethod,
            encryptionKey: await this.encryptionService.generateKey()
        };

        await this.scheduler.createSchedule(schedule);
        return schedule;
    }

    async deliverDocument(document, deliveryConfig) {
        const encryptedDoc = await this.encryptionService.encrypt(document);
        
        const emailContent = {
            to: deliveryConfig.email,
            subject: 'Your Requested Documentation',
            template: 'document-delivery',
            attachments: [{
                filename: `${document.type}-${Date.now()}.pdf`,
                content: encryptedDoc
            }],
            context: {
                documentType: document.type,
                decryptionInstructions: true,
                securityNotice: true
            }
        };

        await this.emailService.send(emailContent);
        await this.logDelivery(document.id, deliveryConfig);
    }

    async processScheduledDeliveries() {
        const pendingDeliveries = await this.scheduler.getPendingDeliveries();
        
        for (const delivery of pendingDeliveries) {
            try {
                const document = await this.generateDocument(delivery);
                await this.deliverDocument(document, delivery);
                await this.scheduler.updateNextDeliveryDate(delivery.id);
            } catch (error) {
                console.error(`Delivery failed for schedule ${delivery.id}:`, error);
                await this.notifyDeliveryFailure(delivery);
            }
        }
    }

    calculateNextDeliveryDate(config) {
        const now = new Date();
        switch (config.frequency) {
            case 'weekly':
                return new Date(now.setDate(now.getDate() + 7));
            case 'monthly':
                return new Date(now.setMonth(now.getMonth() + 1));
            default:
                return now;
        }
    }
}
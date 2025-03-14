class BetaProductsInterface {
    constructor() {
        this.betaAccess = new BetaAccessControl();
        this.orderProcessor = new OrderProcessor();
    }

    async displayBetaProducts(userClearance) {
        const products = await this.betaAccess.getAvailableProducts(userClearance);
        
        return products.map(product => ({
            id: product.id,
            name: product.name,
            description: this.sanitizeDescription(product.description),
            price: product.basePrice,
            availability: this.formatAvailability(product.availabilityDate),
            orderButton: this.generateOrderButton(product)
        }));
    }

    generateOrderButton(product) {
        if (product.status === 'BETA_TESTING') {
            return {
                text: 'Join Beta',
                action: 'BETA_WAITLIST',
                availability: product.availabilityDate
            };
        }
        return {
            text: 'Order Now',
            action: 'PLACE_ORDER'
        };
    }

    async processWaitlistRequest(userId, productId) {
        return await this.betaAccess.addToWaitlist({
            userId,
            productId,
            requestDate: new Date(),
            notificationPreference: 'EMAIL'
        });
    }
}
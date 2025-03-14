class BillingService {
    constructor() {
        this.stripe = new StripeAPI(process.env.STRIPE_SECRET_KEY);
        this.subscriptionManager = new SubscriptionService();
    }

    async createSubscription(userId, planId, paymentMethod) {
        try {
            const customer = await this.getOrCreateCustomer(userId);
            
            const subscription = await this.stripe.subscriptions.create({
                customer: customer.id,
                items: [{ price: this.getPriceIdForPlan(planId) }],
                payment_method: paymentMethod,
                billing_cycle_anchor: 'now',
                proration_behavior: 'create_prorations',
                expand: ['latest_invoice.payment_intent']
            });

            await this.saveSubscriptionToDatabase(userId, subscription);
            return subscription;
        } catch (error) {
            console.error('Subscription creation failed:', error);
            throw new BillingError('Failed to create subscription');
        }
    }

    async processPayment(userId, amount, description) {
        try {
            const customer = await this.getOrCreateCustomer(userId);
            
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: this.convertToCents(amount),
                currency: 'usd',
                customer: customer.id,
                description,
                automatic_payment_methods: { enabled: true }
            });

            return paymentIntent;
        } catch (error) {
            console.error('Payment processing failed:', error);
            throw new BillingError('Payment processing failed');
        }
    }

    async handleWebhook(event) {
        switch (event.type) {
            case 'invoice.payment_succeeded':
                await this.handleSuccessfulPayment(event.data.object);
                break;
            case 'invoice.payment_failed':
                await this.handleFailedPayment(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await this.handleSubscriptionCancellation(event.data.object);
                break;
        }
    }

    convertToCents(amount) {
        return Math.round(amount * 100);
    }
}
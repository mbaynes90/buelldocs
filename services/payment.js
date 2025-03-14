const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
    async createPaymentIntent(amount, currency = 'usd') {
        return await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency,
            payment_method_types: ['card'],
            metadata: {
                service: 'document_generation'
            }
        });
    }

    async processPayment(paymentMethodId, amount, orderId) {
        try {
            const paymentIntent = await this.createPaymentIntent(amount);
            await stripe.paymentMethods.attach(paymentMethodId, {
                customer: paymentIntent.customer
            });
            
            return await stripe.paymentIntents.confirm(paymentIntent.id);
        } catch (error) {
            throw new Error(`Payment processing failed: ${error.message}`);
        }
    }
}
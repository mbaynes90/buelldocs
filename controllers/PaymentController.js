const path = require('path');
const fs = require('fs').promises;
const { generateId } = require('../utils/helpers');

const PAYMENTS_FILE = path.join(__dirname, '../data/payments.json');

class PaymentController {
    static async processPayment(paymentData) {
        const payment = {
            id: generateId(),
            ...paymentData,
            status: 'completed',
            timestamp: new Date().toISOString()
        };

        const payments = await this.readPayments();
        payments.push(payment);
        await this.writePayments(payments);
        return payment;
    }

    static async getPayments(filters = {}) {
        let payments = await this.readPayments();
        
        if (filters.startDate) {
            payments = payments.filter(p => p.timestamp >= filters.startDate);
        }
        if (filters.endDate) {
            payments = payments.filter(p => p.timestamp <= filters.endDate);
        }
        if (filters.category) {
            payments = payments.filter(p => p.category === filters.category);
        }
        if (filters.serviceType) {
            payments = payments.filter(p => p.serviceType === filters.serviceType);
        }
        if (filters.userId) {
            payments = payments.filter(p => p.userId === filters.userId);
        }

        return payments;
    }

    static async getPaymentsSummary() {
        const payments = await this.readPayments();
        return {
            total: payments.reduce((sum, p) => sum + p.amount, 0),
            count: payments.length,
            byCategory: this.groupBy(payments, 'category'),
            byService: this.groupBy(payments, 'serviceType'),
            byDate: this.groupByDate(payments),
            recentTransactions: payments.slice(-5)
        };
    }

    static groupBy(payments, key) {
        return payments.reduce((acc, payment) => {
            const value = payment[key];
            if (!acc[value]) {
                acc[value] = {
                    count: 0,
                    total: 0
                };
            }
            acc[value].count++;
            acc[value].total += payment.amount;
            return acc;
        }, {});
    }

    static groupByDate(payments) {
        return payments.reduce((acc, payment) => {
            const date = payment.timestamp.split('T')[0];
            if (!acc[date]) {
                acc[date] = {
                    count: 0,
                    total: 0
                };
            }
            acc[date].count++;
            acc[date].total += payment.amount;
            return acc;
        }, {});
    }

    static async readPayments() {
        try {
            const data = await fs.readFile(PAYMENTS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    static async writePayments(payments) {
        await fs.writeFile(PAYMENTS_FILE, JSON.stringify(payments, null, 2));
    }
}

module.exports = PaymentController;
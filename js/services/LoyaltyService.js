class LoyaltyService {
    constructor() {
        this.tiers = {
            BRONZE: { threshold: 0, discount: 0 },
            SILVER: { threshold: 500, discount: 5 },
            GOLD: { threshold: 1000, discount: 10 },
            PLATINUM: { threshold: 2500, discount: 15 },
            DIAMOND: { threshold: 5000, discount: 20 }
        };
    }

    async calculateUserTier(userId) {
        const spending = await this.calculateTotalSpending(userId);
        return this.determineUserTier(spending);
    }

    determineUserTier(totalSpending) {
        const tiers = Object.entries(this.tiers)
            .sort((a, b) => b[1].threshold - a[1].threshold);

        for (const [tier, details] of tiers) {
            if (totalSpending >= details.threshold) {
                return tier;
            }
        }
        return 'BRONZE';
    }

    async applyLoyaltyDiscount(userId, basePrice) {
        const tier = await this.calculateUserTier(userId);
        const discount = this.tiers[tier].discount;
        return {
            originalPrice: basePrice,
            discount: discount,
            finalPrice: basePrice * (1 - discount / 100),
            tier: tier
        };
    }

    async updateUserPoints(userId, amount) {
        const pointsEarned = Math.floor(amount);
        await db.users.updatePoints(userId, pointsEarned);
        await this.checkTierUpgrade(userId);
    }
}
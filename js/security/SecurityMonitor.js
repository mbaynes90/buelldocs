class SecurityMonitor {
    constructor() {
        this.alertSystem = new AlertSystem();
        this.patterns = new SuspiciousPatternDetector();
    }

    async monitorActivity(activity) {
        const riskScore = await this.calculateRiskScore(activity);
        
        if (riskScore > 0.8) {
            await this.initiateEmergencyProtocol(activity);
        } else if (riskScore > 0.6) {
            await this.flagForReview(activity);
        }

        await this.logActivity(activity, riskScore);
    }

    async calculateRiskScore(activity) {
        const factors = [
            this.checkVolumeAnomaly(activity),
            this.checkTimePatterns(activity),
            this.checkIPReputation(activity.ip),
            this.checkUserHistory(activity.userId)
        ];

        return factors.reduce((acc, val) => acc + val, 0) / factors.length;
    }

    async initiateEmergencyProtocol(activity) {
        await this.alertSystem.notifyAdmins({
            level: 'CRITICAL',
            activity,
            timestamp: new Date()
        });
        
        await this.temporaryFreeze(activity.userId);
    }
}
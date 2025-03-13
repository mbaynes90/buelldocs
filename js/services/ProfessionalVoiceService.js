class ProfessionalVoiceService {
    constructor() {
        this.callCenter = new CallCenter();
        this.voiceTraining = new VoiceTraining();
        this.scheduler = new CallScheduler();
    }

    async scheduleCall(config) {
        const agent = await this.selectAgent(config);
        await this.voiceTraining.prepareAgent(agent, config.script);
        
        return await this.scheduler.book({
            agent,
            target: config.targetContact,
            script: config.script,
            time: config.preferredTime,
            backupNumber: config.backupNumber,
            priority: config.urgency === 'HIGH' ? 1 : 3
        });
    }

    async selectAgent(config) {
        return await this.callCenter.findAgent({
            voice: config.voiceType,
            gender: config.gender,
            accent: config.accent,
            industry: config.industry,
            availability: config.preferredTime
        });
    }
}
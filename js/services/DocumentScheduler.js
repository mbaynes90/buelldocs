class DocumentScheduler {
    constructor() {
        this.queue = new PriorityQueue();
        this.initializeScheduler();
    }

    async initializeScheduler() {
        // Load existing schedules from database
        const schedules = await db.schedules.getActive();
        schedules.forEach(schedule => this.queue.add(schedule));
        
        // Start processing loop
        setInterval(() => this.processQueue(), 60000); // Check every minute
    }

    async createSchedule(scheduleConfig) {
        const schedule = {
            ...scheduleConfig,
            status: 'active',
            createdAt: new Date(),
            lastDelivery: null
        };

        await db.schedules.create(schedule);
        this.queue.add(schedule);
        return schedule;
    }

    async processQueue() {
        const now = new Date();
        while (this.queue.peek() && this.queue.peek().nextDeliveryDate <= now) {
            const schedule = this.queue.poll();
            await this.processSchedule(schedule);
        }
    }

    async processSchedule(schedule) {
        try {
            const deliveryService = new DocumentDeliveryService();
            await deliveryService.processScheduledDeliveries();
            
            if (schedule.frequency !== 'once') {
                const nextDelivery = this.calculateNextDeliveryDate(schedule);
                await this.updateSchedule(schedule.id, { nextDeliveryDate: nextDelivery });
                this.queue.add({ ...schedule, nextDeliveryDate: nextDelivery });
            }
        } catch (error) {
            console.error(`Schedule processing failed for ${schedule.id}:`, error);
            await this.handleScheduleError(schedule, error);
        }
    }

    async pauseSchedule(scheduleId) {
        await db.schedules.update(scheduleId, { status: 'paused' });
        this.queue.remove(scheduleId);
    }

    async resumeSchedule(scheduleId) {
        const schedule = await db.schedules.get(scheduleId);
        schedule.status = 'active';
        schedule.nextDeliveryDate = this.calculateNextDeliveryDate(schedule);
        
        await db.schedules.update(scheduleId, schedule);
        this.queue.add(schedule);
    }
}
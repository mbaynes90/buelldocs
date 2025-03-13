class ErrorRecoveryService {
    constructor() {
        this.retryQueue = new RetryQueue();
        this.notificationService = new NotificationService();
    }

    async handleOperationFailure(operation, error) {
        const recovery = {
            operationId: operation.id,
            type: operation.type,
            attempts: 0,
            maxAttempts: this.getMaxAttempts(operation.type),
            lastError: error,
            status: 'pending'
        };

        await this.retryQueue.add(recovery);
        await this.notifyAdministrators(operation, error);
    }

    async processRetryQueue() {
        const pendingRecoveries = await this.retryQueue.getPending();
        
        for (const recovery of pendingRecoveries) {
            if (recovery.attempts >= recovery.maxAttempts) {
                await this.handleMaxRetriesExceeded(recovery);
                continue;
            }

            try {
                await this.retryOperation(recovery);
                await this.retryQueue.markComplete(recovery.id);
            } catch (error) {
                await this.updateRetryStatus(recovery, error);
            }
        }
    }

    async handleMaxRetriesExceeded(recovery) {
        await this.notificationService.sendUrgentAlert({
            type: 'MAX_RETRIES_EXCEEDED',
            operation: recovery.operationId,
            errors: recovery.errors
        });
        
        await this.initiateManualIntervention(recovery);
    }
}
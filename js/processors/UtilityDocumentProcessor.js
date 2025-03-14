class UtilityDocumentProcessor extends BaseDocumentProcessor {
    constructor() {
        super();
        this.utilityProviders = new UtilityProviderDatabase();
        this.usageCalculator = new UsageCalculationSystem();
    }

    async generateDocument(template, orderData) {
        const { documentType, details } = orderData;

        switch(documentType) {
            case 'electric_bill':
                return await this.generateElectricBill(template, details);
            case 'water_bill':
                return await this.generateWaterBill(template, details);
            case 'gas_bill':
                return await this.generateGasBill(template, details);
            case 'internet_bill':
                return await this.generateInternetBill(template, details);
            default:
                throw new Error('Unsupported utility document type');
        }
    }

    async generateElectricBill(template, details) {
        const providerInfo = await this.utilityProviders.getElectricProvider(details.location);
        const usageData = await this.usageCalculator.calculateElectricUsage({
            monthlyAverage: details.targetAmount,
            season: details.season,
            propertySize: details.propertySize
        });

        return template.generate({
            ...details,
            provider: providerInfo,
            usage: usageData,
            statementDate: this.generateStatementDate(details.targetDate),
            dueDate: this.generateDueDate(details.targetDate)
        });
    }

    async generateWaterBill(template, details) {
        const providerInfo = await this.utilityProviders.getWaterProvider(details.location);
        const usageData = await this.usageCalculator.calculateWaterUsage({
            monthlyAverage: details.targetAmount,
            household: details.householdSize
        });

        return template.generate({
            ...details,
            provider: providerInfo,
            usage: usageData,
            statementDate: this.generateStatementDate(details.targetDate),
            dueDate: this.generateDueDate(details.targetDate)
        });
    }

    // Similar implementations for gas and internet bills...

    generateStatementDate(targetDate) {
        const date = new Date(targetDate);
        date.setDate(date.getDate() - 15); // Statement typically generated 15 days before due
        return date.toISOString();
    }

    generateDueDate(targetDate) {
        return new Date(targetDate).toISOString();
    }
}
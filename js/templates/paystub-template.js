class PaystubTemplate extends BaseTemplate {
    constructor() {
        super();
        this.validationRules = {
            payRate: /^\d+(\.\d{2})?$/,
            payPeriod: /^\d{4}-\d{2}-\d{2}$/,
            employerId: /^[A-Z0-9]{6,10}$/
        };
        
        this.formatters = {
            payRate: (value) => parseFloat(value).toFixed(2),
            payPeriod: (value) => new Date(value).toISOString().split('T')[0],
            employerName: (value) => value.toUpperCase()
        };
    }

    async createPreview(formData) {
        const formatted = this.formatData(formData);
        return `
            <div class="paystub-preview">
                <div class="preview-header">
                    <h4>${formatted.employerName}</h4>
                    <div class="pay-period">Period: ${formatted.payPeriod}</div>
                </div>
                <div class="preview-body">
                    <div class="pay-details">
                        <div class="gross-pay">Gross Pay: $${formatted.payRate}</div>
                        <div class="deductions">
                            <div>Federal Tax: $${this.calculateTax(formatted.payRate, 'federal')}</div>
                            <div>State Tax: $${this.calculateTax(formatted.payRate, 'state')}</div>
                            <div>Social Security: $${this.calculateTax(formatted.payRate, 'social')}</div>
                        </div>
                        <div class="net-pay">Net Pay: $${this.calculateNetPay(formatted.payRate)}</div>
                    </div>
                </div>
            </div>
        `;
    }

    async createFinalDocument(formData) {
        const formatted = this.formatData(formData);
        return {
            type: 'paystub',
            data: formatted,
            calculations: {
                grossPay: parseFloat(formatted.payRate),
                federalTax: this.calculateTax(formatted.payRate, 'federal'),
                stateTax: this.calculateTax(formatted.payRate, 'state'),
                socialSecurity: this.calculateTax(formatted.payRate, 'social'),
                netPay: this.calculateNetPay(formatted.payRate)
            },
            metadata: {
                generated: new Date().toISOString(),
                version: '1.0'
            }
        };
    }

    calculateTax(amount, type) {
        const rates = {
            federal: 0.15,
            state: 0.05,
            social: 0.062
        };
        return (parseFloat(amount) * rates[type]).toFixed(2);
    }

    calculateNetPay(grossPay) {
        const federal = this.calculateTax(grossPay, 'federal');
        const state = this.calculateTax(grossPay, 'state');
        const social = this.calculateTax(grossPay, 'social');
        return (parseFloat(grossPay) - federal - state - social).toFixed(2);
    }
}
class BaseTemplate {
    constructor() {
        this.validationRules = {};
        this.formatters = {};
    }

    formatData(formData) {
        const formatted = {};
        for (const [key, value] of Object.entries(formData)) {
            formatted[key] = this.formatters[key] ? 
                this.formatters[key](value) : 
                value;
        }
        return formatted;
    }

    validateData(formData) {
        const errors = [];
        for (const [key, rule] of Object.entries(this.validationRules)) {
            if (formData[key] && !rule.test(formData[key])) {
                errors.push(`Invalid ${key} format`);
            }
        }
        return errors;
    }

    async createPreview(formData) {
        throw new Error('Must be implemented by subclass');
    }

    async createFinalDocument(formData) {
        throw new Error('Must be implemented by subclass');
    }
}
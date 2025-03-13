class ServiceRegistry {
    constructor() {
        this.services = new Map();
        this.categories = new Map();
        this.initializeServices();
    }

    initializeServices() {
        // Documentation Services
        this.registerCategory('DOCUMENTATION', {
            name: 'Documentation Services',
            clearanceLevel: 'STANDARD',
            description: 'Strategic document solutions for systemic barriers'
        });

        // Income Representation
        this.registerService('HUSTLE_BOOST', {
            category: 'DOCUMENTATION',
            name: 'Hustle Boost Protocol',
            basePrice: 25.00,
            processor: new IncomeDocumentProcessor(),
            templates: ['paystub', 'w2', 'employment_letter'],
            turnaround: '3-5 days',
            rushAvailable: true,
            clearanceRequired: 'STANDARD'
        });

        // Financial Documentation
        this.registerService('MONEY_MOVES', {
            category: 'DOCUMENTATION',
            name: 'Money Moves System',
            basePrice: 35.00,
            processor: new FinancialDocumentProcessor(),
            templates: ['bank_statement', 'proof_funds'],
            turnaround: '2-4 days',
            rushAvailable: true,
            clearanceRequired: 'BETA'
        });

        // Utility Documentation Services
        this.registerCategory('UTILITY_DOCS', {
            name: 'Utility Documentation',
            clearanceLevel: 'BETA',
            description: 'Precision utility documentation generation'
        });

        this.registerService('UTILITY_SUITE', {
            category: 'UTILITY_DOCS',
            name: 'Utility Documentation Suite',
            basePrice: 30.00,
            processor: new UtilityDocumentProcessor(),
            templates: ['electric_bill', 'water_bill', 'gas_bill', 'internet_bill'],
            turnaround: '24-48 hours',
            rushAvailable: true,
            clearanceRequired: 'BETA'
        });

        // Digital Intervention Services
        this.registerCategory('DIGITAL_INTERVENTION', {
            name: 'Digital Intervention Services',
            clearanceLevel: 'ALPHA',
            description: 'Advanced digital operations for strategic resource management'
        });

        this.registerService('CALENDAR_OVERRIDE', {
            category: 'DIGITAL_INTERVENTION',
            name: 'Calendar Override Protocol',
            basePrice: 45.00,
            processor: new DigitalInterventionProcessor(),
            templates: ['calendar_override'],
            turnaround: '12-24 hours',
            rushAvailable: true,
            clearanceRequired: 'ALPHA'
        });

        // Add new category for educational materials
        this.registerCategory('EDUCATIONAL_MATERIALS', {
            name: 'Educational Materials',
            clearanceLevel: 'BETA',
            description: 'Educational demonstration materials'
        });

        // Add synthetic specimen kit service
        this.registerService('SYNTHETIC_SPECIMEN', {
            category: 'EDUCATIONAL_MATERIALS',
            name: 'Synthetic Specimen Kit',
            basePrice: 65.00,
            processor: new EducationalMaterialProcessor(),
            templates: ['specimen_instructions', 'educational_guide'],
            turnaround: '2-3 days',
            rushAvailable: true,
            clearanceRequired: 'BETA',
            status: 'BETA_TESTING',
            availabilityDate: '2024-03-01'
        });

        // Add executive messaging service
        this.registerService('EXECUTIVE_STATEMENT', {
            category: 'EDUCATIONAL_MATERIALS',
            name: 'Executive Statement',
            basePrice: 89.00,
            processor: new NoveltyItemProcessor(),
            templates: ['custom_message', 'packaging_slip'],
            turnaround: '3-5 days',
            rushAvailable: true,
            clearanceRequired: 'BETA',
            status: 'BETA_TESTING',
            availabilityDate: '2024-02-15'
        });

        // Career Advancement Services
        this.registerCategory('CAREER_ADVANCEMENT', {
            name: 'Career Advancement Services',
            clearanceLevel: 'BETA',
            description: 'Strategic career development and certification solutions'
        });

        this.registerService('PRO_REFERENCE', {
            category: 'CAREER_ADVANCEMENT',
            name: 'Professional Reference Package',
            basePrice: 149.00,
            processor: new CareerAdvancementProcessor(),
            templates: ['reference_letter', 'phone_script', 'linkedin_recommendations'],
            turnaround: '24-48 hours',
            rushAvailable: true,
            clearanceRequired: 'BETA'
        });

        this.registerService('OFFER_LETTER', {
            category: 'CAREER_ADVANCEMENT',
            name: 'Custom Offer Letter',
            basePrice: 99.00,
            processor: new OfferLetterProcessor(),
            templates: ['offer_letter'],
            turnaround: '24 hours',
            rushAvailable: true,
            clearanceRequired: 'BETA'
        });

        this.registerService('PRO_RESUME', {
            category: 'CAREER_ADVANCEMENT',
            name: 'Professional Resume Creation',
            basePrice: 129.00,
            processor: new ResumeProcessor(),
            templates: ['executive_resume', 'technical_resume', 'creative_resume'],
            turnaround: '48 hours',
            rushAvailable: true,
            clearanceRequired: 'BETA'
        });

        // Certification Services
        this.registerCategory('CERTIFICATIONS', {
            name: 'Professional Certifications',
            clearanceLevel: 'BETA',
            description: 'Industry-recognized certification documentation'
        });

        this.registerService('FORKLIFT_CERT', {
            category: 'CERTIFICATIONS',
            name: 'Forklift Operator Certification',
            basePrice: 79.00,
            processor: new CertificationProcessor(),
            templates: ['forklift_cert'],
            turnaround: '24 hours',
            rushAvailable: true,
            clearanceRequired: 'BETA'
        });

        this.registerService('ESA_CERT', {
            category: 'CERTIFICATIONS',
            name: 'Emotional Support Animal Certification',
            basePrice: 89.00,
            processor: new CertificationProcessor(),
            templates: ['esa_cert', 'esa_letter'],
            turnaround: '24 hours',
            rushAvailable: true,
            clearanceRequired: 'BETA'
        });

        this.registerService('FOOD_HANDLER', {
            category: 'CERTIFICATIONS',
            name: 'Food Handler Certification',
            basePrice: 69.00,
            processor: new CertificationProcessor(),
            templates: ['food_handler_cert'],
            turnaround: '24 hours',
            rushAvailable: true,
            clearanceRequired: 'BETA'
        });

        this.registerService('MEDICAL_NOTE', {
            category: 'CERTIFICATIONS',
            name: 'Medical Documentation',
            basePrice: 149.00,
            processor: new MedicalDocProcessor(),
            templates: ['doctors_note'],
            turnaround: '12 hours',
            rushAvailable: true,
            clearanceRequired: 'ALPHA',
            requiresConsultation: true
        });
    }

    registerService(id, config) {
        this.services.set(id, {
            id,
            ...config,
            validate: () => this.validateService(id)
        });
    }

    registerCategory(id, config) {
        this.categories.set(id, {
            id,
            ...config,
            services: new Set()
        });
    }

    getService(id) {
        return this.services.get(id);
    }

    getCategory(id) {
        return this.categories.get(id);
    }

    validateService(id) {
        const service = this.services.get(id);
        if (!service) return false;
        
        return {
            isValid: true,
            processor: service.processor,
            templates: service.templates
        };
    }
}
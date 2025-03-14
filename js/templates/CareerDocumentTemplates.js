class CareerDocumentTemplates {
    constructor() {
        this.templates = {
            offer_letter: {
                sections: ['header', 'compensation', 'benefits', 'terms'],
                validation: {
                    companyName: /^[A-Za-z0-9\s.,&-]{2,100}$/,
                    salary: /^\d{4,8}(\.\d{2})?$/,
                    startDate: /^\d{4}-\d{2}-\d{2}$/
                }
            },
            reference_letter: {
                sections: ['header', 'relationship', 'achievements', 'endorsement'],
                validation: {
                    referentName: /^[A-Za-z\s.-]{2,50}$/,
                    duration: /^\d{1,2}\s+(?:year|month)s?$/
                }
            },
            professional_resume: {
                sections: ['contact', 'summary', 'experience', 'education', 'skills'],
                validation: {
                    name: /^[A-Za-z\s.-]{2,50}$/,
                    email: /^[^@]+@[^@]+\.[^@]+$/,
                    phone: /^\+?[\d\s-]{10,}$/
                }
            }
        };
    }

    getTemplate(type) {
        if (!this.templates[type]) {
            throw new Error(`Template ${type} not found`);
        }
        return this.templates[type];
    }

    generateOfferLetter(data) {
        return `
            <div class="offer-letter">
                <div class="company-header">
                    <h1>${data.companyName}</h1>
                    <p>${data.date}</p>
                </div>
                <div class="offer-content">
                    <p>Dear ${data.candidateName},</p>
                    <p>We are pleased to offer you the position of ${data.position} at ${data.companyName}...</p>
                    <div class="compensation">
                        <h2>Compensation</h2>
                        <p>Base Salary: $${data.salary}</p>
                        ${data.bonus ? `<p>Bonus: ${data.bonus}</p>` : ''}
                    </div>
                    <!-- Additional sections -->
                </div>
                <div class="signature-block">
                    <!-- Signature section -->
                </div>
            </div>
        `;
    }

    generateResume(data) {
        return `
            <div class="professional-resume">
                <div class="resume-header">
                    <h1>${data.name}</h1>
                    <div class="contact-info">
                        ${data.email} | ${data.phone} | ${data.location}
                    </div>
                </div>
                <!-- Professional Summary -->
                <div class="resume-summary">
                    <h2>Professional Summary</h2>
                    <p>${data.summary}</p>
                </div>
                <!-- Experience Section -->
                <div class="experience-section">
                    <h2>Professional Experience</h2>
                    ${this.generateExperienceEntries(data.experience)}
                </div>
                <!-- Additional sections -->
            </div>
        `;
    }

    private generateExperienceEntries(experience) {
        return experience.map(job => `
            <div class="experience-entry">
                <h3>${job.title} - ${job.company}</h3>
                <p class="date-range">${job.startDate} - ${job.endDate}</p>
                <ul>
                    ${job.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                </ul>
            </div>
        `).join('');
    }
}
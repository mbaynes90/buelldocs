// Navigation and Site Functionality Manager
class BuellDocsNavigator {
    constructor() {
        this.currentPage = window.location.pathname.split('/').pop() || 'index.html';
        this.sitePages = {
            home: 'index.html',
            about: 'AboutUS.html',
            services: 'services.html',
            register: 'register.html',
            faq: 'FAQ.html',
            login: 'Secure-Access-Portal.html'
        };
        
        this.init();
        this.initializeMobileMenu();
        this.initializeTouchSupport();
    }

    init() {
        this.setupNavigation();
        this.setupForms();
        this.setupUIInteractions();
        this.initializePageSpecifics();
    }

    setupNavigation() {
        // Logo navigation
        const logo = document.querySelector('.logo');
        if (logo) {
            logo.addEventListener('click', () => this.navigateTo(this.sitePages.home));
        }

        // Nav links
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href').replace('/', '');
                this.navigateTo(href);
            });
        });

        // CTA buttons
        document.querySelectorAll('.cta-button').forEach(button => {
            button.addEventListener('click', (e) => {
                if (button.getAttribute('href')) {
                    e.preventDefault();
                    const href = button.getAttribute('href').replace('/', '');
                    this.navigateTo(href);
                }
            });
        });
    }

    setupForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleFormSubmission(e, form));
        });

        // Real-time validation
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', (e) => this.validateField(e.target));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (field.type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailRegex.test(value);
                errorMessage = 'Please enter a valid email address';
                break;

            case 'text':
                if (field.name === 'name') {
                    isValid = value.length >= 2;
                    errorMessage = 'Name must be at least 2 characters long';
                }
                break;

            case 'textarea':
                isValid = value.length >= 10;
                errorMessage = 'Please provide more detailed information';
                break;

            case 'select-one':
                isValid = value !== '';
                errorMessage = 'Please select an option';
                break;
        }

        this.updateFieldValidationUI(field, isValid, errorMessage);
        return isValid;
    }

    updateFieldValidationUI(field, isValid, errorMessage) {
        const errorElement = field.parentElement.querySelector('.error-message') 
            || document.createElement('div');
        
        errorElement.className = 'error-message';
        
        if (!isValid) {
            errorElement.textContent = errorMessage;
            field.classList.add('invalid');
            if (!field.parentElement.contains(errorElement)) {
                field.parentElement.appendChild(errorElement);
            }
        } else {
            field.classList.remove('invalid');
            errorElement.remove();
        }
    }

    async handleFormSubmission(e, form) {
        e.preventDefault();

        // Validate all fields
        const fields = form.querySelectorAll('input, textarea, select');
        let isValid = true;
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.showNotification('Please correct the errors before submitting.', 'error');
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Validate passwords match
        if (data.password !== data.passwordConfirm) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    service: data.service,
                    details: data.details
                })
            });

            const result = await response.json();

            if (result.success) {
                // Store auth token and user info
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('operativeId', result.operativeId);
                localStorage.setItem('userEmail', data.email);
                
                this.showNotification('Registration successful! Redirecting...', 'success');
                setTimeout(() => this.navigateTo('/portal.html'), 2000);
            } else {
                this.showNotification(result.message || 'Registration failed', 'error');
            }
        } catch (error) {
            this.showNotification('Connection error. Please try again.', 'error');
        }
    }

    setupUIInteractions() {
        // FAQ accordion
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const faqItem = question.parentElement;
                faqItem.classList.toggle('active');
            });
        });

        // Service selection storage
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', () => {
                const service = card.dataset.service;
                if (service) {
                    localStorage.setItem('selectedService', service);
                }
            });
        });
    }

    initializePageSpecifics() {
        switch (this.currentPage) {
            case 'register.html':
                this.initializeRegistrationPage();
                break;
            case 'Secure-Access-Portal.html':
                this.initializeSecurePortal();
                break;
        }
    }

    initializeRegistrationPage() {
        const serviceSelect = document.querySelector('select[name="service"]');
        const savedService = localStorage.getItem('selectedService');
        
        if (serviceSelect && savedService) {
            serviceSelect.value = savedService;
            localStorage.removeItem('selectedService');
        }
    }

    initializeSecurePortal() {
        const operativeId = localStorage.getItem('operativeId');
        if (operativeId) {
            document.getElementById('operativeId')?.setAttribute('value', operativeId);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    navigateTo(page) {
        window.location.href = page;
    }

    initializeMobileMenu() {
        const header = document.querySelector('header');
        header.insertAdjacentHTML('beforeend', `
            <button class="mobile-menu-btn">☰</button>
        `);

        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');

        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('header') && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                mobileMenuBtn.textContent = '☰';
            }
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuBtn.textContent = '☰';
            });
        });
    }

    initializeTouchSupport() {
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);

        document.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, false);
    }

    handleSwipe() {
        const swipeThreshold = 50;
        const navLinks = document.querySelector('.nav-links');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');

        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe left - close menu
            navLinks.classList.remove('active');
            mobileMenuBtn.textContent = '☰';
        } else if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe right - open menu
            navLinks.classList.add('active');
            mobileMenuBtn.textContent = '✕';
        }
    }
}

// Initialize navigation system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.buellDocs = new BuellDocsNavigator();
});
const PDFDocument = require('pdfkit');
const crypto = require('crypto');

class DocumentGenerator {
    constructor() {
        this.templates = {
            paystub: require('../templates/paystub.js'),
            bankStatement: require('../templates/bank-statement.js'),
            utilityBill: require('../templates/utility-bill.js')
        };
    }

    async generateDocument(type, data) {
        const template = this.templates[type];
        if (!template) {
            throw new Error('Invalid document type');
        }

        const doc = new PDFDocument();
        await template.generate(doc, data);
        
        const fileHash = this.generateFileHash(doc);
        return {
            document: doc,
            hash: fileHash
        };
    }

    generateFileHash(doc) {
        const hash = crypto.createHash('sha256');
        hash.update(doc.toString());
        return hash.digest('hex');
    }
}
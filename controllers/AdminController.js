const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');
const { generateId } = require('../utils/helpers');

const ADMINS_FILE = path.join(__dirname, '../data/admins.json');

class AdminController {
    static async createAdmin(adminData) {
        const { username, password, role = 'admin' } = adminData;
        
        const admins = await this.readAdmins();
        if (admins.find(a => a.username === username)) {
            throw new Error('Admin username already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = {
            id: generateId(),
            username,
            password: hashedPassword,
            role,
            createdAt: new Date().toISOString()
        };

        admins.push(newAdmin);
        await this.writeAdmins(admins);
        
        const { password: _, ...adminWithoutPassword } = newAdmin;
        return adminWithoutPassword;
    }

    static async getAllAdmins() {
        const admins = await this.readAdmins();
        return admins.map(({ password, ...admin }) => admin);
    }

    static async validateAdmin(username, password) {
        const admins = await this.readAdmins();
        const admin = admins.find(a => a.username === username);
        
        if (!admin) return false;
        return bcrypt.compare(password, admin.password);
    }

    static async readAdmins() {
        try {
            const data = await fs.readFile(ADMINS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // Initialize with default super admin
            const defaultAdmin = {
                id: generateId(),
                username: 'Mbaynes',
                password: await bcrypt.hash('TrainPass3030!', 10),
                role: 'superadmin',
                createdAt: new Date().toISOString()
            };
            await this.writeAdmins([defaultAdmin]);
            return [defaultAdmin];
        }
    }

    static async writeAdmins(admins) {
        await fs.writeFile(ADMINS_FILE, JSON.stringify(admins, null, 2));
    }
}

module.exports = AdminController;
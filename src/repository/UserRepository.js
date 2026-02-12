import UserDTO from '../dto/User.dto.js';
import userModel from "./models/User.js";

export default class UserRepository {
    constructor(dao) {
        this.dao = dao;
    }

    create = async (user) => await this.dao.save(user);
    get = async (id) => await this.dao.getById(id);
    getBy = async (query) => await this.dao.getBy(query);
    getUserByEmail = async (email) => await this.dao.getBy({ email });
    getUserById = async (id) => await this.dao.getById(id);
    getAll = async (query = {}, options = {}) => await this.dao.get(query, options);
    update = async (id, user) => await this.dao.update(id, user);
    delete = async (id) => await this.dao.delete(id);

    updateUserLastConnection = async (userId) => {
        try {
            return await this.dao.update(userId, { last_connection: new Date() });
        } catch (error) {
            console.error('Error en updateUserLastConnection:', error);
            throw error;
        }
    }

    addUserDocument = async (userId, document) => {
        try {
            return await this.dao.update(userId, { $push: { documents: document } });
        } catch (error) {
            console.error('Error en addUserDocument:', error);
            throw error;
        }
    }

    updateLoginAttempts = async (userId, attempts) => {
        try {
            const attemptsNumber = parseInt(attempts) || 0;
            let updateData = { failedLoginAttempts: attemptsNumber };
            
            if (attemptsNumber >= 5) 
                updateData.lockUntil = new Date(Date.now() + 60 * 60 * 1000);
            else if (attemptsNumber === 0) 
                updateData.$unset = { lockUntil: 1 };
            
            return await this.dao.update(userId, updateData);
        } catch (error) {
            console.error('Error en updateLoginAttempts:', error);
            throw error;
        }
    }

    getUsersPaginated = async (page = 1, limit = 10, query = {}) => {
        try {
            const skip = (page - 1) * limit;
            const users = await this.dao.get(query, { skip, limit });
            const total = await userModel.countDocuments(query);
            
            return { 
                users, 
                pagination: { 
                    page: parseInt(page), limit: parseInt(limit), total, 
                    pages: Math.ceil(total / limit), hasPrevPage: page > 1, 
                    hasNextPage: page * limit < total 
                } 
            };
        } catch (error) {
            console.error('Error en getUsersPaginated:', error);
            throw error;
        }
    }

    changeUserRole = async (userId, newRole) => {
        try {
            const validRoles = ['user', 'admin', 'premium'];
            if (!validRoles.includes(newRole)) 
                throw new Error(`Rol inválido. Roles permitidos: ${validRoles.join(', ')}`);
            return await this.dao.update(userId, { role: newRole });
        } catch (error) {
            console.error('Error en changeUserRole:', error);
            throw error;
        }
    }

    deleteInactiveUsers = async (inactiveDays = 30) => {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);
            return await userModel.deleteMany({ last_connection: { $lt: cutoffDate }, role: { $ne: 'admin' } });
        } catch (error) {
            console.error('Error en deleteInactiveUsers:', error);
            throw error;
        }
    }

    getUserStatistics = async () => {
        try {
            const totalUsers = await userModel.countDocuments({});
            const activeUsers = await userModel.countDocuments({ last_connection: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
            const usersByRole = await userModel.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
            const recentRegistrations = await userModel.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
            
            return {
                totalUsers, activeUsers, inactiveUsers: totalUsers - activeUsers,
                usersByRole: usersByRole.reduce((acc, curr) => { acc[curr._id] = curr.count; return acc; }, {}),
                recentRegistrations, percentageActive: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
            };
        } catch (error) {
            console.error('Error en getUserStatistics:', error);
            throw error;
        }
    }

    getUserDTO = (user) => UserDTO.getUserTokenFrom(user);
}
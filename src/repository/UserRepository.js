// src/repository/UserRepository.js - ARCHIVO COMPLETO MODIFICADO
import UserDTO from '../dto/User.dto.js';

export default class UserRepository {
    constructor(dao) {
        this.dao = dao;
    }

    // Métodos existentes
    create = async (user) => {
        return await this.dao.create(user);
    }

    get = async (id) => {
        return await this.dao.get(id);
    }

    getBy = async (query) => {
        return await this.dao.getBy(query);
    }

    getUserByEmail = async (email) => {
        return await this.dao.getBy({ email });
    }

    getUserById = async (id) => {
        return await this.dao.get(id);
    }

    getAll = async (query = {}, options = {}) => {
        return await this.dao.getAll(query, options);
    }

    update = async (id, user) => {
        return await this.dao.update(id, user);
    }

    delete = async (id) => {
        return await this.dao.delete(id);
    }

    // MÉTODOS NUEVOS - AGREGADOS PARA COMPLETAR REQUISITOS
    updateUserLastConnection = async (userId) => {
        try {
            const result = await this.dao.update(userId, {
                last_connection: new Date()
            });
            return result;
        } catch (error) {
            console.error('Error en updateUserLastConnection:', error);
            throw error;
        }
    }

    addUserDocument = async (userId, document) => {
        try {
            const result = await this.dao.update(userId, {
                $push: { documents: document }
            });
            return result;
        } catch (error) {
            console.error('Error en addUserDocument:', error);
            throw error;
        }
    }

    updateLoginAttempts = async (userId, attempts) => {
        try {
            let updateData = { failedLoginAttempts: attempts };
            
            if (attempts >= 5) {
                // Bloquear por 1 hora si tiene 5 o más intentos fallidos
                updateData.lockUntil = new Date(Date.now() + 60 * 60 * 1000);
            } else if (attempts === 0) {
                // Resetear bloqueo si intentos son 0
                updateData.$unset = { lockUntil: 1 };
            }
            
            return await this.dao.update(userId, updateData);
        } catch (error) {
            console.error('Error en updateLoginAttempts:', error);
            throw error;
        }
    }

    // Método para obtener usuarios con paginación
    getUsersPaginated = async (page = 1, limit = 10, query = {}) => {
        try {
            const skip = (page - 1) * limit;
            const users = await this.dao.getAll(query, { skip, limit });
            const total = await this.dao.count(query);
            
            return {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                    hasPrevPage: page > 1,
                    hasNextPage: page * limit < total
                }
            };
        } catch (error) {
            console.error('Error en getUsersPaginated:', error);
            throw error;
        }
    }

    // Método para cambiar rol de usuario
    changeUserRole = async (userId, newRole) => {
        try {
            const validRoles = ['user', 'admin', 'premium'];
            if (!validRoles.includes(newRole)) {
                throw new Error(`Rol inválido. Roles permitidos: ${validRoles.join(', ')}`);
            }
            
            return await this.dao.update(userId, { role: newRole });
        } catch (error) {
            console.error('Error en changeUserRole:', error);
            throw error;
        }
    }

    // Método para eliminar usuarios inactivos
    deleteInactiveUsers = async (inactiveDays = 30) => {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);
            
            const query = {
                last_connection: { $lt: cutoffDate },
                role: { $ne: 'admin' } // No eliminar admins
            };
            
            const result = await this.dao.deleteMany(query);
            return result;
        } catch (error) {
            console.error('Error en deleteInactiveUsers:', error);
            throw error;
        }
    }

    // Método para obtener estadísticas de usuarios
    getUserStatistics = async () => {
        try {
            const totalUsers = await this.dao.count({});
            const activeUsers = await this.dao.count({
                last_connection: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            });
            
            const usersByRole = await this.dao.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } }
            ]);
            
            const recentRegistrations = await this.dao.count({
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            });
            
            return {
                totalUsers,
                activeUsers,
                inactiveUsers: totalUsers - activeUsers,
                usersByRole: usersByRole.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                recentRegistrations,
                percentageActive: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
            };
        } catch (error) {
            console.error('Error en getUserStatistics:', error);
            throw error;
        }
    }

    // Método para transformar usuario a DTO
    getUserDTO = (user) => {
        return UserDTO.getUserTokenFrom(user);
    }
}
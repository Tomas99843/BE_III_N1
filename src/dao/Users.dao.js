import userModel from "./models/User.js";
import logger from '../utils/logger.js';

export default class Users {
    getById = async (id) => {
        try {
            return await userModel.findById(id);
        } catch (error) {
            logger.error(`Error en Users.getById: ${error.message}`, error);
            throw error;
        }
    }

    get = async (params, options = {}) => {
        try {
            const query = userModel.find(params);
            
            if (options.page && options.limit) {
                const page = parseInt(options.page, 10) || 1;
                const limit = parseInt(options.limit, 10) || 10;
                const skip = (page - 1) * limit;
                
                query.skip(skip).limit(limit);
                
                const [results, total] = await Promise.all([query.exec(), userModel.countDocuments(params)]);
                
                return {
                    results,
                    pagination: { total, page, limit, pages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 }
                };
            }
            
            return await query.exec();
        } catch (error) {
            logger.error(`Error en Users.get: ${error.message}`, error);
            throw error;
        }
    }

    getBy = async (params, select = '') => {
        try {
            return await userModel.findOne(params).select(select);
        } catch (error) {
            logger.error(`Error en Users.getBy: ${error.message}`, error);
            throw error;
        }
    }

    save = async (doc) => {
        try {
            return await userModel.create(doc);
        } catch (error) {
            logger.error(`Error en Users.save: ${error.message}`, error);
            throw error;
        }
    }

    update = async (id, doc, options = { new: true }) => {
        try {
            return await userModel.findByIdAndUpdate(id, { $set: doc }, options);
        } catch (error) {
            logger.error(`Error en Users.update: ${error.message}`, error);
            throw error;
        }
    }

    delete = async (id) => {
        try {
            return await userModel.findByIdAndDelete(id);
        } catch (error) {
            logger.error(`Error en Users.delete: ${error.message}`, error);
            throw error;
        }
    }
    
    updateLastConnection = async (id) => {
        try {
            return await userModel.findByIdAndUpdate(id, { $set: { last_connection: new Date() } }, { new: true });
        } catch (error) {
            logger.error(`Error en Users.updateLastConnection: ${error.message}`, error);
            throw error;
        }
    }
    
    getUsersWithMissingDocuments = async () => {
        try {
            return await userModel.find({
                $or: [
                    { 'documents': { $size: 0 } },
                    { 'documents.name': { $not: { $in: ['identificacion', 'comprobante_domicilio'] } } }
                ]
            });
        } catch (error) {
            logger.error(`Error en getUsersWithMissingDocuments: ${error.message}`, error);
            throw error;
        }
    }
    
    addDocument = async (userId, document) => {
        try {
            return await userModel.findByIdAndUpdate(userId, { $push: { documents: document } }, { new: true });
        } catch (error) {
            logger.error(`Error en Users.addDocument: ${error.message}`, error);
            throw error;
        }
    }
    
    updateLoginAttempts = async (userId, attempts, lockUntil = null) => {
        try {
            const update = { $set: { failedLoginAttempts: attempts } };
            if (lockUntil) update.$set.lockUntil = lockUntil;
            else update.$unset = { lockUntil: 1 };
            
            return await userModel.findByIdAndUpdate(userId, update, { new: true });
        } catch (error) {
            logger.error(`Error en updateLoginAttempts: ${error.message}`, error);
            throw error;
        }
    }
}
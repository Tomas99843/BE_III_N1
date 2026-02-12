import adoptionModel from "./models/Adoption.js";
import logger from '../utils/logger.js';

export default class Adoption {
    get = async (params, options = {}) => {
        try {
            const query = adoptionModel.find(params)
                .populate('owner', 'first_name last_name email')
                .populate('pet', 'name specie breed image');
            
            if (options.page || options.limit) {
                const page = parseInt(options.page, 10) || 1;
                const limit = parseInt(options.limit, 10) || 10;
                const skip = (page - 1) * limit;
                
                query.skip(skip).limit(limit);
                
                const [results, total] = await Promise.all([query.exec(), adoptionModel.countDocuments(params)]);
                
                return {
                    results,
                    pagination: { total, page, limit, pages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 }
                };
            }
            
            const results = await query.exec();
            return { results, pagination: { total: results.length, page: 1, limit: results.length, pages: 1, hasNextPage: false, hasPrevPage: false } };
        } catch (error) {
            logger.error(`Error en Adoption.get: ${error.message}`, error);
            throw error;
        }
    }

    getBy = async (params) => {
        try {
            return await adoptionModel.findOne(params)
                .populate('owner', 'first_name last_name email')
                .populate('pet', 'name specie breed image');
        } catch (error) {
            logger.error(`Error en Adoption.getBy: ${error.message}`, error);
            throw error;
        }
    }

    save = async (doc) => {
        try {
            return await adoptionModel.create(doc);
        } catch (error) {
            logger.error(`Error en Adoption.save: ${error.message}`, error);
            throw error;
        }
    }

    update = async (id, doc) => {
        try {
            return await adoptionModel.findByIdAndUpdate(id, { $set: doc }, { new: true });
        } catch (error) {
            logger.error(`Error en Adoption.update: ${error.message}`, error);
            throw error;
        }
    }
    
    delete = async (id) => {
        try {
            return await adoptionModel.findByIdAndDelete(id);
        } catch (error) {
            logger.error(`Error en Adoption.delete: ${error.message}`, error);
            throw error;
        }
    }
    
    getAdoptionsByUser = async (userId) => {
        try {
            const results = await adoptionModel.find({ owner: userId })
                .populate('pet', 'name specie breed image status')
                .sort({ adoptionDate: -1 });
            
            return { results, pagination: { total: results.length, page: 1, limit: results.length, pages: 1, hasNextPage: false, hasPrevPage: false } };
        } catch (error) {
            logger.error(`Error en getAdoptionsByUser: ${error.message}`, error);
            throw error;
        }
    }
    
    updateAdoptionStatus = async (id, status, notes = '') => {
        try {
            return await adoptionModel.findByIdAndUpdate(id, { $set: { status, ...(notes && { notes }) } }, { new: true });
        } catch (error) {
            logger.error(`Error en updateAdoptionStatus: ${error.message}`, error);
            throw error;
        }
    }
    
    isPetInAdoptionProcess = async (petId) => {
        try {
            const adoption = await adoptionModel.findOne({ pet: petId, status: { $in: ['pending', 'approved'] } });
            return !!adoption;
        } catch (error) {
            logger.error(`Error en isPetInAdoptionProcess: ${error.message}`, error);
            throw error;
        }
    }

    count = async (params = {}) => {
        try {
            return await adoptionModel.countDocuments(params);
        } catch (error) {
            logger.error(`Error en Adoption.count: ${error.message}`, error);
            throw error;
        }
    }
}
import petModel from "./models/Pet.js";
import logger from '../utils/logger.js';

export default class Pets {

    get = async (params, options = {}) => {
        try {
            const query = petModel.find(params)
                .populate('owner', 'first_name last_name email');
            
            if (options.page && options.limit) {
                const page = parseInt(options.page, 10) || 1;
                const limit = parseInt(options.limit, 10) || 10;
                const skip = (page - 1) * limit;
                
                query.skip(skip).limit(limit);
                
                const total = await petModel.countDocuments(params);
                const results = await query.exec();
                
                return {
                    results,
                    pagination: {
                        total,
                        page,
                        limit,
                        pages: Math.ceil(total / limit)
                    }
                };
            }
            
            return await query.exec();
        } catch (error) {
            logger.error(`Error en Pets.get: ${error.message}`, error);
            throw error;
        }
    }

    getBy = async (params) => {
        try {
            return await petModel.findOne(params)
                .populate('owner', 'first_name last_name email');
        } catch (error) {
            logger.error(`Error en Pets.getBy: ${error.message}`, error);
            throw error;
        }
    }

    save = async (doc) => {
        try {
            return await petModel.create(doc);
        } catch (error) {
            logger.error(`Error en Pets.save: ${error.message}`, error);
            throw error;
        }
    }

    update = async (id, doc) => {
        try {
            return await petModel.findByIdAndUpdate(id, { $set: doc }, { new: true });
        } catch (error) {
            logger.error(`Error en Pets.update: ${error.message}`, error);
            throw error;
        }
    }

    delete = async (id) => {
        try {
            return await petModel.findByIdAndDelete(id);
        } catch (error) {
            logger.error(`Error en Pets.delete: ${error.message}`, error);
            throw error;
        }
    }

    
    getAvailablePets = async (filters = {}) => {
        try {
            const query = { 
                adopted: false,
                status: 'available',
                ...filters
            };
            return await petModel.find(query)
                .populate('owner', 'first_name last_name email');
        } catch (error) {
            logger.error(`Error en getAvailablePets: ${error.message}`, error);
            throw error;
        }
    }

    
    getPetsByLocation = async (location) => {
        try {
            return await petModel.find({
                'location.city': new RegExp(location, 'i'),
                adopted: false
            });
        } catch (error) {
            logger.error(`Error en getPetsByLocation: ${error.message}`, error);
            throw error;
        }
    }
}
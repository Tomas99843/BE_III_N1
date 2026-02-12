import GenericRepository from "./GenericRepository.js";
import logger from '../utils/logger.js';

export default class AdoptionRepository extends GenericRepository {
    constructor(dao) {
        super(dao);
    }
    
    getAdoptionsByUser = async (userId, page = 1, limit = 10) => {
        try {
            return await this.getAll({ owner: userId }, { page, limit });
        } catch (error) {
            logger.error(`Error en AdoptionRepository.getAdoptionsByUser: ${error.message}`, error);
            throw error;
        }
    }
    
    getAdoptionsByPet = async (petId) => {
        try {
            return await this.getAll({ pet: petId });
        } catch (error) {
            logger.error(`Error en AdoptionRepository.getAdoptionsByPet: ${error.message}`, error);
            throw error;
        }
    }
    
    getAdoptionsByStatus = async (status, page = 1, limit = 10) => {
        try {
            return await this.getAll({ status }, { page, limit });
        } catch (error) {
            logger.error(`Error en AdoptionRepository.getAdoptionsByStatus: ${error.message}`, error);
            throw error;
        }
    }
    
    updateAdoptionStatus = async (adoptionId, status, notes = '') => {
        try {
            const updateData = { status };
            if (notes) updateData.notes = notes;
            return await this.update(adoptionId, updateData);
        } catch (error) {
            logger.error(`Error en AdoptionRepository.updateAdoptionStatus: ${error.message}`, error);
            throw error;
        }
    }
    
    approveAdoption = async (adoptionId, notes = '') => {
        try {
            return await this.updateAdoptionStatus(adoptionId, 'approved', notes);
        } catch (error) {
            logger.error(`Error en AdoptionRepository.approveAdoption: ${error.message}`, error);
            throw error;
        }
    }
    
    rejectAdoption = async (adoptionId, notes = '') => {
        try {
            return await this.updateAdoptionStatus(adoptionId, 'rejected', notes);
        } catch (error) {
            logger.error(`Error en AdoptionRepository.rejectAdoption: ${error.message}`, error);
            throw error;
        }
    }
    
    completeAdoption = async (adoptionId, notes = '') => {
        try {
            return await this.updateAdoptionStatus(adoptionId, 'completed', notes);
        } catch (error) {
            logger.error(`Error en AdoptionRepository.completeAdoption: ${error.message}`, error);
            throw error;
        }
    }
    
    isPetInAdoptionProcess = async (petId) => {
        try {
            const adoption = await this.getBy({ pet: petId, status: { $in: ['pending', 'approved'] } });
            return !!adoption;
        } catch (error) {
            logger.error(`Error en AdoptionRepository.isPetInAdoptionProcess: ${error.message}`, error);
            throw error;
        }
    }
    
    getPendingAdoptions = async (page = 1, limit = 10) => {
        try {
            return await this.getAdoptionsByStatus('pending', page, limit);
        } catch (error) {
            logger.error(`Error en AdoptionRepository.getPendingAdoptions: ${error.message}`, error);
            throw error;
        }
    }
    
    createAdoptionRequest = async (userId, petId, notes = '') => {
        try {
            const isInProcess = await this.isPetInAdoptionProcess(petId);
            if (isInProcess) throw new Error('Esta mascota ya está en proceso de adopción');
            
            return await this.create({ owner: userId, pet: petId, status: 'pending', ...(notes && { notes }) });
        } catch (error) {
            logger.error(`Error en AdoptionRepository.createAdoptionRequest: ${error.message}`, error);
            throw error;
        }
    }
    
    getAdoptionStatistics = async () => {
        try {
            return await this.dao.getAdoptionStatistics();
        } catch (error) {
            logger.error(`Error en AdoptionRepository.getAdoptionStatistics: ${error.message}`, error);
            throw error;
        }
    }
    
    getRecentAdoptions = async (days = 30, limit = 10) => {
        try {
            const date = new Date();
            date.setDate(date.getDate() - days);
            
            return await this.getAll({ 
                createdAt: { $gte: date }, 
                status: { $in: ['approved', 'completed'] } 
            }, { limit });
        } catch (error) {
            logger.error(`Error en AdoptionRepository.getRecentAdoptions: ${error.message}`, error);
            throw error;
        }
    }
    
    cancelAdoption = async (adoptionId, notes = '') => {
        try {
            return await this.updateAdoptionStatus(adoptionId, 'cancelled', notes);
        } catch (error) {
            logger.error(`Error en AdoptionRepository.cancelAdoption: ${error.message}`, error);
            throw error;
        }
    }
    
    hasUserRequestedAdoption = async (userId, petId) => {
        try {
            const adoption = await this.getBy({ owner: userId, pet: petId, status: { $in: ['pending', 'approved'] } });
            return !!adoption;
        } catch (error) {
            logger.error(`Error in AdoptionRepository.hasUserRequestedAdoption: ${error.message}`, error);
            return false;
        }
    }
}
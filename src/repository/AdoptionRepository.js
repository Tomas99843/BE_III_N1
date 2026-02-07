import GenericRepository from "./GenericRepository.js";
import logger from '../utils/logger.js';

export default class AdoptionRepository extends GenericRepository {
    constructor(dao) {
        super(dao);
    }
    
    // Método específico: Obtener adopciones por usuario
    getAdoptionsByUser = async (userId, page = 1, limit = 10) => {
        try {
            const query = { owner: userId };
            return await this.getAll(query, { page, limit });
        } catch (error) {
            logger.error(`Error en AdoptionRepository.getAdoptionsByUser: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Obtener adopciones por mascota
    getAdoptionsByPet = async (petId) => {
        try {
            return await this.getAll({ pet: petId });
        } catch (error) {
            logger.error(`Error en AdoptionRepository.getAdoptionsByPet: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Obtener adopciones por estado
    getAdoptionsByStatus = async (status, page = 1, limit = 10) => {
        try {
            const query = { status: status };
            return await this.getAll(query, { page, limit });
        } catch (error) {
            logger.error(`Error en AdoptionRepository.getAdoptionsByStatus: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Cambiar estado de adopción
    updateAdoptionStatus = async (adoptionId, status, notes = '') => {
        try {
            const updateData = { status };
            if (notes) {
                updateData.notes = notes;
            }
            
            return await this.update(adoptionId, updateData);
        } catch (error) {
            logger.error(`Error en AdoptionRepository.updateAdoptionStatus: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Aprobar adopción
    approveAdoption = async (adoptionId, notes = '') => {
        try {
            return await this.updateAdoptionStatus(adoptionId, 'approved', notes);
        } catch (error) {
            logger.error(`Error en AdoptionRepository.approveAdoption: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Rechazar adopción
    rejectAdoption = async (adoptionId, notes = '') => {
        try {
            return await this.updateAdoptionStatus(adoptionId, 'rejected', notes);
        } catch (error) {
            logger.error(`Error en AdoptionRepository.rejectAdoption: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Completar adopción
    completeAdoption = async (adoptionId, notes = '') => {
        try {
            return await this.updateAdoptionStatus(adoptionId, 'completed', notes);
        } catch (error) {
            logger.error(`Error en AdoptionRepository.completeAdoption: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Verificar si mascota ya está en proceso de adopción
    isPetInAdoptionProcess = async (petId) => {
        try {
            const adoption = await this.getBy({ 
                pet: petId, 
                status: { $in: ['pending', 'approved'] } 
            });
            return !!adoption;
        } catch (error) {
            logger.error(`Error en AdoptionRepository.isPetInAdoptionProcess: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Obtener adopciones pendientes
    getPendingAdoptions = async (page = 1, limit = 10) => {
        try {
            return await this.getAdoptionsByStatus('pending', page, limit);
        } catch (error) {
            logger.error(`Error en AdoptionRepository.getPendingAdoptions: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Crear solicitud de adopción
    createAdoptionRequest = async (userId, petId, notes = '') => {
        try {
            // Verificar que la mascota no esté ya en proceso
            const isInProcess = await this.isPetInAdoptionProcess(petId);
            if (isInProcess) {
                throw new Error('Esta mascota ya está en proceso de adopción');
            }
            
            const adoptionData = {
                owner: userId,
                pet: petId,
                status: 'pending',
                ...(notes && { notes })
            };
            
            return await this.create(adoptionData);
        } catch (error) {
            logger.error(`Error en AdoptionRepository.createAdoptionRequest: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Obtener estadísticas de adopciones
    getAdoptionStatistics = async () => {
        try {
            const stats = await this.dao.getAdoptionStatistics();
            return stats;
        } catch (error) {
            logger.error(`Error en AdoptionRepository.getAdoptionStatistics: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Obtener adopciones recientes
    getRecentAdoptions = async (days = 30, limit = 10) => {
        try {
            const date = new Date();
            date.setDate(date.getDate() - days);
            
            const query = { 
                createdAt: { $gte: date },
                status: { $in: ['approved', 'completed'] }
            };
            
            return await this.getAll(query, { limit });
        } catch (error) {
            logger.error(`Error en AdoptionRepository.getRecentAdoptions: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Cancelar adopción
    cancelAdoption = async (adoptionId, notes = '') => {
        try {
            return await this.updateAdoptionStatus(adoptionId, 'cancelled', notes);
        } catch (error) {
            logger.error(`Error en AdoptionRepository.cancelAdoption: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Verificar si usuario ya tiene solicitud para mascota
    hasUserRequestedAdoption = async (userId, petId) => {
        try {
            const adoption = await this.getBy({ 
                owner: userId, 
                pet: petId,
                status: { $in: ['pending', 'approved'] }
            });
            return !!adoption;
        } catch (error) {
            logger.error(`Error in AdoptionRepository.hasUserRequestedAdoption: ${error.message}`, error);
            return false;
        }
    }
}
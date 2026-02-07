import GenericRepository from "./GenericRepository.js";
import logger from '../utils/logger.js';

export default class PetRepository extends GenericRepository {
    constructor(dao) {
        super(dao);
    }
    
    // Método específico: Obtener mascotas disponibles para adopción
    getAvailablePets = async (filters = {}, page = 1, limit = 10) => {
        try {
            const query = { 
                adopted: false,
                status: 'available',
                ...filters
            };
            
            return await this.getAll(query, { page, limit });
        } catch (error) {
            logger.error(`Error en PetRepository.getAvailablePets: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Buscar mascotas por especie
    getPetsBySpecie = async (specie, page = 1, limit = 10) => {
        try {
            const query = { 
                specie: specie,
                adopted: false 
            };
            
            return await this.getAll(query, { page, limit });
        } catch (error) {
            logger.error(`Error en PetRepository.getPetsBySpecie: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Obtener mascotas por dueño
    getPetsByOwner = async (ownerId, includeAdopted = false) => {
        try {
            const query = { owner: ownerId };
            
            if (!includeAdopted) {
                query.adopted = false;
            }
            
            return await this.getAll(query);
        } catch (error) {
            logger.error(`Error en PetRepository.getPetsByOwner: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Buscar mascotas por ubicación (ciudad)
    getPetsByLocation = async (city, page = 1, limit = 10) => {
        try {
            const query = { 
                'location.city': new RegExp(city, 'i'),
                adopted: false 
            };
            
            return await this.getAll(query, { page, limit });
        } catch (error) {
            logger.error(`Error en PetRepository.getPetsByLocation: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Obtener mascotas recientemente agregadas
    getRecentPets = async (days = 7, limit = 10) => {
        try {
            const date = new Date();
            date.setDate(date.getDate() - days);
            
            const query = { 
                createdAt: { $gte: date },
                adopted: false 
            };
            
            return await this.getAll(query, { limit });
        } catch (error) {
            logger.error(`Error en PetRepository.getRecentPets: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Actualizar imagen de mascota
    updatePetImage = async (petId, imageUrl) => {
        try {
            return await this.update(petId, { image: imageUrl });
        } catch (error) {
            logger.error(`Error en PetRepository.updatePetImage: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Adoptar mascota (marcar como adoptada)
    adoptPet = async (petId, ownerId) => {
        try {
            return await this.update(petId, { 
                adopted: true, 
                owner: ownerId,
                status: 'adopted' 
            });
        } catch (error) {
            logger.error(`Error en PetRepository.adoptPet: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Liberar mascota (remover adopción)
    releasePet = async (petId) => {
        try {
            return await this.update(petId, { 
                adopted: false, 
                $unset: { owner: 1 },
                status: 'available' 
            });
        } catch (error) {
            logger.error(`Error en PetRepository.releasePet: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Buscar mascotas por nombre (búsqueda parcial)
    searchPetsByName = async (name, page = 1, limit = 10) => {
        try {
            const query = { 
                name: new RegExp(name, 'i'),
                adopted: false 
            };
            
            return await this.getAll(query, { page, limit });
        } catch (error) {
            logger.error(`Error en PetRepository.searchPetsByName: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Obtener estadísticas de mascotas
    getPetStatistics = async () => {
        try {
            const stats = await this.dao.getPetStatistics();
            return stats;
        } catch (error) {
            logger.error(`Error en PetRepository.getPetStatistics: ${error.message}`, error);
            throw error;
        }
    }
    
    // Método específico: Verificar si mascota existe y está disponible
    isPetAvailable = async (petId) => {
        try {
            const pet = await this.getBy({ _id: petId });
            return pet && !pet.adopted;
        } catch (error) {
            logger.error(`Error en PetRepository.isPetAvailable: ${error.message}`, error);
            return false;
        }
    }
}
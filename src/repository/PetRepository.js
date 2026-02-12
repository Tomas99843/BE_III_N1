import GenericRepository from "./GenericRepository.js";
import logger from '../utils/logger.js';

export default class PetRepository extends GenericRepository {
    constructor(dao) {
        super(dao);
    }
    
    getAvailablePets = async (filters = {}, page = 1, limit = 10) => {
        try {
            return await this.getAll({ adopted: false, status: 'available', ...filters }, { page, limit });
        } catch (error) {
            logger.error(`Error en PetRepository.getAvailablePets: ${error.message}`, error);
            throw error;
        }
    }
    
    getPetsBySpecie = async (specie, page = 1, limit = 10) => {
        try {
            return await this.getAll({ specie, adopted: false }, { page, limit });
        } catch (error) {
            logger.error(`Error en PetRepository.getPetsBySpecie: ${error.message}`, error);
            throw error;
        }
    }
    
    getPetsByOwner = async (ownerId, includeAdopted = false) => {
        try {
            const query = { owner: ownerId };
            if (!includeAdopted) query.adopted = false;
            return await this.getAll(query);
        } catch (error) {
            logger.error(`Error en PetRepository.getPetsByOwner: ${error.message}`, error);
            throw error;
        }
    }
    
    getPetsByLocation = async (city, page = 1, limit = 10) => {
        try {
            return await this.getAll({ 'location.city': new RegExp(city, 'i'), adopted: false }, { page, limit });
        } catch (error) {
            logger.error(`Error en PetRepository.getPetsByLocation: ${error.message}`, error);
            throw error;
        }
    }
    
    getRecentPets = async (days = 7, limit = 10) => {
        try {
            const date = new Date();
            date.setDate(date.getDate() - days);
            return await this.getAll({ createdAt: { $gte: date }, adopted: false }, { limit });
        } catch (error) {
            logger.error(`Error en PetRepository.getRecentPets: ${error.message}`, error);
            throw error;
        }
    }
    
    updatePetImage = async (petId, imageUrl) => {
        try {
            return await this.update(petId, { image: imageUrl });
        } catch (error) {
            logger.error(`Error en PetRepository.updatePetImage: ${error.message}`, error);
            throw error;
        }
    }
    
    adoptPet = async (petId, ownerId) => {
        try {
            return await this.update(petId, { adopted: true, owner: ownerId, status: 'adopted' });
        } catch (error) {
            logger.error(`Error en PetRepository.adoptPet: ${error.message}`, error);
            throw error;
        }
    }
    
    releasePet = async (petId) => {
        try {
            return await this.update(petId, { adopted: false, $unset: { owner: 1 }, status: 'available' });
        } catch (error) {
            logger.error(`Error en PetRepository.releasePet: ${error.message}`, error);
            throw error;
        }
    }
    
    searchPetsByName = async (name, page = 1, limit = 10) => {
        try {
            return await this.getAll({ name: new RegExp(name, 'i'), adopted: false }, { page, limit });
        } catch (error) {
            logger.error(`Error en PetRepository.searchPetsByName: ${error.message}`, error);
            throw error;
        }
    }
    
    getPetStatistics = async () => {
        try {
            return await this.dao.getPetStatistics();
        } catch (error) {
            logger.error(`Error en PetRepository.getPetStatistics: ${error.message}`, error);
            throw error;
        }
    }
    
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
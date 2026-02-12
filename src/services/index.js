import UsersDAO from "../dao/Users.dao.js";
import PetsDAO from "../dao/Pets.dao.js";
import AdoptionDAO from "../dao/Adoption.dao.js";
import UserRepository from "../repository/UserRepository.js";
import PetRepository from "../repository/PetRepository.js";
import AdoptionRepository from "../repository/AdoptionRepository.js";

const usersDAO = new UsersDAO();
const petsDAO = new PetsDAO();
const adoptionDAO = new AdoptionDAO();

export const usersService = new UserRepository(usersDAO);
export const petsService = new PetRepository(petsDAO);
export const adoptionsService = new AdoptionRepository(adoptionDAO);

export const adoptionServices = {
    getAllAdoptions: async (filters = {}, options = {}) => {
        try {
            return await adoptionsService.getAll(filters, options);
        } catch (error) {
            throw error;
        }
    },

    createAdoptionRequest: async (userId, petId, notes = '') => {
        try {
            const existing = await adoptionsService.getBy({ pet: petId, status: 'pending' });
            if (existing) throw new Error('Esta mascota ya está en proceso de adopción');
            
            return await adoptionsService.create({ owner: userId, pet: petId, status: 'pending', notes, createdAt: new Date() });
        } catch (error) {
            throw error;
        }
    },

    approveAdoption: async (adoptionId, notes = '') => {
        try {
            return await adoptionsService.update(adoptionId, { status: 'approved', notes: notes || 'Adopción aprobada', approvedAt: new Date() });
        } catch (error) {
            throw error;
        }
    },

    rejectAdoption: async (adoptionId, notes = '') => {
        try {
            return await adoptionsService.update(adoptionId, { status: 'rejected', notes: notes || 'Adopción rechazada', rejectedAt: new Date() });
        } catch (error) {
            throw error;
        }
    },

    cancelAdoption: async (adoptionId, notes = '') => {
        try {
            return await adoptionsService.update(adoptionId, { status: 'cancelled', notes: notes || 'Adopción cancelada', cancelledAt: new Date() });
        } catch (error) {
            throw error;
        }
    },

    isPetInAdoptionProcess: async (petId) => {
        try {
            const adoption = await adoptionsService.getBy({ pet: petId, status: { $in: ['pending', 'approved'] } });
            return !!adoption;
        } catch (error) {
            throw error;
        }
    },

    getUserAdoptions: async (userId, filters = {}, options = {}) => {
        try {
            filters.owner = userId;
            return await adoptionsService.getAll(filters, options);
        } catch (error) {
            throw error;
        }
    }
};

export default { usersService, petsService, adoptionsService, adoptionServices };
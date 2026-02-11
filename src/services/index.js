import UsersDAO from "../dao/Users.dao.js";
import PetsDAO from "../dao/Pets.dao.js";
import AdoptionDAO from "../dao/Adoption.dao.js";

import UserRepository from "../repository/UserRepository.js";
import PetRepository from "../repository/PetRepository.js";
import AdoptionRepository from "../repository/AdoptionRepository.js";

// Crear instancias
const usersDAO = new UsersDAO();
const petsDAO = new PetsDAO();
const adoptionDAO = new AdoptionDAO();

// Servicios existentes
export const usersService = new UserRepository(usersDAO);
export const petsService = new PetRepository(petsDAO);
export const adoptionsService = new AdoptionRepository(adoptionDAO);

// Servicios adicionales para funcionalidad completa
export const adoptionServices = {
    // Obtener todas las adopciones con paginación
    getAllAdoptions: async (filters = {}, options = {}) => {
        try {
            const result = await adoptionsService.getAll(filters, options);
            return result;
        } catch (error) {
            throw error;
        }
    },

    // Crear solicitud de adopción
    createAdoptionRequest: async (userId, petId, notes = '') => {
        try {
            // Verificar si ya existe una adopción para esta mascota
            const existing = await adoptionsService.getBy({ pet: petId, status: 'pending' });
            if (existing) {
                throw new Error('Esta mascota ya está en proceso de adopción');
            }

            const adoptionData = {
                owner: userId,
                pet: petId,
                status: 'pending',
                notes: notes,
                createdAt: new Date()
            };

            return await adoptionsService.create(adoptionData);
        } catch (error) {
            throw error;
        }
    },

    // Aprobar adopción
    approveAdoption: async (adoptionId, notes = '') => {
        try {
            return await adoptionsService.update(adoptionId, {
                status: 'approved',
                notes: notes || 'Adopción aprobada',
                approvedAt: new Date()
            });
        } catch (error) {
            throw error;
        }
    },

    // Rechazar adopción
    rejectAdoption: async (adoptionId, notes = '') => {
        try {
            return await adoptionsService.update(adoptionId, {
                status: 'rejected',
                notes: notes || 'Adopción rechazada',
                rejectedAt: new Date()
            });
        } catch (error) {
            throw error;
        }
    },

    // Cancelar adopción
    cancelAdoption: async (adoptionId, notes = '') => {
        try {
            return await adoptionsService.update(adoptionId, {
                status: 'cancelled',
                notes: notes || 'Adopción cancelada',
                cancelledAt: new Date()
            });
        } catch (error) {
            throw error;
        }
    },

    // Verificar si mascota está en proceso de adopción
    isPetInAdoptionProcess: async (petId) => {
        try {
            const adoption = await adoptionsService.getBy({ 
                pet: petId, 
                status: { $in: ['pending', 'approved'] } 
            });
            return !!adoption;
        } catch (error) {
            throw error;
        }
    },

    // Obtener adopciones por usuario
    getUserAdoptions: async (userId, filters = {}, options = {}) => {
        try {
            filters.owner = userId;
            const result = await adoptionsService.getAll(filters, options);
            return result;
        } catch (error) {
            throw error;
        }
    }
};

// Exportar todos los servicios para facilitar las importaciones
export default {
    usersService,
    petsService,
    adoptionsService,
    adoptionServices
};
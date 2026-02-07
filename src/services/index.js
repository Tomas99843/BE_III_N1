import UsersDAO from "../dao/Users.dao.js";
import PetsDAO from "../dao/Pets.dao.js";
import AdoptionDAO from "../dao/Adoption.dao.js";

import UserRepository from "../repository/UserRepository.js";
import PetRepository from "../repository/PetRepository.js";
import AdoptionRepository from "../repository/AdoptionRepository.js";

// Servicios existentes
export const usersService = new UserRepository(new UsersDAO());
export const petsService = new PetRepository(new PetsDAO());
export const adoptionsService = new AdoptionRepository(new AdoptionDAO());

// NOTA: documentsController se importa directamente donde se necesita
// No necesita estar en este index

// Exportar todos los servicios para facilitar las importaciones
export default {
    usersService,
    petsService,
    adoptionsService
};
import PetDTO from "../dto/Pet.dto.js";
import { petsService } from "../services/index.js";
import __dirname from "../utils/index.js";

const getAllPets = async(req, res) => {
    try {
        req.logger.info('Obteniendo todas las mascotas');
        const pets = await petsService.getAll();
        
        if (!pets || pets.length === 0) {
            req.logger.warning('No se encontraron mascotas en la base de datos');
        } else {
            req.logger.info(`Se encontraron ${pets.length} mascotas`);
        }
        
        res.send({ status: "success", payload: pets });
    } catch (error) {
        req.logger.error(`Error al obtener mascotas: ${error.message}`, error);
        res.status(500).send({ status: "error", error: "Error interno del servidor" });
    }
};

const createPet = async(req, res) => {
    try {
        const { name, specie, birthDate } = req.body;
        
        if (!name || !specie || !birthDate) {
            req.logger.warning('Intento de crear mascota con datos incompletos');
            return res.status(400).send({ status: "error", error: "Incomplete values" });
        }
        
        req.logger.info(`Creando mascota: ${name} (${specie})`);
        const pet = PetDTO.getPetInputFrom({ name, specie, birthDate });
        const result = await petsService.create(pet);
        
        req.logger.info(`Mascota creada exitosamente - ID: ${result._id}`);
        res.send({ status: "success", payload: result });
    } catch (error) {
        req.logger.error(`Error al crear mascota: ${error.message}`, error);
        res.status(500).send({ status: "error", error: "Error interno del servidor" });
    }
};

const updatePet = async(req, res) => {
    try {
        const petUpdateBody = req.body;
        const petId = req.params.pid;
        
        req.logger.info(`Actualizando mascota ID: ${petId}`);
        const result = await petsService.update(petId, petUpdateBody);
        
        if (!result) {
            req.logger.warning(`Mascota no encontrada para actualizar - ID: ${petId}`);
            return res.status(404).send({ status: "error", error: "Pet not found" });
        }
        
        req.logger.info(`Mascota actualizada exitosamente - ID: ${petId}`);
        res.send({ status: "success", message: "pet updated" });
    } catch (error) {
        req.logger.error(`Error al actualizar mascota: ${error.message}`, error);
        res.status(500).send({ status: "error", error: "Error interno del servidor" });
    }
};

const deletePet = async(req, res) => {
    try {
        const petId = req.params.pid;
        
        req.logger.info(`Eliminando mascota ID: ${petId}`);
        const result = await petsService.delete(petId);
        
        if (!result) {
            req.logger.warning(`Mascota no encontrada para eliminar - ID: ${petId}`);
            return res.status(404).send({ status: "error", error: "Pet not found" });
        }
        
        req.logger.info(`Mascota eliminada exitosamente - ID: ${petId}`);
        res.send({ status: "success", message: "pet deleted" });
    } catch (error) {
        req.logger.error(`Error al eliminar mascota: ${error.message}`, error);
        res.status(500).send({ status: "error", error: "Error interno del servidor" });
    }
};

const createPetWithImage = async(req, res) => {
    try {
        const file = req.file;
        const { name, specie, birthDate } = req.body;
        
        if (!name || !specie || !birthDate) {
            req.logger.warning('Intento de crear mascota con imagen pero datos incompletos');
            return res.status(400).send({ status: "error", error: "Incomplete values" });
        }
        
        if (!file) {
            req.logger.warning('Intento de crear mascota con imagen pero no se subió archivo');
            return res.status(400).send({ status: "error", error: "No image uploaded" });
        }
        
        req.logger.info(`Creando mascota con imagen: ${name} (${specie}) - Archivo: ${file.filename}`);
        
        const pet = PetDTO.getPetInputFrom({
            name,
            specie,
            birthDate,
            image: `${__dirname}/../public/img/${file.filename}`
        });
        
        const result = await petsService.create(pet);
        
        req.logger.info(`Mascota con imagen creada exitosamente - ID: ${result._id}`);
        res.send({ status: "success", payload: result });
    } catch (error) {
        req.logger.error(`Error al crear mascota con imagen: ${error.message}`, error);
        res.status(500).send({ status: "error", error: "Error interno del servidor" });
    }
};

export default {
    getAllPets,
    createPet,
    updatePet,
    deletePet,
    createPetWithImage
    // 🚫 ELIMINAR: generateMockPets (se movió al router de mocks)
};
import PetDTO from "../dto/Pet.dto.js";
import { petsService } from "../services/index.js";
import __dirname from "../utils/index.js";

const getAllPets = async(req, res) => {
    try {
        req.logger.info('Obteniendo todas las mascotas');
        const { page = 1, limit = 10, specie, adopted, status } = req.query;
        const filters = {};
        
        if (specie) filters.specie = specie;
        if (adopted !== undefined) filters.adopted = adopted === 'true';
        if (status) filters.status = status;
        
        const result = await petsService.getAvailablePets(filters, page, limit);
        
        if (!result.results?.length) req.logger.warning('No se encontraron mascotas con los filtros aplicados');
        else req.logger.info(`Se encontraron ${result.results.length} mascotas`);
        
        const petsData = result.results.map(pet => PetDTO.getPetOutputFrom(pet));
        
        res.json({ status: "success", data: petsData, pagination: result.pagination });
    } catch (error) {
        req.logger.error(`Error al obtener mascotas: ${error.message}`, error);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const createPet = async(req, res) => {
    try {
        const { name, specie, birthDate } = req.body;
        if (!name || !specie || !birthDate) {
            req.logger.warning('Intento de crear mascota con datos incompletos');
            return res.status(400).json({ status: "error", error: "Valores incompletos. Se requieren: name, specie, birthDate" });
        }
        
        const sanitizedName = name.trim().substring(0, 50);
        const sanitizedSpecie = specie.trim().toLowerCase();
        req.logger.info(`Creando mascota: ${sanitizedName} (${sanitizedSpecie})`);
        
        const pet = PetDTO.getPetInputFrom({ name: sanitizedName, specie: sanitizedSpecie, birthDate });
        const result = await petsService.create(pet);
        
        req.logger.info(`Mascota creada exitosamente - ID: ${result._id}`);
        res.status(201).json({ status: "success", message: "Mascota creada exitosamente", data: PetDTO.getPetOutputFrom(result) });
    } catch (error) {
        req.logger.error(`Error al crear mascota: ${error.message}`, error);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const updatePet = async(req, res) => {
    try {
        const petUpdateBody = req.body, petId = req.params.pid;
        
        if (!petId.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).json({ status: "error", error: "ID de mascota inválido" });
        
        req.logger.info(`Actualizando mascota ID: ${petId}`);
        
        const allowedFields = ['name', 'specie', 'birthDate', 'breed', 'description', 'status', 'image'];
        const invalidFields = Object.keys(petUpdateBody).filter(f => !allowedFields.includes(f));
        if (invalidFields.length)
            return res.status(400).json({ status: "error", error: `Campos no permitidos: ${invalidFields.join(', ')}` });
        
        const result = await petsService.update(petId, petUpdateBody);
        if (!result) {
            req.logger.warning(`Mascota no encontrada para actualizar - ID: ${petId}`);
            return res.status(404).json({ status: "error", error: "Mascota no encontrada" });
        }
        
        req.logger.info(`Mascota actualizada exitosamente - ID: ${petId}`);
        res.json({ status: "success", message: "Mascota actualizada exitosamente", data: PetDTO.getPetOutputFrom(result) });
    } catch (error) {
        req.logger.error(`Error al actualizar mascota: ${error.message}`, error);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const deletePet = async(req, res) => {
    try {
        const petId = req.params.pid;
        
        if (!petId.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).json({ status: "error", error: "ID de mascota inválido" });
        
        req.logger.info(`Eliminando mascota ID: ${petId}`);
        
        const pet = await petsService.getBy({_id: petId});
        if (!pet) {
            req.logger.warning(`Mascota no encontrada para eliminar - ID: ${petId}`);
            return res.status(404).json({ status: "error", error: "Mascota no encontrada" });
        }
        
        if (pet.adopted)
            return res.status(400).json({ status: "error", error: "No se puede eliminar una mascota adoptada" });
        
        const result = await petsService.delete(petId);
        if (!result) return res.status(404).json({ status: "error", error: "Mascota no encontrada" });
        
        req.logger.info(`Mascota eliminada exitosamente - ID: ${petId}`);
        res.json({ status: "success", message: "Mascota eliminada exitosamente", data: { id: petId, deletedAt: new Date() } });
    } catch (error) {
        req.logger.error(`Error al eliminar mascota: ${error.message}`, error);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const createPetWithImage = async(req, res) => {
    try {
        const file = req.file, { name, specie, birthDate } = req.body;
        
        if (!name || !specie || !birthDate) {
            req.logger.warning('Intento de crear mascota con imagen pero datos incompletos');
            return res.status(400).json({ status: "error", error: "Valores incompletos. Se requieren: name, specie, birthDate" });
        }
        
        if (!file) {
            req.logger.warning('Intento de crear mascota con imagen pero no se subió archivo');
            return res.status(400).json({ status: "error", error: "No se subió ninguna imagen" });
        }
        
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype))
            return res.status(400).json({ status: "error", error: "Tipo de archivo no permitido. Use: JPEG, PNG, GIF o WEBP" });
        
        req.logger.info(`Creando mascota con imagen: ${name} (${specie}) - Archivo: ${file.filename}`);
        
        const pet = PetDTO.getPetInputFrom({ name, specie, birthDate, image: `/pets/${file.filename}` });
        const result = await petsService.create(pet);
        
        req.logger.info(`Mascota con imagen creada exitosamente - ID: ${result._id}`);
        res.status(201).json({ status: "success", message: "Mascota con imagen creada exitosamente", data: PetDTO.getPetOutputFrom(result) });
    } catch (error) {
        req.logger.error(`Error al crear mascota con imagen: ${error.message}`, error);
        if (error.code === 'LIMIT_FILE_SIZE')
            return res.status(400).json({ status: "error", error: "La imagen excede el tamaño máximo permitido (5MB)" });
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const getPetById = async (req, res) => {
    try {
        const petId = req.params.pid;
        
        if (!petId.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).json({ status: "error", error: "ID de mascota inválido" });
        
        req.logger.info(`Obteniendo mascota ID: ${petId}`);
        
        const pet = await petsService.getBy({_id: petId});
        if (!pet) {
            req.logger.warning(`Mascota no encontrada - ID: ${petId}`);
            return res.status(404).json({ status: "error", error: "Mascota no encontrada" });
        }
        
        res.json({ status: "success", data: PetDTO.getPetOutputFrom(pet) });
    } catch (error) {
        req.logger.error(`Error obteniendo mascota: ${error.message}`, error);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const getAvailablePets = async (req, res) => {
    try {
        const { page = 1, limit = 10, specie } = req.query;
        req.logger.info('Obteniendo mascotas disponibles para adopción');
        
        const filters = { adopted: false, status: 'available' };
        if (specie) filters.specie = specie;
        
        const result = await petsService.getAvailablePets(filters, page, limit);
        const petsData = result.results.map(pet => PetDTO.getPetForAdoption(pet));
        
        res.json({
            status: "success",
            data: petsData,
            pagination: result.pagination,
            message: petsData.length ? `${petsData.length} mascotas disponibles` : "No hay mascotas disponibles actualmente"
        });
    } catch (error) {
        req.logger.error(`Error obteniendo mascotas disponibles: ${error.message}`, error);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

export default {
    getAllPets, createPet, updatePet, deletePet, createPetWithImage, getPetById, getAvailablePets
};
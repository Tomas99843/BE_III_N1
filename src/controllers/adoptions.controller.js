import { adoptionsService, petsService, usersService } from "../services/index.js"
import logger from "../utils/logger.js";

const getAllAdoptions = async(req, res) => {
    try {
        req.logger.info('Obteniendo todas las adopciones');
        const { page = 1, limit = 10, status } = req.query;
        const filters = status ? { status } : {};
        const result = await adoptionsService.getAll(filters, { page, limit });
        
        if (!result.results?.length) req.logger.info('No se encontraron adopciones');
        else req.logger.info(`Se encontraron ${result.results.length} adopciones`);
        
        res.json({ status: "success", data: result.results, pagination: result.pagination });
    } catch (error) {
        req.logger.error(`Error obteniendo adopciones: ${error.message}`);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const getAdoption = async(req, res) => {
    try {
        const adoptionId = req.params.aid;
        if (!adoptionId.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).json({ status: "error", error: "ID de adopción inválido" });
        
        const adoption = await adoptionsService.getBy({_id: adoptionId});
        if(!adoption) return res.status(404).json({ status: "error", error: "Adopción no encontrada" });
        
        const userId = req.user?.id, isAdmin = req.user?.role === 'admin';
        const isOwner = adoption.owner._id.toString() === userId;
        let isPetOwner = false;
        
        if (adoption.pet?.owner) {
            const petOwnerId = adoption.pet.owner._id 
                ? adoption.pet.owner._id.toString() 
                : adoption.pet.owner.toString();
            isPetOwner = petOwnerId === userId;
        }
        
        if (!isAdmin && !isOwner && !isPetOwner)
            return res.status(403).json({ status: "error", error: "No autorizado para ver esta adopción" });
        
        res.json({ status: "success", data: adoption });
    } catch (error) {
        req.logger.error(`Error obteniendo adopción: ${error.message}`);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const updateAdoption = async(req, res) => {
    try {
        const adoptionId = req.params.aid, updateData = req.body;
        if (!adoptionId.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).json({ status: "error", error: "ID de adopción inválido" });
        
        const allowedFields = ['status', 'notes', 'adoptionFee'];
        const invalidFields = Object.keys(updateData).filter(f => !allowedFields.includes(f));
        if (invalidFields.length)
            return res.status(400).json({ status: "error", error: `Campos no permitidos: ${invalidFields.join(', ')}` });
        
        if (updateData.status && !['pending', 'approved', 'rejected', 'completed'].includes(updateData.status))
            return res.status(400).json({ status: "error", error: 'Estado inválido. Estados permitidos: pending, approved, rejected, completed' });
        
        const adoption = await adoptionsService.getBy({_id: adoptionId});
        if(!adoption) return res.status(404).json({ status: "error", error: "Adopción no encontrada" });
        
        const userId = req.user?.id, isAdmin = req.user?.role === 'admin';
        const isOwner = adoption.owner._id.toString() === userId;
        if (!isAdmin && !isOwner)
            return res.status(403).json({ status: "error", error: "No autorizado para actualizar esta adopción" });
        
        if ((updateData.status === 'approved' || updateData.status === 'rejected') && !isAdmin)
            return res.status(403).json({ status: "error", error: "Solo administradores pueden aprobar o rechazar adopciones" });
        
        const result = await adoptionsService.update(adoptionId, updateData);
        req.logger.info(`Adopción actualizada: ${adoptionId} por usuario: ${userId}`);
        
        if (updateData.status === 'approved') {
            await petsService.adoptPet(adoption.pet._id, adoption.owner._id);
            await usersService.update(adoption.owner._id, { $push: { pets: { _id: adoption.pet._id } } });
        }
        
        res.json({ status: "success", message: "Adopción actualizada exitosamente", data: result });
    } catch (error) {
        req.logger.error(`Error actualizando adopción: ${error.message}`);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const deleteAdoption = async(req, res) => {
    try {
        const adoptionId = req.params.aid;
        if (!adoptionId.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).json({ status: "error", error: "ID de adopción inválido" });
        
        const adoption = await adoptionsService.getBy({_id: adoptionId});
        if(!adoption) return res.status(404).json({ status: "error", error: "Adopción no encontrada" });
        
        if (req.user?.role !== 'admin')
            return res.status(403).json({ status: "error", error: "Solo administradores pueden eliminar adopciones" });
        
        if (!['pending', 'rejected'].includes(adoption.status))
            return res.status(400).json({ status: "error", error: `No se puede eliminar una adopción con estado: ${adoption.status}` });
        
        const result = await adoptionsService.delete(adoptionId);
        req.logger.info(`Adopción eliminada: ${adoptionId} por admin: ${req.user?.id}`);
        
        res.json({ status: "success", message: "Adopción eliminada exitosamente", data: { id: adoptionId, deletedAt: new Date() } });
    } catch (error) {
        req.logger.error(`Error eliminando adopción: ${error.message}`);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const createAdoption = async(req, res) => {
    try {
        const {uid, pid} = req.params;
        if (!uid.match(/^[0-9a-fA-F]{24}$/) || !pid.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).json({ status: "error", error: "IDs inválidos" });
        
        if (req.user?.id !== uid)
            return res.status(403).json({ status: "error", error: "No autorizado para crear adopción para otro usuario" });
        
        const user = await usersService.getUserById(uid);
        if(!user) return res.status(404).json({ status: "error", error: "Usuario no encontrado" });
        
        const pet = await petsService.getBy({_id: pid});
        if(!pet) return res.status(404).json({ status: "error", error: "Mascota no encontrada" });
        
        if(pet.adopted) return res.status(400).json({ status: "error", error: "La mascota ya está adoptada" });
        
        const existingAdoption = await adoptionsService.isPetInAdoptionProcess(pid);
        if (existingAdoption) return res.status(409).json({ status: "error", error: "Esta mascota ya está en proceso de adopción" });
        
        const adoption = await adoptionsService.createAdoptionRequest(uid, pid);
        req.logger.info(`Solicitud de adopción creada: Usuario ${uid}, Mascota ${pid}`);
        
        res.status(201).json({ status: "success", message: "Solicitud de adopción creada exitosamente", data: adoption });
    } catch (error) {
        req.logger.error(`Error creando adopción: ${error.message}`);
        if (error.message.includes('ya está en proceso de adopción'))
            return res.status(409).json({ status: "error", error: error.message });
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const getUserAdoptions = async(req, res) => {
    try {
        const userId = req.params.uid;
        if (!userId.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).json({ status: "error", error: "ID de usuario inválido" });
        
        const user = await usersService.getUserById(userId);
        if(!user) return res.status(404).json({ status: "error", error: "Usuario no encontrado" });
        
        const requestingUserId = req.user?.id;
        if (requestingUserId !== userId && req.user?.role !== 'admin')
            return res.status(403).json({ status: "error", error: "No autorizado para ver estas adopciones" });
        
        const { page = 1, limit = 10, status } = req.query;
        const filters = { owner: userId };
        if (status) filters.status = status;
        
        const result = await adoptionsService.getAll(filters, { page, limit });
        req.logger.info(`Adopciones obtenidas para usuario: ${userId}`);
        
        res.json({ status: "success", data: result.results, pagination: result.pagination });
    } catch (error) {
        req.logger.error(`Error obteniendo adopciones del usuario: ${error.message}`);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const approveAdoption = async (req, res) => {
    try {
        const adoptionId = req.params.aid, { notes } = req.body;
        if (!adoptionId.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).json({ status: "error", error: "ID de adopción inválido" });
        
        if (req.user?.role !== 'admin')
            return res.status(403).json({ status: "error", error: "Solo administradores pueden aprobar adopciones" });
        
        const adoption = await adoptionsService.getBy({_id: adoptionId});
        if (!adoption) return res.status(404).json({ status: "error", error: "Adopción no encontrada" });
        
        const approvedAdoption = await adoptionsService.approveAdoption(adoptionId, notes);
        await petsService.adoptPet(adoption.pet._id, adoption.owner._id);
        await usersService.update(adoption.owner._id, { $push: { pets: { _id: adoption.pet._id } } });
        
        req.logger.info(`Adopción aprobada: ${adoptionId}`);
        res.json({ status: "success", message: "Adopción aprobada exitosamente", data: approvedAdoption });
    } catch (error) {
        req.logger.error(`Error aprobando adopción: ${error.message}`);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const rejectAdoption = async (req, res) => {
    try {
        const adoptionId = req.params.aid, { notes } = req.body;
        if (!adoptionId.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).json({ status: "error", error: "ID de adopción inválido" });
        
        if (req.user?.role !== 'admin')
            return res.status(403).json({ status: "error", error: "Solo administradores pueden rechazar adopciones" });
        
        const adoption = await adoptionsService.getBy({_id: adoptionId});
        if (!adoption) return res.status(404).json({ status: "error", error: "Adopción no encontrada" });
        
        const rejectedAdoption = await adoptionsService.rejectAdoption(adoptionId, notes);
        req.logger.info(`Adopción rechazada: ${adoptionId}`);
        
        res.json({ status: "success", message: "Adopción rechazada exitosamente", data: rejectedAdoption });
    } catch (error) {
        req.logger.error(`Error rechazando adopción: ${error.message}`);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const getMyAdoptions = async (req, res) => {
    try {
        const userId = req.user?.id, { page = 1, limit = 10, status } = req.query;
        const filters = { owner: userId };
        if (status) filters.status = status;
        
        const result = await adoptionsService.getAll(filters, { page, limit });
        req.logger.info(`Adopciones obtenidas para usuario: ${userId}`);
        
        res.json({ status: "success", data: result.results, pagination: result.pagination });
    } catch (error) {
        req.logger.error(`Error obteniendo adopciones del usuario: ${error.message}`);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const cancelAdoption = async (req, res) => {
    try {
        const adoptionId = req.params.aid, { notes } = req.body;
        if (!adoptionId.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).json({ status: "error", error: "ID de adopción inválido" });
        
        const adoption = await adoptionsService.getBy({_id: adoptionId});
        if (!adoption) return res.status(404).json({ status: "error", error: "Adopción no encontrada" });
        
        const userId = req.user?.id, isOwner = adoption.owner._id.toString() === userId, isAdmin = req.user?.role === 'admin';
        if (!isOwner && !isAdmin)
            return res.status(403).json({ status: "error", error: "No autorizado para cancelar esta adopción" });
        
        if (adoption.status !== 'pending')
            return res.status(400).json({ status: "error", error: `No se puede cancelar una adopción con estado: ${adoption.status}` });
        
        const cancelledAdoption = await adoptionsService.cancelAdoption(adoptionId, notes);
        req.logger.info(`Adopción cancelada: ${adoptionId} por usuario: ${userId}`);
        
        res.json({ status: "success", message: "Adopción cancelada exitosamente", data: cancelledAdoption });
    } catch (error) {
        req.logger.error(`Error cancelando adopción: ${error.message}`);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

export default {
    getAllAdoptions, getAdoption, updateAdoption, deleteAdoption, createAdoption,
    getUserAdoptions, approveAdoption, rejectAdoption, getMyAdoptions, cancelAdoption
};
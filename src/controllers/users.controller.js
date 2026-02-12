import { usersService } from "../services/index.js";
import UserDTO from "../dto/User.dto.js";

const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, role } = req.query;
        const filters = role ? { role } : {};
        const result = await usersService.getUsersPaginated(page, limit, filters);
        
        const sanitizedUsers = result.results.map(user => UserDTO.getUserProfileFrom(user));
        req.logger?.info(`Usuarios obtenidos: ${sanitizedUsers.length}`);
        
        res.json({ status: "success", data: sanitizedUsers, pagination: result.pagination });
    } catch (error) {
        req.logger?.error(`Error obteniendo usuarios: ${error.message}`);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const getUser = async (req, res) => {
    try {
        const userId = req.params.uid;
        if (!userId.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).json({ status: "error", error: "ID de usuario inválido" });
        
        const user = await usersService.getUserById(userId);
        if (!user) return res.status(404).json({ status: "error", error: "Usuario no encontrado" });
        
        const requestingUserId = req.user?.id;
        if (requestingUserId !== userId && req.user?.role !== 'admin')
            return res.status(403).json({ status: "error", error: "No autorizado para ver este perfil" });
        
        res.json({ status: "success", data: UserDTO.getUserProfileFrom(user) });
    } catch (error) {
        req.logger?.error(`Error obteniendo usuario: ${error.message}`);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const updateUser = async (req, res) => {
    try {
        const updateBody = req.body, userId = req.params.uid;
        if (!userId.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).json({ status: "error", error: "ID de usuario inválido" });
        
        const user = await usersService.getUserById(userId);
        if (!user) return res.status(404).json({ status: "error", error: "Usuario no encontrado" });
        
        if (req.user?.id !== userId && req.user?.role !== 'admin')
            return res.status(403).json({ status: "error", error: "No autorizado para actualizar este usuario" });
        
        const allowedFields = ['first_name', 'last_name', 'email', 'role', 'status'];
        const invalidFields = Object.keys(updateBody).filter(f => !allowedFields.includes(f));
        if (invalidFields.length)
            return res.status(400).json({ status: "error", error: `Campos no permitidos: ${invalidFields.join(', ')}` });
        
        if (updateBody.role && req.user?.role !== 'admin')
            return res.status(403).json({ status: "error", error: "Solo administradores pueden cambiar roles" });
        
        const result = await usersService.update(userId, updateBody);
        req.logger?.info(`Usuario actualizado: ${userId}`);
        
        res.json({ status: "success", message: "Usuario actualizado exitosamente", data: UserDTO.getBasicUserInfo(result) });
    } catch (error) {
        req.logger?.error(`Error actualizando usuario: ${error.message}`);
        if (error.code === 11000)
            return res.status(409).json({ status: "error", error: "El email ya está en uso" });
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.uid;
        if (!userId.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).json({ status: "error", error: "ID de usuario inválido" });
        
        const user = await usersService.getUserById(userId);
        if (!user) return res.status(404).json({ status: "error", error: "Usuario no encontrado" });
        
        if (req.user?.id !== userId && req.user?.role !== 'admin')
            return res.status(403).json({ status: "error", error: "No autorizado para eliminar este usuario" });
        
        if (user.role === 'admin' && req.user?.role !== 'admin')
            return res.status(403).json({ status: "error", error: "No autorizado para eliminar administradores" });
        
        const result = await usersService.delete(userId);
        req.logger?.info(`Usuario eliminado: ${userId}`);
        
        res.json({ status: "success", message: "Usuario eliminado exitosamente", data: { id: userId, deletedAt: new Date() } });
    } catch (error) {
        req.logger?.error(`Error eliminando usuario: ${error.message}`);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const getUserDocuments = async (req, res) => {
    try {
        const userId = req.params.uid;
        if (!userId.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).json({ status: "error", error: "ID de usuario inválido" });
        
        const user = await usersService.getUserById(userId);
        if (!user) return res.status(404).json({ status: "error", error: "Usuario no encontrado" });
        
        if (req.user?.id !== userId && req.user?.role !== 'admin')
            return res.status(403).json({ status: "error", error: "No autorizado para ver estos documentos" });
        
        res.json({ status: "success", data: { userId, documents: user.documents || [], count: user.documents?.length || 0 } });
    } catch (error) {
        req.logger?.error(`Error obteniendo documentos: ${error.message}`);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

export default { getAllUsers, getUser, updateUser, deleteUser, getUserDocuments };
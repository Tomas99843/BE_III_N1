import { usersService } from "../services/index.js";
import logger from "../utils/logger.js";
import { sanitizeInput } from "../utils/index.js";

class DocumentsController {
    
    uploadDocuments = async (req, res) => {
        try {
            const userId = req.params.uid;
            const files = req.files || (req.file ? [req.file] : []);
            
            
            if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'ID de usuario inválido'
                });
            }
            
            
            const user = await usersService.getUserById(userId);
            if (!user) {
                logger.warning(`Intento de subir documentos para usuario no encontrado: ${userId}`);
                return res.status(404).json({
                    status: 'error',
                    message: 'Usuario no encontrado'
                });
            }
            
            
            if (files.length === 0) {
                logger.warning(`Intento de subir documentos sin archivos para usuario: ${userId}`);
                return res.status(400).json({
                    status: 'error',
                    message: 'No se han subido archivos'
                });
            }
            
            
            const maxDocuments = 20;
            if (user.documents.length + files.length > maxDocuments) {
                return res.status(400).json({
                    status: 'error',
                    message: `No se pueden subir más de ${maxDocuments} documentos. Actual: ${user.documents.length}, Intento: ${files.length}`
                });
            }
            
            
            const uploadedDocuments = files.map(file => {
                
                const sanitizedName = sanitizeInput(file.originalname);
                
                const document = {
                    name: sanitizedName.substring(0, 100), // Limitar longitud
                    reference: `/documents/${file.filename}`,
                    uploadedAt: new Date(),
                    fileType: file.mimetype,
                    fileSize: file.size
                };
                
                logger.info(`Documento subido: ${sanitizedName} (${file.size} bytes) para usuario ${userId}`);
                return document;
            });
            
            
            for (const document of uploadedDocuments) {
                await usersService.addUserDocument(userId, document);
            }
            
            
            const updatedUser = await usersService.getUserById(userId);
            
            logger.info(`${files.length} documentos subidos exitosamente para usuario: ${userId}`);
            
            res.status(201).json({
                status: 'success',
                message: `${files.length} documento(s) subido(s) exitosamente`,
                data: {
                    userId,
                    documents: uploadedDocuments,
                    totalDocuments: updatedUser.documents.length,
                    remainingSpace: maxDocuments - updatedUser.documents.length
                }
            });
            
        } catch (error) {
            logger.error(`Error en uploadDocuments: ${error.message}`, error);
            
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    status: 'error',
                    message: 'El archivo excede el tamaño máximo permitido (5MB)'
                });
            }
            
            if (error.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Tipo de archivo no permitido o demasiados archivos'
                });
            }
            
            res.status(500).json({
                status: 'error',
                message: 'Error interno del servidor al subir documentos'
            });
        }
    };

    
    getUserDocuments = async (req, res) => {
        try {
            const userId = req.params.uid;
            
            
            if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'ID de usuario inválido'
                });
            }
            
            const user = await usersService.getUserById(userId);
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Usuario no encontrado'
                });
            }
            
            
            const requestingUserId = req.user?.id;
            if (requestingUserId !== userId && req.user?.role !== 'admin') {
                return res.status(403).json({
                    status: 'error',
                    message: 'No autorizado para ver estos documentos'
                });
            }
            
            res.json({
                status: 'success',
                data: {
                    userId,
                    documents: user.documents || [],
                    count: user.documents?.length || 0,
                    hasDocuments: user.documents && user.documents.length > 0
                }
            });
            
        } catch (error) {
            logger.error(`Error en getUserDocuments: ${error.message}`, error);
            res.status(500).json({
                status: 'error',
                message: 'Error interno del servidor'
            });
        }
    };

    
    deleteDocument = async (req, res) => {
        try {
            const userId = req.params.uid;
            const documentId = req.params.did;
            
            
            if (!userId.match(/^[0-9a-fA-F]{24}$/) || !documentId.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'ID de usuario o documento inválido'
                });
            }
            
            const user = await usersService.getUserById(userId);
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Usuario no encontrado'
                });
            }
            
            
            if (req.user?.id !== userId && req.user?.role !== 'admin') {
                return res.status(403).json({
                    status: 'error',
                    message: 'No autorizado para eliminar documentos'
                });
            }
            
            
            const documentToDelete = user.documents.id(documentId);
            if (!documentToDelete) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Documento no encontrado'
                });
            }
            
            
            const result = await usersService.update(userId, {
                $pull: { documents: { _id: documentId } }
            });
            
            logger.info(`Documento eliminado: ${documentToDelete.name} del usuario: ${userId}`);
            
            res.json({
                status: 'success',
                message: 'Documento eliminado exitosamente',
                data: {
                    deletedDocument: documentToDelete,
                    remainingDocuments: result.documents.length
                }
            });
            
        } catch (error) {
            logger.error(`Error en deleteDocument: ${error.message}`, error);
            res.status(500).json({
                status: 'error',
                message: 'Error interno del servidor'
            });
        }
    };

    
    checkRequiredDocuments = async (req, res) => {
        try {
            const userId = req.params.uid;
            
            // Validar ID
            if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'ID de usuario inválido'
                });
            }
            
            const user = await usersService.getUserById(userId);
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Usuario no encontrado'
                });
            }
            
            
            if (req.user?.id !== userId && req.user?.role !== 'admin') {
                return res.status(403).json({
                    status: 'error',
                    message: 'No autorizado para verificar documentos'
                });
            }
            
            
            const requiredDocumentTypes = {
                basic: ['identificacion', 'comprobante_domicilio'],
                premium: ['identificacion', 'comprobante_domicilio', 'comprobante_ingresos'],
                adoption: ['identificacion', 'comprobante_domicilio', 'carta_motivacion']
            };
            
            const userDocNames = user.documents.map(doc => 
                doc.name.toLowerCase().replace(/\.[^/.]+$/, "") 
            );
            
            
            const results = {};
            for (const [type, requiredDocs] of Object.entries(requiredDocumentTypes)) {
                const missingDocuments = requiredDocs.filter(
                    doc => !userDocNames.includes(doc)
                );
                
                results[type] = {
                    hasAllRequired: missingDocuments.length === 0,
                    missingDocuments,
                    uploadedCount: user.documents.length,
                    requiredCount: requiredDocs.length
                };
            }
            
            res.json({
                status: 'success',
                data: {
                    userId,
                    results,
                    summary: {
                        isEligibleForPremium: results.premium.hasAllRequired,
                        isEligibleForAdoption: results.adoption.hasAllRequired,
                        totalUploaded: user.documents.length
                    }
                }
            });
            
        } catch (error) {
            logger.error(`Error en checkRequiredDocuments: ${error.message}`, error);
            res.status(500).json({
                status: 'error',
                message: 'Error interno del servidor'
            });
        }
    };

    
    getDocumentById = async (req, res) => {
        try {
            const userId = req.params.uid;
            const documentId = req.params.did;
            
            
            if (!userId.match(/^[0-9a-fA-F]{24}$/) || !documentId.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'ID de usuario o documento inválido'
                });
            }
            
            const user = await usersService.getUserById(userId);
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Usuario no encontrado'
                });
            }
            
            
            if (req.user?.id !== userId && req.user?.role !== 'admin') {
                return res.status(403).json({
                    status: 'error',
                    message: 'No autorizado para ver este documento'
                });
            }
            
            
            const document = user.documents.id(documentId);
            if (!document) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Documento no encontrado'
                });
            }
            
            res.json({
                status: 'success',
                data: {
                    document,
                    user: {
                        id: user._id,
                        name: `${user.first_name} ${user.last_name}`
                    }
                }
            });
            
        } catch (error) {
            logger.error(`Error en getDocumentById: ${error.message}`, error);
            res.status(500).json({
                status: 'error',
                message: 'Error interno del servidor'
            });
        }
    };
}

export default new DocumentsController();
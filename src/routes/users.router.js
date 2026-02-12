import { Router } from 'express';
import usersController from '../controllers/users.controller.js';
import documentsController from '../controllers/documents.controller.js';
import { uploaders } from '../utils/uploader.js';
import { authenticate, authorize } from './sessions.router.js';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener todos los usuarios (Solo admin)
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query, name: page, schema: { type: integer, default: 1 }, description: Número de página
 *       - in: query, name: limit, schema: { type: integer, default: 10 }, description: Límite de resultados por página
 *       - in: query, name: role, schema: { type: string, enum: [user, admin, premium] }, description: Filtrar por rol
 *     responses:
 *       200: { description: Lista de usuarios obtenida exitosamente }
 *       401: { description: No autenticado }
 *       403: { description: No autorizado (solo admin) }
 *       500: { description: Error interno del servidor }
 */
router.get('/', authorize('admin'), usersController.getAllUsers);

/**
 * @swagger
 * /api/users/{uid}:
 *   get:
 *     summary: Obtener un usuario por ID
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path, name: uid, required: true, schema: { type: string }, description: ID del usuario
 *     responses:
 *       200: { description: Usuario obtenido exitosamente }
 *       400: { description: ID inválido }
 *       401: { description: No autenticado }
 *       403: { description: No autorizado para ver este usuario }
 *       404: { description: Usuario no encontrado }
 *       500: { description: Error interno del servidor }
 */
router.get('/:uid', usersController.getUser);

/**
 * @swagger
 * /api/users/{uid}:
 *   put:
 *     summary: Actualizar un usuario
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path, name: uid, required: true, schema: { type: string }, description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               email: { type: string }
 *               role: { type: string, enum: [user, admin, premium] }
 *     responses:
 *       200: { description: Usuario actualizado exitosamente }
 *       400: { description: Datos inválidos }
 *       401: { description: No autenticado }
 *       403: { description: No autorizado para actualizar este usuario }
 *       404: { description: Usuario no encontrado }
 *       409: { description: Email ya en uso }
 *       500: { description: Error interno del servidor }
 */
router.put('/:uid', usersController.updateUser);

/**
 * @swagger
 * /api/users/{uid}:
 *   delete:
 *     summary: Eliminar un usuario
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path, name: uid, required: true, schema: { type: string }, description: ID del usuario
 *     responses:
 *       200: { description: Usuario eliminado exitosamente }
 *       400: { description: ID inválido }
 *       401: { description: No autenticado }
 *       403: { description: No autorizado para eliminar este usuario }
 *       404: { description: Usuario no encontrado }
 *       500: { description: Error interno del servidor }
 */
router.delete('/:uid', usersController.deleteUser);

/**
 * @swagger
 * /api/users/{uid}/documents:
 *   post:
 *     summary: Subir documentos para un usuario
 *     description: Sube uno o múltiples documentos para un usuario específico. Máximo 10 archivos, 5MB cada uno.
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path, name: uid, required: true, schema: { type: string }, description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               documents:
 *                 type: array
 *                 items: { type: string, format: binary }
 *                 description: Archivos a subir (imágenes, PDFs, documentos)
 *     responses:
 *       201: { description: Documentos subidos exitosamente }
 *       400: { description: Error en la solicitud }
 *       401: { description: No autenticado }
 *       403: { description: No autorizado para subir documentos }
 *       404: { description: Usuario no encontrado }
 *       413: { description: Archivo demasiado grande }
 *       500: { description: Error interno del servidor }
 */
router.post('/:uid/documents', uploaders.multipleDocuments, documentsController.uploadDocuments);

/**
 * @swagger
 * /api/users/{uid}/documents:
 *   get:
 *     summary: Obtener documentos de un usuario
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path, name: uid, required: true, schema: { type: string }, description: ID del usuario
 *     responses:
 *       200: { description: Documentos obtenidos exitosamente }
 *       400: { description: ID inválido }
 *       401: { description: No autenticado }
 *       403: { description: No autorizado para ver documentos }
 *       404: { description: Usuario no encontrado }
 *       500: { description: Error interno del servidor }
 */
router.get('/:uid/documents', usersController.getUserDocuments);

/**
 * @swagger
 * /api/users/{uid}/documents/{did}:
 *   get:
 *     summary: Obtener un documento específico
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path, name: uid, required: true, schema: { type: string }, description: ID del usuario
 *       - in: path, name: did, required: true, schema: { type: string }, description: ID del documento
 *     responses:
 *       200: { description: Documento obtenido exitosamente }
 *       400: { description: IDs inválidos }
 *       401: { description: No autenticado }
 *       403: { description: No autorizado }
 *       404: { description: Usuario o documento no encontrado }
 *       500: { description: Error interno del servidor }
 */
router.get('/:uid/documents/:did', documentsController.getDocumentById);

/**
 * @swagger
 * /api/users/{uid}/documents/{did}:
 *   delete:
 *     summary: Eliminar un documento específico
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path, name: uid, required: true, schema: { type: string }, description: ID del usuario
 *       - in: path, name: did, required: true, schema: { type: string }, description: ID del documento
 *     responses:
 *       200: { description: Documento eliminado exitosamente }
 *       400: { description: IDs inválidos }
 *       401: { description: No autenticado }
 *       403: { description: No autorizado }
 *       404: { description: Usuario o documento no encontrado }
 *       500: { description: Error interno del servidor }
 */
router.delete('/:uid/documents/:did', documentsController.deleteDocument);

/**
 * @swagger
 * /api/users/{uid}/documents/check:
 *   get:
 *     summary: Verificar documentos requeridos
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path, name: uid, required: true, schema: { type: string }, description: ID del usuario
 *     responses:
 *       200: { description: Estado de documentos verificado }
 *       400: { description: ID inválido }
 *       401: { description: No autenticado }
 *       403: { description: No autorizado }
 *       404: { description: Usuario no encontrado }
 *       500: { description: Error interno del servidor }
 */
router.get('/:uid/documents/check', documentsController.checkRequiredDocuments);

export default router;
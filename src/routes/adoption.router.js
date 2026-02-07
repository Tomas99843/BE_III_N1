import { Router } from 'express';
import adoptionsController from '../controllers/adoptions.controller.js';
import sessionsController from '../controllers/sessions.controller.js';

const { authenticate, authorize } = sessionsController;
const router = Router();

// Aplicar autenticación a todas las rutas de adopciones
router.use(authenticate);

/**
 * @swagger
 * /api/adoptions:
 *   get:
 *     summary: Obtener todas las adopciones
 *     tags: [Adoptions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Límite de resultados por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, completed]
 *         description: Filtrar por estado
 *       - in: query
 *         name: owner
 *         schema:
 *           type: string
 *         description: Filtrar por ID del dueño
 *     responses:
 *       200:
 *         description: Lista de adopciones obtenida exitosamente
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', adoptionsController.getAllAdoptions);

/**
 * @swagger
 * /api/adoptions/{aid}:
 *   get:
 *     summary: Obtener una adopción por ID
 *     tags: [Adoptions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: aid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la adopción
 *     responses:
 *       200:
 *         description: Adopción obtenida exitosamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado para ver esta adopción
 *       404:
 *         description: Adopción no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:aid', adoptionsController.getAdoption);

/**
 * @swagger
 * /api/adoptions/{aid}:
 *   put:
 *     summary: Actualizar una adopción (solo admin o dueño)
 *     tags: [Adoptions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: aid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la adopción
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected, completed]
 *               notes:
 *                 type: string
 *               adoptionFee:
 *                 type: number
 *     responses:
 *       200:
 *         description: Adopción actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado para actualizar esta adopción
 *       404:
 *         description: Adopción no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:aid', adoptionsController.updateAdoption);

/**
 * @swagger
 * /api/adoptions/{aid}:
 *   delete:
 *     summary: Eliminar una adopción (solo admin)
 *     tags: [Adoptions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: aid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la adopción
 *     responses:
 *       200:
 *         description: Adopción eliminada exitosamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo administradores pueden eliminar adopciones
 *       404:
 *         description: Adopción no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:aid', authorize('admin'), adoptionsController.deleteAdoption);

/**
 * @swagger
 * /api/adoptions/user/{uid}/pet/{pid}:
 *   post:
 *     summary: Crear una nueva adopción
 *     tags: [Adoptions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario adoptante
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la mascota
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *               adoptionFee:
 *                 type: number
 *     responses:
 *       201:
 *         description: Adopción creada exitosamente
 *       400:
 *         description: Datos inválidos o mascota ya adoptada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado para crear adopción
 *       404:
 *         description: Usuario o mascota no encontrada
 *       409:
 *         description: La mascota ya está adoptada
 *       500:
 *         description: Error interno del servidor
 */
router.post('/user/:uid/pet/:pid', adoptionsController.createAdoption);

/**
 * @swagger
 * /api/adoptions/user/{uid}:
 *   get:
 *     summary: Obtener adopciones de un usuario
 *     tags: [Adoptions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Adopciones del usuario obtenidas exitosamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado para ver estas adopciones
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/user/:uid', adoptionsController.getUserAdoptions);

export default router;
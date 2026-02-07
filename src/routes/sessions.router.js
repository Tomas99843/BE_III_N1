import { Router } from 'express';
import sessionsController from '../controllers/sessions.controller.js';

const router = Router();

router.post('/register', sessionsController.register);
router.post('/login', sessionsController.login);
router.get('/current', sessionsController.current);
router.post('/logout', sessionsController.logout);

// Exportar middlewares para usar en otras rutas
export const authenticate = sessionsController.authenticate;
export const authorize = sessionsController.authorize;

export default router;
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.config.js';
import logger from './utils/logger.js';
import loggerMiddleware from './middlewares/logger.middleware.js';

import usersRouter from './routes/users.router.js';
import petsRouter from './routes/pets.router.js';
import adoptionsRouter from './routes/adoption.router.js';
import sessionsRouter from './routes/sessions.router.js';
import mocksRouter from './routes/mocks.router.js';
import errorHandler from './utils/errorHandler.js';

const app = express();

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adoptme'; 

// Configuración de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        status: 'error',
        error: 'Demasiadas peticiones desde esta IP. Intenta de nuevo en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Aplicar rate limiting a todas las rutas de API
app.use('/api/', limiter);

logger.info('Conectando a MongoDB...');
logger.info(`URI de MongoDB: ${MONGO_URI}`);

mongoose.connect(MONGO_URI)
    .then(() => {
        logger.info('✅ Conectado a MongoDB exitosamente');
    })
    .catch(err => {
        logger.error(`❌ Error conectando a MongoDB: ${err.message}`);
        logger.warning('⚠️  El servidor continuará sin conexión a base de datos');
    });

app.use(express.json());
app.use(cookieParser(process.env.SESSION_SECRET));

// Swagger UI - Documentación de la API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AdoptMe API Documentation',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true
    }
}));

// Middleware de logging
app.use(loggerMiddleware);

// Rutas de la API
app.use('/api/users', usersRouter);
app.use('/api/pets', petsRouter);
app.use('/api/adoptions', adoptionsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/mocks', mocksRouter);

// Ruta de health check (para Docker y monitoreo)
app.get('/health', (req, res) => {
    const healthStatus = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV
    };
    
    const statusCode = mongoose.connection.readyState === 1 ? 200 : 503;
    res.status(statusCode).json(healthStatus);
});

// Ruta de prueba de logs (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
    app.get('/loggerTest', (req, res) => {
        const currentLogger = req.logger || logger;
        
        currentLogger.debug('Este es un mensaje DEBUG - solo en desarrollo');
        currentLogger.http('Este es un mensaje HTTP - solo en desarrollo');
        currentLogger.info('Este es un mensaje INFO - solo en desarrollo');
        currentLogger.warning('Este es un mensaje WARNING - solo en desarrollo');
        
        // No loggear errores/fatales en test para no llenar logs
        res.json({
            status: 'success',
            message: 'Logs de prueba generados (solo desarrollo). Revisa la consola.',
            environment: process.env.NODE_ENV
        });
    });
}

// Redirección a la documentación
app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

// Manejo de errores centralizado
app.use(errorHandler);

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        method: req.method
    });
});

app.listen(PORT, () => {
    logger.info(`🚀 Servidor escuchando en puerto ${PORT}`);
    logger.info(`📚 Documentación disponible en: http://localhost:${PORT}/api-docs`);
    logger.info(`🏥 Health check en: http://localhost:${PORT}/health`);
    if (process.env.NODE_ENV === 'development') {
        logger.info(`🔧 Logger test en: http://localhost:${PORT}/loggerTest`);
    }
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    logger.fatal(`🚨 Excepción no capturada: ${error.message}`, error);
    // En producción, podrías reiniciar el proceso aquí
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`⚠️ Promesa rechazada no manejada: ${reason}`);
    // Loggear el error pero no cerrar la aplicación
    if (process.env.NODE_ENV === 'production') {
        logger.error('Promesa rechazada en producción:', {
            reason: reason.toString(),
            promise: promise.toString()
        });
    }
});
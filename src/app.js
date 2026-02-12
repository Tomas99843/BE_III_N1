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
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.MONGO_URL || 'mongodb://localhost:27017/adoptme';

logger.info('🔍 Verificando conexión a MongoDB...');
logger.info(`🔍 Puerto: ${PORT}`);
logger.info(`🔍 Entorno: ${process.env.NODE_ENV}`);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { status: 'error', error: 'Demasiadas peticiones desde esta IP. Intenta de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

if (process.env.NODE_ENV !== 'test') {
    logger.info('Conectando a MongoDB...');
    
    mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        w: 'majority',
        maxPoolSize: 10,
        minPoolSize: 2
    })
    .then(() => {
        logger.info('✅ Conectado a MongoDB exitosamente');
        logger.info(`✅ Base de datos: ${mongoose.connection.db?.databaseName || 'N/A'}`);
    })
    .catch(err => {
        logger.error(`❌ Error conectando a MongoDB: ${err.message}`);
        logger.warning('⚠️  El servidor continuará sin conexión a base de datos');
        logger.error(`🔍 Detalles error: ${err.name} - ${err.code || 'Sin código'}`);
    });
} else {
    logger.info('🟡 Modo TEST - Saltando conexión a MongoDB');
}

app.use(express.json());
app.use(cookieParser(process.env.SESSION_SECRET));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AdoptMe API Documentation',
    swaggerOptions: { persistAuthorization: true, displayRequestDuration: true }
}));

app.use(loggerMiddleware);
app.use('/api/users', usersRouter);
app.use('/api/pets', petsRouter);
app.use('/api/adoptions', adoptionsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/mocks', mocksRouter);

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        databaseState: mongoose.connection.readyState,
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        mongoURLConfigured: !!MONGO_URI,
        railway: !!process.env.RAILWAY_ENVIRONMENT,
        message: mongoose.connection.readyState === 1 ? 'Full service operational' : 'Service operational (database disconnected)',
        details: { app: 'running', api: 'available', docs: 'available at /api-docs', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }
    });
});

if (process.env.NODE_ENV === 'development') {
    app.get('/loggerTest', (req, res) => {
        const currentLogger = req.logger || logger;
        currentLogger.debug('Mensaje DEBUG - solo en desarrollo');
        currentLogger.http('Mensaje HTTP - solo en desarrollo');
        currentLogger.info('Mensaje INFO - solo en desarrollo');
        currentLogger.warning('Mensaje WARNING - solo en desarrollo');
        res.json({ status: 'success', message: 'Logs de prueba generados', environment: process.env.NODE_ENV });
    });
}

app.get('/', (req, res) => res.redirect('/api-docs'));
app.use(errorHandler);
app.use('*', (req, res) => res.status(404).json({ status: 'error', error: 'Ruta no encontrada', path: req.originalUrl, method: req.method }));

app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Servidor escuchando en puerto ${PORT}`);
    logger.info(`📚 Documentación en: http://0.0.0.0:${PORT}/api-docs`);
    logger.info(`🏥 Health check en: http://0.0.0.0:${PORT}/health`);
    logger.info(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔧 Railway: ${process.env.RAILWAY_ENVIRONMENT ? 'SÍ' : 'NO'}`);
    if (process.env.NODE_ENV === 'development') 
        logger.info(`🔧 Logger test en: http://localhost:${PORT}/loggerTest`);
});

export default app;

process.on('uncaughtException', (error) => {
    logger.fatal(`🚨 Excepción no capturada: ${error.message}`, error);
    if (process.env.NODE_ENV === 'production') process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`⚠️ Promesa rechazada no manejada: ${reason}`);
    if (process.env.NODE_ENV === 'production') 
        logger.error('Promesa rechazada en producción:', { reason: reason.toString(), promise: promise.toString() });
});
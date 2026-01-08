
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
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
app.use(cookieParser());

app.use(loggerMiddleware);
app.use('/api/users', usersRouter);
app.use('/api/pets', petsRouter);
app.use('/api/adoptions', adoptionsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/mocks', mocksRouter);

app.get('/loggerTest', (req, res) => {
    const currentLogger = req.logger || logger;
    
    currentLogger.debug('Este es un mensaje DEBUG');
    currentLogger.http('Este es un mensaje HTTP');
    currentLogger.info('Este es un mensaje INFO');
    currentLogger.warning('Este es un mensaje WARNING');
    currentLogger.error('Este es un mensaje ERROR');
    currentLogger.fatal('Este es un mensaje FATAL');
    
    res.json({
        status: 'success',
        message: 'Logs de prueba generados. Revisa la consola y el archivo errors.log'
    });
});

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Servidor escuchando en puerto ${PORT}`);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    logger.fatal(`Excepción no capturada: ${error.message}`, error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Promesa rechazada no manejada: ${reason}`);
});
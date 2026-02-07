import logger from './logger.js';

const errorHandler = (error, req, res, next) => {
    // Loggear el error con contexto
    logger.error(`Error handler: ${error.message}`, {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user ? req.user.id : 'anonymous',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Manejar diferentes tipos de errores
    if (error.statusCode) {
        return res.status(error.statusCode).json({
            status: 'error',
            error: error.message,
            ...(!isProduction && { details: error.details, stack: error.stack })
        });
    }
    
    if (error.name === 'ValidationError') {
        logger.warning(`Error de validación: ${JSON.stringify(error.errors)}`);
        return res.status(400).json({
            status: 'error',
            error: 'Error de validación de datos',
            details: !isProduction ? Object.values(error.errors).map(e => e.message) : undefined
        });
    }
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        logger.warning(`Error de autenticación JWT: ${error.message}`);
        return res.status(401).json({
            status: 'error',
            error: 'Token de autenticación inválido o expirado'
        });
    }
    
    if (error.code === 11000) { // Duplicate key MongoDB
        logger.warning(`Error de duplicado en MongoDB: ${error.message}`);
        const field = Object.keys(error.keyPattern)[0];
        return res.status(409).json({
            status: 'error',
            error: `El valor para ${field} ya existe`
        });
    }
    
    if (error.name === 'CastError') {
        logger.warning(`Error de casteo en MongoDB: ${error.message}`);
        return res.status(400).json({
            status: 'error',
            error: 'ID o formato de datos inválido'
        });
    }
    
    // Error interno del servidor (genérico)
    logger.error(`Error interno no manejado: ${error.message}`, error);
    
    const response = {
        status: 'error',
        error: isProduction ? 'Error interno del servidor' : error.message
    };
    
    if (!isProduction) {
        response.stack = error.stack;
        response.type = error.name;
    }
    
    res.status(500).json(response);
};

export default errorHandler;
import logger from '../utils/logger.js';

const loggerMiddleware = (req, res, next) => {
    // Registrar la petición HTTP
    logger.http(`${req.method} ${req.url} - IP: ${req.ip}`);
    
    // Guardar logger en la request para usarlo en controladores
    req.logger = logger;
    
    // Registrar cuando termine la respuesta
    const originalSend = res.send;
    res.send = function(body) {
        const statusCode = res.statusCode;
        const level = statusCode >= 500 ? 'error' : 
                     statusCode >= 400 ? 'warning' : 'info';
        
        req.logger[level](`${req.method} ${req.url} - Status: ${statusCode}`);
        
        return originalSend.call(this, body);
    };
    
    next();
};

export default loggerMiddleware;
const errorHandler = (error, req, res, next) => {
    console.error('Error:', error);
    
    if (error.statusCode) {
        return res.status(error.statusCode).json({
            status: 'error',
            error: error.message
        });
    }
    
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            status: 'error',
            error: 'Error de validación'
        });
    }
    
    res.status(500).json({
        status: 'error',
        error: 'Error interno del servidor'
    });
};

export default errorHandler;
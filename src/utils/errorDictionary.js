export const errors = {
    USER_ALREADY_EXISTS: {
        message: 'El usuario ya existe',
        statusCode: 400
    },
    USER_NOT_FOUND: {
        message: 'Usuario no encontrado',
        statusCode: 404
    },
    INVALID_CREDENTIALS: {
        message: 'Credenciales inválidas',
        statusCode: 401
    },
    PET_NOT_FOUND: {
        message: 'Mascota no encontrada',
        statusCode: 404
    },
    INVALID_PET_DATA: {
        message: 'Datos de mascota inválidos',
        statusCode: 400
    },
    INTERNAL_SERVER_ERROR: {
        message: 'Error interno del servidor',
        statusCode: 500
    },
    UNAUTHORIZED: {
        message: 'No autorizado',
        statusCode: 401
    }
};
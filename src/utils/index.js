import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import logger from './logger.js';

// Función para crear hash de contraseña
export const createHash = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    } catch (error) {
        logger.error(`Error al encriptar contraseña: ${error.message}`);
        throw new Error('Error al encriptar contraseña');
    }
};

// Función para validar contraseña
export const passwordValidation = async (user, password) => {
    try {
        if (!user || !user.password) {
            logger.warning('Intento de validación sin usuario o contraseña');
            return false;
        }
        return await bcrypt.compare(password, user.password);
    } catch (error) {
        logger.error(`Error al validar contraseña: ${error.message}`);
        throw new Error('Error al validar contraseña');
    }
};

// Función para generar error de validación
export const generateValidationError = (message, field) => {
    return {
        message,
        field,
        type: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
    };
};

// Función para validar email
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Función para generar ID único (para testing/mocking)
export const generateMockId = () => {
    return Math.random().toString(36).substring(2) + 
           Date.now().toString(36);
};

// Función para limpiar datos sensibles del usuario
export const sanitizeUser = (user) => {
    if (!user) return null;
    
    const userObj = user.toObject ? user.toObject() : { ...user };
    
    // Remover datos sensibles según OWASP
    const sensitiveFields = [
        'password', '__v', 'resetPasswordToken', 
        'resetPasswordExpires', 'verificationToken'
    ];
    
    sensitiveFields.forEach(field => {
        if (userObj[field] !== undefined) {
            delete userObj[field];
        }
    });
    
    return userObj;
};

// Funciones para manejo de fechas
export const formatDate = (date) => {
    return new Date(date).toISOString();
};

export const isDateValid = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

// Variables de entorno con valores por defecto
export const getEnv = (key, defaultValue = '') => {
    return process.env[key] || defaultValue;
};

// Prevención de NoSQL injection (OWASP)
export const sanitizeMongoQuery = (query) => {
    if (!query || typeof query !== 'object') return query;
    
    const dangerousOperators = ['$where', '$eval', '$function', '$accumulator'];
    const queryCopy = { ...query };
    
    dangerousOperators.forEach(op => {
        if (queryCopy[op] !== undefined) {
            logger.warning(`Operador MongoDB peligroso detectado y eliminado: ${op}`);
            delete queryCopy[op];
        }
    });
    
    return queryCopy;
};

// Validación básica contra XSS (OWASP) - MODIFICADA PARA USO EN DOCUMENTOS
export const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        // Patrones comunes de XSS
        const dangerousPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /data:/gi,
            /vbscript:/gi,
            /expression\s*\(/gi, // CSS expressions
            /url\s*\(/gi, // URL injection
            /<\s*\/?\s*(iframe|embed|object|link|meta)/gi // Elementos peligrosos
        ];
        
        let sanitized = input;
        dangerousPatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });
        
        // Escapar caracteres HTML (pero mantener nombres de archivo válidos)
        // Solo escapar si no parece ser un nombre de archivo válido
        if (!sanitized.match(/^[\w\s\-\.\(\)\[\]@]+$/)) {
            sanitized = sanitized
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;');
        }
        
        // Limitar longitud para nombres de archivo
        if (sanitized.length > 100) {
            sanitized = sanitized.substring(0, 100);
            logger.info(`Nombre de entrada truncado a 100 caracteres`);
        }
        
        return sanitized.trim();
    }
    return input;
};

// Validar estructura de objeto
export const validateObjectStructure = (obj, requiredFields) => {
    if (!obj || typeof obj !== 'object') {
        return { valid: false, missing: 'El objeto no es válido' };
    }
    
    const missingFields = [];
    requiredFields.forEach(field => {
        if (obj[field] === undefined || obj[field] === null) {
            missingFields.push(field);
        }
    });
    
    return {
        valid: missingFields.length === 0,
        missing: missingFields
    };
};

// Generar token seguro - MODIFICADA para Node.js (sin window)
export const generateSecureToken = (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    
    // Usar crypto de Node.js
    const crypto = require('crypto');
    
    try {
        // Método más seguro con crypto de Node.js
        token = crypto.randomBytes(length)
            .toString('base64')
            .replace(/[+/=]/g, '') // Remover caracteres no URL-safe
            .substring(0, length);
    } catch (error) {
        // Fallback para entornos sin crypto
        logger.warning('Usando generador pseudoaleatorio para token');
        for (let i = 0; i < length; i++) {
            token += chars[Math.floor(Math.random() * chars.length)];
        }
    }
    
    return token;
};

// Nueva función: Sanitizar nombre de archivo específico para documentos
export const sanitizeFilename = (filename) => {
    if (!filename || typeof filename !== 'string') {
        return 'documento';
    }
    
    // Remover extensión temporalmente
    const extensionMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
    const extension = extensionMatch ? `.${extensionMatch[1].toLowerCase()}` : '';
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    
    // Sanitizar el nombre
    let sanitized = nameWithoutExt
        .replace(/[^a-zA-Z0-9\s\-_\.]/g, '_') // Reemplazar caracteres inválidos
        .replace(/\s+/g, '_') // Reemplazar espacios con _
        .replace(/_+/g, '_') // No múltiples _
        .substring(0, 50); // Limitar longitud
    
    // Si quedó vacío, usar nombre por defecto
    if (!sanitized || sanitized === '_') {
        sanitized = 'documento';
    }
    
    // Agregar timestamp para unicidad
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    return `${sanitized}_${timestamp}_${random}${extension}`;
};

// Exportar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default __dirname;
export { __filename, __dirname };
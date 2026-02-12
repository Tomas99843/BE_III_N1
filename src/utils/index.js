import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import logger from './logger.js';
import crypto from 'crypto';

export const createHash = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    } catch (error) {
        logger.error(`Error al encriptar contraseña: ${error.message}`);
        throw new Error('Error al encriptar contraseña');
    }
};

export const passwordValidation = async (user, password) => {
    try {
        if (!user?.password) {
            logger.warning('Intento de validación sin usuario o contraseña');
            return false;
        }
        return await bcrypt.compare(password, user.password);
    } catch (error) {
        logger.error(`Error al validar contraseña: ${error.message}`);
        throw new Error('Error al validar contraseña');
    }
};

export const generateValidationError = (message, field) => ({
    message, field, type: 'VALIDATION_ERROR', timestamp: new Date().toISOString()
});

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const generateMockId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export const sanitizeUser = (user) => {
    if (!user) return null;
    const userObj = user.toObject ? user.toObject() : { ...user };
    ['password', '__v', 'resetPasswordToken', 'resetPasswordExpires', 'verificationToken']
        .forEach(field => { if (userObj[field] !== undefined) delete userObj[field]; });
    return userObj;
};

export const formatDate = (date) => new Date(date).toISOString();
export const isDateValid = (dateString) => { const d = new Date(dateString); return d instanceof Date && !isNaN(d); };
export const getEnv = (key, defaultValue = '') => process.env[key] || defaultValue;

export const sanitizeMongoQuery = (query) => {
    if (!query || typeof query !== 'object') return query;
    const dangerousOps = ['$where', '$eval', '$function', '$accumulator'];
    const queryCopy = { ...query };
    dangerousOps.forEach(op => { if (queryCopy[op] !== undefined) { logger.warning(`Operador peligroso detectado: ${op}`); delete queryCopy[op]; } });
    return queryCopy;
};

export const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        const dangerous = [/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, /javascript:/gi, /on\w+\s*=/gi, /data:/gi, /vbscript:/gi, /expression\s*\(/gi, /url\s*\(/gi, /<\s*\/?\s*(iframe|embed|object|link|meta)/gi];
        let sanitized = input;
        dangerous.forEach(p => { sanitized = sanitized.replace(p, ''); });
        
        if (!sanitized.match(/^[\w\s\-\.\(\)\[\]@]+$/))
            sanitized = sanitized.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
        
        return sanitized.length > 100 ? (logger.info('Nombre truncado a 100 caracteres'), sanitized.substring(0, 100)) : sanitized.trim();
    }
    return input;
};

export const validateObjectStructure = (obj, requiredFields) => {
    if (!obj || typeof obj !== 'object') return { valid: false, missing: 'El objeto no es válido' };
    const missing = requiredFields.filter(f => obj[f] === undefined || obj[f] === null);
    return { valid: missing.length === 0, missing };
};

export const generateSecureToken = (length = 32) => {
    try {
        return crypto.randomBytes(length).toString('base64').replace(/[+/=]/g, '').substring(0, length);
    } catch (error) {
        logger.warning('Usando generador pseudoaleatorio para token');
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
};

export const sanitizeFilename = (filename) => {
    if (!filename || typeof filename !== 'string') return 'documento';
    const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '';
    const name = filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9\s\-_]/g, '_').replace(/\s+/g, '_').replace(/_+/g, '_').substring(0, 50);
    return `${name && name !== '_' ? name : 'documento'}_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default __dirname;
export { __filename, __dirname };
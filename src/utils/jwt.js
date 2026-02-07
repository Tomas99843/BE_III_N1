// src/utils/jwt.js - ARCHIVO COMPLETO (crear si no existe)
import jwt from 'jsonwebtoken';

// Generar token JWT
export const generateToken = (payload, expiresIn = '1h') => {
    try {
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'default-secret-key',
            { expiresIn }
        );
        return token;
    } catch (error) {
        console.error('Error en generateToken:', error);
        throw new Error('Error al generar token');
    }
};

// Verificar token JWT
export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'default-secret-key'
        );
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expirado');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Token inválido');
        } else {
            console.error('Error en verifyToken:', error);
            throw new Error('Error al verificar token');
        }
    }
};

// Extraer token de headers
export const extractToken = (req) => {
    try {
        // Buscar token en cookies
        if (req.cookies && req.cookies.coderCookie) {
            return req.cookies.coderCookie;
        }
        
        // Buscar token en headers de autorización
        if (req.headers.authorization) {
            const parts = req.headers.authorization.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
                return parts[1];
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error en extractToken:', error);
        return null;
    }
};

// Middleware de autenticación JWT
export const authenticateJWT = (req, res, next) => {
    try {
        const token = extractToken(req);
        
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Token de autenticación requerido'
            });
        }
        
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.message === 'Token expirado') {
            return res.status(401).json({
                status: 'error',
                message: 'Token expirado'
            });
        } else if (error.message === 'Token inválido') {
            return res.status(401).json({
                status: 'error',
                message: 'Token inválido'
            });
        }
        
        return res.status(500).json({
            status: 'error',
            message: 'Error de autenticación'
        });
    }
};

export default {
    generateToken,
    verifyToken,
    extractToken,
    authenticateJWT
};
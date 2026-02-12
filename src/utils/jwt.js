import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

export const generateToken = (payload, expiresIn = '1h') => {
    try {
        return jwt.sign(payload, JWT_SECRET, { expiresIn });
    } catch (error) {
        console.error('Error en generateToken:', error);
        throw new Error('Error al generar token');
    }
};

export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') throw new Error('Token expirado');
        if (error.name === 'JsonWebTokenError') throw new Error('Token inválido');
        console.error('Error en verifyToken:', error);
        throw new Error('Error al verificar token');
    }
};

export const extractToken = (req) => {
    try {
        if (req.cookies?.coderCookie) return req.cookies.coderCookie;
        if (req.headers.authorization) {
            const parts = req.headers.authorization.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
        }
        return null;
    } catch (error) {
        console.error('Error en extractToken:', error);
        return null;
    }
};

export const authenticateJWT = (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) return res.status(401).json({ status: 'error', message: 'Token de autenticación requerido' });
        
        req.user = verifyToken(token);
        next();
    } catch (error) {
        if (error.message === 'Token expirado') 
            return res.status(401).json({ status: 'error', message: 'Token expirado' });
        if (error.message === 'Token inválido') 
            return res.status(401).json({ status: 'error', message: 'Token inválido' });
        
        return res.status(500).json({ status: 'error', message: 'Error de autenticación' });
    }
};

export default { generateToken, verifyToken, extractToken, authenticateJWT };
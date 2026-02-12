import { usersService } from "../services/index.js";
import { createHash, passwordValidation } from "../utils/index.js";
import jwt from 'jsonwebtoken';
import UserDTO from '../dto/User.dto.js';

const register = async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;
        
        if (!first_name || !last_name || !email || !password)
            return res.status(400).json({ status: "error", error: "Valores incompletos", required: ["first_name", "last_name", "email", "password"] });
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return res.status(400).json({ status: "error", error: "Email inválido" });
        
        if (password.length < 8)
            return res.status(400).json({ status: "error", error: "La contraseña debe tener al menos 8 caracteres" });
        
        const exists = await usersService.getUserByEmail(email);
        if (exists) return res.status(409).json({ status: "error", error: "El usuario ya existe" });
        
        const hashedPassword = await createHash(password);
        const user = { first_name, last_name, email: email.toLowerCase(), password: hashedPassword };
        const result = await usersService.create(user);
        
        await usersService.updateUserLastConnection(result._id);
        
        const userDto = UserDTO.getUserTokenFrom(result);
        const token = jwt.sign(userDto, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
        
        const cookieOptions = {
            httpOnly: true,
            maxAge: 3600000,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        };
        
        req.logger?.info(`Usuario registrado: ${email}`);
        res.cookie('coderCookie', token, cookieOptions).json({ status: "success", message: "Usuario registrado exitosamente", user: userDto });
    } catch (error) {
        req.logger?.error(`Error en registro: ${error.message}`);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password)
            return res.status(400).json({ status: "error", error: "Email y contraseña son requeridos" });
        
        const user = await usersService.getUserByEmail(email);
        if (!user) {
            req.logger?.warning(`Intento de login con email no existente: ${email}`);
            return res.status(404).json({ status: "error", error: "Usuario no encontrado" });
        }
        
        if (user.isLocked) {
            req.logger?.warning(`Usuario bloqueado intentó login: ${email}`);
            return res.status(423).json({ status: "error", error: "Cuenta temporalmente bloqueada. Intenta más tarde." });
        }
        
        const isValidPassword = await passwordValidation(user, password);
        if (!isValidPassword) {
            await usersService.updateLoginAttempts(user._id, user.failedLoginAttempts + 1);
            req.logger?.warning(`Contraseña incorrecta para: ${email}`);
            return res.status(401).json({ status: "error", error: "Contraseña incorrecta", attemptsLeft: 5 - (user.failedLoginAttempts + 1) });
        }
        
        await usersService.updateLoginAttempts(user._id, 0);
        await usersService.updateUserLastConnection(user._id);
        
        const userDto = UserDTO.getUserTokenFrom(user);
        const token = jwt.sign(userDto, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
        
        const cookieOptions = {
            httpOnly: true,
            maxAge: 3600000,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        };
        
        req.logger?.info(`Login exitoso: ${email}`);
        res.cookie('coderCookie', token, cookieOptions).json({ status: "success", message: "Login exitoso", user: userDto });
    } catch (error) {
        req.logger?.error(`Error en login: ${error.message}`);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const current = async (req, res) => {
    try {
        const cookie = req.cookies['coderCookie'];
        if (!cookie) return res.status(401).json({ status: "error", error: "No autenticado" });
        
        const user = jwt.verify(cookie, process.env.JWT_SECRET);
        
        if (user.email) {
            const dbUser = await usersService.getUserByEmail(user.email);
            if (dbUser) await usersService.updateUserLastConnection(dbUser._id);
        }
        
        return res.json({ status: "success", user: UserDTO.getUserProfileFrom(user) });
    } catch (error) {
        if (error.name === 'JsonWebTokenError')
            return res.status(401).json({ status: "error", error: "Token inválido" });
        if (error.name === 'TokenExpiredError') {
            res.clearCookie('coderCookie');
            return res.status(401).json({ status: "error", error: "Sesión expirada" });
        }
        
        req.logger?.error(`Error en current: ${error.message}`);
        res.status(500).json({ status: "error", error: "Error interno del servidor" });
    }
};

const logout = async (req, res) => {
    try {
        const cookie = req.cookies['coderCookie'];
        
        if (cookie) {
            try {
                const user = jwt.verify(cookie, process.env.JWT_SECRET);
                if (user.email) {
                    const dbUser = await usersService.getUserByEmail(user.email);
                    if (dbUser) await usersService.updateUserLastConnection(dbUser._id);
                }
            } catch (jwtError) {
                req.logger?.info('Token inválido durante logout, limpiando cookie');
            }
        }
        
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        };
        
        req.logger?.info('Logout exitoso');
        res.clearCookie('coderCookie', cookieOptions).json({ status: "success", message: "Sesión cerrada exitosamente" });
    } catch (error) {
        req.logger?.error(`Error en logout: ${error.message}`);
        res.clearCookie('coderCookie').status(500).json({ status: "error", error: "Error durante el logout" });
    }
};

const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies['coderCookie'] || req.headers.authorization?.split(' ')[1];
        
        if (!token) return res.status(401).json({ status: "error", error: "Acceso no autorizado" });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        
        if (decoded.email) {
            const dbUser = await usersService.getUserByEmail(decoded.email);
            if (dbUser) await usersService.updateUserLastConnection(dbUser._id);
        }
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')
            return res.status(401).json({ status: "error", error: "Token inválido o expirado" });
        
        req.logger?.error(`Error en autenticación: ${error.message}`);
        res.status(500).json({ status: "error", error: "Error de autenticación" });
    }
};

const authorize = (...roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ status: "error", error: "No autenticado" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ status: "error", error: "No autorizado para esta acción" });
    next();
};

export default { register, login, current, logout, authenticate, authorize };
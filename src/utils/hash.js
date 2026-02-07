// src/utils/hash.js - ARCHIVO COMPLETO (crear si no existe)
import bcrypt from 'bcrypt';

// Crear hash de contraseña
export const createHash = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        console.error('Error en createHash:', error);
        throw new Error('Error al crear hash de contraseña');
    }
};

// Validar contraseña
export const isValidPassword = async (user, password) => {
    try {
        if (!user || !user.password || !password) {
            return false;
        }
        
        const isValid = await bcrypt.compare(password, user.password);
        return isValid;
    } catch (error) {
        console.error('Error en isValidPassword:', error);
        return false;
    }
};

// Verificar fuerza de contraseña
export const isStrongPassword = (password) => {
    // Al menos 8 caracteres, una mayúscula, una minúscula, un número
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
};

// Generar contraseña temporal
export const generateTempPassword = (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    
    return password;
};

export default {
    createHash,
    isValidPassword,
    isStrongPassword,
    generateTempPassword
};
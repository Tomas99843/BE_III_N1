import bcrypt from 'bcrypt';

export const createHash = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    } catch (error) {
        console.error('Error en createHash:', error);
        throw new Error('Error al crear hash de contraseña');
    }
};

export const isValidPassword = async (user, password) => {
    try {
        if (!user?.password || !password) return false;
        return await bcrypt.compare(password, user.password);
    } catch (error) {
        console.error('Error en isValidPassword:', error);
        return false;
    }
};

export const isStrongPassword = (password) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
};

export const generateTempPassword = (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) 
        password += charset[Math.floor(Math.random() * charset.length)];
    return password;
};

export default { createHash, isValidPassword, isStrongPassword, generateTempPassword };
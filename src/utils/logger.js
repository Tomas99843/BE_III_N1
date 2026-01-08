import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Definir niveles personalizados (de menor a mayor importancia)
const customLevels = {
    levels: {
        fatal: 0,
        error: 1,
        warning: 2,
        info: 3,
        http: 4,
        debug: 5
    },
    colors: {
        fatal: 'red',
        error: 'red',
        warning: 'yellow',
        info: 'green',
        http: 'magenta',
        debug: 'blue'
    }
};

winston.addColors(customLevels.colors);

// 2. Formato común para todos los transports
const commonFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message} ${stack || ''}`;
    })
);

// 3. Logger para desarrollo (nivel debug+)
const devLogger = winston.createLogger({
    levels: customLevels.levels,
    level: 'debug',
    format: winston.format.combine(
        winston.format.colorize({ all: true }),
        commonFormat
    ),
    transports: [
        new winston.transports.Console()
    ]
});

// 4. Logger para producción (nivel info+)
const prodLogger = winston.createLogger({
    levels: customLevels.levels,
    level: 'info',
    format: commonFormat,
    transports: [
        // Consola desde nivel info
        new winston.transports.Console({
            level: 'info'
        }),
        // Archivo para errores (error+)
        new winston.transports.File({
            level: 'error',
            filename: path.join(__dirname, '../logs/errors.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// 5. Determinar qué logger usar según entorno
const logger = process.env.NODE_ENV === 'production' ? prodLogger : devLogger;

export default logger;
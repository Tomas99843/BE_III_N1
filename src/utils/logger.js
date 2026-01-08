import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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


const commonFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message} ${stack || ''}`;
    })
);


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


const prodLogger = winston.createLogger({
    levels: customLevels.levels,
    level: 'info',
    format: commonFormat,
    transports: [
        
        new winston.transports.Console({
            level: 'info'
        }),
       
        new winston.transports.File({
            level: 'error',
            filename: path.join(__dirname, '../logs/errors.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});


const logger = process.env.NODE_ENV === 'production' ? prodLogger : devLogger;

export default logger;
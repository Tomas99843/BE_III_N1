import __dirname from "./index.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Asegurar que las carpetas existan
const ensureFolderExists = (folderPath) => {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
};

// Configurar storage dinámico basado en el tipo de archivo
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        let folder = 'img'; // Carpeta por defecto
        
        // Determinar carpeta basada en la ruta de la solicitud
        if (req.originalUrl.includes('/api/pets') && req.originalUrl.includes('withimage')) {
            folder = 'pets'; // Imágenes de mascotas
        } else if (req.originalUrl.includes('/api/users') && req.originalUrl.includes('documents')) {
            folder = 'documents'; // Documentos de usuarios
        } else if (req.originalUrl.includes('/api/mocks')) {
            folder = 'mocks'; // Archivos mock (si los hubiera)
        }
        
        const fullPath = path.join(__dirname, '../public', folder);
        
        // Asegurar que la carpeta exista
        ensureFolderExists(fullPath);
        
        cb(null, fullPath);
    },
    filename: function(req, file, cb) {
        // Generar nombre único con timestamp y nombre original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const originalName = path.parse(file.originalname).name;
        const extension = path.extname(file.originalname);
        
        // Limpiar nombre del archivo (remover caracteres especiales)
        const cleanName = originalName.replace(/[^a-zA-Z0-9]/g, '_');
        
        cb(null, `${cleanName}-${uniqueSuffix}${extension}`);
    }
});

// Validar tipos de archivo
const fileFilter = (req, file, cb) => {
    const allowedTypes = {
        '/api/pets': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        '/api/users/documents': [
            'image/jpeg', 'image/png', 'image/gif',
            'application/pdf', 
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ]
    };
    
    // Determinar qué tipos permitir basado en la ruta
    let allowedMimeTypes = ['image/jpeg', 'image/png']; // Por defecto
    
    if (req.originalUrl.includes('/api/pets')) {
        allowedMimeTypes = allowedTypes['/api/pets'];
    } else if (req.originalUrl.includes('/api/users') && req.originalUrl.includes('documents')) {
        allowedMimeTypes = allowedTypes['/api/users/documents'];
    }
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no permitido. Tipos permitidos: ${allowedMimeTypes.join(', ')}`), false);
    }
};

// Configurar límites
const limits = {
    fileSize: 5 * 1024 * 1024, // 5MB límite
    files: 10 // Máximo 10 archivos por solicitud
};

const uploader = multer({ 
    storage, 
    fileFilter,
    limits,
    // Manejo de errores personalizado
    onError: function(err, next) {
        console.error('Error en Multer:', err);
        next(err);
    }
});

// Middleware helper para diferentes tipos de uploads
export const uploaders = {
    singlePetImage: uploader.single('image'),
    singleDocument: uploader.single('document'),
    multipleDocuments: uploader.array('documents', 10), // Máximo 10 documentos
    anyFile: uploader.any()
};

export default uploader;
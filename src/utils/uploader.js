import __dirname from "./index.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const ensureFolderExists = (folderPath) => {
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'img';
        if (req.originalUrl.includes('/api/pets') && req.originalUrl.includes('withimage')) folder = 'pets';
        else if (req.originalUrl.includes('/api/users') && req.originalUrl.includes('documents')) folder = 'documents';
        else if (req.originalUrl.includes('/api/mocks')) folder = 'mocks';
        
        const fullPath = path.join(__dirname, '../public', folder);
        ensureFolderExists(fullPath);
        cb(null, fullPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const originalName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9]/g, '_');
        const extension = path.extname(file.originalname);
        cb(null, `${originalName}-${uniqueSuffix}${extension}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = {
        '/api/pets': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        '/api/users/documents': ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    };
    
    let allowedMimeTypes = ['image/jpeg', 'image/png'];
    if (req.originalUrl.includes('/api/pets')) allowedMimeTypes = allowedTypes['/api/pets'];
    else if (req.originalUrl.includes('/api/users') && req.originalUrl.includes('documents')) 
        allowedMimeTypes = allowedTypes['/api/users/documents'];
    
    allowedMimeTypes.includes(file.mimetype) 
        ? cb(null, true) 
        : cb(new Error(`Tipo de archivo no permitido. Tipos permitidos: ${allowedMimeTypes.join(', ')}`), false);
};

const limits = { fileSize: 5 * 1024 * 1024, files: 10 };

const uploader = multer({ storage, fileFilter, limits, onError: (err, next) => { console.error('Error en Multer:', err); next(err); } });

export const uploaders = {
    singlePetImage: uploader.single('image'),
    singleDocument: uploader.single('document'),
    multipleDocuments: uploader.array('documents', 10),
    anyFile: uploader.any()
};

export default uploader;
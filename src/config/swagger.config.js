import swaggerJSDoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'AdoptMe API - Backend III Proyecto Final',
        version: '1.0.0',
        description: 'API REST para sistema de adopción de mascotas. Proyecto final de Backend III - Coderhouse.\n\n**Notas importantes:**\n- Autenticación mediante cookies HTTP-only\n- Todos los endpoints requieren autenticación excepto /health y /api-docs\n- Documentación generada automáticamente desde JSDoc en archivos de rutas',
        contact: { name: 'Soporte Técnico', email: 'soporte@adoptme-api.com' },
        license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
        termsOfService: 'https://adoptme-api.com/terms'
    },
    servers: [
        { url: 'http://localhost:8080', description: 'Servidor de desarrollo local' },
        { url: 'https://adoptme-api.example.com', description: 'Servidor de producción (ejemplo)' }
    ],
    components: {
        securitySchemes: {
            cookieAuth: { type: 'apiKey', in: 'cookie', name: 'coderCookie', description: 'Autenticación mediante cookie HTTP-only JWT. Se establece automáticamente al iniciar sesión.' }
        },
        schemas: {
            User: {
                type: 'object',
                required: ['first_name', 'last_name', 'email'],
                properties: {
                    _id: { type: 'string', description: 'ID único del usuario (ObjectId)', example: '507f1f77bcf86cd799439011' },
                    first_name: { type: 'string', description: 'Nombre del usuario', example: 'Juan', minLength: 2, maxLength: 50 },
                    last_name: { type: 'string', description: 'Apellido del usuario', example: 'Pérez', minLength: 2, maxLength: 50 },
                    email: { type: 'string', format: 'email', description: 'Email único del usuario', example: 'juan.perez@example.com' },
                    role: { type: 'string', enum: ['user', 'admin', 'premium'], default: 'user', description: 'Rol del usuario en el sistema' },
                    age: { type: 'integer', minimum: 18, maximum: 100, description: 'Edad del usuario', example: 30 },
                    pets: { type: 'array', items: { type: 'string', description: 'ID de mascota adoptada' }, description: 'IDs de mascotas adoptadas por el usuario' },
                    documents: { type: 'array', items: { $ref: '#/components/schemas/Document' }, description: 'Documentos subidos por el usuario' },
                    last_connection: { type: 'string', format: 'date-time', description: 'Última conexión del usuario al sistema', example: '2024-01-15T10:30:00.000Z' },
                    createdAt: { type: 'string', format: 'date-time', description: 'Fecha de creación del usuario' },
                    updatedAt: { type: 'string', format: 'date-time', description: 'Fecha de última actualización' }
                },
                example: {
                    _id: '507f1f77bcf86cd799439011',
                    first_name: 'Juan',
                    last_name: 'Pérez',
                    email: 'juan.perez@example.com',
                    role: 'user',
                    age: 30,
                    pets: [],
                    last_connection: '2024-01-15T10:30:00.000Z'
                }
            },
            Document: {
                type: 'object',
                required: ['name', 'reference'],
                properties: {
                    _id: { type: 'string', description: 'ID único del documento' },
                    name: { type: 'string', description: 'Nombre original del archivo', example: 'DNI_frontal.jpg' },
                    reference: { type: 'string', description: 'Ruta o URL del documento almacenado', example: '/documents/DNI_frontal-1234567890.jpg' },
                    type: { type: 'string', enum: ['identification', 'address', 'account', 'other'], description: 'Tipo de documento' },
                    uploadedAt: { type: 'string', format: 'date-time', description: 'Fecha y hora de subida' }
                }
            },
            Pet: {
                type: 'object',
                required: ['name', 'specie', 'age'],
                properties: {
                    _id: { type: 'string', description: 'ID único de la mascota' },
                    name: { type: 'string', description: 'Nombre de la mascota' },
                    specie: { type: 'string', enum: ['perro', 'gato', 'conejo', 'ave', 'otro'], description: 'Especie de la mascota' },
                    breed: { type: 'string', description: 'Raza de la mascota' },
                    age: { type: 'integer', description: 'Edad en años' },
                    adopted: { type: 'boolean', description: 'Si la mascota está adoptada' },
                    status: { type: 'string', enum: ['available', 'adopted', 'reserved', 'medical_care'], description: 'Estado actual de la mascota' }
                }
            },
            Adoption: {
                type: 'object',
                required: ['owner', 'pet', 'status'],
                properties: {
                    _id: { type: 'string', description: 'ID único de la adopción' },
                    owner: { $ref: '#/components/schemas/User' },
                    pet: { $ref: '#/components/schemas/Pet' },
                    status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'], description: 'Estado del proceso de adopción' },
                    notes: { type: 'string', description: 'Notas adicionales sobre la adopción' },
                    adoptionFee: { type: 'number', description: 'Costo de adopción (si aplica)' },
                    createdAt: { type: 'string', format: 'date-time', description: 'Fecha de creación de la solicitud' }
                }
            },
            Error: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'error', description: 'Estado de la respuesta (siempre "error" en errores)' },
                    error: { type: 'string', example: 'Mensaje de error descriptivo', description: 'Descripción del error ocurrido' },
                    code: { type: 'string', example: 'VALIDATION_ERROR', description: 'Código de error interno (opcional)' }
                }
            },
            Success: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'success', description: 'Estado de la respuesta (siempre "success" en éxito)' },
                    message: { type: 'string', example: 'Operación exitosa', description: 'Mensaje descriptivo del resultado' },
                    data: { type: 'object', description: 'Datos de la respuesta (estructura variable)' }
                }
            }
        },
        responses: {
            UnauthorizedError: {
                description: 'No autenticado - Token/cookie inválido o expirado',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: { status: 'error', error: 'No autenticado. Inicia sesión para acceder.' }
                    }
                }
            },
            ForbiddenError: {
                description: 'No autorizado - Permisos insuficientes',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: { status: 'error', error: 'No autorizado para realizar esta acción.' }
                    }
                }
            },
            NotFoundError: {
                description: 'Recurso no encontrado',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: { status: 'error', error: 'Recurso no encontrado.' }
                    }
                }
            },
            ValidationError: {
                description: 'Error de validación en los datos enviados',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: { status: 'error', error: 'Datos inválidos. Revisa los campos enviados.', code: 'VALIDATION_ERROR' }
                    }
                }
            }
        },
        parameters: {
            pageParam: { name: 'page', in: 'query', description: 'Número de página para paginación', required: false, schema: { type: 'integer', minimum: 1, default: 1 } },
            limitParam: { name: 'limit', in: 'query', description: 'Cantidad de resultados por página', required: false, schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
            userIdParam: { name: 'uid', in: 'path', description: 'ID único del usuario (ObjectId)', required: true, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } }
        }
    },
    tags: [
        { name: 'Users', description: 'Operaciones relacionadas con usuarios - **Módulo documentado para entrega**', externalDocs: { description: 'Ver documentación completa del modelo User', url: '#/components/schemas/User' } },
        { name: 'Sessions', description: 'Autenticación y gestión de sesiones' },
        { name: 'Pets', description: 'Gestión de mascotas disponibles para adopción' },
        { name: 'Adoptions', description: 'Proceso de adopción de mascotas - **Tests funcionales completos**' },
        { name: 'Mocks', description: 'Generación de datos de prueba para desarrollo' }
    ],
    externalDocs: { description: 'Documentación del proyecto en GitHub', url: 'https://github.com/tu-organizacion/adoptme-api' }
};

const options = { swaggerDefinition, apis: [path.join(__dirname, '../routes/*.js')] };
const swaggerSpec = swaggerJSDoc(options);

if (!swaggerSpec.paths || Object.keys(swaggerSpec.paths).length === 0)
    console.warn('⚠️  Advertencia: Swagger no encontró endpoints documentados.\n   Asegúrate de que los archivos en src/routes/*.js tengan JSDoc válido.');

export default swaggerSpec;
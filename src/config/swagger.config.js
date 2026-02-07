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
        description: 'API para sistema de adopción de mascotas. Proyecto final de Backend III - Coderhouse',
        contact: {
            name: 'Desarrollador',
            email: 'tomas@ejemplo.com'
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
        }
    },
    servers: [
        {
            url: 'http://localhost:8080',
            description: 'Servidor de desarrollo'
        },
        {
            url: 'https://tu-api-en-produccion.com',
            description: 'Servidor de producción'
        }
    ],
    components: {
        securitySchemes: {
            cookieAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'coderCookie',
                description: 'Autenticación mediante cookie JWT'
            }
        },
        schemas: {
            User: {
                type: 'object',
                required: ['first_name', 'last_name', 'email', 'password'],
                properties: {
                    _id: {
                        type: 'string',
                        description: 'ID único del usuario',
                        example: '507f1f77bcf86cd799439011'
                    },
                    first_name: {
                        type: 'string',
                        description: 'Nombre del usuario',
                        example: 'Juan'
                    },
                    last_name: {
                        type: 'string',
                        description: 'Apellido del usuario',
                        example: 'Pérez'
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Email del usuario',
                        example: 'juan.perez@example.com'
                    },
                    role: {
                        type: 'string',
                        enum: ['user', 'admin', 'premium'],
                        default: 'user',
                        description: 'Rol del usuario'
                    },
                    pets: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                _id: {
                                    type: 'string',
                                    description: 'ID de la mascota'
                                }
                            }
                        },
                        description: 'Mascotas adoptadas por el usuario'
                    },
                    documents: {
                        type: 'array',
                        items: {
                            $ref: '#/components/schemas/Document'
                        },
                        description: 'Documentos subidos por el usuario'
                    },
                    last_connection: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Última conexión del usuario'
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Fecha de creación'
                    },
                    updatedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Fecha de última actualización'
                    }
                }
            },
            Document: {
                type: 'object',
                required: ['name', 'reference'],
                properties: {
                    _id: {
                        type: 'string',
                        description: 'ID único del documento'
                    },
                    name: {
                        type: 'string',
                        description: 'Nombre del documento',
                        example: 'DNI_frontal.jpg'
                    },
                    reference: {
                        type: 'string',
                        description: 'Ruta o URL del documento',
                        example: '/documents/DNI_frontal-1234567890.jpg'
                    },
                    uploadedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Fecha de subida'
                    }
                }
            },
            Error: {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        example: 'error'
                    },
                    error: {
                        type: 'string',
                        example: 'Mensaje de error descriptivo'
                    }
                }
            },
            Success: {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        example: 'success'
                    },
                    message: {
                        type: 'string',
                        example: 'Operación exitosa'
                    }
                }
            }
        }
    },
    tags: [
        {
            name: 'Users',
            description: 'Operaciones relacionadas con usuarios'
        },
        {
            name: 'Sessions',
            description: 'Autenticación y gestión de sesiones'
        },
        {
            name: 'Pets',
            description: 'Gestión de mascotas'
        },
        {
            name: 'Adoptions',
            description: 'Proceso de adopción'
        },
        {
            name: 'Mocks',
            description: 'Generación de datos de prueba'
        }
    ]
};

const options = {
    swaggerDefinition,
    apis: [
        path.join(__dirname, '../routes/*.js'),
        path.join(__dirname, '../controllers/*.js')
    ]
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
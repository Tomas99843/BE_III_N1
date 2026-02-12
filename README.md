# AdoptMe API - Backend III Proyecto Final

API REST para sistema de adopción de mascotas. Proyecto final de Backend III - Coderhouse.

## Caracteristicas Principales

- **Autenticacion segura** con JWT y cookies HTTP-only
- **Gestion completa** de mascotas, usuarios y adopciones
- **Sistema de roles** (user, admin, premium) con permisos granularizados
- **Subida de documentos** (identificacion, domicilio, etc.)
- **Testing completo** con 41+ tests (unitarios y funcionales)
- **Documentacion Swagger** interactiva y actualizada
- **Contenedor Docker** optimizado para produccion
- **Despliegue flexible** (local, Docker, cloud)

## Demo en Vivo

- **API:** `https://beiiin1-production.up.railway.app`
- **Documentacion:** `https://beiiin1-production.up.railway.app/api-docs`
- **Health Check:** `https://beiiin1-production.up.railway.app/health`

## Estado del Proyecto

![Tests](https://img.shields.io/badge/tests-41_passing_-brightgreen)
![Docker](https://img.shields.io/badge/docker-ready-blue)
![Node](https://img.shields.io/badge/node-18.x-green)
![Railway](https://img.shields.io/badge/deployed-railway.app-blue)

## Docker (Requisito de Entrega)

### Imagen Oficial en DockerHub

```bash
# Descargar la ultima version
docker pull tomasc98/adoptme-api:latest

# Ejecutar contenedor con variables de entorno
docker run -d \
  --name adoptme-api \
  -p 8080:8080 \
  -e MONGODB_URI=tu_cadena_conexion_mongodb \
  -e NODE_ENV=production \
  tomasc98/adoptme-api:latest
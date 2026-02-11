# ============================================
# DOCKERFILE PARA ADOPTME API - BACKEND III
# ============================================

# Usar imagen oficial de Node.js LTS
FROM node:18-alpine

# Configurar directorio de trabajo
WORKDIR /usr/src/app

# 1. Copiar archivos de configuración de dependencias
COPY package*.json ./
COPY package-lock.json ./

# 2. Instalar dependencias de PRODUCCIÓN solamente
RUN npm ci --only=production --omit=dev

# 3. Copiar TODO el código fuente y archivos necesarios
COPY . .

# 4. Crear usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# 5. Crear directorios necesarios y asignar permisos
RUN mkdir -p \
    src/logs \
    src/public/img \
    src/public/pets \
    src/public/documents \
    uploads

# 6. Asignar permisos correctos al usuario no-root
RUN chown -R nodejs:nodejs /usr/src/app

# 7. Cambiar a usuario no-root (seguridad)
USER nodejs

# 8. Exponer puerto de la aplicación
EXPOSE 8080

# 9. Variables de entorno por defecto
ENV NODE_ENV=production \
    PORT=8080 \
    NODE_OPTIONS="--max-old-space-size=512"

# 10. Health check (para Docker, Railway y monitoreo)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if(r.statusCode === 200) process.exit(0); else process.exit(1)})"

# 11. Comando de inicio
CMD ["node", "src/app.js"]
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Instalar dependencias de desarrollo solo para build si es necesario
RUN npm ci

COPY src ./src

FROM node:18-alpine

WORKDIR /usr/src/app

# Crear usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

COPY --from=builder --chown=nodejs:nodejs /usr/src/app/src ./src

# Crear directorios necesarios con permisos correctos
RUN mkdir -p src/public/img src/public/pets src/public/documents src/logs && \
    chown -R nodejs:nodejs /usr/src/app

# Cambiar a usuario no-root
USER nodejs

EXPOSE 8080

ENV NODE_ENV=production \
    PORT=8080 \
    NODE_OPTIONS="--max-old-space-size=512"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if(r.statusCode === 200) process.exit(0); else process.exit(1)})"

CMD ["node", "src/app.js"]
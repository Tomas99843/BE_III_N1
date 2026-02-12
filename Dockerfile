# ============================================
# DOCKERFILE PARA ADOPTME API - BACKEND III
# ============================================

FROM node:18-alpine
WORKDIR /usr/src/app

COPY package*.json package-lock.json ./
RUN npm ci --only=production --omit=dev

COPY . .

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
RUN mkdir -p src/logs src/public/img src/public/pets src/public/documents uploads
RUN chown -R nodejs:nodejs /usr/src/app

USER nodejs
EXPOSE 8080

ENV NODE_ENV=production PORT=8080 NODE_OPTIONS="--max-old-space-size=512"

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', r => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "src/app.js"]
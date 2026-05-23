# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Dépendances d'abord (cache layer)
COPY package*.json ./
RUN npm ci --only=production

# Code source
COPY . .

# Utilisateur non-root pour la sécurité
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]

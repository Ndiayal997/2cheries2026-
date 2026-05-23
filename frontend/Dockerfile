# frontend/Dockerfile
# ── Stage 1 : Build ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Variables d'env injectées au build
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# ── Stage 2 : Serveur Nginx ───────────────────────────────
FROM nginx:1.25-alpine

# Config Nginx pour React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier le build
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

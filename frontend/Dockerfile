# syntax=docker/dockerfile:1
# ==============================================================================
# GENESIS Civilisation Engine — Frontend Multi-Stage Dockerfile
# Build Stage: Node 22 LTS Alpine
# Runtime Stage: Nginx 1.27 Alpine (Non-Root Unprivileged User)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build React 19 + TypeScript + Vite static assets
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install clean reproducible dependencies
RUN npm ci

# Copy full frontend source code
COPY . .

# Build production bundle to /app/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Minimal hardened Nginx runtime
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# Upgrade OS packages to apply security patches
RUN apk update && apk upgrade --no-cache

# Create non-root system group & user if not matching default
RUN addgroup -g 10001 -S genesis && \
    adduser -u 10001 -D -S -G genesis genesis

# Copy built static assets from builder stage
COPY --from=builder --chown=genesis:genesis /app/dist /usr/share/nginx/html

# Copy optimized nginx reverse proxy & SPA configuration
COPY --chown=genesis:genesis frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Configure directory permissions for non-root execution
RUN touch /var/run/nginx.pid && \
    chown -R genesis:genesis /var/cache/nginx \
                            /var/log/nginx \
                            /var/run/nginx.pid \
                            /etc/nginx/conf.d

USER genesis

EXPOSE 8080

# Health check against backend health endpoint via reverse proxy
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/health || exit 1

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]

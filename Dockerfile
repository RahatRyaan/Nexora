# Multi-stage Dockerfile for Nexora Agentic ERP Platform
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package manifests
COPY package*.json ./
COPY packages/core/package*.json ./packages/core/
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Install dependencies across all workspaces
RUN npm install

# Copy source trees and tsconfigs
COPY tsconfig.base.json ./
COPY packages/core ./packages/core
COPY apps/api ./apps/api
COPY apps/web ./apps/web

# Build all packages
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy root and package manifests
COPY package*.json ./
COPY packages/core/package*.json ./packages/core/
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Install production dependencies only
RUN npm install --omit=dev

# Copy built dist files
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/web/dist ./apps/web/dist

EXPOSE 5000

CMD ["node", "apps/api/dist/server.js"]

FROM node:22-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

# Development stage — source code comes from bind mount at runtime
FROM base AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ ./
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]

# Multi-stage build
FROM node:20-alpine AS base

# Install dependencies only when needed
RUN apk add --no-cache libc6-compat dumb-init
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./

# --------------------------------------
# Dependencies Stage
# --------------------------------------
FROM base AS deps
RUN npm ci

# --------------------------------------
# Development Stage
# --------------------------------------
FROM base AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create non-root user for security (optional but good practice in dev too)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000
CMD ["npm", "run", "start"]

# --------------------------------------
# Production Dependencies Stage
# --------------------------------------
FROM base AS production-deps
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
RUN npm prune --production

# --------------------------------------
# Production Stage
# --------------------------------------
FROM base AS production
WORKDIR /app

ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=production-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

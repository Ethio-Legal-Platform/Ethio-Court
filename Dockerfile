# ==============================================================================
# Federal Supreme Court System - Production Dockerfile
# ==============================================================================

# Step 1: Base Image
FROM node:20-alpine AS base

WORKDIR /app

# Install security updates & tools required for healthcheck
RUN apk --no-cache add curl wget

# Step 2: Dependencies
FROM base AS dependencies

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Step 3: Production Release
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=5001

# Create non-root app user & group for security
RUN addgroup -S fscgroup && adduser -S fscuser -G fscgroup

# Set working directory
WORKDIR /app

# Copy production node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code and static assets
COPY package.json ./
COPY server.js ./
COPY db.js ./
COPY backend ./backend
COPY frontend ./frontend
COPY scripts ./scripts

# Create persistent storage directories with proper permissions
RUN mkdir -p /app/uploads /app/backend/data && \
    chown -R fscuser:fscgroup /app

# Switch to non-root user
USER fscuser

# Expose Court Core Server Port
EXPOSE 5001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/ || exit 1

# Start the Supreme Court System
CMD ["node", "server.js"]

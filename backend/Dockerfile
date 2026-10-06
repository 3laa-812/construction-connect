# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy manifests first (layer cache)
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install ALL deps (including devDependencies needed for nest build)
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm exec prisma generate

# Copy source and build
COPY . .
RUN pnpm run build

# ── Stage 2: Run ────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm@10

# Copy manifests
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Generate Prisma client in production layer
RUN pnpm exec prisma generate

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]

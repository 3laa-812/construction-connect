FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy manifests + prisma schema first (better layer caching)
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install all deps — postinstall automatically runs "prisma generate"
RUN pnpm install --frozen-lockfile

# Copy source and compile
COPY . .
RUN pnpm run build

EXPOSE 3000

CMD ["node", "dist/main"]


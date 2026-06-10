FROM node:20-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy monorepo workspace configurations
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies (including devDependencies for compilation)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/typescript-config ./packages/typescript-config
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Generate Prisma Client
ENV DATABASE_URL="postgresql://mock:mock@localhost:5432/mock"
RUN pnpm --filter @teamhub/api prisma:generate

# Build the TypeScript api gateway
RUN pnpm --filter @teamhub/shared build && pnpm --filter @teamhub/api build

# Production runtime stage
FROM node:20-alpine AS runner
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages/typescript-config ./packages/typescript-config

COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# syntax=docker/dockerfile:1

# Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml .
COPY packages ./packages
COPY app ./app
COPY prisma ./prisma
COPY tsconfig.json next.config.mjs tailwind.config.ts postcss.config.mjs ./
RUN corepack enable && pnpm install --frozen-lockfile || true
RUN pnpm build

# Runner
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app .
ENV NODE_ENV=production
CMD ["pnpm", "start"]

# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services ./services
RUN corepack enable && pnpm install --filter @helios/realtime-gateway... --prod=false || true
RUN pnpm --filter @helios/realtime-gateway build
RUN pnpm --filter @helios/realtime-gateway deploy --prod /out

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /out .
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]

FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY packages/database/package*.json ./packages/database/
COPY apps/api/package*.json ./apps/api/

FROM base AS deps
RUN npm ci

FROM deps AS builder
COPY packages/database ./packages/database
COPY apps/api ./apps/api
RUN npm run db:generate -w packages/database
RUN npm run build -w apps/api

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

EXPOSE 3001
CMD ["node", "apps/api/dist/server.js"]

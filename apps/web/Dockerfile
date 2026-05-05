FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY packages/database/package*.json ./packages/database/
COPY apps/web/package*.json ./apps/web/

FROM base AS deps
RUN npm ci

FROM deps AS builder
COPY packages/database ./packages/database
COPY apps/web ./apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w apps/web

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/

EXPOSE 3000
CMD ["npm", "run", "start", "-w", "apps/web"]

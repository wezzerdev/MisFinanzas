# Stage 1: Base setup con Node 20 y pnpm vía corepack
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Stage 2: Instalación de dependencias con pnpm (Se agrega --unsafe-perm=true para permitir scripts de Prisma)
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --unsafe-perm=true

# Stage 3: Compilación de Next.js en modo Standalone con Prisma + Supabase
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV STANDALONE=true

# URL dummy solo para que `prisma generate` y `next build` compilen sin requerir conexión activa durante el build
ARG DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
ARG DIRECT_URL="postgresql://postgres:postgres@localhost:5432/postgres"
ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_URL=$DIRECT_URL

# Limpiar cualquier rastro de bases SQLite antiguas
RUN rm -f prisma/*.db prisma/*.db-journal
RUN npx prisma generate
RUN pnpm build

# Stage 4: Imagen final de producción optimizada para Dokploy + Supabase
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copia de artefactos standalone generados y cliente Prisma compilado
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

CMD ["node", "server.js"]
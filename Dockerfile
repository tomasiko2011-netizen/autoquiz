# Используем официальный Node.js образ на основе Alpine (легковесный)
FROM node:20-alpine AS base

# Устанавливаем зависимости только если нужно
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package.json package-lock.json ./
# Устанавливаем ВСЕ зависимости (включая dev) для сборки
RUN npm ci

# Сборка приложения
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Финальный образ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Создаем пользователя nextjs для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем необходимые файлы
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/ws-server.js ./ws-server.js

# Устанавливаем только ws для websocket-сервера
RUN npm install ws --no-save

USER nextjs

# Экспонируем порт 63006
EXPOSE 63006

ENV PORT=63006
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node server.js & node ws-server.js"]

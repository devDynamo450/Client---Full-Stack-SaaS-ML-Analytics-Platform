FROM node:20-alpine AS base
WORKDIR /app

# ── Backend ──────────────────────────────────────────────────────────────────
FROM base AS server-deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS server-build
COPY package*.json ./
RUN npm ci
COPY ./ ./
RUN npm run build

FROM base AS server
COPY --from=server-deps /app/node_modules ./node_modules
COPY --from=server-build /app/dist ./dist
COPY .env .env
EXPOSE 5000
CMD ["node", "dist/index.js"]

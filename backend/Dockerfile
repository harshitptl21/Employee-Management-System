FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl

# Copy only the dependency manifests first, so this expensive layer is only
# invalidated when package.json/package-lock.json actually change — not on
# every edit to prisma/schema.prisma or application source.
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build

# ---- Production image ----
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

COPY prisma ./prisma
COPY tsconfig.json ./
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 5000
CMD ["node", "dist/server.js"]

# ---------- Build stage ----------
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the source
COPY . .

# Build browser + server (SSR) bundles
RUN npm run build:ssr

# ---------- Runtime stage ----------
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the built app (browser + server)
COPY --from=build /app/dist/meet-portfolio ./dist/meet-portfolio

# Your SSR server entry is usually dist/PROJECT/server/server.mjs
# You saw "server.mjs" in the logs, so we’ll run that:
EXPOSE 4000
CMD ["node", "dist/meet-portfolio/browser/server/server.mjs"]  
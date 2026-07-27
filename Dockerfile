# Node 22.5+ is required: the app uses the built-in node:sqlite module.
# Pinning 24 also keeps that API on a version where it's no longer moving.
FROM node:24-alpine AS build
WORKDIR /app

# NODE_ENV is deliberately NOT set here — vite lives in devDependencies and
# `npm ci` must install it for the client build to run.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- runtime ----------
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
# Must match `internal_port` and [env] PORT in fly.toml, or Fly routes traffic
# to a port nothing is listening on and every health check fails.
ENV PORT=3001

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY server ./server
COPY shared ./shared

# The SQLite file lives here. Mount a persistent volume at this path or the
# database — and every workout in it — is lost on each redeploy.
ENV LIFT_DB=/data/lift.db
VOLUME /data

EXPOSE 3001
CMD ["node", "server/index.js"]

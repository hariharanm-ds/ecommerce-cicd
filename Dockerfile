# ---- Base image ----
FROM node:20-alpine

# ---- Set working directory ----
WORKDIR /app

# ---- Install dependencies first (better layer caching) ----
COPY package*.json ./
RUN npm install --omit=dev

# ---- Copy the rest of the app ----
COPY . .

# ---- App listens on 3000 ----
EXPOSE 3000

# ---- Basic container-level health check ----
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/health || exit 1

# ---- Start the app ----
CMD ["node", "server.js"]

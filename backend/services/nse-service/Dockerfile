# Build context: backend/  (docker build -f services/nse-service/Dockerfile .)
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/nse-core/package.json packages/nse-core/
COPY services/nse-service/package.json services/nse-service/
RUN npm ci --omit=dev --workspace=services/nse-service

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY packages/nse-core packages/nse-core
COPY services/nse-service services/nse-service
USER node
EXPOSE 8080
CMD ["node", "services/nse-service/src/index.js"]

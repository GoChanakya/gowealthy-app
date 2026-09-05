# Build context: backend/  (docker build -f services/upload-service/Dockerfile .)
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/nse-core/package.json packages/nse-core/
COPY services/upload-service/package.json services/upload-service/
RUN npm ci --omit=dev --workspace=services/upload-service

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY services/upload-service services/upload-service
USER node
EXPOSE 8080
CMD ["node", "services/upload-service/src/index.js"]

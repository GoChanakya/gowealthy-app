# Build context: backend/  (docker build -f services/recommendation-service/Dockerfile .)
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/nse-core/package.json packages/nse-core/
COPY services/recommendation-service/package.json services/recommendation-service/
RUN npm ci --omit=dev --workspace=services/recommendation-service

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY services/recommendation-service services/recommendation-service
USER node
EXPOSE 8080
CMD ["node", "services/recommendation-service/src/index.js"]

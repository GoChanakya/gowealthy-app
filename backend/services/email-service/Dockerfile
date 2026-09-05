# Build context: backend/  (docker build -f services/email-service/Dockerfile .)
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/nse-core/package.json packages/nse-core/
COPY services/email-service/package.json services/email-service/
RUN npm ci --omit=dev --workspace=services/email-service

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY services/email-service services/email-service
USER node
EXPOSE 8080
CMD ["node", "services/email-service/src/index.js"]

# Build context: backend/  (docker build -f services/scheme-job/Dockerfile .)
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/nse-core/package.json packages/nse-core/
COPY services/scheme-job/package.json services/scheme-job/
RUN npm ci --omit=dev --workspace=services/scheme-job

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY packages/nse-core packages/nse-core
COPY services/scheme-job services/scheme-job
USER node
EXPOSE 8080
CMD ["node", "services/scheme-job/src/index.js"]

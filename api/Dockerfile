@"
FROM node:18-alpine AS builder
WORKDIR /app
COPY api/package.json api/package-lock.json ./
RUN npm ci
COPY api/src ./src
COPY api/tsconfig.json ./tsconfig.json
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY api/package.json api/package-lock.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/index.js"]
"@ | Set-Content Dockerfile; git add Dockerfile; git commit -m "Fix: Correct Dockerfile with multi-stage build"; git push
FROM node:18-alpine
WORKDIR /app
COPY api/package.json api/package-lock.json ./
RUN npm ci --only=production
COPY api/src ./src
COPY api/tsconfig.json ./tsconfig.json
RUN npm run build
EXPOSE 8080
CMD ["node", "dist/index.js"]

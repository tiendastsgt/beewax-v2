FROM node:18-alpine

WORKDIR /app

COPY api/package.json api/package-lock.json ./
RUN npm ci --only=production && chmod +x ./node_modules/.bin/*

COPY api/ ./

RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]

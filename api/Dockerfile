FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY package-lock.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]
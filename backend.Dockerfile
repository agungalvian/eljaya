FROM node:20-alpine AS base
WORKDIR /app/backend
RUN apk add --no-cache openssl libc6-compat
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
RUN npx prisma generate
EXPOSE 3001
CMD ["node", "src/server.js"]

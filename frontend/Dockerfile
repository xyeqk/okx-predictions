# Build stage
FROM node:22.12-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npx vite build

# Runtime stage — serve static dist on $PORT
FROM node:22.12-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist /app/dist
ENV PORT=8080
EXPOSE 8080
CMD sh -c "serve -s dist -l ${PORT:-8080}"

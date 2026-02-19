# Build stage
FROM node:20-alpine AS builder

# Install dependencies required by sharp
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Production stage
FROM node:20-alpine

# Install sharp runtime dependencies
RUN apk add --no-cache vips

WORKDIR /app

# Copy dependencies from build stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 37000

# Start application
CMD ["node", "src/app.js"]

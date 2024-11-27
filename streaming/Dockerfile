# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install yarn if not present
RUN apk add --no-cache yarn

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies using yarn
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN yarn build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install yarn
RUN apk add --no-cache yarn

# Copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port 80
EXPOSE 80

# Start the application
CMD ["yarn", "start"]

# Base image
FROM node:20-bullseye-slim AS base

# Install dependencies only when needed
FROM base AS deps
# Install OpenSSL for Prisma and build tools for node-gyp
RUN apt-get update && apt-get install -y openssl libssl-dev ca-certificates python3 make g++
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY prisma ./prisma
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client before building Next.js
RUN npx prisma generate

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

# Install runtime dependencies for Prisma and ONNX
RUN apt-get update && apt-get install -y openssl libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
# Install Prisma globally so it's available for migrations without npx downloading it
RUN npm install -g prisma@5.22.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Manually copy ONNX runtime since Next.js standalone tracing drops native edge bindings
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime.so.1.14.0 ./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime.so.1.14.0

# Manually copy @google-cloud/tasks because Next.js standalone tracing drops its protos.json
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@google-cloud/tasks ./node_modules/@google-cloud/tasks

# Add Prisma schema and migrations to the runner image so `npx prisma migrate deploy` can run
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Create a startup script
RUN echo '#!/bin/sh\n\
echo "Running Prisma migrations..."\n\
prisma migrate deploy\n\
echo "Starting Next.js..."\n\
exec node server.js\n\
' > /app/start.sh && chmod +x /app/start.sh

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost to avoid connection errors inside docker
ENV HOSTNAME "0.0.0.0"

CMD ["/app/start.sh"]

FROM node:18-alpine

# Set memory limit for Node.js
ENV NODE_OPTIONS="--max-old-space-size=512"

WORKDIR /app

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

COPY package*.json ./
RUN npm install --production && npm cache clean --force

COPY src ./src

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Create uploads directory and set permissions
RUN mkdir -p uploads/avatars && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["npm", "start"] 
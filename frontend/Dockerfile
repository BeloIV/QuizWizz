# Use Node.js 18 as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copy the rest of the application
COPY . .

# Expose port 3000
EXPOSE 3000

# Set entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]

# Start the application
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
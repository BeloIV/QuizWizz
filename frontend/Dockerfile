# Use Node.js 18 as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Set host to 0.0.0.0 and disable host check
ENV HOST=0.0.0.0
ENV DANGEROUSLY_DISABLE_HOST_CHECK=true
ENV FAST_REFRESH=false
ENV GENERATE_SOURCEMAP=false
ENV REACT_APP_WEBPACK_DISABLE_HMR=true

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
# Use Node.js 18+ base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port (as defined in environment variable or 3001)
EXPOSE 3001

# Start the application
CMD ["npm", "start"]

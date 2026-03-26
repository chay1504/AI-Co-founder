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

# Create a dummy .env for Prisma to generate without database connection
RUN echo "DATABASE_URL=\"postgresql://user:password@localhost:5432/db\"" > .env

# Generate Prisma client (uses dummy .env)
RUN npx prisma generate

# Remove dummy .env - real one will be provided at runtime
RUN rm .env

# Build the application
RUN npm run build

# Expose port (as defined in environment variable or 3001)
EXPOSE 3001

# Start the application
CMD ["npm", "start"]

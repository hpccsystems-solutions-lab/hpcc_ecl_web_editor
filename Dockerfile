# Use Node.js base image
FROM node:18-alpine


# Set working directory
WORKDIR /ecl-web-editor

# Copy package files
COPY package.json ./ 
COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Build the app
RUN npm run build

# Expose the port
EXPOSE 8000

# Start the app
CMD ["npm", "start"]
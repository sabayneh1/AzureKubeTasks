# Use an official Node.js runtime as a base image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Install build tools to compile native dependencies and utilities like curl
RUN apt-get update && apt-get install -y \
    build-essential \
    python \
    curl

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# If you are building your code for production
# RUN npm install --only=production
# For development, you can skip this step to install all dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port the app runs on
EXPOSE 3003

# Command to run the application
CMD ["node", "app.js"]

# Use an official Node.js runtime as a base image with build tools
FROM node:14-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Install build tools to compile native dependencies
RUN apt-get update && apt-get install -y build-essential python

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port the app runs on
EXPOSE 3002

# Command to run the application
CMD ["node", "app.js"]

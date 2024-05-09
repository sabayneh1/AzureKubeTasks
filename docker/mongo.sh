#!/bin/bash

# Update the package list
sudo apt update

# Install wget and gnupg if they aren't already installed
sudo apt install -y wget gnupg

# Add MongoDB public GPG key to the system
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# Update the package list with the new repository
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Start MongoDB service and enable it to start on boot
sudo systemctl start mongod
sudo systemctl enable mongod

# Wait for MongoDB to start fully before attempting to set up user
sleep 5

# Setup admin user
mongo admin --eval "db.createUser({user: 'admin', pwd: '1234', roles: [{role: 'userAdminAnyDatabase', db: 'admin'}]})"

# Enable authentication
echo "security:
  authorization: enabled" | sudo tee -a /etc/mongod.conf

# Restart MongoDB to apply security settings
sudo systemctl restart mongod

# Confirmation message
echo "MongoDB installation and initial setup complete. MongoDB is running with authentication enabled."

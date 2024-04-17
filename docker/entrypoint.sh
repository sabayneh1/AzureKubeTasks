#!/bin/sh
# Simple script to wait for other services to become available

echo "Waiting for services to become available..."
sleep 10  # or use a loop to ping services

echo "Starting Nginx..."
nginx -g 'daemon off;'

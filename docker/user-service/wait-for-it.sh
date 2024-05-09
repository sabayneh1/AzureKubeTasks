#!/bin/bash
echo "Running wait-for-it.sh script..."
set -e
...


host="$1"
shift
cmd="$@"

until nc -z "$host" 27017; do
  >&2 echo "Mongo is unavailable - sleeping"
  sleep 1
done

>&2 echo "Mongo is up - executing command"
exec $cmd

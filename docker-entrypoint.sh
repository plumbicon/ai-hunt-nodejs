#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Wait for the database to be ready
# We'll use a simple loop and netcat to check if the port is open.
# The host 'db' is the name of our postgres service in docker-compose.yml.
echo "Waiting for database to be ready..."
while ! nc -z db 5432; do
  sleep 1
done
echo "Database is ready."

# Run database migrations
echo "Running database migrations..."
npx sequelize-cli db:migrate

# Now execute the main command (passed as arguments to this script)
# This will be `npm start` as defined in the Dockerfile's CMD.
exec "$@"
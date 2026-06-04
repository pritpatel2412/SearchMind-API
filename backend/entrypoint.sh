#!/bin/sh
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Starting SearchMind API..."
exec "$@"

#!/bin/sh
# Persist the SQLite DB and uploaded media on the mounted volume (/data), and
# serve uploads from there by symlinking public/uploads -> /data/uploads. This
# keeps the repo's static data/ files (media.json, landing.json, …) in the image
# while user data survives restarts/redeploys.
set -e

mkdir -p /data/uploads

# Point /uploads at the persistent volume (Next serves it as a static path).
if [ ! -L /app/public/uploads ]; then
  rm -rf /app/public/uploads
fi
ln -sfn /data/uploads /app/public/uploads

exec "$@"

#!/bin/sh
# Persist the SQLite DB and uploaded media on the mounted volume (/data), and
# serve uploads from there by symlinking public/uploads -> /data/uploads. This
# keeps the repo's static data/ files (media.json, landing.json, …) in the image
# while user data survives restarts/redeploys.
set -e

# A Fly volume is mounted after image build and can retain root-owned files from
# an earlier deployment. SQLite needs write access to both the database and its
# parent directory for WAL/SHM files.
if [ "$(id -u)" = "0" ]; then
  mkdir -p /data/uploads
  chown -R node:node /data
else
  mkdir -p /data/uploads
fi

# Point /uploads at the persistent volume (Next serves it as a static path).
if [ ! -L /app/public/uploads ]; then
  rm -rf /app/public/uploads
fi
ln -sfn /data/uploads /app/public/uploads

if [ "$(id -u)" = "0" ]; then
  exec gosu node "$@"
fi
exec "$@"

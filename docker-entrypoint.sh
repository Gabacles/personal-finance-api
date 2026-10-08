#!/bin/sh
set -eu

echo "[api] Applying Prisma migrations..."
npx prisma migrate deploy

echo "[api] Seeding database..."
npx prisma db seed

echo "[api] Starting API..."
if [ -f dist/main.js ]; then
	node dist/main.js
elif [ -f dist/src/main.js ]; then
	node dist/src/main.js
else
	echo "[api] Could not find compiled entrypoint (dist/main.js or dist/src/main.js)."
	exit 1
fi

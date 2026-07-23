#!/bin/sh
set -eu
# Volume portal_uploads sering milik root saat pertama dibuat — siapkan lalu drop ke nextjs.
mkdir -p /app/public/uploads
chown -R nextjs:nodejs /app/public/uploads 2>/dev/null || true
exec su-exec nextjs "$@"

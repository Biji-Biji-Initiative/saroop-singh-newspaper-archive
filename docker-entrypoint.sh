#!/bin/sh
set -eu

ARCHIVE_DATA_DIR="${ARCHIVE_DATA_DIR:-/data}"

mkdir -p "$ARCHIVE_DATA_DIR"
chown -R nextjs:nodejs "$ARCHIVE_DATA_DIR"

exec gosu nextjs:nodejs "$@"

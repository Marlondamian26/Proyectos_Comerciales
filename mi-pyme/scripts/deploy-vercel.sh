#!/usr/bin/env bash
set -euo pipefail

echo "=== Deploy a Vercel ==="
echo "Branch actual: $(git branch --show-current)"
echo "Commit HEAD:  $(git rev-parse --short HEAD)"
echo ""

if [ "${1:-}" = "--prod" ]; then
  echo ">> Modo: PRODUCCION"
  DEPLOY_CMD="vercel --prod --yes"
else
  echo ">> Modo: PREVIEW"
  DEPLOY_CMD="vercel --yes"
fi

echo ">> Ejecutando: $DEPLOY_CMD"
echo ""

$DEPLOY_CMD

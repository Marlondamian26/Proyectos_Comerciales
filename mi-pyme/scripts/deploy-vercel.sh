#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$PROJECT_DIR" && git rev-parse --show-toplevel)"
VERCEL_DIR="$REPO_ROOT/.vercel"

cd "$REPO_ROOT"

echo "=== Deploy a Vercel ==="
echo "Branch actual: $(git branch --show-current 2>/dev/null || echo 'unknown')"
echo "Commit HEAD:  $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
echo "Root Directory: $REPO_ROOT"
echo ""

if [ "${1:-}" = "--prod" ]; then
  echo ">> Modo: PRODUCCION"
  DEPLOY_FLAG="--prod"
else
  echo ">> Modo: PREVIEW"
  DEPLOY_FLAG=""
fi

if [ ! -f "$VERCEL_DIR/project.json" ]; then
  echo ">> Sincronizando configuracion de Vercel..."
  npx vercel pull --yes --environment=preview
fi

echo ">> Ejecutando: vercel deploy $DEPLOY_FLAG --yes"
echo ""

NPM_FLAGS="--legacy-peer-deps" npx vercel deploy $DEPLOY_FLAG --yes

echo ""
echo ">> Deploy completado."

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

command -v docker >/dev/null || { echo "Install Docker"; exit 1; }
command -v npm >/dev/null || { echo "Install Node.js 18+"; exit 1; }

npm install
if [ ! -f .env.local ]; then
  cp .env.local.example .env.local
  echo "Created .env.local from .env.local.example"
fi

npx --yes supabase@latest start
npx supabase status
echo "Open http://localhost:3000"
npm run dev

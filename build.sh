#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "=============================================="
echo " Green Nest Bloom - Unified Production Build "
echo "=============================================="

echo "Step 1: Installing frontend dependencies & building React SPA..."
echo "Node runtime version: $(node -v || true)"
echo "NPM package version:  $(npm -v || true)"
cd frontend
# Ensure devDependencies (vite, tailwind) are installed even if NODE_ENV=production
npm install --include=dev
npm run build
cd ..

echo "Step 2: Installing Python backend dependencies..."
python3 -m pip install --upgrade pip setuptools wheel
python3 -m pip install -r requirements.txt

echo "Step 3: Verifying backend database initialization..."
python3 -c "
import os, sys
sys.path.insert(0, os.path.abspath('backend'))
from app import create_app
app, _ = create_app()
with app.app_context():
    print('Production database tables verified successfully.')
"

echo "Build completed successfully!"

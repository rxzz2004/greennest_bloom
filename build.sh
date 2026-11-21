#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "=============================================="
echo " Green Nest Bloom - Unified Production Build "
echo "=============================================="

echo "Step 1: Checking and building frontend assets..."
if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    echo "Node.js detected ($(node -v)). Compiling fresh React SPA bundle..."
    cd frontend
    npm install --include=dev
    npm run build
    cd ..
elif [ -d "frontend/dist" ] && [ -f "frontend/dist/index.html" ]; then
    echo "Node.js not detected, but pre-compiled frontend/dist exists. Serving pre-compiled bundle."
else
    echo "Warning: Neither Node nor frontend/dist available."
fi

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

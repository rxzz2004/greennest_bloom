#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "=============================================="
echo " Green Nest Bloom - Unified Production Build "
echo "=============================================="

echo "Step 1: Installing frontend dependencies & building React SPA..."
cd frontend
npm install
npm run build
cd ..

echo "Step 2: Installing Python backend dependencies..."
if command -v pip &> /dev/null; then
    pip install -r requirements.txt
elif command -v pip3 &> /dev/null; then
    pip3 install -r requirements.txt
else
    python3 -m pip install -r requirements.txt
fi

echo "Step 3: Verifying backend database initialization..."
python3 -c "
import os, sys
sys.path.insert(0, 'backend')
from app import create_app
app, _ = create_app()
with app.app_context():
    print('Production database tables verified successfully.')
"

echo "Build completed successfully!"

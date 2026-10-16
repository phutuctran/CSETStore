#!/bin/sh
echo "==================================================="
echo "    CSET STORE - 3D PRINTING STUDIO (OFFLINE)      "
echo "==================================================="
echo ""
if [ ! -d "dist" ]; then
    echo "Thu muc dist chua ton tai. Dang build..."
    npm run build
fi
echo "Khoi chay Offline server tai http://localhost:5174"
node serve-offline.mjs

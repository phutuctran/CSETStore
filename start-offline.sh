#!/bin/sh
echo "==================================================="
echo "    CSET STORE - SIEU THI MUA SAM TRUC TUYEN (OFFLINE)"
echo "==================================================="
echo ""
echo "Dang tien hanh dong goi ung dung (npm run build)..."
npm run build
echo ""
echo "==================================================="
echo "May chu Offline dang hoat dong tai cong 5174:"
echo "  - Cua hang (Store): http://localhost:5174"
echo "  - Quan tri (Admin): http://localhost:5174/admin.html"
echo "==================================================="
node serve-offline.mjs

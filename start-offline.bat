@echo off
title CSET Store - Offline Deployment Runner
echo ===================================================
echo     CSET STORE - 3D PRINTING STUDIO (OFFLINE)
echo ===================================================
echo.
echo Dang kiem tra thu muc dist san pham...
if not exist "dist" (
    echo Chua tim thay thu muc dist. Dang tien hanh build...
    call npm run build
)

echo.
echo Dang khoi chay may chu Offline tai cong 5174...
echo Ban co the mo trinh duyet truy cap: http://localhost:5174
echo Nhan Ctrl + C de dung may chu bat cu luc nao.
echo.
call node serve-offline.mjs
pause

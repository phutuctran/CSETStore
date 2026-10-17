@echo off
title CSET Store - Offline Deployment Runner
echo ===================================================
echo     CSET STORE - SIEU THI MUA SAM TRUC TUYEN (OFFLINE)
echo ===================================================
echo.
echo Dang tien hanh dong goi ung dung (npm run build)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [LOI] Dong goi that bai. Vui long kiem tra lai ma nguon!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ===================================================
echo May chu Offline dang hoat dong tai cong 5174:
echo   - Cua hang (Store): http://localhost:5174
echo   - Quan tri tong (Admin): http://localhost:5174/admin.html
echo   - Quan ly ban hang & doanh thu (Sales Portal): http://localhost:5174/sales.html
echo ===================================================
echo Nhan Ctrl + C de dung may chu bat cu luc nao.
echo.
call node serve-offline.mjs
pause

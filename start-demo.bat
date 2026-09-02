@echo off
title SIH Railway Block Planner Demo Launcher
echo ==================================================================
echo   Starting SIH Railway Block Planner Demo
echo ==================================================================
set PATH=C:\Users\Hp\AppData\Local\Programs\nodejs;%PATH%
cd /d "%~dp0backend"
start "SIH Railway Backend" cmd /k "node src/server.js"
timeout /t 2 >nul
start http://localhost:5000
echo Demo is active at http://localhost:5000
pause

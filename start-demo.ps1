# SIH Railway Block Planner Demo Launcher
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  🚄 Starting SIH Railway Block Planner & Dynamic Rerouting Demo  " -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Cyan

$env:Path = "C:\Users\Hp\AppData\Local\Programs\nodejs;" + $env:Path

Set-Location "$PSScriptRoot\backend"
Write-Host "[1/2] Initializing Express Routing Engine & LRU Cache..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = 'C:\Users\Hp\AppData\Local\Programs\nodejs;' + `$env:Path; cd '$PSScriptRoot\backend'; node src/server.js"

Start-Sleep -Seconds 2
Write-Host "[2/2] Opening Interactive Railway Demo in Browser..." -ForegroundColor Green
Start-Process "http://localhost:5000"

Write-Host "`n✅ Demo is live at http://localhost:5000" -ForegroundColor Green
Write-Host "Press any key to return..."

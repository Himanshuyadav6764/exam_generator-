# Auth System Startup Script
Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    Starting Auth System Servers   ║" -ForegroundColor White
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

# Set environment variables
$env:JAVA_HOME = "C:\LOGIN_PAGE\tools\jdk-17.0.9+8"
$env:PATH = "$env:JAVA_HOME\bin;C:\LOGIN_PAGE\tools\apache-maven-3.9.5\bin;$env:PATH"

Write-Host "Starting Backend (Spring Boot)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd C:\LOGIN_PAGE\backend; `$env:JAVA_HOME='C:\LOGIN_PAGE\tools\jdk-17.0.9+8'; `$env:PATH='C:\LOGIN_PAGE\tools\jdk-17.0.9+8\bin;C:\LOGIN_PAGE\tools\apache-maven-3.9.5\bin;'+`$env:PATH; Write-Host '🔧 Backend Server' -ForegroundColor Green; mvn spring-boot:run"

Write-Host " Waiting 3 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host " Starting Frontend (Angular)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd C:\LOGIN_PAGE\frontend; Write-Host ' Frontend Server' -ForegroundColor Green; npm start"

Write-Host "`n Waiting for servers to start (15 seconds)..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# Check server status
Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        Server Status Check        ║" -ForegroundColor White
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

$backend = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
$frontend = Get-NetTCPConnection -LocalPort 4200 -ErrorAction SilentlyContinue
$mongodb = Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue

if ($backend) {
    Write-Host " Backend:  http://localhost:8081" -ForegroundColor Green
}
else {
    Write-Host " Backend:  Still starting..." -ForegroundColor Yellow
}

if ($frontend) {
    Write-Host " Frontend: http://localhost:4200" -ForegroundColor Green
}
else {
    Write-Host " Frontend: Still starting..." -ForegroundColor Yellow
}

if ($mongodb) {
    Write-Host " MongoDB:  localhost:27017" -ForegroundColor Green
}
else {
    Write-Host " MongoDB:  NOT RUNNING" -ForegroundColor Red
}

Write-Host "`n"
if ($backend -and $frontend) {
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║     ALL SYSTEMS ARE READY!      ║" -ForegroundColor White
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host "`n"
    Write-Host " Opening application in browser..." -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:4200"
    Write-Host "`n Application opened! Keep server windows open.`n" -ForegroundColor White
}
else {
    Write-Host " Servers are still starting. Please wait 10 more seconds.`n" -ForegroundColor Yellow
}

Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

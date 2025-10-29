# Stop Auth System Servers
Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    Stopping Auth System Servers   ║" -ForegroundColor White
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "Stopping Spring Boot (Port 8081)..." -ForegroundColor Yellow
$backend = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
if ($backend) {
    $processId = $backend.OwningProcess
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Write-Host " Backend stopped" -ForegroundColor Green
}
else {
    Write-Host " Backend not running" -ForegroundColor Gray
}

Write-Host "Stopping Angular (Port 4200)..." -ForegroundColor Yellow
$frontend = Get-NetTCPConnection -LocalPort 4200 -ErrorAction SilentlyContinue
if ($frontend) {
    $processId = $frontend.OwningProcess
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Write-Host "Frontend stopped" -ForegroundColor Green
}
else {
    Write-Host " Frontend not running" -ForegroundColor Gray
}

Write-Host "`n All servers stopped!`n" -ForegroundColor Green
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

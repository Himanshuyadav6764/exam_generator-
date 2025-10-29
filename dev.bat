@echo off
cd /d C:\LOGIN_PAGE
set JAVA_HOME=C:\LOGIN_PAGE\tools\jdk-17.0.9+8
set PATH=%JAVA_HOME%\bin;C:\LOGIN_PAGE\tools\apache-maven-3.9.5\bin;%PATH%

echo Starting Backend...
start "Backend" cmd /k "cd /d C:\LOGIN_PAGE\backend && mvn spring-boot:run"

timeout /t 3 /nobreak >nul

echo Starting Frontend...
start "Frontend" cmd /k "cd /d C:\LOGIN_PAGE\frontend && npm start"

echo.
echo Servers are starting...
echo Backend: http://localhost:8081
echo Frontend: http://localhost:4200
echo.
timeout /t 10 /nobreak >nul
start http://localhost:4200

@echo off
if "%1"=="min" goto server_start
start "" /min "%~dp0run_tasker.bat" min
exit

:server_start
cd /d "%~dp0"
title Tasker App Server

:: 1. Проверяем, работает ли уже приложение (порт 3000)
netstat -ano | find "3000" | find "LISTENING" >nul
if %errorlevel%==0 (
    :: Если работает - просто открываем браузер
    start "" "http://localhost:3000"
    exit
)

:: 2. Если не работает - запускаем сервер и браузер
:: Сначала открываем браузер, чтобы не ждать старта
start "" "http://localhost:3000"

echo Starting Tasker App Server...
echo The window is minimized to allow the app to run in the background.
echo To STOP the app, simply close this window from the taskbar.

:: Запускаем сервер
call npm run dev
pause

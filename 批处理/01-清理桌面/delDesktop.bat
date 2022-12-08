@setlocal enabledelayedexpansion
@echo off
set delDesktopa=C:\Users\user\Desktop\text
for /f "delims=" %%i in ('dir /b !delDesktopa!') do (
    echo !delDesktopa!\%%i
    if exist "!delDesktopa!\%%i\" (
        rd /s /q "!delDesktopa!\%%i"
    ) else (
        del /f /s /q "!delDesktopa!\%%i"
    )
)
EXIT
@setlocal enabledelayedexpansion
@echo off
@REM 白名单
set whiteList=C:\Users\xxx\Desktop\disDesktop\whiteList.txt
@REM 缓存目录
set delDesktopa=C:\Users\xxx\Desktop\disDesktop
@REM 获取所有用户
for /f "delims=" %%i in ('dir /b C:\Users') do ( 
    @REM 清理目录
    set moveDesktopa=C:\Users\%%i\Desktop\test
    if exist !moveDesktopa! (
        @REM 桌面
        for /f "delims=" %%j in ('dir /b !moveDesktopa!') do ( 
            set /a aa="1"
            @REM 白名单
            for /f "delims=" %%k in (%whiteList%) do ( 
                if  "%%j"=="%%k" (
                    set /a aa="2"
                )
            )
            if not "!aa!"=="2" (
                move !moveDesktopa!\%%j %delDesktopa%
            )
        )
    )
)
EXIT
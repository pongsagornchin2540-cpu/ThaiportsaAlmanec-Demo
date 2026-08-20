@echo off
setlocal
set "APP_PORT=8081"
if not "%~1"=="" set "APP_PORT=%~1"
pushd "%~dp0"
echo.
echo  Thailand Sports Almanac
echo  Open: http://localhost:%APP_PORT%
echo  Stop: Ctrl+C
echo  Tip: use serve.bat (serve.ps1 may be blocked by PowerShell policy)
echo.
python -m http.server %APP_PORT%
popd
endlocal

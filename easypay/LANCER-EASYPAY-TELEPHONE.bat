@echo off
REM ============================================================
REM  EasyPay - visite des ecrans SUR UN TELEPHONE ANDROID VIRTUEL
REM  Plus lourd que la version navigateur (compte 5 minutes).
REM  Double-clic sur ce fichier, puis laisse les fenetres ouvertes.
REM ============================================================
title EasyPay - telephone virtuel (ne pas fermer)
cd /d "%~dp0"

set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%"
set "EXPO_PUBLIC_GO=1"

echo.
echo   [1/3] Allumage du telephone virtuel...
start "Telephone virtuel EasyPay" "%ANDROID_HOME%\emulator\emulator.exe" -avd Pixel_Fold_API_35 -memory 2048 -no-snapshot -no-snapshot-save -no-boot-anim -gpu host

echo   [2/3] Attente du demarrage d'Android (1 a 2 minutes)...
adb wait-for-device
:attente
for /f "delims=" %%B in ('adb shell getprop sys.boot_completed 2^>nul') do set "BOOT=%%B"
echo %BOOT% | findstr /c:"1" >nul
if errorlevel 1 (
  timeout /t 5 /nobreak >nul
  goto attente
)

echo   [3/3] Ouverture d'EasyPay sur le telephone...
echo.
echo   Laisse cette fenetre ouverte pendant que tu regardes l'application.
echo   Pour tout arreter : ferme cette fenetre et celle du telephone.
echo.

call npx.cmd expo start --go --android

echo.
echo   La fenetre s'est arretee. Appuie sur une touche pour fermer.
pause >nul

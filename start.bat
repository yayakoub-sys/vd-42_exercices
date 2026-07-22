@echo off
REM Lanceur Windows du moteur d'extraction de documents.
REM Double-cliquez sur ce fichier pour demarrer le moteur + l'interface web.

cd /d "%~dp0"

if not exist "config.yaml" (
    echo Premiere utilisation : copie de config.example.yaml vers config.yaml
    copy "config.example.yaml" "config.yaml" >nul
    echo.
    echo >>> Ouvrez config.yaml et reglez "watch_path" sur la lettre du disque
    echo     yayakoub disque (ex: E:\ ), puis relancez ce fichier.
    echo.
    pause
    exit /b 0
)

echo Demarrage du moteur...
python -m docengine
pause

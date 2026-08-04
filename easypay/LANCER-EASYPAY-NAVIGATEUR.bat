@echo off
REM ============================================================
REM  EasyPay - visite des ecrans DANS LE NAVIGATEUR
REM  Le plus leger : pas de telephone virtuel, pas d'attente.
REM  Double-clic sur ce fichier, puis laisse la fenetre ouverte.
REM ============================================================
title EasyPay - navigateur (ne pas fermer)
cd /d "%~dp0"

set "EXPO_PUBLIC_GO=1"

echo.
echo   Demarrage d'EasyPay dans le navigateur...
echo   Cela prend 1 a 3 minutes la premiere fois.
echo   Une page va s'ouvrir toute seule.
echo.
echo   Pour arreter : ferme cette fenetre.
echo.

call npx.cmd expo start --web

echo.
echo   La fenetre s'est arretee. Appuie sur une touche pour fermer.
pause >nul

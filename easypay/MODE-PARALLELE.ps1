# MODE TRAVAIL PARALLELE - rend la machine a l'autre projet.
#
# Eteint proprement ce qui coute cher dans EasyPay, et RIEN d'autre.
# Mesure du 2026-08-04, ce que chaque piece rend :
#   telephone virtuel ..... 4 335 Mo engages / 1 162 Mo en memoire vive
#   Metro + node .......... 2 011 Mo engages /   768 Mo
#   assistant Gradle ...... jusqu'a 2 048 Mo, garde 3 h apres une compilation
#
# Ce script NE TOUCHE PAS :
#   - Docker ni le conteneur homarr-redis (c'est ton autre projet) ;
#   - Chrome ni Claude (a toi de decider) ;
#   - le cache de Metro (%TEMP%\metro-cache) : le vider couterait 3 minutes
#     de recompilation au prochain demarrage.
#
# NOTE : caracteres simples volontaires (voir MODE-MOBILE.ps1).
#
# Usage :  .\MODE-PARALLELE.ps1
# Retour : .\MODE-MOBILE.ps1

$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$os0 = Get-CimInstance Win32_OperatingSystem
Write-Host ("Memoire libre avant : {0:N2} Go" -f ($os0.FreePhysicalMemory/1MB)) -ForegroundColor Cyan

# --- Telephone virtuel : extinction propre -----------------------------------
# On demande d'abord poliment (adb emu kill) : une extinction brutale laisse un
# rapport de plantage, qui bloque le demarrage suivant derriere une boite de
# dialogue. C'est exactement le piege documente dans ETAT.md section 10.4.
if (Get-Process qemu-system-x86_64 -EA SilentlyContinue) {
  Write-Host "  arret du telephone virtuel..."
  & "$sdk\platform-tools\adb.exe" emu kill 2>&1 | Out-Null
  $t = 0
  while ((Get-Process qemu-system-x86_64 -EA SilentlyContinue) -and $t -lt 30) { Start-Sleep 1; $t++ }
  if (Get-Process qemu-system-x86_64 -EA SilentlyContinue) {
    Write-Host "  il ne repond pas, arret force" -ForegroundColor Yellow
    Get-Process qemu-system-x86_64,emulator -EA SilentlyContinue | Stop-Process -Force
  }
  Write-Host "  fait" -ForegroundColor Green
}

# --- Metro -------------------------------------------------------------------
$metro = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
           Where-Object { $_.CommandLine -match 'expo|metro' })
if ($metro.Count -gt 0) {
  Write-Host "  arret de Metro ($($metro.Count) processus)..."
  $metro | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -EA SilentlyContinue }
  Write-Host "  fait" -ForegroundColor Green
}

# --- Assistant Gradle --------------------------------------------------------
# Apres une compilation Android il reste en memoire 3 heures sans rien faire.
$gradle = @(Get-CimInstance Win32_Process -Filter "Name='java.exe'" -EA SilentlyContinue |
            Where-Object { $_.CommandLine -match 'GradleDaemon' })
if ($gradle.Count -gt 0) {
  Write-Host "  arret de l'assistant Gradle..."
  Push-Location (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'android')
  & .\gradlew.bat --stop 2>&1 | Out-Null
  Pop-Location
  Write-Host "  fait" -ForegroundColor Green
}

# --- Rapports de plantage ----------------------------------------------------
Get-ChildItem "$env:LOCALAPPDATA\Temp\AndroidEmulator" -Filter *.dmp -Recurse -EA SilentlyContinue |
  ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force -EA SilentlyContinue }

Start-Sleep 3
$os1 = Get-CimInstance Win32_OperatingSystem
$gain = ($os1.FreePhysicalMemory - $os0.FreePhysicalMemory)/1MB
Write-Host ("`nMemoire libre apres : {0:N2} Go  (+{1:N2} Go recuperes)" -f ($os1.FreePhysicalMemory/1MB), $gain) -ForegroundColor Green
Write-Host "Docker et ton conteneur homarr-redis n'ont pas ete touches.`n"

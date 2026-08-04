# MODE DEVELOPPEMENT MOBILE - demarre EasyPay dans le bon ordre.
#
# Pourquoi ce script existe : sur ce poste (7,81 Go de memoire vive), l'ordre de
# demarrage n'est pas un detail de confort, c'est ce qui fait la difference entre
# "ca marche" et "l'emulateur se fait tuer". Mesure du 2026-08-04 : lance en meme
# temps que la compilation, l'emulateur a ete tue par manque de memoire DEUX FOIS
# de suite. Lance apres, il tient.
#
# Ce script encode cette sequence pour qu'on n'ait plus a y penser.
#
# NOTE : ce fichier reste volontairement en caracteres simples (pas d'accents,
# pas de tirets longs). Windows PowerShell lit les .ps1 en ANSI et casse sinon.
#
# Usage :  .\MODE-MOBILE.ps1
# Arret :  .\MODE-PARALLELE.ps1

$sdk  = "$env:LOCALAPPDATA\Android\Sdk"
$adb  = "$sdk\platform-tools\adb.exe"
$proj = Split-Path -Parent $MyInvocation.MyCommand.Path

function Etape($n, $t) { Write-Host "`n[$n] $t" -ForegroundColor Cyan }
function Ok($t)        { Write-Host "    OK  $t" -ForegroundColor Green }
function Souci($t)     { Write-Host "    !!  $t" -ForegroundColor Yellow }

# --- 1. Le piege qui deguise tout le reste -----------------------------------
# Apres un plantage, l'emulateur garde le rapport et ATTEND UN CLIC sur une boite
# de dialogue avant de demarrer. Symptome trompeur : "l'emulateur ne demarre
# plus", "la machine est saturee". Mesure : de 246 s sans demarrer, a 37 s.
Etape 1 "Nettoyage des rapports de plantage en attente"
$dmp = @(Get-ChildItem "$env:LOCALAPPDATA\Temp\AndroidEmulator" -Filter *.dmp -Recurse -EA SilentlyContinue)
if ($dmp.Count -gt 0) {
  $dmp | ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force -EA SilentlyContinue }
  Ok "$($dmp.Count) rapport(s) supprime(s), sinon l'emulateur reste bloque"
} else {
  Ok "rien en attente"
}

# --- 2. Metro d'abord --------------------------------------------------------
Etape 2 "Demarrage de Metro (le serveur qui fabrique l'application)"
if (Get-NetTCPConnection -LocalPort 8081 -State Listen -EA SilentlyContinue) {
  Ok "deja en marche"
} else {
  Start-Process cmd.exe -ArgumentList '/c','npx expo start --dev-client' -WorkingDirectory $proj -WindowStyle Minimized
  $t = 0
  while (-not (Get-NetTCPConnection -LocalPort 8081 -State Listen -EA SilentlyContinue) -and $t -lt 120) {
    Start-Sleep 2; $t += 2
  }
  if ($t -ge 120) { Souci "Metro n'a pas repondu en 2 min, regarde sa fenetre"; exit 1 }
  Ok "en marche apres $t s"
}

# --- 3. Compiler AVANT d'allumer le telephone --------------------------------
# C'est tout l'interet du script : le pic de compilation et le pic de l'emulateur
# ne se superposent plus. L'adresse exacte est celle que l'application demande
# reellement (voir ETAT.md section 6) ; prechauffer une autre adresse ne sert a rien.
Etape 3 "Compilation du bundle, telephone encore eteint"
$url = 'http://127.0.0.1:8081/node_modules/expo-router/entry.bundle' +
       '?platform=android&dev=true&transform.bytecode=1&transform.engine=hermes'
$t0 = Get-Date
try {
  $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 900
  Ok ("{0:N0} Ko en {1:N0} s" -f ($r.RawContentLength/1KB), ((Get-Date)-$t0).TotalSeconds)
} catch {
  Souci "compilation echouee : $($_.Exception.Message)"; exit 1
}

# --- 4. Le telephone virtuel en dernier --------------------------------------
Etape 4 "Demarrage du telephone virtuel"
if (Get-Process qemu-system-x86_64 -EA SilentlyContinue) {
  Ok "deja allume"
} else {
  # -no-metrics : empeche la boite de dialogue de l'etape 1 de revenir.
  Start-Process "$sdk\emulator\emulator.exe" -ArgumentList '-avd','Pixel_8_API_35','-no-boot-anim','-no-metrics' -WindowStyle Minimized
  $t0 = Get-Date
  $pret = ''
  while ($pret -ne '1' -and ((Get-Date)-$t0).TotalSeconds -lt 240) {
    Start-Sleep 3
    $pret = ((& $adb shell getprop sys.boot_completed 2>$null) -join '').Trim()
  }
  if ($pret -ne '1') {
    Souci "pas demarre en 4 min. Vide %LOCALAPPDATA%\Temp\AndroidEmulator\*.dmp et reessaie."
    exit 1
  }
  Ok ("demarre en {0:N0} s" -f ((Get-Date)-$t0).TotalSeconds)
}

& $adb reverse tcp:8081 tcp:8081 2>&1 | Out-Null
& $adb shell am start -n com.easypay.development/.MainActivity 2>&1 | Out-Null

$os = Get-CimInstance Win32_OperatingSystem
Write-Host ("`nPRET. Memoire libre : {0:N2} Go sur 7,81 Go." -f ($os.FreePhysicalMemory/1MB)) -ForegroundColor Green
Write-Host "Pour recuperer la machine :  .\MODE-PARALLELE.ps1`n"

# FABRIQUER L'APK - le fichier a envoyer par WhatsApp.
#
# Ce que ce script produit : UN SEUL fichier .apk, installable directement sur
# n'importe quel telephone Android. Pas besoin de PC branche, pas besoin de
# Metro, pas besoin d'Android Studio sur le telephone. On envoie le fichier,
# la personne l'ouvre, elle installe, elle utilise.
#
# CE QU'IL FAUT SAVOIR
# --------------------
# 1. Architectures. Le projet est regle sur `x86_64` dans gradle.properties :
#    c'est l'architecture du TELEPHONE VIRTUEL, pas celle d'un vrai telephone.
#    Un APK compile en x86_64 ne s'installe sur AUCUN telephone du commerce.
#    Ce script force donc arm64-v8a (tous les telephones depuis ~2016) et
#    armeabi-v7a (les modeles 32 bits encore courants en Afrique de l'Ouest),
#    sans toucher au fichier - la boucle emulateur reste intacte.
#
# 2. Signature. Le type `release` de ce projet est signe avec la cle de
#    developpement. L'APK s'installe donc sans probleme, mais il n'est PAS
#    publiable sur le Play Store en l'etat : il faudrait une vraie cle.
#    Pour de la distribution directe (WhatsApp, cle USB), c'est suffisant.
#
# 3. Sur le telephone, Android demandera d'autoriser l'installation
#    d'applications « de source inconnue ». C'est normal : l'application ne
#    vient pas du Play Store.
#
# NOTE : caracteres simples volontaires (Windows PowerShell lit les .ps1 en ANSI).
#
# Usage :  .\FABRIQUER-APK.ps1

$projet = Split-Path -Parent $MyInvocation.MyCommand.Path
$android = Join-Path $projet 'android'

Write-Host "`n[1] Verifications avant de lancer" -ForegroundColor Cyan

$libre = [math]::Round((Get-PSDrive C).Free / 1GB, 2)
Write-Host "    espace libre sur C: : $libre Go"
if ($libre -lt 5) {
  Write-Host "    !! Moins de 5 Go. Lance .\MODE-PARALLELE.ps1 et reessaie." -ForegroundColor Yellow
  exit 1
}

# Le JDK 21 : Gradle 8.14 refuse le JDK 25 embarque dans Android Studio.
$env:JAVA_HOME = "$env:USERPROFILE\.jdks\jbr-21.0.11"
if (-not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
  Write-Host "    !! JDK 21 introuvable dans $env:JAVA_HOME" -ForegroundColor Yellow
  exit 1
}
Write-Host "    JDK : $env:JAVA_HOME" -ForegroundColor Green

# Un emulateur allume divise la memoire disponible : la compilation C++ en
# souffre, et sur ce poste elle finit par se faire tuer.
if (Get-Process qemu-system-x86_64 -EA SilentlyContinue) {
  Write-Host "    telephone virtuel allume, on l'eteint pour laisser la memoire au build"
  & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" emu kill 2>&1 | Out-Null
  Start-Sleep 6
}

Write-Host "`n[2] Compilation (compte 20 a 45 min : le C++ est compile deux fois," -ForegroundColor Cyan
Write-Host "    une fois par architecture de telephone)"

Push-Location $android
$t0 = Get-Date
# Les guillemets sont indispensables : sans eux PowerShell croit lire une de ses
# propres options a cause du tiret, et refuse la ligne.
& .\gradlew.bat ':app:assembleRelease' '-PreactNativeArchitectures=arm64-v8a,armeabi-v7a' '--console=plain'
$code = $LASTEXITCODE
Pop-Location

if ($code -ne 0) {
  Write-Host "`n    !! La compilation a echoue (code $code)." -ForegroundColor Yellow
  Write-Host "    Regarde les dernieres lignes ci-dessus. Cause la plus frequente sur ce"
  Write-Host "    poste : plus assez de place sur C:."
  exit 1
}

Write-Host ("    compile en {0:N0} min" -f ((Get-Date) - $t0).TotalMinutes) -ForegroundColor Green

Write-Host "`n[3] Recuperation du fichier" -ForegroundColor Cyan
$apk = Get-ChildItem (Join-Path $android 'app\build\outputs\apk\release') -Filter *.apk -Recurse -EA SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $apk) {
  Write-Host "    !! Aucun .apk produit." -ForegroundColor Yellow
  exit 1
}

# On depose une copie datee sur le Bureau : facile a retrouver pour l'envoyer.
$destination = Join-Path ([Environment]::GetFolderPath('Desktop')) ("EasyPay-" + (Get-Date -Format 'yyyy-MM-dd') + ".apk")
Copy-Item $apk.FullName $destination -Force

Write-Host ("    APK : {0:N1} Mo" -f ($apk.Length / 1MB)) -ForegroundColor Green
Write-Host "    copie sur le Bureau : $destination" -ForegroundColor Green
Write-Host "`nEnvoie ce fichier par WhatsApp. Sur le telephone : ouvrir, autoriser"
Write-Host "l'installation depuis une source inconnue, installer.`n"

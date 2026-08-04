# Hook SessionStart - injecte le point de reprise et les regles d'execution.
#
# Pourquoi : le socle (CLAUDE.md / ETAT.md / CARTE.md / GATE.md) existe deja,
# mais rien ne garantissait qu'il soit lu AVANT que Claude commence a explorer.
# Ce hook met le point de reprise dans le contexte des la premiere seconde,
# donc avant toute lecture de fichier.
#
# Il ne duplique rien : il LIT ETAT.md, qui reste la seule source de verite.

$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$racine = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$etat = Join-Path $racine 'ETAT.md'

$reprise = '(ETAT.md introuvable)'
if (Test-Path $etat) {
  $txt = Get-Content $etat -Raw
  # Le bloc entre "PROCHAIN POINT DE REPRISE" et le separateur suivant.
  $m = [regex]::Match($txt, '(?s)PROCHAIN POINT DE REPRISE(.*?)(?=\r?\n---)')
  if ($m.Success) { $reprise = $m.Groups[1].Value.Trim() }
  if ($reprise.Length -gt 1400) { $reprise = $reprise.Substring(0, 1400) + ' [...voir ETAT.md]' }
}

$ctx = @"
=== REPRISE DEPUIS LA MEMOIRE FROIDE (injecte automatiquement) ===

Point de reprise en cours, lu dans ETAT.md :

$reprise

=== REGLES D'EXECUTION DU SOCLE vd-42 (acquises, ne pas les redecouvrir) ===

1. ACQUIS = ACQUIS. Un fait marque VERIFIE dans ETAT.md ne se revalide pas.
   Trois exceptions seulement : la mission en depend directement, le code
   concerne a change, ou une contradiction apparait a l'usage.
2. PERIMETRE. Faire ce qui est demande, rien de plus. Une dette hors
   perimetre se consigne dans ETAT.md ; elle n'ouvre pas un chantier.
3. EXECUTER AVANT DE RAPPORTER. Lectures, recherches, tests et agents sont
   des moyens, pas le livrable. Un rapport intermediaire seulement s'il
   debloque un arbitrage ou revele un blocage reel.
4. CONTROLE PROPORTIONNE. Un controle termine n'en declenche pas un autre.
5. AGENTS : zero par defaut. Le fil principal fait le travail.

Trajectoire attendue :
reprise ciblee -> execution -> controle proportionne -> correction ->
controle final -> fin.

CLAUDE.md, CARTE.md et GATE.md ne se lisent que si la mission l'exige.
L'utilisateur n'est pas technicien : mots simples, et distinguer toujours
ce qui est VERIFIE de ce qui est SUPPOSE.
"@

@{ hookSpecificOutput = @{ hookEventName = 'SessionStart'; additionalContext = $ctx } } |
  ConvertTo-Json -Depth 5 -Compress

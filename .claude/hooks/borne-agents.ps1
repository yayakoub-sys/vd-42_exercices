# Hook PreToolUse (Agent/Task) - borne le nombre d'agents par session.
#
# Pourquoi : un agent lance a la legere coute un contexte entier pour un
# resultat que le fil principal obtient souvent en deux commandes.
#
# Ce hook ne BLOQUE pas : au-dela de 2 agents dans la session, il demande
# confirmation a l'utilisateur ("ask"). Une mission qui justifie vraiment
# une flotte d'agents reste donc possible - elle devient juste explicite.
#
# Le compteur vit dans un fichier temporaire, une ligne, par session.

$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$LIBRES = 2

try { $entree = [Console]::In.ReadToEnd() | ConvertFrom-Json } catch { exit 0 }

$sid = $entree.session_id
if (-not $sid) { exit 0 }

$compteur = Join-Path $env:TEMP "claude-agents-$sid.txt"
$n = 0
if (Test-Path $compteur) { $n = [int](Get-Content $compteur -Raw -EA SilentlyContinue) }
$n++
Set-Content -LiteralPath $compteur -Value $n

if ($n -le $LIBRES) { exit 0 }

$raison = "Agent no $n de cette session (les $LIBRES premiers passent sans " +
          "demander). Regle du socle : zero agent par defaut, le fil principal " +
          "fait le travail. Confirme seulement si cet agent apporte quelque " +
          "chose que le fil principal ne peut pas obtenir en quelques commandes."

@{ hookSpecificOutput = @{
     hookEventName = 'PreToolUse'
     permissionDecision = 'ask'
     permissionDecisionReason = $raison } } | ConvertTo-Json -Depth 5 -Compress

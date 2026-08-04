# Hook UserPromptSubmit - declenche la rotation quand la session devient lourde.
#
# Pourquoi : la regle de rotation existait dans le socle, mais rien ne la
# declenchait. Une session pouvait grossir sans que personne ne s'en apercoive
# (cas observe : ~180 000 tokens en 30 minutes).
#
# Ce hook ne surveille rien en continu : il regarde UNE taille de fichier,
# une fois par message. Cout negligeable.
#
# Seuil calibre le 2026-08-04 sur les vraies sessions de ce poste : les
# sessions normales font 1 a 3 Mo, celles qui ont derive 6 a 9 Mo.

$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$SEUIL_MO = 5

try { $entree = [Console]::In.ReadToEnd() | ConvertFrom-Json } catch { exit 0 }
$t = $entree.transcript_path
if (-not $t -or -not (Test-Path $t)) { exit 0 }

$mo = [math]::Round((Get-Item $t).Length / 1MB, 1)
if ($mo -lt $SEUIL_MO) { exit 0 }

$ctx = @"
=== SEUIL DE ROTATION ATTEINT ($mo Mo de session, seuil $SEUIL_MO Mo) ===

Cette session est lourde. Applique la procedure de rotation du socle :

1. Ne commence AUCUNE nouvelle sous-tache.
2. Termine uniquement l'operation atomique deja engagee.
3. Mets a jour ETAT.md : ce qui est fait et VERIFIE, ce qui est suppose,
   ce qui est casse, et le point de reprise exact.
4. Consigne l'etat Git : branche, fichiers modifies, commits non pousses.
5. Dis-le a l'utilisateur et arrete la mission.

Ne transforme pas cette rotation en nouveau chantier de documentation :
ETAT.md se met a jour, il ne se reecrit pas.
"@

@{ hookSpecificOutput = @{ hookEventName = 'UserPromptSubmit'; additionalContext = $ctx } } |
  ConvertTo-Json -Depth 5 -Compress

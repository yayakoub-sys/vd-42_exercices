# Applique a tous les modules natifs via -DCMAKE_PROJECT_INCLUDE (voir build.gradle).
#
# Probleme corrige ici :
# Le chemin de ce poste contient un espace (C:\Users\VAYA DIOMANDE\...). CMake
# contourne le probleme de guillemets en appelant le compilateur par son nom court
# 8.3, soit CLANG_~1.EXE au lieu de clang++.exe. Or le NDK ajoute toujours
# -no-canonical-prefixes, qui demande a clang de ne PAS resoudre son propre chemin.
# La combinaison des deux fait que clang ne retrouve plus son installation et retire
# -lc++ de l'edition de liens, sans le moindre avertissement. L'erreur qui en resulte
# n'a aucun rapport visible avec la cause :
#   ld.lld: error: undefined symbol: std::current_exception()
#   ld.lld: error: undefined symbol: std::exception_ptr::~exception_ptr()
#
# Verifie sur ce poste :
#   nom court seul                                  -> -lc++ present
#   nom court + -no-canonical-prefixes              -> -lc++ ABSENT
#   nom court + -no-canonical-prefixes + -canonical-prefixes -> -lc++ present
#
# Comme le drapeau est place apres, il annule -no-canonical-prefixes.
string(APPEND CMAKE_C_FLAGS " -canonical-prefixes")
string(APPEND CMAKE_CXX_FLAGS " -canonical-prefixes")

#!/usr/bin/env bash
# Ajusta o projeto iOS gerado pelo "npx cap add ios" (executado no macOS do GitHub Actions).
# - Permissão de Rede Local (obrigatória para falar com a TV)
# - Liberação de conexões sem TLS válido (TV usa ws://3000 e wss://3001 com certificado autoassinado)
# - Somente retrato
# - Ícone do app a partir de public/pwa-512x512.png
set -euo pipefail

PLIST="ios/App/App/Info.plist"
BUDDY="/usr/libexec/PlistBuddy"

# Remove a chave se existir e grava o novo valor
set_key() {
  local key="$1" type="$2" value="$3"
  "$BUDDY" -c "Delete :$key" "$PLIST" 2>/dev/null || true
  "$BUDDY" -c "Add :$key $type $value" "$PLIST"
}

# Texto exibido no pedido de permissão de Rede Local do iOS
set_key NSLocalNetworkUsageDescription string "O app precisa acessar a rede local para encontrar e controlar sua TV LG pelo Wi-Fi."

# ATS: libera ws:// e o certificado autoassinado da TV (NSAllowsArbitraryLoads sozinho;
# com NSAllowsLocalNetworking junto o iOS passaria a ignorar o ArbitraryLoads)
"$BUDDY" -c "Delete :NSAppTransportSecurity" "$PLIST" 2>/dev/null || true
"$BUDDY" -c "Add :NSAppTransportSecurity dict" "$PLIST"
"$BUDDY" -c "Add :NSAppTransportSecurity:NSAllowsArbitraryLoads bool true" "$PLIST"

# Apenas retrato no iPhone
"$BUDDY" -c "Delete :UISupportedInterfaceOrientations" "$PLIST" 2>/dev/null || true
"$BUDDY" -c "Add :UISupportedInterfaceOrientations array" "$PLIST"
"$BUDDY" -c "Add :UISupportedInterfaceOrientations:0 string UIInterfaceOrientationPortrait" "$PLIST"

# Status bar clara sobre o fundo escuro
set_key UIStatusBarStyle string UIStatusBarStyleLightContent

# Ícone 1024x1024 (o template do Capacitor usa um único arquivo AppIcon-512@2x.png)
ICON_SRC="public/pwa-512x512.png"
ICON_DST="ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
if [ -f "$ICON_SRC" ] && [ -f "$ICON_DST" ]; then
  sips -s format png -z 1024 1024 "$ICON_SRC" --out "$ICON_DST" >/dev/null
fi

echo "Info.plist configurado:"
"$BUDDY" -c "Print" "$PLIST"

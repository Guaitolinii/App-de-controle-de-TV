# 📱 GUIA DE COMPILAÇÃO E ARQUITETURA TÉCNICA: APK (ANDROID) & IPA (IOS)

Este aplicativo foi construído com comunicação direta via protocolo **SSAP (Simple Service Access Protocol)** sobre WebSocket com Smart TVs LG webOS, empacotável para **Android (.apk)** e **iOS (.ipa)** com Capacitor.

---

## ⚡ 1. Testar Imediatamente no Celular (PWA / WebAPK / Standalone)

1. No computador, abra o app e clique no botão superior **"Testar no Celular (APK/IPA)"**.
2. Aponte a câmera do seu smartphone (iPhone ou Android) para o **QR Code**.
3. **No iPhone (iOS):**
   - No Safari, toque no ícone **Compartilhar** (quadrado com seta para cima).
   - Selecione **"Adicionar à Tela de Início"**.
   - O app será instalado com o ícone LG Remote, abrindo em **tela cheia nativa sem barra do Safari** (comportamento 100% idêntico a um IPA).
4. **No Android:**
   - No Chrome, toque nos 3 pontinhos (⋮) e selecione **"Instalar aplicativo"**.
   - O Android criará o pacote **WebAPK** nativo no launcher do sistema!

---

## 🔒 2. Plugin nativo `LgTvBridge` (certificado da porta 3001, busca e Wake-on-LAN)

- **O problema:** as TVs LG modernas usam `wss://IP:3001` com **certificado autoassinado**, que o WebView do iOS recusa. O WebView também não envia UDP (Wake-on-LAN) nem descobre o IP do Wi-Fi.
- **A solução:** plugin Capacitor local em `plugins/lg-tv-bridge` (instalado via `file:` no `package.json`):
  - `ios/Sources/LgTvBridgePlugin/LgTvBridgePlugin.swift`: WebSocket nativo (`URLSessionWebSocketTask`) que aceita o certificado **somente de IPs da rede local**, sondagem TCP das portas 3001/3000, envio UDP e leitura do IP/máscara do Wi-Fi.
  - `src/services/tvSocket.ts` usa o plugin no app iOS e o `WebSocket` do navegador no desenvolvimento.
  - A conexão tenta `wss://IP:3001` e, se falhar, `ws://IP:3000` (TVs anteriores a 2022). A porta que funcionou fica salva.
- **Busca de TVs:** o app lê a faixa do Wi-Fi do celular e testa os 254 endereços por TCP (sem multicast, então funciona no iOS sem entitlement). Na primeira vez o iOS pede permissão de **Rede Local**.

---

## 🎮 3. Socket de Botões Físicos (`getPointerInputSocket`)

O protocolo principal da TV (SSAP REST-like) não possui endpoints normais para botões de hardware como setas, OK, Voltar, Home, Números nem Botões Coloridos.
- O `src/services/tvConnection.ts` solicita um segundo canal de conexão chamando `ssap://com.webos.service.networkinput/getPointerInputSocket`.
- A TV devolve um `socketPath` exclusivo.
- Os comandos de navegação são transmitidos no formato:
  - Setas: `type:button\nname:UP\n\n`, `type:button\nname:DOWN\n\n`, etc.
  - Confirmação: `type:button\nname:ENTER\n\n`
  - Retorno: `type:button\nname:BACK\n\n`
  - Home: `type:button\nname:HOME\n\n`
  - Cores: `type:button\nname:RED\n\n`, `name:GREEN`, etc.
  - Números: `type:button\nname:0\n\n` até `name:9`
  - Touchpad / Mouse: `type:move\ndx:X\ndy:Y\ndown:0\n\n`, `type:click\n\n` e `type:scroll\ndx:0\ndy:Y\n\n`.

---

## ⚡ 4. Ligar a TV Desligada (Wake-on-LAN) e Limitações no iOS

- O pacote de **102 bytes** (6 bytes de `0xFF` + 16 repetições do MAC address da TV) é montado rigorosamente conforme o padrão IEEE 802.3 em `src/services/wol.ts`.
- **Limitação no iOS:** Enviar pacotes UDP em broadcast (`255.255.255.255`) no iOS exige o direito `com.apple.developer.networking.multicast`. A Apple só concede essa permissão para contas de desenvolvedor pagas (US$ 99/ano) mediante aprovação de formulário.
  - Com Apple ID gratuito / Sideloadly / AltStore: controle de volume, navegação, apps, inputs, mudo e desligar funcionam perfeitamente. Ligar a TV pode exigir ligar o aparelho manualmente ou usar controle físico.
- **No Android:** Essa restrição não existe. O pacote UDP Broadcast é emitido livremente na sub-rede.
- **Busca Automática (SSDP):** Esbarra na mesma limitação de multicast do iOS. Por isso, a inserção manual do IP local é o método 100% confiável e profissional.

---

## 🤖 5. Como Gerar o APK (.apk) para Android

\`\`\`bash
# 1. Compilar a aplicação React
npm run build

# 2. Criar a pasta nativa Android
npx cap add android

# 3. Sincronizar o projeto
npx cap sync android

# 4. Compilar o APK via linha de comando:
cd android
./gradlew assembleDebug
\`\`\`

> 📍 O arquivo gerado estará em:
> **`android/app/build/outputs/apk/debug/app-debug.apk`**
>
> Envie para seu celular via cabo USB, Google Drive ou WhatsApp para instalar diretamente no Android!

---

## 🍎 6. Como gerar o IPA (.ipa) para iPhone sem ter Mac

O workflow `.github/workflows/ios.yml` roda num Mac do GitHub a cada push na `main` (ou manualmente em **Actions → Build iOS (IPA) → Run workflow**):

1. `npm ci` e `npm run build`
2. `npx cap add ios` (gera o projeto Xcode; a pasta `ios/` não fica no repositório)
3. `scripts/ios-configure.sh` (permissão de Rede Local, ATS liberado para a TV, retrato, ícone)
4. `xcodebuild` sem assinatura e empacotamento em `LG-Smart-Remote.ipa`
5. Publica o IPA em **Releases** (link fixo da última versão):
   `https://github.com/Guaitolinii/App-de-controle-de-TV/releases/latest/download/LG-Smart-Remote.ipa`

### Instalar no iPhone com o Sideloadly (Windows ou Mac)
1. Baixe o `LG-Smart-Remote.ipa` pelo link acima.
2. Conecte o iPhone no computador, abra o **Sideloadly** e arraste o IPA.
3. Informe seu Apple ID e clique em **Start**.
4. No iPhone: **Ajustes → Geral → VPN e Gerenciamento de Dispositivo** → confie no seu Apple ID. No iOS 16+ ative também **Ajustes → Privacidade e Segurança → Modo de Desenvolvedor**.
5. Ao abrir o app, aceite o pedido de acesso à **Rede Local**.

> Com Apple ID gratuito o app expira em 7 dias (reinstale pelo Sideloadly; o pareamento com a TV continua salvo) e vale o limite de 3 apps instalados assim.

### Na TV (uma vez)
- **Configurações → Geral → Dispositivos → Configurações de dispositivo externo** (o caminho varia por ano): ative **LG Connect Apps** e **Ligar via Wi-Fi**.
- Ative o **Quick Start+** para a TV aceitar o comando de ligar em standby.
- O app aprende o MAC da TV na primeira conexão (com a TV ligada). Depois disso o botão Power tenta ligá-la pela rede.

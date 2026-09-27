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

## 🔒 2. Certificado da Porta 3001 (webOS 2022+ / TV Nova) e iOS

- **O Problema:** As TVs LG modernas utilizam WebSocket Seguro na porta 3001 (`wss://IP:3001`) com um **certificado SSL autoassinado**. O WebKit do iOS/Safari recusa certificados autoassinados por padrão.
- **A Solução:** O projeto já inclui o plugin nativo em Swift:
  - Localização: `ios/App/App/LGWebsocketPlugin.swift`
  - Ele implementa `URLSessionWebSocketDelegate` e valida o desafio de autenticação (`URLAuthenticationChallenge`) aceitando o certificado da TV local (`.useCredential, URLCredential(trust: serverTrust)`).
  - Em TVs anteriores a 2022 ou quando a porta 3001 não estiver ativa, o app possui fallback automático para a porta 3000 (`ws://IP:3000`).

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

## 🍎 6. Como Gerar o IPA (.ipa) para iPhone (iOS)

\`\`\`bash
# 1. Compilar os arquivos do app
npm run build

# 2. Adicionar o projeto iOS
npx cap add ios
npx cap sync ios

# 3. Abrir no Xcode:
npx cap open ios
\`\`\`

### No Xcode:
1. Conecte seu iPhone via cabo ao Mac.
2. Na aba **Signing & Capabilities**, selecione seu Apple ID gratuito.
3. No arquivo `Info.plist`, a permissão `NSLocalNetworkUsageDescription` e `NSAllowsLocalNetworking` já estão preenchidas.
4. Clique em **Run (▶)** para instalar e testar diretamente no seu iPhone!
5. Para exportar o arquivo `.ipa`:
   - Selecione **Any iOS Device (arm64)** no topo.
   - Vá no menu **Product > Archive**.
   - Na janela Organizer, clique em **Distribute App** > **Development / Ad Hoc** > **Export** para salvar o binário `.ipa`.

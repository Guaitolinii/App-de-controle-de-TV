# 📱 GUIA DE COMPILAÇÃO E INSTALAÇÃO: APK (ANDROID) & IPA (IOS)

Este aplicativo foi projetado e construído para funcionar tanto como **App Nativo Android (.apk)**, quanto **App Nativo iOS (.ipa)** e **PWA Instalável de Alta Performance**.

---

## ⚡ Método 1: Testar Imediatamente no Celular (Sem Compilar)

1. No computador, abra o app e clique no botão superior **"Testar no Celular (APK/IPA)"**.
2. Aponte a câmera do seu smartphone (iPhone ou Android) para o **QR Code**.
3. **No iPhone (iOS):**
   - O Safari abrirá o app.
   - Toque no ícone **Compartilhar** (quadrado com seta para cima).
   - Role e selecione **"Adicionar à Tela de Início"**.
   - O app será instalado com o ícone LG Remote, abrindo em **tela cheia nativa sem barra do Safari** (comportamento 100% idêntico a um IPA).
4. **No Android:**
   - O Chrome abrirá o app.
   - Toque no banner inferior ou nos 3 pontinhos (⋮) e selecione **"Instalar aplicativo"**.
   - O Android criará o pacote **WebAPK** nativo no seu launcher!

---

## 🤖 Método 2: Gerar o Arquivo .APK para Android (Capacitor)

O arquivo `capacitor.config.json` já está criado e configurado neste projeto.

### Passo a passo no seu terminal:

\`\`\`bash
# 1. Instalar as dependências do Capacitor para Android
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Gerar o build otimizado
npm run build

# 3. Criar a pasta do projeto nativo Android
npx cap add android

# 4. Sincronizar o código
npx cap sync android

# 5. Compilar o APK de depuração (Debug APK):
cd android
./gradlew assembleDebug
\`\`\`

> 📍 O arquivo gerado estará em:
> **`android/app/build/outputs/apk/debug/app-debug.apk`**
>
> Você pode transferir este arquivo `.apk` diretamente para seu celular via cabo USB, Google Drive ou WhatsApp e clicar nele para instalar no Android!

---

## 🍎 Método 3: Gerar o Arquivo .IPA para iPhone (iOS)

### Requisitos:
- Um Mac com o **Xcode** instalado (gratuito na Mac App Store).

### Passo a passo:

\`\`\`bash
# 1. Instalar o pacote iOS do Capacitor
npm install @capacitor/ios

# 2. Gerar o build
npm run build

# 3. Adicionar o projeto nativo iOS
npx cap add ios
npx cap sync ios

# 4. Abrir o projeto no Xcode:
npx cap open ios
\`\`\`

### No Xcode:
1. Conecte seu iPhone ao Mac via cabo.
2. Na aba **Signing & Capabilities**, em *Team*, selecione sua conta gratuita do Apple ID.
3. No topo, selecione seu iPhone físico como dispositivo de destino.
4. Clique no botão **Play (▶ / Run)**: o app será compilado e instalado no seu iPhone imediatamente!
5. Para exportar o arquivo `.ipa`:
   - Vá no menu **Product > Archive**.
   - Na janela Organizer, clique em **Distribute App** > **Ad Hoc** ou **Development** > **Export** para salvar o arquivo `.ipa`.

---

## 🛠️ Tecnologias Utilizadas
- **React 19 + TypeScript + Tailwind CSS**
- **Vite PWA (Service Worker + Manifest com ícones 192px/512px)**
- **Capacitor 6 / 7 Bridge Ready**
- **Web Audio API + Haptics API (Tactile Feedback)**
- **SSAP Protocol over WebSocket (Port 3001) & Wake-on-LAN (UDP 9)**

import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  Share2, 
  Check, 
  Copy, 
  Apple, 
  Terminal, 
  ExternalLink, 
  FileCode, 
  QrCode, 
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';
import { QRCodeGenerator } from '../common/QRCodeGenerator';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { feedback } from '../../services/feedback';

interface MobileExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileExportModal: React.FC<MobileExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'apk' | 'ipa'>('qr');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const { isInstallable, isInstalled, install, isIOS, isAndroid } = usePWAInstall();

  if (!isOpen) return null;

  const currentAppUrl = typeof window !== 'undefined' ? window.location.href : 'https://meu-app.com';

  const handleCopyLink = () => {
    feedback.playClick('standard');
    navigator.clipboard.writeText(currentAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCommand = (cmd: string) => {
    feedback.playClick('standard');
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  // Generate downloadable Capacitor & Android / iOS setup instructions script
  const handleDownloadBuildKit = () => {
    feedback.playClick('standard');
    const content = `# 📱 GUIA DEFINITIVO: GERAR APK & IPA — LG SMART REMOTE

## 1. Gerar o APK (.apk) para Android
Execute no terminal da pasta do projeto:
\`\`\`bash
# 1. Instalar dependências mobile do Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Gerar a build do React
npm run build

# 3. Adicionar o projeto Android
npx cap add android

# 4. Sincronizar os arquivos
npx cap sync

# 5. Abrir no Android Studio ou compilar direto:
npx cap open android
# OU gere o APK direto via linha de comando:
cd android && ./gradlew assembleDebug
\`\`\`
O arquivo **app-debug.apk** estará pronto em:
\`android/app/build/outputs/apk/debug/app-debug.apk\`
Você pode enviar esse arquivo para o celular por WhatsApp, Drive ou cabo USB e instalar com 1 toque!

---

## 2. Gerar o IPA (.ipa) para iPhone (iOS)
\`\`\`bash
# 1. Instalar dependências iOS
npm install @capacitor/ios

# 2. Gerar a build
npm run build

# 3. Adicionar plataforma iOS
npx cap add ios
npx cap sync

# 4. Abrir no Xcode:
npx cap open ios
\`\`\`
No Xcode:
1. Conecte seu iPhone via cabo Lightning / USB-C.
2. Em **Signing & Capabilities**, selecione seu Apple ID gratuito.
3. Clique em **Run ▶** para instalar direto no seu iPhone!
4. Para exportar o arquivo \`.ipa\`: vá em **Product > Archive > Distribute App > Development / Ad Hoc**.

---

## 3. Teste Imediato sem compilar (PWA / WebAPK):
Acesse a URL do app no Safari do iPhone e clique em "Adicionar à Tela de Início" ou no Chrome do Android e clique em "Instalar App". O app roda 100% nativo em tela cheia!
`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GUIA_GERAR_APK_E_IPA.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Instalar & Testar no Celular (APK / IPA)</h3>
              <p className="text-[11px] text-neutral-400">
                Execute no seu iPhone (iOS) ou Android em tela cheia como app nativo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950/80 rounded-2xl border border-white/5">
          <button
            onClick={() => {
              feedback.playClick('standard');
              setActiveTab('qr');
            }}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'qr'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>1. Teste no Celular</span>
          </button>

          <button
            onClick={() => {
              feedback.playClick('standard');
              setActiveTab('apk');
            }}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'apk'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Gerar APK (Android)</span>
          </button>

          <button
            onClick={() => {
              feedback.playClick('standard');
              setActiveTab('ipa');
            }}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ipa'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Apple className="w-3.5 h-3.5 text-blue-300" />
            <span>3. Gerar IPA (iOS)</span>
          </button>
        </div>

        {/* TAB 1: QR CODE & TESTE IMEDIATO NO CELULAR */}
        {activeTab === 'qr' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-neutral-950 border border-white/5 flex flex-col sm:flex-row items-center gap-4">
              <QRCodeGenerator url={currentAppUrl} size={150} />

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-red-400">
                  <Zap className="w-4 h-4" />
                  <span>Abra a Câmera do seu Celular</span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Aponte para o QR Code para abrir o controle no seu celular
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Ao abrir no navegador do celular, você pode instalar instantaneamente como aplicativo autônomo com ícone na tela inicial.
                </p>

                <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white border border-white/5 active:scale-95 transition-all"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
                  </button>

                  {isInstallable && (
                    <button
                      onClick={install}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-md active:scale-95 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Instalar Agora no Aparelho</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Platform Guides */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Android Instructions */}
              <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                  <span>Como instalar no Android:</span>
                </div>
                <ol className="list-decimal list-inside text-xs text-neutral-300 space-y-1 pl-1">
                  <li>Abra o link no <strong>Google Chrome</strong>.</li>
                  <li>Toque nos <strong>3 pontinhos (⋮)</strong> no topo.</li>
                  <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                  <li>O Android gera o <strong>WebAPK nativo</strong> com ícone!</li>
                </ol>
              </div>

              {/* iPhone iOS Instructions */}
              <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                  <Apple className="w-4 h-4" />
                  <span>Como instalar no iPhone (iOS):</span>
                </div>
                <ol className="list-decimal list-inside text-xs text-neutral-300 space-y-1 pl-1">
                  <li>Abra o link no navegador <strong>Safari</strong>.</li>
                  <li>Toque no botão <strong>Compartilhar (quadrado com seta)</strong>.</li>
                  <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
                  <li>Abra pelo ícone: roda 100% nativo em tela cheia!</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GERAR O APK (ANDROID) */}
        {activeTab === 'apk' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Gerar Arquivo .APK Nativo para Android</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Este projeto já inclui a configuração oficial do <strong>Capacitor</strong> (<code className="font-mono text-emerald-300">capacitor.config.json</code>). Você pode compilar o binário <code className="font-mono text-white">app-debug.apk</code> em menos de 2 minutos.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-300 font-mono">Comandos no Terminal:</span>
                <button
                  onClick={() => handleCopyCommand('npm run build && npx cap add android && npx cap open android')}
                  className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-800 px-2 py-0.5 rounded"
                >
                  {copiedCommand ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCommand ? 'Copiado!' : 'Copiar Tudo'}</span>
                </button>
              </div>

              <div className="bg-black/90 p-3 rounded-xl border border-white/5 font-mono text-xs text-emerald-300 overflow-x-auto space-y-1">
                <p><span className="text-neutral-500"># 1. Compilar o app</span></p>
                <p className="text-white">npm run build</p>
                <p><span className="text-neutral-500"># 2. Adicionar suporte Android (cria pasta /android)</span></p>
                <p className="text-white">npx cap add android</p>
                <p><span className="text-neutral-500"># 3. Compilar o APK no Android Studio ou via Gradle:</span></p>
                <p className="text-white">cd android && ./gradlew assembleDebug</p>
              </div>

              <p className="text-[11px] text-neutral-400">
                O arquivo <strong className="text-white font-mono">app-debug.apk</strong> será gerado em <code className="font-mono text-emerald-400">android/app/build/outputs/apk/debug/</code> pronto para instalar em qualquer celular Android.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: GERAR O IPA (iOS) */}
        {activeTab === 'ipa' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                <Apple className="w-4 h-4 text-blue-400" />
                <span>Gerar Arquivo .IPA para iPhone & iPad</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Para o ecossistema Apple, os arquivos de app possuem extensão <strong>.ipa</strong>. Você pode instalar no iPhone através do Xcode ou usando ferramentas como <strong>Sideloadly / AltStore</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-300 font-mono">Comandos no Terminal:</span>
                <button
                  onClick={() => handleCopyCommand('npm run build && npx cap add ios && npx cap open ios')}
                  className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-800 px-2 py-0.5 rounded"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </button>
              </div>

              <div className="bg-black/90 p-3 rounded-xl border border-white/5 font-mono text-xs text-blue-300 overflow-x-auto space-y-1">
                <p><span className="text-neutral-500"># 1. Gerar os arquivos estáticos</span></p>
                <p className="text-white">npm run build</p>
                <p><span className="text-neutral-500"># 2. Adicionar o projeto nativo do iOS</span></p>
                <p className="text-white">npx cap add ios</p>
                <p><span className="text-neutral-500"># 3. Abrir no Xcode para rodar no iPhone ou exportar .ipa</span></p>
                <p className="text-white">npx cap open ios</p>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-900 border border-white/5 text-[11px] text-neutral-300 space-y-1">
                <p className="font-bold text-white">Como assinar gratuitamente sem conta paga da Apple:</p>
                <p>1. No Xcode, em <strong>Signing & Capabilities</strong>, faça login com seu Apple ID pessoal comum.</p>
                <p>2. Conecte seu iPhone via cabo e clique no botão <strong>Play (▶)</strong> do Xcode.</p>
                <p>3. O app é instalado diretamente no iPhone com suporte total a Wi-Fi local e hápticos!</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
          <button
            onClick={handleDownloadBuildKit}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white border border-white/5 transition-all shadow active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Guia de Compilação APK / IPA</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-all shadow-md active:scale-95"
          >
            Entendido, Voltar ao Controle
          </button>
        </div>
      </div>
    </div>
  );
};

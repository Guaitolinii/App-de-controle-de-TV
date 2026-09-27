import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Wifi, Smartphone, Tv, ShieldCheck, HelpCircle, ChevronRight } from 'lucide-react';
import { feedback } from '../../services/feedback';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeStep, setActiveStep] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold text-white">Como Configurar sua TV LG webOS</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Navigation Pills */}
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-neutral-950/80 border border-white/5">
          {[
            { num: 1, label: 'LG Connect' },
            { num: 2, label: 'Ligar Wi-Fi' },
            { num: 3, label: 'Mesma Rede' },
            { num: 4, label: 'Pareamento' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => {
                feedback.playClick('standard');
                setActiveStep(s.num);
              }}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition-all text-center ${
                activeStep === s.num
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {s.num}. {s.label}
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-4 rounded-xl bg-neutral-950 border border-white/5 min-h-[220px] flex flex-col justify-between">
          {activeStep === 1 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <ShieldCheck className="w-5 h-5 text-red-500" />
                <span>Passo 1: Habilitar "LG Connect Apps"</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Para que a TV aceite comandos pelo protocolo SSAP/WebSocket, o recurso de conexão externa deve estar ativo:
              </p>
              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1 font-mono text-xs text-neutral-300">
                <p>1. Pressione <span className="text-red-400 font-bold">⚙️ Configurações</span> no controle físico</p>
                <p>2. Vá em <span className="text-white font-bold">Todas as Configurações → Geral → Dispositivos</span></p>
                <p>3. Selecione <span className="text-white font-bold">Gerenciamento de TV Externa</span></p>
                <p>4. Ative a opção <span className="text-emerald-400 font-bold">"LG Connect Apps"</span></p>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Tv className="w-5 h-5 text-amber-400" />
                <span>Passo 2: Habilitar "Ligar TV via Wi-Fi" (Wake-on-LAN)</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Permite que este aplicativo ligue a TV mesmo quando ela estiver completamente em Standby (desligada):
              </p>
              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1 font-mono text-xs text-neutral-300">
                <p>1. Acesse <span className="text-white font-bold">Configurações → Geral → Dispositivos</span></p>
                <p>2. Clique em <span className="text-white font-bold">Ligar TV pelo Celular (Mobile TV On)</span></p>
                <p>3. Ative <span className="text-emerald-400 font-bold">"Ligar via Wi-Fi" (Turn on via Wi-Fi)</span></p>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Sem isso, o Wake-on-LAN não acordará a placa de rede da TV quando em repouso.</span>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Wifi className="w-5 h-5 text-emerald-400" />
                <span>Passo 3: Conectar à Mesma Rede Wi-Fi</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Seu smartphone (ou navegador) e a TV LG devem estar conectados ao mesmo roteador local:
              </p>
              <ul className="list-disc list-inside text-xs text-neutral-300 space-y-1 pl-1">
                <li>Funciona tanto em redes 2.4 GHz quanto 5 GHz.</li>
                <li>Verifique se o seu roteador não está com <span className="text-white font-semibold">"Isolamento de Ponto de Acesso (AP Isolation)"</span> ativado.</li>
                <li>Recomendamos fixar o endereço IP da TV nas configurações do seu roteador (DHCP Estático).</li>
              </ul>
            </div>
          )}

          {activeStep === 4 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <span>Passo 4: Aceitar o Pareamento Único</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Na primeira vez que você conectar o app à sua TV real, aparecerá uma notificação na tela da TV:
              </p>
              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-center space-y-1">
                <p className="text-xs text-white font-bold">
                  "O aplicativo 'LG Smart Remote' deseja se conectar a esta TV"
                </p>
                <p className="text-xs text-emerald-400 font-bold">
                  Pressione [SIM / ACEITAR] no controle remoto da TV
                </p>
              </div>
              <p className="text-xs text-neutral-400">
                Uma chave única (<span className="font-mono text-white">client-key</span>) é armazenada de forma segura e as conexões futuras serão 100% instantâneas!
              </p>
            </div>
          )}

          {/* Step Footer Navigation */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5">
            <button
              onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
              disabled={activeStep === 1}
              className="text-xs text-neutral-400 hover:text-white disabled:opacity-30 px-3 py-1 rounded bg-neutral-900"
            >
              Anterior
            </button>
            <span className="text-xs text-neutral-500 font-mono">
              {activeStep} de 4
            </span>
            {activeStep < 4 ? (
              <button
                onClick={() => setActiveStep((prev) => Math.min(4, prev + 1))}
                className="flex items-center gap-1 text-xs font-bold text-white bg-red-600 hover:bg-red-500 px-3 py-1 rounded shadow"
              >
                Próximo <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-1 rounded shadow"
              >
                Entendi, Pronto!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

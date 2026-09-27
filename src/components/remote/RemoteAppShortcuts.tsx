import React from 'react';
import { POPULAR_APPS } from '../../services/ssap';
import { feedback } from '../../services/feedback';

interface RemoteAppShortcutsProps {
  onLaunchApp: (appId: string, appName: string) => void;
  activeAppId: string | null;
}

export const RemoteAppShortcuts: React.FC<RemoteAppShortcutsProps> = ({
  onLaunchApp,
  activeAppId,
}) => {
  const handleLaunch = (appId: string, appName: string) => {
    feedback.playClick('app');
    onLaunchApp(appId, appName);
  };

  return (
    <div className="w-full px-5 py-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
          Atalhos Rápidos de Streaming
        </span>
        <span className="text-[9px] text-neutral-500 font-medium">Lançamento Direto</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {POPULAR_APPS.slice(0, 8).map((app) => {
          const isActive = activeAppId === app.appId;
          return (
            <button
              key={app.id}
              onClick={() => handleLaunch(app.appId, app.name)}
              className={`relative group flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 active:scale-95 border ${
                isActive
                  ? 'border-white ring-2 ring-white/20 shadow-lg'
                  : 'border-white/5 hover:border-white/20 shadow-md'
              }`}
              style={{
                backgroundColor: app.color,
                color: app.textColor,
              }}
              title={`Abrir ${app.name} na TV`}
            >
              {app.badge && (
                <span className="absolute -top-1.5 -right-1 text-[8px] bg-black/80 px-1 py-0.2 rounded font-mono text-white/90 border border-white/10">
                  {app.badge}
                </span>
              )}
              <span className="text-[11px] font-black tracking-tight leading-tight text-center">
                {app.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';

// Lightweight QR Code Matrix renderer using standard Google Chart API or SVG fallback
interface QRCodeGeneratorProps {
  url: string;
  size?: number;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ url, size = 180 }) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    url
  )}&bgcolor=111118&color=ffffff&margin=1`;

  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-950 border border-white/10 shadow-inner">
      <img
        src={qrUrl}
        alt={`QR Code para ${url}`}
        width={size}
        height={size}
        className="rounded-xl shadow-lg"
        loading="lazy"
      />
      <span className="text-[10px] text-neutral-400 font-mono mt-2 text-center max-w-[200px] truncate">
        {url}
      </span>
    </div>
  );
};

import React from 'react';
import { Sprout } from 'lucide-react';

export default function BrandLogo({ size = 'medium', theme = 'light' }) {
  const isLarge = size === 'large' || size === 'xl';

  return (
    <div className="inline-flex items-center space-x-3 select-none">
      {/* Icon Emblem */}
      <div className={`rounded-2xl bg-forest p-2.5 shadow-md flex items-center justify-center border border-gold/40 shrink-0 ${isLarge ? 'w-11 h-11' : 'w-9 h-9'}`}>
        <Sprout className={`text-gold ${isLarge ? 'w-6 h-6' : 'w-5 h-5'}`} />
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div className="flex items-center leading-none">
          <span className={`font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-forest'} ${isLarge ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>
            Udyam
          </span>
          <span className={`font-black tracking-tight text-gold ${isLarge ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>
            Saarthi
          </span>
        </div>
        <span className={`text-[10px] font-extrabold tracking-[0.18em] uppercase mt-1 ${theme === 'dark' ? 'text-emerald-100/90' : 'text-muted-slate'}`}>
          YOUR BUSINESS COMPANION
        </span>
      </div>
    </div>
  );
}

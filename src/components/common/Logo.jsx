import React from 'react';
import logoImg from '../../assets/logo.jpg';
import { useTheme } from '../../context/ThemeContext';

export default function Logo({ size = "md" }) {
  const { darkMode } = useTheme();
  const isSmall = size === "sm";

  return (
    <div className="flex items-center justify-center select-none cursor-pointer group py-1">
      {/* Official logo image enlarged so the slogan text is 100% clear & readable */}
      <img 
        src={logoImg} 
        alt="MBEUND MI — Bul Xaar, Waajal Ko." 
        className={`object-contain transition-all group-hover:scale-[1.02] ${
          isSmall 
            ? 'h-14 sm:h-16 md:h-20 max-w-[240px] sm:max-w-[300px]' 
            : 'h-20 sm:h-24 md:h-28 max-w-[360px]'
        } ${
          darkMode 
            ? 'filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.9)] bg-white/95 p-1.5 rounded-2xl' 
            : 'mix-blend-multiply'
        }`} 
      />
    </div>
  );
}

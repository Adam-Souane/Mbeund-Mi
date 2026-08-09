import React from 'react';
import logoImg from '../../assets/logo.jpg';
import { useTheme } from '../../context/ThemeContext';

export default function Logo({ size = "md" }) {
  const { darkMode } = useTheme();
  const isSmall = size === "sm";

  return (
    <div className="flex flex-col items-center justify-center select-none cursor-pointer group py-1">
      {/* Official logo image greatly enlarged */}
      <img 
        src={logoImg} 
        alt="MBEUND MI" 
        className={`object-contain transition-all group-hover:scale-[1.02] ${
          isSmall 
            ? 'h-16 sm:h-20 md:h-24 max-w-[280px] sm:max-w-[360px]' 
            : 'h-24 sm:h-28 md:h-32 max-w-[440px]'
        } ${
          darkMode 
            ? 'filter drop-shadow-[0_2px_12px_rgba(255,255,255,0.95)] bg-white/95 p-2 rounded-2xl' 
            : 'mix-blend-multiply'
        }`} 
      />

      {/* Large high-contrast explicit text slogan for ultimate legibility */}
      <div className="flex items-center space-x-2 mt-2 font-extrabold tracking-widest uppercase">
        <span className={`h-1 rounded-full ${isSmall ? 'w-4' : 'w-6'} ${darkMode ? 'bg-brand-sky' : 'bg-brand-navy'}`}></span>
        <span className={`text-xs sm:text-sm md:text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          BUL XAAR, WAAJAL KO.
        </span>
        <span className={`h-1 bg-brand-red rounded-full ${isSmall ? 'w-4' : 'w-6'}`}></span>
      </div>
    </div>
  );
}

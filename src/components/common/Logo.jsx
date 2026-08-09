import React from 'react';
import logoImg from '../../assets/logo.jpg';
import { useTheme } from '../../context/ThemeContext';

export default function Logo({ size = "md", showSlogan = true }) {
  const { darkMode } = useTheme();
  const isSmall = size === "sm";

  return (
    <div className="flex flex-col items-center justify-center select-none cursor-pointer group py-1">
      
      {/* Clean logo image (smaller slogan inside image removed) */}
      <img 
        src={logoImg} 
        alt="MBEUND MI" 
        className={`object-contain transition-all group-hover:scale-[1.02] ${
          isSmall 
            ? 'h-10 sm:h-12 md:h-14 max-w-[200px] sm:max-w-[240px]' 
            : 'h-16 sm:h-20 md:h-24 max-w-[320px]'
        } ${
          darkMode 
            ? 'filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.9)] bg-white/95 p-1 rounded-2xl' 
            : 'mix-blend-multiply'
        }`} 
      />

      {/* SINGLE LARGE HIGH-CONTRAST SLOGAN */}
      {showSlogan && (
        <div className="flex items-center space-x-2 mt-1.5 font-extrabold tracking-widest uppercase">
          <span className={`h-1 rounded-full ${isSmall ? 'w-4' : 'w-6'} ${darkMode ? 'bg-brand-sky' : 'bg-brand-navy'}`}></span>
          <span className={`text-xs sm:text-sm md:text-base font-extrabold tracking-widest ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            BUL XAAR, WAAJAL KO.
          </span>
          <span className={`h-1 bg-brand-red rounded-full ${isSmall ? 'w-4' : 'w-6'}`}></span>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import logoImg from '../../assets/logo.jpg';
import { useTheme } from '../../context/ThemeContext';

export default function Logo({ size = "md", showSlogan = true }) {
  const { darkMode } = useTheme();
  const isSmall = size === "sm";

  return (
    <div className="flex flex-col items-start select-none cursor-pointer group">
      {/* Official logo image */}
      <img 
        src={logoImg} 
        alt="MBEUND MI" 
        className={`object-contain transition-all group-hover:scale-[1.02] ${
          isSmall 
            ? 'h-10 sm:h-12 md:h-14 max-w-[200px] sm:max-w-[240px]' 
            : 'h-16 sm:h-20 md:h-24 max-w-[300px]'
        } bg-white p-1 rounded-xl shadow-sm border border-slate-200/90`} 
      />

      {/* Explicit High-Visibility Slogan */}
      {showSlogan && (
        <div className="flex items-center space-x-1.5 mt-1.5 px-1">
          <span className={`h-0.5 rounded-full transition-all ${
            isSmall ? 'w-2.5' : 'w-4'
          } ${darkMode ? 'bg-brand-sky' : 'bg-brand-navy'}`}></span>
          
          <span className={`font-extrabold tracking-widest uppercase transition-colors ${
            isSmall ? 'text-[10px] sm:text-[11px]' : 'text-xs sm:text-sm'
          } ${darkMode ? 'text-slate-100 font-mono tracking-wider' : 'text-slate-900'}`}>
            BUL XAAR, WAAJAL KO.
          </span>

          <span className={`h-0.5 bg-brand-red rounded-full ${
            isSmall ? 'w-2.5' : 'w-4'
          }`}></span>
        </div>
      )}
    </div>
  );
}

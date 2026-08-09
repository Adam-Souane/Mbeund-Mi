import React from 'react';
import logoImg from '../../assets/logo.jpg';
import { useTheme } from '../../context/ThemeContext';

export default function Logo({ size = "md", showSlogan = true }) {
  const { darkMode } = useTheme();
  const isSmall = size === "sm";

  return (
    <div className="flex flex-col items-center justify-center select-none cursor-pointer group py-1">
      
      {/* Official logo image - directly rendered without white border/box */}
      <img 
        src={logoImg} 
        alt="MBEUND MI" 
        className={`object-contain transition-all group-hover:scale-[1.03] ${
          isSmall 
            ? 'h-10 sm:h-12 max-w-[180px] sm:max-w-[220px]' 
            : 'h-16 sm:h-20 max-w-[280px]'
        } ${
          darkMode 
            ? 'filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.9)] bg-white/90 p-1 rounded-xl' 
            : 'mix-blend-multiply'
        }`} 
      />

      {/* Slogan directly underneath logo */}
      {showSlogan && (
        <div className="flex items-center space-x-2 mt-1">
          <span className={`h-0.5 rounded-full ${
            isSmall ? 'w-3' : 'w-5'
          } ${darkMode ? 'bg-slate-300' : 'bg-brand-navy'}`}></span>
          
          <span className={`font-extrabold tracking-widest uppercase text-center ${
            isSmall ? 'text-[9px] sm:text-[10px]' : 'text-xs'
          } ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            BUL XAAR, WAAJAL KO.
          </span>

          <span className={`h-0.5 bg-brand-red rounded-full ${
            isSmall ? 'w-3' : 'w-5'
          }`}></span>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import logoImg from '../../assets/logo.jpg';
import { useTheme } from '../../context/ThemeContext';

export default function Logo({ size = "md" }) {
  const { darkMode } = useTheme();
  const isSmall = size === "sm";

  return (
    <div className="flex flex-col items-center justify-center select-none cursor-pointer group py-1">
      
      {/* Logo Image with bottom tiny writing cropped out */}
      <div className={`overflow-hidden flex items-center justify-center transition-all group-hover:scale-[1.02] ${
        isSmall 
          ? 'h-10 sm:h-12 md:h-14 max-w-[220px] sm:max-w-[260px]' 
          : 'h-16 sm:h-20 md:h-22 max-w-[320px]'
      } ${
        darkMode 
          ? 'filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.9)] bg-white/95 p-1 rounded-2xl' 
          : 'mix-blend-multiply'
      }`}>
        <img 
          src={logoImg} 
          alt="MBEUND MI" 
          className="w-full h-[135%] object-cover object-top max-w-none transform -translate-y-1" 
        />
      </div>

      {/* Large high-contrast crisp text slogan */}
      <div className="flex items-center space-x-2 mt-1.5 font-extrabold tracking-widest uppercase">
        <span className={`h-1 rounded-full ${isSmall ? 'w-3' : 'w-5'} ${darkMode ? 'bg-brand-sky' : 'bg-brand-navy'}`}></span>
        <span className={`text-xs sm:text-sm md:text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          BUL XAAR, WAAJAL KO.
        </span>
        <span className={`h-1 bg-brand-red rounded-full ${isSmall ? 'w-3' : 'w-5'}`}></span>
      </div>
    </div>
  );
}

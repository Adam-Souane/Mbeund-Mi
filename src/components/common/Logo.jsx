import React from 'react';
import logoImg from '../../assets/logo.jpg';
import { useTheme } from '../../context/ThemeContext';

export default function Logo({ size = "md", showSlogan = true }) {
  const { darkMode } = useTheme();
  const isSmall = size === "sm";

  return (
    <div className="flex flex-col items-center justify-center select-none cursor-pointer group py-1.5 transition-all">
      
      {/* Enlarged clean logo image */}
      <div className={`overflow-hidden flex items-center justify-center transition-all group-hover:scale-[1.03] ${
        isSmall 
          ? 'h-14 sm:h-16 md:h-18 max-w-[260px] sm:max-w-[320px]' 
          : 'h-20 sm:h-24 md:h-28 max-w-[400px]'
      } ${
        darkMode 
          ? 'filter drop-shadow-[0_3px_12px_rgba(255,255,255,0.95)] bg-white/95 p-1.5 rounded-2xl' 
          : 'mix-blend-multiply'
      }`}>
        <img 
          src={logoImg} 
          alt="MBEUND MI" 
          className="w-full h-full object-contain" 
        />
      </div>

      {/* Enlarged crisp high-contrast slogan together with logo */}
      {showSlogan && (
        <div className="flex items-center space-x-2 mt-2 font-extrabold tracking-widest uppercase">
          <span className={`h-1 rounded-full ${isSmall ? 'w-4 sm:w-5' : 'w-6 sm:w-8'} ${darkMode ? 'bg-brand-sky' : 'bg-brand-navy'}`}></span>
          <span className={`text-xs sm:text-sm md:text-base font-extrabold tracking-widest text-center ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            BUL XAAR, WAAJAL KO.
          </span>
          <span className={`h-1 bg-brand-red rounded-full ${isSmall ? 'w-4 sm:w-5' : 'w-6 sm:w-8'}`}></span>
        </div>
      )}
    </div>
  );
}

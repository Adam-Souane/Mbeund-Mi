import React from 'react';
import logoImg from '../../assets/logo.jpg';
import { useTheme } from '../../context/ThemeContext';

export default function Logo({ size = "md" }) {
  const { darkMode } = useTheme();
  const isSmall = size === "sm";

  return (
    <div className="flex items-center justify-center select-none cursor-pointer group py-1">
      {/* Pure logo image — MBEUND MI only, zero writing below */}
      <img 
        src={logoImg} 
        alt="MBEUND MI" 
        className={`object-contain transition-all group-hover:scale-[1.02] ${
          isSmall 
            ? 'h-9 sm:h-11 md:h-12 max-w-[200px] sm:max-w-[240px]' 
            : 'h-14 sm:h-18 md:h-20 max-w-[320px]'
        } ${
          darkMode 
            ? 'filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.9)] bg-white/95 p-1 rounded-2xl' 
            : 'mix-blend-multiply'
        }`} 
      />
    </div>
  );
}

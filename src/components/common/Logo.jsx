import React from 'react';
import logoImg from '../../assets/logo.jpg';
import { useTheme } from '../../context/ThemeContext';

export default function Logo({ size = "md" }) {
  const { darkMode } = useTheme();
  const isSmall = size === "sm";

  return (
    <div className="flex items-center justify-center select-none cursor-pointer group py-1">
      {/* Clean logo containing only MBEUND MI with zero bottom text */}
      <img 
        src={logoImg} 
        alt="MBEUND MI" 
        className={`object-contain transition-all group-hover:scale-[1.02] ${
          isSmall 
            ? 'h-10 sm:h-12 md:h-14 max-w-[220px] sm:max-w-[260px]' 
            : 'h-16 sm:h-20 md:h-24 max-w-[320px]'
        } ${
          darkMode 
            ? 'filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.9)] bg-white/95 p-1 rounded-2xl' 
            : 'mix-blend-multiply'
        }`} 
      />
    </div>
  );
}

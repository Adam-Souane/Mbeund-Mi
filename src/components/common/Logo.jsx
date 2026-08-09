import React from 'react';
import logoImg from '../../assets/logo.jpg';
import { useTheme } from '../../context/ThemeContext';

export default function Logo({ size = "md" }) {
  const { darkMode } = useTheme();
  const isSmall = size === "sm";

  return (
    <div className="flex items-center justify-center select-none cursor-pointer group py-0.5">
      {/* Exact official logo image containing MBEUND MI and its single official slogan */}
      <img 
        src={logoImg} 
        alt="MBEUND MI — Bul Xaar, Waajal Ko." 
        className={`object-contain transition-all group-hover:scale-[1.02] ${
          isSmall 
            ? 'h-11 sm:h-13 md:h-14 max-w-[200px] sm:max-w-[240px]' 
            : 'h-16 sm:h-20 md:h-22 max-w-[300px]'
        } ${
          darkMode 
            ? 'filter drop-shadow-[0_1px_6px_rgba(255,255,255,0.85)] bg-white/90 p-1 rounded-xl' 
            : 'mix-blend-multiply'
        }`} 
      />
    </div>
  );
}

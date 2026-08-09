import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function Logo({ size = "md", showSlogan = true }) {
  const { darkMode } = useTheme();
  const isSmall = size === "sm";

  return (
    <div className="flex flex-col items-start select-none">
      <div className="flex items-center space-x-0.5 font-extrabold tracking-wider">
        {/* "MBEUN" text */}
        <span className={`text-brand-navy dark:text-white ${isSmall ? 'text-xl sm:text-2xl' : 'text-2xl md:text-3xl'}`}>
          MBEUN
        </span>
        
        {/* Custom Letter 'D' with integrated house and water waves */}
        <div className="relative inline-flex items-center justify-center -mx-0.5">
          <svg 
            className={`${isSmall ? 'w-6 h-7 sm:w-7 sm:h-8' : 'w-8 h-9 md:w-10 md:h-11'}`} 
            viewBox="0 0 100 110" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Letter 'D' shape */}
            <path 
              d="M 15 10 H 50 C 75 10 90 28 90 55 C 90 82 75 100 50 100 H 15 V 10 Z" 
              fill="#0F294A" 
            />
            {/* Inner counter shape of 'D' */}
            <path 
              d="M 30 25 H 48 C 65 25 74 38 74 55 C 74 72 65 85 48 85 H 30 V 25 Z" 
              fill={darkMode ? "#0A192F" : "#FFFFFF"} 
            />
            
            {/* House roof inside D */}
            <path 
              d="M 51 32 L 32 50 L 37 50 L 37 70 L 65 70 L 65 50 L 70 50 Z" 
              fill="#0F294A" 
            />
            {/* House window */}
            <rect x="46" y="52" width="10" height="10" fill="#FFFFFF" rx="1" />
            <line x1="51" y1="52" x2="51" y2="62" stroke="#0F294A" strokeWidth="1.5" />
            <line x1="46" y1="57" x2="56" y2="57" stroke="#0F294A" strokeWidth="1.5" />

            {/* Water Waves inside D */}
            <path d="M 25 76 Q 38 70 51 76 T 77 76" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
            <path d="M 25 83 Q 38 77 51 83 T 77 83" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>

        {/* "MI" text in bright red */}
        <span className={`text-brand-red ${isSmall ? 'text-xl sm:text-2xl' : 'text-2xl md:text-3xl'}`}>
          MI
        </span>
      </div>

      {/* Slogan */}
      {showSlogan && (
        <div className="flex items-center space-x-1.5 text-[9px] sm:text-[10px] md:text-xs font-semibold tracking-widest text-slate-400 uppercase mt-0.5">
          <span className="w-2.5 h-0.5 bg-brand-navy dark:bg-slate-400"></span>
          <span>BUL XAAR, WAAJAL KO.</span>
          <span className="w-2.5 h-0.5 bg-brand-red"></span>
        </div>
      )}
    </div>
  );
}

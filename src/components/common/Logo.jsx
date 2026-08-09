import React from 'react';
import logoImg from '../../assets/logo.jpg';

export default function Logo({ size = "md", showSlogan = true }) {
  const isSmall = size === "sm";

  return (
    <div className="flex items-center select-none cursor-pointer">
      {/* Official logo image with enlarged dimensions */}
      <img 
        src={logoImg} 
        alt="MBEUND MI — Bul Xaar, Waajal Ko" 
        className={`object-contain transition-all hover:scale-[1.02] ${
          isSmall 
            ? 'h-12 sm:h-14 md:h-16 max-w-[220px] sm:max-w-[260px]' 
            : 'h-16 sm:h-20 md:h-24 max-w-[320px]'
        } bg-white p-1.5 rounded-2xl shadow-md border border-slate-200/90`} 
      />
    </div>
  );
}

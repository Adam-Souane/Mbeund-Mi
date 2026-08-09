import React from 'react';
import logoImg from '../../assets/logo.jpg';

export default function Logo({ size = "md", showSlogan = true }) {
  const isSmall = size === "sm";

  return (
    <div className="flex items-center select-none cursor-pointer">
      {/* Exact official logo image */}
      <img 
        src={logoImg} 
        alt="MBEUND MI — Bul Xaar, Waajal Ko" 
        className={`object-contain transition-all hover:opacity-95 ${
          isSmall ? 'h-9 sm:h-11' : 'h-14 sm:h-16 md:h-20'
        } bg-white p-1 rounded-xl shadow-sm border border-slate-200/80`} 
      />
    </div>
  );
}

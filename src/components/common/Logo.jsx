import React from 'react';

export default function Logo({ size = "md", showSlogan = true }) {
  const isSmall = size === "sm";
  
  return (
    <div className="flex flex-col items-start select-none">
      <div className="flex items-center space-x-1 font-extrabold tracking-wider">
        <span className={`text-brand-navy dark:text-white ${isSmall ? 'text-xl' : 'text-2xl md:text-3xl'}`}>
          MBEUN
        </span>
        
        {/* House and water wave icon integrated inside logo design */}
        <div className="relative inline-flex flex-col items-center justify-center mx-0.5">
          <svg 
            className={`${isSmall ? 'w-6 h-6' : 'w-8 h-8'} text-brand-navy fill-current`} 
            viewBox="0 0 100 100"
          >
            {/* House roof */}
            <path d="M50 15 L15 50 L28 50 L28 85 L72 85 L72 50 L85 50 Z" fill="#0F294A" />
            {/* House window */}
            <rect x="42" y="52" width="16" height="16" fill="#FFFFFF" rx="2" />
            <line x1="50" y1="52" x2="50" y2="68" stroke="#0F294A" strokeWidth="2" />
            <line x1="42" y1="60" x2="58" y2="60" stroke="#0F294A" strokeWidth="2" />
            {/* Water Waves */}
            <path d="M 10 75 Q 30 65 50 75 T 90 75" fill="none" stroke="#0284C7" strokeWidth="6" strokeLinecap="round" />
            <path d="M 10 88 Q 30 78 50 88 T 90 88" fill="none" stroke="#0284C7" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>

        <span className={`text-brand-red ${isSmall ? 'text-xl' : 'text-2xl md:text-3xl'}`}>
          MI
        </span>
      </div>

      {showSlogan && (
        <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs font-semibold tracking-widest text-slate-400 uppercase mt-0.5">
          <span className="w-3 h-0.5 bg-brand-navy"></span>
          <span>BUL XAAR, WAAJAL KO.</span>
          <span className="w-3 h-0.5 bg-brand-red"></span>
        </div>
      )}
    </div>
  );
}

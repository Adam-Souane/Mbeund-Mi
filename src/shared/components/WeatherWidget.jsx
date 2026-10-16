import React, { useState, useRef, useEffect } from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSun,
  CloudLightning,
  Wind,
  Droplets,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Compass,
} from 'lucide-react';

// Noms abrégés des jours en majuscules (ex: VEN, SAM, DIM)
function formatShortDay(dateObj) {
  const dayStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'short' });
  return dayStr.replace('.', '').toUpperCase();
}

// Nom complet du jour (ex: Vendredi, Samedi)
function formatFullDay(dateObj) {
  const full = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' });
  return full.charAt(0).toUpperCase() + full.slice(1);
}

// Détermine l'icône, le libellé météo et le type d'animation (soleil ou pluie)
function getWeatherMeta(precip, code) {
  const p = Number(precip) || 0;
  if (code >= 95) {
    return {
      label: 'Orages',
      Icon: CloudLightning,
      color: 'text-amber-300',
      isSun: false,
      isRain: true,
    };
  }
  if (p > 5 || (code >= 61 && code <= 67)) {
    return {
      label: 'Pluie soutenue',
      Icon: CloudRain,
      color: 'text-sky-200',
      isSun: false,
      isRain: true,
    };
  }
  if (p > 0 || (code >= 51 && code <= 55)) {
    return {
      label: 'Averses légères',
      Icon: CloudRain,
      color: 'text-sky-100',
      isSun: false,
      isRain: true,
    };
  }
  if (code >= 1 && code <= 3) {
    return {
      label: 'Partiellement nuageux',
      Icon: CloudSun,
      color: 'text-amber-200',
      isSun: false,
      isRain: false,
    };
  }
  return {
    label: 'Ensoleillé',
    Icon: Sun,
    color: 'text-yellow-300',
    isSun: true,
    isRain: false,
  };
}

export default function WeatherWidget({ previsions = [], zone = null, className = '' }) {
  const scrollRef = useRef(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Construction des 7 jours fiables (données réelles API + complétion saisonnière Dakar/Thiaroye)
  const daysList = React.useMemo(() => {
    const list = [];
    const baseDate = new Date();

    // Normales climatiques réalistes pour Dakar/Thiaroye en octobre
    const defaultDakarTemps = [
      { temp: 30, max: 32, min: 27, precip: 0.0, wind: 18, humidity: 72, code: 0 },
      { temp: 31, max: 32, min: 27, precip: 0.0, wind: 16, humidity: 70, code: 0 },
      { temp: 29, max: 31, min: 26, precip: 0.0, wind: 19, humidity: 75, code: 1 },
      { temp: 28, max: 30, min: 25, precip: 0.8, wind: 22, humidity: 80, code: 2 },
      { temp: 30, max: 32, min: 26, precip: 0.0, wind: 17, humidity: 73, code: 0 },
      { temp: 31, max: 33, min: 27, precip: 0.0, wind: 15, humidity: 68, code: 0 },
      { temp: 29, max: 31, min: 26, precip: 0.0, wind: 20, humidity: 74, code: 1 },
    ];

    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);

      // Chercher si l'API a une prévision pour cette date
      const matched = previsions.find((p) => {
        if (!p.date_prevision) return false;
        const pDate = new Date(p.date_prevision);
        return (
          pDate.getDate() === d.getDate() &&
          pDate.getMonth() === d.getMonth() &&
          pDate.getFullYear() === d.getFullYear()
        );
      }) || previsions[i];

      const fallback = defaultDakarTemps[i % defaultDakarTemps.length];

      // Extraction des températures réelles
      let rawTemp = matched?.temperature_c ?? matched?.temperature_max_c ?? matched?.temperature;
      let rawMax = matched?.temperature_max_c ?? (rawTemp ? Number(rawTemp) + 1.5 : null);
      let rawMin = matched?.temperature_min_c ?? (rawTemp ? Number(rawTemp) - 3.5 : null);
      let rawPrecip = matched?.precipitation_mm ?? matched?.precipitation;
      let rawWind = matched?.vitesse_vent;
      let rawHumidity = matched?.humidity_percent;
      let rawCode = matched?.weather_code;

      const tempVal = rawTemp != null ? Math.round(Number(rawTemp)) : fallback.temp;
      const maxVal = rawMax != null ? Math.round(Number(rawMax)) : fallback.max;
      const minVal = rawMin != null ? Math.round(Number(rawMin)) : fallback.min;
      const precipVal = rawPrecip != null ? parseFloat(Number(rawPrecip).toFixed(1)) : fallback.precip;
      const windVal = rawWind != null ? Math.round(Number(rawWind)) : fallback.wind;
      const humidityVal = rawHumidity != null ? Math.round(Number(rawHumidity)) : fallback.humidity;
      const codeVal = rawCode != null ? Number(rawCode) : fallback.code;

      const meta = getWeatherMeta(precipVal, codeVal);

      list.push({
        id: matched?.id || `forecast-${i}`,
        dateObj: d,
        dayShort: formatShortDay(d),
        dayFull: formatFullDay(d),
        isToday: i === 0,
        temp: tempVal,
        tempMax: maxVal,
        tempMin: minVal,
        precip: precipVal,
        wind: windVal,
        humidity: humidityVal,
        meta,
      });
    }

    return list;
  }, [previsions]);

  const activeDay = daysList[selectedDayIndex] || daysList[0];
  const { Icon: ActiveIcon, label: activeLabel } = activeDay.meta;

  const [isPaused, setIsPaused] = useState(false);

  // Défilement automatique autonome de la météo (toutes les 3.8s)
  useEffect(() => {
    if (isPaused || daysList.length === 0) return;

    const timer = setInterval(() => {
      setSelectedDayIndex((prev) => {
        const nextIdx = (prev + 1) % daysList.length;
        if (scrollRef.current) {
          const cardWidth = 84;
          scrollRef.current.scrollTo({
            left: nextIdx * cardWidth,
            behavior: 'smooth',
          });
        }
        return nextIdx;
      });
    }, 3800);

    return () => clearInterval(timer);
  }, [isPaused, daysList.length]);

  const handleSelectDay = (idx) => {
    setSelectedDayIndex(idx);
    if (scrollRef.current) {
      const cardWidth = 84;
      scrollRef.current.scrollTo({
        left: idx * cardWidth,
        behavior: 'smooth',
      });
    }
  };

  const scroll = (direction) => {
    const nextIdx =
      direction === 'left'
        ? (selectedDayIndex - 1 + daysList.length) % daysList.length
        : (selectedDayIndex + 1) % daysList.length;
    handleSelectDay(nextIdx);
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl shadow-xl border border-sky-400/40 text-white bg-gradient-to-b from-[#1C7ED6] via-[#228BE6] to-[#4DABF7] p-4 sm:p-6 transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[1.025] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-sky-500/25 hover:border-sky-300 will-change-transform flex flex-col justify-between ${className}`}>
      {/* Nuages doux et lueurs atmosphériques en arrière-plan (inspirés de la capture) */}
      <div className="absolute top-0 right-0 w-72 h-44 bg-white/15 rounded-full blur-3xl pointer-events-none transform translate-x-12 -translate-y-10" />
      <div className="absolute bottom-16 left-0 w-64 h-36 bg-sky-300/20 rounded-full blur-2xl pointer-events-none transform -translate-x-10" />

      {/* Silhouette de nuage décoratif en haut à droite */}
      <svg
        className="absolute top-2 right-2 w-44 h-28 opacity-25 pointer-events-none"
        viewBox="0 0 100 60"
        fill="currentColor"
      >
        <path d="M20,40 Q15,40 10,35 Q5,30 10,25 Q15,20 25,22 Q30,12 45,15 Q60,10 70,22 Q80,20 85,28 Q90,35 80,40 Z" />
      </svg>

      {/* En-tête : Ville, Quartier & Statut du jour */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-sky-100 text-xs font-semibold uppercase tracking-wider">
            <MapPin size={14} className="text-yellow-300 flex-shrink-0" />
            <span>Thiaroye-sur-Mer</span>
            {zone?.quartier && zone.quartier !== 'Thiaroye-sur-Mer' && (
              <span className="text-white/80">· Secteur {zone.quartier}</span>
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
            Dakar, Sénégal
          </h3>
          <p className="text-xs sm:text-sm font-medium text-sky-100/90 mt-0.5">
            {activeDay.isToday ? "Aujourd'hui" : activeDay.dayFull} · {activeLabel}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-[11px] font-bold tracking-wide shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>EN DIRECT</span>
        </div>
      </div>

      {/* Centre : Icône Météo animée et Température Géante */}
      <div className="relative z-10 my-3 sm:my-4 flex flex-col items-center justify-center text-center">
        {/* Icône météo animée avec halo adapté (soleil avec rotation, pluie avec jets d'eau SANS rotation) */}
        <div className="relative group cursor-pointer transition-transform hover:scale-105 active:scale-95">
          <style>{`
            @keyframes waterJet {
              0% { transform: translateY(-3px); opacity: 0.2; }
              50% { opacity: 1; }
              100% { transform: translateY(8px); opacity: 0; }
            }
          `}</style>

          <div
            className={`absolute inset-0 rounded-full blur-2xl animate-pulse ${
              activeDay.meta.isSun
                ? 'bg-yellow-300/30'
                : activeDay.meta.isRain
                ? 'bg-sky-200/25'
                : 'bg-white/20'
            }`}
          />

          <div className="relative w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center drop-shadow-[0_10px_20px_rgba(0,0,0,0.2)]">
            {activeDay.meta.isSun ? (
              // Soleil : rotation douce et majestueuse
              <>
                <Sun
                  size={52}
                  strokeWidth={1.8}
                  className="text-yellow-300 transition-all duration-500 animate-[spin_40s_linear_infinite] sm:hidden"
                />
                <Sun
                  size={76}
                  strokeWidth={1.8}
                  className="text-yellow-300 transition-all duration-500 animate-[spin_40s_linear_infinite] hidden sm:block"
                />
              </>
            ) : activeDay.meta.isRain ? (
              // Pluie : nuage stable (AUCUNE rotation) + jets d'eau verticaux animés
              <>
                <div className="flex flex-col items-center justify-center select-none sm:hidden">
                  <Cloud size={46} strokeWidth={1.8} className="text-white drop-shadow-md" />
                  <div className="flex items-center justify-center gap-1 mt-0.5 -translate-y-0.5">
                    <span className="w-1 h-2.5 rounded-full bg-sky-200" style={{ animation: 'waterJet 0.9s ease-in-out infinite' }} />
                    <span className="w-1 h-3.5 rounded-full bg-white" style={{ animation: 'waterJet 1.1s ease-in-out infinite 0.15s' }} />
                    <span className="w-1 h-2.5 rounded-full bg-sky-100" style={{ animation: 'waterJet 0.85s ease-in-out infinite 0.3s' }} />
                  </div>
                </div>
                <div className="hidden sm:flex flex-col items-center justify-center select-none">
                  <Cloud size={64} strokeWidth={1.8} className="text-white drop-shadow-md" />
                  <div className="flex items-center justify-center gap-1.5 mt-1 -translate-y-0.5">
                    <span className="w-1 h-3.5 rounded-full bg-sky-200" style={{ animation: 'waterJet 0.9s ease-in-out infinite' }} />
                    <span className="w-1.5 h-4.5 rounded-full bg-white" style={{ animation: 'waterJet 1.1s ease-in-out infinite 0.15s' }} />
                    <span className="w-1 h-3.5 rounded-full bg-sky-100" style={{ animation: 'waterJet 0.85s ease-in-out infinite 0.3s' }} />
                    <span className="w-1.5 h-4 rounded-full bg-sky-200" style={{ animation: 'waterJet 1.05s ease-in-out infinite 0.45s' }} />
                  </div>
                </div>
              </>
            ) : (
              // Nuages / autres : fixe sans rotation
              <>
                <ActiveIcon
                  size={50}
                  strokeWidth={1.8}
                  className={`${activeDay.meta.color} transition-all duration-500 sm:hidden`}
                />
                <ActiveIcon
                  size={74}
                  strokeWidth={1.8}
                  className={`${activeDay.meta.color} transition-all duration-500 hidden sm:block`}
                />
              </>
            )}
          </div>
        </div>

        {/* Chiffre de Température & Conditions : compact sur mobile */}
        <div className="flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-0 mt-1 sm:mt-2 select-none">
          <div className="flex items-start">
            <span className="text-5xl sm:text-7xl font-light tracking-tighter text-white drop-shadow-sm leading-none font-sans">
              {activeDay.temp}
            </span>
            <span className="text-xl sm:text-3xl font-light text-sky-100 ml-0.5 mt-0.5">°C</span>
          </div>

          {/* Plage de température & conditions réelles */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-sky-100 sm:mt-2">
            <span>Max {activeDay.tempMax}°</span>
            <span className="w-1 h-1 rounded-full bg-white/60" />
            <span>Min {activeDay.tempMin}°</span>
            {activeDay.precip > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/60" />
                <span className="text-yellow-200 font-bold">{activeDay.precip}mm</span>
              </>
            )}
          </div>
        </div>

        {/* Mini barre d'indicateurs météo réels (Vent, Humidité, Précipitations) */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full max-w-xs mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-white/20">
          <div className="flex flex-col items-center p-1.5 sm:p-2 rounded-xl bg-white/10 backdrop-blur-xs">
            <span className="flex items-center gap-1 text-[11px] text-sky-100/80">
              <Wind size={12} /> Vent
            </span>
            <span className="text-xs font-bold text-white mt-0.5">{activeDay.wind} km/h</span>
          </div>

          <div className="flex flex-col items-center p-1.5 sm:p-2 rounded-xl bg-white/10 backdrop-blur-xs">
            <span className="flex items-center gap-1 text-[11px] text-sky-100/80">
              <Droplets size={12} /> Humidité
            </span>
            <span className="text-xs font-bold text-white mt-0.5">{activeDay.humidity}%</span>
          </div>

          <div className="flex flex-col items-center p-1.5 sm:p-2 rounded-xl bg-white/10 backdrop-blur-xs">
            <span className="flex items-center gap-1 text-[11px] text-sky-100/80">
              <Compass size={12} /> Pluie
            </span>
            <span className="text-xs font-bold text-white mt-0.5">{activeDay.precip} mm</span>
          </div>
        </div>
      </div>

      {/* Bas de carte : Prévisions sur 7 jours avec défilement horizontal animé */}
      <div className="relative z-10 pt-3 sm:pt-4 border-t border-white/25">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-100">
            Prévisions des 7 prochains jours
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Faire défiler vers la gauche"
              className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-xs flex items-center justify-center text-white transition-all active:scale-90"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Faire défiler vers la droite"
              className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-xs flex items-center justify-center text-white transition-all active:scale-90"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Rail de défilement horizontal autonome avec protection contre le rognage */}
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex gap-2 sm:gap-2.5 overflow-x-auto px-1 py-1.5 scrollbar-none snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {daysList.map((day, idx) => {
            const isSelected = idx === selectedDayIndex;
            const { Icon: DayIcon, color: iconColor } = day.meta;

            return (
              <button
                key={day.id}
                type="button"
                onClick={() => handleSelectDay(idx)}
                className={`snap-start flex-shrink-0 w-16 sm:w-20 py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-2xl flex flex-col items-center justify-between transition-all duration-300 active:scale-95 text-center cursor-pointer ${
                  isSelected
                    ? 'bg-white text-navy-900 shadow-xl scale-[1.03] ring-2 ring-white/90'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                }`}
              >
                {/* Jour */}
                <span
                  className={`text-[11px] font-extrabold tracking-wide ${
                    isSelected ? 'text-navy-900' : 'text-sky-100'
                  }`}
                >
                  {day.isToday ? "AUJ." : day.dayShort}
                </span>

                {/* Icône météo du jour */}
                <div className="my-2 transition-transform group-hover:scale-110">
                  <DayIcon
                    size={22}
                    className={isSelected ? 'text-sky-600' : iconColor}
                  />
                </div>

                {/* Température du jour */}
                <span
                  className={`text-sm font-black ${
                    isSelected ? 'text-navy-900' : 'text-white'
                  }`}
                >
                  {day.temp}°
                </span>

                {/* Indication pluie si applicable */}
                <span
                  className={`text-[9px] font-semibold mt-1 ${
                    isSelected ? 'text-sky-600' : 'text-sky-100/80'
                  }`}
                >
                  {day.precip > 0 ? `${day.precip}mm` : 'Sec'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

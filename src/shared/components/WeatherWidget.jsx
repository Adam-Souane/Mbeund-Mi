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
  Calendar,
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

const DEFAULT_DAKAR_TEMPS = [
  { temp: 30, max: 32, min: 27, precip: 0.0, wind: 18, humidity: 72, code: 0 },
  { temp: 31, max: 32, min: 27, precip: 0.0, wind: 16, humidity: 70, code: 0 },
  { temp: 29, max: 31, min: 26, precip: 0.0, wind: 19, humidity: 75, code: 1 },
  { temp: 28, max: 30, min: 25, precip: 0.8, wind: 22, humidity: 80, code: 2 },
  { temp: 30, max: 32, min: 26, precip: 0.0, wind: 17, humidity: 73, code: 0 },
  { temp: 31, max: 33, min: 27, precip: 0.0, wind: 15, humidity: 68, code: 0 },
  { temp: 29, max: 31, min: 26, precip: 0.0, wind: 20, humidity: 74, code: 1 },
];

function buildDayItem(i, baseDate, previsions, fallback) {
  const d = new Date(baseDate);
  d.setDate(baseDate.getDate() + i);

  const matched =
    previsions.find((p) => {
      if (!p.date_prevision) return false;
      const pDate = new Date(p.date_prevision);
      return (
        pDate.getDate() === d.getDate() &&
        pDate.getMonth() === d.getMonth() &&
        pDate.getFullYear() === d.getFullYear()
      );
    }) || previsions[i];

  const rawTemp = matched?.temperature_c ?? matched?.temperature_max_c ?? matched?.temperature;
  const rawMax = matched?.temperature_max_c ?? (rawTemp ? Number(rawTemp) + 1.5 : null);
  const rawMin = matched?.temperature_min_c ?? (rawTemp ? Number(rawTemp) - 3.5 : null);
  const rawPrecip = matched?.precipitation_mm ?? matched?.precipitation;

  const tempVal = rawTemp != null ? Math.round(Number(rawTemp)) : fallback.temp;
  const maxVal = rawMax != null ? Math.round(Number(rawMax)) : fallback.max;
  const minVal = rawMin != null ? Math.round(Number(rawMin)) : fallback.min;
  const precipVal = rawPrecip != null ? parseFloat(Number(rawPrecip).toFixed(1)) : fallback.precip;
  const windVal =
    matched?.vitesse_vent != null ? Math.round(Number(matched.vitesse_vent)) : fallback.wind;
  const humidityVal =
    matched?.humidity_percent != null
      ? Math.round(Number(matched.humidity_percent))
      : fallback.humidity;
  const codeVal = matched?.weather_code != null ? Number(matched.weather_code) : fallback.code;

  return {
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
    meta: getWeatherMeta(precipVal, codeVal),
  };
}

function getCleanQuartier(quartier) {
  if (!quartier || typeof quartier !== 'string') return null;
  const q = quartier
    .replace('(Thiaroye-sur-Mer)', '')
    .replace('(thiaroye-sur-mer)', '')
    .replace('Secteur ', '')
    .replace('secteur ', '')
    .trim();
  if (!q || q.toLowerCase() === 'thiaroye-sur-mer') return null;
  return q;
}

function WeatherHeroIcon({ meta, size = 36 }) {
  if (meta.isSun) {
    return (
      <Sun
        size={size}
        strokeWidth={1.8}
        className="text-yellow-300 animate-[spin_40s_linear_infinite]"
      />
    );
  }
  if (meta.isRain) {
    return (
      <div className="flex flex-col items-center justify-center select-none">
        <Cloud size={Math.round(size * 0.85)} strokeWidth={1.8} className="text-white drop-shadow-sm" />
        <div className="flex items-center justify-center gap-1 mt-0.5">
          <span
            className="w-1 h-2 rounded-full bg-sky-200"
            style={{ animation: 'weatherJet 0.9s ease-in-out infinite' }}
          />
          <span
            className="w-1 h-2.5 rounded-full bg-white"
            style={{ animation: 'weatherJet 1.1s ease-in-out infinite 0.15s' }}
          />
          <span
            className="w-1 h-2 rounded-full bg-sky-100"
            style={{ animation: 'weatherJet 0.85s ease-in-out infinite 0.3s' }}
          />
        </div>
      </div>
    );
  }
  const { Icon, color } = meta;
  return <Icon size={size - 2} strokeWidth={1.8} className={color} />;
}

export default function WeatherWidget({
  previsions = [],
  zone = null,
  className = '',
  variant = 'panoramic',
}) {
  const scrollRef = useRef(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Construction des 7 jours fiables
  const daysList = React.useMemo(() => {
    const list = [];
    const baseDate = new Date();

    for (let i = 0; i < 7; i++) {
      const fallback = DEFAULT_DAKAR_TEMPS[i % DEFAULT_DAKAR_TEMPS.length];
      list.push(buildDayItem(i, baseDate, previsions, fallback));
    }

    return list;
  }, [previsions]);

  const activeDay = daysList[selectedDayIndex] || daysList[0];
  const { label: activeLabel } = activeDay.meta;

  // Nettoyage intelligent du nom de quartier pour éviter les répétitions verbeuses
  const cleanQuartier = getCleanQuartier(zone?.quartier);

  // Défilement automatique autonome de la météo (toutes les 4s)
  useEffect(() => {
    if (isPaused || daysList.length === 0) return;

    const timer = setInterval(() => {
      setSelectedDayIndex((prev) => {
        const nextIdx = (prev + 1) % daysList.length;
        if (scrollRef.current) {
          const cardWidth = 78;
          scrollRef.current.scrollTo({
            left: nextIdx * cardWidth,
            behavior: 'smooth',
          });
        }
        return nextIdx;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [isPaused, daysList.length]);

  const handleSelectDay = (idx) => {
    setSelectedDayIndex(idx);
    if (scrollRef.current) {
      const cardWidth = 78;
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

  const isPanoramic = variant === 'panoramic';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-xl border border-sky-400/40 text-white bg-gradient-to-b from-[#1C7ED6] via-[#228BE6] to-[#4DABF7] p-4 sm:p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/25 ${className}`}
    >
      <style>{`
        @keyframes weatherJet {
          0% { transform: translateY(-2px); opacity: 0.2; }
          50% { opacity: 1; }
          100% { transform: translateY(6px); opacity: 0; }
        }
      `}</style>

      {/* Nuages doux et lueurs atmosphériques originales */}
      <div className="absolute top-0 right-0 w-72 h-44 bg-white/15 rounded-full blur-3xl pointer-events-none transform translate-x-12 -translate-y-10" />
      <div className="absolute bottom-0 left-0 w-64 h-36 bg-sky-300/20 rounded-full blur-2xl pointer-events-none transform -translate-x-10" />

      {/* Silhouette de nuage décoratif en haut à droite */}
      <svg
        className="absolute top-2 right-2 w-44 h-28 opacity-25 pointer-events-none"
        viewBox="0 0 100 60"
        fill="currentColor"
      >
        <path d="M20,40 Q15,40 10,35 Q5,30 10,25 Q15,20 25,22 Q30,12 45,15 Q60,10 70,22 Q80,20 85,28 Q90,35 80,40 Z" />
      </svg>

      {isPanoramic ? (
        /* DISPOSITION PANORAMIQUE MODERNE (pour la page Prévisions & Alertes) */
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Section Gauche : Conditions actuelles & indicateurs clés */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            {/* Ville, Quartier & Statut direct avec flex fluide et badge protégé */}
            <div className="flex items-center justify-between gap-2.5 w-full">
              <div className="min-w-0 flex-1 flex items-center gap-1.5 text-sky-100 text-xs font-semibold">
                <MapPin size={13} className="text-yellow-300 shrink-0" />
                <span className="font-extrabold text-white truncate">
                  Thiaroye-sur-Mer{cleanQuartier ? ` · ${cleanQuartier}` : ''}
                </span>
                <span className="text-sky-100/90 shrink-0">· Dakar</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-[10px] font-extrabold tracking-wide text-white shadow-xs shrink-0 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>EN DIRECT</span>
              </div>
            </div>

            {/* Météo principale : Icône animée compacte + Température équilibrée */}
            <div className="mt-2.5 flex items-center gap-3.5 sm:gap-4">
              <div className="relative shrink-0 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20">
                <WeatherHeroIcon meta={activeDay.meta} size={36} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-none font-sans">
                    {activeDay.temp}°
                  </span>
                  <span className="text-base sm:text-lg font-bold text-sky-100">C</span>
                  <span className="text-xs text-sky-100/90 ml-2 font-semibold truncate">
                    {activeDay.isToday ? "Aujourd'hui" : activeDay.dayFull}
                  </span>
                </div>
                <div className="text-xs font-semibold text-sky-100 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white">{activeLabel}</span>
                  <span className="text-white/40">•</span>
                  <span>Max {activeDay.tempMax}° / Min {activeDay.tempMin}°</span>
                  {activeDay.precip > 0 && (
                    <>
                      <span className="text-white/40">•</span>
                      <span className="text-yellow-200 font-extrabold">{activeDay.precip} mm</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 3 Indicateurs clés compacts */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-white/20">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs">
                <Wind size={13} className="text-sky-100 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-sky-100/80 block leading-tight">Vent</span>
                  <span className="text-xs font-bold text-white truncate block">{activeDay.wind} km/h</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs">
                <Droplets size={13} className="text-sky-100 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-sky-100/80 block leading-tight">Humidité</span>
                  <span className="text-xs font-bold text-white truncate block">{activeDay.humidity}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs">
                <Compass size={13} className="text-sky-100 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-sky-100/80 block leading-tight">Pluie</span>
                  <span className="text-xs font-bold text-white truncate block">{activeDay.precip} mm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section Droite : Rail des prévisions sur 7 jours */}
          <div className="lg:col-span-7 lg:border-l lg:border-white/20 lg:pl-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/20">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-100 flex items-center gap-1.5">
                <Calendar size={13} className="text-yellow-300" />
                Prévisions des 7 prochains jours
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scroll('left')}
                  aria-label="Faire défiler vers la gauche"
                  className="w-6 h-6 rounded-lg bg-white/15 hover:bg-white/30 backdrop-blur-xs flex items-center justify-center text-white transition active:scale-90"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => scroll('right')}
                  aria-label="Faire défiler vers la droite"
                  className="w-6 h-6 rounded-lg bg-white/15 hover:bg-white/30 backdrop-blur-xs flex items-center justify-center text-white transition active:scale-90"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Rail horizontal fluide avec auto-scroll sur pause au survol */}
            <div
              ref={scrollRef}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="flex gap-2 overflow-x-auto py-1 scrollbar-none no-scrollbar snap-x snap-mandatory scroll-smooth"
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
                    className={`snap-start shrink-0 min-w-[72px] sm:min-w-[78px] py-2.5 px-2 rounded-xl flex flex-col items-center justify-between transition-all duration-200 active:scale-95 text-center cursor-pointer ${
                      isSelected
                        ? 'bg-white text-navy-900 shadow-xl ring-2 ring-white/90 font-bold scale-[1.02]'
                        : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-extrabold uppercase ${
                        isSelected ? 'text-navy-900' : 'text-sky-100'
                      }`}
                    >
                      {day.isToday ? 'AUJ.' : day.dayShort}
                    </span>
                    <div className="my-1.5">
                      <DayIcon
                        size={20}
                        className={isSelected ? 'text-[#1C7ED6]' : iconColor}
                      />
                    </div>
                    <span
                      className={`text-sm font-black ${
                        isSelected ? 'text-navy-900' : 'text-white'
                      }`}
                    >
                      {day.temp}°
                    </span>
                    <span
                      className={`text-[10px] font-semibold mt-0.5 ${
                        isSelected ? 'text-sky-600' : 'text-sky-100/90'
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
      ) : (
        /* DISPOSITION VERTICALE AVEC LE CHIFFRE ET L'ICÔNE AU MILIEU DE LA CARTE (Page Accueil) */
        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* En-tête fluide : Localisation & Badge EN DIRECT protégé */}
          <div className="flex items-start justify-between gap-2.5 w-full">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sky-100 text-xs font-semibold">
                <MapPin size={13} className="text-yellow-300 shrink-0" />
                <span className="font-extrabold text-white truncate">
                  Thiaroye-sur-Mer{cleanQuartier ? ` · ${cleanQuartier}` : ''}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5 leading-tight truncate">
                Dakar, Sénégal
              </h3>
              <p className="text-xs font-medium text-sky-100/90 mt-0.5 truncate">
                {activeDay.isToday ? "Aujourd'hui" : activeDay.dayFull} · {activeLabel}
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-[10px] font-extrabold tracking-wide text-white shadow-xs shrink-0 whitespace-nowrap self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>EN DIRECT</span>
            </div>
          </div>

          {/* CENTRE DE LA CARTE : Icône animée et Température au MILIEU */}
          <div className="my-auto py-3 flex flex-col items-center justify-center text-center">
            {/* Icône météo animée au centre */}
            <div className="relative group cursor-pointer transition-transform hover:scale-105 active:scale-95 mb-2">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center justify-center shadow-inner">
                <WeatherHeroIcon meta={activeDay.meta} size={42} />
              </div>
            </div>

            {/* Chiffre de Température centré au milieu */}
            <div className="flex flex-col items-center justify-center select-none">
              <div className="flex items-start">
                <span className="text-5xl sm:text-6xl font-light tracking-tighter text-white drop-shadow-sm leading-none font-sans">
                  {activeDay.temp}
                </span>
                <span className="text-2xl sm:text-3xl font-light text-sky-100 ml-0.5 mt-0.5">°C</span>
              </div>

              {/* Min / Max / Pluie centrés */}
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-sky-100 mt-2">
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

            {/* Mini indicateurs centrés (Vent, Humidité, Pluie) */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-xs mt-3 pt-3 border-t border-white/20">
              <div className="flex flex-col items-center p-1.5 rounded-xl bg-white/10 backdrop-blur-xs">
                <span className="flex items-center gap-1 text-[11px] text-sky-100/80">
                  <Wind size={12} /> Vent
                </span>
                <span className="text-xs font-bold text-white mt-0.5">{activeDay.wind} km/h</span>
              </div>

              <div className="flex flex-col items-center p-1.5 rounded-xl bg-white/10 backdrop-blur-xs">
                <span className="flex items-center gap-1 text-[11px] text-sky-100/80">
                  <Droplets size={12} /> Humidité
                </span>
                <span className="text-xs font-bold text-white mt-0.5">{activeDay.humidity}%</span>
              </div>

              <div className="flex flex-col items-center p-1.5 rounded-xl bg-white/10 backdrop-blur-xs">
                <span className="flex items-center gap-1 text-[11px] text-sky-100/80">
                  <Compass size={12} /> Pluie
                </span>
                <span className="text-xs font-bold text-white mt-0.5">{activeDay.precip} mm</span>
              </div>
            </div>
          </div>

          {/* BAS DE LA CARTE : Rail des prévisions sur 7 jours */}
          <div className="pt-3 border-t border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-100">
                Prévisions sur 7 jours
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scroll('left')}
                  aria-label="Faire défiler vers la gauche"
                  className="w-5 h-5 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-xs flex items-center justify-center text-white transition active:scale-90"
                >
                  <ChevronLeft size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => scroll('right')}
                  aria-label="Faire défiler vers la droite"
                  className="w-5 h-5 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-xs flex items-center justify-center text-white transition active:scale-90"
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="flex gap-2 overflow-x-auto py-1 scrollbar-none no-scrollbar snap-x snap-mandatory scroll-smooth"
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
                    className={`snap-start shrink-0 min-w-[62px] py-2 px-1.5 rounded-xl flex flex-col items-center justify-between text-center transition ${
                      isSelected
                        ? 'bg-white text-navy-900 font-bold shadow-md'
                        : 'bg-white/15 text-white border border-white/20'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold">{day.isToday ? 'AUJ.' : day.dayShort}</span>
                    <div className="my-1">
                      <DayIcon size={18} className={isSelected ? 'text-[#1C7ED6]' : iconColor} />
                    </div>
                    <span className="text-xs font-black">{day.temp}°</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

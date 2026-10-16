import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Droplets, ShieldAlert, PhoneCall } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    image: '/images/prevention-pluie.jpg',
    badge: 'Mobilisation & Prévention',
    titre: 'Avant les fortes pluies : Dégagez les canaux',
    description: 'À Thiaroye-sur-Mer et Ndakhane, dégageons les rigoles et posons les sacs de sable pour fluidifier l\'eau.',
    tagColor: 'bg-emerald-500 text-white',
    icon: Droplets,
  },
  {
    id: 2,
    image: '/images/kit-urgence.jpg',
    badge: 'Guide Essentiel 72h',
    titre: 'Préparez votre kit de survie familial',
    description: 'Eau potable en bouteille, lampe torche, pharmacie et papiers scellés dans du plastique à portée de main.',
    tagColor: 'bg-amber-500 text-white',
    icon: ShieldAlert,
  },
  {
    id: 3,
    image: '/images/prevention-pluie.jpg',
    badge: 'Sécurité Électrique · Danger',
    titre: 'Coupez le disjoncteur général dès la montée des eaux',
    description: 'Évitez tout risque d\'électrocution dans la concession. Surélevez vos appareils et prévenez les secours au 18.',
    tagColor: 'bg-red text-white',
    icon: PhoneCall,
  },
];

export default function ConseilsCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const slide = SLIDES[current];
  const Icon = slide.icon;

  return (
    <div
      className="relative w-full h-56 sm:h-64 md:h-72 rounded-2xl overflow-hidden shadow-lg border border-navy-100 dark:border-navy-800 transition-all group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Image de fond avec transition */}
      <img
        src={slide.image}
        alt={slide.titre}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* Dégradé sombre cinématique pour sublimer le texte et l'image */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/60 to-transparent" />

      {/* Contenu visuel par-dessus */}
      <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between text-white z-10">
        {/* En-tête de la slide */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider backdrop-blur-md ${slide.tagColor} shadow-sm`}>
              <Icon size={13} />
              {slide.badge}
            </span>
          </div>

          {/* Flèches de navigation compactes */}
          <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-full p-1 border border-white/10">
            <button
              onClick={() => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
              aria-label="Conseil précédent"
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrent((prev) => (prev + 1) % SLIDES.length)}
              aria-label="Conseil suivant"
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Titre & texte percutant */}
        <div className="max-w-xl">
          <h3 className="text-lg sm:text-2xl font-black leading-tight text-white drop-shadow-md mb-1.5">
            {slide.titre}
          </h3>
          <p className="text-xs sm:text-sm text-gray-200 line-clamp-2 drop-shadow leading-relaxed opacity-95">
            {slide.description}
          </p>

          {/* Barres de progression / indicateurs */}
          <div className="flex items-center gap-2 mt-3 pt-2">
            {SLIDES.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrent(idx)}
                aria-label={`Afficher diapositive ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === current ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

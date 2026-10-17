import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Droplets, ShieldAlert, PhoneCall, Users, Waves, ShieldCheck } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    image: '/images/prevention-pluie.jpg',
    badge: 'Mobilisation · Thiaroye-sur-Mer',
    titre: 'Avant les fortes pluies : Dégagez les canaux',
    description: 'À Ndakhane et sur le secteur Plage, curons les caniveaux et positionnons les sacs de sable pour faciliter l\'évacuation naturelle des eaux pluviales.',
    tagColor: 'bg-emerald-600 text-white',
    icon: Droplets,
  },
  {
    id: 2,
    image: '/images/solidarite-thiaroye.jpg',
    badge: 'Entraide de Quartier · Ndakhane',
    titre: 'Solidarité communautaire : Barrières de sacs de sable',
    description: 'Les jeunes et riverains s\'organisent pour ériger des digues protectrices devant les concessions et sécuriser les ruelles vulnérables.',
    tagColor: 'bg-blue-600 text-white',
    icon: Users,
  },
  {
    id: 3,
    image: '/images/bassin-thiaroye.jpg',
    badge: 'Infrastructure & Pompage · ONAS',
    titre: 'Bassin de rétention : Surveillance du niveau d’eau',
    description: 'Contrôle continu des vannes et amorçage des motopompes à gros débit pour réguler les volumes d’eaux de ruissellement vers le collecteur.',
    tagColor: 'bg-indigo-600 text-white',
    icon: Waves,
  },
  {
    id: 4,
    image: '/images/pompage-thiaroye.jpg',
    badge: 'Intervention Rapide · Débarcadère',
    titre: 'Évacuation des eaux : Motopompes en action continue',
    description: 'Déploiement des flexibles de refoulement par la mairie et les équipes techniques pour désengorger rapidement les axes de circulation.',
    tagColor: 'bg-amber-600 text-white',
    icon: ShieldCheck,
  },
  {
    id: 5,
    image: '/images/kit-urgence.jpg',
    badge: 'Vigilance Familiale 72h',
    titre: 'Préparez votre kit d\'urgence étanche',
    description: 'Eau potable en bouteille, lampe torche, pharmacie de premiers soins et pièces d\'identité protégées dans des pochettes étanches.',
    tagColor: 'bg-orange-600 text-white',
    icon: ShieldAlert,
  },
  {
    id: 6,
    image: '/images/pompiers-secours.jpg',
    badge: 'Secours BNSP · Numéro 18',
    titre: 'Assistance et sauvetage d\'urgence 24h/24',
    description: 'En cas d\'eau atteignant les pièces de vie, montez sur les toitures ou terrasses et contactez immédiatement la Brigade Nationale des Sapeurs-Pompiers.',
    tagColor: 'bg-red-600 text-white',
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
      className="relative w-full h-52 sm:h-64 md:h-80 lg:h-[390px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5 dark:ring-white/10 transition-all group my-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Image de fond avec zoom doux au survol */}
      <img
        src={slide.image}
        alt={slide.titre}
        key={slide.id}
        className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105"
      />

      {/* Dégradé sombre cinématique multicouche pour un contraste parfait et élégant */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-transparent hidden sm:block" />

      {/* Contenu visuel par-dessus */}
      <div className="absolute inset-0 p-4 sm:p-6 lg:p-8 flex flex-col justify-between text-white z-10">
        {/* En-tête de la slide avec badge et navigation */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider backdrop-blur-md ${slide.tagColor} shadow-md truncate`}>
              <Icon size={14} className="flex-shrink-0" />
              <span className="truncate">{slide.badge}</span>
            </span>
          </div>

          {/* Flèches de navigation en verre dépoli */}
          <div className="flex items-center gap-1.5 bg-slate-950/50 backdrop-blur-md rounded-full p-1 border border-white/20 shadow-lg flex-shrink-0">
            <button
              onClick={() => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
              aria-label="Conseil précédent"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrent((prev) => (prev + 1) % SLIDES.length)}
              aria-label="Conseil suivant"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Titre & texte percutant */}
        <div className="max-w-2xl">
          <h3 className="text-base sm:text-2xl md:text-3xl font-black leading-snug sm:leading-tight text-white drop-shadow-md mb-1 sm:mb-2">
            {slide.titre}
          </h3>
          <p className="text-xs sm:text-sm md:text-base text-slate-200 line-clamp-2 sm:line-clamp-3 drop-shadow-sm leading-relaxed">
            {slide.description}
          </p>

          {/* Barres de progression / indicateurs élargis */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-0.5">
            {SLIDES.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrent(idx)}
                aria-label={`Afficher diapositive ${idx + 1}`}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === current ? 'w-10 sm:w-12 bg-white shadow-md' : 'w-2.5 sm:w-3 bg-white/35 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

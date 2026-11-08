import { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import logoLight from '../assets/logo-light.png';

// Données des slides d'onboarding mobile (3 étapes immersives et visuelles)
const SLIDES_CITOYEN = [
  {
    image: '/images/login-citoyen-thiaroye.jpg',
    titre: 'Alertes par SMS & WhatsApp',
    phrase: 'Soyez averti dès que l’eau monte dans votre quartier à Thiaroye.',
  },
  {
    image: '/images/curage-caniveau-sable-thiaroye.jpg',
    titre: 'Carte des Rues & Risques',
    phrase: 'Repérez en temps réel les voies praticables et les refuges sécurisés.',
  },
  {
    image: '/images/sensibilisation-mbeund-mi.jpg',
    titre: 'Signalement & Solidarité',
    phrase: 'Alertez la cellule de veille communale et protégez vos riverains.',
  },
];

const SLIDES_AUTORITE = [
  {
    image: '/images/login-autorite-thiaroye.jpg',
    titre: 'Supervision Hydrologique',
    phrase: 'Surveillez en direct les capteurs connectés et le niveau des bassins.',
  },
  {
    image: '/images/pompage-thiaroye.jpg',
    titre: 'Coordination Terrain & ONAS',
    phrase: 'Mobilisez rapidement les motopompes et les équipes d’intervention.',
  },
  {
    image: '/images/pompiers-secours.jpg',
    titre: 'Alertes Communales 24/7',
    phrase: 'Diffusez les consignes d’urgence et protégez la population.',
  },
];

const TITRES_DESKTOP = {
  connexion: {
    surtitre: 'Espace Citoyen · Thiaroye-sur-Mer',
    titre: 'Content de vous revoir !',
    texte: 'Connectez-vous pour suivre le risque d’inondation dans votre quartier et recevoir les alertes.',
  },
  inscription: {
    surtitre: 'Rejoindre MBEUND MI',
    titre: 'Veillons ensemble sur le quartier.',
    texte: 'Créez votre compte citoyen : vous serez prévenu dès que l’eau menace votre zone.',
  },
  verification: {
    surtitre: 'Sécurité du compte',
    titre: 'Confirmez que c’est bien vous.',
    texte: 'Ce code protège votre compte et garantit que les alertes arrivent au bon numéro.',
  },
  motdepasse: {
    surtitre: 'Accès au compte',
    titre: 'Retrouvez votre accès.',
    texte: 'Un code à 6 chiffres suffit pour choisir un nouveau mot de passe, en toute sécurité.',
  },
  administration: {
    surtitre: 'Espace Administration',
    titre: 'Pilotez la prévention.',
    texte: 'Créez le compte administrateur qui gérera les autorités, les capteurs et les alertes de la commune.',
  },
  autorite: {
    surtitre: 'Portail Officiel · Thiaroye-sur-Mer',
    titre: 'Supervision & Coordination',
    texte: 'Accédez au centre de commandement pour piloter les alertes, mobiliser les secours et superviser les capteurs.',
  },
};

export default function AuthLayout({ variante, className = '', children }) {
  const isAuthority = variante === 'administration' || variante === 'autorite';
  const slides = isAuthority ? SLIDES_AUTORITE : SLIDES_CITOYEN;
  const desktopMeta = TITRES_DESKTOP[variante] ?? TITRES_DESKTOP.connexion;

  // Sur mobile, si l'utilisateur est en saisie OTP ou mot de passe, on affiche directement le formulaire
  const demarrageDirect = variante === 'verification' || variante === 'motdepasse';
  const [vueMobileFormulaire, setVueMobileFormulaire] = useState(demarrageDirect);
  const [slideIndex, setSlideIndex] = useState(0);

  const slideCourante = slides[slideIndex] || slides[0];
  const estDerniereSlide = slideIndex === slides.length - 1;

  const handleSuivant = () => {
    if (estDerniereSlide) {
      setVueMobileFormulaire(true);
    } else {
      setSlideIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC] text-slate-800 lg:overflow-hidden">
      {/* 
        ========================================================================
        1. VUE MOBILE ONBOARDING (Plein écran immersif, fluide, sans coupure)
        ========================================================================
      */}
      {!vueMobileFormulaire && (
        <section className="lg:hidden relative w-full h-[100dvh] flex flex-col justify-between overflow-hidden text-white select-none">
          {/* Photo plein écran de fond sans bande blanche */}
          <img
            key={slideCourante.image}
            src={slideCourante.image}
            alt={slideCourante.titre}
            className="absolute inset-0 w-full h-full object-cover object-center z-0 transition-opacity duration-500"
          />

          {/* Dégradé sombre pour lisibilité parfaite */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-slate-950/35 pointer-events-none" />

          {/* En-tête mobile : Logo officiel propre + bouton Passer */}
          <header className="relative z-20 flex items-center justify-between p-5 pt-7">
            <div className="flex flex-col items-start">
              <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-md inline-flex items-center">
                <img
                  src={logoLight}
                  alt="MBEUND MI"
                  className="h-7 w-auto object-contain"
                />
              </div>
              <span className="text-[10px] font-black tracking-widest uppercase text-white/95 mt-1.5 drop-shadow">
                Bul Xaar, Waajal Ko.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setVueMobileFormulaire(true)}
              className="text-xs font-bold text-white/80 hover:text-white px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 active:scale-95 transition"
            >
              Passer
            </button>
          </header>

          {/* Bas d'écran mobile : Titre sobre, phrase d'impact, pagination et bouton Suivant */}
          <footer className="relative z-20 p-6 pb-8 flex flex-col gap-4">
            {/* Barre de pagination 3 traits */}
            <div className="flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Étape ${idx + 1}`}
                  onClick={() => setSlideIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === slideIndex ? 'w-8 bg-white' : 'w-2 bg-white/40'
                  }`}
                />
              ))}
            </div>

            {/* Titre et phrase (court et aéré, pas de surcharge) */}
            <div>
              <h2 className="text-2xl font-black leading-tight text-white drop-shadow-md mb-1.5">
                {slideCourante.titre}
              </h2>
              <p className="text-sm text-white/90 leading-relaxed font-medium drop-shadow">
                {slideCourante.phrase}
              </p>
            </div>

            {/* Bouton d'action */}
            <button
              type="button"
              onClick={handleSuivant}
              className="w-full h-12 rounded-xl bg-white text-[#0B2545] font-extrabold text-sm flex items-center justify-center gap-2 shadow-2xl hover:bg-slate-50 transition active:scale-98 cursor-pointer mt-1"
            >
              <span>{estDerniereSlide ? 'Se connecter' : 'Suivant'}</span>
              <ArrowRight size={16} className="text-[#087E8B]" />
            </button>
          </footer>
        </section>
      )}

      {/* 
        ========================================================================
        2. VUE DESKTOP (56% Gauche fixe avec photo immersive)
        ========================================================================
      */}
      <aside className="hidden lg:flex relative lg:w-[56%] h-screen sticky top-0 flex-col justify-between p-12 xl:p-14 overflow-hidden text-white flex-shrink-0">
        <img
          src={isAuthority ? '/images/login-autorite-thiaroye.jpg' : '/images/login-citoyen-thiaroye.jpg'}
          alt="MBEUND MI - Thiaroye-sur-Mer"
          className="absolute inset-0 w-full h-full object-cover object-center z-0"
        />

        <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-slate-950/40 pointer-events-none" />

        {/* Logo officiel Desktop */}
        <div className="relative z-20 flex flex-col items-start">
          <div className="bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-lg border border-white/50 inline-flex items-center">
            <img
              src={logoLight}
              alt="MBEUND MI"
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-3.5 h-px bg-white/70" />
            <span className="text-[11px] font-bold tracking-widest uppercase text-white/95 drop-shadow">
              Bul Xaar, Waajal Ko.
            </span>
            <span className="w-3.5 h-px bg-white/70" />
          </div>
        </div>

        {/* Contenu textuel Desktop */}
        <div className="relative z-20 max-w-xl my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-bold uppercase tracking-wider text-white shadow-xs mb-4">
            <span className="w-2 h-2 rounded-full bg-[#087E8B] animate-pulse" />
            {desktopMeta.surtitre}
          </div>

          <h1 className="text-4xl xl:text-5xl font-black leading-tight text-white drop-shadow-md mb-3">
            {desktopMeta.titre}
          </h1>

          <p className="text-sm xl:text-base text-white/90 leading-relaxed font-medium drop-shadow mb-6 max-w-lg">
            {desktopMeta.texte}
          </p>
        </div>

        <div className="relative z-20 pt-3 border-t border-white/20 text-xs text-white/80 flex items-center justify-between w-full">
          <span>Plateforme Officielle · Commune de Thiaroye-sur-Mer</span>
          <span className="text-white/60 text-[11px]">Dakar, Sénégal</span>
        </div>
      </aside>

      {/* 
        ========================================================================
        3. ZONE FORMULAIRE (Sur desktop: 44% à droite / Sur mobile: 100% plein écran)
        ========================================================================
      */}
      <main
        className={`lg:w-[44%] w-full lg:h-screen overflow-y-auto flex flex-col justify-start items-center px-4 sm:px-8 lg:px-10 py-6 lg:py-10 bg-[#F8FAFC] ${
          !vueMobileFormulaire ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* En-tête mobile épuré lors de la saisie */}
        <div className="lg:hidden w-full max-w-[530px] flex items-center justify-between mb-4 pb-2 border-b border-slate-200/80">
          <button
            type="button"
            onClick={() => setVueMobileFormulaire(false)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0B2545] transition py-1 px-2 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft size={14} />
            <span>Présentation</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-bold text-[#0B2545]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#087E8B]" />
            <span>{isAuthority ? 'Portail Autorités' : 'Espace Citoyen'}</span>
          </div>
        </div>

        {/* Formulaire centré et propre */}
        <div className={`w-full max-w-[530px] ${className}`}>
          {children}
        </div>
      </main>
    </div>
  );
}

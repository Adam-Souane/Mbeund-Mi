import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import logoLight from '../assets/logo-light.png';

const ONBOARDING_STORAGE_KEY = 'mbeund_mi_onboarding_seen';

// 3 slides visuelles en format portrait 9:16 pour l'espace Citoyen
const SLIDES_CITOYEN = [
  {
    image: '/images/onboarding-slide1-averse.jpg',
    titre: 'Alertes Pluie & Inondation',
    phrase: 'Recevez un avertissement immédiat dès qu’une averse menace votre quartier à Thiaroye.',
  },
  {
    image: '/images/onboarding-slide2-littoral.jpg',
    titre: 'Cartographie de Thiaroye-sur-Mer',
    phrase: 'Identifiez les ruelles praticables, les zones inondées et les lieux sûrs autour de vous.',
  },
  {
    image: '/images/onboarding-slide3-secours.jpg',
    titre: 'Signalement & Veille Active',
    phrase: 'Transmettez vos observations de terrain directement aux équipes communales.',
  },
];

// 3 slides visuelles en format portrait 9:16 pour l'espace Autorités & Admin
const SLIDES_AUTORITE = [
  {
    image: '/images/onboarding-slide3-secours.jpg',
    titre: 'Supervision Hydrologique',
    phrase: 'Pilotez les capteurs, les ouvrages de drainage et les bassins en temps réel.',
  },
  {
    image: '/images/onboarding-slide2-littoral.jpg',
    titre: 'Cartographie & Zones Critiques',
    phrase: 'Visualisez l’évolution des eaux sur l’ensemble des quartiers de Thiaroye-sur-Mer.',
  },
  {
    image: '/images/onboarding-slide1-averse.jpg',
    titre: 'Alertes & Coordination 24/7',
    phrase: 'Déclenchez les consignes d’urgence et mobilisez les secours sur le terrain.',
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

function aDejaVuOnboarding() {
  try {
    return sessionStorage.getItem(ONBOARDING_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function marquerOnboardingVu() {
  try {
    sessionStorage.setItem(ONBOARDING_STORAGE_KEY, '1');
  } catch {}
}

export default function AuthLayout({ variante, className = '', children }) {
  const navigate = useNavigate();
  const isAuthority = variante === 'administration' || variante === 'autorite';
  const slides = isAuthority ? SLIDES_AUTORITE : SLIDES_CITOYEN;
  const desktopMeta = TITRES_DESKTOP[variante] ?? TITRES_DESKTOP.connexion;

  // L'onboarding mobile s'affiche par défaut sur la page de connexion citoyenne (/login).
  // Si on est sur une autre variante (inscription, mot de passe, autorité), on affiche directement le formulaire.
  const afficherFormulaireDirect = variante !== 'connexion';

  const [vueMobileFormulaire, setVueMobileFormulaire] = useState(afficherFormulaireDirect);
  const [slideIndex, setSlideIndex] = useState(0);

  const slideCourante = slides[slideIndex] || slides[0];
  const estDerniereSlide = slideIndex === slides.length - 1;

  const ouvrirFormulaireMobile = () => {
    marquerOnboardingVu();
    setVueMobileFormulaire(true);
  };

  const passerVersModeAnonyme = () => {
    marquerOnboardingVu();
    navigate('/citoyen/accueil');
  };

  const handleSuivant = () => {
    if (estDerniereSlide) {
      ouvrirFormulaireMobile();
    } else {
      setSlideIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-[100dvh] lg:h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC] text-slate-800 lg:overflow-hidden">
      {/* 
        ========================================================================
        1. VUE MOBILE ONBOARDING (Verrouillée plein écran, zéro scroll, sans logo)
        ========================================================================
      */}
      {!vueMobileFormulaire && (
        <section className="lg:hidden fixed inset-0 z-50 w-full h-full flex flex-col justify-between overflow-hidden touch-none text-white select-none bg-slate-950">
          {/* Photographie plein écran 9:16 */}
          <img
            key={slideCourante.image}
            src={slideCourante.image}
            alt={slideCourante.titre}
            className="absolute inset-0 w-full h-full object-cover object-center z-0 transition-opacity duration-500"
          />

          {/* Voile dégradé progressif pour une lisibilité parfaite du texte en bas */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/35 to-slate-950/20 pointer-events-none" />

          {/* Haut : bouton Passer vers l'accès anonyme ou formulaire */}
          <header className="relative z-20 flex items-center justify-end p-5 pt-6">
            <button
              type="button"
              onClick={isAuthority ? ouvrirFormulaireMobile : passerVersModeAnonyme}
              className="text-xs font-bold text-white/90 hover:text-white px-3.5 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-white/20 active:scale-95 transition cursor-pointer"
            >
              Passer
            </button>
          </header>

          {/* Bas : Indicateurs, texte court structuré et boutons d'action */}
          <footer className="relative z-20 p-6 pb-8 flex flex-col gap-4">
            {/* Pagination 3 traits */}
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

            <div>
              <h2 className="text-2xl font-black leading-tight text-white drop-shadow-sm mb-1.5">
                {slideCourante.titre}
              </h2>
              <p className="text-sm text-white/90 leading-relaxed font-medium drop-shadow-xs">
                {slideCourante.phrase}
              </p>
            </div>

            {/* Actions : Si dernière slide Citoyen -> Deux choix (Sans compte & Se connecter) */}
            {estDerniereSlide && !isAuthority ? (
              <div className="flex items-center gap-2.5 w-full mt-1">
                {/* Bouton secondaire à gauche : Accès d'urgence sans compte */}
                <button
                  type="button"
                  onClick={passerVersModeAnonyme}
                  className="flex-1 h-12 rounded-xl bg-[#CC131A] hover:bg-red-700 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer"
                  title="Naviguer en Mode Anonyme sans créer de compte"
                >
                  <ShieldAlert size={16} className="text-white shrink-0" />
                  <span>Sans compte</span>
                </button>

                {/* Bouton primaire à droite : Se connecter avec un compte */}
                <button
                  type="button"
                  onClick={ouvrirFormulaireMobile}
                  className="flex-1 h-12 rounded-xl bg-[#0B2545] hover:bg-[#154275] border-2 border-white/90 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-lg transition cursor-pointer"
                >
                  Se connecter
                </button>
              </div>
            ) : (
              /* Bouton standard pour les slides 1 & 2 ou l'espace Autorité */
              <button
                type="button"
                onClick={handleSuivant}
                className="w-full h-12 rounded-xl bg-white text-[#0B2545] hover:bg-slate-100 active:scale-95 font-black text-sm flex items-center justify-center shadow-2xl transition cursor-pointer mt-1"
              >
                {estDerniereSlide ? 'Se connecter' : 'Suivant'}
              </button>
            )}
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
          src={isAuthority ? '/images/onboarding-slide3-secours.jpg' : '/images/onboarding-slide2-littoral.jpg'}
          alt="MBEUND MI - Thiaroye-sur-Mer"
          className="absolute inset-0 w-full h-full object-cover object-center z-0"
        />

        <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-slate-950/35 pointer-events-none" />

        {/* Logo officiel Desktop avec slogan officiel au milieu et traits latéraux */}
        <div className="relative z-20 flex flex-col items-start">
          <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-white/60 flex flex-col items-center justify-center text-center">
            <img
              src={logoLight}
              alt="MBEUND MI"
              className="h-11 w-auto object-contain"
            />
            <div className="flex items-center justify-center gap-2 mt-2.5">
              <span className="w-4 h-px bg-slate-300" />
              <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase text-[#0B2545]">
                Bul Xaar, Waajal Ko.
              </span>
              <span className="w-4 h-px bg-slate-300" />
            </div>
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
        3. ZONE FORMULAIRE (Centrée verticalement sur mobile, sans barre en haut)
        ========================================================================
      */}
      <main
        className={`lg:w-[44%] w-full min-h-[100dvh] lg:h-screen overflow-y-auto flex flex-col justify-center items-center px-4 sm:px-8 lg:px-10 py-6 lg:py-10 bg-[#F8FAFC] ${
          !vueMobileFormulaire ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <div className={`w-full max-w-[530px] my-auto ${className}`}>
          {/* Sur mobile : bouton permettant de revenir à tout moment au carrousel des 3 slides */}
          {!isAuthority && (
            <div className="lg:hidden mb-3 text-left">
              <button
                type="button"
                onClick={() => setVueMobileFormulaire(false)}
                className="text-xs font-bold text-slate-600 hover:text-[#0B2545] inline-flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-xl bg-slate-200/70 active:scale-95 transition"
              >
                <span>← Revoir la présentation (onboarding)</span>
              </button>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

import { useState } from 'react';
import { Check, ArrowRight, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import logoLight from '../assets/logo-light.png';

// Mise en page des pages d'authentification :
// - Sur Desktop (lg:) : double colonne (56% photo + atouts / 44% formulaire centré).
// - Sur Mobile (< lg) : séparation fluide entre la présentation de marque et le formulaire épuré sans scroll encombrant.

const CONTENUS = {
  connexion: {
    surtitre: 'Espace Citoyen · Thiaroye-sur-Mer',
    titre: 'Content de vous revoir !',
    texte: 'Connectez-vous pour suivre le risque d’inondation dans votre quartier et recevoir les alertes.',
    ctaMobile: 'Continuer vers la connexion',
  },
  inscription: {
    surtitre: 'Rejoindre MBEUND MI',
    titre: 'Veillons ensemble sur le quartier.',
    texte: 'Créez votre compte citoyen : vous serez prévenu dès que l’eau menace votre zone.',
    ctaMobile: 'Créer mon compte citoyen',
  },
  verification: {
    surtitre: 'Sécurité du compte',
    titre: 'Confirmez que c’est bien vous.',
    texte: 'Ce code protège votre compte et garantit que les alertes arrivent au bon numéro.',
    ctaMobile: 'Saisir le code de validation',
  },
  motdepasse: {
    surtitre: 'Accès au compte',
    titre: 'Retrouvez votre accès.',
    texte: 'Un code à 6 chiffres suffit pour choisir un nouveau mot de passe, en toute sécurité.',
    ctaMobile: 'Réinitialiser mon mot de passe',
  },
  administration: {
    surtitre: 'Espace Administration',
    titre: 'Pilotez la prévention.',
    texte: 'Créez le compte administrateur qui gérera les autorités, les capteurs et les alertes de la commune.',
    ctaMobile: 'Créer le compte administrateur',
  },
  autorite: {
    surtitre: 'Portail Officiel · Thiaroye-sur-Mer',
    titre: 'Supervision & Coordination',
    texte: 'Accédez au centre de commandement pour piloter les alertes, mobiliser les secours et superviser les capteurs.',
    ctaMobile: 'Accéder à la supervision officielle',
  },
};

const ATOUTS_CITOYEN = [
  'Alertes par SMS et WhatsApp en temps réel',
  'Carte des risques et prévisions météo locales',
  'Signalements rapides vérifiés par les secours',
];

const ATOUTS_AUTORITE = [
  'Supervision hydrologique et capteurs connectés',
  'Validation et affectation rapide des signalements',
  'Déclenchement instantané des alertes communales',
];

export default function AuthLayout({ variante, className = '', children }) {
  const { surtitre, titre, texte, ctaMobile } = CONTENUS[variante] ?? CONTENUS.connexion;
  const isAuthority = variante === 'administration' || variante === 'autorite';
  const atouts = isAuthority ? ATOUTS_AUTORITE : ATOUTS_CITOYEN;
  const bgImage = isAuthority
    ? '/images/login-autorite-thiaroye.jpg'
    : '/images/login-citoyen-thiaroye.jpg';
  const bgAlt = isAuthority
    ? 'Autorités et secours en intervention face aux inondations à Thiaroye-sur-Mer'
    : 'Citoyens engagés dans la prévention des inondations à Thiaroye-sur-Mer';

  // Sur mobile, les étapes de vérification ou mot de passe vont directement au formulaire
  const demarrageDirectFormulaire = variante === 'verification' || variante === 'motdepasse';
  const [vueMobileFormulaire, setVueMobileFormulaire] = useState(demarrageDirectFormulaire);

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC] text-slate-800 lg:overflow-hidden">
      {/* 
        ZONE GAUCHE (Desktop : 56% fixe / Mobile : visible uniquement en mode présentation)
      */}
      <aside
        className={`relative lg:w-[56%] w-full min-h-[380px] lg:h-screen lg:sticky lg:top-0 flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden text-white flex-shrink-0 ${
          vueMobileFormulaire ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Photographie authentique de terrain à Thiaroye-sur-Mer */}
        <img
          src={bgImage}
          alt={bgAlt}
          className="absolute inset-0 w-full h-full object-cover object-center z-0"
        />

        {/* Voile sombre contrôlé avec dégradé subtil */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(11, 28, 48, 0.85) 0%, rgba(11, 40, 68, 0.70) 50%, rgba(8, 25, 45, 0.55) 100%)',
          }}
        />

        {/* En-tête : Logo et slogan */}
        <div className="relative z-20 flex items-center justify-between w-full">
          <div className="flex flex-col items-start">
            <div className="bg-white/95 backdrop-blur-md px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl shadow-lg border border-white/50 inline-flex items-center justify-center">
              <img
                src={logoLight}
                alt="MBEUND MI"
                className="h-8 sm:h-10 w-auto object-contain"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-3.5 h-px bg-white/70" />
              <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-white/95 drop-shadow">
                Bul Xaar, Waajal Ko.
              </span>
              <span className="w-3.5 h-px bg-white/70" />
            </div>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/20">
            <Sparkles size={12} className="text-[#087E8B]" />
            <span>Cœur IA Prédictif</span>
          </div>
        </div>

        {/* Corps textuel : Titre, sous-titre et points forts */}
        <div className="relative z-20 flex flex-col w-full max-w-xl my-6 sm:my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 w-fit text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white shadow-xs mb-3 sm:mb-4">
            <span className="w-2 h-2 rounded-full bg-[#087E8B] animate-pulse" />
            {surtitre}
          </div>

          <h1 className="text-2xl sm:text-4xl xl:text-5xl font-black leading-tight tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] mb-2.5 sm:mb-3">
            {titre}
          </h1>

          <p className="text-xs sm:text-sm lg:text-base text-white/90 leading-relaxed font-medium drop-shadow mb-4 sm:mb-6 max-w-lg">
            {texte}
          </p>

          <ul className="flex flex-col gap-2.5 sm:gap-3">
            {atouts.map((atout) => (
              <li
                key={atout}
                className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm lg:text-base font-semibold text-white drop-shadow"
              >
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#087E8B] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Check size={13} strokeWidth={3} aria-hidden="true" />
                </span>
                <span>{atout}</span>
              </li>
            ))}
          </ul>

          {/* Bouton d'action MOBILE pour passer directement au formulaire sans encombrement */}
          <div className="lg:hidden mt-6 pt-2">
            <button
              type="button"
              onClick={() => setVueMobileFormulaire(true)}
              className="w-full h-12 rounded-xl bg-white text-[#0B2545] font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl hover:bg-slate-50 transition active:scale-98 cursor-pointer"
            >
              <span>{ctaMobile}</span>
              <ArrowRight size={16} className="text-[#087E8B]" />
            </button>
          </div>
        </div>

        {/* Pied de page institutionnel */}
        <div className="relative z-20 pt-3 border-t border-white/20 text-[11px] sm:text-xs text-white/80 flex items-center justify-between w-full">
          <span className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-[#087E8B]" /> Commune de Thiaroye-sur-Mer
          </span>
          <span className="text-white/60 text-[10px] sm:text-[11px]">Dakar, Sénégal</span>
        </div>
      </aside>

      {/* 
        ZONE DROITE (Formulaire : visible sur desktop + sur mobile quand vueMobileFormulaire est actif)
      */}
      <main
        className={`lg:w-[44%] w-full lg:h-screen overflow-y-auto flex flex-col justify-start items-center px-4 sm:px-8 lg:px-10 py-6 lg:py-10 bg-[#F8FAFC] ${
          !vueMobileFormulaire ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* En-tête mobile épuré avec retour vers la présentation si besoin */}
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

        <div className={`w-full max-w-[530px] ${className}`}>
          {children}
        </div>
      </main>
    </div>
  );
}

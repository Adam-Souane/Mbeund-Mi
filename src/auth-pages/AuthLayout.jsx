import { Check } from 'lucide-react';
import logoSurFondBleu from '../assets/logo-dark.png';

// Mise en page commune des pages d'authentification : bannière de marque bleu
// marine à gauche (écrans larges uniquement), contenu de la page à droite sur
// fond blanc. Ces pages restent toujours en mode clair (voir ThemeContext).

const CONTENUS = {
  connexion: {
    surtitre: 'Espace sécurisé · Thiaroye-sur-Mer',
    titre: 'Content de vous revoir !',
    texte: 'Connectez-vous pour suivre le risque d’inondation dans votre quartier et recevoir les alertes.',
  },
  inscription: {
    surtitre: 'Rejoindre MBEUND MI',
    titre: 'Veillons ensemble sur le quartier.',
    texte: 'Créez votre compte citoyen : vous serez prévenu dès que l’eau menace votre zone.',
  },
  verification: {
    surtitre: 'Dernière étape',
    titre: 'Confirmez que c’est bien vous.',
    texte: 'Ce code protège votre compte et garantit que les alertes arrivent au bon numéro.',
  },
  motdepasse: {
    surtitre: 'Accès au compte',
    titre: 'Retrouvez votre accès.',
    texte: 'Un code à 6 chiffres suffit pour choisir un nouveau mot de passe, en toute sécurité.',
  },
  administration: {
    surtitre: 'Espace administration',
    titre: 'Pilotez la prévention.',
    texte: 'Créez le compte administrateur qui gérera les autorités, les capteurs et les alertes de la commune.',
  },
  autorite: {
    surtitre: 'Portail Officiel · Thiaroye-sur-Mer',
    titre: 'Supervision & Coordination',
    texte: 'Accédez au centre de commandement pour piloter les alertes, mobiliser les secours et superviser les capteurs.',
  },
};

const ATOUTS_CITOYEN = [
  'Alertes par SMS, même sans smartphone',
  'Carte des risques et prévisions en temps réel',
  'Signalements des habitants vérifiés par les autorités',
];

const ATOUTS_AUTORITE = [
  'Supervision hydrologique et capteurs connectés',
  'Validation et affectation rapide des signalements',
  'Déclenchement instantané des alertes communales',
];

function Vagues() {
  return (
    <svg
      viewBox="0 0 1440 220"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="absolute bottom-0 left-0 w-full h-36 text-navy-950/40 pointer-events-none"
    >
      <path fill="currentColor" d="M0 120 C 240 60 480 180 720 120 S 1200 60 1440 120 V220 H0 Z" opacity="0.35" />
      <path fill="currentColor" d="M0 160 C 260 110 520 210 780 160 S 1240 110 1440 160 V220 H0 Z" opacity="0.6" />
    </svg>
  );
}

/**
 * @param {'connexion'|'inscription'|'verification'|'motdepasse'|'administration'|'autorite'} variante
 * @param {string} className classes du conteneur du formulaire
 */
export default function AuthLayout({ variante, className = '', children }) {
  const { surtitre, titre, texte } = CONTENUS[variante] ?? CONTENUS.connexion;
  const isAuthority = variante === 'administration' || variante === 'autorite';
  const atouts = isAuthority ? ATOUTS_AUTORITE : ATOUTS_CITOYEN;
  const bgImage = '/images/prevention-pluie.jpg';

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden">
      {/* 1. PHOTO DE TERRAIN PLEIN ÉCRAN CONTINUE SUR TOUT L'ÉCRAN (100vw × 100vh) */}
      <img
        src={bgImage}
        alt="Prévention des inondations à Thiaroye-sur-Mer"
        className="fixed inset-0 w-full h-full object-cover object-center z-0 pointer-events-none"
      />

      {/* 2. DÉGRADÉ BLEU LÉGER & TRÈS TRANSLUCIDE (Laisse la photo de terrain parfaitement nette et visible) */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: isAuthority
            ? 'linear-gradient(135deg, rgba(10, 18, 30, 0.42) 0%, rgba(18, 30, 48, 0.22) 50%, rgba(10, 18, 30, 0.38) 100%)'
            : 'linear-gradient(135deg, rgba(10, 18, 30, 0.38) 0%, rgba(18, 30, 48, 0.18) 50%, rgba(10, 18, 30, 0.32) 100%)',
        }}
      />


      {/* 3. CONTENU GLOBAL UNIFIÉ POSÉ SUR L'IMAGE DE FOND */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-10">
        
        {/* En-tête mobile uniquement (Logo visible si colonne gauche cachée) */}
        <div className="lg:hidden flex items-center justify-center mb-6">
          <img src={logoSurFondBleu} alt="MBEUND MI" className="h-10 w-auto object-contain drop-shadow-md" />
        </div>

        {/* Grille principale harmonieuse : Présentation à gauche + Carte à droite */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center flex-1 my-auto">
          
          {/* Colonne gauche (Présentation et identité) */}
          <div className="hidden lg:flex lg:col-span-7 flex-col justify-center text-white py-6">
            
            {/* Logo officiel MBEUND MI avec devise */}
            <div className="w-fit flex flex-col items-start gap-2 mb-8">
              <img src={logoSurFondBleu} alt="MBEUND MI" className="h-11 w-auto object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" />
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-px bg-white/60" />
                <span className="text-xs font-bold tracking-widest uppercase text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                  Bul Xaar, Waajal Ko.
                </span>
                <span className="w-6 h-px bg-white/60" />
              </div>
            </div>

            {/* Badge de contexte */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/25 w-fit mb-4 text-xs font-bold uppercase tracking-wider text-red-200 shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-red animate-pulse" />
              {surtitre}
            </div>

            {/* Titre percutant avec ombre de texte nette pour une lisibilité totale */}
            <h1 className="text-4xl xl:text-5xl font-black leading-[1.12] tracking-tight text-white mb-4 drop-shadow-[0_3px_12px_rgba(0,0,0,0.85)]">
              {titre}
            </h1>

            {/* Sous-titre explicatif */}
            <p className="text-base xl:text-lg text-white/95 mb-8 max-w-lg leading-relaxed drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] font-medium">
              {texte}
            </p>

            {/* Liste des atouts et fonctionnalités clés */}
            <ul className="flex flex-col gap-4">
              {atouts.map((atout) => (
                <li key={atout} className="flex items-center gap-3.5 text-sm xl:text-base font-bold text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)]">
                  <span className="w-7 h-7 rounded-full bg-emerald-500/30 backdrop-blur-md ring-1 ring-emerald-300/60 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Check size={16} strokeWidth={3} className="text-emerald-300" aria-hidden="true" />
                  </span>
                  <span>{atout}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne droite : Carte blanche du formulaire posée en suspension au-dessus de l'image */}
          <div className="col-span-1 lg:col-span-5 flex justify-center w-full">
            <div className={`w-full max-w-lg mx-auto ${className}`}>
              {children}
            </div>
          </div>
        </div>

        {/* Pied de page discret et unifié */}
        <footer className="flex flex-wrap items-center justify-between text-xs text-white/85 pt-6 mt-6 border-t border-white/20 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          <span>Plateforme de prévention des inondations · Commune de Thiaroye-sur-Mer</span>
          <span className="text-[11px] text-white/70">Dakar, Sénégal</span>
        </footer>
      </div>
    </div>
  );
}

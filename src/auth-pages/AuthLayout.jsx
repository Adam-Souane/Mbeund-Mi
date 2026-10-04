import { Check } from 'lucide-react';
import logoClair from '../assets/logo-light.png';
import logoSombre from '../assets/logo-dark.png';
import { useTheme } from '../theme/ThemeContext';

// Mise en page commune des pages d'authentification : bannière de marque à
// gauche (écrans larges uniquement), contenu de la page à droite, inchangé.
// La bannière contraste avec le thème : bleu marine en mode clair, blanche
// en mode sombre.

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
};

const ATOUTS = [
  'Alertes par WhatsApp et SMS, même sans smartphone',
  'Carte des risques et prévisions en temps réel',
  'Signalements des habitants vérifiés par les autorités',
];

function Vagues() {
  return (
    <svg
      viewBox="0 0 1440 220"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="absolute bottom-0 left-0 w-full h-44 text-navy-800/70 dark:text-navy-50"
    >
      <path fill="currentColor" d="M0 120 C 240 60 480 180 720 120 S 1200 60 1440 120 V220 H0 Z" opacity="0.55" />
      <path fill="currentColor" d="M0 160 C 260 110 520 210 780 160 S 1240 110 1440 160 V220 H0 Z" />
    </svg>
  );
}

function Banniere({ variante }) {
  const { darkMode } = useTheme();
  const { surtitre, titre, texte } = CONTENUS[variante] ?? CONTENUS.connexion;
  return (
    <aside className="relative hidden lg:flex flex-col overflow-hidden px-14 xl:px-20 py-12 bg-gradient-to-br from-navy via-navy-800 to-navy-950 dark:from-white dark:via-navy-50 dark:to-white">
      {/* Formes décoratives : eau en haut, vigilance (rouge) en bas */}
      <div aria-hidden="true" className="absolute -top-32 -right-32 w-[26rem] h-[26rem] rounded-full bg-navy-600/30 dark:bg-navy-200/60" />
      <div aria-hidden="true" className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-red/25 dark:bg-red-50" />
      <Vagues />

      {/* Logo en version inversée : lettres claires sur le bleu, foncées sur le blanc */}
      <div className="relative w-fit flex flex-col items-start gap-2">
        <img src={darkMode ? logoClair : logoSombre} alt="MBEUND MI" className="h-10 w-auto object-contain" />
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-px bg-navy-50 dark:bg-navy" />
          <span className="text-xs font-semibold tracking-widest uppercase text-navy-50 dark:text-navy">Bul Xaar, Waajal Ko.</span>
          <span className="w-5 h-px bg-navy-50 dark:bg-navy" />
        </div>
      </div>

      <div className="relative flex-1 flex flex-col justify-center max-w-xl py-10">
        <p className="text-xs xl:text-sm font-bold tracking-[0.2em] uppercase text-red-300 dark:text-red mb-5">{surtitre}</p>
        <h2 className="text-5xl xl:text-6xl font-extrabold leading-[1.05] tracking-tight text-white dark:text-navy mb-6">
          {titre}
        </h2>
        <p className="text-base xl:text-lg text-navy-200 dark:text-navy-600 mb-9 max-w-md">{texte}</p>
        <ul className="flex flex-col gap-3.5">
          {ATOUTS.map((atout) => (
            <li key={atout} className="flex items-center gap-3 text-sm xl:text-base font-semibold text-white dark:text-navy">
              <span className="w-7 h-7 rounded-full bg-white/10 dark:bg-white ring-1 ring-white/20 dark:ring-navy-200 flex items-center justify-center flex-shrink-0">
                <Check size={15} strokeWidth={3} className="text-risk-vert" aria-hidden="true" />
              </span>
              {atout}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-navy-200 dark:text-navy-600">
        Plateforme de prévention des inondations · Commune de Thiaroye-sur-Mer
      </p>
    </aside>
  );
}

/**
 * @param {'connexion'|'inscription'|'verification'|'motdepasse'|'administration'} variante
 * @param {string} className classes du panneau droit (fond, alignement, espacements)
 */
export default function AuthLayout({ variante, className = '', children }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2 bg-navy-50 dark:bg-navy-950">
      <Banniere variante={variante} />
      <main className={`relative min-h-screen flex flex-col items-center justify-center ${className}`}>{children}</main>
    </div>
  );
}

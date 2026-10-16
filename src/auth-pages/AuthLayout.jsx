import { Check } from 'lucide-react';
import logoSurFondBleu from '../assets/logo-dark.png';
import logoLight from '../assets/logo-light.png';

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
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC] text-slate-800 lg:overflow-hidden">
      {/* Colonne gauche (56% sur grand écran) : Grande zone photographique FIXE */}
      <aside className="relative lg:w-[56%] w-full min-h-[360px] lg:h-screen lg:sticky lg:top-0 flex flex-col justify-center p-6 sm:p-10 lg:p-14 overflow-hidden text-white flex-shrink-0">
        {/* Photographie authentique de terrain à Thiaroye-sur-Mer */}
        <img
          src={bgImage}
          alt="Prévention des inondations à Thiaroye-sur-Mer"
          className="absolute inset-0 w-full h-full object-cover object-center z-0"
        />

        {/* Voile sombre contrôlé (45-50% sur la gauche, s'allégeant vers la droite) */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(11, 28, 48, 0.78) 0%, rgba(11, 40, 68, 0.58) 50%, rgba(8, 25, 45, 0.42) 100%)',
          }}
        />

        {/* Contenu compact et harmonieux */}
        <div className="relative z-20 flex flex-col w-full max-w-xl my-auto">
          {/* Logo officiel BLEU aligné à gauche avec son slogan centré sous le logo */}
          <div className="w-fit flex flex-col items-center mb-6">
            <div className="bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-md border border-white/40 inline-flex items-center justify-center">
              <img
                src={logoLight}
                alt="MBEUND MI"
                className="h-9 sm:h-11 w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="w-4 h-px bg-white/60" />
              <span className="text-[11px] font-bold tracking-widest uppercase text-white/95 drop-shadow">
                Bul Xaar, Waajal Ko.
              </span>
              <span className="w-4 h-px bg-white/60" />
            </div>
          </div>

          {/* Reste des éléments : conservés alignés à gauche */}
          <div className="flex flex-col items-start gap-4">
            {/* Mention espace / contexte */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 w-fit text-xs font-bold uppercase tracking-wider text-white shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#087E8B] animate-pulse" />
              {surtitre}
            </div>

            {/* Titre sobre */}
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black leading-tight tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
              {titre}
            </h1>

            {/* Sous-titre */}
            <p className="text-sm sm:text-base text-white/90 leading-relaxed font-medium drop-shadow">
              {texte}
            </p>

            {/* 3 Atouts institutionnels ou citoyens */}
            <ul className="flex flex-col gap-3 pt-1">
              {atouts.map((atout) => (
                <li key={atout} className="flex items-center gap-3 text-sm sm:text-base font-semibold text-white drop-shadow">
                  <span className="w-6 h-6 rounded-full bg-[#087E8B]/80 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Check size={14} strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span>{atout}</span>
                </li>
              ))}
            </ul>

            {/* Bas de page gauche : mention locale */}
            <div className="pt-4 mt-2 border-t border-white/20 text-xs text-white/80 flex items-center justify-between w-full">
              <span>Plateforme Officielle · Commune de Thiaroye-sur-Mer</span>
              <span className="text-white/60 text-[11px]">Dakar, Sénégal</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Colonne droite (44% sur grand écran) : Espace du formulaire avec défilement INDÉPENDANT */}
      <main className="lg:w-[44%] w-full lg:h-screen overflow-y-auto flex flex-col justify-start items-center px-4 sm:px-8 lg:px-10 py-8 lg:py-10 bg-[#F8FAFC]">
        <div className={`w-full max-w-[530px] ${className}`}>
          {children}
        </div>
      </main>
    </div>
  );
}

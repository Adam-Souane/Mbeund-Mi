import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LogOut,
  ShieldCheck,
  Copy,
  Check,
  Pencil,
  Settings,
  ChevronRight,
  User,
  HeartHandshake,
} from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import AvatarSelectorModal, { RenderAvatar } from '../components/AvatarSelectorModal';
import { getUserCustomAvatar, setUserCustomAvatar } from '../../shared/utils/avatarResolver';
import { useAuth } from '../../auth/AuthContext';

const ROLE_LABELS = {
  citoyen: 'Citoyen',
  autorite: 'Autorité',
  admin: 'Administrateur',
};

export default function ProfilPageBody() {
  const { username, role, logout } = useAuth();
  const [copiedUsername, setCopiedUsername] = useState(false);

  // Avatar personnalisé (bibliothèque ou upload)
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState(() => getUserCustomAvatar(username));

  const handleSelectAvatar = (newAvatar) => {
    setUserCustomAvatar(username, newAvatar);
    setUserAvatar(newAvatar);
  };

  const copyUsername = () => {
    if (!username) return;
    navigator.clipboard.writeText(username);
    setCopiedUsername(true);
    setTimeout(() => setCopiedUsername(false), 2000);
  };

  const initial = username?.[0]?.toUpperCase() ?? '?';

  return (
    <CitizenShell>
      <div className="w-full flex flex-col gap-6 max-w-4xl mx-auto">
        {/* Bandeau d'en-tête Profil Citoyen */}
        <div className="flex items-center justify-between gap-3 p-5 rounded-2xl bg-gradient-to-r from-[#0B2545] via-[#103565] to-slate-900 text-white shadow-md border border-blue-900/40">
          <div>
            <div className="flex items-center gap-2">
              <User size={22} className="text-white" />
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Profil Citoyen
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Gérez votre identité, votre avatar et accédez à vos paramètres de foyer
            </p>
          </div>
        </div>

        {/* Grille des informations citoyennes */}
        <div className="w-full flex flex-col gap-5">
          {/* Carte d'identité et Avatar */}
          <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Cercle d'avatar personnalisé avec bouton crayon */}
              <div className="relative flex-shrink-0">
                <RenderAvatar avatar={userAvatar} initial={initial} size="w-20 h-20" textClass="text-3xl" />
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(true)}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#CC131A] hover:bg-[#b01016] text-white flex items-center justify-center shadow-md border-2 border-white dark:border-navy-900 transition hover:scale-110 active:scale-95 cursor-pointer"
                  title="Modifier l'avatar (bibliothèque ou photo)"
                  aria-label="Modifier l'avatar"
                >
                  <Pencil size={14} />
                </button>
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-navy-950 dark:text-white truncate">
                      {username ?? 'Utilisateur'}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-navy-100 dark:bg-navy-800 text-navy-800 dark:text-navy-200 mt-1.5">
                      <ShieldCheck size={14} className="text-[#CC131A]" />
                      <span>{ROLE_LABELS[role] ?? role}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAvatarModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-navy-900 dark:text-white transition cursor-pointer self-center sm:self-auto"
                  >
                    <Pencil size={13} />
                    <span>Changer d'avatar</span>
                  </button>
                </div>

                <div className="border-t border-navy-100 dark:border-navy-700 pt-4 mt-4">
                  <p className="text-xs font-semibold text-navy-600 dark:text-navy-400 mb-2">
                    Identifiant de connexion
                  </p>
                  <div className="flex items-center gap-2 bg-navy-50 dark:bg-navy-800/80 px-3.5 py-2.5 rounded-xl border border-navy-100 dark:border-navy-700">
                    <code className="text-sm font-mono font-bold text-navy-950 dark:text-white flex-1 truncate">
                      {username}
                    </code>
                    <button
                      type="button"
                      onClick={copyUsername}
                      className="text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white transition flex-shrink-0 cursor-pointer p-1"
                      title="Copier l'identifiant"
                    >
                      {copiedUsername ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Raccourci vers la nouvelle page Paramètres */}
          <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#CC131A] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Settings size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-navy-950 dark:text-white flex items-center gap-2">
                  <span>Paramètres & Sécurité du foyer</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                  Renseignez vos personnes vulnérables (mobilité réduite, seniors, nourrissons), votre kit de secours d’urgence et devenez relais de quartier dans la section Paramètres.
                </p>
              </div>
            </div>

            <Link
              to="/citoyen/parametres"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B2545] hover:bg-[#103565] text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer shrink-0 w-full sm:w-auto"
            >
              <span>Accéder aux Paramètres</span>
              <ChevronRight size={15} />
            </Link>
          </div>

          {/* Bouton Se déconnecter */}
          <div className="pt-2">
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-500 rounded-xl px-4 py-3 transition shadow-2xs cursor-pointer active:scale-98"
            >
              <LogOut size={16} />
              <span>Se déconnecter de la session</span>
            </button>
          </div>
        </div>
      </div>

      <AvatarSelectorModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        currentAvatar={userAvatar}
        onSelectAvatar={handleSelectAvatar}
        initial={initial}
      />
    </CitizenShell>
  );
}

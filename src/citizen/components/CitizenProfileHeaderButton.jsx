import { Link, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { getUserCustomAvatar } from '../../shared/utils/avatarResolver';
import { RenderAvatar } from './AvatarSelectorModal';

export default function CitizenProfileHeaderButton() {
  const { username } = useAuth();
  const location = useLocation();
  const isProfileActive = location.pathname === '/citoyen/profil';

  const avatar = getUserCustomAvatar(username);
  const initial = username?.[0]?.toUpperCase() ?? '?';

  return (
    <Link
      to="/citoyen/profil"
      title={`Mon profil citoyen (${username ?? 'Utilisateur'})`}
      aria-label="Mon profil citoyen"
      className={`group relative flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-full sm:rounded-xl transition-all duration-200 cursor-pointer ${
        isProfileActive
          ? 'bg-red-50 dark:bg-red-950/40 text-[#CC131A] dark:text-red-400 ring-2 ring-[#CC131A]/40 shadow-xs'
          : 'hover:bg-slate-100 dark:hover:bg-navy-800 text-navy-800 dark:text-slate-200'
      }`}
    >
      {/* Cercle Avatar miniature */}
      <div className="relative w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-slate-200 dark:ring-navy-700 group-hover:ring-[#CC131A] transition-all overflow-hidden">
        {avatar ? (
          <RenderAvatar avatar={avatar} initial={initial} size="w-8 h-8" textClass="text-xs" />
        ) : (
          <div className="w-full h-full bg-[#0B2545] text-white flex items-center justify-center font-bold text-xs">
            <User size={15} />
          </div>
        )}
      </div>

      {/* Nom d'utilisateur (visible sur écran moyen / large) */}
      <div className="hidden md:flex flex-col text-left leading-tight pr-1">
        <span className="text-xs font-black text-navy-950 dark:text-white truncate max-w-[110px]">
          {username ?? 'Citoyen'}
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
          Mon profil
        </span>
      </div>
    </Link>
  );
}

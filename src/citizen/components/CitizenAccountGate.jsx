import { Link } from 'react-router-dom';
import { ShieldCheck, User, CheckCircle2, ArrowLeft } from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';

/**
 * Composant d'invitation à la connexion pour les pages réservées aux comptes citoyens enregistrés
 * (ex: Profil complet, Paramètres de vulnérabilité du foyer, etc.).
 */
export default function CitizenAccountGate({
  titre = 'Connectez-vous pour accéder à cette page',
  description = 'Cette fonctionnalité nécessite un compte citoyen vérifié pour sauvegarder vos informations, synchroniser vos alertes SMS et inscrire votre foyer.',
}) {
  return (
    <CitizenShell>
      <div className="w-full max-w-xl mx-auto py-8 sm:py-14 px-4">
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xl text-center flex flex-col items-center gap-4 animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-[#CC131A] flex items-center justify-center">
            <ShieldCheck size={32} />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase bg-red-50 dark:bg-red-950/50 text-[#CC131A] dark:text-red-300 border border-red-200 dark:border-red-900/60">
              Compte Citoyen Requis
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-navy-950 dark:text-white mt-2">
              {titre}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              {description}
            </p>
          </div>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <Link
              to="/login"
              className="w-full py-3 px-4 rounded-xl bg-[#0B2545] hover:bg-[#154275] text-white text-xs sm:text-sm font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <User size={16} />
              <span>Se connecter</span>
            </Link>
            <Link
              to="/signup"
              className="w-full py-3 px-4 rounded-xl bg-[#CC131A] hover:bg-red-700 text-white text-xs sm:text-sm font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>Créer un compte</span>
            </Link>
          </div>

          <Link
            to="/citoyen/accueil"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy-900 dark:hover:text-white transition mt-2"
          >
            <ArrowLeft size={14} />
            <span>Retour à l’accueil citoyen</span>
          </Link>
        </div>
      </div>
    </CitizenShell>
  );
}


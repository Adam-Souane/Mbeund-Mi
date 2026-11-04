import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  LogOut,
  ShieldCheck,
  Copy,
  Check,
  Camera,
  Settings,
  ChevronRight,
  User,
  Phone,
  Mail,
  CheckCircle2,
  Calendar,
  Pencil,
  RotateCcw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import { RenderAvatar } from '../components/AvatarSelectorModal';
import { getUserCustomAvatar, setUserCustomAvatar, removeUserCustomAvatar } from '../../shared/utils/avatarResolver';
import { useAuth } from '../../auth/AuthContext';
import { useCurrentUser, useUpdateCurrentUser } from '../../shared/hooks/useCurrentUser';

const ROLE_LABELS = {
  citoyen: 'Citoyen',
  autorite: 'Autorité',
  admin: 'Administrateur',
};

export default function ProfilPageBody() {
  const { username, role, logout } = useAuth();
  const [copiedUsername, setCopiedUsername] = useState(false);
  const fileInputRef = useRef(null);

  // Avatar personnalisé depuis l'appareil
  const [userAvatar, setUserAvatar] = useState(() => getUserCustomAvatar(username));

  // Données complètes du compte utilisateur
  const { data: currentUser } = useCurrentUser();
  const updateCurrentUserMutation = useUpdateCurrentUser();

  // Mode édition des coordonnées personnelles
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    telephone: '',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Coordonnées effectives
  const firstName = currentUser?.first_name || '';
  const lastName = currentUser?.last_name || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || username || 'Citoyen';
  const email = currentUser?.email || '';
  const telephone = currentUser?.profile?.telephone || '';
  const isVerified = currentUser?.profile?.is_verified ?? true;
  const dateJoined = currentUser?.date_joined
    ? new Date(currentUser.date_joined).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  // Sélection d'une photo depuis l'appareil
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("L'image est trop volumineuse (maximum 5 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setUserCustomAvatar(username, dataUrl);
      setUserAvatar(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleResetAvatar = () => {
    removeUserCustomAvatar(username);
    setUserAvatar(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyUsername = () => {
    const idToCopy = username || currentUser?.username;
    if (!idToCopy) return;
    navigator.clipboard.writeText(idToCopy);
    setCopiedUsername(true);
    setTimeout(() => setCopiedUsername(false), 2000);
  };

  const handleStartEdit = () => {
    setEditForm({
      first_name: firstName,
      last_name: lastName,
      email: email,
      telephone: telephone,
    });
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaveError(null);
    try {
      await updateCurrentUserMutation.mutateAsync(editForm);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Erreur lors de la mise à jour des coordonnées.');
    }
  };

  const initial = (firstName?.[0] || username?.[0] || '?').toUpperCase();

  return (
    <CitizenShell>
      <div className="w-full flex flex-col gap-6 pb-8">
        {/* Input fichier caché pour choisir une photo depuis l'appareil */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelect}
          data-testid="avatar-file-input"
        />

        {/* En-tête de page moderne et aéré */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-navy-100 dark:border-navy-800/80 w-full">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-navy-50 dark:bg-navy-800 text-navy-800 dark:text-navy-100 flex items-center justify-center shrink-0 border border-navy-200 dark:border-navy-700">
                <User size={18} />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-navy-950 dark:text-white tracking-tight">
                Profil Citoyen
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-navy-50 dark:bg-navy-800 text-navy-700 dark:text-navy-200 border border-navy-200 dark:border-navy-700">
                <ShieldCheck size={13} className="text-[#C0182A]" />
                <span>{ROLE_LABELS[role] ?? role}</span>
              </span>
              {isVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 size={12} />
                  <span>Vérifié</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gérez votre identité, vos coordonnées d’alerte et vos paramètres de sécurité du foyer
            </p>
          </div>
        </div>

        {/* Feedback de succès */}
        {saveSuccess && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <span>Vos coordonnées ont été mises à jour avec succès.</span>
          </div>
        )}

        {/* 2. Ligne : Carte d'Identité Citoyenne pleine largeur */}
        <div className="w-full bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-2xl p-6 shadow-xs">
          {/* Entête de carte avec Avatar + Crayon direct */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-navy-100 dark:border-navy-700/80">
            <div className="relative w-20 h-20 flex-shrink-0 group">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full block cursor-pointer transition-transform hover:scale-102 focus:outline-none rounded-full"
                title="Choisir une photo depuis votre appareil"
                aria-label="Sélectionner une photo d’avatar"
              >
                <RenderAvatar avatar={userAvatar} initial={initial} size="w-20 h-20" textClass="text-2xl" />
              </button>
              {/* Bouton Caméra discret dans le coin inférieur droit */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#CC131A] hover:bg-[#b01016] text-white flex items-center justify-center shadow-md border-2 border-white dark:border-navy-900 transition hover:scale-110 active:scale-95 cursor-pointer z-10"
                title="Choisir une photo depuis votre appareil"
                aria-label="Modifier l'avatar"
              >
                <Camera size={13} />
              </button>
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-navy-950 dark:text-white truncate">
                  {fullName}
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                @{username || 'citoyen'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-navy-100 dark:bg-navy-800 text-navy-800 dark:text-navy-200">
                  <ShieldCheck size={14} className="text-[#CC131A]" />
                  <span>{ROLE_LABELS[role] ?? role}</span>
                </span>
                {dateJoined && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                    <Calendar size={12} />
                    <span>Inscrit en {dateJoined}</span>
                  </span>
                )}
              </div>

              {/* Option de réinitialisation si photo chargée */}
              {userAvatar && (
                <button
                  type="button"
                  onClick={handleResetAvatar}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-red-500 mt-2 transition cursor-pointer"
                  title="Revenir aux initiales par défaut"
                >
                  <RotateCcw size={11} />
                  <span>Rétablir les initiales</span>
                </button>
              )}
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="self-center sm:self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-navy-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 transition cursor-pointer"
              >
                <Pencil size={13} />
                <span>Modifier mes coordonnées</span>
              </button>
            )}
          </div>

          {/* Informations personnelles par ligne */}
          {!isEditing ? (
            <div className="pt-5 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Prénom */}
                <div className="p-3.5 rounded-xl bg-navy-50/60 dark:bg-navy-900/60 border border-navy-100/70 dark:border-navy-800">
                  <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                    Prénom
                  </span>
                  <span className="text-sm font-bold text-navy-950 dark:text-white">
                    {firstName || '—'}
                  </span>
                </div>

                {/* Nom */}
                <div className="p-3.5 rounded-xl bg-navy-50/60 dark:bg-navy-900/60 border border-navy-100/70 dark:border-navy-800">
                  <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                    Nom
                  </span>
                  <span className="text-sm font-bold text-navy-950 dark:text-white">
                    {lastName || '—'}
                  </span>
                </div>

                {/* Téléphone */}
                <div className="p-3.5 rounded-xl bg-navy-50/60 dark:bg-navy-900/60 border border-navy-100/70 dark:border-navy-800">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                    <Phone size={11} className="text-[#CC131A]" />
                    <span>Téléphone alertes SMS</span>
                  </span>
                  <span className="text-sm font-bold text-navy-950 dark:text-white">
                    {telephone || 'Non renseigné'}
                  </span>
                </div>

                {/* Email */}
                <div className="p-3.5 rounded-xl bg-navy-50/60 dark:bg-navy-900/60 border border-navy-100/70 dark:border-navy-800">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                    <Mail size={11} className="text-blue-500" />
                    <span>Email</span>
                  </span>
                  <span className="text-sm font-bold text-navy-950 dark:text-white truncate block">
                    {email || 'Non renseigné'}
                  </span>
                </div>
              </div>

              {/* Identifiant de connexion */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-navy-600 dark:text-navy-400 mb-1.5">
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
          ) : (
            /* Formulaire d'édition */
            <form onSubmit={handleSaveEdit} className="pt-5 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Modifier mes coordonnées
                </h3>
              </div>

              {saveError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <label className="block">
                  <span className="block text-xs font-semibold mb-1">Prénom</span>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-sm font-medium focus:ring-1 focus:ring-[#CC131A] focus:outline-none"
                    placeholder="Ex: Awa"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold mb-1">Nom</span>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-sm font-medium focus:ring-1 focus:ring-[#CC131A] focus:outline-none"
                    placeholder="Ex: Diop"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold mb-1">Téléphone</span>
                  <input
                    type="tel"
                    value={editForm.telephone}
                    onChange={(e) => setEditForm((f) => ({ ...f, telephone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-sm font-medium focus:ring-1 focus:ring-[#CC131A] focus:outline-none"
                    placeholder="+221 77 000 00 01"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold mb-1">Email</span>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-sm font-medium focus:ring-1 focus:ring-[#CC131A] focus:outline-none"
                    placeholder="citoyen@mbeund-mi.sn"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-navy-700 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateCurrentUserMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0B2545] hover:bg-[#103565] text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {updateCurrentUserMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                  <span>Enregistrer</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 3. Ligne : Carte Paramètres & Sécurité du foyer pleine largeur */}
        <div className="w-full bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#CC131A] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Settings size={22} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-navy-950 dark:text-white">
                Paramètres & Sécurité du foyer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
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

        {/* 4. Ligne : Bouton Se déconnecter pleine largeur */}
        <div className="w-full pt-1">
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
    </CitizenShell>
  );
}

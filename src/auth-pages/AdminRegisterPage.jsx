import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import AuthLayout from './AuthLayout';
import client from '../api/client';
import { useToast } from '../shared/toast/ToastContext';

export default function AdminRegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const codeParam = searchParams.get('code') || '';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    code: codeParam,
    first_name: '',
    last_name: '',
    email: '',
    telephone: '',
    password: '',
    password_confirm: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) newErrors.code = 'Le code d’invitation est obligatoire.';
    if (!formData.first_name.trim()) newErrors.first_name = 'Le prénom est requis.';
    if (!formData.last_name.trim()) newErrors.last_name = 'Le nom est requis.';
    if (!formData.email.trim()) {
      newErrors.email = 'L’adresse e-mail est requise.';
    } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
      newErrors.email = 'Format d’e-mail invalide.';
    }
    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le numéro de téléphone est requis.';
    }
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères.';
    }
    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Les deux mots de passe ne correspondent pas.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await client.post('/users/admin-register/', {
        code: formData.code.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone.trim(),
        password: formData.password,
      });

      const createdUsername = response.data?.user?.username || '';
      showToast(
        createdUsername
          ? `Compte créé ! Votre identifiant : ${createdUsername}`
          : 'Compte administrateur créé avec succès !',
        'success'
      );

      setTimeout(() => {
        navigate('/login-autorite');
      }, 2000);
    } catch (error) {
      const errorData = error.response?.data || {};
      if (typeof errorData === 'object' && !errorData.detail) {
        setErrors(errorData);
      } else {
        const message = errorData.detail || 'Erreur lors de la validation du code ou de l’inscription.';
        setErrors((prev) => ({ ...prev, code: message }));
        showToast(message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout variante="administration">
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl p-7 sm:p-9 transition-all">
        {/* En-tête du panneau */}
        <div className="mb-6 text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B3B60] tracking-tight">
            Créer un compte administrateur
          </h1>
          <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">
            Accès réservé aux personnes disposant d'un code d'invitation valide.
          </p>
        </div>

        {/* Message d'information neutre avant validation / ou alerte si erreur sur le code */}
        {errors.code ? (
          <div className="flex items-start gap-3 p-3.5 rounded-xl mb-6 bg-red-50 border border-[#BE123C]/30 text-xs text-[#BE123C]">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-[#BE123C]" />
            <div className="font-medium">{errors.code}</div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3.5 rounded-xl mb-6 bg-slate-50 border border-slate-200 text-xs text-[#64748B]">
            <ShieldCheck size={18} className="flex-shrink-0 mt-0.5 text-[#087E8B]" />
            <div>
              Ce compte donne accès aux fonctions de gestion communale, supervision des capteurs et diffusion d’alertes d’urgence.
            </div>
          </div>
        )}

        {/* Formulaire complet */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* 1. Code d'invitation */}
          <div>
            <label htmlFor="admin-code" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Code d’invitation <span className="text-[#BE123C]">*</span>
            </label>
            <input
              id="admin-code"
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Ex : ADM-THIAROYE-2026"
              readOnly={!!codeParam}
              className={`w-full h-12 px-3.5 rounded-xl border ${
                errors.code ? 'border-[#BE123C]' : 'border-slate-300'
              } bg-white text-slate-900 text-sm focus:outline-none focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60] transition-colors ${
                codeParam ? 'bg-slate-50 text-slate-600' : ''
              }`}
            />
          </div>

          {/* 2. Prénom et Nom sur une même ligne sur grand écran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="admin-firstname" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Prénom <span className="text-[#BE123C]">*</span>
              </label>
              <input
                id="admin-firstname"
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Moussa"
                className={`w-full h-12 px-3.5 rounded-xl border ${
                  errors.first_name ? 'border-[#BE123C]' : 'border-slate-300'
                } bg-white text-slate-900 text-sm focus:outline-none focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60] transition-colors`}
              />
              {errors.first_name && <p className="text-xs text-[#BE123C] mt-1">{errors.first_name}</p>}
            </div>

            <div>
              <label htmlFor="admin-lastname" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nom <span className="text-[#BE123C]">*</span>
              </label>
              <input
                id="admin-lastname"
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Diop"
                className={`w-full h-12 px-3.5 rounded-xl border ${
                  errors.last_name ? 'border-[#BE123C]' : 'border-slate-300'
                } bg-white text-slate-900 text-sm focus:outline-none focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60] transition-colors`}
              />
              {errors.last_name && <p className="text-xs text-[#BE123C] mt-1">{errors.last_name}</p>}
            </div>
          </div>

          {/* 3. Adresse e-mail */}
          <div>
            <label htmlFor="admin-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Adresse e-mail professionnelle <span className="text-[#BE123C]">*</span>
            </label>
            <input
              id="admin-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="moussa.diop@thiaroye.sn"
              className={`w-full h-12 px-3.5 rounded-xl border ${
                errors.email ? 'border-[#BE123C]' : 'border-slate-300'
              } bg-white text-slate-900 text-sm focus:outline-none focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60] transition-colors`}
            />
            {errors.email && <p className="text-xs text-[#BE123C] mt-1">{errors.email}</p>}
          </div>

          {/* 4. Téléphone */}
          <div>
            <label htmlFor="admin-tel" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Numéro de téléphone <span className="text-[#BE123C]">*</span>
            </label>
            <input
              id="admin-tel"
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              placeholder="77 123 45 67"
              className={`w-full h-12 px-3.5 rounded-xl border ${
                errors.telephone ? 'border-[#BE123C]' : 'border-slate-300'
              } bg-white text-slate-900 text-sm focus:outline-none focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60] transition-colors`}
            />
            {errors.telephone && <p className="text-xs text-[#BE123C] mt-1">{errors.telephone}</p>}
          </div>

          {/* 5. Mot de passe */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="admin-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Mot de passe <span className="text-[#BE123C]">*</span>
              </label>
              <span className="text-[11px] text-[#64748B]">8 caractères minimum</span>
            </div>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mot de passe sécurisé"
                className={`w-full h-12 px-3.5 pr-11 rounded-xl border ${
                  errors.password ? 'border-[#BE123C]' : 'border-slate-300'
                } bg-white text-slate-900 text-sm focus:outline-none focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60] transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-[#BE123C] mt-1">{errors.password}</p>}
          </div>

          {/* 6. Confirmation du mot de passe */}
          <div>
            <label htmlFor="admin-confirm" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Confirmer le mot de passe <span className="text-[#BE123C]">*</span>
            </label>
            <div className="relative">
              <input
                id="admin-confirm"
                type={showConfirm ? 'text' : 'password'}
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                placeholder="Répétez le mot de passe"
                className={`w-full h-12 px-3.5 pr-11 rounded-xl border ${
                  errors.password_confirm ? 'border-[#BE123C]' : 'border-slate-300'
                } bg-white text-slate-900 text-sm focus:outline-none focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60] transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password_confirm && <p className="text-xs text-[#BE123C] mt-1">{errors.password_confirm}</p>}
          </div>

          {/* Bouton principal large : bleu exact du logo (#0B2545) au repos et bleu clair au hover (#154275) */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#0B2545] hover:bg-[#154275] active:bg-[#07182D] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Création en cours...</span>
                </>
              ) : (
                'Créer mon compte administrateur'
              )}
            </button>
          </div>

          {/* Lien secondaire avec hiérarchie claire */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs">
            <span className="text-[#0B2545] font-medium">
              Déjà un compte ?{' '}
            </span>
            <Link
              to="/login-autorite"
              className="font-bold text-[#CC131A] hover:text-[#A01016] hover:underline transition"
            >
              Se connecter
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}

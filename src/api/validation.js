import { z } from 'zod';

export const authSchemas = {
  signup: z.object({
    first_name: z.string().min(1, 'Prénom requis').min(2, 'Min. 2 caractères'),
    last_name: z.string().min(1, 'Nom requis').min(2, 'Min. 2 caractères'),
    username: z.string().min(1, 'Identifiant requis').min(3, 'Min. 3 caractères'),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
    telephone: z.string().min(1, 'Téléphone requis').min(8, 'Téléphone invalide'),
    password: z.string().min(8, 'Min. 8 caractères'),
    password_confirm: z.string().min(8, 'Min. 8 caractères'),
    role: z.enum(['citoyen', 'autorite', 'admin']),
  }).refine(data => data.password === data.password_confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['password_confirm'],
  }),

  login: z.object({
    username: z.string().min(1, 'Identifiant requis'),
    password: z.string().min(1, 'Mot de passe requis'),
  }),

  otp: z.object({
    code: z.string().length(6, 'Le code OTP doit contenir 6 chiffres').regex(/^\d+$/, 'Le code OTP doit être numérique'),
  }),
};

export const profileSchemas = {
  updateProfile: z.object({
    first_name: z.string().min(1, 'Prénom requis'),
    last_name: z.string().min(1, 'Nom requis'),
    telephone: z.string().min(8, 'Téléphone invalide').optional(),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
  }),

  updatePassword: z.object({
    old_password: z.string().min(1, 'Ancien mot de passe requis'),
    new_password: z.string().min(8, 'Min. 8 caractères'),
    confirm_password: z.string().min(8, 'Min. 8 caractères'),
  }).refine(data => data.new_password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  }),
};

export const signalementSchemas = {
  create: z.object({
    description: z.string().min(10, 'Min. 10 caractères').max(1000, 'Max. 1000 caractères'),
    type_cible: z.enum(['inondation', 'route_fermee', 'refuge', 'autre']),
    zone: z.number().min(1, 'Zone requise'),
    photos: z.array(z.string()).optional(),
  }),
};

export const alerteSchemas = {
  create: z.object({
    titre: z.string().min(1, 'Titre requis').max(100, 'Max. 100 caractères'),
    message: z.string().min(10, 'Min. 10 caractères').max(500, 'Max. 500 caractères'),
    niveau: z.enum(['vert', 'jaune', 'orange', 'rouge']),
    zone: z.number().min(1, 'Zone requise').optional(),
  }),
};

export function validateForm(schema, data) {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { form: 'Erreur de validation' } };
  }
}

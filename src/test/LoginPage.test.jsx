import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const obtainToken = vi.fn();
vi.mock('../api/endpoints/auth', () => ({ obtainToken: (...args) => obtainToken(...args) }));

const { AuthProvider } = await import('../auth/AuthContext');
const { ThemeProvider } = await import('../theme/ThemeContext');
const { default: LoginPage } = await import('../auth-pages/LoginPage');

// Même forme qu'une erreur axios : une Error portant la réponse du serveur.
function refus(response) {
  return Object.assign(new Error('Request failed'), { response });
}

function PageOtp() {
  const { state } = useLocation();
  return <p>page OTP pour {state?.username} ({state?.canal})</p>;
}

function monter() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/otp-verify" element={<PageOtp />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

async function seConnecter(utilisateur) {
  await utilisateur.type(screen.getByPlaceholderText('jeandupont'), 'awadiop');
  await utilisateur.type(screen.getByPlaceholderText('........'), 'motdepasse123');
  await utilisateur.click(screen.getByRole('button', { name: 'Se connecter' }));
}

describe('LoginPage', () => {
  beforeEach(() => {
    obtainToken.mockReset();
  });

  it('envoie un compte non vérifié vers la saisie du code', async () => {
    obtainToken.mockImplementation(() =>
      Promise.reject(
        refus({
          status: 403,
          data: { code: 'compte_non_verifie', username: 'awadiop', otp: { canal: 'email', destination: 'a***@x.sn' } },
        })
      )
    );
    const utilisateur = userEvent.setup();
    monter();
    await seConnecter(utilisateur);
    expect(await screen.findByText('page OTP pour awadiop (email)')).toBeInTheDocument();
  });

  it('affiche une erreur si les identifiants sont faux', async () => {
    obtainToken.mockImplementation(() => Promise.reject(refus({ status: 401, data: { detail: 'No active account' } })));
    const utilisateur = userEvent.setup();
    monter();
    await seConnecter(utilisateur);
    expect(await screen.findByText('Identifiant ou mot de passe incorrect.')).toBeInTheDocument();
  });

  it('garde la même mise en page sur les deux onglets', async () => {
    const utilisateur = userEvent.setup();
    monter();
    expect(screen.getByText('Mot de passe oublié ?')).toBeInTheDocument();
    await utilisateur.click(screen.getByRole('button', { name: 'Autorité' }));
    expect(screen.getByText('Mot de passe perdu ? Contactez l’administrateur.')).toBeInTheDocument();
    expect(screen.getByText('Les comptes autorité sont créés par l’administrateur.')).toBeInTheDocument();
  });
});

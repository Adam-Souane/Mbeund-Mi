import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';

function AfficheTheme() {
  const { darkMode } = useTheme();
  return <p>{darkMode ? 'sombre' : 'clair'}</p>;
}

function monterSur(page) {
  localStorage.setItem('mbeund_theme', 'dark');
  return render(
    <MemoryRouter initialEntries={[page]}>
      <ThemeProvider>
        <AfficheTheme />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('thème selon la page', () => {
  it.each(['/', '/login', '/signup', '/otp-verify', '/forgot-password', '/admin-register'])(
    '%s reste en clair même si l’utilisateur a choisi le mode sombre',
    (page) => {
      monterSur(page);
      expect(screen.getByText('clair')).toBeInTheDocument();
      expect(document.documentElement).not.toHaveClass('dark');
      expect(localStorage.getItem('mbeund_theme')).toBe('dark'); // le choix est conservé
    }
  );

  it('applique le mode sombre choisi dans l’application', () => {
    monterSur('/citoyen/accueil');
    expect(screen.getByText('sombre')).toBeInTheDocument();
    expect(document.documentElement).toHaveClass('dark');
  });
});

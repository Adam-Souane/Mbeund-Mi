import sonarjs from 'eslint-plugin-sonarjs';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

// Analyse du frontend : règles recommandées de SonarJS (qualité), React,
// des hooks React et d'accessibilité (jsx-a11y). Lancer : npm run lint
export default [
  { ignores: ['dist/**', 'node_modules/**', 'env/**', 'backend/**', 'mbeund_mi_ia/**', 'rapport_pff/**'] },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    settings: { react: { version: '18.3' } },
    plugins: { sonarjs, react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...sonarjs.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react/prop-types': 'off',
      // Indicateurs de maintenabilité : signalés, sans bloquer la CI. Les
      // fonctions concernées sont reprises une à une (complexité, ternaires).
      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/no-nested-conditional': 'warn',
    },
  },
  {
    files: ['*.config.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node } },
  },
];

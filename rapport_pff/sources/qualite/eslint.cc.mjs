import sonarjs from 'eslint-plugin-sonarjs';
export default [{ files: ['**/*.{js,jsx}'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } },
  plugins: { sonarjs }, rules: { 'sonarjs/cognitive-complexity': ['error', 0] } }];

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'build',
      'coverage',
      'workers-site',
      'playwright-report',
      'test-results',
      'public/screenshots',
      'screenshots',
    ],
  },
  // Base config for all TS/TSX files
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      eslintComments.recommended,
      prettier,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // --- Ban eslint-disable without justification (IC rule, commit 676b571) ---
      '@eslint-community/eslint-comments/no-use': [
        'warn',
        { allow: ['eslint-disable-next-line', 'eslint-disable-line'] },
      ],
      '@eslint-community/eslint-comments/require-description': ['warn', { ignore: [] }],
      '@eslint-community/eslint-comments/no-unused-disable': 'error',

      // --- Re-enabled as warnings (drift catchers) ---
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',

      // --- React hooks strictness (IC R-012) ---
      'react-hooks/static-components': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',

      // --- Complexity cap (IC R-010) ---
      complexity: ['warn', { max: 15 }],

      // --- Console hygiene (prod build strips all but error; lint enforces it) ---
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  },
  // Page containers + top-level panels legitimately branch on mode / stage /
  // drag state; the 15-complexity cap targets leaf functions, not orchestration
  // shells. Bump to 25 for these files without relaxing it globally.
  {
    files: ['src/pages/**/*.{ts,tsx}', 'src/components/common/UnifiedAssignmentPanel.tsx'],
    rules: {
      complexity: ['warn', { max: 25 }],
    },
  },
  // Test files: loosen hook rules (Playwright fixtures trip rules-of-hooks)
  {
    files: [
      'tests/**/*.{ts,tsx}',
      '**/__tests__/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      'src/test/**/*.{ts,tsx}',
    ],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      complexity: 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
);

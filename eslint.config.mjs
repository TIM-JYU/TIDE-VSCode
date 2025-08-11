import { defineConfig, globalIgnores } from 'eslint/config'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import svelteEslintParser from 'svelte-eslint-parser'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

export default defineConfig([
  globalIgnores(['**/out', '**/dist', '**/*.d.ts']),
  {
    rules: {
      '@/semi': ['warn', 'never'],
      curly: 'warn',
      'no-unused-vars': [
        'warn',
        {
          vars: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      eqeqeq: 'warn',
      'no-throw-literal': 'warn',
      semi: ['warn', 'never'],
      quotes: ['warn', 'single'],
    },
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,json}'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 6,
      sourceType: 'module',
    },

    rules: {
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase'],
        },
      ],
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteEslintParser,
      parserOptions: {
        parser: tsParser,
      },
    },
  },
  eslintConfigPrettier,
])

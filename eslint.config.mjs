import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const js = require('./backend/node_modules/@eslint/js');
const globals = require('./backend/node_modules/globals');

const sharedRules = {
  ...js.configs.recommended.rules,
  'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  eqeqeq: ['error', 'always'],
  curly: ['error', 'all'],
  'no-var': 'error',
  'prefer-const': 'error',
  'no-shadow': 'warn',
  'no-param-reassign': 'warn',
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-return-assign': 'error',
  'max-depth': ['warn', 4],
  complexity: ['warn', 15]
};

export default [
  {
    ignores: ['backend/node_modules/**']
  },
  {
    files: ['backend/src/**/*.js', 'backend/tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    },
    rules: {
      ...sharedRules,
      'no-console': 'off'
    }
  },
  {
    files: ['frontend/assets/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser
      }
    },
    rules: {
      ...sharedRules,
      'no-alert': 'error'
    }
  }
];

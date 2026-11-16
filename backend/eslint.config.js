// Convenciones de estilo y complejidad ciclomática (RNF-11 y RNF-12).
module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly', module: 'writable', exports: 'writable', process: 'readonly',
        console: 'readonly', __dirname: 'readonly',
        describe: 'readonly', it: 'readonly', expect: 'readonly', beforeEach: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', ignoreRestSiblings: true }],
      'no-undef': 'error',
      eqeqeq: 'error',
      complexity: ['warn', 10],
      'prefer-const': 'warn',
    },
  },
];

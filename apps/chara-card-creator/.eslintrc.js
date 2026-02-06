module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@vue/typescript',
    'plugin:nuxt/recommended',
    '@vue/prettier',
    '@vue/prettier/@typescript-eslint',
    'prettier',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    project: './tsconfig.json',
    warnOnUnsupportedTypeScriptVersion: false,
  },
  // userが定義したtype定義に対して「no-undef」が出力される問題があったが、解決策がわからなかったので暫定対応。
  overrides: [
    {
      files: ['**/*.vue'],
      rules: {
        'no-undef': 'off',
      },
    },
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^ignore' },
    ],
    'no-unused-vars': ['error', { "argsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^ignore" }]
  },
}

// 

module.exports = {

  'env': {
    'browser': true,
    'node': true
  },

  'extends': [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended'
  ],

  'parser': '@typescript-eslint/parser',

  'parserOptions': {
    'ecmaFeatures': {
      'jsx': true
    },
    'ecmaVersion': 12,
    'sourceType': 'module',
    'project': './tsconfig.json'
  },

  'plugins': [
    'react',
    'react-hooks',
    '@typescript-eslint'
  ],

  'rules': {

    'linebreak-style': [
      'error',
      'unix'
    ],

    'jsx-quotes': [
      'error',
      'prefer-single'
    ],

    '@typescript-eslint/quotes': [
      'error',
      'single'
    ],
    '@typescript-eslint/semi': [
      'error',
      'never'
    ],

    'react-hooks/exhaustive-deps': ['warn', {
      'additionalHooks': 'useAsyncAction'
    }],

    '@typescript-eslint/indent': 'on',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/prefer-readonly': 'error',
  }
}